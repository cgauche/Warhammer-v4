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
        return generateHelp();
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
            html += "<script> $(document).ready(function () { CharacterGenerator().init(); }); </script>";
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

function showHelpText(type, index, text) {
    return '<span class="showHelp" data-type="' + type + '" data-index="' + index + '">' + text + '</span>';
}

function applyHelp(texts, el, type, labels, match) {
    var origin = el.label;
    var isArray = Array.isArray(texts);
    var result = [];
    labels = Object.entries(labels).sort(function (a, b) {
        return b[0].length - a[0].length;
    });
    (isArray ? texts : [texts]).forEach(function (text) {
        if (!text) {
            console.log(texts);
            console.log(el);
        } else {
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


function generateSpecieHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Species!A:A');
    var val = data.getValues();
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
        val[i + 1][0] = JSON.stringify(
            {
                'Info': applyHelp(descs[0], el, 'species', {...labels.lore, ...labels.gods, ...labels.psychologie}),
                'Caractéristiques': '#showSpecieChar|' + el.refChar,
                'Accès': '<b>Compétences de race: </b><ul><li>' + applyHelp(descs[1].split(', '), el, 'species', {...labels.skills}, match).join('</li><li>') + '</li></ul>'
                    + '<b>Talents de race: </b><ul><li>' + applyHelp(descs[2].split(', '), el, 'species', {...labels.talents}, match).join('</li><li>') + '</li></ul>'
                    + '<b>Carrière de race: </b><ul><li>' + careers.join('</li><li>') + '</li></ul>'
            });
        ++i;
    }
    data.setValues(val);
}

function generateClassesHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Classes!A:A');
    var val = data.getValues();
    while (result.classes[i]) {
        var el = result.classes[i];
        var descs = el.desc;
        var info = applyHelp(descs[0], el, 'classes', {...labels.lore, ...labels.gods}, match) +
            '<br><br><b>Options de Carrière: </b><ul><li>' + applyHelp(descs[1].split(', '), el, 'classes', {...labels.careers}, match).join('</li><li>') + '</li></ul>';
        if (descs[1]) {
            info += '<b>Possesssions: </b><ul><li>' + applyHelp(descs[2].split(', '), el, 'classes', {...labels.trappings}).join('</li><li>') + '</li></ul>'
        }
        val[++i][0] = info;
    }
    data.setValues(val);
}

function generateGodsHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Gods!A:A');
    var val = data.getValues();
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
        var desc = '<b>Sphères: </b>' + descs[0] + '<BR>';
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
        desc += "<br>" + descs[9] + "<br>";
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

        val[i + 1][0] = JSON.stringify({
            'Info': applyHelp(desc, el, 'gods', {...labels.lore, ...labels.gods}, match),
            'Miracles': '<b>Bénédictions: </b><ul><li>' + applyHelp(('Bénédiction de ' + el.spells.join(', Bénédiction de ')).split(', '), el, 'gods', {...labels.spells}, match).join('</li><li>') + '</li></ul>' + (typeof miracles[el.label] != 'undefined' ?
                '<b>Miracles: </b><ul><li>' + applyHelp(miracles[el.label], el, 'gods', {...labels.spells}, match).join('</li><li>') + '</li></ul>' : '')
        });
        ++i;
    }
    data.setValues(val);
}

function generateCareersHelp(result, labels, match) {
    var i = 0;
    var finalDesc = {};
    while (result.careersLevels[i]) {
        var el = result.careersLevels[i];
        var descs = el.desc;
        if (el.careerLevel === 1) {
            finalDesc = {};
            finalDesc['Info'] = applyHelp('<I>' + descs[0] + '</I><BR><BR>' + descs[9], el, 'careersLevels', {...labels.lore, ...labels.gods});
        }
        var desc = '';
        desc += '<b>Niveau de carrière: </b>' + descs[2] + '<BR><BR>';
        desc += '<b>Statut: </b>' + descs[4] + '<BR><BR>';
        desc += '<b>Classe: </b>' + applyHelp(descs[1], el, 'careersLevels', {...labels.classes}) + '<BR><BR>';
        desc += '<b>Attributs: </b><ul><li>' + applyHelp(descs[5].split(', '), el, 'careersLevels', {...labels.characteristics}, match).join('</li><li>') + '</li></ul>';
        desc += '<b>Compétences: </b><ul><li>' + applyHelp(descs[6].split(', '), el, 'careersLevels', {...labels.skills}, match).join('</li><li>') + '</li></ul>';
        desc += '<b>Talents: </b><ul><li>' + applyHelp(descs[7].split(', '), el, 'careersLevels', {...labels.talents}, match).join('</li><li>') + '</li></ul>';
        desc += '<b>Possessions: </b><ul><li>' + applyHelp(descs[8].split(', '), el, 'careersLevels', {...labels.trappings}, match).join('</li><li>') + '</li></ul>';
        finalDesc[rangToImg(el.careerLevel)] = desc;
        if (el.careerLevel === 4) {
            result.careersLevels[i - 3].desc = finalDesc;
        }
        ++i;
    }
}

