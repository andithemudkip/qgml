const { randomID } = require ('./rand');
const fs = require ('fs');
const path = require ('path');

module.exports = class GMLText {
    constructor () {
        this.group = null;
        this.state = "";
        this.value = "";
        this.font = null;
        this.customSetup = null;
        this.customUpdate = null;
    }
    setConfigFromAttribs (attribs) {
        let textID = attribs.find (a => a.name === 'id');
        this.id = textID ? textID.literalValue : `text-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        if (state) this.state = state.value;
        let font = attribs.find (a => a.name === "font");
        if (font) this.font = font.literalValue;
        let customUpdate = attribs.find (a => a.name === 'update');
        if (customUpdate) this.customUpdate = customUpdate.value;
        let customSetup = attribs.find (a => a.name === 'setup');
        if (customSetup) this.customSetup = customSetup.value;
    }
    processAssets (baseFile) {
        if (this.font) {
            let fontPath = path.join (path.dirname (baseFile), this.font);
            if (fs.existsSync (fontPath)) {
                console.warn ('[!] Currently, only web safe fonts are supported.');
                this.font = {
                    
                }
            } else {
                this.font = {
                    type: 'web',
                    name: this.font
                }
            }
        }
    }
}