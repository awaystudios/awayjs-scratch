/**
 * Created by palebluedot on 11/16/16.
 */

import {DefaultRenderer} from "awayjs-full/lib/renderer";
import {View} from "awayjs-full/lib/view";
import {RequestAnimationFrame, Vector3D} from "awayjs-full/lib/core";
import {DirectionalLight, Sprite} from "awayjs-full/lib/scene";
import {PrimitiveTorusPrefab, StaticLightPicker} from "awayjs-full/lib/scene";
import {MethodMaterial} from "awayjs-full/lib/materials";
import {DefaultMaterialManager} from "awayjs-full/lib/graphics";
import {ElementsType} from "awayjs-full/lib/graphics";

class RasterizeTest {

	private _view:View;
	private _light:DirectionalLight;
	private _timer:RequestAnimationFrame;
	private _object:Sprite;

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
			renderer = new DefaultRenderer(null, false, "baseline", "software");
		}
		else {
			renderer = new DefaultRenderer();
		}
		this._view = new View(renderer);
		this._view.backgroundColor = 0x666666;

		// Lights.
		this._light = new DirectionalLight(-1, -1, 1);
		var lightPicker:StaticLightPicker = new StaticLightPicker([this._light]);
		this._view.scene.addChild(this._light);

		// Materials.
		var material:MethodMaterial = new MethodMaterial(DefaultMaterialManager.getDefaultImage2D());
		material.lightPicker = lightPicker;

		// Geometry.
		var segsRadial:number = 40; // major ring
		var segsTubular:number = 40; // minor ring
		console.log("  torus triangles: " + segsRadial * segsTubular * 2);
		this._object = <Sprite> new PrimitiveTorusPrefab(material, ElementsType.TRIANGLE, 250, 150, segsRadial, segsTubular).getNewObject();
		this._object.rotationX = 90;
		this._view.scene.addChild(this._object);
	}

	private initListeners() {

		document.onmousedown = (event:MouseEvent) => this.onMouseDown(event);
		window.onresize  = (event:UIEvent) => this.onResize(event);

		this.onResize();

		// Animation.
		// this._timer = new RequestAnimationFrame(this.onEnterFrame, this);
		// this._timer.start();

		// First render takes a bit longer, so do a few
		// to start with a 'warmed up' engine.
		this._view.render();
		this._view.render();
	}

	private onMouseDown(event:MouseEvent):void  {

		var numTimes:number = 10;

		this._light.color = Math.random() * 0xFFFFFF;

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
		this._object.rotationX += .1 * k;
		this._object.rotationY += .2 * k;
		this._object.rotationZ += .3 * k;

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