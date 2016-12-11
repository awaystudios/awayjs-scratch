/*

SkyBox example in Away3d

Demonstrates:

How to use a CubeTexture to create a SkyBox object.
How to apply a CubeTexture to a material as an environment map.

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

import {LoaderEvent, Vector3D, AssetLibrary, LoaderContext, URLRequest, RequestAnimationFrame, PerspectiveProjection} from "awayjs-full/lib/core";
import {ElementsType, BitmapImageCube, SamplerCube, SingleCubeTexture} from "awayjs-full/lib/graphics";
import {Sprite, Skybox, PrimitiveTorusPrefab} from "awayjs-full/lib/scene";
import {ContextGLProfile, ContextMode} from "awayjs-full/lib/stage";
import {DefaultRenderer} from "awayjs-full/lib/renderer";
import {View} from "awayjs-full/lib/view";
import {MethodMaterial, EffectEnvMapMethod} from "awayjs-full/lib/materials";

class Basic_SkyBox
{
	//engine variables
	private _view:View;

	//material objects
	private _cubeTexture:SingleCubeTexture;
	private _objectMaterial:MethodMaterial;

	//scene objects
	private _skyBox:Skybox;
	private _object:Sprite;

	//navigation variables
	private _timer:RequestAnimationFrame;
	private _mouseX:number;
	private _mouseY:number;
	private _cubeTextureName:string = "assets/skybox/snow_texture.cube";
	private _cameraZ:number = 1000;

	private _useSoftware = true;

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
		this.initMaterials();
		this.initObjects();
		this.initListeners();
	}

	/**
	 * Initialise the engine
	 */
	private initEngine():void
	{
		//setup the view
		var renderer;
		if (this._useSoftware) {
			renderer = new DefaultRenderer(null, false, ContextGLProfile.BASELINE, ContextMode.SOFTWARE);
		}
		else {
			renderer = new DefaultRenderer();
		}
		this._view = new View(renderer);

		//setup the camera
		this._view.camera.z = this._cameraZ;
		this._view.camera.y = 0;
		this._view.camera.lookAt(new Vector3D());
		this._view.camera.projection = new PerspectiveProjection(90);
		this._view.backgroundColor = 0xFFFF00;
		this._mouseX = window.innerWidth/2;
	}

	/**
	 * Initialise the materials
	 */
	private initMaterials():void
	{
		//setup the torus material
		this._objectMaterial = new MethodMaterial(0xFFFFFF, 1);
		this._objectMaterial.style.sampler = new SamplerCube(true, false);
		this._objectMaterial.specularMethod.strength = 0.5;
		this._objectMaterial.ambientMethod.strength = 1;
	}

	/**
	 * Initialise the scene objects
	 */
	private initObjects():void
	{
		this._object = <Sprite> new PrimitiveTorusPrefab(this._objectMaterial, ElementsType.TRIANGLE, 250, 100, 16, 8).getNewObject();
		// this._object = <Sprite> new PrimitiveSpherePrefab(this._objectMaterial, ElementsType.TRIANGLE, 300, 40, 20).getNewObject();
		// this._object = <Sprite> new PrimitiveCubePrefab(this._objectMaterial, ElementsType.TRIANGLE, 500, 500, 500, 1, 1).getNewObject();
		this._object.debugVisible = true;
		this._view.scene.addChild(this._object);
	}

	/**
	 * Initialise the listeners
	 */
	private initListeners():void
	{
		document.onmousemove = (event:MouseEvent) => this.onMouseMove(event);

		window.onresize  = (event:UIEvent) => this.onResize(event);

		this.onResize();

		this._timer = new RequestAnimationFrame(this.onEnterFrame, this);
		this._timer.start();

		AssetLibrary.addEventListener(LoaderEvent.LOAD_COMPLETE, (event:LoaderEvent) => this.onResourceComplete(event));

		//setup the url map for textures in the cubemap file
		var loaderContext:LoaderContext = new LoaderContext();
		loaderContext.dependencyBaseUrl = "assets/skybox/";

		//environment texture
		AssetLibrary.load(new URLRequest(this._cubeTextureName), loaderContext);
	}


	/**
	 * Navigation and render loop
	 */
	private onEnterFrame(dt:number):void
	{
		this._object.rotationX += 2;
		this._object.rotationY += 1;

		// this._view.camera.transform.moveTo(0, 0, 0);
		// this._view.camera.rotationY += 0.5 * (this._mouseX - window.innerWidth/2)/800;
		this._view.camera.rotationY += 5;
		// this._view.camera.transform.moveBackward(this._cameraZ);
		this._view.render();
	}

	/**
	 * Listener function for resource complete event on asset library
	 */
	private onResourceComplete(event:LoaderEvent)
	{
		switch (event.url)
		{
			case this._cubeTextureName:

				this._cubeTexture = new SingleCubeTexture(<BitmapImageCube> event.assets[0]);

				this._skyBox = new Skybox(<BitmapImageCube> event.assets[0]);
				this._view.scene.addChild(this._skyBox);

				this._objectMaterial.addEffectMethod(new EffectEnvMapMethod(this._cubeTexture));

				break;
		}
	}

	/**
	 * Mouse move listener for navigation
	 */
	private onMouseMove(event:MouseEvent)
	{
		this._mouseX = event.clientX;
		this._mouseY = event.clientY;
	}

	/**
	 * window listener for resize events
	 */
	private onResize(event:UIEvent = null):void
	{
		this._view.y = 0;
		this._view.x = 0;
		this._view.width = window.innerWidth;
		this._view.height = window.innerHeight;
	}
}

window.onload = function()
{
	new Basic_SkyBox();
}