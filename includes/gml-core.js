class GML {
    constructor () {
        // this.canvas = null;
        this.p5 = null;
        this.gameManager = null;
        
    }
    static setup (config) {
        this.gameManager = new this.GameManager (config);
        this.p5 = new p5 (GML.createSketch (config), config.rootElementID);

        // if background
        
        // let bg = new Image ();
        // bg.onload = () => {
        //     let f_bg = new fabric.Image (bg);
        //     this.canvas.setBackgroundImage (f_bg);
        //     this.canvas.renderAll ();
        // }

        // bg.src = assets ['world-1-bg'];

    }

    static createSketch (config) {
        const { width, height, assets } = config;

        return function (p) {
            p.setup = function () {
                let canvas = p.createCanvas (width, height);
                p.background (0);
                p.fill (255);
            }
            p.draw = function () {
                GML.gameManager.currentActors.forEach (actor => {
                    actor.draw (p);
                });
            }
        }

    }


    static Group = class Group {
        constructor ({ parent = null, world = 'default-world', name = 'default-group', state = {} }, worldObj) {
            this.parent = parent;
            this.world = world;
            this.name = name;
            this.state = state;
        }
    }

    static Actor = class Actor {
        constructor ({ group = null, state = {}, id = 'default-actor' }, worldObj) {
            console.log (worldObj.groups, group);
            this.id = id;
            this.group = worldObj.groups.find (grp => grp.name === group);
            this.state = state;
        }

        draw (p) {
            if (this.state.size.width && this.state.size.height) {
                p.fill (255);
                p.rect (this.state.position.x + this.group.state.position.x, this.state.position.y + this.group.state.position.y, this.state.size.width, this.state.size.height);
            }
        }
    }

    static World = class World {
        constructor ({ id = 'default-world', state = {}, groups = [], actors = [], events = [] }) {
            this.id = id;
            this.state = state;
            console.log (actors);
            this.groups = groups.map (group => new GML.Group (group, this));
            this.actors = actors.map (actor => new GML.Actor (actor, this));
            this.events = events;
        }
    }

    static GameManager = class GameManager {
        constructor (config) {
            this.worlds = config.worlds.map (world => new GML.World (world));
            this.defaultWorld = config.defaultWorld;
            this.selectedWorld = null;

            this.loadWorld = this.loadWorld.bind (this);
            this.findWorld = this.findWorld.bind (this);

            this.loadWorld (this.defaultWorld);
        }

        loadWorld (world) {
            this.selectedWorld = this.findWorld (world);
            this.currentGroups = this.selectedWorld.groups;
            this.currentActors = this.selectedWorld.actors;
        }

        findWorld (id) {
            return this.worlds.find (world => world.id === id);
        }
    }
}
