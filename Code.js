function doPost(request) {
    var parameters = JSON.parse(request['postData']['contents']);
    if (parameters['action']) {
        if (parameters['action'] === 'save') {
            return save(parameters['saveName'], parameters['data']);
        }
    }
    return ContentService.createTextOutput('KO').setMimeType(ContentService.MimeType.JSON)
}

function doGet(request) {
    if (request['parameter']['foundryExport']) {
        return random(request['parameter']['foundryExport']);
        //return ContentService.createTextOutput(JSON.stringify(request)).setMimeType(ContentService.MimeType.JSON);
    } else if (request['parameter']['action']) {
        if (request['parameter']['action'] === 'load') {
            return load(request['parameter']['saveName']);
        }
    } else if (request['parameter']['json']) {
        return ContentService.createTextOutput(JSON.stringify(getAllData(true))).setMimeType(ContentService.MimeType.JSON);
    } else if (request['parameter']['generateHelp']) {
        return ContentService.createTextOutput(generateHelp());
    }
    if (request['parameter']['display']) {
        var html = HtmlService.createTemplateFromFile('NewPage')
            .evaluate().getContent();
        if (request['parameter']['admin']) {
            html += include('Admin')
            html += "<script> $(document).ready(function () {" +
                "Helper.initPopin();" +
                "Helper.loader = new Helper.ajaxLoader(\"body\");" +
                "google.script.run.withSuccessHandler(CharacterGenerator().loadDataAndDisplay).getAdminData(); }); </script>";
        } else {
            html += generateHelp(!request['parameter']['generateSite']) + "<script> $(document).ready(function () { CharacterGenerator().init(); }); </script>";
        }
        var result = HtmlService
            .createTemplate(html)
            .evaluate()
            .addMetaTag('viewport', 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5.0');
        if (request['parameter']['generateSite']) {
            return ContentService.createTextOutput(result.getContent());
        } else {
            return result;
        }
    }
    return HtmlService.createHtmlOutput(
        "L'outil n'est plus ici, regardez plutot par la: <a target='_top' href='https://cgauche.github.io/Warhammer/index.html'>https://cgauche.github.io/Warhammer/index.html</a>"
    );
}

function initHelpData(data) {
    var labels = {};
    for (let [i, e] of Object.entries(data)) {
        for (var j in e) {
            var el = e[j];
            if (typeof el.label != 'undefined' && ((Array.isArray(el.desc) && el.desc.join('') !== '') || i === 'careers')
                && (typeof labels[i] == 'undefined' || typeof labels[i][el.label] == 'undefined')) {
                var key = i;
                if (i === 'lore' && el.spec) {
                    if (el.spec === 'equipment' && el.label === 'Taille') {
                        key = 'taille';
                    } else {
                        key = el.spec;
                    }
                }
                if (typeof labels[key] === 'undefined') {
                    labels[key] = {};
                }
                labels[key][el.label] = {type: i, index: j, extra: ''};
                if (typeof el.abr !== 'undefined' && el.abr !== '') {
                    labels[key][el.abr] = {type: i, index: j, extra: ''};
                }
            }
        }
    }
    return labels;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceHelpText(string) {
    /*if (string && string !== 1) {
        return string.replace(/{{SH\|([^|]*)\|([^|]*)\|([^|]*)}}/g, '<span class=\\"showHelp\\" data-type=\\"$1\\" data-index=\\"$2\\">$3</span>');
    }*/
    return string;
}

function showHelpText(type, index, text) {
    return '<span class="showHelp" data-type="' + type + '" data-index="' + index + '">' + text + '</span>';
//    return '{{SH|'+type+'|'+index+'|'+text+'}}';
}
function addToBook(el, type, match, extra) {
    if (typeof el.book !== 'undefined' && el.book && typeof match !== 'undefined') {
        if (typeof match['books'] === 'undefined') {
            match['books'] = {};
        }
        if (typeof match['books'][el.book] === 'undefined') {
            match['books'][el.book] = {};
        }
        if (typeof match['books'][el.book][type] === 'undefined') {
            match['books'][el.book][type] = {};
        }
        if (extra) {
            if (typeof match['books'][el.book][type][extra] === 'undefined') {
                match['books'][el.book][type][extra] = {};
            }
            match['books'][el.book][type][extra][el.label] = {index: el.index, text: "page " + el.page};
        } else {
            match['books'][el.book][type][el.label] = {index: el.index, text: "page " + el.page};
        }
    }
}

function applyHelp(texts, el, type, labels, match) {
    var origin = el.label;
    var isArray = Array.isArray(texts);
    var result = [];
    labels = Object.entries(labels).sort(function (a, b) {
        return b[0].length - a[0].length;
    });
    (isArray ? texts : [texts]).forEach(function (text) {
        if (text) {
            var originText = text;
            for (let [label, data] of labels) {
                if (data.type !== type || label !== origin) {
                    var regexpBegin = isArray ? '(^| ou )' : '([^|]|^)';
                    var regexp = new RegExp(regexpBegin + '(' + escapeRegExp(label) + ')($|[^-#\\w\\\u00C0\\\u00C1\\\u00C2\\\u00C3\\\u00C4\\\u00C5\\\u00C6\\\u00C7\\\u00C8\\\u00C9\\\u00CA\\\u00CB\\\u00CC\\\u00CD\\\u00CE\\\u00CF\\\u00D0\\\u00D1\\\u00D2\\\u00D3\\\u00D4\\\u00D5\\\u00D6\\\u00D8\\\u00D9\\\u00DA\\\u00DB\\\u00DC\\\u00DD\\\u00DF\\\u00E0\\\u00E1\\\u00E2\\\u00E3\\\u00E4\\\u00E5\\\u00E6\\\u00E7\\\u00E8\\\u00E9\\\u00EA\\\u00EB\\\u00EC\\\u00ED\\\u00EE\\\u00EF\\\u00F0\\\u00F1\\\u00F2\\\u00F3\\\u00F4\\\u00F5\\\u00F6\\\u00F9\\\u00FA\\\u00FB\\\u00FC\\\u00FD\\\u00FF\\\u0153])', "gm");
                    var replace = '$1#' + data.type + '|' + data.index + '|' + '$2#$3';
                    var newText = text.replace(regexp, replace);
                    var extra = '';
                    if (newText !== text && typeof match !== 'undefined') {
                        if (typeof match[data.type] === 'undefined') {
                            match[data.type] = {};
                        }
                        if (typeof match[data.type][label] === 'undefined') {
                            match[data.type][label] = {};
                        }
                        if (typeof match[data.type][label][type] === 'undefined') {
                            match[data.type][label][type] = [];
                        }
                        if (type === 'careersLevels') {
                            extra = el.careerLevel;
                        }
                        if (extra !== '') {
                            if (typeof match[data.type][label][type][extra] === 'undefined') {
                                match[data.type][label][type][extra] = {};
                            }
                            match[data.type][label][type][extra][origin] = {index: el.index, text: originText};
                        } else {
                            match[data.type][label][type][origin] = {index: el.index, text: originText};
                        }
                    }
                    text = newText;
                }
            }
            result[result.length] = text.replace(new RegExp('#([^|]*)\\|([^|]*)\\|([^#]*)#', "gm"), showHelpText('$1', '$2', '$3'));
        }
    });
    return isArray ? result : result[0];
}

function showDescription(condition, description, el, result, allDescription) {
    var show = condition && description;
    if (show && el.book && allDescription !== true) {
        var i = 0;
        while (result.books[i]) {
            var book = result.books[i];
            if (book && book.abr === el.book) {
                show = book.language === 'VF';
                break;
            }
            ++i;
        }
    }
    return show ? description : '';
}

function generateSpecieHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Species!A1:A' + (result.species.length + 1));
    //var val = data.getValues();
    while (result.species[i]) {
        var el = result.species[i];
        var descs = el.desc;
        var j = 0;
        var careers = [];
        while (result.careers[j]) {
            var t = result.careers[j];
            if (t.rand[el.refCareer]) {
                careers[careers.length] = applyHelp(t.label, el, 'species', {...labels.careers}, match);
            }
            ++j;
        }
        var res = {};
        var text = showDescription(descs[0], applyHelp(descs[0], el, 'species', {...labels.lore, ...labels.gods, ...labels.psychologie}), el, result, allDescription);
        if (text) {
            res['Info'] = text;
        }
        res['Comps/Talents'] =  '<b>Compétences de race: </b>' + toHtmlList(applyHelp(descs[1].split(', '), el, 'species', {...labels.skills}, match))
            + '<b>Talents de race: </b>' + toHtmlList(applyHelp(descs[2].split(', '), el, 'species', {...labels.talents}, match))
            + '<b>Carrière de race: </b>' + toHtmlList(careers)
        res['Caractéristiques'] = '#showSpecieChar|' + el.refChar;
        el.desc = JSON.stringify(res);
        addToBook(el, 'species', match, el.refDetail);
        ++i;
    }
    //data.setValues(val);
}

function toHtmlList(array) {
    return '<ul><li>' + array.join('</li><li>') + '</li></ul>'
}

function generateClassesHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Classes!A1:A' + (result.classes.length + 1));
    //var val = data.getValues();
    while (result.classes[i]) {
        var el = result.classes[i];
        var descs = el.desc;
        var info = showDescription(descs[0], applyHelp(descs[0], el, 'classes', {...labels.lore, ...labels.gods}, match) +
            '<br><br><b>Options de Carrière: </b>' + toHtmlList(applyHelp(descs[1].split(', '), el, 'classes', {...labels.careers}, match)), el, result, allDescription);
        if (descs[1]) {
            info += '<b>Possesssions: </b>' + toHtmlList(applyHelp(descs[2].split(', '), el, 'classes', {...labels.trappings}))
        }
        el.desc = info;
        addToBook(el, 'classes', match);
        ++i;
    }
    //data.setValues(val);
}

function generateGodsHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Gods!A1:A' + (result.spells.length + 1));
    //var val = data.getValues();
    var miracles = {};
    while (result.spells[i]) {
        var spell = result.spells[i];
        if (spell.type == 'Invocation') {
            if (typeof miracles[spell.spec] == 'undefined') {
                miracles[spell.spec] = [];
            }
            miracles[spell.spec][miracles[spell.spec].length] = spell.label;
        }
        ++i;
    }
    i = 0;
    while (result.gods[i]) {
        var el = result.gods[i];
        var descs = el.desc;
        var desc = '';
        if (descs[0]) {
            var desc = '<b>Sphères: </b>' + descs[0] + '<BR>';
        }
        if (descs[1]) {
            desc += '<b>Adorateurs: </b>' + descs[1] + '<BR>';
        }
        if (descs[2]) {
            desc += '<b>Offrandes: </b>' + descs[2] + '<BR><BR>';
        }
        if (descs[3]) {
            desc += '<b>Siège du pouvoir: </b>' + descs[3] + '<BR>';
        }
        if (descs[4]) {
            desc += '<b>Chef du Culte: </b>' + descs[4] + '<BR>';
        }
        if (descs[5]) {
            desc += '<b>Principaux Ordres: </b>' + descs[5] + '<BR>';
        }
        if (descs[6]) {
            desc += '<b>Festivités majeures: </b>' + descs[6] + '<BR>';
        }
        if (descs[7]) {
            desc += '<b>Livres sacrés populaires: </b>' + descs[7] + '<BR>';
        }
        if (descs[8]) {
            desc += '<b>Symboles sacrés courants: </b>' + descs[8] + '<BR>';
        }
        var text = showDescription(descs[9], descs[9], el, result, allDescription);
        if (text) {
            desc += "<br>" + text +"<br>";
        }
        if (descs[10]) {
            desc += '<b><h3>Les adorateurs</h3></b>' + descs[10] + '<BR>';
        }
        if (descs[11]) {
            desc += '<b><h3>Les sites sacrés</h3></b>' + descs[11] + '<BR>';
        }
        if (descs[12]) {
            desc += '<b><h3>Les pénitences</h3></b>' + descs[12] + '<BR>';
        }
        if (descs[13]) {
            desc += '<b><h3>Commandements</h3></b>' + descs[13] + '<BR>';
        }

        if (descs[16]) {
            miracles[el.label] = descs[16].split('; ');
        }
        var res = {};
        if (desc) {
            res['Info'] = applyHelp(desc, el, 'gods', {...labels.lore, ...labels.gods}, match);
        }
        res['Miracles'] = '<b>Bénédictions: </b>' + toHtmlList(applyHelp(('Bénédiction de ' + el.spells.join(', Bénédiction de ')).split(', '), el, 'gods', {...labels.spells}, match)) + (typeof miracles[el.label] != 'undefined' ?
            '<b>Miracles: </b>' + toHtmlList(applyHelp(miracles[el.label], el, 'gods', {...labels.spells}, match)) : '')
        el.desc = JSON.stringify(res);
        addToBook(el, 'gods', match);
        ++i;
    }
    //data.setValues(val);
}

function generateStarsHelp(result, labels, match, allDescription) {
    //var data = getSpeedseetApp().getRange('Stars!A1:A' + (result.stars.length + 1));
    //var val = data.getValues();
    var i = 0;
    while (result.stars[i]) {
        var el = result.stars[i];
        var descs = el.desc;
        var desc = '<b>' + descs[0] + '</b><BR>';
        if (descs[1]) {
            desc += '<b>Nom classique: </b>' + descs[1] + '<BR>';
        }
        if (descs[2]) {
            desc += '<b>Ascendant: </b>' + descs[2] + '<BR>';
        }
        if (descs[3]) {
            desc += '<b>Dates dans le calendrier: </b>' + descs[3] + '<BR>';
        }
        if (descs[4]) {
            desc += '<b>Divinité associée: </b>' + descs[4] + '<BR>';
        }
        if (descs[5]) {
            desc += '<b>Apparence: </b>' + descs[5] + '<BR>';
        }
        if (descs[6]) {
            desc += '<b>Bonus: </b>' + applyHelp(descs[6], el, 'stars', {...labels.talents, ...labels.characteristics}, match) + '<BR>';
        }
        if (descs[7]) {
            desc += '<b>Pénalité: </b>' + applyHelp(descs[7], el, 'stars', {...labels.talents, ...labels.characteristics}, match) + '<BR>';
        }
        desc += "<br>" + descs[8] + "<br>";

        el.desc = applyHelp(desc, el, 'stars', {...labels.lore, ...labels.gods}, match);
        addToBook(el, 'stars', match);
        ++i;
    }
    //data.setValues(val);
}

