'use strict';

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/*
  Grupo 7
  Esforço por elemento do grupo: 15 horas
*/

//////////////////////
/* GLOBAL CONSTANTS */
//////////////////////

const BACKGROUND = new THREE.Color(0xcbfeff);

const MATERIAL = Object.freeze({
  // Main cylinder
  mainCylinder: new THREE.MeshBasicMaterial({ color: '#222222' }),

  // Outer ring, central ring, inner ring
  outerRing: new THREE.MeshBasicMaterial({ color: '#990000' }),
  centralRing: new THREE.MeshBasicMaterial({ color: '#fffcdf' }),
  innerRing: new THREE.MeshBasicMaterial({ color: '#990000' }),

  // Mobius strip
  mobiusStrip: new THREE.MeshBasicMaterial({ color: '#a66666' }),

  // Figures 1-8
  figure1: new THREE.MeshBasicMaterial({ color: '#ffbf42' }),
  figure2: new THREE.MeshBasicMaterial({ color: '#ff6f6b' }),
  figure3: new THREE.MeshBasicMaterial({ color: '#FFF06E' }),
  figure4: new THREE.MeshBasicMaterial({ color: '#F5F8DE' }),
  figure5: new THREE.MeshBasicMaterial({ color: '#32ff7e' }),
  figure6: new THREE.MeshBasicMaterial({ color: '#661F99' }),
  figure7: new THREE.MeshBasicMaterial({ color: '#8338EC' }),
  figure8: new THREE.MeshBasicMaterial({ color: '#3A86FF' }),
});

// box and tetrahedron: w = width (X axis), h = height (Y axis), d = depth (Z axis)
// cylinder and sphere: r = radius, rx = rotation on X axis, etc.
const GEOMETRY = {
  mainCylinder: { r: 1, h: 21 },
  outerRing: { ir: 8, or: 12, h: 4, rx: Math.PI / 2 },
  centralRing: { ir: 4, or: 8, h: 4, rx: Math.PI / 2 },
  innerRing: { ir: 1, or: 4, h: 4, rx: Math.PI / 2 },

  mobiusStrip: { w: 2, h: 17, d: 2 },

  bigFigure: { w: 2, h: 3, d: 2 },
  mediumFigure: { r: 1.5 },
  smallFigure: { r: 2 },
};

// degrees of freedom for each profile  TODO: THERE SHOULD BE NEITHER MIN NOR MAX FOR ROTATIONS
const DEGREES_OF_FREEDOM = Object.freeze({
  mainCylinder: {
    applier: rotateDynamicPart,
    min: -Math.PI,
    max: Math.PI,
    axis: 'y',
    clamp: false,
  },
  outerRing: {
    applier: translateDynamicPart,
    //min: GEOMETRY.cab.w / 2 + GEOMETRY.trolley.w / 2,
    //max: GEOMETRY.jib.w - 1,
    axis: 'y',
  },
  centralRing: {
    applier: translateDynamicPart,
    //min: GEOMETRY.cab.w / 2 + GEOMETRY.trolley.w / 2,
    //max: GEOMETRY.jib.w - 1,
    axis: 'y',
  },
  innerRing: {
    applier: translateDynamicPart,
    //min: GEOMETRY.cab.w / 2 + GEOMETRY.trolley.w / 2,
    //max: GEOMETRY.jib.w - 1,
    axis: 'y',
  },
  figure: {
    applier: rotateDynamicParts,
    //min: -Math.PI,
    //max: Math.PI,
    axis: 'y',
    clamp: true,
  },
});

const CAROUSEL_DYNAMIC_PARTS = Object.freeze([
  { part: 'mainCylinder', profile: 'mainCylinder' },
  { part: 'outerRing', profile: 'outerRing' },
  { part: 'centralRing', profile: 'centralRing' },
  { part: 'innerRing', profile: 'innerRing' },
  { part: 'innerFigures', profile: 'figure' },
  { part: 'centralFigures', profile: 'figure' },
  { part: 'outerFigures', profile: 'figure' },
]);

const MOVEMENT_FLAGS = Object.freeze({
  xPositive: new THREE.Vector3(1, 0, 0),
  xNegative: new THREE.Vector3(-1, 0, 0),
  yPositive: new THREE.Vector3(0, 1, 0),
  yNegative: new THREE.Vector3(0, -1, 0),
  zPositive: new THREE.Vector3(0, 0, 1),
  zNegative: new THREE.Vector3(0, 0, -1),
});

