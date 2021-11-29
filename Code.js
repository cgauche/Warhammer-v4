function doGet(request) {
    if (request['parameter']['foundryExport']) {
        return random(request['parameter']['foundryExport']);
        //return ContentService.createTextOutput(JSON.stringify(request)).setMimeType(ContentService.MimeType.JSON);
    } else if (request['parameter']['json']) {
        return ContentService.createTextOutput(JSON.stringify(getAllData())).setMimeType(ContentService.MimeType.JSON);
    }
    return HtmlService.createTemplateFromFile('NewPage')
        .evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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

function getLore() {
    var names = getSpeedseetApp().getRange('Lore!A:C').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    var idList = {};
    while (names[i][0] !== '') {
        if (i !== 0) {
            var parent = toId(names[i][1]);
            var id = toId(names[i][0]);
            result[y] = {
                index: y,
                id: id,
                label: names[i][0],
                parent: parent,
                desc: names[i][2],
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
            result[y] = {index: y, type: names[i][0], subtype: names[i][1], label: names[i][3], foundryName: names[i][4]};
            ++y;
        }
        ++i;
    }

    return result;
}

function getClasses() {
    var names = getSpeedseetApp().getRange('Classes!A:D').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            var desc = '';
            desc += names[i][2] + '<BR>';
            desc += '<b>Options de Carrière: </b>' + names[i][3];
            result[y] = {index: y, id: toId(names[i][0]), label: names[i][0], desc: desc, trappings: names[i][1]};
            ++y;
        }
        ++i;
    }

    return result;
}

