
module.exports = class World {
    constructor (id) {
        this.id = id;
        this.state = {};
        this.groups = [];
        this.actors = [];
        this.texts = [];
        this.default = false;
    }

    addGroups (groups) {
        this.groups = this.groups.concat (groups);
    }

    addGroup (group) {
        this.groups.push (group);
    }

    addActor (actor) {
        this.actors.push (actor);
    }

    addText (text) {
        this.texts.push (text);
    }

    setConfigFromAttribs (attribs) {
        this.default = attribs.find (a => a.name === 'default') ? true : false;
    }
}