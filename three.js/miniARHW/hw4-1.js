let camera, scene, renderer;
let cannon, clock, ball, pos, vel, force, barrel;

const init = () => {
	// init scene and camera
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set (0,150,150);

	// init renderer
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x888888);
	document.body.appendChild(renderer.domElement);

  new THREE.OrbitControls(camera, renderer.domElement);
  var gridXZ = new THREE.GridHelper(200, 20, 'red', 'white');
  scene.add(gridXZ);

  cannon = makeCannon();
	scene.add(cannon);

  clock = new THREE.Clock();

  barrel = makeBarrel();
  scene.add(barrel);
  barrel.rotation.z = -Math.PI / 6;
  barrel.rotation.y = -Math.PI / 6;
  cannon.rotation.y = -Math.PI / 6;

  window.addEventListener('keydown', event => {
    console.log(barrel.rotation.z);
    switch(event.key) {
      case 'ArrowRight':
        cannon.rotation.y -= Math.PI / 90;
        barrel.rotation.y -= Math.PI / 90;
        break;
      case 'ArrowLeft':
        cannon.rotation.y += Math.PI / 90;
        barrel.rotation.y += Math.PI / 90;
        break;
      case 'ArrowDown':
        if(barrel.rotation.z > -1.5)
          barrel.rotation.z -= Math.PI / 90;
        break
      case 'ArrowUp':
        if(barrel.rotation.z < -0.5)
          barrel.rotation.z += Math.PI / 90;
        break
      case ' ':
        if(!ball) {
          ball = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshBasicMaterial({ color: 'yellow', wireframe: true })
          );
          scene.add(ball);
        }
        break;
    }
  })

}

function makeBarrel() {
  const group = new THREE.Group();
  barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 20, 18),
    new THREE.MeshNormalMaterial()
  );
  barrel.position.y = 10;
  group.add(barrel);
  return group;
}

function makeCannon() {
  const group = new THREE.Group();
  cannon = new THREE.Mesh(
    new THREE.SphereGeometry(10, 20, 20, Math.PI + Math.PI * 0.1, Math.PI * 1.8,0, Math.PI / 2),
    new THREE.MeshNormalMaterial()
  );
  group.add(cannon);
  return group;
}

function computeInitPosVel() {
  const SPEED = 25;
	vel = barrel.localToWorld(new THREE.Vector3(0,20,0)).sub(
  barrel.localToWorld(new THREE.Vector3(0,0,0))).setLength(SPEED);
	pos = barrel.localToWorld(new THREE.Vector3(0,22,0));
	force = new THREE.Vector3(0,-10,0);
}

const animate = () => {
	requestAnimationFrame(animate);

	renderer.render(scene, camera);

  if (pos === undefined) {
  	computeInitPosVel();
  	return;
  }
  
	let dt = clock.getDelta();

	// Euler's method
  vel.add(force.clone().multiplyScalar(dt));
  pos.add(vel.clone().multiplyScalar(dt));
  if(ball) {
    ball.position.copy(pos);
    if(ball.position.y < 0) {
      scene.remove(ball);
      pos = undefined;
      ball = undefined;
    }
  }
}

init();
animate();
