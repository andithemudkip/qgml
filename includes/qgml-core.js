let randomID = n => {
    // https://stackoverflow.com/a/48031564/10015942
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < n; i++) {
        token += chars [Math.floor (Math.random () * chars.length)];
    }
    return token;
}

class QGML {
    constructor () {
        this.p5 = null;
        this.gameManager = null;
    }
    static setup (config) {
        this.width = config.width;
        this.height = config.height;
        this.debug = config.debug;
        this.gameManager = new this.GameManager (config);
        this.gameManager.createWorlds ();
        this.ctx = new QGML.Context ();
        this.gameManager.createKeymappers ();
        

        this.preload = function (p) {
            for (let i = 0, texts = QGML.World.current.texts; i < texts.length; i++) {
                texts [i].preload (p);
            }
        }

        this.setup = function (p) {
            QGML.ctx.setVar ('p5', p);

            p.background (50);
            p.fill (255);
            p.frameRate (60); //idk why it doesn't work

            for (let i = 0, actors = QGML.World.current.actors; i < actors.length; i++) {
                actors [i].setup (p);
            }

            for (let i = 0, groups = QGML.World.current.groups; i < groups.length; i++) {
                groups [i].setup (p);
            }

            if (QGML.gameManager.scripts [QGML.World.current.id])
                QGML.ctx.eval (QGML.gameManager.scripts [QGML.World.current.id] ['setup']);
        }

        this.p5 = new p5 (QGML.createSketch (config), config.rootElementID);
    }

    static createSketch (config) {
        const { width, height, assets } = config;

        return function (p) {
            p.preload = function () {
                for (let i = 0, sheets = assets.spritesheets; i < sheets.length; i++) {
                    for (let j = 0; j < sheets [i].frames.length; j++) {
                        assets.spritesheets [i].frames [j] = p.loadImage (sheets [i].frames [j]);
                    }
                }

                for (let i = 0, sprites = assets.sprites; i < sprites.length; i++) {
                    assets.sprites [i].image = p.loadImage (sprites [i].image);
                }

                QGML.gameManager.assets = assets;

                QGML.preload (p);
            }
            p.setup = function () {
                let canvas = p.createCanvas (width, height);
                QGML.setup (p);
            }
            p.draw = function () {
                if (QGML.debug && p.frameCount % 60 === 0) {
                    performance.mark ('start-of-draw');
                }
                
                p.background (50);
                for (let i = 0, n = QGML.gameManager.currentGroups.length; i < n; i++) {
                    QGML.gameManager.currentGroups [i].update ();
                }

                for (let i = 0, n = QGML.gameManager.currentActors.length; i < n; i++) {
                    QGML.gameManager.currentActors [i].draw (p);
                }

                for (let i = 0, n = QGML.gameManager.currentTexts.length; i < n; i++) {
                    QGML.gameManager.currentTexts [i].draw (p);
                }
                if (QGML.gameManager.keymappers [QGML.World.current.id]) {
                    for (let i = 0,
                        keys = Object.keys (QGML.gameManager.keymappers [QGML.World.current.id].keys ["down"]),
                        n = keys.length; i < n; i++) {
                           if (p.keyIsDown (keys [i])) {
                               QGML.gameManager.keymappers [QGML.World.current.id].keys ["down"] [keys [i]] ();
                           }
                   }
   
                   for (let i = 0,
                       groups = QGML.gameManager.keymappers [QGML.World.current.id].groups ["down"];
                       i < groups.length; i++) {
                           groups [i].checkKeysDown (p);
                   }

                   for (let i = 0,
                    keys = Object.keys (QGML.gameManager.keymappers [QGML.World.current.id].keys ["up"]),
                        n = keys.length; i < n; i++) {
                        if (!p.keyIsDown (keys [i])) {
                            QGML.gameManager.keymappers [QGML.World.current.id].keys ["up"] [keys [i]] ();
                        }
                    }

                    for (let i = 0,
                        groups = QGML.gameManager.keymappers [QGML.World.current.id].groups ["up"];
                        i < groups.length; i++) {
                            groups [i].checkKeysUp (p);
                    }
   
                }

                if (QGML.gameManager.scripts [QGML.World.current.id])
                    QGML.ctx.eval (QGML.gameManager.scripts [QGML.World.current.id] ['update']);

                if (QGML.debug) {
                    p.fill (255);
                    p.text (`${Math.round (QGML.frameRate)} fps`, 5, 15);
                    p.text (`${QGML.frameTime.toFixed (3)} ms frame time`, 5, 35);
                    p.text (`${QGML.World.current.actors.length} actors`, 5, 55);

                    if (p.frameCount % 60 == 0) {
                        performance.measure ('measure frame time', 'start-of-draw');
                        let perf = performance.getEntriesByName ('measure frame time');
                        QGML.frameTime = perf [0].duration;
                        QGML.frameRate = p.frameRate ();
                        performance.clearMeasures ();
                    }
                }
            }
            p.keyPressed = function () {
                if (QGML.gameManager.keymappers [QGML.World.current.id]) {
                    if (QGML.gameManager.keymappers [QGML.World.current.id].keys ["pressed"] [p.keyCode]) {
                        QGML.gameManager.keymappers [QGML.World.current.id].keys ["pressed"] [p.keyCode] ();
                    }
    
                    for (let i = 0,
                        groups = QGML.gameManager.keymappers [QGML.World.current.id].groups ["pressed"];
                        i < groups.length; i++) {
                            groups [i].checkKey (String.fromCharCode (p.keyCode).toLowerCase ());
                    }
                }
                
            }
            p.keyReleased = function () {
                if (QGML.gameManager.keymappers [QGML.World.current.id]) {
                    if (QGML.gameManager.keymappers [QGML.World.current.id].keys ["released"] [p.keyCode]) {
                        QGML.gameManager.keymappers [QGML.World.current.id].keys ["released"] [p.keyCode] ();
                    }
    
                    for (let i = 0,
                        groups = QGML.gameManager.keymappers [QGML.World.current.id].groups ["released"];
                        i < groups.length; i++) {
                            groups [i].checkKey (String.fromCharCode (p.keyCode).toLowerCase ());
                    }
                }
            }
        }
    }
}

