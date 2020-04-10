const { randomID } = require ('./rand');

module.exports = class Group {
    constructor (world, parent) {
        this.parent = parent;
        this.world = world;
        this.state = {
            position: {
                x: 0,
                y: 0
            },
            size: {
                width: 0,
                height: 0
            }
        }
    }

    setConfigFromAttribs (attribs) {
        let groupName = attribs.find (a => a.name === 'id');
        this.name = groupName ? groupName.literalValue : `group-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        state ? Object.assign (this.state, eval (state.value)) : null;
    }
}