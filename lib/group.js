const { randomID } = require ('./rand');

module.exports = class Group {
    constructor (world, parent) {
        this.parent = parent;
        this.world = world;
        this.state = "";
    }

    setConfigFromAttribs (attribs) {
        let groupName = attribs.find (a => a.name === 'id');
        this.name = groupName ? groupName.literalValue : `group-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        if (state) this.state = state.value;
    }
}