// QGML.debug = true;
QGML.frameRate = 0;
QGML.frameTime = 0;

QGML.Context = function () {
    var _gmlVars = QGML.gameManager ? Object.assign ({},
        QGML.gameManager.vars ['global'],
        QGML.gameManager.vars [QGML.gameManager.selectedWorld.id]) : [];

    let keys = Object.keys (_gmlVars);

    for (key of keys) {
        try {
            eval (`var ${key} = ${_gmlVars [key]};`);
        } catch (err) {
            eval (`var ${key} = "${_gmlVars [key]}";`);
        }
    }

    /* user call-able functions here */

    function spawn (entityClass, state) {
        let toReturn = null;
        let template = QGML.gameManager.actorTemplates.find (t => t.self.id === entityClass);
        if (template) { // its an actor
            let instance = template.Create (state)
            QGML.World.current.actors.push (instance);
            toReturn = instance;
        } else {
            template = QGML.gameManager.textTemplates.find (t => t.self.id === entityClass);
            if (template) { // its a text
                let instance = template.Create (state);
                QGML.World.current.texts.push (instance);
                toReturn = instance;
            }
        }
        return toReturn;
    }

    function destroy (entity) {
        if (entity instanceof QGML.Actor) {
            // remove the actor from QGML.World.current
            QGML.World.current.actors.splice (QGML.World.current.actors.indexOf (entity), 1);
        } else if (entity instanceof QGML.Group) {
            // recursively remove all children of the group, then remove the group
        } else if (entity instanceof QGML.Text) {
            // remove the text from QGML.World.current
        }
    }

    function overlaps (actor1, actor2) {
        if (actor1 instanceof QGML.Actor && actor2 instanceof QGML.Actor) {
            let pos1 = actor1.getPosition ();
            let pos2 = actor2.getPosition ();
            return (pos1.x < pos2.x + actor2.state.size.width &&
                    pos1.x + actor1.state.size.width > pos2.x &&
                    pos1.y < pos2.y + actor2.state.size.height &&
                    pos1.y + actor1.state.size.height > pos2.y);
        } else {
            console.log ('Both arguments passed to `overlaps` must be QGML actors');
        }
    }

    function loadWorld (str) {
        QGML.gameManager.loadWorld (str);
    }

    function getPosition (entity) {
        return entity.getPosition ();
    }

    function dist (x1, y1, x2, y2) {
        if (x1.state && y1.state) {
            return Math.hypot (getPosition (x1).x - getPosition (y1).x, getPosition (x1).y - getPosition (y1).y);
        } else return Math.hypot (x2 - x1, y2 - y1)
    }

    function getActor (id) {
        return QGML.World.current.actors.find (a => a.id === id);
    }

    function getActorsByClass (cl) {
        return QGML.World.current.actors.filter (a => a.class === cl);
    }

    function getGroupsByClass (cl) {
        return QGML.World.current.groups.filter (g => g.class === cl);
    }

    function getGroup (id) {
        return QGML.World.current.groups.find (g => g.name === id);
    }

    this.eval = function (str, context) {
        let res;
        if (context) {
            res = eval (str).bind (context);
        } else {
            res = eval (str);
        }
        if (QGML.gameManager.vars [QGML.World.current.id]) {
            for (key of keys) {
                if (key in QGML.gameManager.vars [QGML.World.current.id]) {
                    QGML.gameManager.setVar (QGML.World.current.id, key, eval (key));
                } else {
                    QGML.gameManager.setVar ('global', key, eval (key));
                }
            }
        }
        
        return res;
    }

    this.setVar = function (name, value) {
        this [name] = value;
    }
}

