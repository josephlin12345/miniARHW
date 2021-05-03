let camera, scene, renderer;
let arToolkitSource, arToolkitContext;

const init = () => {
	// init scene and camera
	scene = new THREE.Scene();
	camera = new THREE.Camera();

	// init renderer
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// handle window resize
	window.addEventListener('resize', onWindowResize);

	// init arToolkitSource
	arToolkitSource = new THREEx.ArToolkitSource();
	arToolkitSource.init(() => {
		const interval = setInterval(() => {
			if(!arToolkitSource.domElement.videoWidth) return;
			onWindowResize();
			clearInterval(interval);
		}, 1000 / 50);
	});

	// init arToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext();
	arToolkitContext.init(() => camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix()));

	const addMarker = () => {
		const markerRoot = new THREE.Group();
		new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
			type : 'pattern',
			patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
		})
		return markerRoot;
	}
	const marker = addMarker();
	scene.add(marker);
}

const onWindowResize = () => {
	arToolkitSource.onResizeElement();
	arToolkitSource.copyElementSizeTo(renderer.domElement);
	if(arToolkitContext.arController !== null) {
		arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
	}
}

const animate = () => {
	requestAnimationFrame(animate);

	if(arToolkitSource.ready === false)	return
	arToolkitContext.update(arToolkitSource.domElement);

	renderer.render(scene, camera);
}

init();
animate();
