function doGet(request) {
    if (request['parameter']['foundryExport']) {
        return random(request['parameter']['foundryExport']);
        //return ContentService.createTextOutput(JSON.stringify(request)).setMimeType(ContentService.MimeType.JSON);
    } else if (request['parameter']['json']) {
        return ContentService.createTextOutput(JSON.stringify(getAllData(true))).setMimeType(ContentService.MimeType.JSON);
    } else if (request['parameter']['generateHelp']) {
        return generateHelp();
    }
    return HtmlService.createTemplateFromFile('NewPage')
        .evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function generateSpecieHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Species!A:A');
    var val = data.getValues();
    while (result.species[i]) {
        var descs = result.species[i].desc;
        val[i + 1][0] = JSON.stringify(
            {
                'Info': descs[0],
                'Caractéristiques': '#showSpecieChar|' + result.species[i].refChar,
                'Comps/Talents': '<b>Compétences de race: </b>' + descs[1] + '<BR><BR>' + '<b>Talents de race: </b>' + descs[2]
            });
        ++i;
    }
    data.setValues(val);
}

function generateClassesHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Classes!A:A');
    var val = data.getValues();
    while (result.classes[i]) {
        var descs = result.classes[i].desc;
        var info = descs[0] + '<br><br>' + '<b>Options de Carrière: </b>' + descs[1];
        if (descs[1]) {
            info += '<br><br><b>Possesssions: </b>' + descs[2]
        }
        val[++i][0] = info;
    }
    data.setValues(val);
}

function generateGodsHelp(result) {
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
        var names = result.gods[i].desc;
        var desc = '<b>Sphères: </b>' + names[0] + '<BR>';
        if (names[1]) {
            desc += '<b>Adorateurs: </b>' + names[1] + '<BR>';
        }
        if (names[2]) {
            desc += '<b>Offrandes: </b>' + names[2] + '<BR><BR>';
        }
        if (names[3]) {
            desc += '<b>Siège du pouvoir: </b>' + names[3] + '<BR>';
        }
        if (names[4]) {
            desc += '<b>Chef du Culte: </b>' + names[4] + '<BR>';
        }
        if (names[5]) {
            desc += '<b>Principaux Ordres: </b>' + names[5] + '<BR>';
        }
        if (names[6]) {
            desc += '<b>Festivités majeures: </b>' + names[6] + '<BR>';
        }
        if (names[7]) {
            desc += '<b>Livres sacrés populaires: </b>' + names[7] + '<BR>';
        }
        if (names[8]) {
            desc += '<b>Symboles sacrés courants: </b>' + names[8] + '<BR>';
        }
        desc += "<br>" + names[9] + "<br>";
        if (names[10]) {
            desc += '<b><h3>Les adorateurs</h3></b>' + names[10] + '<BR>';
        }
        if (names[11]) {
            desc += '<b><h3>Les sites sacrés</h3></b>' + names[11] + '<BR>';
        }
        if (names[12]) {
            desc += '<b><h3>Les pénitences</h3></b>' + names[12] + '<BR>';
        }
        if (names[13]) {
            desc += '<b><h3>Commandements</h3></b>' + names[13] + '<BR>';
        }
        if (names[16]) {
            miracles[result.gods[i].label] = names[16].split('; ');
        }

        val[i + 1][0] = JSON.stringify({
            'Info': desc,
            'Miracles': '<b>Bénédictions: </b>Bénédiction de ' + result.gods[i].spells.join(', Bénédiction de ') + (typeof miracles[result.gods[i].label] != 'undefined' ? '<br><br><b>Miracles: </b>' + miracles[result.gods[i].label].join(', ') : '')
        });
        ++i;
    }
    data.setValues(val);
}

function generateCareersHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Careers!A:A');
    var val = data.getValues();
    while (result.careers[i]) {
        var descs = result.careers[i].desc;
        var desc = '';
        desc += '<b>Classe: </b>' + descs[1] + '<BR><BR>';
        desc += '<b>Carrière: </b>' + descs[2] + '<BR><BR>';
        desc += '<b>Niveau de carrière: </b>' + descs[3] + '<BR><BR>';
        desc += '<b>Statut: </b>' + descs[4] + '<BR><BR>';
        desc += '<b>Attributs: </b>' + descs[5] + '<BR><BR>';
        desc += '<b>Compétences: </b>' + descs[6] + '<BR><BR>';
        desc += '<b>Talents: </b>' + descs[7] + '<BR><BR>';
        desc += '<b>Possessions: </b>' + descs[8];
        val[++i][0] = JSON.stringify(
            {
                'Info': '<I>' + descs[0] + '</I><BR><BR>' + descs[9],
                'Traits': desc
            }
        );
    }
    data.setValues(val);
}

function generateCharacteristicsHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Characteristics!A:A');
    var val = data.getValues();
    while (result.characteristics[i]) {
        var descs = result.characteristics[i].desc;
        val[++i][0] = descs[0];
    }
    data.setValues(val);
}

function generateTalentsHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Talents!A:A');
    var val = data.getValues();
    while (result.talents[i]) {
        var names = result.talents[i].desc;
        var desc = "<b>Maxi: </b>" + names[0] + "<br>";
        if (names[1]) {
            desc += "<b>Tests: </b>" + names[1] + "<br>";
        }
        desc += "<br>" + names[2] + "<br>";
        if (names[3]) {
            desc += "<br><b>Spécialisations: </b>" + names[3] + "<br>";
        }
        val[++i][0] = desc;
    }
    data.setValues(val);
}

function generateSpellsHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Spells!A:A');
    var val = data.getValues();
    while (result.spells[i]) {
        var descs = result.spells[i].desc;
        var desc = '';
        if (descs[0] !== '') {
            desc += "<b>NI: </b>" + descs[0] + "<br>";
        }
        if (descs[1] !== '') {
            desc += "<b>Portée: </b>" + descs[1] + "<br>";
        }
        if (descs[2] !== '') {
            desc += "<b>Cible: </b>" + descs[2] + "<br>";
        }
        if (descs[3] !== '') {
            desc += "<b>Durée: </b>" + descs[3] + "<br>";
        }
        desc += "<br>" + descs[4];
        val[++i][0] = desc;
    }
    data.setValues(val);
}

function generateTrappingsHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Trappings!A:A');
    var val = data.getValues();
    while (result.trappings[i]) {
        var names = result.trappings[i].desc;
        var type = names[0];
        var desc = "<b>Catégorie: </b>" + type + "<br>";
        var spec = names[1];
        if (spec) {
            desc += "<b>Groupe d'armes: </b>" + spec + "<br><br>";
        }
        if (names[8] || names[9] || names[10]) {
            desc += "<b>Prix: </b>" + convertPrice(names[8], names[9], names[10]) + "<br>";
        }
        if (names[3] !== '') {
            desc += "<b>Disponibilité: </b>" + names[3] + "<br>";
        }
        if (names[2] !== '') {
            desc += "<b>Encombrement: </b>" + names[2] + "<br><br>";
        }
        if (type.search('Armes') !== -1 || type.search('Munitions') !== -1) {
            if (type.search('Armes à Distance') !== -1 || type.search('Munitions') !== -1) {
                desc += "<b>Porté: </b>" + names[4] + "<br>";
            } else {
                desc += "<b>Allonge: </b>" + names[4] + "<br>";
            }
            if (names[5]) {
                desc += "<b>Dégâts: </b>" + names[5] + "<br>";
            }
            if (names[6]) {
                desc += "<b>Atouts et Défauts: </b>" + names[6] + "<br>";
            }
        } else if (type.search('Armures') !== -1) {
            desc += "<b>Emplacements: </b>" + names[4] + "<br>";
            desc += "<b>PA: </b>" + names[5] + "<br>";
            if (names[6]) {
                desc += "<b>Atouts et Défauts: </b>" + names[6] + "<br>";
            }
        } else if ((type.search('Sacs et Contenants') !== -1 || type.search('Animaux et véhicules') !== -1) && names[5]) {
            desc += "<b>Contenu: </b>" + names[5] + "<br>";
        }
        if (names[7]) {
            desc += '<br>' + names[7];
        }
        if (names[11]) {
            desc += "<br><br>" + names[11] + " page " + names[12];
        }
        val[++i][0] = desc;
    }
    data.setValues(val);
}

function generateSkillsHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Skills!A:A');
    var val = data.getValues();
    while (result.skills[i]) {
        var names = result.skills[i].desc;
        var desc = "<b>Attribut: </b>" + names[0];
        var type = names[1];
        var specs = names[2];
        desc += "<i>, " + (type === 'base' ? 'de ' : '') + type
        if (specs) {
            desc += ", groupée";
        }
        desc += "</i><br><br>"
        desc += names[3];
        if (names[4]) {
            desc += "<br><br><b>Exemple: </b>" + names[4];
        }
        if (specs) {
            desc += "<br><br><b>Spécialisations: </b>" + specs;
        }
        val[++i][0] = desc;
    }
    data.setValues(val);
}

function generateLoreHelp(result) {
    var i = 0;
    var data = getSpeedseetApp().getRange('Lore!A:A');
    var val = data.getValues();
    while (result.lore[i]) {
        var descs = result.lore[i].desc;
        val[++i][0] = descs[0];
    }
    data.setValues(val);
}

