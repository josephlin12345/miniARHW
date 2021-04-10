let camera, scene, cameraHUD, sceneHUD, renderer;
let arToolkitSource, arToolkitContext;
let marker, button, circle;
let halfH, halfW;
let angle = 0;
let isSpin = false;
let omega = 0;

const addMarker = () => {
	const markerRoot = new THREE.Group();
	new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
		type : 'pattern',
		patternUrl : '../../data/data/patt.hiro'
	});
	return markerRoot;
}

const addArrow = () => {
	const arrow = new THREE.ArrowHelper(
		new THREE.Vector3(0, 1, 0),
		new THREE.Vector3(0, 0, 0),
		0.5,
		0x000000,
		0.2,
		0.1
	);
	arrow.rotateX(-Math.PI / 2);
	return arrow;
}

const addCircle = () => {
	const group = new THREE.Group();
	
	const geometry0 = new THREE.CircleGeometry(0.5, 32, Math.PI/2, 2*Math.PI/3);
	const material0 = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
	const circle0 = new THREE.Mesh(geometry0, material0);
	group.add(circle0);

	const geometry1 = new THREE.CircleGeometry(0.5, 32, Math.PI/2 + 2/3*Math.PI, 2*Math.PI/3);
	const material1 = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
	const circle1 = new THREE.Mesh(geometry1, material1);
	group.add(circle1);

	const geometry2 = new THREE.CircleGeometry(0.5, 32, Math.PI/2 - 2/3*Math.PI, 2*Math.PI/3);
	const material2 = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide });
	const circle2 = new THREE.Mesh(geometry2, material2);
	group.add(circle2);

	group.rotateX(-Math.PI / 2);

	return group;
}

const toggle = () => {
	isSpin = !isSpin;
	document.getElementById('btn').innerText = isSpin ? 'stop' : 'spin';
}

const clamp = (x, xLo, xHi) => {
	if (x < xLo) return xLo;
	if (x > xHi) return xHi;
	else return x;
}

const onMouseDown = event => {
	event.preventDefault();
	const ndcX = (event.clientX / window.innerWidth) * 2 - 1;
	const ndcY = -(event.clientY / window.innerHeight) * 2 + 1;
	pickCompute(ndcX, ndcY);
}

const onTouchStart = event => {
	if (event.touches.length == 1) {
		event.preventDefault();
		const ndcX = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
		const ndcY = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
		pickCompute(ndcX, ndcY);
	}
}

const init = () => {
	// init scene and camera
	scene = new THREE.Scene();
	camera = new THREE.Camera();
	sceneHUD = new THREE.Scene();

	halfH = 10;
  halfW = halfH * (window.innerWidth / window.innerHeight);
	cameraHUD = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -10, 10);

	// init renderer
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);

	// handle window resize
	window.addEventListener('resize', onWindowResize);

	// init arToolkitSource
	arToolkitSource = new THREEx.ArToolkitSource();
	arToolkitSource.init(onWindowResize);

	// init arToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: '../../data/data/camera_para.dat',
	});
	arToolkitContext.init(() => camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix()));

	marker = addMarker();
	scene.add(marker);

	const addButton = () => {
		const loader = new THREE.TextureLoader();
		loader.setCrossOrigin('');
		loader.load(
			'https://i.imgur.com/TEa3TVe.png',
			texture => {
				button = new THREE.Mesh(new THREE.CircleGeometry(1, 36), new THREE.MeshBasicMaterial({ map: texture }));
				button.position.set(0, -5, 0);
				sceneHUD.add(button);
			}
		);
	}
	addButton();

	circle = addCircle();
	marker.add(circle);

	const arrow = addArrow();
	marker.add(arrow);

	const _iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);
	if(_iOSDevice) {
		window.addEventListener("touchstart", onTouchStart);
		window.addEventListener("touchend", () => isSpin = false);
	}
	else {
		window.addEventListener("mouseup", () => isSpin = false);
		window.addEventListener("mousedown", onMouseDown);
	}
}

const onWindowResize = () => {
	arToolkitSource.onResizeElement();
	arToolkitSource.copyElementSizeTo(renderer.domElement);
	if(arToolkitContext.arController !== null) {
		arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
	}
}

const pickCompute = (ndcX, ndcY) => {
	// use 2D algorithm
	const d2To = (v1, v2) => Math.sqrt(v1 ** 2 + (v2 - (-5)) ** 2);
	const dist = d2To(halfW * ndcX, halfH * ndcY);
	if (dist < 1) {
		isSpin = !isSpin;
	}
}

const animate = () => {
	requestAnimationFrame(animate);

	if(arToolkitSource.ready === false)	return
	arToolkitContext.update(arToolkitSource.domElement);

	const dt = 0.2;
	if(isSpin) {
		omega += 0.5*dt;
	}
	else {
		omega -= 0.2*dt;
	}
	omega = clamp(omega, 0, 3);

	angle += omega * dt;
	circle.rotation.z = angle;

	const theta = angle % (2 * Math.PI) * (180 / Math.PI);
	const text = document.getElementById('text');
	if(theta >= 0 && theta < 120) {
		text.style.color = 'blue';
		text.innerText = 'blue';
	}
	else if(theta >= 120 && theta < 240) {
		text.style.color = 'green';
		text.innerText = 'green';
	}
	else {
		text.style.color = 'red';
		text.innerText = 'red';
	}

	button.material.visible = marker.visible;
	renderer.clear();
	renderer.render(scene, camera);
	renderer.render(sceneHUD, cameraHUD);
}

init();
animate();
