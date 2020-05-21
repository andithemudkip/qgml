const { randomID } = require ('./rand');
const sharp = require ('sharp');
const path = require ('path');

module.exports = class Actor {
    constructor () {
        this.path = null;
        this.id = "";
    }
    setConfigFromAttribs (attribs) {
        let spriteId = attribs.find (a => a.name === 'id');
        this.id = spriteId ? spriteId.literalValue : `sprite-${ randomID (16) }`;
        let spritePath = attribs.find (a => a.name === 'path');
        if (spritePath) this.path = eval (spritePath.value);
    }

    async processAssets (assets, baseFile) {
        if (this.path) {
            let spritePath = path.join (path.dirname (baseFile), this.path);
            let img = sharp (spritePath);
            let meta = await img.metadata ();
            let buf = await img.toBuffer ();
            let base64 = `data:image/${meta.format};base64,` + buf.toString ('base64');
            assets.sprites.push ({
                name: this.id,
                image: base64
            });
        }
    }
}
