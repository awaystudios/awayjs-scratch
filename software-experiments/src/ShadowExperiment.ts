/*

3ds file loading example in Away3d

Demonstrates:

How to use the Loader object to load an embedded internal 3ds model.
How to map an external asset reference inside a file to an internal embedded asset.
How to extract material data and use it to set custom material properties on a model.

Code by Rob Bateman
rob@infiniteturtles.co.uk
http://www.infiniteturtles.co.uk

This code is distributed under the MIT License

Copyright (c) The Away Foundation http://www.theawayfoundation.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

import {View, DefaultRenderer}		        								from "awayjs-full";
import {BitmapImage2D, Sampler2D}											from "awayjs-full/lib/image";
import {AssetEvent, LoaderEvent}											from "awayjs-full/lib/events";
import {HoverController}													from "awayjs-full/lib/controllers";
import {Vector3D}															from "awayjs-full/lib/geom";
import {ElementsType}														from "awayjs-full/lib/graphics";
import {AssetLibrary, IAsset, LoaderContext}								from "awayjs-full/lib/library";
import {URLRequest}															from "awayjs-full/lib/net";
import {RequestAnimationFrame}												from "awayjs-full/lib/utils";
import {Sprite, DirectionalLight, LoaderContainer}							from "awayjs-full/lib/display";
import {PrimitivePlanePrefab}												from "awayjs-full/lib/prefabs";
import {MethodMaterial, StaticLightPicker, ShadowSoftMethod}				from "awayjs-full/lib/materials";
import {Single2DTexture}													from "awayjs-full/lib/textures";
import {Max3DSParser}														from "awayjs-full/lib/parsers";
import {PrimitiveTorusPrefab,
	PrimitiveSpherePrefab,
	PrimitiveCubePrefab}													from "awayjs-full/lib/prefabs";

class ShadowExperiment
{
	//engine variables
	private _view:View;
	private _cameraController:HoverController;

	//material objects
	private _groundMaterial:MethodMaterial;
	private _objectMaterial:MethodMaterial;

	//light objects
	private _light:DirectionalLight;
	private _lightPicker:StaticLightPicker;
	private _direction:Vector3D;

	//scene objects
	private _object:Sprite;
	private _plane:PrimitivePlanePrefab;
	private _ground:Sprite;

	//navigation variables
	private _timer:RequestAnimationFrame;
	private _time:number = 0;
	private _move:boolean = false;
	private _lastPanAngle:number;
	private _lastTiltAngle:number;
	private _lastMouseX:number;
	private _lastMouseY:number;

	private _useSoftware = true;
	private _useShadows = true;
	private _shadowSamples = 2;
	private _shadowRange = 5;

	/**
	 * Constructor
	 */
	constructor()
	{
		this.init();
	}

	/**
	 * Global initialise function
	 */
	private init():void
	{
		this.initEngine();
		this.initLights();
		this.initMaterials();
		this.initObjects();
		this.initListeners();
	}

	/**
	 * Initialise the engine
	 */
	private initEngine():void
	{
		var renderer;
		if (this._useSoftware) {
			renderer = new DefaultRenderer(null, false, "baseline", "software");
		}
		else {
			renderer = new DefaultRenderer();
		}

		this._view = new View(renderer);
		this._view.backgroundColor = 0x666666;

		//setup the camera for optimal shadow rendering
		this._view.camera.projection.far = 2100;

		//setup controller to be used on the camera
		this._cameraController = new HoverController(this._view.camera, null, 45, 20, 700, 10);
	}

	/**
	 * Initialise the lights
	 */
	private initLights():void
	{
		this._light = new DirectionalLight(-1, -1, 1);
		this._light.castsShadows = true;
		this._direction = new Vector3D(-1, -1, 1);
		this._lightPicker = new StaticLightPicker([this._light]);
		this._view.scene.addChild(this._light);
	}

	/**
	 * Initialise the materials
	 */
	private initMaterials():void
	{
		// OBJECT MATERIAL
		this._objectMaterial = new MethodMaterial(0xFFFFFF, 1);
		if (this._useShadows) { // if commented out, ant is completely black, but still projects shadow
			this._objectMaterial.shadowMethod = new ShadowSoftMethod(this._light , this._shadowSamples, this._shadowRange);
			this._objectMaterial.shadowMethod.epsilon = 0.2;
		}
		this._objectMaterial.lightPicker = this._lightPicker;
		this._objectMaterial.specularMethod.gloss = 30;
		this._objectMaterial.specularMethod.strength = 1;
		this._objectMaterial.style.color = 0x303040;
		this._objectMaterial.diffuseMethod.multiply = false;
		this._objectMaterial.ambientMethod.strength = 1;

		// GROUND MATERIAL
		this._groundMaterial = new MethodMaterial(0xFFFFFF, 1);
		// this._groundMaterial.ambientMethod.texture = new Single2DTexture();
		if (this._useShadows) { // if commented out, ground should not be visible
			this._groundMaterial.shadowMethod = new ShadowSoftMethod(this._light , this._shadowSamples, this._shadowRange);
			this._groundMaterial.style.sampler = new Sampler2D(true, true, true);
			this._groundMaterial.style.addSamplerAt(new Sampler2D(true, true), this._light.shadowMapper.depthMap);
			this._groundMaterial.shadowMethod.epsilon = 0.2;
		}
		this._groundMaterial.lightPicker = this._lightPicker;
		this._groundMaterial.specularMethod.strength = 0;
		//this._groundMaterial.mipmap = false;
	}

	/**
	 * Initialise the scene objects
	 */
	private initObjects():void
	{
		var size = 150;
		// this._object = <Sprite> new PrimitiveTorusPrefab(this._objectMaterial, ElementsType.TRIANGLE, size, 50, 40, 20).getNewObject();
		this._object = <Sprite> new PrimitiveSpherePrefab(this._objectMaterial, ElementsType.TRIANGLE, size, 16, 12).getNewObject();
		// this._object = <Sprite> new PrimitiveCubePrefab(this._objectMaterial, ElementsType.TRIANGLE, size, size, size, 1, 1).getNewObject();
		// this._object.debugVisible = true;
		this._object.y = 200;
		this._view.scene.addChild(this._object);

		this._plane = new PrimitivePlanePrefab(this._groundMaterial, ElementsType.TRIANGLE, 1000, 1000, 1, 1);
		this._ground = <Sprite> this._plane.getNewObject();
		this._ground.castsShadows = false;
		this._view.scene.addChild(this._ground);
	}

	/**
	 * Initialise the listeners
	 */
	private initListeners():void
	{
		window.onresize  = (event:UIEvent) => this.onResize(event);

		document.onmousedown = (event:MouseEvent) => this.onMouseDown(event);
		document.onmouseup = (event:MouseEvent) => this.onMouseUp(event);
		document.onmousemove = (event:MouseEvent) => this.onMouseMove(event);

		this.onResize();

		this._timer = new RequestAnimationFrame(this.onEnterFrame, this);
		this._timer.start();
	}

	/**
	 * Navigation and render loop
	 */
	private onEnterFrame(dt:number):void
	{
		this._time += dt;

		var sc = 0.7;
		this._direction.x = -sc * Math.sin(this._time/4000);
		this._direction.z = -sc * Math.cos(this._time/42000);
		this._light.direction = this._direction;

		this._view.render();
	}

	/**
	 * Mouse down listener for navigation
	 */
	private onMouseDown(event:MouseEvent):void
	{
		this._lastPanAngle = this._cameraController.panAngle;
		this._lastTiltAngle = this._cameraController.tiltAngle;
		this._lastMouseX = event.clientX;
		this._lastMouseY = event.clientY;
		this._move = true;
	}

	/**
	 * Mouse up listener for navigation
	 */
	private onMouseUp(event:MouseEvent):void
	{
		this._move = false;
	}

	private onMouseMove(event:MouseEvent)
	{
		if (this._move) {
			this._cameraController.panAngle = 0.3*(event.clientX - this._lastMouseX) + this._lastPanAngle;
			this._cameraController.tiltAngle = 0.3*(event.clientY - this._lastMouseY) + this._lastTiltAngle;
		}
	}

	/**
	 * stage listener for resize events
	 */
	private onResize(event:UIEvent = null):void
	{
		this._view.y = 0;
		this._view.x = 0;
		this._view.width = window.innerWidth;
		this._view.height = window.innerHeight;
	}
}


window.onload = function ()
{
	new ShadowExperiment();
}