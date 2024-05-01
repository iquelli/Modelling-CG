import * as THREE from 'three';

//////////////////////
/* GLOBAL CONSTANTS */
//////////////////////

const BACKGROUND = new THREE.Color(0xcbfeff);

const MATERIAL = Object.freeze({
  base: new THREE.MeshBasicMaterial({ color: '#2f2e32' }),
  tower: new THREE.MeshBasicMaterial({ color: '#f0c000' }),
  cab: new THREE.MeshBasicMaterial({ color: '#f0d400' }),
  apex: new THREE.MeshBasicMaterial({ color: '#f0c000' }),
  jib: new THREE.MeshBasicMaterial({ color: '#f0c000' }),
  counterjib: new THREE.MeshBasicMaterial({ color: '#f0c000' }),
  counterweight: new THREE.MeshBasicMaterial({ color: '#ff2e00' }),
  rearPendant: new THREE.MeshBasicMaterial({ color: '#2f2e32' }),
  frontPendant: new THREE.MeshBasicMaterial({ color: '#2f2e32' }),
  trolley: new THREE.MeshBasicMaterial({ color: '#767674' }),
  cable: new THREE.MeshBasicMaterial({ color: '#2f2e32' }),

  clawWrist: new THREE.MeshBasicMaterial({ color: '#252527' }),
  clawFingerBody: new THREE.MeshBasicMaterial({ color: '#252527' }),
  clawFingerTip: new THREE.MeshBasicMaterial({ color: '#252527' }),
});

// box and tetrhahedron: w = width (X axis), h = height (Y axis), d = depth (Z axis)
// cylinder and sphere: r = radius, rx = rotation on X axis, etc.

const GEOMETRY = Object.freeze({
  base: { w: 6, h: 2, d: 6 },
  tower: { w: 2, h: 17, d: 2   },
  cab: { w: 4, h: 3, d: 4 },
  apex: { w: 4, h: 5, d: 4 },
  jib: { w: 19, h: 2, d: 2 },
  counterjib: { w: 11, h: 2, d: 2 },
  counterweight: { w: 4, h: 2, d: 2 },
  rearPendant: { r: 0.1, h: 10, rz: -Math.PI / 2.4 },
  frontPendant: { r: 0.1, h: 18.5, rz: Math.PI / 2.2 },
  trolley: { w: 3, h: 2, d: 2 },
  cable: { r: 0.5, h: 9 },

  clawWrist: { r: 0.5 },
  clawFingerBody: { w: 2, h: 0.2, d: 0.2 },
  //clawFingerTip: { w: 0.2, h: 1, d:0.2, rx: -Math.PI / 2 }, TODO: CREATE PYRAMID
});

/*
// absolute coordinates
const CRANE_AABB_POINTS = {
  min: new THREE.Vector3(
    -GEOMETRY.jib.w - GEOMETRY.cab.w / 2,
    -GEOMETRY.base.h / 2,
    -GEOMETRY.jib.w - GEOMETRY.cab.w / 2
  ),
  max: new THREE.Vector3(
    GEOMETRY.jib.w - GEOMETRY.cab.w / 2,
    GEOMETRY.base.h / 2 + GEOMETRY.tower.h + GEOMETRY.cab.h + GEOMETRY.apex.h ,
    GEOMETRY.jib.w - GEOMETRY.cab.w / 2
  ),
};
*/

const CAMERA_GEOMETRY = Object.freeze({
  sceneViewAABB: [new THREE.Vector3(-20, -5, -20), new THREE.Vector3(20, 35, 20)],
  // clawAABB: [new THREE.Vector3(-5, -5, -5), new THREE.Vector3(5, 5, 5)],
  orthogonalDistance: 30,
  orthogonalNear: 1,
  orthogonalFar: 1000,
  perspectiveDistance: 30,
  perspectiveFov: 70,
  perspectiveNear: 1,
  perspectiveFar: 1000,
});

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var activeCamera, renderer, scene;

