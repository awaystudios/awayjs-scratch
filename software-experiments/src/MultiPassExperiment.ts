/**
 * Created by palebluedot on 11/16/16.
 */

import {RequestAnimationFrame, Vector3D} from "awayjs-full/lib/core";
import {DefaultMaterialManager, ElementsType} from "awayjs-full/lib/graphics";
import {PointLight, Sprite, PrimitivePlanePrefab, StaticLightPicker, DisplayObjectContainer} from "awayjs-full/lib/scene";
import {ContextGLProfile, ContextMode} from "awayjs-full/lib/stage";
import {DefaultRenderer} from "awayjs-full/lib/renderer";
import {View} from "awayjs-full/lib/view";
import {MethodMaterial, MethodMaterialMode} from "awayjs-full/lib/materials";

class RasterizeTest {

	private _view:View;
	private _timer:RequestAnimationFrame;
	private _material:MethodMaterial;
	private _object:Sprite;
	private _lightsContainer:DisplayObjectContainer;

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
		this._view.backgroundColor = 0x666666;

		// Lights.
		var numLights:number = 4;
		this._lightsContainer = new DisplayObjectContainer();
		var lights:PointLight[] = [];
		var deltaAngle:number = 2 * Math.PI / numLights;
		var cols:number[] = [0xFF0000, 0x00FF00, 0x0000FF];
		var c:number = 0;
		for(var i:number = 0; i < numLights; i++) {

			var amp:number = 700;

			var light:PointLight = new PointLight();
			light.x = amp * Math.cos(i * deltaAngle);
			light.y = 200;
			light.z = amp * Math.sin(i * deltaAngle);
			lights.push(light);

			if(c > 2) { c = 0; }
			light.color = cols[c];
			c++;

			this._lightsContainer.addChild(light);
		}
		var lightPicker:StaticLightPicker = new StaticLightPicker(lights);
		this._view.scene.addChild(this._lightsContainer);

		// Materials.
		this._material = new MethodMaterial(DefaultMaterialManager.getDefaultImage2D());
		this._material.lightPicker = lightPicker;
		this._material.mode = MethodMaterialMode.MULTI_PASS; // necessary for more than 3 lights.

		// Geometry.
		this.initQuad();
	}

	private initQuad() {

		var segsHorizontal:number = 1;
		var segsVertical:number = 1;
		// console.log("  plane triangles: " + segsHorizontal * segsVertical * 2);
		this._object = <Sprite> new PrimitivePlanePrefab(this._material, ElementsType.TRIANGLE, 2000, 2000, 1, 1).getNewObject();

		this._object.y = -300;
		this._object.z = 1000;
		this._object.rotationX = -15;

		this._lightsContainer.x = this._object.x;
		this._lightsContainer.y = this._object.y;
		this._lightsContainer.z = this._object.z;

		this._view.scene.addChild(this._object);
	}

	private initListeners():void {

		window.onresize  = (event:UIEvent) => this.onResize(event);

		this.onResize();

		// Animation.
		this._timer = new RequestAnimationFrame(this.onEnterFrame, this);
		this._timer.start();
	}

	private onEnterFrame(dt:number):void  {

		var k:number = this._useSoftware ? 10 : 1;
		this._lightsContainer.rotationY += .5 * k;

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
	new RasterizeTest();
};