QGML.Keymapper = class Keymapper {
    constructor (obj) {
        this.keys = {
            down: {},
            up: {},
            pressed: {},
            released: {}
        }

        this.groups = {
            down: [],
            up: [],
            pressed: [],
            released: []
        }

        /*
        events:
            down - will fire every frame while the key is held down
            up - will fire every frame while the key is not held down
            pressed - will fire once when the key is pressed [DEFAULT]
            released - will fire once when the key is released
        */
        
        Object.keys (obj).forEach (key => {
            let opts = key.split ('|');
            let keyCode = QGML.Keymapper.keyCodeFromString (opts [0]);
            if (keyCode) {
                this.keys [opts [1] || 'pressed'] [keyCode] = QGML.ctx.eval (obj [key]);
            } else {
                let group = QGML.Keymapper.groupFromString (opts [0], obj [key]);
                if (group)
                    this.groups [opts [1] || pressed].push (group);
            }
        });
    }

    static groupFromString (str, toexec) {
        if (str.startsWith ('[') && str.endsWith (']')) {
            str = str.slice (1, str.length - 1);
            let keys = str.split (',');
            let obj = {
                keys: {},
                do: QGML.ctx.eval (toexec),
                checkKey (key) {
                    if (key in this.keys) {
                        this.keys [key] = true;
                        let shouldExecute = true;

                        for (let k in this.keys) {
                            if (!this.keys [k]) shouldExecute = false;
                        }

                        if (shouldExecute) {
                            this.do ();
                            for (let k in this.keys) {
                                this.keys [k] = false;
                            }
                        }
                    } else return false;
                },
                checkKeysDown (p) {
                    let shouldExecute = true;
                    for (let k in this.keys) {
                        if (!p.keyIsDown (QGML.Keymapper.keyCodeFromString (k))) {
                            shouldExecute = false;
                        }
                    }
                    if (shouldExecute) {
                        this.do ();
                    }
                },
                checkKeysUp (p) {
                    let shouldExecute = true;
                    for (let k in this.keys) {
                        if (p.keyIsDown (QGML.Keymapper.keyCodeFromString (k))) {
                            shouldExecute = false;
                        }
                    }
                    if (shouldExecute) {
                        this.do ();
                    }
                }
            }
            for (let i = 0; i < keys.length; i++) {
                obj.keys [keys [i]] = false
            }
            return obj;
        } else return null;
    }

    static keyCodeFromString (str) {
        let keyCode = 0;
        if (Number (str)) {
            keyCode = Number (str);
        } else {
            if (str.length === 1) {
                keyCode = str.toUpperCase ().charCodeAt (0);
            } else {
                Object.keys (QGML.Keymapper.keyTable).forEach (key => {
                    if (str.toUpperCase () === key) {
                        keyCode = QGML.Keymapper.keyTable [key];
                    }
                })
            }
        }
        return keyCode;
    }
}

QGML.Keymapper.keyTable = {
    BACKSPACE: 8,
    DELETE: 46,
    ENTER: 13,
    RETURN: 13,
    TAB: 9,
    ESCAPE: 27,
    SHIFT: 16,
    CONTROL: 17,
    OPTION: 18,
    ALT: 18,
    UP_ARROW: 38,
    DOWN_ARROW: 40,
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
    SPACE: 32
}

