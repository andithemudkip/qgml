const { randomID } = require ('./rand');
const sharp = require ('sharp');
const path = require ('path');

module.exports = class Actor {
    constructor () {
        this.group = null;
        this.state = "";
        this.sprite = null;
        this.animator = null;
    }
    setConfigFromAttribs (attribs) {
        let actorID = attribs.find (a => a.name === 'id');
        this.id = actorID ? actorID.literalValue : `actor-${ randomID (16) }`;
        let state = attribs.find (a => a.name === 'state');
        if (state) this.state = state.value;
        let animator = attribs.find (a => a.name === 'animator');
        if (animator) this.animator = eval (animator.value);
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
                    // to do
                }
                assets.spritesheets.push ({
                    name: set.name,
                    frames,
                    frameTime: set.frameTime
                });
            }
        } else if (this.sprite) {
            // to do
        }
    }
}
