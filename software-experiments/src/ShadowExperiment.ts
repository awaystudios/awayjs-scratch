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

import {View}		        								from "awayjs-full/lib/view";
import {DefaultRenderer, DepthRenderer}		        								from "awayjs-full/lib/renderer";
import {BitmapImage2D, Sampler2D, DefaultMaterialManager}											from "awayjs-full/lib/graphics";
import {AssetEvent, LoaderEvent, Vector3D, AssetLibrary, IAsset, LoaderContext, URLRequest, RequestAnimationFrame}											from "awayjs-full/lib/core";
import {HoverController, Billboard}													from "awayjs-full/lib/scene";
import {ElementsType, Single2DTexture}														from "awayjs-full/lib/graphics";
import {Sprite, DirectionalLight, LoaderContainer}							from "awayjs-full/lib/scene";
import {MethodMaterial, ShadowSoftMethod, ShadowHardMethod}				from "awayjs-full/lib/materials";
import {Max3DSParser}														from "awayjs-full/lib/parsers";
import {PrimitivePlanePrefab, StaticLightPicker, PrimitiveTorusPrefab,
	PrimitiveSpherePrefab,
	PrimitiveCubePrefab}													from "awayjs-full/lib/scene";
import {OrientationMode} from "../node_modules/awayjs-full/dist/node_modules/@awayjs/scene/lib/base/OrientationMode";
import {AlignmentMode} from "../node_modules/awayjs-full/dist/node_modules/@awayjs/scene/lib/base/AlignmentMode";

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
	private _ground:Sprite;

	//navigation variables
	private _timer:RequestAnimationFrame;
	private _time:number = 0;
	private _move:boolean = false;
	private _lastPanAngle:number;
	private _lastTiltAngle:number;
	private _lastMouseX:number;
	private _lastMouseY:number;

	private _useSoftware = false;
	private _useShadows = true;

	/**
	 * Constructor
	 */
	constructor()
	{
		this.init();
	}

	private depthCanvas:HTMLCanvasElement;
	private depthContext:CanvasRenderingContext2D;
	private depthCanvasInit:Boolean = false;

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
		var renderer:DefaultRenderer;
		if (this._useSoftware) {
			renderer = new DefaultRenderer(null, false, "baseline", "software");
		}
		else {
			renderer = new DefaultRenderer();
		}

		this._view = new View(renderer);
		this._view.backgroundColor = 0x666666;

		//setup the camera for optimal shadow rendering
		this._view.camera.projection.far = 3500;

		//setup controller to be used on the camera
		this._cameraController = new HoverController(this._view.camera, null, 0, 20, 1000,-10);
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
		this._objectMaterial = new MethodMaterial(DefaultMaterialManager.getDefaultImage2D());
		if (this._useShadows) { // if commented out, ant is completely black, but still projects shadow
			this._objectMaterial.shadowMethod = new ShadowHardMethod(this._light);
			this._objectMaterial.shadowMethod.epsilon = 0.2;
		}
		this._objectMaterial.lightPicker = this._lightPicker;
		this._objectMaterial.specularMethod.gloss = 30;
		this._objectMaterial.specularMethod.strength = 1;
		this._objectMaterial.style.color = 0x303040;
		this._objectMaterial.diffuseMethod.multiply = false;
		this._objectMaterial.ambientMethod.strength = 1;

		// GROUND MATERIAL
		this._groundMaterial = new MethodMaterial(0xFF0000, 1);
		// this._groundMaterial.ambientMethod.texture = new Single2DTexture();
		if (this._useShadows) { // if commented out, ground should not be visible
			this._groundMaterial.shadowMethod = new ShadowHardMethod(this._light);
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
		// Shadow casting object
		var size = 400;
		// this._object = <Sprite> new PrimitiveTorusPrefab(this._objectMaterial, ElementsType.TRIANGLE, size, 50, 40, 20).getNewObject();
		this._object = <Sprite> new PrimitiveSpherePrefab(this._objectMaterial, ElementsType.TRIANGLE, size, 16, 12).getNewObject();
		// this._object = <Sprite> new PrimitiveCubePrefab(this._objectMaterial, ElementsType.TRIANGLE, size, size, size, 1, 1).getNewObject();
		// this._object.debugVisible = true;
		this._object.y = 300;
		this._view.scene.addChild(this._object);

		// Ground
		var floorPlane = new PrimitivePlanePrefab(this._groundMaterial, ElementsType.TRIANGLE, 10000, 10000, 1, 1);
		this._ground = <Sprite> floorPlane.getNewObject();
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

		// To debug depth map.
		if (this.depthCanvasInit == false) {
			this.depthCanvas = document.createElement("canvas");
			this.depthCanvas.id = "depthMapCanvas";
			this.depthCanvas.width = 2048;
			this.depthCanvas.height = 2048;
			this.depthCanvas.style.zoom = "0.1";
			this.depthCanvas.style.zIndex = "8";
			this.depthCanvas.style.position = "absolute";
			this.depthCanvas.style.border = "1px solid";
			this.depthContext = this.depthCanvas.getContext("2d");
			this.depthContext.fillStyle = "rgb(255, 0, 0)";
			this.depthContext.fillRect(0, 0, this.depthCanvas.width, this.depthCanvas.height);
			document.body.appendChild(this.depthCanvas);
			var self = this;
			var defRend = this._view.renderer as DefaultRenderer;
			var depthRenderer:DepthRenderer = defRend.getDepthRenderer();
			depthRenderer.drawCallback = function() {

				// console.log("drawing depth");

				// Draw to external canvas.
				var imageData:ImageData = self.depthContext.getImageData(0, 0, self.depthCanvas.width, self.depthCanvas.height);
				var bitmap:BitmapImage2D = new BitmapImage2D(self.depthCanvas.width, self.depthCanvas.height, false, 0xFF0000, true);
				bitmap.setPixels(bitmap.rect, imageData.data);
				self._view.renderer.context.drawToBitmapImage2D(bitmap);
				self.depthContext.putImageData(bitmap.getImageData(), 0, 0);
			};
			this.depthCanvasInit = true;
		}
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