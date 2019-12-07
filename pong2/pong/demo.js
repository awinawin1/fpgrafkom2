var scene, camera, renderer, mesh;
var meshFloor, ambientLight, light;
var paddle1, paddle2;
var crate, crateTexture, crateNormalMap, crateBumpMap;

var speed = 0.15, ballDirX = 1, ballDirZ = 1;
var score1 = 0, score2 = 0, maxscore = 3;


window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

var Key = {
_pressed: {},

A: 65,
W: 87,
D: 68,
S: 83,
J: 74,
L: 76,
SPACE: 32,

isDown: function(keyCode) {
	return this._pressed[keyCode];
},

onKeydown: function(event) {
	this._pressed[event.keyCode] = true;
},

onKeyup: function(event) {
	delete this._pressed[event.keyCode];
}
};

var player = { height:1.8, speed:0.2, turnSpeed:Math.PI*0.02 };
var USE_WIREFRAME = false;

var loadingScreen = {
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
	// camera.position.set(-6, 3, 23);
	box: new THREE.Mesh(
		new THREE.BoxGeometry(0.5,0.5,0.5),
		new THREE.MeshBasicMaterial({ color:0x4444ff })
	)
};
var loadingManager = null;
var RESOURCES_LOADED = false;

// Models index
var models = {
	tent: {
		obj:"models/Tent_Poles_01.obj",
		mtl:"models/Tent_Poles_01.mtl",
		mesh: null
	},
	campfire: {
		obj:"models/Campfire_01.obj",
		mtl:"models/Campfire_01.mtl",
		mesh: null
	},
	pirateship: {
		obj:"models/Pirateship.obj",
		mtl:"models/Pirateship.mtl",
		mesh: null
	}
};


// Meshes index
var meshes = {};

function init(){
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(90, 1280/720, 0.1, 1000);
	camera.position.set(0, 0, 0);
	
	loadingScreen.box.position.set(0,0,5);
	loadingScreen.camera.lookAt(loadingScreen.box.position);
	loadingScreen.scene.add(loadingScreen.box);
	
	loadingManager = new THREE.LoadingManager();
	loadingManager.onProgress = function(item, loaded, total){
		console.log(item, loaded, total);
	};
	loadingManager.onLoad = function(){
		console.log("loaded all resources");
		RESOURCES_LOADED = true;
		onResourcesLoaded();
	};
	
	
	mesh = new THREE.Mesh(
		new THREE.BoxGeometry(1,1,1),
		new THREE.MeshPhongMaterial({color:0xff4444, wireframe:USE_WIREFRAME})
	);
	mesh.position.y += 1;
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	//scene.add(mesh);
	
	meshFloor = new THREE.Mesh(
		new THREE.PlaneGeometry(20,20, 10,10),
		new THREE.MeshPhongMaterial({color:0xffffff, wireframe:USE_WIREFRAME})
	);
	meshFloor.rotation.x -= Math.PI / 2;
	meshFloor.receiveShadow = true;
	scene.add(meshFloor);
	
	
	ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
	scene.add(ambientLight);
	
	light = new THREE.PointLight(0xffffff, 0.8, 18);
	light.position.set(-3,6,-3);
	light.castShadow = true;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 25;
	scene.add(light);
	
	
	var textureLoader = new THREE.TextureLoader(loadingManager);
	crateTexture = textureLoader.load("crate0/crate0_diffuse.jpg");
	crateBumpMap = textureLoader.load("crate0/crate0_bump.jpg");
	crateNormalMap = textureLoader.load("crate0/crate0_normal.jpg");
	
	crate = new THREE.Mesh(
		new THREE.BoxGeometry(12,2,5),
		new THREE.MeshPhongMaterial({
			color:0xffffff,
			map:crateTexture,
			bumpMap:crateBumpMap,
			normalMap:crateNormalMap
		})
	);
	scene.add(crate);
	crate.position.set(-1, 1, -5);
	crate.receiveShadow = true;
	crate.castShadow = true;

	paddle1 = new THREE.Mesh(
		new THREE.BoxGeometry(0.5,0.5,1.2),
		new THREE.MeshPhongMaterial({
			color:0x87CEFA,
			
		})
	);
	scene.add(paddle1);
	paddle1.position.set(4.5, 2.2, -5);


	paddle2 = new THREE.Mesh(
		new THREE.BoxGeometry(0.5,0.5,1.2),
		new THREE.MeshPhongMaterial({
			color:0x87CEFA,
			
		})
	);
	scene.add(paddle2);
	paddle2.position.set(-6.5, 2.2, -5);

	ball = new THREE.Mesh(
		new THREE.SphereGeometry(0.2,10,10),
		new THREE.MeshPhongMaterial({
			color:0x87CEFA,
			
		})
	);
	scene.add(ball);
	ball.position.set(-1.3, 2.3, -5);
	// crate.receiveShadow = true;
	// crate.castShadow = true;
	
	// Load models
	// REMEMBER: Loading in Javascript is asynchronous, so you need
	// to wrap the code in a function and pass it the index. If you
	// don't, then the index '_key' can change while the model is being
	// downloaded, and so the wrong model will be matched with the wrong
	// index key.
	for( var _key in models ){
		(function(key){
			
			var mtlLoader = new THREE.MTLLoader(loadingManager);
			mtlLoader.load(models[key].mtl, function(materials){
				materials.preload();
				
				var objLoader = new THREE.OBJLoader(loadingManager);
				
				objLoader.setMaterials(materials);
				objLoader.load(models[key].obj, function(mesh){
					
					mesh.traverse(function(node){
						if( node instanceof THREE.Mesh ){
							node.castShadow = true;
							node.receiveShadow = true;
						}
					});
					models[key].mesh = mesh;
					
				});
			});
			
		})(_key);
	}
	
	
	camera.position.set(0, player.height*8, -10);
	camera.lookAt(new THREE.Vector3(0,player.height,0));
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(1024, 576);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	
	// document.body.appendChild(renderer.domElement);
	document.getElementById("tengah").appendChild(renderer.domElement);
	animate();
}