QGML.Text = class Text {
    constructor ({ group = null, state = "", value = "", id = 'default-text', font = {} }, worldObj) {
        this.id = id;
        this.group = worldObj.groups.find (grp => grp.name === group);
        this.state = {
            position: {
                x: 0,
                y: 0
            },
            color: null,
            stroke: null
        }
        this.value = value;
        this.originalValue = value;
        this.originalState = state;
        this.font = font;
    }

    preload (p) {
        if (this.font.type === 'file') {
            this.font = p.loadFont (this.font.base64);
        } else if (this.font.type === 'web') {
            this.font = this.font.name;
        } else {
            this.font = null;
        }
    }

    setup (p) {

    }

    draw (p) {
        p.push ();
        let pos = {
            x: this.state.position.x,
            y: this.state.position.y
        }
        if (this.group) {
            pos.x += this.group.absolutePosition.x;
            pos.y += this.group.absolutePosition.y;
        }

        if (this.originalState) {
            this.state = QGML.ctx.eval (this.originalState);
            this.value = QGML.ctx.eval ("`" + this.originalValue + "`");
            if (this.state.stroke) {
                p.stroke (p.color (this.state.stroke.color));
                p.strokeWeight (this.state.stroke.weight);
            } else {
                p.noStroke ();
            }
            if (this.state.color) {
                p.fill (p.color (this.state.color));
            } else {
                p.noFill ();
            }
            p.textSize (this.state.size);
            p.textStyle (this.state.style);
            p.textAlign (this.state.align);
            if (this.font) {
                p.textFont (this.font);
            }
        }

        p.text (this.value, pos.x, pos.y);
        p.pop ();
    }
 }

QGML.Actor = class Actor {
    constructor ({ group = null, className = null, state = "", id = 'default-actor', sprite, animator, customUpdate, customSetup }, worldObj) {
        this.id = id;
        this.sprite = sprite;
        this.animator = animator;
        this.class = className;

        this.group = worldObj.groups.find (grp => grp.name === group);
        this.state = {
            position: {
                x: 0,
                y: 0
            },
            size: {
                width: 0,
                height: 0
            },
            color: null,
            stroke: null
        };
        this.originalState = state;

        this.scale = {
            x: 1,
            y: 1,
            set (obj) {
                Object.assign (this, obj);
            }
        }

        this.direction = {
            x: 1,
            y: 1,
            set: (axis, value) => {
                if (axis === 'horizontal') {
                    if (value === 'left' || value === -1) this.direction.x = -1;
                    else if (value === 'right' || value === 1) this.direction.x = 1;
                } else if (axis === 'vertical') {
                    if (value === 'up' || value === 1) this.direction.x = 1;
                    else if (value === 'down' || value === -1) this.direction.x = -1;
                }
            }
        }

        this.flip = {
            horizontal: () => {
                this.direction.x = - this.direction.x;
            },
            vertical: () => {
                this.direction.y = - this.direction.y;
            }
        }

        this.customUpdate = customUpdate;
        this.customSetup = customSetup;
    }

    setup (p) {
        if (this.originalState) {
            this.state = QGML.ctx.eval (this.originalState);
        }
        this.sprite = QGML.Sprite.Create (this.sprite);
        this.animator = QGML.Animator.Create (this.animator);
        if (this.customSetup) {
            QGML.ctx.eval (this.customSetup, this) ();
        }
        if (this.customUpdate) {
            this.customUpdate = QGML.ctx.eval (this.customUpdate, this);
        }
    }

    getPosition () {
        return {
            x: this.state.position.x + (this.group ? this.group.absolutePosition.x : 0),
            y: this.state.position.y + (this.group ? this.group.absolutePosition.y : 0)
        }
    }

    draw (p) {
        if (this.customUpdate) this.customUpdate ();
        if (this.state.size.width && this.state.size.height) {
            p.push ();
            let pos = this.getPosition ();

            let scale = this.scale;

            if (this.state.stroke) {
                p.strokeWeight (this.state.stroke.weight);
                p.stroke (p.color (this.state.stroke.color));
            } else {
                p.noStroke ();
            }

            if (this.state.color) {
                p.fill (p.color (this.state.color));
            } else {
                p.noFill ();
            }
            p.rect (pos.x, pos.y, this.state.size.width, this.state.size.height);
            
            
            if (this.animator) {
                p.imageMode (p.CENTER);
                p.translate (pos.x + this.state.size.width / 2, pos.y + this.state.size.height / 2);
                p.scale (scale.x * this.direction.x, scale.y * this.direction.y);
                p.image (this.animator.getFrame (), 0, 0);
            } else if (this.sprite) {
                p.imageMode (p.CENTER);
                p.translate (pos.x + this.state.size.width / 2, pos.y + this.state.size.height / 2);
                p.scale (scale.x * this.direction.x, scale.y * this.direction.y);
                p.image (this.sprite.get (), 0, 0);
            }
            p.pop ();

        }

        // // update the state
        // if (this.originalState) {
        //     // console.log (typeof this.originalState);
        //     this.state = QGML.ctx.eval (this.originalState);
        // }
        if (this.animator) this.animator.update ();

    }
}

