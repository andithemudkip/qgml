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

            for (let i = 0, texts = QGML.World.current.texts; i < texts.length; i++) {
                texts [i].setup (p);
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

                for (let i = 0, n = QGML.World.current.groups.length; i < n; i++) {
                    QGML.World.current.groups [i].update ();
                }

                for (let i = 0, n = QGML.World.current.actors.length; i < n; i++) {
                    try {
                        QGML.World.current.actors [i].draw (p);
                    } catch (err) { console.error (err); }
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

                for (let queue = QGML.World.current.destroyQueue, i = queue.length - 1; i >= 0; i--) {
                    if (queue [i] instanceof QGML.Actor) {
                        QGML.World.current.actors.splice (QGML.World.current.actors.indexOf (queue [i]), 1);
                        queue.splice (i, 1);
                    } else if (queue [i] instanceof QGML.Text) {
                        QGML.World.current.texts.splice (QGML.World.current.texts.indexOf (queue [i]), 1);
                        queue.splice (i, 1);
                    } else if (queue [i] instanceof QGML.Group) {
                        QGML.World.current.groups.splice (QGML.World.current.groups.indexOf (queue [i]), 1);
                        queue.splice (i, 1);
                    }
                }

                if (QGML.debug) {
                    p.noStroke ();
                    p.fill (0, 0, 0, 150);
                    p.rect (0, 0, 130, 120);
                    p.fill (255);
                    p.text (`${Math.round (QGML.frameRate)} fps (actual)`, 5, 15);
                    p.text (`${QGML.frameTime.toFixed (3)} ms frametime`, 5, 35);
                    p.text (`${Math.floor (1000 / QGML.frameTime)} fps (potential)`, 5, 55)
                    p.text (`${QGML.World.current.actors.length} actor(s)`, 5, 75);
                    p.text (`${QGML.World.current.texts.length} text(s)`, 5, 95);
                    p.text (`${QGML.World.current.groups.length} group(s)`, 5, 115);
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

    let _keys = Object.keys (_gmlVars);

    for (key of _keys) {
        try {
            eval (`var ${key} = ${_gmlVars [key]};`);
        } catch (err) {
            eval (`var ${key} = "${_gmlVars [key]}";`);
        }
    }

    /* user call-able functions here */

    function spawn (entityClass, state, parentId) {
        let toReturn = null;
        let template = QGML.gameManager.actorTemplates.find (t => t.self.id === entityClass);
        
        if (template) { // its an actor
            let instance = template.Create (state, parentId);
            QGML.World.current.actors.push (instance);
            toReturn = instance;
        }
        return toReturn;
    }

    function destroy (entity) {
        function getChildrenOfGroup (group) {
            let nrOfGroupsFound;
            let grFound = [group];
            let grArray = [group];
            do {
                nrOfGroupsFound = 0;
                for (let i = grArray.length - 1; i >= 0; i--) {
                    for (let gr of QGML.World.current.groups) {
                        if (grArray [i].name === gr.parent) {
                            nrOfGroupsFound++;
                            grFound.push (gr);
                            grArray.push (gr);
                        }
                    }
                    grArray.splice (i, 1);
                }
            } while (nrOfGroupsFound != 0)
            return grFound;
        }

        if (entity instanceof QGML.Actor) {
            // remove the actor from the world
            entity.active = false;
            QGML.World.current.destroyQueue.push (entity);
        } else if (entity instanceof QGML.Group) {
            // get all the children groups, then all the actors and texts inside them
            // remove the actors and texts and then the groups
            let groups = getChildrenOfGroup (entity);
            for (let actor of QGML.World.current.actors) {
                if (groups.includes (actor.group)) {
                    actor.active = false;
                    QGML.World.current.destroyQueue.push (actor);
                }
            }

            for (let text of QGML.World.current.texts) {
                if (groups.includes (text.group)) {
                    text.active = false;
                    QGML.World.current.destroyQueue.push (text);
                }
            }

            for (let group of groups) {
                group.active = false;
                QGML.World.current.destroyQueue.push (group);
            }
        } else if (entity instanceof QGML.Text) {
            // remove the text from the world
            entity.active = false;
            QGML.World.current.destroyQueue.push (entity);
        }
    }

    function overlaps (actor1, actor2) {
        if (actor1 instanceof QGML.Actor && actor2 instanceof QGML.Actor) {
            if (actor1.active && actor2.active) {
                if (!actor1.state.rotation && !actor2.state.rotation) {
                    let pos1 = actor1.getPosition ();
                    let pos2 = actor2.getPosition ();
                    return (pos1.x < pos2.x + actor2.state.size.width &&
                            pos1.x + actor1.state.size.width > pos2.x &&
                            pos1.y < pos2.y + actor2.state.size.height &&
                            pos1.y + actor1.state.size.height > pos2.y);
                } else {
                    let allowTouch = true;
                    let polygons = [ actor1.getCorners (), actor2.getCorners () ];
    
                    const firstPolygonPositions = polygons [0];
                    const secondPolygonPositions = polygons [1];
    
                    let minA, maxA, projected, minB, maxB;
    
                    for (let i = 0; i < polygons.length; i++) {
                        const polygon = polygons [i];
                        for (let i1 = 0; i1 < polygon.length; i1++) {
    
                            const i2 = (i1 + 1) % polygon.length;
                            const p1 = polygon [i1];
                            const p2 = polygon [i2];
    
                            const normal = {
                                x: p2.y - p1.y,
                                y: p1.x - p2.x
                            };
    
                            minA = maxA = undefined;
    
                            for (let j = 0; j < firstPolygonPositions.length; j++) {
                                projected = normal.x * firstPolygonPositions[j].x + normal.y * firstPolygonPositions[j].y;
    
                                if (!minA || projected < minA || (!allowTouch && projected === minA)) {
                                    minA = projected;
                                }
    
                                if (!maxA || projected > maxA || (!allowTouch && projected === maxA)) {
                                    maxA = projected;
                                }
                            }
    
                            minB = maxB = undefined;
    
                            for (let j = 0; j < secondPolygonPositions.length; j++) {
                                projected = normal.x * secondPolygonPositions[j].x + normal.y * secondPolygonPositions[j].y;
    
                                if (!minB || projected < minB || (!allowTouch && projected === minB)) {
                                    minB = projected;
                                }
    
                                if (!maxB || projected > maxB || (!allowTouch && projected === maxB)) {
                                    maxB = projected;
                                }
                            }
    
                            if (maxA < minB || (!allowTouch && maxA === minB) || maxB < minA || (!allowTouch && maxB === minA)) {
                                return false;
                            }
                        }
                    }
                    return true;
                }
                
            } else return false;
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
        let _res;
        if (context) {
            _res = eval (str).bind (context);
        } else {
            _res = eval (str);
        }
        if (QGML.gameManager.vars [QGML.World.current.id]) {
            for (key of _keys) {
                if (key in QGML.gameManager.vars [QGML.World.current.id]) {
                    QGML.gameManager.setVar (QGML.World.current.id, key, eval (key));
                } else {
                    QGML.gameManager.setVar ('global', key, eval (key));
                }
            }
        }
        
        return _res;
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
    constructor ({ group = null, value = "", font, className = null, state = "", id = 'default-text', customUpdate, customSetup }, worldObj) {
        this.id = id;
        this.class = className; // doesn't do anything yet
        this.active = true;

        this.group = worldObj.groups.find (grp => grp.name === group);
        this.state = {
            position: {
                x: 0,
                y: 0
            },
            size: 12,
            color: null,
            stroke: null,
            rotation: 0
        };
        this.originalState = state;
        this.originalValue = value;
        this.font = font;

        this.customUpdate = customUpdate;
        this.customSetup = customSetup;
    }

    setParent (group) {
        this.group = QGML.World.current.groups.find (grp => grp.name === group);
    }

    getActive () {
        return this.group ? (this.group.getActive () ? this.active : false) : this.active;
    }

    setup (p) {
        if (this.originalState) {
            this.state = QGML.ctx.eval (this.originalState);
        }
        this.value = QGML.ctx.eval ("`" + this.originalValue + "`");
        if (this.customSetup) {
            QGML.ctx.eval (this.customSetup, this) ();
        }
        if (this.customUpdate) {
            this.customUpdate = QGML.ctx.eval (this.customUpdate, this);
        }
    }

    getPosition () {
        return {
            x: this.state.position.x + (this.group ? this.group.getPosition ().x : 0),
            y: this.state.position.y + (this.group ? this.group.getPosition ().y : 0)
        }
    }

    preload () {
        if (this.font) {
            this.font = this.font.name;
        }
    }

    draw (p) {
        if (this.getActive ()) {
            if (this.customUpdate) this.customUpdate ();
            p.push ();
            let pos = this.getPosition ();
            p.translate (pos.x, pos.y + this.state.size / 2);
            this.value = QGML.ctx.eval ("`" + this.originalValue + "`");

            if (this.state.stroke) {
                p.strokeWeight (this.state.stroke.weight);
                p.stroke (p.color (this.state.stroke.color));
            } else {
                p.noStroke ();
            }

            if (this.state.color) {
                p.fill (p.color (this.state.color));
            }
            p.textSize (this.state.size);
            p.textStyle (this.state.style);
            p.textAlign (this.state.align);

            if (this.font) {
                p.textFont (this.font);
            }
            p.rotate (this.state.rotation);

            p.text (this.value, 0, - this.state.size);
            p.pop ();
        }
    }
}

QGML.Actor = class Actor {
    constructor ({ group = null, className = null, state = "", id = 'default-actor', sprite, animator, customUpdate, customSetup }, worldObj) {
        this.id = id;
        this.sprite = sprite;
        this.animator = animator;
        this.class = className;
        this.active = true;

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
            rotation: 0,
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

    setParent (group) {
        this.group = QGML.World.current.groups.find (grp => grp.name === group);
    }

    getActive () {
        return this.group ? (this.group.getActive () ? this.active : false) : this.active;
    }

    getCorners () {
        let pos = this.getPosition ();
        pos = {
            x: pos.x + this.state.size.width / 2,
            y: pos.y + this.state.size.height / 2
        }
        let rot = this.state.rotation || 0;
        let corners = [];

        let points = [
            {
                x: - this.state.size.width / 2,
                y: - this.state.size.height / 2
            }, {
                x: this.state.size.width / 2,
                y: - this.state.size.height / 2
            }, {
                x: this.state.size.width / 2,
                y: this.state.size.height / 2
            }, {
                x: - this.state.size.width / 2,
                y: this.state.size.height / 2
            }
        ]
        for (let p of points) {
            let rotatedX = p.x * Math.cos (rot) - p.y * Math.sin (rot);
            let rotatedY = p.x * Math.sin (rot) + p.y * Math.cos (rot);
    
            let x = rotatedX + pos.x;
            let y = rotatedY + pos.y;
    
            corners.push ({ x, y });
        }
        return corners;
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
            x: this.state.position.x + (this.group ? this.group.getPosition ().x : 0),
            y: this.state.position.y + (this.group ? this.group.getPosition ().y : 0)
        }
    }

    getRotation () {
        return this.state.rotation;
    }

    draw (p) {
        if (this.getActive ()) {
            if (this.customUpdate) this.customUpdate ();
            if (this.state.size.width && this.state.size.height) {
                p.push ();
                let pos = this.getPosition ();
                p.translate (pos.x + this.state.size.width / 2, pos.y + this.state.size.height / 2);
    
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
                p.rectMode (p.CENTER);
                p.imageMode (p.CENTER);
                p.rotate (this.state.rotation);
                p.scale (scale.x * this.direction.x, scale.y * this.direction.y);
                p.rect (0, 0, this.state.size.width, this.state.size.height);
                
                if (this.animator) {
                    p.image (this.animator.getFrame (), 0, 0);
                } else if (this.sprite.get ()) {
                    p.image (this.sprite.get (), 0, 0);
                }
                p.pop ();
    
            }
            if (this.animator) this.animator.update ();
        }
    }
}

QGML.Template = class Template {
    constructor (self, type) {
        this.self = self;
        this.type = type;
    }

    Create (state, parent) {
        let toReturn = null;
        switch (this.type) {
            case 'actor':
                let actor = new QGML.Actor (this.self, QGML.World.current);
                actor.setParent (parent)
                if (state) actor.state = state;
                actor.class = this.self.id;
                actor.id = `actor-${randomID (16)}`;
                actor.setup ();
                toReturn = actor;
                break;
            // case 'text':
            //     let text = new QGML.Text (this.self, QGML.World.current);
            //     text.setParent (parent);
            //     if (state) text.state = state;
            //     text.class = this.self.id;
            //     text.id = `text-${randomID (16)}`;
            //     text.setup ();
            //     toReturn = text;
            //     break;
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
    constructor (obj) {
        this.name = obj ? obj.name : null;
        this.image = this.name ? QGML.gameManager.findAsset ('sprites', this.name).image : null;
    }

    get () {
        return this.image;
    }

    set (name) {
        this.name = name;
        this.image = QGML.gameManager.findAsset ('sprites', name).image;
    }

    static Create (sprite) {
        return new QGML.Sprite (sprite);
    }
}

QGML.Group = class Group {
    constructor ({ parent = null, world = 'default-world', className = null, name = 'default-group', state = {}, customUpdate = null, customSetup = null }, worldObj) {
        this.parent = parent;
        this.world = world;
        this.name = name;
        this.class = className;

        this.active = true;
        
        this.state = {
            position: {
                x: 0,
                y: 0
            },
            size: {
                width: 0,
                height: 0
            },
            rotation: 0
        };
        this.originalState = state;
        this.customUpdate = customUpdate;
        this.customSetup = customSetup;
        this.absolutePosition = this.state.position;

    }

    setParent (parent) {
        this.parent = parent;
        this.parentObject = QGML.World.current.groups.find (g => g.name === this.parent);
    }

    getPosition () {
        return this.absolutePosition;
    }

    getRotation () {
        return this.state.rotation + (this.parent ? this.parentObject.state.rotation : 0);
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

    getActive () {
        return this.parentObject ? (this.parentObject.active ? this.active : false) : this.active;
    }

    update () {
        this.absolutePosition = {
            x: this.state.position.x + (this.parent ? this.parentObject.state.position.x : 0),
            y: this.state.position.y + (this.parent ? this.parentObject.state.position.y : 0)
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
        this.destroyQueue = [];
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
        this.config = config;
        this.keymappers = {};
        this.scripts = config.scripts;
        this.assets = config.assets;

        this.actorTemplates = config ['actor-templates'].map (t => new QGML.Template (t, 'actor'));

        this.vars = Object.assign ({}, config.vars);
        this.originalVars = Object.assign ({}, config.vars);
        this.defaultWorld = config.defaultWorld;
        this.selectedWorld = config.defaultWorld;
        
        this.loadWorld = this.loadWorld.bind (this);
        this.findWorld = this.findWorld.bind (this);
        this.createWorlds = this.createWorlds.bind (this);
        this.createKeymappers = this.createKeymappers.bind (this);
        this.findAsset = this.findAsset.bind (this);
        
    }

    createWorlds () {
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
        this.worlds = this.config.worlds.map (world => new QGML.World (world));
        this.worlds.forEach (world => world.createEntities ());

        this.selectedWorld = this.findWorld (world);

        this.vars [world] = Object.assign ({}, this.originalVars [world]);
        this.currentTexts = this.selectedWorld.texts;
        QGML.World.current = this.selectedWorld;
        if (QGML.ctx) {
            let p5 = QGML.ctx.p5;
            QGML.ctx = new QGML.Context ();
            this.createKeymappers ();
            QGML.preload (p5);
            QGML.setup (p5);
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