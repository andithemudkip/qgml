#!/usr/bin/env node

const commandLineArgs = require ('command-line-args');
const commandLineUsage = require ('command-line-usage');
const path = require ('path');
const { compile } = require ('../lib/index');

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
        description: 'The output filename (default: <input_filename>.js)',
        typeLabel: '<file>'
    }, {
        name: 'serve',
        type: Number,
        typeLabel: '<port>',
        description: 'Start a server on the specified port hosting the compiled game'
    }]

const options = commandLineArgs (optionDefinitions);

if (options.help) {
    const usage = commandLineUsage ([{
            header: "Game Markup Language",
            content: "A CLI for compiling game-ml files to JavaScript",
        }, {
            header: "Options",
            optionList: optionDefinitions,
        }, {
            content: "Project home: {underline https://github.com/andithemudkip/game-ml}",
    }]);
    console.log (usage);
} else if (options.src) {
    let inputPath = path.isAbsolute (options.src) ? options.src : path.join (process.cwd (), options.src);
    let outputPath = options.output && (path.isAbsolute (options.output) ? options.output : path.join (process.cwd (), options.output)) || inputPath + '.js';

    console.log (inputPath, '->', outputPath);

    compile (inputPath, outputPath);


    if (options.serve) {
        // start server after compiling
    }

} else {
    console.log (options);
}