function generateCharacteristicsHelp(result, labels, match) {
    var i = 0;
    while (result.characteristics[i]) {
        var el = result.characteristics[i];
        var descs = result.characteristics[i].desc;
        el.desc =
            {
                'Info': applyHelp(descs[0], el, 'characteristics', {...labels.skills}),
                'Accès': ''
            }
        ++i;
    }
}

function generateTalentsHelp(result, labels, match) {
    var i = 0;
    while (result.talents[i]) {
        var el = result.talents[i];
        var descs = el.desc;
        var desc = "<b>Maxi: </b>" + (Number.isInteger(descs[0]) ? descs[0] : applyHelp(descs[0] + '', el, 'talents', {...labels.characteristics}, match)) + "<br>";
        if (descs[1]) {
            desc += "<b>Tests: </b>" + applyHelp(descs[1], el, 'talents', {...labels.skills}, match) + "<br>";
        }
        desc += "<br>" + applyHelp(descs[2], el, 'talents', {...labels.characteristics, ...labels.skills, ...labels.lore, ...labels.etat, ...labels.psychologie, ...labels.magick, ...labels.equipment, ...labels.trappings, ...labels.gods}) + "<br>";
        if (descs[3]) {
            desc += "<br><b>Spécialisations: </b>" + descs[3] + "<br>";
        }
        el.desc =
            {
                'Info': desc,
                'Accès': ''
            }
        ++i;
    }
}

function generateSpellsHelp(result, labels, match) {
    var i = 0;
    while (result.spells[i]) {
        var el = result.spells[i];
        var descs = el.desc;
        var desc = '';
        if (descs[0] !== '') {
            desc += "<b>NI: </b>" + descs[0] + "<br>";
        }
        if (descs[1] !== '') {
            desc += "<b>Portée: </b>" + applyHelp(descs[1], el, 'spells', {...labels.characteristics}) + "<br>";
        }
        if (descs[2] !== '') {
            desc += "<b>Cible: </b>" + descs[2] + "<br>";
        }
        if (descs[3] !== '') {
            desc += "<b>Durée: </b>" + applyHelp(descs[3], el, 'spells', {...labels.characteristics}) + "<br>";
        }
        desc += "<br>" + applyHelp(descs[4], el, 'spells', {...labels.lore, ...labels.etat, ...labels.psychologie, ...labels.magick, ...labels.trait, ...labels.characteristics, ...labels.skills, ...labels.gods});
        el.desc =
            {
                'Info': desc,
                'Accès': ''
            };
        ++i;
    }
}

function generateTrappingsHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Trappings!A:A');
    var val = data.getValues();
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
        if (descs[7]) {
            desc += '<br>' + applyHelp(descs[7], el, 'trappings', {...labels.lore, ...labels.gods, ...labels.etat, ...labels.characteristics, ...labels.psychologie});
        }
        if (descs[11]) {
            desc += "<br><br>" + descs[11] + " page " + descs[12];
        }
        val[++i][0] = desc;
    }
    data.setValues(val);
}

function generateSkillsHelp(result, labels, match) {
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
        desc += applyHelp(descs[3], el, 'skills', {...labels.characteristics, ...labels.lore, ...labels.skills, ...labels.gods, ...labels.etat, ...labels.psychologie});
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
        ++i;
    }
}

