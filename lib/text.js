const { randomID } = require ('./rand');

module.exports = class GMLText {
    constructor () {
        this.group = null;
        this.state = "";
        this.value = "";
    }
    setConfigFromAttribs (attribs) {
        let textID = attribs.find (a => a.name === 'id');
        this.id = textID ? textID.literalValue : `text-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        if (state) this.state = state.value;
    }
}