// Runs when all resources are loaded
function onResourcesLoaded(){
	
	// Clone models into meshes.
	meshes["tent1"] = models.tent.mesh.clone();
	meshes["tent2"] = models.tent.mesh.clone();
	meshes["campfire1"] = models.campfire.mesh.clone();
	meshes["campfire2"] = models.campfire.mesh.clone();
	meshes["pirateship"] = models.pirateship.mesh.clone();
	
	// Reposition individual meshes, then add meshes to scene
	meshes["tent1"].position.set(-5, 0, 4);
	scene.add(meshes["tent1"]);
	
	meshes["tent2"].position.set(-8, 0, 4);
	scene.add(meshes["tent2"]);
	
	meshes["campfire1"].position.set(-5, 0, 1);
	meshes["campfire2"].position.set(-8, 0, 1);
	
	scene.add(meshes["campfire1"]);
	scene.add(meshes["campfire2"]);
	
	meshes["pirateship"].position.set(-11, -1, 1);
	meshes["pirateship"].rotation.set(0, Math.PI, 0); // Rotate it to face the other way.
	scene.add(meshes["pirateship"]);
}

function animate(){

	// Play the loading screen until resources are loaded.
	

	if( RESOURCES_LOADED == false ){
		requestAnimationFrame(animate);
		
		loadingScreen.box.position.x -= 0.05;
		if( loadingScreen.box.position.x < -10 ) loadingScreen.box.position.x = 10;
		loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x);
		
		renderer.render(loadingScreen.scene, loadingScreen.camera);
		return;
	}

	requestAnimationFrame(animate);

	
	// mesh.rotation.x += 0.01;
	// mesh.rotation.y += 0.02;
	
	// // Uncomment for absurdity!
	// meshes["pirateship"].rotation.z += 0.01;
	
	// if(keyboard[87]){ // W key
	// 	camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
	// 	camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
	// }
	// if(keyboard[83]){ // S key
	// 	camera.position.x += Math.sin(camera.rotation.y) * player.speed;
	// 	camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
	// }
	// if(keyboard[65]){ // A key
	// 	camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
	// 	camera.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
	// }
	// if(keyboard[68]){ // D key
	// 	camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
	// 	camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
	// }
	
	// if(keyboard[37]){ // left arrow key
	// 	camera.rotation.y -= player.turnSpeed;
	// }
	// if(keyboard[39]){ // right arrow key
	// 	camera.rotation.y += player.turnSpeed;
	// }

	// if(Keyboard[87]){
	// 	paddle1DirX = speed * 0.5;
	// }
	paddlemove();
	ballmove();
	paddleball();
	renderer.render(scene, camera);
}

function paddlemove(){
	var moveDistance = 0.07;
	if (Key.isDown(Key.D)){
		if(paddle1.position.z > -6.85){
			paddle1.translateZ(-moveDistance);
		}
	}
	else if (Key.isDown(Key.A)){
		if(paddle1.position.z < -3.1){
			paddle1.translateZ(moveDistance);
		}
	}
	if (Key.isDown(Key.J)){
		if(paddle2.position.z > -6.85){
			paddle2.translateZ(-moveDistance);
		}
	}
	else if (Key.isDown(Key.L)){
		if(paddle2.position.z < -3.1){
			paddle2.translateZ(moveDistance);
		}
	}
}

function ballmove(){
	speed += 0.0002;

	if (ball.position.z > -2.75){
		ballDirZ = -ballDirZ;
	}
	if (ball.position.z < -7.2){
		ballDirZ = -ballDirZ;
	}

	if(ballDirX > speed * 2){
		ballDirX = speed * 2;
	}
	
	if(ballDirZ > speed * 2){
		ballDirZ = speed * 2;
	}


	ball.position.x += ballDirX * speed;
	ball.position.z += ballDirZ * speed;

	if (ball.position.x < -8){
		resetball()
		score1++;
		document.getElementById("score1").innerHTML = score1;
		checkscore();
	}
	if (ball.position.x > 6){
		resetball();
		score2++;
		document.getElementById("score2").innerHTML = score2;
		checkscore();
	}

}

function paddleball(){
	if (ball.position.x <= paddle1.position.x && ball.position.x >= paddle1.position.x - 0.5){
		if (ball.position.z <= paddle1.position.z + 0.6 && ball.position.z >= paddle1.position.z - 0.6){	
			ballDirX = -ballDirX;
		}
	}

	if (ball.position.x <= paddle2.position.x + 0.5 && ball.position.x >= paddle2.position.x){
		if (ball.position.z <= paddle2.position.z + 0.6 && ball.position.z >= paddle2.position.z - 0.6){	
			ballDirX = -ballDirX;
		}
	}
}

function resetball(){
	ball.position.x = -1.3;
	ball.position.z = -5;
	speed = 0.15;
	ballDirZ = 1;
	ballDirX = -ballDirX;
}

function checkscore(){
	if (score1 >= maxscore){
		ballDirX = 0;
		ballDirZ = 0;
		document.getElementById("winner").innerHTML = "Player 1 Wins!";
	}
	else if(score2 >= maxscore){
		ballDirX = 0;
		ballDirZ = 0;
		document.getElementById("winner").innerHTML = "Player 2 Wins";
	}
}

