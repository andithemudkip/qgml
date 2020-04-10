const { randomID } = require ('./rand');

module.exports = class Actor {
    constructor () {
        this.group = null;
        this.state = {
            position: {
                x: 0,
                y: 0
            },
            size: {
                width: 0,
                height: 0
            }
        };
    }
    setConfigFromAttribs (attribs) {
        let actorID = attribs.find (a => a.name === 'id');
        this.id = actorID ? actorID.literalValue : `actor-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        state ? Object.assign (this.state, eval (state.value)) : null;
    }
}