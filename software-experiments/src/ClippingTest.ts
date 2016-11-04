import {Vector3D, Debug, RequestAnimationFrame}															from "awayjs-full/lib/core";
import {DefaultRenderer}															from "awayjs-full/lib/renderer";

import {MethodMaterial}													from "awayjs-full/lib/materials";
import {View}				from "awayjs-full/lib/view";
import {Sprite, DirectionalLight}											from "awayjs-full/lib/display";
import {BasicMaterial, DefaultMaterialManager}												from "awayjs-full/lib/graphics";
import {StaticLightPicker}													from "awayjs-full/lib/display";
import {PrimitivePrefabBase, PrimitiveCapsulePrefab, PrimitiveConePrefab,
	PrimitiveCubePrefab, PrimitiveCylinderPrefab, PrimitivePlanePrefab,
	PrimitiveSpherePrefab, PrimitiveTorusPrefab, PrimitivePolygonPrefab}							from "awayjs-full/lib/display";

class ClippingTest
{

	private view:View;
	private raf:RequestAnimationFrame;
	private plane:Sprite;
	private zAnimate:number = 0;

	constructor()
	{
		console.log("ClippingTest - constructor()")

		// RENDERER.
		var renderer:DefaultRenderer = new DefaultRenderer(null, false, "baseline", "software");
		// var renderer:DefaultRenderer = new DefaultRenderer();
		this.view = new View(renderer);
		this.view.backgroundColor = 0x666666;

		// Camera.
		this.view.camera.x = 0;
		this.view.camera.y = 0;
		this.view.camera.z = 0;
		this.view.camera.projection.near = 250;
		this.view.camera.projection.far = 1000000000000;

		// Listeners.
		this.raf = new RequestAnimationFrame(this.render, this);
		window.onresize = (event:UIEvent) => this.onResize(event);

		this.initScene();

		this.raf.start();
		this.onResize();
	}

	private initScene():void  {

		var material:MethodMaterial = new MethodMaterial(DefaultMaterialManager.getDefaultImage2D());
		// var material:MethodMaterial = new MethodMaterial(0xFF0000);

		this.plane = <Sprite> new PrimitivePlanePrefab(material, "triangle", 500, 500, 1, 1).getNewObject();
		// this.plane = <Sprite> new PrimitivePolygonPrefab(material, "triangle", 300, 4, true).getNewObject();
		this.plane.rotationY = 45;
		this.plane.z = 500;
		this.plane.x = 500;
		this.plane.rotationZ = 90;
		// this.plane.debugVisible = true;
		this.view.scene.addChild(this.plane);
	}

	private render()  {

		this.plane.z = 600 + 500 * Math.cos(this.zAnimate);
		this.plane.rotationZ = 90 + 45 * Math.cos(this.zAnimate);
		this.plane.rotationX = 35 * Math.cos(this.zAnimate);
		this.zAnimate += 0.01;

		this.view.render();
	}

	public onResize(event:UIEvent = null)
	{
		this.view.y = 0;
		this.view.x = 0;

		this.view.width = window.innerWidth;
		this.view.height = window.innerHeight;
	}
}

window.onload = function()
{
	new ClippingTest();
}