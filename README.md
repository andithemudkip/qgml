# Quick Game Markup Language

![](https://i.imgur.com/9aDA8Tz.png)

QGML is a tool that allows you to structure your game with an HTML-like language and script it using JavaScript.

#### What it is

a quick way to prototype little web games

#### What it isn't

a fully-fledged game engine meant for polished games

## Installation

```sh
$ npm i -g @qgml/cli
```

## CLI Quick Start

**Compilation**

```sh
$ qgml --source myFile
```

**Serve**

```sh
$ qgml --source myFile --serve 8000
```

This will serve the compiled game at `localhost:8000`

**note**: serving also provides hot-reloading, so, if you modify the qgml file it should automatically reload and apply the changes in your web browser

**note2**: if you edit an asset (sprite or spritesheet) you have to run qgml again, it won't hot-reload it

For a full list of commands use

```sh
$ qgml --help
```

## Quick Start

```html
<qgml
	width = 300
	height = 300
>
	<world default>
		<actor
			id = "my-rect"
			state = ({
				position: { x: 20, y: 20 },
				size: { width: 50, height: 50 },
				color: 'blue'
			})
		/>
	</world>
</qgml>
```

**pro tip**: you can save qgml files as `.html` so that you get syntax highlighting in your favourite code editor!

## Tags

### QGML

```html
<qgml></qgml>
```

Think of this as the root element; all other tags are children of it.
It contains the configuration for the canvas

#### Props

| prop          | data type | description                                                  |
| ------------- | --------- | ------------------------------------------------------------ |
| width         | number    | the width of the canvas (default: 300)                       |
| height        | number    | the height of the canvas (default: 300)                      |
| rootElementID | string    | the id of the HTML element in your web page that the canvas should be appended to (default: 'qgml-game') |
| debug         | boolean   | if this prop is present, the game will show the fps, frame-time, and number of actors in the top left |



### World

```html
<world></world>
```

Worlds are basically screens or scenes in your game; an example of worlds would be
`menu`, `level1`, `level2`

#### Props

| props   | data type | description                                                  |
| ------- | --------- | ------------------------------------------------------------ |
| id      | string    | the id of the world; this will be used in scripting to switch between worlds |
| default | boolean   | if this prop is present the world will be the one loaded as soon as the game starts. If your game has a menu screen, that one would be the default world |



### Actor

```html
<actor/>
```

An actor is anything that appears on the screen: the player, the ground, an object, etc

`actor` is a self closing tag because it cannot contain anything itself.

#### Props

| prop     | data type | description                                                  |
| -------- | --------- | ------------------------------------------------------------ |
| id       | string    | the id of the player; this is useful if you want to do anything in script to this actor |
| state    | object    | a state object                                               |
| sprite   | string    | the path relative to the qgml file to an image file          |
| animator | object    | an animator object                                           |
| setup    | function  | a function that is called once when the world is loaded      |
| update   | function  | a function that is called every frame                        |
| class    | string    | the class of the actor                                       |

#### Animator

The animator overrides the `sprite` prop. This is used to add animations to certain actors

| property     | data type | description             |
| ------------ | --------- | ----------------------- |
| spritesheets | object    | the spritesheets object |

##### Spritesheets

```js
spritesheets: {
    idle: {
        frames: ['path/to/frame0', 'path/to/frame/1', etc],
        frameTime: 10
    },
    //or
    run: {
        strip: 'path/to/animation/strip.png',
        frames: 8,
        frameTime: 10
    },
    etc
}
```

`frames` - an array containing the **relative** paths to frames (images) **or** the number of frames in a strip

`frameTime` - the number of game ticks (frames) each animation frame should stay on screen [1 - change each frame (fastest), 10 - change every 10 frames, etc]

`strip` - the path to an animation strip

example of an animation strip ([credit](https://oco.itch.io/medieval-fantasy-character-pack)):

![](https://raw.githubusercontent.com/andithemudkip/game-ml/master/example/assets/noBKG_KnightIdle_strip.png)

##### Example

```html
<actor
	id = "player"
	state = ({...})
	animator = ({
		spritesheets: {
			idle: {
				strip: './assets/noBKG_KnightIdle_strip.png',
				frames: 15,
				frameTime: 10
			}
		}
	})
/>
```



**[!] Note about `setup` and `update`**

If the function you pass to `setup` or `update` uses classic notation (`function () { ... }`), the context within it (`this`) will be the actor itself; so, you will be able to write `this.state.position` which will return the actor's position, or `this.animator` which will return the actor's animator.

If the function you pass uses arrow notation (`() => { ... }`), the context (`this`) will be the QGML context.

**TLDR: it is recommended that you use classic notation for functions passed to `setup` and `update`**

example:

```html
<actor
	update = (function () {
		console.log (this.state); // will log the actor's state
	})
/>
```

while

```html
<actor
	update = (() => {
		console.log (this.state); // undefined
	})
/>
```



### Group

```html
<group>{children}</group>
```

Groups can be used to group together multiple Actors or Groups so that they can move all at once.

#### Props

| prop   | data type | description                                                  |
| ------ | --------- | ------------------------------------------------------------ |
| id     | string    | just like the id of an actor, this can be used to access this group in a script |
| state  | object    | a state object                                               |
| setup  | function  | a function that is called once when the world is loaded      |
| update | function  | a function that is called every frame                        |

Modifying a group's position will move all of its children accordingly

```html
<group id = "player">
	<actor id = "player-body"/>
	<group id = "nested" >
		<actor/>
	</group>
</group>
```

**[!] Note about `setup` and `update` - everything said about <actor/> applies**



### Var (Variables)

```html
<var name = value />
```

Variables declared in a certain **World** are only accessible in that world, while variables declared outside of all worlds are considered global and can be accessed and modified from any world.

A single `var` tag can be used to declare multiple variables, for example

```html
<var
	score = 0
	playerPosition = {
		x: 0,
		y: 0
	}
	playerName = "base name"
/>
```



### Text

```html
<text>text to display</text>
```

It is used to display text on the canvas

| prop  | data type | description                                                  |
| ----- | --------- | ------------------------------------------------------------ |
| state | object    | a state object                                               |
| font  | string    | the name of a web-safe font or the name of a font that you're already loading on your web page |

You can use placeholders inside of it to display the values of variables

```html
<text state = { position: { x: 50, y: 100 } }>
	hello! your position is ${playerPosition.x} , ${playerPosition.y}
	and your score is ${score}
</text>
```



### State Objects

| property | data type                                | description            | applies to         |
| -------- | ---------------------------------------- | ---------------------- | ------------------ |
| position | Object { x : Number, y : Number}         | the initial position   | actor, group, text |
| size     | Object { width: Number, height: Number } | the initial actor size | actor              |
| size     | Number                                   | the font size          | text               |
| color    | String                                   | the fill color         | actor, text        |
| stroke   | Object { weight: Number, color: String } | the stroke / outline   | actor, text        |
| style    | String                                   | the style of the text  | text               |
| align    | String                                   | the text alignment     | text               |

#### color

any of the following formats are okay:

* `"rgb(255, 125, 60)"`
* `"rgba(0, 25, 125, 0.5)"`
* `"rgba(0,0,0,0)"`
* `"red"`, `"blue"`, `"lightblue"`, etc.
* if color is omitted or set to `false` the rectangle will be transparent

#### style

* `"normal"`
* `"bold"`
* `"italic"`
* `"bolditalic"`

#### align

* `"right"`
* `"center"`
* `"left"`



### Keymapper

```html
<keymapper/>
```

The keymapper is used to bind functions to certain keyboard events. Keymappers are specific to the world they are declared inside.

Each prop has the following structure:
`<key or group of keys>|<event> = (<function>)`

**key**:

* literal value of the key (w, a, s, d, etc)
* keycode of the key (32, 87, etc)
* one of the following special keys: `backspace`, `delete`, `enter`, `return`, `tab`, `escape`, `shift`, `control`, `option`, `alt`, `up_arrow`, `down_arrow`, `left_arrow`, `right_arrow`, `space`

**group of keys**

it's represented as `[<key>,<key>,<key>,...]` 

**event - for keys**

* `down` - will fire every frame while the key is held down

* `up` - will fire every frame while the key is not held down

* `pressed` - will fire once when the key is pressed [DEFAULT]

* `released` - will fire once when the key is released

**event - for groups of keys**

* `down` - will fire every frame while **all the keys** are held down

* `up` - will fire every frame while **none of the keys** are held down

* `pressed` - will fire once after each key has been pressed at least once

* `released` - will fire once after every key has been released

example:

```html
<keymapper
	a|down = (() => {
		console.log ('this will fire every frame while the A key is down');
	})
    
	space|pressed = (() => {
		console.log ('this will fire every time space is pressed');
	})
    
	16|released = (() => {
		console.log ('16 is the keycode for shift so this will fire everytime shift is released');
	})
    
	[q,e]|up = (() => {
		console.log ('this will fire every frame while Q and E are both up');
	})
/>
```



### Script

```html
<script></script>
```

Scripts are used to add JavaScript code that is executed either in `setup` (once, when the world is loaded) or in `update` (every frame)

Scripts are specific to the world they are declared in.

```html
<script setup>
	console.log ('this is executed once when the world is loaded');
</script>
```

```html
<script update>
	console.log ('this is executed every frame');
</script>
```



### Actor-Template

```html
<actor-template/>
```

Templates are used to spawn actors of the same type programmatically (from scripts and such).

An example of an actor template would be:

```html
<actor-template
	id = "zombie"
	sprite = "./assets/zombie.png"
	update = (function () {
		// zombie behaviour            
	})
/>
```

Which you can then instantiate inside `<script>` tags or inside other actors' `setup` and `update`

```js
spawn ('zombie', {
	position: {
		x: 10,
		y: 20
	}, size: {
		width: 40,
		height: 70
	}
});
```

You can check out the `spawn` function in the API section below.



## API

### Actors

`getActor (id: String)` - returns the actor with the specified ID

`getActorsByClass (class: String)` - returns an array of actors with the specified class

`<Actor>.state` - returns the state of the actor - **this is read-only, the state is not meant to be modified**

`<Actor>.direction` - returns the direction that actor is facing on both axis

`<Actor>.getPosition ()` - returns the actor's position

`<Actor>.direction.set (axis: String, value: String || Number)`

* **axis** can be either `'horizontal'` or `'vertical'`
* **value** can be:
  * `'left'` or `-1 ` - for `axis  == 'horizontal'`
  * `'right'` or `1` - for `axis  == 'horizontal'`
  * `'up'` or `1` - for `axis  == 'vertical'`
  * `'down'` or `-1` - for `axis  == 'vertical'`

`<Actor>.flip.horizontal ()` - flips the direction horizontally

`<Actor>.flip.vertical ()` - flips the direction vertically

`<Actor>.animator` - returns the animator of an actor

`overlaps (a1: Actor, a2: Actor)` - returns true if the actors overlap

`spawn (actorTemplateID: String, initialState: stateObject)` - spawns a new actor from a specified actor-template, assigns its state to the initial state object, and assigns its `class` to the template id; it returns the new actor, or `null` if the specified template id does not exist.

### Animator

`<Animator>.set (animation: String)` - sets the animator's animation to the specified one (ex: 'idle', 'run' - depending on how you declared the animator)

`<Animator>.play (animation: String[, onAnimationDone: Function])` - plays the specified animation **once**, then calls the callback function if one is passed

### Group

`getGroup (id: String)` - returns the group with the specified ID

`<Group>.state` - returns the state of the group - **this is read-only, the state is not meant to be modified**

`<Group>.getPosition ()` - returns the position of the group

### Entity

Entity = either Actor or Group

`dist (x1: Number, y1: Number, x2: Number, y2:  Number)` - returns the distance between the points `(x1, y1)` and `(x2, y2)`

`dist (e1: Entity, e2: Entity)` - returns the distance between the two entities' positions

`getPosition (e: Entity)` - returns the entity's position