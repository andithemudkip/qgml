const fs = require ('fs');

let parser = require ('htmljs-parser').createParser ({
    onText: function (event) {
        // Text within an HTML element
        // var value = event.value;
        console.log (event.type, event);
    },

    onPlaceholder: function(event) {
        //  ${<value>]} // escape = true
        // $!{<value>]} // escape = false
        // var value = event.value; // String
        // var escaped = event.escaped; // boolean
        // var withinBody = event.withinBody; // boolean
        // var withinAttribute = event.withinAttribute; // boolean
        // var withinString = event.withinString; // boolean
        // var withinOpenTag = event.withinOpenTag; // boolean
        // var pos = event.pos; // Integer
        console.log (event.type, event);
    },

    onString: function(event) {
        // Text within ""
        // var value = event.value; // String
        // var stringParts = event.stringParts; // Array
        // var isStringLiteral = event.isStringLiteral // Boolean
        // var pos = event.pos; // Integer
        console.log (event.type, event);
    },

    onOpenTag: function(event) {
        // var tagName = event.tagName; // String
        // var attributes = event.attributes; // Array
        // var argument = event.argument; // Object
        // var pos = event.pos; // Integer
        console.log (event.type, event);
    },

    onCloseTag: function(event) {
        // close tag
        // var tagName = event.tagName; // String
        // var pos = event.pos; // Integer
        console.log (event.type, event);
    },

    onDeclaration: function(event) {
        // Declaration
        // <?<value>?>
        // Example: <?xml version="1.0" encoding="UTF-8" ?>
        // var value = event.value; // String
        // var pos = event.pos; // Integer
        console.log (event.type, event);
    },

    onComment: function(event) {
        // Text within XML comment
        // var value = event.value; // String
        // var pos = event.pos; // Integer
        console.log (event.type, event);
    },

    onScriptlet: function(event) {
        // Text within <% %>
        // var value = event.value; // String
        console.log (event.type, event);
        // var pos = event.pos; // Integer
    },

    onError: function(event) {
        // Error
        // var message = event.message; // String
        // var code = event.code; // String
        // var pos = event.pos; // Integer
        console.log (event.type, event);
    }
});

module.exports = {
    compile (input, output) {
        console.log (input);
        if (fs.existsSync (input)) {
            console.log (`Reading ${input}`);
            try {
                let str = fs.readFileSync (input, 'utf8');
                parser.parse (str);
                // console.log (str); 
            } catch (error) {
                throw error;
            }
        } else throw new Error ('Input file does not exist');
    }
}