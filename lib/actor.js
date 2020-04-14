const { randomID } = require ('./rand');

module.exports = class Actor {
    constructor () {
        this.group = null;
        this.state = "";
    }
    setConfigFromAttribs (attribs) {
        let actorID = attribs.find (a => a.name === 'id');
        this.id = actorID ? actorID.literalValue : `actor-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        if (state) this.state = state.value;
    }
}