import * as THREE from 'https://cdn.skypack.dev/three@latest'
import {GLTFLoader} from "https://cdn.skypack.dev/three@latest/examples/jsm/loaders/GLTFLoader.js"
import {DRACOLoader} from "https://cdn.skypack.dev/three@latest/examples/jsm/loaders/DRACOLoader.js"
import {Water} from "https://cdn.skypack.dev/three@latest/examples/jsm/objects/Water2.js"


export function dance(avatar){
	// shoulder.L
	// shoulder.R
	// hips
}


function addLights(scene){
	const alight = new THREE.AmbientLight( 0x404040 ); // soft white light
	alight.name = "alight"
	scene.add( alight );

	const plight = new THREE.PointLight(0xD35B5B, 1, 100)
	plight.name="plight"
	plight.position.set(0,50,0)
	scene.add(plight)
}


const cloneGltf = (gltf) => {
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true)
  };

  const skinnedMeshes = {};

  gltf.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const cloneBones = {};
  const cloneSkinnedMeshes = {};

  clone.scene.traverse(node => {
    if (node.isBone) {
      cloneBones[node.name] = node;
    }

    if (node.isSkinnedMesh) {
      cloneSkinnedMeshes[node.name] = node;
    }
  });

  for (let name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones = [];

    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(
        new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
        cloneSkinnedMesh.matrixWorld);
  }

  return clone;
}

export function addAvatar(scene, name){
	const avatar_model = scene.getObjectByName("avatar_model")

	return new Promise(function(resolve, reject){
		function copymodel(){
			const avatar = scene.getObjectByName("avatar_model")
			const new_avatar = cloneGltf({scene:avatar, animations:[]})
			new_avatar.scene.name = name
			new_avatar.scene.visible = true
			scene.add(new_avatar.scene)
			new_avatar.scene.scale.setScalar(0.3)
			return new_avatar.scene
		}

		if(!avatar_model){
			const loader = new GLTFLoader();

			const dracoLoader = new DRACOLoader();
			dracoLoader.setDecoderPath( '/draco/' );
			loader.setDRACOLoader( dracoLoader );
			loader.load(
				'glb/human2.glb',
				function ( gltf ) {

					const body = gltf.scene.getObjectByName("body")
					body.material = new THREE.MeshBasicMaterial({color: 0x00ff00})
					gltf.scene.name = "avatar_model"
					scene.add( gltf.scene )
					gltf.scene.visible = false
					resolve(copymodel())			
				}, function(){},
			);
		}else{
			resolve(copymodel())
		}

	})

}

function addglb(scene){
	const loader = new GLTFLoader();

	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath( '/draco/' );
	loader.setDRACOLoader( dracoLoader );
	loader.load(
		'glb/world2.glb',
		function ( gltf ) {
			gltf.scene.name = "world"
			gltf.scene.position.x = 25
			gltf.scene.position.z = 8
			scene.add( gltf.scene )
		}, function(){},
	);



	loader.load(
		'glb/tumba.glb',
		function ( gltf ) {
			gltf.scene.name = "tumba"
			gltf.scene.scale.setScalar(0.3)

			gltf.scene.children.forEach(( chil )=>{
				chil.material = new THREE.MeshBasicMaterial({color:0xff0000})
			})
			const pos = Array.from(new Array(20), (x,i) => {
				return [ 
					(Math.sin(40*i) * (Math.atan(3*i) * 40) % 20) / 4,
					(Math.cos(20*i) * (Math.atan(4*i) * 60) % 30) / 4,
					Math.abs(Math.sin(10*i)) * 0.3 + 0.3,
					Math.sin(10*i)
				]
			})

			pos.forEach((x,i)=>{
				const tumba = gltf.scene.clone()
				tumba.name += i
				tumba.position.set(x[0], 0, x[1] )
				tumba.scale.setScalar(x[2])
				tumba.rotation.y = x[3]
				scene.add( tumba)
			})

		}, function(){},
	);

}

function addFloor(scene){
	const geom = new THREE.PlaneGeometry(17, 15, 100, 100)
	const mat = new THREE.MeshStandardMaterial({
		map: new THREE.TextureLoader().load('./textures/floor.jpg'),
		displacementMap: new THREE.TextureLoader().load('./textures/floor.jpg'),
		displacementScale:0.25,
		displacementBias:-0.25,
		side: THREE.DoubleSide
	})


	mat.map.wrapS = THREE.RepeatWrapping 
	mat.map.wrapT = THREE.RepeatWrapping 
	mat.map.repeat.set(2, 2)

	const floor = new THREE.Mesh(geom, mat)
	floor.name = "floor"

	floor.rotation.x = Math.PI/2

	floor.position.x = 4.5
	floor.position.z = 0.5
	floor.position.y = 0.0001
	window.f = floor
	scene.add(floor)
}