const CLOCK = new THREE.Clock();

const ORBITAL_CAMERA = createPerspectiveCamera({
  fov: 80,
  near: 1,
  far: 1000,
  x: -30,
  y: 40,
  z: -50,
});
const FIXED_CAMERA = createPerspectiveCamera({
  fov: 80,
  near: 1,
  far: 1000,
  x: -32,
  y: 40,
  z: -50,
});

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let renderer, scene;
let activeCamera = FIXED_CAMERA;

const dynamicElements = {};

// flags for event handlers
let updateProjectionMatrix = false;
let toggleActiveCamera = false;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene() {
  scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper(20));
  scene.background = BACKGROUND;

  //createSkydome();
  createCarousel();
  //createMobiusStrip();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras() {
  const controls = new OrbitControls(ORBITAL_CAMERA, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.keys = {
    LEFT: 72, // h
    UP: 75, // k
    RIGHT: 76, // l
    BOTTOM: 74, // j
  };
  controls.update();
}

function createPerspectiveCamera({
  fov,
  near,
  far,
  x = 0,
  y = 0,
  z = 0,
  atX = 0,
  atY = 0,
  atZ = 0,
}) {
  const aspect = window.innerWidth / window.innerHeight;

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(x, y, z);
  camera.lookAt(atX, atY, atZ);
  return camera;
}

function createOrthographicCamera({
  left,
  right,
  top,
  bottom,
  near,
  far,
  x = 0,
  y = 0,
  z = 0,
  atX = 0,
  atY = 0,
  atZ = 0,
}) {
  const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
  camera.position.set(x, y, z);
  camera.lookAt(atX, atY, atZ);
  return camera;
}

