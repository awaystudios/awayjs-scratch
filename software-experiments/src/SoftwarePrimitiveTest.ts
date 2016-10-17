import {Vector3D}															from "awayjs-full/lib/geom";
import {Debug, RequestAnimationFrame}										from "awayjs-full/lib/utils";

import {View, DefaultRenderer, MethodMaterial, BasicMaterial}				from "awayjs-full";
import {Sprite, DirectionalLight}											from "awayjs-full/lib/display";
import {DefaultMaterialManager}												from "awayjs-full/lib/managers";
import {StaticLightPicker}													from "awayjs-full/lib/materials";
import {PrimitivePrefabBase, PrimitiveCapsulePrefab, PrimitiveConePrefab,
	PrimitiveCubePrefab, PrimitiveCylinderPrefab, PrimitivePlanePrefab,
	PrimitiveSpherePrefab, PrimitiveTorusPrefab}							from "awayjs-full/lib/prefabs";

class SoftwarePrimitivesTest
{

	private view:View;
	private raf:RequestAnimationFrame;
	private sprites:Array<Sprite> = new Array<Sprite>();
	private light:DirectionalLight;
	private lightB:DirectionalLight;
	private staticLightPicker:StaticLightPicker;
	private radius:number = 400;

	constructor()
	{
		console.log("SoftwarePrimitivesTest - constructor()")

		Debug.LOG_PI_ERRORS    = false;
		Debug.THROW_ERRORS     = false;

		// var defaultRenderer:DefaultRenderer = new DefaultRenderer(null, false, "baseline", "software");
		var defaultRenderer:DefaultRenderer = new DefaultRenderer();
		defaultRenderer.antiAlias = 1;

		this.view = new View(defaultRenderer);

		this.raf = new RequestAnimationFrame(this.render, this);

		this.light = new DirectionalLight();
		this.light.color = 0xFFFFFF;
		this.light.direction = new Vector3D(1, 1, 0);
		this.light.ambient = 0;
		this.light.ambientColor = 0xFFFFFF;
		this.light.diffuse = 1;
		this.light.specular = 1;

		this.lightB = new DirectionalLight();
		this.lightB.color = 0xFF0000;
		this.lightB.direction = new Vector3D( -1 , 0 ,1 );
		this.lightB.ambient = 0;
		this.lightB.ambientColor = 0xFFFFFF;
		this.lightB.diffuse = 1;
		this.lightB.specular = 1;

		this.staticLightPicker = new StaticLightPicker([this.light , this.lightB]);

		this.view.scene.addChild(this.light);
		this.view.scene.addChild(this.lightB);

		this.view.backgroundColor = 0x000000;

		window.onresize = (event:UIEvent) => this.onResize(event);

		this.initSpritees();
		this.raf.start();
		this.onResize();
	}

	private initSpritees():void
	{

		var primitives:Array<PrimitivePrefabBase> = new Array<PrimitivePrefabBase>();

		var material:MethodMaterial = new MethodMaterial(DefaultMaterialManager.getDefaultImage2D());
		material.lightPicker = this.staticLightPicker;

		primitives.push(new PrimitiveTorusPrefab());
		primitives.push(new PrimitiveSpherePrefab());
		primitives.push(new PrimitiveCapsulePrefab());
		primitives.push(new PrimitiveCylinderPrefab());
		primitives.push(new PrimitivePlanePrefab());
		primitives.push(new PrimitiveConePrefab());
		primitives.push(new PrimitiveCubePrefab());

		var sprite:Sprite;

		for (var c:number = 0; c < primitives.length; c ++) {
			primitives[c].material = material;

			var t:number = Math.PI*2*c/primitives.length;

			sprite = <Sprite> primitives[c].getNewObject();
			sprite.x = Math.cos(t)*this.radius;
			sprite.y = Math.sin(t)*this.radius;
			sprite.z = 0;
			// sprite.transform.scaleTo(2, 2, 2);

			this.view.scene.addChild(sprite);
			this.sprites.push(sprite);
		}


	}

	private render()
	{
		if (this.sprites) {
			for (var c:number = 0; c < this.sprites.length; c++) {
				this.sprites[c].rotationX += 1;
				this.sprites[c].rotationY += 2;
				this.sprites[c].rotationZ += 3;
			}
		}

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
	new SoftwarePrimitivesTest();
}