const cameras = {
  // front view
  front: createOrthogonalCamera({
    bottomAxisVector: new THREE.Vector3(-1, 0, 0), // X axis
    sideAxisVector: new THREE.Vector3(0, 1, 0), // Y axis
    z: CAMERA_GEOMETRY.orthogonalDistance,
  }),
  // side view
  side: createOrthogonalCamera({
    bottomAxisVector: new THREE.Vector3(0, 0, -1), // Z axis
    sideAxisVector: new THREE.Vector3(0, 1, 0), // Y axis
    x: CAMERA_GEOMETRY.orthogonalDistance,
  }),
  // top view
  top: createOrthogonalCamera({
    bottomAxisVector: new THREE.Vector3(1, 0, 0), // X axis
    sideAxisVector: new THREE.Vector3(0, 0, -1), // Z axis
    mirrorView: true,
    y: CAMERA_GEOMETRY.orthogonalDistance,
  }),
  // orthogonal projection: isometric view
  orthogonal: createOrthogonalCamera({
    bottomAxisVector: new THREE.Vector3(1, 0, 1).normalize(),
    sideAxisVector: new THREE.Vector3(0, 1, 0), // Y axis
    x: CAMERA_GEOMETRY.perspectiveDistance,
    y: CAMERA_GEOMETRY.perspectiveDistance,
    z: CAMERA_GEOMETRY.perspectiveDistance,
  }),
  // perspective projection: isometric view
  perspective: createPerspectiveCamera({
    x: CAMERA_GEOMETRY.perspectiveDistance,
    y: CAMERA_GEOMETRY.perspectiveDistance,
    z: CAMERA_GEOMETRY.perspectiveDistance,
  }),

  mobile: createPerspectiveCamera({
    x: CAMERA_GEOMETRY.perspectiveDistance,
    y: CAMERA_GEOMETRY.perspectiveDistance,
    z: CAMERA_GEOMETRY.perspectiveDistance,
  }),
};

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene() {
  'use strict';
  scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper(20));
  scene.background = BACKGROUND;

  //createFloor();
  createCrane();
  //createContainer()
  //createCargo();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras() {
  // set the initial camera
  activeCamera = cameras.front;

  Object.values(cameras).forEach((cameraDescriptor) => {
    refreshCameraParameters(cameraDescriptor);
    cameraDescriptor.camera.lookAt(scene.position);
  });
}

function getVisibleAreaBoundingBox() {
  return {
    min: CAMERA_GEOMETRY.sceneViewAABB[0],
    max: CAMERA_GEOMETRY.sceneViewAABB[1],
  };
}

/**
 * Create an orthogonal camera with the given parameters.
 *
 * @param {Object} parameters - The camera parameters.
 * @param {THREE.Vector3} parameters.bottomAxisVector - A normalized vector along the bottom axis.
 * Its direction depends from where the camera is facing.
 * @param {THREE.Vector3} parameters.sideAxisVector - A normalized vector along the side axis.
 * Its direction depends from where the camera is facing.
 * @param {int} parameters.x - The X position of the camera.
 * @param {int} parameters.y - The Y position of the camera.
 * @param {int} parameters.z - The Z position of the camera.
 * @param {boolean} parameters.mirrorView - Whether to mirror the camera vertically and horizontally.
 * @returns {THREE.OrthographicCamera} The created camera.
 */
function createOrthogonalCamera({
  bottomAxisVector,
  sideAxisVector,
  x = 0,
  y = 0,
  z = 0,
  mirrorView = false,
}) {
  const getCameraParameters = () => {
    const { min, max } = getVisibleAreaBoundingBox();

    const maxLeft = bottomAxisVector.dot(max);
    const minRight = bottomAxisVector.dot(min);
    const minTop = sideAxisVector.dot(max);
    const maxBottom = sideAxisVector.dot(min);

    const minWidth = Math.abs(minRight - maxLeft);
    const minHeight = Math.abs(minTop - maxBottom);
    const offsetX = (minRight + maxLeft) / 2;
    const offsetY = (minTop + maxBottom) / 2;

    const aspectRatio = window.innerWidth / window.innerHeight;
    let height = minHeight;
    let width = height * aspectRatio;

    // fit to aspect ratio
    if (width < minWidth) {
      width = minWidth;
      height = width / aspectRatio;
    }

    // correctly orient top-down camera
    if (mirrorView) {
      height = -height;
      width = -width;
    }

    const top = height / 2 + offsetY;
    const bottom = -height / 2 + offsetY;
    const left = -width / 2 + offsetX;
    const right = width / 2 + offsetX;

    return { top, bottom, left, right };
  };

  const { top, bottom, left, right } = getCameraParameters();

  const camera = new THREE.OrthographicCamera(
    left,
    right,
    top,
    bottom,
    CAMERA_GEOMETRY.orthogonalNear,
    CAMERA_GEOMETRY.orthogonalFar
  );
  camera.position.set(x, y, z);

  return { getCameraParameters, camera };
}