function refreshCameraParameters(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createCarousel() {
  const cylinderGroup = createGroup({ parent: scene });

  createMainCylinder(cylinderGroup);
  createInnerRing(cylinderGroup);
  createCentralRing(cylinderGroup);
  createOuterRing(cylinderGroup);
  createMobiusStrip();
}

function createMainCylinder(cylinderGroup) {
  createCylinderMesh({
    name: 'mainCylinder',
    y: GEOMETRY.mainCylinder.h / 2,
    parent: cylinderGroup,
  });
}

function createInnerRing(cylinderGroup) {
  createRingMesh({
    name: 'innerRing',
    y: GEOMETRY.innerRing.h,
    parent: cylinderGroup,
  });
}

function createCentralRing(cylinderGroup) {
  createRingMesh({
    name: 'centralRing',
    y: GEOMETRY.centralRing.h,
    parent: cylinderGroup,
  });
}

function createOuterRing(cylinderGroup) {
  createRingMesh({
    name: 'outerRing',
    y: GEOMETRY.outerRing.h,
    parent: cylinderGroup,
  });
}

function createMobiusStrip() {
  const strip = new THREE.Object3D();
  strip.position.set(0, 22, 0);
  scene.add(strip);
  const count = 256;
  const box = new THREE.BoxGeometry();
  const radius = 12;
  // Set up variables
  for (let i = 0; i < count; i++) {
    const a = (Math.PI / count) * 90 * i;
    const o = new THREE.Object3D();
    o.position.set(Math.cos(a), Math.sin(a * 2) / 180, Math.sin(a));
    o.position.multiplyScalar(radius);
    o.lookAt(scene.position);
    strip.add(o);
    const mat = MATERIAL['mobiusStrip'];
    const mesh = new THREE.Mesh(box, mat);
    mesh.scale.set(1, 3, 1);
    mesh.rotation.x = a / 2;
    o.add(mesh);
  }
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////
/* UPDATE */
////////////

function update(timeDelta) {
  // COMPUTE ANIMATION
  /* CAROUSEL_DYNAMIC_PARTS.forEach((dynamicPart) => {
      if (dynamicElements[dynamicPart.part].userData?.movementFlags) {
        DEGREES_OF_FREEDOM[dynamicPart.profile].applier(timeDelta, dynamicPart);
      }
    });*/

	if (updateProjectionMatrix) {
		const isXrPresenting = renderer.xr.isPresenting;
    renderer.xr.isPresenting = false;
    updateProjectionMatrix = false;
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerHeight > 0 && window.innerWidth > 0) {
      refreshCameraParameters(isXrPresenting ? renderer.xr.getCamera() : activeCamera);
    }
    renderer.xr.isPresenting = isXrPresenting;
	}
	if (toggleActiveCamera) {
		toggleActiveCamera = false;
    activeCamera = activeCamera == ORBITAL_CAMERA ? FIXED_CAMERA : ORBITAL_CAMERA;
    refreshCameraParameters(activeCamera);
	}
}

function rotateDynamicParts(timeDelta, { part, profile }) {
  const group = dynamicElements[part];
  const props = DEGREES_OF_FREEDOM[profile];
  const delta = deltaSupplier({ profile, group, timeDelta });
  group.forEach((part) => {
    rotateGroup(part, props, delta, props.clamp);
  });
}

function rotateDynamicPart(timeDelta, { part, profile }) {
  const group = dynamicElements[part];
  const props = DEGREES_OF_FREEDOM[profile];
  const delta = deltaSupplier({ profile, group, timeDelta });
  rotateGroup(group, props, delta, props.clamp);
}

function rotateGroup(group, props, delta, clamp) {
  group.rotation.fromArray(
    ['x', 'y', 'z'].map((axis) => {
      const newValue = group.rotation[axis] + delta[axis];
      if (props?.axis === axis && clamp) {
        return THREE.MathUtils.clamp(newValue, props.min, props.max);
      }
      return newValue;
    })
  );
}

function translateDynamicPart(timeDelta, { part, profile }) {
  const group = dynamicElements[part];
  const props = DEGREES_OF_FREEDOM[profile];
  const delta = deltaSupplier({ profile, group, timeDelta });

  group.position.fromArray(
    ['x', 'y', 'z'].map((axis) => {
      const newValue = group.position[axis] + delta[axis];
      if (props?.axis === axis) {
        return THREE.MathUtils.clamp(newValue, props.min, props.max);
      }
      return newValue;
    })
  );
}

function deltaSupplier({ profile, group, timeDelta }) {
  return Object.entries(group?.userData?.movementFlags || {})
    .filter(([_flagKey, flagValue]) => flagValue)
    .reduce((vec, [flagKey, _flagValue]) => {
      return vec.add(MOVEMENT_FLAGS_VECTORS[flagKey]);
    }, new THREE.Vector3())
    .normalize()
    .multiplyScalar(DELTAS[profile] * timeDelta);
}

/////////////
/* DISPLAY */
/////////////

function render() {
  renderer.render(scene, activeCamera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));

  createScene();
  createCameras();

  // Event listeners for keypresses
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////

function animate() {
  const timeDelta = CLOCK.getDelta();
  update(timeDelta);
  render();
  renderer.setAnimationLoop(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

function onResize() {
    updateProjectionMatrix = true;
}

//////////////////
/* KEY HANDLERS */
//////////////////

const keyHandlers = {
  // Cameras
  // Digit1: changeActiveCameraHandleFactory(cameras.front),
  // Digit2: changeActiveCameraHandleFactory(cameras.side),
  // Digit3: changeActiveCameraHandleFactory(cameras.top),
  // Digit4: changeActiveCameraHandleFactory(cameras.orthogonal),
  // Digit5: changeActiveCameraHandleFactory(cameras.perspective),
  // Digit6: changeActiveCameraHandleFactory(cameras.mobile),
  // Rotations and translations
  // top
  // KeyQ: transformDynamicPartHandleFactory({ parts: ['top'], flag: 'yPositive' }),
  // KeyA: transformDynamicPartHandleFactory({ parts: ['top'], flag: 'yNegative' }),
  // trolley
  // KeyW: transformDynamicPartHandleFactory({ parts: ['trolley'], flag: 'xPositive' }),
  // KeyS: transformDynamicPartHandleFactory({ parts: ['trolley'], flag: 'xNegative' }),
  // cable and claw
  // KeyE: transformDynamicPartHandleFactory({ parts: ['cable', 'claw'], flag: 'yPositive' }),
  // KeyD: transformDynamicPartHandleFactory({ parts: ['cable', 'claw'], flag: 'yNegative' }),
  // fingers
  // KeyR: transformDynamicPartHandleFactory({ parts: ['fingers'], flag: 'zPositive' }),
  // KeyF: transformDynamicPartHandleFactory({ parts: ['fingers'], flag: 'zNegative' }),

	// EXTRA
	Digit4: keyActionFactory(() => (toggleActiveCamera = true)),
};

/**
 * Build a key handler that only executes once on keydown.
 * Ignores the keyup event, as well as duplicate keydown events.
 */
function keyActionFactory(handler) {
  return (event, isDown) => {
    if (!isDown || event.repeat) {
      return;
    }

    handler(event);
  };
}

function changeActiveCameraHandleFactory(cameraDescriptor) {
  return (event, isKeyUp) => {
    if (isKeyUp || event.repeat) {
      return;
    }

    refreshCameraParameters(cameraDescriptor);
    activeCamera = cameraDescriptor;
  };
}

function transformDynamicPartHandleFactory({ parts, flag }) {
  return (event, isKeyUp) => {
    if (event.repeat) {
      // ignore holding down keys
      return;
    }

    parts.forEach((part) => {
      const userData = dynamicElements[part].userData || (dynamicElements[part].userData = {});
      const movementFlags = userData.movementFlags || (userData.movementFlags = {});

      movementFlags[flag] = !isKeyUp;
    });
  };
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////

function onKeyDown(event) {
  let { code } = event;

  // Treat numpad digits like the number row
  if (/^Numpad\d$/.test(code)) {
    code = code.replace('Numpad', 'Digit');
  }

  keyHandlers[code]?.(event, true);
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function onKeyUp(event) {
  let { code } = event;

  // Treat numpad digits like the number row
  if (/^Numpad\d$/.test(code)) {
    code = code.replace('Numpad', 'Digit');
  }

  keyHandlers[code]?.(event, false);
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

/**
 * Create a THREE.Mesh with BoxGeometry, on the given position and with the scaling
 * from the given profile (`name`).
 *
 * Automatically adds the created Mesh to the given parent.
 */
function createBoxMesh({ name, x = 0, y = 0, z = 0, parent }) {
  const { w, h, d, rx = 0, ry = 0, rz = 0 } = GEOMETRY[name];
  const material = MATERIAL[name];
  const geometry = new THREE.BoxGeometry(w, h, d);

  const box = new THREE.Mesh(geometry, material);
  box.position.set(x, y, z);
  box.rotation.set(rx, ry, rz);

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
  const { l, h, rx = 0, ry = 0, rz = 0 } = GEOMETRY[name];
  const material = MATERIAL[name];
  const geometry = new THREE.CylinderGeometry(0, l / Math.sqrt(2), h, 4);

  const pyramid = new THREE.Mesh(geometry, material);
  pyramid.position.set(x, y, z);
  pyramid.rotation.set(rx, ry, rz);

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

  // allows for smooth edges on small cylinders, while also preventing too
  // many segments on smaller ones
  const radialSegments = THREE.MathUtils.clamp(Math.round(100 * r), 5, 35);
  const geometry = new THREE.CylinderGeometry(r, r, h, radialSegments);

  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.position.set(x, y, z);
  cylinder.rotation.set(rx, ry, rz);

  parent.add(cylinder);
  return cylinder;
}

function createRingMesh({ name, x = 0, y = 0, z = 0, parent }) {
  const { ir, or, h, rx = 0, ry = 0, rz = 0 } = GEOMETRY[name];
  const material = MATERIAL[name];

  // allows for smooth edges on small rings, while also preventing too many segments on smaller ones
  const radialSegments = THREE.MathUtils.clamp(Math.round(100 * or), 5, 35);
  var geometry = new THREE.Shape();
  geometry.absarc(0, 0, ir, 0, Math.PI * 2, false);
  geometry.absarc(0, 0, or, 0, Math.PI * 2, false);

  var extrudeSettings = {
    depth: h,
    steps: 1,
    bevelEnabled: false,
    curveSegments: radialSegments,
  };

  var arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, or, 0, Math.PI * 2, 0, false);

  var holePath = new THREE.Path();
  holePath.absarc(0, 0, ir, 0, Math.PI * 2, true);
  arcShape.holes.push(holePath);

  var geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  const ring = new THREE.Mesh(geometry, material);
  ring.position.set(x, y, z);
  ring.rotation.set(rx, ry, rz);

  parent.add(ring);
  return ring;
}

/**
 * Create a THREE.Mesh with the geomFunc, on the given position and with the scaling
 * from the given profile (`name`).
 *
 * Automatically adds the created Mesh to the given parent.
 */
function createRadialObjectMesh({ name, x = 0, y = 0, z = 0, parent, geomFunc }) {
  const { r } = GEOMETRY[name];
  const material = MATERIAL[name];
  const geometry = new geomFunc(r);

  const radialObject = new THREE.Mesh(geometry, material);
  radialObject.position.set(x, y, z);

  parent.add(radialObject);
  return radialObject;
}

init();
animate();