function getGods() {
    var names = getSpeedseetApp().getRange('Gods!A:V').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            var desc = '';
            desc += '<b>Sphères: </b>' + names[i][2] + '<BR>';
            desc += '<b>Adorateurs: </b>' + names[i][3] + '<BR>';
            desc += '<b>Offrandes: </b>' + names[i][4] + '<BR><BR>';
            desc += '<b>Siège du pouvoir: </b>' + names[i][5] + '<BR>';
            desc += '<b>Chef du Culte: </b>' + names[i][6] + '<BR>';
            desc += '<b>Principaux Ordres: </b>' + names[i][7] + '<BR>';
            desc += '<b>Festivités majeures: </b>' + names[i][8] + '<BR>';
            desc += '<b>Livres sacrés populaires: </b>' + names[i][9] + '<BR>';
            desc += '<b>Symboles sacrés courants: </b>' + names[i][10] + '<BR>';
            desc += "<br>" + names[i][11] + "<br>";
            desc += '<b><h3>Les adorateurs</h3></b>' + names[i][12] + '<BR>';
            desc += '<b><h3>Les sites sacrés</h3></b>' + names[i][13] + '<BR>';
            desc += '<b><h3>Les pénitences</h3></b>' + names[i][14] + '<BR>';
            desc += '<b><h3>Commandements</h3></b>' + names[i][15] + '<BR>';
            result[y] = {
                index: y,
                id: toId(names[i][0]),
                label: names[i][0],
                title: names[i][1],
                desc: desc,
                spells: [names[i][16], names[i][17], names[i][18], names[i][19], names[i][20], names[i][21]]
            };
            ++y;
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


function getCareers(species) {
    var names = getSpeedseetApp().getRange('Careers!A:Q').getValues();
    var i = 0;
    var careerIndex = -1;
    var careerLevelIndex = 0;
    var result = [];
    var careerResult = [];
    var classes = getClasses();
    var classeIndex = -1;
    var oldClass = '';
    var oldCareer = '';
    var compDesc = '';
    var pastCareerLevel = '';
    var careerLevel = 1;
//    while (names[i][0] !== '') {
    while (i !== 257) {
        if (i !== 0 &&
            names[i][16] !== '') {
            var className = names[i][1];
            if (oldClass !== className && className !== '') {
                ++classeIndex;
                oldClass = className;
            }
            var careerName = names[i][0];
            if (careerName !== '') {
                careerLevel = 1;
                pastCareerLevel = '';
                ++careerIndex;
                var resume = '<I>' + names[i][7] + '</I><BR><BR>';
                resume += '<b>Classe: </b>' + className + '<BR>';
                resume += '<b>Evolution de Carrière</b><BR>';
                compDesc = names[i][9];
                oldCareer = careerName;
                careerResult[careerIndex] = {
                    //index: careerLevelIndex,
                    label: names[i][0],
                    id: toId(names[i][0]),
                    class: names[i][1],
                    //status: names[i][15],
                    //label: names[i][0],
                    //rand: [names[i][2], names[i][3], names[i][4], names[i][5], names[i][6]],
                    //resume: resume,
                    //desc: names[i][9],
                };
            } else {
                pastCareerLevel += ', ';
                ++careerLevel;
            }
            pastCareerLevel += oldCareer + '|' + names[i][16];
            var desc = '<b>' + names[i][16] + ' - ' + names[i][15] + '</b><BR>';
            desc += '<b>Attributs: </b>' + names[i][14] + '<BR>';
            desc += '<b>Compétences: </b>' + names[i][11] + '<BR>';
            desc += '<b>Talents: </b>' + names[i][12] + '<BR>';
            desc += '<b>Possessions: </b>' + classes[classeIndex].trappings + ', ' + names[i][13] + '<BR><BR>';
            desc += compDesc;
//            result[careerIndex]['careerLevel'][careerLevelIndex] = {
            result[careerLevelIndex] = JSON.parse(JSON.stringify(careerResult[careerIndex]));
            result[careerLevelIndex]['id'] = toId(oldCareer + '|' + names[i][16]);
            result[careerLevelIndex]['index'] = careerLevelIndex;
            result[careerLevelIndex]['status'] = names[i][15];
            //result[careerLevelIndex]['label'] = names[i][0];
            result[careerLevelIndex]['rand'] = {};
            result[careerLevelIndex]['rand'][0] = names[i][2];
            result[careerLevelIndex]['rand'][1] = names[i][3];
            result[careerLevelIndex]['rand'][2] = names[i][4];
            result[careerLevelIndex]['rand'][3] = names[i][5];
            result[careerLevelIndex]['rand'][4] = names[i][6];
            result[careerLevelIndex]['desc'] = resume + desc;
            result[careerLevelIndex]['careerLevelName'] = names[i][16];
            result[careerLevelIndex]['careerLevel'] = careerLevel;
            result[careerLevelIndex]['careerGroup'] = oldCareer;
            result[careerLevelIndex]['skills'] = names[i][11].split(', ').sort().join(', ');
            result[careerLevelIndex]['talents'] = names[i][12].split(', ').sort().join(', ');
            result[careerLevelIndex]['characteristics'] = names[i][14];
            result[careerLevelIndex]['trappings'] = (classes[classeIndex].trappings + (names[i][13] !== '' ? ', ' + names[i][13] : '')).split(', ').sort().join(', ');
            result[careerLevelIndex]['pastCareerLevel'] = pastCareerLevel;
            //
            //    index: careerLevelIndex,
            //    class: names[i][1],
            //    status: names[i][15],
            //    label: names[i][0],
            //    rand: [names[i][2], names[i][3], names[i][4], names[i][5], names[i][6]],
            //};
            ++careerLevelIndex;
        }
        ++i;
    }

    return result;
}

function getCharacteristics() {
    var names = getSpeedseetApp().getRange('Characteristics!A:I').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            result[y] = {
                index: y,
                foundryName: names[i][1],
                label: names[i][0],
                id: toId(names[i][0]),
                rand: [names[i][2], names[i][3], names[i][4], names[i][5], names[i][6]],
                class: names[i][7],
                desc: names[i][8]
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function toId(text) {
    return text.toLowerCase().replace(/[éêè]/ig, 'e').replace(/[áâà]/ig, 'a').replace('  ', ' ').replace('œ', 'oe');;
}

function getEyes() {
    var names = getSpeedseetApp().getRange('Eye!A:F').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            result[y] = {
                index: y,
                label: [names[i][1], names[i][2], names[i][3], names[i][4], names[i][5]],
                rand: names[i][0]
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getHairs() {
    var names = getSpeedseetApp().getRange('Hair!A:H').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            result[y] = {
                index: y,
                label: [names[i][1], names[i][2], names[i][3], names[i][4], names[i][5]],
                rand: names[i][0]
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getDetails() {
    var names = getSpeedseetApp().getRange('Details!A:I').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            result[y] = {
                index: y,
                label: names[i][0],
                foundryName: names[i][1],
                foundrySubName: names[i][2],
                allDesc: names[i][3],
                desc: [names[i][4], names[i][5], names[i][6], names[i][7], names[i][8]],
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getSpecies() {
    var names = getSpeedseetApp().getRange('Species!A:L').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            result[y] = {
                index: y,
                id: toId(names[i][0]),
                foundryName: names[i][1],
                label: names[i][0],
                rand: names[i][2],
                desc: names[i][3],
                skills: names[i][5].split(', ').sort().join(', '),
                talents: names[i][6].split(', ').sort().join(', '),
                randomTalents: names[i][7],
                age: names[i][8],
                rollAge: names[i][9],
                height: names[i][10],
                rollHeight: names[i][11],
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getTalents() {
    var names = getSpeedseetApp().getRange('Talents!A:N').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            var desc = "<b>Maxi: </b>" + names[i][2] + "<br>";
            if (names[i][4]) {
                desc += "<b>Tests: </b>" + names[i][4] + "<br>";
            }
            desc += "<br>" + names[i][6] + "<br>";
            if (names[i][11]) {
                desc += "<br><b>Spécialisations: </b>" + names[i][12] + "<br>";
            }
            result[y] = {
                index: y,
                id: toId(names[i][0]),
                label: names[i][0],
                rand: names[i][1],
                max: names[i][2],
                desc: desc,
                spec: '',
                origins: [],
                specs: names[i][12],
                specName: names[i][11],
                addSkill: names[i][8],
                addTalent: names[i][13],
                addMagic: names[i][9],
                addCharacteristic: names[i][10]
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getSpells() {
    var names = getSpeedseetApp().getRange('Spells!A:H').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            var desc = '';
            if (names[i][2] !== '') {
                desc += "<b>NI: </b>" + names[i][3] + "<br>";
            }
            if (names[i][3] !== '') {
                desc += "<b>Portée: </b>" + names[i][4] + "<br>";
            }
            if (names[i][4] !== '') {
                desc += "<b>Cible: </b>" + names[i][5] + "<br>";
            }
            if (names[i][5] !== '') {
                desc += "<b>Durée: </b>" + names[i][6] + "<br>";
            }
            desc += "<br>" + names[i][7] + "<br>";
            result[y] = {
                index: y,
                id: toId(names[i][0]),
                label: names[i][0],
                type: names[i][1],
                spec: names[i][2],
                desc: desc
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getTrappings() {
    var names = getSpeedseetApp().getRange('Trappings!A:G').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            var carry = '';
            var type = names[i][1];
            var desc = "<b>Groupe: </b>" + type + "<br>";
            if (names[i][2] !== '') {
                desc += "<b>Encombrement: </b>" + names[i][2] + "<br>";
            }
            if (type.search('Arme') !== -1 || type.search('Munition') !== -1) {
                if (type.search('Arme à Distance') !== -1 || type.search('Munition') !== -1) {
                    desc += "<b>Porté: </b>" + names[i][3] + "<br>";
                } else {
                    desc += "<b>Allonge: </b>" + names[i][3] + "<br>";
                }
                if (names[i][4]) {
                    desc += "<b>Dégâts: </b>" + names[i][4] + "<br>";
                }
                if (names[i][5]) {
                    desc += "<b>Atouts et Défauts: </b>" + names[i][5] + "<br>";
                }
            } else if (type.search('Armure') !== -1) {
                desc += "<b>Emplacements: </b>" + names[i][3] + "<br>";
                desc += "<b>PA: </b>" + names[i][4] + "<br>";
                if (names[i][5]) {
                    desc += "<b>Atouts et Défauts: </b>" + names[i][5] + "<br>";
                }
            } else {
                if (names[i][3]) {
                    carry = names[i][3];
                    desc += "<b>Contenu: </b>" + carry + "<br>";
                }
            }
            if (names[i][6]) {
                desc += '<br>' + names[i][6];
            }
            result[y] = {
                index: y,
                id: toId(names[i][0]),
                label: names[i][0],
                enc: names[i][2],
                desc: desc,
                carry: carry
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getSkills() {
    var names = getSpeedseetApp().getRange('Skills!A:G').getValues();
    var i = 0;
    var y = 0;
    var result = [];
    while (names[i][0] !== '') {
        if (i !== 0) {
            var type = names[i][3];
            var specs = names[i][6];
            var desc = "<b>Attribut: </b>" + names[i][1];
            desc += "<i>, " + (type === 'base' ? 'de ' : '') + type
            if (specs) {
                desc += ", groupée";
            }
            desc += "</i><br><br>"
            desc += names[i][2];
            if (names[i][4]) {
                desc += "<br><br><b>Exemple: </b>" + names[i][4];
            }
            if (specs) {
                desc += "<br><br><b>Spécialisations: </b>" + specs;
            }
            result[y] = {
                index: y,
                id: toId(names[i][0]),
                label: names[i][0],
                characteristic: names[i][1],
                spec: '',
                origins: [],
                specs: specs,
                specName: names[i][6] ? 'Au choix' : '',
                type: type,
                desc: desc
            };
            ++y;
        }
        ++i;
    }

    return result;
}

function getAllData() {
    var result = {};
    result.species = getSpecies();
    result.classes = getClasses();
    result.gods = getGods();
    result.careers = getCareers(result.species);
    result.characteristics = getCharacteristics();
    result.eyes = getEyes();
    result.hairs = getHairs();
    result.talents = getTalents();
    result.spells = getSpells();
    result.trappings = getTrappings();
    result.skills = getSkills();
    result.details = getDetails();
    result.lore = getLore();
    result.foundry = getFoundry();

    return result;
}


function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
}

function loadJSFromHTMLFile(filename) {
    var javascript = HtmlService.createTemplateFromFile(
        filename
    ).getRawContent().replace('<script>','').replace('</script>','');
    eval(javascript);
}