function createPerspectiveCamera({ x = 0, y = 0, z = 0 }) {
  const getCameraParameters = () => {
    return { aspect: window.innerWidth / window.innerHeight };
  };

  const { aspect } = getCameraParameters();

  const camera = new THREE.PerspectiveCamera(
    CAMERA_GEOMETRY.perspectiveFov,
    aspect,
    CAMERA_GEOMETRY.perspectiveNear,
    CAMERA_GEOMETRY.perspectiveFar
  );
  camera.position.set(x, y, z);

  return { getCameraParameters, camera };
}

/**
 * Given a camera descriptor, calls the `getCameraParameters` function
 * to get the attributes to override on the THREE.Camera object.
 * This function is given by the camera descriptor, from the `createOrthogonalCamera`
 * or the `createPerspectiveCamera` functions.
 *
 * Finally,

 updates the projection matrix of the camera.
 */
function refreshCameraParameters({ getCameraParameters, camera }) {
  const parameters = getCameraParameters();

  Object.assign(camera, parameters);
  camera.updateProjectionMatrix();
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createCrane() {
  const base = createGroup({ parent: scene });
  createBoxMesh({ name: 'base', parent: scene });
  createBoxMesh({ name: 'tower', y: GEOMETRY.base.h / 2 + GEOMETRY.tower.h / 2, parent: scene });

  createTop(base);
}

function createTop(base) {
  const topGroup = createGroup({ y: GEOMETRY.base.h / 2 + GEOMETRY.tower.h, parent: base });

  // Center
  createBoxMesh({ name: 'cab', y: GEOMETRY.cab.h / 2, parent: topGroup });
  createPyramidMesh({ name: 'apex', y: GEOMETRY.cab.h + GEOMETRY.apex.h / 2, parent: topGroup });

  // Right side
  createBoxMesh({
    name: 'counterjib',
    x: -(GEOMETRY.cab.w + GEOMETRY.counterjib.w) / 2,
    y: GEOMETRY.cab.h + GEOMETRY.counterjib.h / 2,
    parent: topGroup,
  });
  createBoxMesh({
    name: 'counterweight',
    x: -GEOMETRY.counterjib.w + 1,
    y: GEOMETRY.counterweight.h,
    parent: topGroup,
  });
  createCylinderMesh({
    name: 'rearPendant',
    x: -GEOMETRY.rearPendant.h / 2,
    y: GEOMETRY.cab.h / 2 + GEOMETRY.apex.h,
    parent: topGroup,
  });

  // Left side
  createBoxMesh({
    name: 'jib',
    x: (GEOMETRY.cab.w + GEOMETRY.jib.w) / 2,
    y: GEOMETRY.cab.h + GEOMETRY.jib.h / 2,
    parent: topGroup,
  });
  createCylinderMesh({
    name: 'frontPendant',
    x: GEOMETRY.frontPendant.h / 2,
    y: GEOMETRY.cab.h / 2 + GEOMETRY.apex.h,
    parent: topGroup,
  });

  createTrolley(topGroup);
}

function createTrolley(topGroup) {
  // numero q faz - aqui no x: é oq temos de alterar
  const trolleyGroup = createGroup({
    x: GEOMETRY.jib.w - 1,
    y: GEOMETRY.trolley.h,
    parent: topGroup,
  });
  createBoxMesh({ name: 'trolley', parent: trolleyGroup });
  createCylinderMesh({ name: 'cable', y: -GEOMETRY.cable.h / 2, parent: trolleyGroup });
}

function createClaw() {}

2;
//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {
  'use strict';
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {
  'use strict';
}

////////////
/* UPDATE */
////////////
function update() {
  'use strict';
}

/////////////
/* DISPLAY */
/////////////
function render() {
  'use strict';
  renderer.render(scene, activeCamera.camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  'use strict';
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createScene();
  createCameras();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  render();
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  'use strict';

  render();
  requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
  'use strict';
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (window.innerHeight > 0 && window.innerWidth > 0) {
    refreshCameraParameters(activeCamera);
  }
}

function changeActiveCameraHandleFactory(cameraDescriptor) {
  return (_event, isKeyUp) => {
    if (isKeyUp) {
      return;
    }

    refreshCameraParameters(cameraDescriptor);
    activeCamera = cameraDescriptor;
  };
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////

const keyHandlers = {
  Digit1: changeActiveCameraHandleFactory(cameras.front),
  Digit2: changeActiveCameraHandleFactory(cameras.side),
  Digit3: changeActiveCameraHandleFactory(cameras.top),
  Digit4: changeActiveCameraHandleFactory(cameras.orthogonal),
  Digit5: changeActiveCameraHandleFactory(cameras.perspective),
  Digit5: changeActiveCameraHandleFactory(cameras.mobile),
};

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  let { code } = event;

  // Treat numpad digits like the number row
  if (/^Numpad\d$/.test(code)) {
    code = code.replace('Numpad', 'Digit');
  }

  keyHandlers[code]?.(event, false);
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
  'use strict';
  let { code } = event;

  // Treat numpad digits like the number row
  if (/^Numpad\d$/.test(code)) {
    code = code.replace('Numpad', 'Digit');
  }

  keyHandlers[code]?.(event, true);
}

///////////////
/* UTILITIES */
///////////////
/**
 * Create a THREE.Group on the given position and with the given scale.
 *
 * Automatically adds the created Group to the given parent.
 */
function createGroup({ x = 0, y = 0, z = 0, scale = [1, 1, 1], parent }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.set(...scale);

  if (parent) {
    parent.add(group);
  } else {
    scene.add(group);
  }

  return group;
}

/*
// Create a geometry for the floor (a plane)
function createFloor(){
  const floorGeometry = new THREE.PlaneGeometry(200, 200); 
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xabababab, side: THREE.DoubleSide }); // Change color as needed
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2; // Rotate 90 degrees around the X-axis to make it horizontal
  floorMesh.position.set(0, 0, 0); 
  scene.add(floorMesh);
}
*/

/**
 * Create a THREE.Mesh with BoxGeometry, on the given position and with the scaling
 * from the given profile (`name`).
 * Additionally, an anchor point can be set using an array of length 3, with values
 * of -1, 0 or 1, that will be used as the origin point when scaling.
 *
 * Automatically adds the created Mesh to the given parent.
 */
function createBoxMesh({ name, x = 0, y = 0, z = 0, anchor = [0, 0, 0], parent }) {
  const { w, h, d } = GEOMETRY[name];
  const material = MATERIAL[name];
  const geometry = new THREE.BoxGeometry(w, h, d);
  const box = new THREE.Mesh(geometry, material);
  box.position.set(x + (anchor[0] * w) / 2, y + (anchor[1] * h) / 2, z + (anchor[2] * d) / 2);

  parent.add(box);
  return box;
}

/**
 * Create a Pyramid THREE.Mesh with CylinderGeometry, on the given position and with the scaling
 * and rotation from the given profile (`name`).
 *
 * Automatically adds the created Mesh to the given parent.
 */
function createPyramidMesh({ name, x = 0, y = 0, z = 0, parent }) {
  const { w, h, d } = GEOMETRY[name];
  const material = MATERIAL[name];
  var geometry = new THREE.CylinderGeometry(0, w / Math.sqrt(2), h, 4);

  const pyramid = new THREE.Mesh(geometry, material);
  pyramid.position.set(x, y, z);
  pyramid.rotation.y = Math.PI / 4;

  parent.add(pyramid);
  return pyramid;
}

/**
 * Create a THREE.Mesh with CylinderGeometry, on the given position and with the scaling
 * and rotation from the given profile (`name`).
 *
 * Automatically adds the created Mesh to the given parent.
 */
function createCylinderMesh({ name, x = 0, y = 0, z = 0, parent }) {
  const { r, h, rx = 0, ry = 0, rz = 0 } = GEOMETRY[name];
  const material = MATERIAL[name];

  // allows for smooth edges on small cylinders, while also preventing too many segments on smaller ones
  const radialSegments = THREE.MathUtils.clamp(Math.round(100 * r), 5, 35);

  const geometry = new THREE.CylinderGeometry(r, r, h, radialSegments);
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.position.set(x, y, z);
  cylinder.rotation.set(rx, ry, rz);

  parent.add(cylinder);
  return cylinder;
}

/**
 * Wrapper to `createGroup` that creates a group with a
 * symmetry on the X axis.
 */
function buildSymmetricX(builder, parent) {
  return builder(createGroup({ scale: [-1, 1, 1], parent }));
}

init();
animate();
