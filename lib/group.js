const { randomID } = require ('./rand');

module.exports = class Group {
    constructor (world, parent) {
        this.parent = parent;
        this.world = world;
        this.state = "";
        this.customSetup = null;
        this.customUpdate = null;
        this.className = null;
    }

    setConfigFromAttribs (attribs) {
        let groupName = attribs.find (a => a.name === 'id');
        this.name = groupName ? groupName.literalValue : `group-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        if (state) this.state = state.value;
        let customUpdate = attribs.find (a => a.name === 'update');
        if (customUpdate) this.customUpdate = customUpdate.value;
        let customSetup = attribs.find (a => a.name === 'setup');
        if (customSetup) this.customSetup = customSetup.value;
        let className = attribs.find (a => a.name === 'class');
        if (className) this.className = className.literalValue;
    }
}