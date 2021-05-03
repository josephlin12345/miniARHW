let camera, cameraHUD, scene, sceneHUD, renderer;
let arToolkitSource, arToolkitContext;
let marker, target, button;
let halfH, halfW;
let loader;

let uvOffsetArray = [];
let baseS, baseT;
let sprite;

function buildSprite(texMat, markerGroup) {
	const size = 2.0;

	// old school ...
	const vertices = [-size/2, -size/2, 0, size/2, -size/2, 0,
                    size/2, size/2, 0, -size/2, size/2, 0];
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		
	const indices = [0,1,2, 0,2,3];
	geometry.setIndex(indices);

	const uvs = []
	uvs.push (0,0.75, 0.125,0.75, 0.125,1, 0,1);  // LL of first frame: [0, 0.75]
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

	geometry.computeBoundingSphere();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    sprite = new THREE.Mesh(geometry, texMat);
    markerGroup.add(sprite);
}

function initSprite(markerGroup) {
  setUpOffsetArray();

  // load a resource
  loader.load(
    // resource URL
    '6ePTx6p.png',

    // Function when resource is loaded
    function(texture) {
      // Plane with default texture coordinates [0,1]x[0,1]
      const texMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true, // cutout texture: set transparent: true
        side: THREE.DoubleSide
      });
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      buildSprite(texMat, markerGroup);
    },
    // Function called when download progresses
    function(xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // Function called when download errors
    function(xhr) {
      console.log('An error happened');
    }
  );
}

// slightly different
// this is an OFFSET array
// how the array going to increment in this state 
// initial uv (of lower left corner) is (0, 0.75)
function setUpOffsetArray() {
  const rowCount = 4; // 4x8 sprites
  const colCount = 8;
  for (let i = 0; i < rowCount; i++) {
    const row = [];
    for (let j = 0; j < colCount; j++)
      row.push(new THREE.Vector2(j * 0.125, - 0.25 * i));
    uvOffsetArray.push(row);
  }
}

function _spriteAnimate() {
  sprite.material.map.offset.copy (uvOffsetArray[baseS][baseT]);  
  baseT = (baseT + 1) % 8;
  if (baseT === 0) {
    baseS = (baseS + 1) % 4;
  }
  
  if (baseS !== 3 || baseT !== 7) // NOT (baseS = 3 ^ baseT = 7)
  	setTimeout (_spriteAnimate, 100); // proceed to next frame
  else {
  	sprite.material.map.offset.copy (uvOffsetArray[0][0]);  // back to first frame
  }
}

// trigger the animation
function spriteAnimate() {
  if (sprite === undefined) {
  	return;
  }
  
  baseS = baseT = 0;
  setTimeout (_spriteAnimate, 100);
}

const pickCompute = (ndcX, ndcY) => {
	// use 2D algorithm
	const d2To = (v1, v2) => Math.sqrt(v1 ** 2 + (v2 - (-5)) ** 2);
	const dist = d2To(halfW * ndcX, halfH * ndcY);
	if (dist < 1) {
		setTimeout(spriteAnimate, 0);
	}
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
    const ndcX = (event.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(event.clientY / window.innerHeight) * 2 + 1;
    pickCompute(ndcX, ndcY);
	}
}

const init = () => {
	// init scene and camera
	scene = new THREE.Scene();
	camera = new THREE.Camera();
  sceneHUD = new THREE.Scene();
  loader = new THREE.TextureLoader();

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
	marker = addMarker();
	scene.add(marker);

  loader.load(
    'target.png',
    texture => {
      target = new THREE.Mesh(new THREE.CircleGeometry(0.5, 36), new THREE.MeshBasicMaterial({ map: texture }));
      target.rotateX(-Math.PI / 2);
      marker.add(target);
    }
  );
  loader.load(
    'TEa3TVe.png',
    texture => {
      button = new THREE.Mesh(new THREE.CircleGeometry(1, 36), new THREE.MeshBasicMaterial({ map: texture }));
      button.position.set(0, -5, 0);
      sceneHUD.add(button);
    }
  );

  initSprite(marker);
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

const animate = () => {
	requestAnimationFrame(animate);

	if(arToolkitSource.ready === false)	return
	arToolkitContext.update(arToolkitSource.domElement);

  button.material.visible = marker.visible;
  renderer.clear();
	renderer.render(scene, camera);
  renderer.render(sceneHUD, cameraHUD);

  const localCamera = marker.worldToLocal (new THREE.Vector3(0,0,0))
	
	// to rotate (0,0,1) to localCamera [markerCoord]
	const point = new THREE.Vector3(0,0,1);
	const angle = point.angleTo (localCamera);
	const axis = new THREE.Vector3();
	axis.crossVectors(point, localCamera).normalize(); // normalization is IMPORTANT!
	sprite.quaternion.setFromAxisAngle (axis, angle);
}

init();
animate();
