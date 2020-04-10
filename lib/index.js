const fs = require ('fs');
const path = require ('path');

const express = require ('express');
const app = express ();
app.use (express.static (path.join (__dirname, '../serve')));
// console.log (path.join (__dirname, '../serve'));
let http = require ('http').createServer (app);
let io = require ('socket.io') (http);

const World = require ('./world');
const Group = require ('./group');
const Actor = require ('./actor');

// const randomID = n => Math.random ().toString (36).substr (2, n);
const { randomID } = require ('./rand');

let vars = {};

// groups

let groupDepth, groupNames;
let resetGroups = () => {
    groupDepth = 0;
    groupNames = [null];
}
resetGroups ();



let actors = [];

let worlds = {};
let currentWorld;
let defaultWorld;

let outputPath;
let inputPath;

let originalInclude;
let originalInput;
let originalOutput;

let parser = require ('htmljs-parser').createParser ({
    onText: function (event) {
        // Text within an HTML element
        // var value = event.value;
        // console.log (event.type, event);
    },

    onPlaceholder: function (event) {
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

    onOpenTag: function (event) {
        // var tagName = event.tagName; // String
        // var attributes = event.attributes; // Array
        // var argument = event.argument; // Object
        // var pos = event.pos; // Integer
        switch (event.tagName) {
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
                break;
            case 'script':

                break;
            case 'keymapper':
                // console.log (event);
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
                resetGroups ();
                // worlds [currentWorld].addGroups (groups);
                // groups = [];
                break;
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
        if (event.value !== 'DOCTYPE gml') {
            // stop the execution, its not a gml file
        }
    },
});

let compile = (input, output, include = []) => {
    let outstr = "";
    originalInput = input;
    originalOutput = output;
    originalInclude = include;
    include = ['p5.min.js', 'gml-core.js' , ...include];
    inputPath = path.isAbsolute (input) ? input : path.join (process.cwd (), input);
    outputPath = output && (path.isAbsolute (output) ? output : path.join (process.cwd (), output)) || inputPath + '.js';
    
    console.log (inputPath, ' -> ', outputPath);
    if (fs.existsSync (inputPath)) {
        console.log (`Reading ${inputPath}`);
        try {
            let str = fs.readFileSync (inputPath, 'utf8');
            parser.parse (str);

            for (incl of include) {
                if (include )
                if (path.isAbsolute (incl)) {
                    outstr += `\n/* ${path.basename (incl)} */\n` + fs.readFileSync (incl, 'utf-8');
                } else {
                    // try to find it in the includes folder, otherwise check in the directory where the command was given
                    if (fs.existsSync (path.join (__dirname, `../includes/${incl}`))) {
                        outstr += `\n/* ${path.basename (incl)} */\n` + fs.readFileSync (path.join (__dirname, `../includes/${incl}`));
                    } else {
                        outstr += `\n/* ${path.basename (incl)} */\n` + fs.readFileSync (path.join (process.cwd (), incl));
                    }
                }
            }

            let config = {
                worlds: Object.values (worlds),
                rootElementID: 'gml-game',
                defaultWorld: defaultWorld || Object.values (worlds) [0].id,
                width: 300,
                height: 300,
                assets: {}
            }

            outstr += `
                let gml_config = ${JSON.stringify (config, null, 4)};

                GML.setup (gml_config);
            `;

            fs.writeFileSync (outputPath, outstr);
            console.log (`Done writing output file ${outputPath}\nSize: ${fs.statSync (outputPath).size} bytes`);

            // console.log (include);
            // for (i in worlds) {
                // console.log (i);
                // console.log (worlds [i]);
                // worlds [i].actors.forEach (console.log);
                // console.log (worlds [i].actors);
            // }
            
        } catch (error) {
            throw error;
        }
    } else throw new Error ('Input file does not exist');
    return outstr;
}

module.exports = {
    compile: compile, 
    serve (port, js) {
        fs.writeFileSync (path.join (__dirname, '../serve/gml-game.js'), js);
        http.listen (port || 8000, () => {
            console.log (`serving game on ${port || 8000}`);
            // io.on ('connection', function (socket) {
                // console.log ('a user connected');
            // });
            fs.watchFile (inputPath, { interval: 500 }, (curr, prev) => {
                js = compile (originalInput, originalOutput, originalInclude);
                fs.writeFileSync (path.join (__dirname, '../serve/gml-game.js'), js);
                io.sockets.emit ('refresh');
            });
        });
    }
}