function generateHelp() {
    var result = getAllData(false, true);

    generateSpecieHelp(result);
    generateClassesHelp(result);
    generateGodsHelp(result);
    generateCareersHelp(result);
    generateCharacteristicsHelp(result);
    //result.eyes = getEyes(desc);
    //result.hairs = getHairs(desc);
    generateTalentsHelp(result);
    generateSpellsHelp(result);
    generateTrappingsHelp(result);
    generateSkillsHelp(result);
    //result.details = getDetails(desc);
    generateLoreHelp(result);
    //result.foundry = getFoundry(desc);
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

function getLore(desc) {
    var names = getSpeedseetApp().getRange('Lore!A:F').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var idList = {};
    var keys = [];
    var name;
    while (names[i][1] !== '') {
        name = names[i];
        if (i !== 0) {
            var parent = toId(name[keys['Parent']]);
            var id = toId(name[keys['Nom']]);
            var resume = name[keys['Html']];
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
                label: name[keys['Nom']],
                parent: parent,
                desc: resume,
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
        } else {
            keys = generateKey(name);
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
            return val[i][1];
        }
        ++i;
    }
    return '';
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
    val[i][1] = save;
    data.setValues(val);

    return key;
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
    var result = [];
    var careerResult = [];
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
    while (names[i][10] !== '') {
        name = names[i];
        if (i !== 0) {
            var className = name[keys['Classes']];
            if (oldClass !== className && className !== '') {
                ++classeIndex;
                oldClass = className;
            }
            var careerName = name[keys['Name']];
            if (careerName !== '') {
                careerLevel = 1;
                pastCareerLevel = '';
                ++careerIndex;
                compDesc = name[keys['Description']];
                resumeDesc = name[keys['Resume']];
                oldCareer = careerName;
                careerResult[careerIndex] = {
                    label: careerName,
                    id: toId(careerName),
                    class: className,
                };
            } else {
                pastCareerLevel += ', ';
                ++careerLevel;
            }
            pastCareerLevel += oldCareer + '|' + name[keys['Rank']];
            result[careerLevelIndex] = JSON.parse(JSON.stringify(careerResult[careerIndex]));
            result[careerLevelIndex]['id'] = toId(oldCareer + '|' + name[keys['Rank']]);
            result[careerLevelIndex]['index'] = careerLevelIndex;
            result[careerLevelIndex]['status'] = name[keys['Status']];
            result[careerLevelIndex]['rand'] = {};
            for (var w = 0; w < careerRef.length; ++w) {
                result[careerLevelIndex]['rand'][careerRef[w]] = name[keys[careerRef[w]]];
            }
            result[careerLevelIndex]['careerLevelName'] = name[keys['Rank']];
            if (base) {
                result[careerLevelIndex]['label'] = name[keys['Rank']];
            }
            result[careerLevelIndex]['careerLevel'] = careerLevel;
            result[careerLevelIndex]['careerGroup'] = oldCareer;
            result[careerLevelIndex]['skills'] = name[keys['Skills']].split(', ').sort().join(', ');
            result[careerLevelIndex]['talents'] = name[keys['Talents']].split(', ').sort().join(', ');
            result[careerLevelIndex]['characteristics'] = name[keys['Characteristics']];
            result[careerLevelIndex]['trappings'] = ((careerLevel == 1 && classes[classeIndex].trappings ? classes[classeIndex].trappings + (name[keys['Trappings']] !== '' ? ', ' : '') : '') + name[keys['Trappings']]).split(', ').sort().join(', ');
            result[careerLevelIndex]['pastCareerLevel'] = pastCareerLevel;
            if (desc) {
                result[careerLevelIndex]['desc'] = [
                    resumeDesc,
                    oldClass,
                    oldCareer,
                    result[careerLevelIndex]['careerLevelName'],
                    result[careerLevelIndex]['status'],
                    result[careerLevelIndex]['characteristics'],
                    result[careerLevelIndex]['skills'],
                    result[careerLevelIndex]['talents'],
                    result[careerLevelIndex]['trappings'],
                    compDesc,
                    name[keys['Livre']],
                    name[keys['Page']]
                ];
            } else {
                result[careerLevelIndex]['desc'] = name[keys['Html']];
            }
            ++careerLevelIndex;
        } else {
            keys = generateKey(name);
        }
        ++i;
    }

    return result;
}

function getCharacteristics(desc, ref) {
    var charRef = Object.keys(ref);
    var letter = nextChar('G', charRef.length);
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

function getAllData(base, desc) {
    var result = {};
    var ref = {'refChar' : {}, 'refCareer' : {}, 'refDetail' : {}};
    result.species = getSpecies(desc, ref);
    result.classes = getClasses(desc);
    result.gods = getGods(desc);
    result.careers = getCareers(base, desc, ref.refCareer);
    result.characteristics = getCharacteristics(desc, ref.refChar);
    result.eyes = getEyes(desc,ref.refDetail);
    result.hairs = getHairs(desc, ref.refDetail);
    result.talents = getTalents(desc);
    result.spells = getSpells(desc);
    result.trappings = getTrappings(desc);
    result.skills = getSkills(desc);
    result.details = getDetails(desc, ref.refDetail);
    result.lore = getLore(desc);
    result.foundry = getFoundry(desc);

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