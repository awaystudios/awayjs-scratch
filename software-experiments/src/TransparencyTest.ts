/**
 * Created by palebluedot on 12/15/16.
 */

import {RequestAnimationFrame, Vector3D} from "awayjs-full/lib/core";
import {DefaultMaterialManager, ElementsType, BitmapImage2D} from "awayjs-full/lib/graphics";
import {ContextGLProfile, ContextMode} from "awayjs-full/lib/stage";
import {DirectionalLight, Sprite, PrimitiveTorusPrefab, PrimitivePlanePrefab, StaticLightPicker} from "awayjs-full/lib/scene";
import {DefaultRenderer} from "awayjs-full/lib/renderer";
import {View} from "awayjs-full/lib/view";
import {MethodMaterial} from "awayjs-full/lib/materials";

class TransparencyTest {

	private _view:View;
	private _light:DirectionalLight;
	private _timer:RequestAnimationFrame;
	private _material:MethodMaterial;
	private _object:Sprite;
	private _object1:Sprite;

	private _useSoftware = true;

	constructor() {

		this.initScene();
		this.initListeners();
	}

	private initScene() {

		console.log("RasterizeTest - init()");

		// View.
		var renderer:DefaultRenderer;
		if (this._useSoftware) {
			renderer = new DefaultRenderer(null, false, ContextGLProfile.BASELINE, ContextMode.SOFTWARE);
		}
		else {
			renderer = new DefaultRenderer();
		}
		this._view = new View(renderer);
		this._view.backgroundColor = 0x0000FF;

		// Lights.
		this._light = new DirectionalLight(-1, -1, 1);
		var lightPicker:StaticLightPicker = new StaticLightPicker([this._light]);
		this._view.scene.addChild(this._light);

		// Materials.
		this._material = new MethodMaterial(DefaultMaterialManager.getDefaultImage2D());
		this._material.bothSides = true;
		this._material.alpha = 0.25;
		// this._material.lightPicker = lightPicker;
		// this._material.style.sampler = new Sampler2D(false, true, false); // smooth

		// Geometry.
		this.initObjs();
	}

	private initObjs() {

		var segsHorizontal:number = 1;
		var segsVertical:number = 1;

		console.log("  plane triangles: " + segsHorizontal * segsVertical * 2);

		// Front plane.
		this._object = <Sprite> new PrimitivePlanePrefab(this._material, ElementsType.TRIANGLE, 1000, 1000, 1, 1).getNewObject();
		this._object.rotationX = -90;
		this._object.x = 0;
		this._object.y = 0;
		this._object.z = 0;
		this._view.scene.addChild(this._object);

		// Back plane.
		this._object1 = <Sprite> new PrimitivePlanePrefab(this._material, ElementsType.TRIANGLE, 1000, 1000, 1, 1).getNewObject();
		this._object1.x = 500;
		this._object1.y = -500;
		this._object1.z = 1000;
		this._object1.rotationX = -90;
		this._object1.rotationZ = 45;
		this._view.scene.addChild(this._object1);
	}

	private initListeners():void {

		document.onmousedown = (event:MouseEvent) => this.onMouseDown(event);
		window.onresize  = (event:UIEvent) => this.onResize(event);

		this.onResize();

		// Animation.
		// <><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>
		// this._timer = new RequestAnimationFrame(this.onEnterFrame, this);
		// this._timer.start();
		// <><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

		// First render takes a bit longer, so do a few
		// to start with a 'warmed up' engine.
		this._view.render();
		this._view.render();
	}

	private onMouseDown(event:MouseEvent):void  {

		this._light.color = Math.random() * 0xFFFFFF;

		// Pick one.
		this.nRenderBurst();
		// this._view.render();
	}

	private nRenderBurst():void {

		var numTimes:number = 1;

		console.log("rendering " + numTimes + " times...");

		var startTime:number = performance.now();

		for(var i:number = 0; i < numTimes; i++) {
			this._view.render();
		}

		var endTime:number = performance.now();
		var deltaTime:number = endTime - startTime;
		console.log("  elapsed: " + deltaTime + "ms");

		var avg:number = deltaTime / numTimes;
		console.log("  avg: " + avg + "ms");
	}

	private onEnterFrame(dt:number):void  {

		var k:number = this._useSoftware ? 10 : 1;
		this._object.rotationX -= .1 * k;
		this._object.rotationY -= .2 * k;
		this._object.rotationZ -= .3 * k;
		this._object1.rotationX -= .3 * k;
		this._object1.rotationY -= .2 * k;
		this._object1.rotationZ -= .1 * k;

		this._view.render();
	}

	private onResize(event:UIEvent = null):void  {
		this._view.y = 0;
		this._view.x = 0;
		this._view.width = window.innerWidth;
		this._view.height = window.innerHeight;
	}
}

window.onload = function() {
	new TransparencyTest();
};