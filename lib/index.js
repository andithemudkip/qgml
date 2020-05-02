const fs = require ('fs');
const path = require ('path');

const express = require ('express');
const app = express ();
app.use (express.static (path.join (__dirname, '../serve')));

let http = require ('http').createServer (app);
let io = require ('socket.io') (http);

const World = require ('./world');
const Group = require ('./group');
const Actor = require ('./actor');
const GMLText = require ('./text');

const { randomID } = require ('./rand');

let vars;
let keymappers;

let resetVars = () => {
    vars = {};
}
resetVars ();

let resetKeymappers = () => {
    keymappers = {};
}
resetKeymappers ();

// groups

let groupDepth, groupNames;

let resetGroups = () => {
    groupDepth = 0;
    groupNames = [null];
}
resetGroups ();


// scripts
let scripts;
let currentScript;

let resetScripts = () => {
    scripts = {};
    currentScript = null;
}
resetScripts ();


// text
let currentText = null;


let config = {
    worlds: [],
    rootElementID: 'qgml-game',
    defaultWorld: null,
    width: 300,
    height: 300,
    assets: {},
    actorTemplates: []
}
// world

let worlds = {};
let currentWorld = null;
let defaultWorld;

// serve and compile

let outputPath;
let inputPath;

let originalInclude;
let originalInput;
let originalOutput;

// assets

let assets;

let resetAssets = () => {
    assets = {
        spritesheets: [],
        sprites: []
    }
}

resetAssets ();

let actorTemplates;
let resetTemplates = () => {
    actorTemplates = [];
}
resetTemplates ();

let parser = require ('htmljs-parser').createParser ({
    onText: function (event) {
        // Text within an HTML element
        // var value = event.value;
        // console.log (event.type, event);
        if (currentScript) {
            if (event.value.replace (/\s+/g, '').length)
                currentScript.body += event.value;
        } else if (currentText) {
            if (event.value.replace (/ +/g, ' ').length)
                currentText.value += event.value.replace (/ +/g, ' ').replace (/\r/g, '');
        }
    },

    onPlaceholder: function (event) {
        if (currentText) {
            currentText.value += "${" + event.value + "}";
        }
        //  ${<value>]} // escape = true
        // $!{<value>]} // escape = false
        // var value = event.value; // String
        // var escaped = event.escaped; // boolean
        // var withinBody = event.withinBody; // boolean
        // var withinAttribute = event.withinAttribute; // boolean
        // var withinString = event.withinString; // boolean
        // var withinOpenTag = event.withinOpenTag; // boolean
        // var pos = event.pos; // Integer
        // console.log (event.type, event);
    },

    onString: function (event) {
        // Text within ""
        // var value = event.value; // String
        // var stringParts = event.stringParts; // Array
        // var isStringLiteral = event.isStringLiteral // Boolean
        // var pos = event.pos; // Integer
        // console.log (event.type, event);
    },

    onOpenTag: async function (event) {
        // var tagName = event.tagName; // String
        // var attributes = event.attributes; // Array
        // var argument = event.argument; // Object
        // var pos = event.pos; // Integer
        switch (event.tagName) {
            case 'qgml':
                event.attributes.forEach (attr => {
                    config [attr.name] = attr.literalValue || attr.value;
                });
                break;
            case 'var':
                if (!vars [currentWorld || 'global']) vars [currentWorld || 'global'] = {};
                event.attributes.forEach (attr => {
                    vars [currentWorld || 'global'][attr.name] = attr.literalValue || attr.value;
                    vars [currentWorld || 'global'][attr.name] = attr.hasOwnProperty ('literalValue') ? attr.literalValue : attr.value;
                });
                break;
            case 'group':
                // console.log (event);
                let group = new Group (currentWorld, groupNames [groupDepth]);
                group.setConfigFromAttribs (event.attributes);
                worlds [currentWorld].addGroup (group);
                groupNames [++groupDepth] = group.name;
                break;
            case 'world':
                let worldID = event.attributes.find (a => a.name === 'id');
                worldID = worldID ? worldID.literalValue : `world-${randomID (6)}`;
                worlds [worldID] = new World (worldID);
                worlds [worldID].setConfigFromAttribs (event.attributes);
                if (worlds [worldID].default) defaultWorld = worldID;
                currentWorld = worldID;
                break;
            case 'actor':
                let actor = new Actor ();
                actor.group = groupNames [groupDepth];
                worlds [currentWorld].addActor (actor);
                actor.setConfigFromAttribs (event.attributes);
                // await actor.processAssets (assets, inputPath);
                break;
            case 'actor-template':
                let actorTemplate = new Actor ();
                actorTemplate.isTemplate = true;
                actorTemplate.setConfigFromAttribs (event.attributes);
                actorTemplates.push (actorTemplate);
                break;
            case 'script':
                if (!event.selfClosed) {
                    for (attr of event.attributes) {
                        if (attr.name === 'setup') {
                            currentScript = {
                                type: 'setup',
                                body: ''
                            }
                            break;
                        } else if (attr.name === 'update') {
                            currentScript = {
                                type: 'update',
                                body: ''
                            }
                            break;
                        }
                    }
                }
                break;
            case 'text':
                if (!event.selfClosed) {
                    currentText = new GMLText ();
                    currentText.setConfigFromAttribs (event.attributes);
                }
                break;
            case 'keymapper':
                if (!keymappers [currentWorld || 'global']) keymappers [currentWorld || 'global'] = {};
                event.attributes.forEach (attr => {
                    keymappers [currentWorld || 'global'][attr.name] = attr.literalValue || attr.value;
                });
                break;
            default:
                break;
        }

    },

    onCloseTag: function (event) {
        // close tag
        // var tagName = event.tagName; // String
        // var pos = event.pos; // Integer
        // console.log (event.type, event);
        switch (event.tagName) {
            case 'group':
                groupDepth--;
                break;
            case 'world':
                currentWorld = null;
                resetGroups ();
                break;
            case 'script':
                if (!scripts [currentWorld]) scripts [currentWorld] = {
                    update: "",
                    setup: ""
                };
                scripts [currentWorld] [currentScript.type] += "\n" + currentScript.body;
                currentScript = null;
                break;
            case 'text':
                worlds [currentWorld].addText (currentText);
                currentText = null;
            default:
                break;
        }
        

    },

    onDeclaration: function (event) {
        // Declaration
        // <?<value>?>
        // Example: <?xml version="1.0" encoding="UTF-8" ?>
        // var value = event.value; // String
        // var pos = event.pos; // Integer
        // console.log (event.type, event);
    },

    onComment: function (event) {
        // Text within XML comment
        // var value = event.value; // String
        // var pos = event.pos; // Integer
        // console.log (event.type, event);
    },

    onScriptlet: function (event) {
        // Text within <% %>
        // var value = event.value; // String
        // console.log (event.type, event);
        // var pos = event.pos; // Integer
    },

    onError: function (event) {
        // Error
        // var message = event.message; // String
        // var code = event.code; // String
        // var pos = event.pos; // Integer
        console.log (event.type, event);
    },

    onDocumentType: function (event) {
        // Document Type/DTD
        // <!<value>>
        // Example: <!DOCTYPE html>
        // var value = event.value; // String
        // console.log (event.type, event.value);
        if (event.value !== 'DOCTYPE qgml') {
            // stop the execution, its not a qgml file
        }
    },
});