function addMaquinas(scene){
	const geom= new THREE.CylinderGeometry( 0.25, 0.1, 20, 100,100);
	const mat= new THREE.MeshStandardMaterial( {
		map: new THREE.TextureLoader().load('./textures/meat.jpg'),
		displacementMap: new THREE.TextureLoader().load('./textures/meat.jpg'),
		displacementScale:0.25,
		side: THREE.DoubleSide,
	} );

	let i = 0
	setInterval(function(){
		mat.displacementScale =  0.1+Math.sin(i)*0.02
		i++;
	},200)


	mat.map.wrapS = THREE.RepeatWrapping 
	mat.map.wrapT = THREE.RepeatWrapping 
	mat.map.repeat.set(4, 4)
	
	const cil_pos = [
		[12.5, -3],
		[12, 7],
		[-3, 7],
		[-3, -3]
	]
	const tubes =  new THREE.Group()
	tubes.name = "tubes"
	cil_pos.forEach( (pos)=>{
		const c = new THREE.Mesh( geom, mat );
		c.position.x = pos[0]
		c.position.z = pos[1]
		tubes.add(c)
	})
	tubes.position.y = 9
	scene.add(tubes)

	const geom2 = new THREE.ConeGeometry(2, 10, 20,100, 100)
	const mat2= new THREE.MeshStandardMaterial( {
		map: new THREE.TextureLoader().load('./textures/meat.jpg'),
		displacementMap: new THREE.TextureLoader().load('./textures/meat.jpg'),
		displacementScale:0.25,
		side: THREE.DoubleSide,
	} );

	mat2.map.wrapS = THREE.RepeatWrapping 
	mat2.map.wrapT = THREE.RepeatWrapping 
	mat2.map.repeat.set(4, 4)
	
	const mesa =  new THREE.Mesh(geom2, mat2)
	mesa.position.y = 1
	mesa.position.x = 3
	//0.4,1.8
	scene.add(mesa)


	// raices

	// {x: 17.0258, y: 2, z: -2.3251}
	// {x: 16.923, y: 2, z: 17.135}

}

function addBlood(scene){
	const textureLoader = new THREE.TextureLoader();
	const geom =  new THREE.PlaneGeometry(15, 20, 100, 100)
	const blood = new Water(geom, {
		color: 0xff0000,
		normalMap0: textureLoader.load( 'img/Water_2_M_Normal.jpg'),
		normalMap1: textureLoader.load( 'img/Water_1_M_Normal.jpg'),
	})
	blood.name = "blood"
	blood.rotation.x = -Math.PI/2
	blood.position.set(4, -0.001, 11)
	scene.add(blood)
}


function addEyes(scene){
	const geom = new THREE.SphereGeometry(0.9)
	const mat = new THREE.MeshStandardMaterial({
		map: new THREE.TextureLoader().load('./textures/eye.jpg'),
		displacementMap: new THREE.TextureLoader().load('./textures/eye.jpg'),
		displacementScale:0.125,
		side: THREE.DoubleSide
	})

	const eye = new THREE.Mesh(geom, mat)
	eye.position.y = 2
	eye.name="eye"

	const pos = Array.from(new Array(20), (x,i) => {
		return [ 
			5 + 10*Math.cos(i) ,
			10 + 2* (i/2) ,
			Math.abs(Math.sin(10*i)) * 0.3 + 0.3,
		]
	})

	pos.forEach(function(p,i){
		const e = eye.clone()
		e.name = `eye${i}` 
		e.position.x = p[0]
		e.position.z = p[1] 
		e.rotation.y =  p[2]
		scene.add(e)
		setInterval(function(){
			const avatar = scene.getObjectByName('avatar')
			const avatars = scene.children.filter(x => x.name.startsWith('avatar') && x.name!='avatar_model')
			
			const dist = avatars.map(function(avt){
				const pos = avt.position.clone()
				pos.y = e.position.y
				return avt.position.distanceTo(e.position)
			})

			const mind = Math.min(...dist)
			if(mind < 5){
				const sel = avatars[dist.indexOf(mind)]
				const pos = sel.position.clone()
				pos.y = e.position.y
				e.lookAt(pos)
				e.rotation.y += Math.PI * 1/2
			}
		},100)
	})

}

function addTecho(scene){

	const geom = new THREE.TorusGeometry(17, 0.7, 10, 10, Math.PI * 10/8)
	const mat = new THREE.MeshBasicMaterial({
		color:0x0000ff,
		side: THREE.DoubleSide
	})

	const mesh = new THREE.Mesh(geom, mat)

	const pos = Array.from(new Array(10), (x,i) =>{
		return [
			15 + 2*Math.sin(0.3*i),
			18 + (i * 2),
			Math.sin(i)/100
		]
	})

	pos.forEach(function(p,i){
		const m = mesh.clone()
		m.position.set(p[0], 0, p[1])
		m.rotation.z = p[2]
		m.name = `spine-${i}`
		scene.add(m)

	})
}


export function initWorld(scene){
	console.info("creating world...")

	addLights(scene)
	addglb(scene)
	addFloor(scene)
	addMaquinas(scene)
	addEyes(scene)
	addTecho(scene)
}