function rangToImg(rank)
{
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
    return '<div class="'+icon+'"></div>'
}

function listMatchCareerLevel(label, text, match) {
    var traits = ''
    if (typeof match !== 'undefined' && typeof match['careersLevels'] !== 'undefined') {
        traits += '<b>' + text + ': </b><ul>';
        match['careersLevels'].forEach(function (tmp, rank) {
            if (tmp) {
                for (let [i, e] of Object.entries(tmp)) {
                    traits += '<li style="display: flex">' + rangToImg(rank) + showHelpText('careersLevels', e.index, i) + (label !== e.text ? ': ' + e.text : '') + '</li>';
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
        traits += '<b>' + text + ': </b><ul>';
        for (let [i, e] of Object.entries(match[key])) {
            traits += '<li>' + showHelpText(key, e.index, i) + (label !== e.text ? ': ' + e.text : '') + '</li>';
        }
        traits += '</ul>';
    }
    return traits;
}

function generateFinalSkillsHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Skills!A:A');
    var val = data.getValues();
    while (result.skills[i]) {
        var el = result.skills[i];
        var descs = el.desc;
        var traits = '';
        traits += listMatchSimple(el.label, 'Races donnant accès à la compétence', match['skills'][el.label], 'species');
        traits += listMatchCareerLevel(el.label, 'Carrières donnant accès à la compétence', match['skills'][el.label]);
        traits += listMatchSimple(el.label, 'Talents liés à la compétence', match['skills'][el.label], 'talents');
        if (traits !== '') {
            descs['Accès'] = traits;
            val[++i][0] = JSON.stringify(descs);
        } else {
            val[++i][0] = descs['Info'];
        }
    }
    data.setValues(val);
}

function generateFinalSpellsHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Spells!A:A');
    var val = data.getValues();
    while (result.spells[i]) {
        var el = result.spells[i];
        var descs = el.desc;
        var traits = '';
        traits += listMatchSimple(el.label, 'Domaines donnant accès au sort', match['spells'][el.label], 'lore');
        traits += listMatchSimple(el.label, 'Dieux donnant accès au sort', match['spells'][el.label], 'gods');
        if (traits !== '') {
            descs['Accès'] = traits;
            val[++i][0] = JSON.stringify(descs);
        } else {
            val[++i][0] = descs['Info'];
        }
    }
    data.setValues(val);
}
function generateFinalCareerHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Careers!A:A');
    var val = data.getValues();
    while (result.careersLevels[i]) {
        var el = result.careersLevels[i++];
        var descs = el.desc;
        if (descs) {
            var traits = '';
            traits += listMatchSimple(el.careerGroup, 'Race donnant accès a la carrière', match['careers'][el.careerGroup], 'species');
            if (traits !== '') {
                descs['Accès'] = traits;
            }
            val[i][0] = JSON.stringify(descs);
        }
    }
    data.setValues(val);
}


function generateFinalTalentsHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Talents!A:A');
    var val = data.getValues();
    while (result.talents[i]) {
        var el = result.talents[i];
        var descs = el.desc;
        var traits = '';
        traits += listMatchSimple(el.label, 'Races donnant accès au talent', match['talents'][el.label], 'species');
        traits += listMatchCareerLevel(el.label, 'Carrières donnant accès au talent', match['talents'][el.label]);
        if (traits !== '') {
            descs['Accès'] = traits;
            val[++i][0] = JSON.stringify(descs);
        } else {
            val[++i][0] = descs['Info'];
        }
    }
    data.setValues(val);
}

function generateFinalCharacteristicsHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Characteristics!A:A');
    var val = data.getValues();
    while (result.characteristics[i]) {
        var el = result.characteristics[i];
        var descs = el.desc;
        var traits = '';
        traits += listMatchSimple(el.label, 'Compétences liées à la caractéristique', match['characteristics'][el.label], 'skills');
        traits += listMatchCareerLevel(el.label, 'Carrières donnant accès à la caractéristique', match['characteristics'][el.label]);
        if (traits !== '') {
            descs['Accès'] = traits;
            val[++i][0] = JSON.stringify(descs);
        } else {
            val[++i][0] = descs['Info'];
        }
    }
    data.setValues(val);
}