QGML.Template = class Template {
    constructor (self, type) {
        this.self = self;
        this.type = type;
    }

    Create (state) {
        let toReturn = null;
        switch (this.type) {
            case 'actor':
                let actor = new QGML.Actor (this.self, QGML.World.current);
                if (state) actor.state = state;
                actor.class = this.self.id;
                actor.id = `actor-${randomID (16)}`;
                actor.setup ();
                toReturn = actor;
                break;
            case 'text':
                let text = new QGML.Text (this.self, QGML.World.current);
                if (state) text.state = state;
                text.class = this.self.id;
                text.id = `text-${randomID (16)}`;
                text.setup ();
                toReturn = text;
                break;
        }
        
        return toReturn;
    }
}

QGML.Animator = class Animator {
    constructor ({ spritesheets }) {
        this.spritesheets = spritesheets;
        this.selectedSheet = null;
        for (let i = 0, keys = Object.keys (this.spritesheets); i < keys.length; i++) {
            if (this.spritesheets [keys [i]].default) {
                this.selectedSheet = keys [i];
                this.currentFrames = QGML.gameManager.findAsset ('spritesheets', this.spritesheets [keys [i]].name).frames;
                this.frameTime = QGML.gameManager.findAsset ('spritesheets', this.spritesheets [keys [i]].name).frameTime || 1;
            }
        }
        if (!this.selectedSheet) {
            let key = Object.keys (this.spritesheets) [0];
            this.selectedSheet = key;
            this.currentFrames = QGML.gameManager.findAsset ('spritesheets', this.spritesheets [key].name).frames;
            this.frameTime = QGML.gameManager.findAsset ('spritesheets', this.spritesheets [key].name).frameTime || 1;
        }

        this.currentFrame = 0;
        this.count = 0;
        this.lastAnimation = this.selectedSheet;
        this.shouldLoop = true;
        this.afterPlayCb = () => {};
    }

    update () {
        this.count ++;
        if (this.count > this.frameTime) {
            this.nextFrame ();
            this.count = 0;
        }
    }

    nextFrame () {
        if (this.currentFrame + 1 < this.currentFrames.length) {
            this.currentFrame ++;
        } else {
            if (this.shouldLoop) {
                this.currentFrame = 0;
            } else {
                this.afterPlayCb ();
                this.set (this.lastAnimation);
            }
        }
    }

    getFrame () {
        return this.currentFrames [this.currentFrame];
    }

    play (name, cb = () => {}) {
        for (let i = 0, keys = Object.keys (this.spritesheets); i < keys.length; i++) {
            if (keys [i] === name) {
                this.selectedSheet = keys [i];
                this.currentFrames = QGML.gameManager.findAsset ('spritesheets', this.spritesheets [keys [i]].name).frames;
                this.frameTime = QGML.gameManager.findAsset ('spritesheets', this.spritesheets [keys [i]].name).frameTime || 1;
                this.currentFrame = 0;
                this.count = 0;
                this.shouldLoop = false;
                this.afterPlayCb = cb;
            }
        }
    }

    set (name, cb = () => {}) {
        if (name != this.selectedSheet) {
            for (let i = 0, keys = Object.keys (this.spritesheets); i < keys.length; i++) {
                if (keys [i] === name) {
                    this.selectedSheet = keys [i];
                    this.currentFrames = QGML.gameManager.findAsset ('spritesheets', this.spritesheets [keys [i]].name).frames;
                    this.frameTime = QGML.gameManager.findAsset ('spritesheets', this.spritesheets [keys [i]].name).frameTime || 1;
                    this.currentFrame = 0;
                    this.count = 0;
                    this.lastAnimation = this.selectedSheet;
                    this.shouldLoop = true;
                    this.afterPlayCb = cb;
                }
            }
        }
    }

    static Create (animator) {
        if (animator && animator.spritesheets) {
            return new QGML.Animator (animator);
        } else return null;
    }
}