function generateBookHelp(result, labels, match, allDescription) {
    var i = 0;
    while (result.books[i]) {
        var el = result.books[i];
        //var descs = result.books[i].desc;
        var res = {};
        var elem = listMatchSimple(el.label, '', match['books'][el.abr], 'species');
        if (elem) {
            res[ 'Races'] = elem;
        }
        elem = listMatchSimple(el.label, '', match['books'][el.abr], 'careers');
        if (elem) {
            res[ 'Carrières'] = elem;
        }
        elem = listMatchSimple(el.label, '', match['books'][el.abr], 'talents');
        if (elem) {
            res[ 'Talents'] = elem;
        }
        elem = listMatchSimple(el.label, '', match['books'][el.abr], 'skills');
        if (elem) {
            res[ 'Compétences'] = elem;
        }
        elem = listMatchSimple(el.label, '', match['books'][el.abr], 'spells');
        if (elem) {
            res[ 'Sorts'] = elem;
        }
        elem = listMatchSimple(el.label, '', match['books'][el.abr], 'trappings');
        if (elem) {
            res[ 'Possessions'] = elem;
        }
        el.desc = Object.entries(res).length ? JSON.stringify(res) : '';
        ++i;
    }
}

function generateCareersHelp(result, labels, match, allDescription) {
    var i = 0;
    var y = 0;
    while (result.careersLevels[i]) {
        var el = result.careersLevels[i];
        var descs = el.desc;
        if (el.careerLevel === 1) {
            var text = showDescription(descs[9], applyHelp('<I>' + descs[0] + '</I><BR><BR>' + descs[9], el, 'careersLevels', {...labels.lore, ...labels.gods}), result.careers[y], result, allDescription);
            var finalDesc = {};
            if (text) {
                finalDesc = {
                    'Info': text
                };
            }
        }
        var desc = '';
        desc += '<b>Niveau de carrière: </b>' + descs[2] + '<BR><BR>';
        desc += '<b>Statut: </b>' + descs[4] + '<BR><BR>';
        desc += '<b>Classe: </b>' + applyHelp(descs[1], el, 'careersLevels', {...labels.classes}) + '<BR><BR>';
        desc += '<b>Attributs: </b>' + toHtmlList(applyHelp(descs[5].split(', '), el, 'careersLevels', {...labels.characteristics}, match));
        desc += '<b>Compétences: </b>' + toHtmlList(applyHelp(descs[6].split(', '), el, 'careersLevels', {...labels.skills}, match));
        desc += '<b>Talents: </b>' + toHtmlList(applyHelp(descs[7].split(', '), el, 'careersLevels', {...labels.talents}, match));
        desc += '<b>Possessions: </b>' + toHtmlList(applyHelp(descs[8].split(', '), el, 'careersLevels', {...labels.trappings}, match));
        finalDesc[rangToImg(el.careerLevel)] = desc;
        result.careersLevels[i].desc = {'tab_actif': el.careerLevel - (text ? 0 : 1)};
        if (el.careerLevel === 4) {
            result.careers[y].desc = finalDesc;
            addToBook(result.careers[y], 'careers', match, descs[1]);
            ++y;
        }
        ++i;
    }
}

function generateCharacteristicsHelp(result, labels, match, allDescription) {
    var i = 0;
    while (result.characteristics[i]) {
        var el = result.characteristics[i];
        var descs = result.characteristics[i].desc;
        el.desc =
            {
                'Info': applyHelp(descs[0], el, 'characteristics', {...labels.skills}),
                'Accès': ''
            }
        addToBook(el, 'characteristics', match);
        ++i;
    }
}

function generateTalentsHelp(result, labels, match, allDescription) {
    var i = 0;
    while (result.talents[i]) {
        var el = result.talents[i];
        var descs = el.desc;
        var desc = "<b>Maxi: </b>" + (Number.isInteger(descs[0]) ? descs[0] : applyHelp(descs[0] + '', el, 'talents', {...labels.characteristics}, match)) + "<br>";
        if (descs[1]) {
            desc += "<b>Tests: </b>" + applyHelp(descs[1], el, 'talents', {...labels.skills}, match) + "<br>";
        }
        desc += "<br>" + showDescription(descs[2], applyHelp(descs[2], el, 'talents', {...labels.characteristics, ...labels.skills, ...labels.lore, ...labels.etat, ...labels.psychologie, ...labels.magick, ...labels.equipment, ...labels.trappings, ...labels.gods}), el, result, allDescription) + "<br>";
        if (descs[3]) {
            desc += "<br><b>Spécialisations: </b>" + descs[3] + "<br>";
        }
        el.desc =
            {
                'Info': desc,
                'Accès': ''
            }
        addToBook(el, 'talents', match);
        ++i;
    }
}

function generateSpellsHelp(result, labels, match, allDescription) {
    var i = 0;
    while (result.spells[i]) {
        var el = result.spells[i];
        var descs = el.desc;
        var desc = '';
        var type = el.type + (el.spec ? " (" + el.spec + ")" : "");
        if (el.type !== '') {
            desc += "<b>Talent: </b>" + applyHelp(type, el, 'spells', {...labels.talents}, match) + "<br>";
        }
        if (descs[0] !== '') {
            desc += "<b>NI: </b>" + descs[0] + "<br>";
        }
        if (descs[1] !== '') {
            desc += "<b>Portée: </b>" + applyHelp(descs[1], el, 'spells', {...labels.characteristics}, match) + "<br>";
        }
        if (descs[2] !== '') {
            desc += "<b>Cible: </b>" + descs[2] + "<br>";
        }
        if (descs[3] !== '') {
            desc += "<b>Durée: </b>" + applyHelp(descs[3], el, 'spells', {...labels.characteristics}, match) + "<br>";
        }
        desc += "<br>" + showDescription(descs[4], applyHelp(descs[4], el, 'spells', {...labels.lore, ...labels.etat, ...labels.psychologie, ...labels.magick, ...labels.trait, ...labels.characteristics, ...labels.skills, ...labels.gods}), el, result, allDescription);
        el.desc =
            {
                'Info': desc,
                'Accès': ''
            };
        addToBook(el, 'spells', match, type);
        ++i;
    }
}

function generateTrappingsHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Trappings!A1:A' + (result.trappings.length + 1));
    //var val = data.getValues();
    while (result.trappings[i]) {
        var el = result.trappings[i];
        var descs = el.desc;
        var type = descs[0];
        var desc = "<b>Catégorie: </b>" + type + "<br>";
        var spec = descs[1];
        if (spec) {
            desc += "<b>Groupe d'armes: </b>" + spec + "<br><br>";
        }
        if (descs[8] || descs[9] || descs[10]) {
            desc += "<b>Prix: </b>" + convertPrice(descs[8], descs[9], descs[10]) + "<br>";
        }
        if (descs[3] !== '') {
            desc += "<b>Disponibilité: </b>" + descs[3] + "<br>";
        }
        if (descs[2] !== '') {
            desc += "<b>Encombrement: </b>" + descs[2] + "<br><br>";
        }
        if (type.search('Armes') !== -1 || type.search('Munitions') !== -1) {
            if (type.search('Armes à Distance') !== -1 || type.search('Munitions') !== -1) {
                desc += "<b>Porté: </b>" + descs[4] + "<br>";
            } else {
                desc += "<b>Allonge: </b>" + descs[4] + "<br>";
            }
            if (descs[5]) {
                desc += "<b>Dégâts: </b>" + descs[5] + "<br>";
            }
            if (descs[6]) {
                desc += "<b>Atouts et Défauts: </b>" + applyHelp(descs[6], el, 'trappings', {...labels.equipment, ...labels.taille}, match) + "<br>";
            }
        } else if (type.search('Armures') !== -1) {
            desc += "<b>Emplacements: </b>" + descs[4] + "<br>";
            desc += "<b>PA: </b>" + descs[5] + "<br>";
            if (descs[6]) {
                desc += "<b>Atouts et Défauts: </b>" + applyHelp(descs[6], el, 'trappings', {...labels.equipment, ...labels.taille}, match) + "<br>";
            }
        } else if ((type.search('Sacs et Contenants') !== -1 || type.search('Animaux et véhicules') !== -1) && descs[5]) {
            desc += "<b>Contenu: </b>" + descs[5] + "<br>";
        }
        desc += '<br>' + showDescription(descs[7], applyHelp((descs[7] ? descs[7] : ''), el, 'trappings', {...labels.lore, ...labels.gods, ...labels.etat, ...labels.characteristics, ...labels.psychologie}), el, result, allDescription);
        el.desc = desc;
        addToBook(el, 'trappings', match, type + (spec ? " (" + spec + ")" : ""));
        ++i;
    }
    //data.setValues(val);
}

function generateSkillsHelp(result, labels, match, allDescription) {
    var i = 0;
    while (result.skills[i]) {
        var el = result.skills[i];
        var descs = el.desc;
        var desc = "<b>Attribut: </b>" + applyHelp(descs[0], el, 'skills', {...labels.characteristics}, match);
        var type = descs[1];
        var specs = descs[2];
        desc += "<i>, " + (type === 'base' ? 'de ' : '') + type
        if (specs) {
            desc += ", groupée";
        }
        desc += "</i><br><br>"
        desc += showDescription(descs[3], applyHelp(descs[3], el, 'skills', {...labels.characteristics, ...labels.lore, ...labels.skills, ...labels.gods, ...labels.etat, ...labels.psychologie}), el, result, allDescription);
        if (descs[4]) {
            desc += "<br><br><b>Exemple: </b>" + applyHelp(descs[4], el, 'skills', {...labels.characteristics, ...labels.lore, ...labels.skills, ...labels.gods, ...labels.etat, ...labels.psychologie});
        }
        if (specs) {
            desc += "<br><br><b>Spécialisations: </b>" + specs;
        }
        el.desc =
            {
                'Info': desc,
                'Accès': ''
            }
        addToBook(el, 'skills', match, descs[0]);
        ++i;
    }
}

function rangToImg(rank) {
    var icon = 'icon '
    if (rank === 1) {
        icon += 'cross_icon';
    } else if (rank === 2) {
        icon += 'sword_icon'
    } else if (rank === 3) {
        icon += 'skull_icon'
    } else if (rank === 4) {
        icon += 'shield_icon'
    }
    return '<div title="Rang ' + rank + '" class="' + icon + '"></div>'
}

function listMatchCareerLevel(label, text, match) {
    var traits = ''
    if (typeof match !== 'undefined' && typeof match['careersLevels'] !== 'undefined') {
        traits += '<b>' + text + ': </b><ul>';
        match['careersLevels'].forEach(function (tmp, rank) {
            if (tmp) {
                for (let [i, e] of Object.entries(tmp)) {
                    traits += '<li style="display: flex"><div class="div_label">' + rangToImg(rank) + showHelpText('careersLevels', e.index, i) + (label !== e.text ? ': ' + e.text : '') + '</div></li>';
                }
            }
        });
        traits += '</ul>';
    }
    return traits;
}

function listMatchSimple(label, text, match, key) {
    var traits = ''
    if (typeof match !== 'undefined' && typeof match[key] !== 'undefined') {
        if (text) {
            traits += '<b>' + text + ': </b>';
        }
        if (Object.entries(match[key]).length) {
            traits += '<ul>';
            for (let [i, e] of Object.entries(match[key])) {
                if (typeof e.index === 'undefined') {
                    traits += '<br><b>' + i + ': </b>';
                    for (let [y, el] of Object.entries(e)) {
                        traits += '<li>' + showHelpText(key, el.index, y) + (label !== el.text ? ': ' + el.text : '') + '</li>';
                    }
                } else {
                    traits += '<li>' + showHelpText(key, e.index, i) + (label !== e.text ? ': ' + e.text : '') + '</li>';
                }
            }
            traits += '</ul>';
        }
    }
    return traits;
}

function generateFinalSkillsHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Skills!A1:A' + (result.skills.length + 1));
    //var val = data.getValues();
    while (result.skills[i]) {
        var el = result.skills[i];
        var descs = el.desc;
        var traits = '';
        traits += listMatchSimple(el.label, 'Races donnant accès à cette compétence', match['skills'][el.label], 'species');
        traits += listMatchCareerLevel(el.label, 'Carrières donnant accès à cette compétence', match['skills'][el.label]);
        traits += listMatchSimple(el.label, 'Talents liés à cette compétence', match['skills'][el.label], 'talents');
        if (traits !== '') {
            descs['Accès'] = traits;
            el.desc = JSON.stringify(descs);
        } else {
            el.desc = descs['Info'];
        }
        ++i;
    }
    //data.setValues(val);
}

function generateFinalSpellsHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Spells!A1:A' + (result.spells.length + 1));
    //var val = data.getValues();
    while (result.spells[i]) {
        var el = result.spells[i];
        var descs = el.desc;
        var traits = '';
        traits += listMatchSimple(el.label, 'Domaines donnant accès à ce sort', match['spells'][el.label], 'lore');
        traits += listMatchSimple(el.label, 'Dieux donnant accès à ce sort', match['spells'][el.label], 'gods');
        if (traits !== '') {
            descs['Accès'] = traits;
            el.desc = JSON.stringify(descs);
        } else {
            el.desc = descs['Info'];
        }
        ++i;
    }
    //data.setValues(val);
}

function generateFinalCareerHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Careers!A1:A' + (result.careersLevels.length + 1));
    //var val = data.getValues();
    while (result.careers[i]) {
        var el = result.careers[i];
        var descs = el.desc;
        if (descs) {
            var traits = '';
            traits += listMatchSimple(el.label, 'Race donnant accès à cette carrière', match['careers'][el.label], 'species');
            if (traits !== '') {
                descs['Accès'] = traits;
            }
            el.desc = JSON.stringify(descs);
        }
        ++i;
    }
    //data.setValues(val);
}


function generateFinalTalentsHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Talents!A1:A' + (result.talents.length + 1));
    //var val = data.getValues();
    while (result.talents[i]) {
        var el = result.talents[i];
        var descs = el.desc;
        var traits = '';
        traits += listMatchSimple(el.label, 'Races donnant accès à ce talent', match['talents'][el.label], 'species');
        traits += listMatchCareerLevel(el.label, 'Carrières donnant accès à ce talent', match['talents'][el.label]);
        if (traits !== '') {
            descs['Accès'] = traits;
            el.desc = JSON.stringify(descs);
        } else {
            el.desc = descs['Info'];
        }
        ++i;
    }
    //data.setValues(val);
}

function generateFinalCharacteristicsHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Characteristics!A1:A' + (result.characteristics.length + 1));
    //var val = data.getValues();
    while (result.characteristics[i]) {
        var el = result.characteristics[i];
        var descs = el.desc;
        var traits = '';
        traits += listMatchSimple(el.label, 'Compétences liées à cette caractéristique', match['characteristics'][el.label], 'skills');
        traits += listMatchCareerLevel(el.label, 'Carrières donnant accès à cette caractéristique', match['characteristics'][el.label]);
        if (traits !== '') {
            descs['Accès'] = traits;
            el.desc = JSON.stringify(descs);
        } else {
            el.desc = descs['Info'];
        }
        ++i;
    }
    //data.setValues(val);
}

function generateLoreHelp(result, labels, match, allDescription) {
    var i = 0;
    //var data = getSpeedseetApp().getRange('Lore!A1:A' + (result.spells.length + 1));
    //var val = data.getValues();
    var sorts = {};
    while (result.spells[i]) {
        var spell = result.spells[i];
        if (spell.type === 'Magie des Arcanes'
            || spell.type === 'Magie du Chaos') {
            if (typeof sorts[spell.spec] == 'undefined') {
                sorts[spell.spec] = [];
            }
            sorts[spell.spec][sorts[spell.spec].length] = spell.label;
        }
        ++i;
    }
    i = 0;
    while (result.lore[i]) {
        var el = result.lore[i];
        var descs = el.desc;
        var info;
        if (el.spec !== 'lore') {
            info = showDescription(descs[0], applyHelp(descs[0], el, 'lore', {...labels.characteristics, ...labels.lore, ...labels.skills, ...labels.gods, ...labels.spells, ...labels.etat, ...labels.psychologie, ...labels.magick, ...labels.equipment, ...labels.trait}), el, result, allDescription);
        } else {
            info = showDescription(descs[0], applyHelp(descs[0], el, 'lore', {...labels.lore, ...labels.gods}), el, result, allDescription);
        }
        var final = '';
        if (info && typeof sorts[el.label] !== 'undefined') {
            final = JSON.stringify(
                {
                    'Info': info,
                    'Sorts': '<b>Sorts uniques: </b>' + toHtmlList(applyHelp(sorts[el.label], el, 'lore', {...labels.spells}, match))
                })
        } else {
            final = info;
        }
        el.desc = final;
        addToBook(el, 'lore', match, el.spec);
        ++i;
    }
    //data.setValues(val);
}

function generateHelp(allDescription) {
    var result = getAllData(false, true);
    var labels = initHelpData(result);
    var match = {};
    generateSpecieHelp(result, labels, match, allDescription);
    generateClassesHelp(result, labels, match, allDescription);
    generateGodsHelp(result, labels, match, allDescription);
    generateCareersHelp(result, labels, match, allDescription);
    generateCharacteristicsHelp(result, labels, match, allDescription);
    //result.eyes = getEyes(desc);
    //result.hairs = getHairs(desc);
    generateTalentsHelp(result, labels, match, allDescription);
    generateSpellsHelp(result, labels, match, allDescription);
    generateTrappingsHelp(result, labels, match, allDescription);
    generateSkillsHelp(result, labels, match, allDescription);
    //result.details = getDetails(desc);
    generateLoreHelp(result, labels, match, allDescription);
    //result.foundry = getFoundry(desc);
    generateStarsHelp(result, labels, match, allDescription);
    generateBookHelp(result, labels, match, allDescription);

    generateFinalSkillsHelp(result, labels, match, allDescription);
    generateFinalTalentsHelp(result, labels, match, allDescription);
    generateFinalCharacteristicsHelp(result, labels, match, allDescription);
    generateFinalSpellsHelp(result, labels, match, allDescription);
    generateFinalCareerHelp(result, labels, match, allDescription);
    return "<script>var myCharacterData = " + JSON.stringify(result) + ";</script>";
}

function random(code) {
    loadJSFromHTMLFile('StepSpecies');
    loadJSFromHTMLFile('StepCareers');
    loadJSFromHTMLFile('StepCharacteristics');
    loadJSFromHTMLFile('StepStars');
    loadJSFromHTMLFile('StepTalents');
    loadJSFromHTMLFile('StepSkills');
    loadJSFromHTMLFile('StepTrappings');
    loadJSFromHTMLFile('StepDetail');
    loadJSFromHTMLFile('StepExperience');
    loadJSFromHTMLFile('StepResume');
    loadJSFromHTMLFile('Helper');
    loadJSFromHTMLFile('Character');
    loadJSFromHTMLFile('FoundryHelper');
    loadJSFromHTMLFile('CharacterGenerator');
    var CharGen = CharacterGenerator();
    CharGen.jData = getAllData();
    CharGen.loadData();
    if (code === 'random') {
        CharGen.character = createNewCharacter(CharGen);
        var i = 0;
        var max = 8;
        //CharGen.character.xp.max = 50000;
        while (i < max) {
            var step = CharGen.stepList[i++];
            step.resetAction();
            step.initAction();
            step.randomAllAction();
        }
        CharGen.character.stepIndex = i;
    } else {
        CharGen.character = createNewCharacter(CharGen).load(load(code));
    }
    return ContentService.createTextOutput(JSON.stringify(FoundryHelper.export(CharGen, CharGen.character))).setMimeType(ContentService.MimeType.JSON);
    return 1;//CharGen.character.save();
}

function getSpeedseetApp() {
    return SpreadsheetApp.openById('17tUzD0ywWFbJ3oT20XlcQ6eQzyI9Oyoga0gynhYgmeM');
}

function generateKey(array) {
    var result = {}
    for (var i = 0; i < array.length; ++i) {
        result[array[i]] = i;
    }

    return result;
}

function getLore(desc, tmp) {
    var target = 'Lore';
    tmp = tmp !== 'undefined' && tmp;
    if (tmp) {
        target = 'TmpLore';
    }
    var names = getSpeedseetApp().getRange(target + '!A:I').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var idList = {};
    var keys = generateKey(names[i]);
    var name;
    while (names[i][keys['Nom']] !== '') {
        name = names[i];
        if (i !== 0) {
            var parent = toId(name[keys['Parent']]);
            var id = toId(name[keys['Nom']]);
            var resume = tmp ? name[keys['Description']] : replaceHelpText(name[keys['Html']]);
            if (desc) {
                resume = [
                    name[keys['Description']],
                ]
            }
            result[y] = {
                index: y,
                id: id,
                prefix: name[keys['Prefix']],
                book: name[keys['Livre']],
                page: name[keys['Page']],
                label: name[keys['Nom']],
                parent: parent,
                desc: resume,
                title: name[keys['Extra']],
                spec: name[keys['Spec']],
                children: [],
                level: 1
            };
            idList[id] = y;
            if (parent) {
                var father = result[idList[parent]];
                father.children[father.children.length] = y;
                result[y].level = father.level + 1;
            }
            ++y;
        }
        ++i;
    }

    return result;
}

