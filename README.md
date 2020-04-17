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

`frames` - an array containing the **relative** paths to frames (images) or the number of frames in a strip

`frameTime` - the number of game ticks (frames) each animation frame should stay on screen [1 - change each frame (fastest), 10 - change every 10 frames, etc]

`strip` - the path to an animation strip



### Group

```html
<group>{children}</group>
```

Groups can be used to group together multiple Actors or Groups.

#### Props

| prop  | data type | description                                                  |
| ----- | --------- | ------------------------------------------------------------ |
| id    | string    | just like the id of an actor, this can be used to access this group in a script |
| state | object    | a state object                                               |

Modifying a group's position will move all of its children accordingly

```html
<group id = "player">
	<actor id = "player-body"/>
	<group id = "nested" >
		<actor/>
	</group>
</group>
```



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

| prop  | data type | description                                     |
| ----- | --------- | ----------------------------------------------- |
| state | object    | a state object (it ignores the `size` property) |

You can use placeholders inside of it to display the values of variables

```html
<text state = { position: { x: 50, y: 100 } }>
	hello! your position is ${playerPosition.x} , ${playerPosition.y}
	and your score is ${score}
</text>
```



### State Objects

| property | data type                                | description                                        |
| -------- | ---------------------------------------- | -------------------------------------------------- |
| position | object { x : Number, y : Number}         | the initial x and y of the actor, group, or text   |
| size     | object { width: Number, height: Number } | the initial width and height of the actor or group |
| color    | string                                   | the color of the actor, group, or text             |

#### color

any of the following formats are okay:

* `"rgb(255, 125, 60)"`
* `"rgba(0, 25, 125, 0.5)"`
* `"rgba(0,0,0,0)"` **(use this to make it transparent)**
* `"red"`, `"blue"`, `"lightblue"`, etc

#### Modifying the state in script

The state of an actor or group **cannot be altered after compilation**, but you can use **variables** instead of literal values for any of the properties, or for the whole state object

```html
<var
	playerState = {
		position: {
			x: 0,
			y: 0
		},
		size: {
			width: 20,
			height: 60
		},
		color: 'gray'
	}
/>
<actor
	id = "player"
	state = playerState
/>
```

or

```html
<var
	playerPosition = {
		x: 15,
		y: 85
	}
/>
<actor
	id = "player"
	state = {
		position: playerPosition,
		size: {
			width: 50,
			height: 50
		}
	}
/>
```



### Keymapper [docs work in progress]

```html
<keymapper
 	a|down = (() => {
	
   	})
    
   	[q,e]|up = (() => {
	   	 
   	})
/>
```



