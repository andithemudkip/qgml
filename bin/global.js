#!/usr/bin/env node

const commandLineArgs = require ('command-line-args');
const commandLineUsage = require ('command-line-usage');
const fs = require ('fs');
const { compile, serve } = require ('../lib/index');



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
    }, {
        name: 'include',
        alias: 'i',
        type: String,
        multiple: true,
        typeLabel: '<files>',
        description: `Other JavaScript files to include in the bundled file (ex: matter.min.js, path/to/file.js). If the path is relative, it will first look in the "includes" directory of this module, if it can't find the file there, it will look for it in the directory where you called 'game-ml'\nThis module ships with matter.min.js, p5.min.js.`
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

    let str = compile (options.src, options.output, options.include);

    if (options.serve) {
        // start server after compiling
        serve (options.serve, str);
    }

} else {
    console.log (options);
}