QGML.Sprite = class Sprite {
    constructor ({ name }) {
        this.name = name;
        this.image = QGML.gameManager.findAsset ('sprites', this.name).image;
    }

    get () {
        return this.image;
    }

    set () {
        console.log ('not yet implemented');
    }

    static Create (sprite) {
        if (sprite && sprite.name) {
            return new QGML.Sprite (sprite);
        } else return null;
    }
}

QGML.Group = class Group {
    constructor ({ parent = null, world = 'default-world', className = null, name = 'default-group', state = {}, customUpdate = null, customSetup = null }, worldObj) {
        this.parent = parent;
        this.world = world;
        this.name = name;
        this.class = className;
        
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
        this.originalState = state;
        this.absolutePosition = {
            x: 0,
            y: 0
        }

        this.customUpdate = customUpdate;
        this.customSetup = customSetup;

    }

    getPosition () {
        return this.absolutePosition;
    }

    setup (p) {

        if (this.originalState) {
            this.state = QGML.ctx.eval (this.originalState);
        }

        if (this.customSetup) {
            QGML.ctx.eval (this.customSetup, this) ();
        }
        
        if (this.customUpdate) {
            this.customUpdate = QGML.ctx.eval (this.customUpdate, this);
        }

        this.parentObject = QGML.World.current.groups.find (g => g.name === this.parent);
    }

    update () {
        // if (this.originalState) {
        //     this.state = QGML.ctx.eval (this.originalState);
        this.absolutePosition = this.state.position;
        // }

        if (this.parent) {
            this.absolutePosition = {
                x: this.parentObject.state.position.x + this.state.position.x,
                y: this.parentObject.state.position.y + this.state.position.y
            }
        }

        if (this.customUpdate) {
            this.customUpdate ();
        }
    }
}

QGML.World = class World {
    constructor ({ id = 'default-world', state = {}, groups = [], actors = [], texts = [], events = [] }) {
        this.id = id;
        this.state = state;
        this.groups = groups;
        this.actors = actors;
        this.texts = texts;
        this.events = events;
        this.createEntities = this.createEntities.bind (this);
    }
    createEntities () {
        this.groups = this.groups.map (group => new QGML.Group (group, this));
        this.actors = this.actors.map (actor => new QGML.Actor (actor, this));
        this.texts = this.texts.map (text => new QGML.Text (text, this));
    }
}

QGML.GameManager = class GameManager {
    constructor (config) {
        console.log (config);
        this.config = config;
        this.keymappers = {};
        this.scripts = config.scripts;
        this.assets = config.assets;

        this.actorTemplates = config ['actor-templates'].map (t => new QGML.Template (t, 'actor'));
        this.textTemplates = config ['text-templates'].map (t => new QGML.Template (t, 'text'));

        this.vars = config.vars;
        this.defaultWorld = config.defaultWorld;
        this.selectedWorld = config.defaultWorld;
        
        this.loadWorld = this.loadWorld.bind (this);
        this.findWorld = this.findWorld.bind (this);
        this.createWorlds = this.createWorlds.bind (this);
        this.createKeymappers = this.createKeymappers.bind (this);
        this.findAsset = this.findAsset.bind (this);
        
    }

    createWorlds () {
        this.worlds = this.config.worlds.map (world => new QGML.World (world));
        this.worlds.forEach (world => world.createEntities ());
        this.defaultWorld = this.config.defaultWorld;
        this.selectedWorld = this.defaultWorld;

        this.loadWorld (this.defaultWorld);
    }

    createKeymappers () {
        Object.keys (this.config.keymappers).forEach (key => {
            this.keymappers [key] = new QGML.Keymapper (this.config.keymappers [key]);
        });
    }

    setVar (world, name, value)  {
        this.vars [world] [name] = value;
    }

    loadWorld (world) {
        this.selectedWorld = this.findWorld (world);
        this.currentGroups = this.selectedWorld.groups;
        this.currentActors = this.selectedWorld.actors;
        this.currentTexts = this.selectedWorld.texts;
        QGML.World.current = this.selectedWorld;
        if (QGML.ctx) {
            let p5 = QGML.ctx.p5;
            QGML.preload (p5);
            QGML.setup (p5);
            QGML.ctx = new QGML.Context ();
            QGML.ctx.setVar ('p5', p5);
        }
        
    }

    findWorld (id) {
        return this.worlds.find (world => world.id === id);
    }

    findAsset (type, name) {
        return this.assets [type].find (a => a.name === name) || {};
    }
}