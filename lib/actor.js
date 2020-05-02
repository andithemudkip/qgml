const { randomID } = require ('./rand');
const sharp = require ('sharp');
const path = require ('path');

module.exports = class Actor {
    constructor () {
        this.group = null;
        this.state = "";
        this.sprite = null;
        this.animator = null;
        this.customSetup = null;
        this.customUpdate = null;
        this.isTemplate = false;
        this.className = null;
    }
    setConfigFromAttribs (attribs) {
        let actorID = attribs.find (a => a.name === 'id');
        this.id = actorID ? actorID.literalValue : `actor-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        if (state) this.state = state.value;
        let animator = attribs.find (a => a.name === 'animator');
        if (animator) this.animator = eval (animator.value);
        let sprite = attribs.find (a => a.name === 'sprite');
        if (sprite) this.sprite = eval (sprite.value);
        let customUpdate = attribs.find (a => a.name === 'update');
        if (customUpdate) this.customUpdate = customUpdate.value;
        let customSetup = attribs.find (a => a.name === 'setup');
        if (customSetup) this.customSetup = customSetup.value;
        let className = attribs.find (a => a.name === 'class');
        if (className) this.className = className.literalValue;
    }

    async processAssets (assets, baseFile) {
        if (this.animator) {
            for (let i = 0, sets = Object.keys (this.animator.spritesheets); i < sets.length; i++) {
                this.animator.spritesheets [sets [i]].name = `sheet-${randomID (16)}`;
                let set = this.animator.spritesheets [sets [i]];
                let frames = [];
                if (set.strip) { // strip
                    let stripPath = path.join (path.dirname (baseFile), set.strip);
                    let img = sharp (stripPath);
                    let meta = await img.metadata ();
                    let tileSize = set.tileSize ? set.tileSize : {
                        width: meta.width / set.frames,
                        height: meta.height
                    };
                    for (let j = 0; j < set.frames; j++) {
                        let frame = await img.clone ().extract ({ left: j * tileSize.width, top: 0, width: tileSize.width, height: tileSize.height });
                        let buf = await frame.toBuffer ();
                        let base64 = `data:image/${meta.format};base64,` + buf.toString ('base64');
                        frames [j] = base64;
                    }
                    delete set.strip;
                    delete set.frames;
                } else if (set.frames) { // array of frames
                    for (let j = 0; j < set.frames.length; j++) {
                        let framePath = path.join (path.dirname (baseFile), set.frames [j]);
                        let img = sharp (framePath);
                        let meta = await img.metadata ();
                        let buf = await img.toBuffer ();
                        let base64 = `data:image/${meta.format};base64,` + buf.toString ('base64');
                        frames [j] = base64;
                    }
                }
                assets.spritesheets.push ({
                    name: set.name,
                    frames,
                    frameTime: set.frameTime
                });
            }
        } else if (this.sprite) {
            console.log (baseFile, this.sprite);
            let spritePath = path.join (path.dirname (baseFile), this.sprite);
            let img = sharp (spritePath);
            let meta = await img.metadata ();
            let buf = await img.toBuffer ();
            let base64 = `data:image/${meta.format};base64,` + buf.toString ('base64');
            this.sprite = { name: `sprite-${randomID (16)}` }
            assets.sprites.push ({
                name: this.sprite.name,
                image: base64
            });
        }
    }
}