function generateLoreHelp(result, labels, match) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Lore!A:A');
    var val = data.getValues();
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
            info = descs[0] ? applyHelp(descs[0], el, 'lore', {...labels.characteristics, ...labels.lore, ...labels.skills, ...labels.gods, ...labels.spells, ...labels.etat, ...labels.psychologie, ...labels.magick, ...labels.equipment, ...labels.trait}) : '';
        } else {
            info = descs[0] ? applyHelp(descs[0], el, 'lore', {...labels.lore, ...labels.gods}) : '';
        }
        var final = '';
        if (info && typeof sorts[el.label] !== 'undefined') {
            final = JSON.stringify(
                {
                    'Info': info,
                    'Sorts': '<b>Sorts uniques: </b><ul><li>' + applyHelp(sorts[el.label], el, 'lore', {...labels.spells}, match).join('</li><li>') + '</li></ul>'
                })
        } else {
            final = info;
        }
        val[++i][0] = final;
    }
    data.setValues(val);
}

function generateHelp() {
    var result = getAllData(false, true);
    var labels = initHelpData(result);
    var match = {};
    generateSpecieHelp(result, labels, match);
    generateClassesHelp(result, labels, match);
    generateGodsHelp(result, labels, match);
    generateCareersHelp(result, labels, match);
    generateCharacteristicsHelp(result, labels, match);
    //result.eyes = getEyes(desc);
    //result.hairs = getHairs(desc);
    generateTalentsHelp(result, labels, match);
    generateSpellsHelp(result, labels, match);
    generateTrappingsHelp(result, labels, match);
    generateSkillsHelp(result, labels, match);
    //result.details = getDetails(desc);
    generateLoreHelp(result, labels, match);
    //result.foundry = getFoundry(desc);

    generateFinalSkillsHelp(result, labels, match);
    generateFinalTalentsHelp(result, labels, match);
    generateFinalCharacteristicsHelp(result, labels, match);
    generateFinalSpellsHelp(result, labels, match);
    generateFinalCareerHelp(result, labels, match);
    return ContentService.createTextOutput("<script>var myCharacterData = " + JSON.stringify(getAllData()) + ";</script>");
}

