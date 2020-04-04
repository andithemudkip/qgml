#!/usr/bin/env node

const commandLineArgs = require ('command-line-args')
const commandLineUsage = require ('command-line-usage')

const gml = require ('../lib/index');

const optionDefinitions = [{
      name: 'help',
      alias: 'h',
      type: Boolean,
      description: 'Display this usage guide.'
    }, {
      name: 'src',
      alias: 's',
      type: String,
      multiple: false,
      description: 'The input file to compile',
      typeLabel: '<file>'
    }, {
        name: 'output',
        alias: 'o',
        type: String,
        multiple: false,
        description: 'The output filename (default: <input_filename>.gameml.js)'
    }]

const options = commandLineArgs (optionDefinitions);


if (options.help) {
    const usage = commandLineUsage ([{
            header: "Game Markup Language",
            content: "A CLI for compiling gameml files to JavaScript",
        }, {
            header: "Options",
            optionList: optionDefinitions,
        }, {
            content: "Project home: {underline https://github.com/andithemudkip/game-ml}",
    }]);
    console.log (usage);
} else {
    console.log (options);
    console.log (process.argv);
}


// lib.doStuff ();
// console.)