let compile = async (input, output, include = [], standalone = false) => {
    let compileStartTime = process.hrtime ();
    let outstr = "";
    originalInput = input;
    originalOutput = output;
    originalInclude = include;
    if (!standalone) include = ['p5.min.js', 'qgml-core.min.js' , ...include]

    inputPath = path.isAbsolute (input) ? input : path.join (process.cwd (), input);
    outputPath = output && (path.isAbsolute (output) ? output : path.join (process.cwd (), output)) || inputPath + '.js';
    
    console.log (`\nCompiling ${inputPath}`, ' -> ', outputPath);
    if (fs.existsSync (inputPath)) {
        console.log (`Reading ${inputPath}`);
        try {
            let str = fs.readFileSync (inputPath, 'utf8');
            parser.parse (str);

            for (incl of include) {
                if (include )
                if (path.isAbsolute (incl)) {
                    outstr += `\n/* ${path.basename (incl)} */\n` + fs.readFileSync (incl, 'utf-8');
                    console.log ("Including", incl);
                } else {
                    let inclPath = "";
                    // try to find it in the includes folder, otherwise check in the directory where the command was given
                    if (fs.existsSync (path.join (__dirname, `../includes/${incl}`))) {
                        inclPath = path.join (__dirname, `../includes/${incl}`);
                        outstr += `\n/* ${path.basename (incl)} */\n` + fs.readFileSync (inclPath);
                    } else {
                        inclPath = path.join (process.cwd (), incl);
                        outstr += `\n/* ${path.basename (incl)} */\n` + fs.readFileSync (inclPath);
                    }
                    console.log ("Including", inclPath);
                }
            }


            config ['worlds'] = Object.values (worlds);

            console.log ('Processing assets');
            for (let i = 0; i < config.worlds.length; i++) {
                for (let j = 0; j < config.worlds [i].actors.length; j++) {
                    await config.worlds [i].actors [j].processAssets (assets, inputPath);
                }
                // for (let j = 0; j < config.worlds [i].actorTemplates.length; j++) {
                //     await config.worlds [i].actorTemplates [j].processAssets (assets, inputPath);
                // }
                for (let j = 0; j < config.worlds [i].texts.length; j++) {
                    config.worlds [i].texts [j].processAssets (inputPath);
                }
            }
            for (let i = 0; i < actorTemplates.length; i++) {
                await actorTemplates [i].processAssets (assets, inputPath);
            }
            console.log ('Done processing assets');

            config ['defaultWorld'] = defaultWorld || Object.values (worlds) [0].id;
            config ['vars'] = vars;
            config ['keymappers'] = keymappers;
            config ['scripts'] = scripts;
            config ['assets'] = assets;
            config ['actor-templates'] = actorTemplates;
            
            outstr += `let qgml_config = ${JSON.stringify (config)};QGML.setup (qgml_config);`;

            fs.writeFileSync (outputPath, outstr);
            console.log (`Done writing output file ${outputPath}\nSize: ${fs.statSync (outputPath).size} bytes`);

            resetVars ();
            resetGroups ();
            resetKeymappers ();
            resetScripts ();
            resetAssets ();
            resetTemplates ();

            let compileEndTime = process.hrtime (compileStartTime);
            console.info ('Compilation time: %dms', compileEndTime [1] / 1000000);
        } catch (error) {
            throw error;
        }
    } else throw new Error ('Input file does not exist');
    return outstr;
}

module.exports = {
    compile: compile, 
    async serve (port, js) {
        http.listen (port || 8000, () => {
            io.on ('connection', socket => {
                socket.emit ('js-inject', js);
            });
            fs.watchFile (inputPath, { interval: 500 }, async (curr, prev) => {
                js = await compile (originalInput, originalOutput, originalInclude);
                io.sockets.emit ('refresh');
            });
            console.log (`serving game on http://localhost:${port || 8000}`);
        });
    }
}