function getFoundry() {
    var names = getSpeedseetApp().getRange('Foundry!A:E').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            result[y] = {
                index: y,
                type: names[i][0],
                subtype: names[i][1],
                label: names[i][3],
                foundryName: names[i][4]
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getClasses(desc) {
    var names = getSpeedseetApp().getRange('Classes!A:G').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var resume = replaceHelpText(name[keys['Html']]);
            if (desc) {
                resume = [
                    name[keys['Description']],
                    name[keys['Career']],
                    name[keys['Trappings']],
                ];
            }
            result[y] = {
                index: y,
                id: toId(name[keys['Name']]),
                label: name[keys['Name']],
                book: name[keys['Livre']],
                page: name[keys['Page']],
                desc: resume,
                trappings: name[keys['Trappings']]
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}


function getStars(desc) {
    var names = getSpeedseetApp().getRange('Stars!A:X').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var resume = replaceHelpText(name[keys['Html']]);

            if (desc) {
                var bonus = [];
                var malus = [];
                if (name[keys['Talent']]) {
                    bonus[bonus.length] = 'vous gagnez un niveau dans le Talent ' + name[keys['Talent']];
                }
                var stars = ['CC', 'CT', 'F', 'E', 'I', 'Ag', 'Dex', 'Int', 'FM', 'Soc'];
                for (var j = 0; j < stars.length; ++j) {
                    var cha = '';
                    var e = stars[j];
                    var val = name[keys[e]];
                    if (val) {
                        if (e === 'CC') {
                            cha = val + ' ' + 'Capacité de Combat';
                        }
                        if (e === 'CT') {
                            cha = val + ' ' + 'Capacité de Tir';
                        }
                        if (e === 'F') {
                            cha = val + ' ' + 'Force';
                        }
                        if (e === 'E') {
                            cha = val + ' ' + 'Endurance';
                        }
                        if (e === 'I') {
                            cha = val + ' ' + 'Initiative';
                        }
                        if (e === 'Ag') {
                            cha = val + ' ' + 'Agilité';
                        }
                        if (e === 'Dex') {
                            cha = val + ' ' + 'Dextérité';
                        }
                        if (e === 'Int') {
                            cha = val + ' ' + 'Intelligence';
                        }
                        if (e === 'FM') {
                            cha = val + ' ' + 'Force Mentale';
                        }
                        if (e === 'Soc') {
                            cha = val + ' ' + 'Sociabilité';
                        }

                        if (val > 0) {
                            bonus[bonus.length] = "+" + cha;
                        } else {
                            malus[malus.length] = cha;
                        }
                    }
                }
                resume = [
                    name[keys['Signe']],
                    name[keys['Classique']],
                    name[keys['Ascendant']],
                    name[keys['Dates']],
                    name[keys['Dieux']],
                    name[keys['Apparence']],
                    bonus.join(', '),
                    malus.join(', '),
                    name[keys['Description']]
                ];
            }
            result[y] = {
                index: y,
                id: toId(name[keys['Name']]),
                label: name[keys['Name']],
                rand: name[keys['Roll']],
                subRand: name[keys['SubRoll']],
                desc: resume,
                talent: name[keys['Talent']],
                book: name[keys['Livre']],
                page: name[keys['Page']],
                char: {
                    'CC': name[keys['CC']],
                    'CT': name[keys['CT']],
                    'F': name[keys['F']],
                    'E': name[keys['E']],
                    'I': name[keys['I']],
                    'Ag': name[keys['Ag']],
                    'Dex': name[keys['Dex']],
                    'Int': name[keys['Int']],
                    'FM': name[keys['FM']],
                    'Soc': name[keys['Soc']]
                }
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getGods(desc) {
    var names = getSpeedseetApp().getRange('Gods!A:Z').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var resume = replaceHelpText(name[keys['Html']]);
            if (desc) {
                resume = [
                    name[keys['Spheres']],
                    name[keys['Worshippers']],
                    name[keys['Offerings']],
                    name[keys['Siège du pouvoir']],
                    name[keys['Chef du Culte']],
                    name[keys['Principaux Ordres']],
                    name[keys['Festivités majeures']],
                    name[keys['Livres sacrés populaires']],
                    name[keys['Symboles sacrés courants']],
                    name[keys['Desc']],
                    name[keys['Les adorateurs']],
                    name[keys['Les sites sacrés']],
                    name[keys['Les pénitences']],
                    name[keys['Restriction']],
                    name[keys['Miracles']]
                ];
            }
            result[y] = {
                index: y,
                id: toId(name[keys['God']]),
                label: name[keys['God']],
                title: name[keys['Titre']],
                book: name[keys['Livre']],
                page: name[keys['Page']],
                desc: resume,
                spells: [name[keys['Blessing 1']], name[keys['Blessing 2']], name[keys['Blessing 3']], name[keys['Blessing 4']], name[keys['Blessing 5']], name[keys['Blessing 6']]]
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function load(key) {
    var data = getSpeedseetApp().getRange('Save!A:B');
    var val = data.getValues();
    var i = 0;
    while (val[i][0] !== '') {
        if (val[i][0] === key) {
            return ContentService.createTextOutput(val[i][1]).setMimeType(ContentService.MimeType.JSON);
        }
        ++i;
    }
    return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.JSON);
}

function saveData(save) {
    var el = JSON.parse(save);
    var i = parseInt(el.index) + 2;
    var sheet = getSpeedseetApp();
    var j = i;
    var elem = [el];
    if (el.mode === 'insert') {
        if (el.file === 'Careers') {
            el.Rank = el.Name + '|1';
            sheet.getSheetByName(el.file).insertRowsAfter(i++, 4);
            elem = [
                el,
                {'Rank': el.Name + '|2'},
                {'Rank': el.Name + '|3'},
                {'Rank': el.Name + '|4'},
            ];
            j += 4;
        } else {
            sheet.getSheetByName(el.file).insertRowAfter(i++);
            j++;
        }
    }
    var data = getSpeedseetApp().getRange(el.file + '!' + i + ':' + j);
    var values = data.getValues();
    var names = sheet.getRange(el.file + '!1:1').getValues();
    for (var index = 0; index < elem.length; ++index) {
        el = elem[index];
        var y = 0;
        while (typeof names[0][y] != 'undefined') {
            var key = names[0][y];
            if (key === 'Html') {
                values[index][y] = '1';
            } else if (typeof el[key] !== 'undefined') {
                values[index][y] = el[key];
            }
            ++y;
        }
    }
    data.setValues(values);

    return getAdminData();
}

function save(key, save) {
    var data = getSpeedseetApp().getRange('Save!A:B');
    var val = data.getValues();
    var i = 0;
    while (val[i][0] !== '') {
        if (val[i][0] === key) {
            break;
        }
        ++i;
    }
    if (key === '') {
        key = '_' + Math.random().toString(36).substr(2, 9);
    }
    val[i][0] = key;
    val[i][1] = JSON.stringify(save);
    data.setValues(val);

    return ContentService.createTextOutput(key).setMimeType(ContentService.MimeType.JSON);
}

function nextChar(c, number) {
    return String.fromCharCode(c.charCodeAt(0) + number);
}

function getCareers(base, desc, ref, saveload) {
    var careerRef = Object.keys(ref);
    var letter = nextChar('N', careerRef.length);
    var names = getSpeedseetApp().getRange('Careers!A:' + letter).getValues();
    var i = 0;
    var careerIndex = 0;
    var careerLevelIndex = 0;
    var careerLevels = [];
    var careers = [];
    var classes = getClasses();
    var classeIndex = -1;
    var oldClass = '';
    var oldCareer = '';
    var resumeDesc = '';
    var compDesc = '';
    var page = '';
    var book = '';
    var pastCareerLevel = '';
    var careerLevel = 1;
    var keys = [];
    var name;
    keys = generateKey(names[i]);
    while (names[i][keys['Rank']] !== '') {
        name = names[i];
        if (i !== 0 && (saveload === true || name[keys['Characteristics']])) {
            var className = name[keys['Classes']];
            if (oldClass !== className && className !== '') {
                ++classeIndex;
                oldClass = className;
            }
            var careerName = name[keys['Name']];
            if (careerName !== '') {
                page = name[keys['Page']];
                book = name[keys['Livre']];
                careers[careerIndex] = {
                    id: toId(careerName),
                    label: careerName,
                    index: careerIndex,
                    class: oldClass,
                    subRand: name[keys['SubRoll']],
                    desc: replaceHelpText(name[keys['Html']]),
                    page: page,
                    book: book,
                    rand: {}
                }
                for (var w = 0; w < careerRef.length; ++w) {
                    careers[careerIndex]['rand'][careerRef[w]] = name[keys[careerRef[w]]];
                }
                careerLevel = 1;
                pastCareerLevel = '';
                ++careerIndex;
                compDesc = name[keys['Description']];
                resumeDesc = name[keys['Resume']];
                oldCareer = careerName;
            } else {
                pastCareerLevel += ', ';
                ++careerLevel;
            }
            pastCareerLevel += oldCareer + '|' + name[keys['Rank']];
            careerLevels[careerLevelIndex] = {};
            careerLevels[careerLevelIndex]['id'] = toId(oldCareer + '|' + name[keys['Rank']]);
            careerLevels[careerLevelIndex]['altDesc'] = oldCareer;
            careerLevels[careerLevelIndex]['label'] = name[keys['Rank']]
            careerLevels[careerLevelIndex]['index'] = careerLevelIndex;
            careerLevels[careerLevelIndex]['status'] = name[keys['Status']];
            careerLevels[careerLevelIndex]['careerLevel'] = careerLevel;
            careerLevels[careerLevelIndex]['careerGroup'] = oldCareer;
            careerLevels[careerLevelIndex]['skills'] = name[keys['Skills']].split(', ').sort().join(', ');
            careerLevels[careerLevelIndex]['talents'] = name[keys['Talents']].split(', ').sort().join(', ');
            careerLevels[careerLevelIndex]['characteristics'] = name[keys['Characteristics']];
            careerLevels[careerLevelIndex]['trappings'] = ((careerLevel == 1 && classes[classeIndex].trappings && !saveload ? classes[classeIndex].trappings + (name[keys['Trappings']] !== '' ? ', ' : '') : '') + name[keys['Trappings']]).split(', ').sort().join(', ');
            careerLevels[careerLevelIndex]['pastCareerLevel'] = pastCareerLevel;
            if (desc) {
                careerLevels[careerLevelIndex]['desc'] = [
                    resumeDesc,
                    oldClass,
                    careerLevels[careerLevelIndex]['label'],
                    careerLevels[careerLevelIndex]['careerGroup'],
                    careerLevels[careerLevelIndex]['status'],
                    careerLevels[careerLevelIndex]['characteristics'],
                    careerLevels[careerLevelIndex]['skills'],
                    careerLevels[careerLevelIndex]['talents'],
                    careerLevels[careerLevelIndex]['trappings'],
                    compDesc,
                    careerLevels[careerLevelIndex]['careerLevel'],
                ];
            } else {
                careerLevels[careerLevelIndex]['desc'] = JSON.stringify({'tab_actif': careerLevel});
            }
            ++careerLevelIndex;
        }
        ++i;
    }

    return [careers, careerLevels];
}

function getCharacteristics(desc, ref) {
    var charRef = Object.keys(ref);
    var letter = nextChar('H', charRef.length);
    var names = getSpeedseetApp().getRange('Characteristics!A:' + letter).getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var resume = replaceHelpText(name[keys['Html']]);
            if (desc) {
                resume = [
                    name[keys['Description']]
                ]
            }
            var final = {};

            for (var w = 0; w < charRef.length; ++w) {
                final[charRef[w]] = name[keys[charRef[w]]];
            }
            result[y] = {
                index: y,
                foundryName: name[keys['Foundry name']],
                label: name[keys['Name']],
                id: toId(name[keys['Name']]),
                abr: name[keys['abr']],
                book: name[keys['Livre']],
                page: name[keys['Page']],
                rand: final,
                class: name[keys['Mode']],
                desc: resume
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function toId(text) {
    return text.toLowerCase().replace(/[éêè]/ig, 'e').replace(/[áâà]/ig, 'a').replace('  ', ' ').replace('œ', 'oe');
}

function getEyes(desc, ref) {
    var detailRef = Object.keys(ref);
    var letter = nextChar('A', detailRef.length);
    var names = getSpeedseetApp().getRange('Eye!A:' + letter).getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var final = {};
            for (var w = 0; w < detailRef.length; ++w) {
                final[detailRef[w]] = name[keys[detailRef[w]]];
            }
            result[y] = {
                index: y,
                label: final,
                rand: name[keys['Roll']]
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getHairs(desc, ref) {
    var detailRef = Object.keys(ref);
    var letter = nextChar('A', detailRef.length);
    var names = getSpeedseetApp().getRange('Hair!A:' + letter).getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var final = {};
            for (var w = 0; w < detailRef.length; ++w) {
                final[detailRef[w]] = name[keys[detailRef[w]]];
            }
            result[y] = {
                index: y,
                label: final,
                rand: name[keys['Roll']]
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getBooks(desc) {
    var names = getSpeedseetApp().getRange('Books!A:D').getValues();
    var i = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            result[i - 1] = {
                index: i - 1,
                abr: name[keys['Abr']],
                label: name[keys['Name']],
                language: name[keys['Language']],
                type: name[keys['Type']],
            };
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getDetails(desc, ref) {
    var detailRef = Object.keys(ref);
    var letter = nextChar('D', detailRef.length);
    var names = getSpeedseetApp().getRange('Details!A:' + letter).getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var final = {};
            for (var w = 0; w < detailRef.length; ++w) {
                final[detailRef[w]] = name[keys[detailRef[w]]];
            }
            result[y] = {
                index: y,
                label: name[keys['Name']],
                foundryName: name[keys['Foundry name']],
                foundrySubName: name[keys['Foundry subname']],
                allDesc: name[keys['All']],
                desc: final,
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getSpecies(desc, ref) {
    var names = getSpeedseetApp().getRange('Species!A:Q').getValues();
    var i = 1;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    keys = generateKey(names[0]);
    while (names[i][0] !== '') {
        name = names[i];
        result[y] = {
            index: y,
            id: toId(name[keys['Name']]),
            foundryName: name[keys['Foundry name']],
            refChar: name[keys['Char ref']],
            refCareer: name[keys['Career ref']],
            refDetail: name[keys['Detail ref']],
            label: name[keys['Name']],
            rand: name[keys['Roll']],
            skills: name[keys['Skills']].split(', ').sort().join(', '),
            talents: name[keys['Talents']].split(', ').sort().join(', '),
            randomTalents: name[keys['Random talents']],
            age: name[keys['Age']],
            rollAge: name[keys['Age Roll']],
            height: name[keys['Height']],
            rollHeight: name[keys['Height Roll']],
            book: name[keys['Livre']],
            page: name[keys['Page']],
        };
        ref.refChar[result[y]['refChar']] = 1;
        ref.refCareer[result[y]['refCareer']] = 1;
        ref.refDetail[result[y]['refDetail']] = 1;
        if (desc) {
            var s = result[y]['randomTalents'] > 1 ? 's' : '';
            result[y]['desc'] = [
                name[keys['Description']],
                result[y]['skills'],
                result[y]['talents'] + (result[y]['randomTalents'] ? ', ' + result[y]['randomTalents'] + ' Talent' + s + ' aléatoire' + s : ''),
            ]
        } else {
            result[y]['desc'] = replaceHelpText(name[keys['Html']]);
        }
        ++y;
        ++i;
    }

    return result;
}

function getTalents(desc) {
    var names = getSpeedseetApp().getRange('Talents!A:N').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var resume = replaceHelpText(name[keys['Html']]);
            if (desc) {
                resume = [
                    name[keys['Max']],
                    name[keys['Test']],
                    name[keys['Description']],
                    name[keys['Spec']],
                ];
            }
            result[y] = {
                index: y,
                id: toId(name[keys['Talents']]),
                label: name[keys['Talents']],
                rand: name[keys['Roll']],
                max: name[keys['Max']],
                desc: resume,
                spec: '',
                origins: [],
                specs: name[keys['Spec']],
                specName: name[keys['SpeName']],
                addSkill: name[keys['Add Skill']],
                addTalent: name[keys['AddTalent']],
                addMagic: name[keys['Magic']],
                book: name[keys['Livre']],
                page: name[keys['Page']],
                test: name[keys['Test']],
                addCharacteristic: name[keys['Bonus char']]
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getSpells(desc) {
    var names = getSpeedseetApp().getRange('Spells!A:K').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var resume = replaceHelpText(name[keys['Html']]);
            if (desc) {
                resume = [
                    name[keys['CN']],
                    name[keys['Range']],
                    name[keys['Target']],
                    name[keys['Duration']],
                    name[keys['Description']]
                ]
            }
            result[y] = {
                index: y,
                id: toId(name[keys['Name']]),
                label: name[keys['Name']],
                type: name[keys['Type']],
                spec: name[keys['Spec']],
                cn: name[keys['CN']],
                range: name[keys['Range']],
                target: name[keys['Target']],
                duration: name[keys['Duration']],
                effect: name[keys['Description']],
                desc: resume,
                page: name[keys['Page']],
                book: name[keys['Livre']]
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function convertPrice(or, silver, bronze) {
    var result = '';
    if (or === 'Variable' || or === 'ND') {
        return or;
    }
    if (or > 0) {
        result += or + 'CO';
        if (!silver && !bronze) {
            return result;
        }
        result += ' ';
    }
    if (silver > 0) {
        result += silver + '/';
        if (!bronze) {
            return result + '-';
        }
        return result + bronze;
    }
    if (bronze > 0) {
        if (!or) {
            return bronze + 'sc';
        }
        return result + ' /' + bronze;
    }
}

function getTrappings(desc) {
    var names = getSpeedseetApp().getRange('Trappings!A:P').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var resume = replaceHelpText(name[keys['Html']]);
            var damage = '';
            var carry = '';
            var reach = '';
            var qualities = '';
            var pa = '';
            var loc = '';
            var type = name[keys['Type']];
            var spec = name[keys['Spec']];
            if (desc) {
                resume = [
                    type,
                    spec,
                    name[keys['Enc']],
                    name[keys['Disponibilite']],
                    name[keys['Reach']],
                    name[keys['Damage']],
                    name[keys['Quatilites and Flaws']],
                    name[keys['Description']],
                    name[keys['Gold']],
                    name[keys['Silver']],
                    name[keys['Bronze']]
                ]
            }
            if (type.search('Sacs et Contenants') !== -1 || type.search('Animaux et véhicules') !== -1) {
                carry = name[keys['Damage']];
            }
            if (type.search('Armes') !== -1 || type.search('Munitions') !== -1 || type.search('Armures') !== -1) {
                qualities = name[keys['Quatilites and Flaws']];
                if (type.search('Armures') !== -1) {
                    pa = name[keys['Damage']];
                    loc = name[keys['Reach']];
                } else {
                    damage = name[keys['Damage']];
                    reach = name[keys['Reach']];
                }
            }
            result[y] = {
                index: y,
                id: toId(name[keys['Name']]),
                label: name[keys['Name']],
                title: name[keys['Extra']],
                enc: name[keys['Enc']],
                desc: resume,
                type: type,
                spec: spec,
                carry: carry,
                loc: loc,
                reach: reach,
                pa: pa,
                qualities: qualities,
                damage: damage,
                book: name[keys['Livre']],
                page: name[keys['Page']],
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getSkills(desc) {
    var names = getSpeedseetApp().getRange('Skills!A:I').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var keys = [];
    var name;
    while (names[i][0] !== '') {
        name = names[i];
        if (i !== 0) {
            var resume = replaceHelpText(name[keys['Html']]);
            var type = name[keys['Type']];
            var specs = name[keys['Spe']];
            if (desc) {
                resume = [
                    name[keys['Characteristics']],
                    type,
                    specs,
                    name[keys['Description']],
                    name[keys['Exemple']]
                ]
            }
            result[y] = {
                index: y,
                id: toId(name[keys['Name']]),
                label: name[keys['Name']],
                characteristic: name[keys['Characteristics']],
                spec: '',
                origins: [],
                specs: specs,
                specName: name[keys['Spe']] ? 'Au choix' : '',
                type: type,
                book: name[keys['Livre']],
                page: name[keys['Page']],
                desc: resume
            };
            ++y;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getAdminData() {
    //var result = {};
    //result.lore = getLore(false, true);

    return getAllData(true, true, true);
}

function getAllData(base, desc, saveload) {
    var result = {};
    var ref = {'refChar': {}, 'refCareer': {}, 'refDetail': {}};
    result.species = getSpecies(desc, ref);
    result.classes = getClasses(desc);
    let [careers, careersLevels] = getCareers(base, desc, ref.refCareer, saveload);
    result.careers = careers;
    result.careersLevels = careersLevels
    result.talents = getTalents(desc);
    result.characteristics = getCharacteristics(desc, ref.refChar);
    result.trappings = getTrappings(desc);
    result.skills = getSkills(desc);
    result.spells = getSpells(desc);
    result.books = getBooks(desc);
    result.ref = ref;
    if (!saveload) {
        result.stars = getStars(desc);
        result.gods = getGods(desc);
        result.eyes = getEyes(desc, ref.refDetail);
        result.hairs = getHairs(desc, ref.refDetail);
        result.details = getDetails(desc, ref.refDetail);
        result.lore = getLore(desc);
        result.foundry = {}//getFoundry(desc);
    }

    return result;
}


function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
}

function loadJSFromHTMLFile(filename) {
    var javascript = HtmlService.createTemplateFromFile(
        filename
    ).getRawContent().replace('<script>', '').replace('</script>', '');
    eval(javascript);
}