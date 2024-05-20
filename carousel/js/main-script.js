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

// degrees of freedom for each profile
const DEGREES_OF_FREEDOM = {
  figures: { applier: translateDynamicPart, min: 0, max: 8, axis: 'y' },
  ring: { applier: resizeDynamicPart, min: 4, max: 12, axis: 'y' },
};
const CAROUSEL_DYNAMIC_PARTS = Object.freeze([
  { part: 'innerFigures', profile: 'figures' },
  { part: 'centralFigures', profile: 'figures' },
  { part: 'outerFigures', profile: 'figures' },
  { part: 'innerRing', profile: 'ring' },
  { part: 'centralRing', profile: 'ring' },
  { part: 'outerRing', profile: 'ring' },
]);

const CLOCK = new THREE.Clock();

const BASE_ANGULAR_VELOCITY = (2 * Math.PI) / 10; // 10 seconds for one rotation
const FIGURE_ANGULAR_VELOCITY = (2 * Math.PI) / 5; // 5 seconds for one rotation
const RING_LINEAR_VELOCITY = 5; // 5 units per second

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

// for translations and rotations
let baseGroup;
const ringElements = {};
const figures = [];

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

function refreshCameraParameters(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createCarousel() {
  baseGroup = createGroup({ parent: scene });

  createMainCylinder(baseGroup);
  createInnerRing(baseGroup);
  createCentralRing(baseGroup);
  createOuterRing(baseGroup);
  createMobiusStrip();
}

function createMainCylinder(baseGroup) {
  createCylinderMesh({
    name: 'mainCylinder',
    y: GEOMETRY.mainCylinder.h / 2,
    parent: baseGroup,
  });
}

function createInnerRing(baseGroup) {
  ringElements.innerRing = createRingMesh({
    name: 'innerRing',
    y: GEOMETRY.innerRing.h,
    parent: baseGroup,
  });
  ringElements.innerFigures = createGroup({ y: GEOMETRY.innerRing.h, parent: baseGroup });
  // TODO: create the inner figures and add them to the group above
}

function createCentralRing(baseGroup) {
  ringElements.centralRing = createRingMesh({
    name: 'centralRing',
    y: GEOMETRY.centralRing.h,
    parent: baseGroup,
  });
  ringElements.centralFigures = createGroup({ y: GEOMETRY.centralRing.h, parent: baseGroup });
  // TODO: create the central figures and add them to the group above
}

function createOuterRing(baseGroup) {
  ringElements.outerRing = createRingMesh({
    name: 'outerRing',
    y: GEOMETRY.outerRing.h,
    parent: baseGroup,
  });
  ringElements.outerFigures = createGroup({ y: GEOMETRY.outerRing.h, parent: baseGroup });
  // TODO: create the outer figures and add them to the group above
}

function createMobiusStrip() {
  const geometry = new THREE.BufferGeometry();

  // Define vertices manually measured for a Möbius strip with radius 12 and width 3
  const vertices = new Float32Array([
    12, 1.5, 0, 9, 1.5, 3, 10.5, 1.6, 5.4, 8.6, 1.4, 4.2, 8, 1.7, 9, 6.25, 1.3, 7, 4, 2.1, 11.25,
    3.25, 0.9, 9.5, 0, 2.5, 12, 0, 0.5, 10.5, -4, 2.8, 11.25, -3.75, 0.2, 10.4, -8, 2.9, 9, -7.75,
    0.1, 8.75, -10.5, 2.95, 5.4, -10.5, 0.05, 5.4, -12, 3, 0, -12, 0, 0, -10.5, 2.95, -5.4, -10.5,
    0.05, -5.4, -8, 2.9, -9, -7.75, 0.1, -8.75, -4, 2.8, -11.25, -3.75, 0.2, -10.4, 0, 2.5, -12, 0,
    0.5, -10.5, 4, 2.1, -11.25, 3.25, 0.9, -9.5, 8, 1.7, -9, 6.25, 1.3, -7, 10.5, 1.5, -5.4, 8.6,
    1.5, -4.2,
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  // Define indices to form triangles
  let indices = [
    0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4, 4, 5, 7, 4, 7, 6, 6, 7, 9, 6, 9, 8, 8, 9, 11, 8, 11, 10, 10,
    11, 13, 10, 13, 12, 12, 13, 15, 12, 15, 14, 14, 15, 17, 14, 17, 16, 16, 17, 19, 16, 19, 18, 18,
    19, 21, 18, 21, 20, 20, 21, 23, 20, 23, 22, 22, 23, 25, 22, 25, 24, 24, 25, 27, 24, 27, 26, 26,
    27, 29, 26, 29, 28, 28, 29, 31, 28, 31, 30, 30, 31, 1, 30, 1, 0,
  ];
  let length = indices.length;

  for (let i = 0; i < length; i += 3) {
    indices.push(indices[i + 2], indices[i + 1], indices[i]);
  }

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  const mobiusStrip = new THREE.Mesh(geometry, material);
  mobiusStrip.position.set(0, 21, 0);

  scene.add(mobiusStrip);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////
/* UPDATE */
////////////

function update(timeDelta) {
  baseGroup.rotation.y = (baseGroup.rotation.y + timeDelta * BASE_ANGULAR_VELOCITY) % (2 * Math.PI);
  figures.forEach((figure) => {
    figure.rotation.y = (figure.rotation.y + timeDelta * FIGURE_ANGULAR_VELOCITY) % (2 * Math.PI);
  });

  // COMPUTE ANIMATION FOR RINGS
  CAROUSEL_DYNAMIC_PARTS.forEach((dynamicPart) => {
    if (ringElements[dynamicPart.part]?.movementFlag) {
      DEGREES_OF_FREEDOM[dynamicPart.profile].applier(timeDelta, dynamicPart);
    }
  });

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

function translateDynamicPart(timeDelta, { part, profile }) {
  // TODO
  // const group = dynamicElements[part];
  // const props = DEGREES_OF_FREEDOM[profile];
  // const delta = deltaSupplier({ profile, group, timeDelta });
  // group.position.fromArray(
  //   ['x', 'y', 'z'].map((axis) => {
  //     const newValue = group.position[axis] + delta[axis];
  //     if (props?.axis === axis) {
  //       return THREE.MathUtils.clamp(newValue, props.min, props.max);
  //     }
  //     return newValue;
  //   })
  // );
}

function resizeDynamicPart(timeDelta, { part, profile }) {
  // TODO
  // const group = dynamicElements[part];
  // const props = DEGREES_OF_FREEDOM[profile];
  // const delta = deltaSupplier({ profile, group, timeDelta });
  // GEOMETRY.cable.h = THREE.MathUtils.clamp(GEOMETRY.cable.h - delta['y'], props.min, props.max);
  // group.position.setY(-(GEOMETRY.cable.h + GEOMETRY.trolley.h) / 2);
  // group.scale.set(1, GEOMETRY.cable.h / 9); // 9 is the default length of the cable
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
  // Move the rings up and down with the figures on top
  Digit1: movementHandleFactory(['innerFigures', 'innerRing']),
  Digit2: movementHandleFactory(['centralFigures', 'centralRing']),
  Digit3: movementHandleFactory(['outerFigures', 'outerRing']),

  // EXTRA
  Digit4: keyActionFactory(() => (toggleActiveCamera = true)),
};

/**
 * Build a key handler that only executes once on keydown.
 * Ignores the keyup event, as well as duplicate keydown events.
 */
function keyActionFactory(handler) {
  return (event, isKeyDown) => {
    if (!isKeyDown || event.repeat) {
      return;
    }

    handler(event);
  };
}

function movementHandleFactory(parts) {
  return (event, isKeyDown) => {
    if (event.repeat) {
      // ignore holding down keys
      return;
    }

    parts.forEach((part) => {
      ringElements[part].movementFlag = isKeyDown;
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

/**
 * Create a THREE.Mesh with ExtrudeGeometry, on the given position and with the scaling
 * and rotation from the given profile (`name`).
 *
 * Automatically adds the created Mesh to the given parent.
 */
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
 * Create a THREE.Mesh with THREE.ParametricGeometry, on the given position and with the scaling
 * from the given profile (`name`).
 *
 * Automatically adds the created Mesh to the given parent.
 */
function createObjectMesh({ name, x = 0, y = 0, z = 0, parent, geomFunc }) {
  // TODO
  // const { r } = GEOMETRY[name];
  // const material = MATERIAL[name];
  // const geometry = new geomFunc(r);
  // const radialObject = new THREE.Mesh(geometry, material);
  // radialObject.position.set(x, y, z);
  // parent.add(radialObject);
  // return radialObject;
}

init();
animate();