function random(code) {
    loadJSFromHTMLFile('StepSpecies');
    loadJSFromHTMLFile('StepCareers');
    loadJSFromHTMLFile('StepCharacteristics');
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
    return SpreadsheetApp.openById('1ORw2FbAbbAbzzUsZHddZj2dJlavmHUwBnx6VdYq_MSE');
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
            var resume = tmp ? name[keys['Description']] : name[keys['Html']];
            if (desc) {
                resume = [
                    name[keys['Description']],
                    name[keys['Livre']],
                    name[keys['Page']]
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
            var resume = name[keys['Html']];
            if (desc) {
                resume = [
                    name[keys['Description']],
                    name[keys['Career']],
                    name[keys['Trappings']],
                    name[keys['Livre']],
                    name[keys['Page']],
                ];
            }
            result[y] = {
                index: y,
                id: toId(name[keys['Name']]),
                label: name[keys['Name']],
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
            var resume = name[keys['Html']];
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
                    name[keys['Livre']],
                    name[keys['Page']],
                    name[keys['Miracles']]
                ];
            }
            result[y] = {
                index: y,
                id: toId(name[keys['God']]),
                label: name[keys['God']],
                title: name[keys['Titre']],
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

function saveLore(save) {
    var el = JSON.parse(save);
    var data = getSpeedseetApp().getRange('TmpLore!A:I');
    var names = data.getValues();
    var keys = generateKey(names[0]);
    var i = 0;
    while (names[i][keys['Nom']] !== '') {
        if (names[i][keys['Nom']] === el.label) {
            break;
        }
        ++i;
    }
    names[i][keys['Prefix']] = el.prefix;
    names[i][keys['Nom']] = el.label;
    names[i][keys['Extra']] = el.extra;
    names[i][keys['Spec']] = el.spec;
    names[i][keys['Parent']] = el.parent;
    names[i][keys['Livre']] = el.book;
    names[i][keys['Page']] = el.page;
    names[i][keys['Description']] = el.desc;
    data.setValues(names);

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

function getCareers(base, desc, ref) {
    var careerRef = Object.keys(ref);
    var letter = nextChar('M', careerRef.length);
    var names = getSpeedseetApp().getRange('Careers!A:' + letter).getValues();
    var i = 0;
    var careerIndex = -1;
    var careerLevelIndex = 0;
    var careerLevels = [];
    var careers = [];
    var classes = getClasses();
    var classeIndex = -1;
    var oldClass = '';
    var oldCareer = '';
    var resumeDesc = '';
    var compDesc = '';
    var pastCareerLevel = '';
    var careerLevel = 1;
    var keys = [];
    var name;
    keys = generateKey(names[i]);
    while (names[i][keys['Rank']] !== '') {
        name = names[i];
        if (i !== 0) {
            var className = name[keys['Classes']];
            if (oldClass !== className && className !== '') {
                ++classeIndex;
                oldClass = className;
            }
            var careerName = name[keys['Name']];
            if (careerName !== '') {
                careers[careerIndex] = {
                    id: toId(careerName),
                    label: careerName,
                    index: careerIndex,
                    class: oldClass,
                    desc: name[keys['Html']],
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
            careerLevels[careerLevelIndex]['trappings'] = ((careerLevel == 1 && classes[classeIndex].trappings ? classes[classeIndex].trappings + (name[keys['Trappings']] !== '' ? ', ' : '') : '') + name[keys['Trappings']]).split(', ').sort().join(', ');
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
                    name[keys['Livre']],
                    name[keys['Page']],
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
            var resume = name[keys['Html']];
            if (desc) {
                resume = [
                    name[keys['Description']],
                    name[keys['Livre']],
                    name[keys['Page']],
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
                name[keys['Livre']],
                name[keys['Page']]
            ]
        } else {
            result[y]['desc'] = name[keys['Html']];
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
            var resume = name[keys['Html']];
            if (desc) {
                resume = [
                    name[keys['Max']],
                    name[keys['Test']],
                    name[keys['Description']],
                    name[keys['Spec']],
                    name[keys['Livre']],
                    name[keys['Page']],
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
            var resume = name[keys['Html']];
            if (desc) {
                resume = [
                    name[keys['CN']],
                    name[keys['Range']],
                    name[keys['Target']],
                    name[keys['Duration']],
                    name[keys['Description']],
                    name[keys['Livre']],
                    name[keys['Page']]
                ]
            }
            result[y] = {
                index: y,
                id: toId(name[keys['Name']]),
                label: name[keys['Name']],
                type: name[keys['Type']],
                spec: name[keys['Spec']],
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
            var resume = name[keys['Html']];
            var carry = '';
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
                    name[keys['Bronze']],
                    name[keys['Livre']],
                    name[keys['Page']]
                ]
            }
            if ((type.search('Sacs et Contenants') !== -1 || type.search('Animaux et véhicules') !== -1) && name[keys['Damage']]) {
                carry = name[keys['Damage']];
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
                carry: carry
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
            var resume = name[keys['Html']];
            var type = name[keys['Type']];
            var specs = name[keys['Spe']];
            if (desc) {
                resume = [
                    name[keys['Characteristics']],
                    type,
                    specs,
                    name[keys['Description']],
                    name[keys['Exemple']],
                    name[keys['Livre']],
                    name[keys['Page']],
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
    var result = {};
    result.lore = getLore(false, true);

    return result;
}

function getAllData(base, desc) {
    var result = {};
    var ref = {'refChar': {}, 'refCareer': {}, 'refDetail': {}};
    result.species = getSpecies(desc, ref);
    result.classes = getClasses(desc);
    result.gods = getGods(desc);
    let [careers, careersLevels] = getCareers(base, desc, ref.refCareer);
    result.careers = careers;
    result.careersLevels = careersLevels
    result.characteristics = getCharacteristics(desc, ref.refChar);
    result.eyes = getEyes(desc, ref.refDetail);
    result.hairs = getHairs(desc, ref.refDetail);
    result.talents = getTalents(desc);
    result.spells = getSpells(desc);
    result.trappings = getTrappings(desc);
    result.skills = getSkills(desc);
    result.details = getDetails(desc, ref.refDetail);
    result.lore = getLore(desc);
    result.foundry = {}//getFoundry(desc);

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