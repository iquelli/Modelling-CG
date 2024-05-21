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
  fig1: new THREE.MeshBasicMaterial({ color: '#ffbf42' }),
  fig2: new THREE.MeshBasicMaterial({ color: '#ff6f6b' }),
  fig3: new THREE.MeshBasicMaterial({ color: '#FFF06E' }),
  fig4: new THREE.MeshBasicMaterial({ color: '#F5F8DE' }),
  fig5: new THREE.MeshBasicMaterial({ color: '#32ff7e' }),
  fig6: new THREE.MeshBasicMaterial({ color: '#661F99' }),
  fig7: new THREE.MeshBasicMaterial({ color: '#8338EC' }),
  fig8: new THREE.MeshBasicMaterial({ color: '#3A86FF' }),
});

// box and tetrahedron: w = width (X axis), h = height (Y axis), d = depth (Z axis)
// cylinder and sphere: r = radius, rx = rotation on X axis, etc.
const GEOMETRY = {
  mainCylinder: { r: 1, h: 21 },

  innerRing: { ir: 1, or: 4, h: 4, rx: Math.PI / 2 },
  centralRing: { ir: 4, or: 8, h: 4, rx: Math.PI / 2 },
  outerRing: { ir: 8, or: 12, h: 4, rx: Math.PI / 2 },

  mobiusStrip: { w: 2, h: 17, d: 2 },

  bigFigure: { w: 2, h: 3, d: 2 },
  mediumFigure: { r: 1.5 },
  smallFigure: { r: 2 },
};

// degrees of freedom for each profile
const DEGREES_OF_FREEDOM = {
  figures: { applier: moveDynamicPart, min: 4, max: 12, axis: 'y' },
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
  fov: 60,
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
  createObjects(
    ringElements.innerFigures,
    GEOMETRY.innerRing.ir + (GEOMETRY.innerRing.or - GEOMETRY.innerRing.ir) / 2
  );
}

function createCentralRing(baseGroup) {
  ringElements.centralRing = createRingMesh({
    name: 'centralRing',
    y: GEOMETRY.centralRing.h,
    parent: baseGroup,
  });
  ringElements.centralFigures = createGroup({ y: GEOMETRY.centralRing.h, parent: baseGroup });
  createObjects(
    ringElements.centralFigures,
    GEOMETRY.centralRing.ir + (GEOMETRY.centralRing.or - GEOMETRY.centralRing.ir) / 2
  );
}

function createOuterRing(baseGroup) {
  ringElements.outerRing = createRingMesh({
    name: 'outerRing',
    y: GEOMETRY.outerRing.h,
    parent: baseGroup,
  });
  ringElements.outerFigures = createGroup({ y: GEOMETRY.outerRing.h, parent: baseGroup });
  createObjects(
    ringElements.outerFigures,
    GEOMETRY.outerRing.ir + (GEOMETRY.outerRing.or - GEOMETRY.outerRing.ir) / 2
  );
}

function createObjects(ringGroup, radius) {
  const figs = ['fig1', 'fig2', 'fig3', 'fig4', 'fig5', 'fig6', 'fig7', 'fig8'];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]; // 8 possible angles
  // TODO: fix these disgusting functions below
  const funcs = [
    (u, v, target) => {
      // hyperboloid
      const a = 1,
        b = 1,
        c = 2;
      u = (u - 0.5) * Math.PI;
      v = (v - 0.5) * 2 * Math.PI;
      const x = a * Math.sinh(u) * Math.cos(v);
      const y = b * Math.sinh(u) * Math.sin(v);
      const z = c * Math.cosh(u);
      target.set(x, y, z);
    },
    (u, v, target) => {
      // klein bottle
      u *= Math.PI;
      v *= 2 * Math.PI;
      u = u * 2;
      let x, y, z;
      if (u < Math.PI) {
        x =
          3 * Math.cos(u) * (1 + Math.sin(u)) +
          2 * (1 - Math.cos(u) / 2) * Math.cos(u) * Math.cos(v);
        y = 8 * Math.sin(u) + 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
      } else {
        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u) / 2) * Math.cos(v + Math.PI);
        y = 8 * Math.sin(u);
      }
      z = 2 * (1 - Math.cos(u) / 2) * Math.sin(v);
      target.set(x, y, z);
    },
    (u, v, target) => {
      // torus
      const R = 2,
        r = 1;
      const x = (R + r * Math.cos(v * 2 * Math.PI)) * Math.cos(u * 2 * Math.PI);
      const y = (R + r * Math.cos(v * 2 * Math.PI)) * Math.sin(u * 2 * Math.PI);
      const z = r * Math.sin(v * 2 * Math.PI);
      target.set(x, y, z);
    },
    (u, v, target) => {
      // plane
      const x = u * 10 - 5;
      const y = v * 10 - 5;
      const z = 0;
      target.set(x, y, z);
    },
    (u, v, target) => {
      // torus knot
      const p = 3,
        q = 2;
      const r = 10 + Math.cos(q * v) * 2;
      const x = r * Math.cos(p * v);
      const y = r * Math.sin(p * v);
      const z = Math.sin(q * v) * 2;
      target.set(x, y, z);
    },
    (u, v, target) => {
      // kuens
      const a = 0.2;
      const x =
        (a + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v)) * Math.cos(u);
      const y =
        (a + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v)) * Math.sin(u);
      const z = Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v);
      target.set(x, y, z);
    },
    (u, v, target) => {
      // dinis
      const a = 1,
        b = 0.2,
        c = 0.3;
      const x = a * Math.cos(u) * Math.sin(v);
      const y = a * Math.sin(u) * Math.sin(v);
      const z = a * (Math.cos(v) + Math.log(Math.tan(v / 2))) + b * u;
      target.set(x, y, z);
    },
    (u, v, target) => {
      // ellipsoid
      const a = 2,
        b = 1.5,
        c = 1;
      const x = a * Math.sin(u * Math.PI) * Math.cos(v * 2 * Math.PI);
      const y = b * Math.sin(u * Math.PI) * Math.sin(v * 2 * Math.PI);
      const z = c * Math.cos(u * Math.PI);
      target.set(x, y, z);
    },
  ];

  figs.forEach((fig) => {
    var i = Math.floor(Math.random() * angles.length);
    figures.push(
      createParametricObjectMesh({
        name: fig,
        x: Math.cos(angles[i]) * radius,
        y: 0,
        z: Math.sin(angles[i]) * radius,
        scale: 0.5,
        parent: ringGroup,
        geomFunc: funcs.shift(),
      })
    );
    angles.splice(i, 1); // Remove used up angle
  });
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

function moveDynamicPart(timeDelta, { part, profile }) {
  const group = ringElements[part];
  const props = DEGREES_OF_FREEDOM[profile];

  const delta = deltaSupplier(timeDelta, props, group);
  group.position.fromArray(
    ['x', 'y', 'z'].map((axis) => {
      let newValue = group.position[axis] + delta[axis];
      if (props?.axis === axis) {
        newValue = THREE.MathUtils.clamp(newValue, props.min, props.max);
      }
      if (newValue === props.min || newValue === props.max) {
        group.dir = -1 * group.dir;
      }
      return newValue;
    })
  );
}

function resizeDynamicPart(timeDelta, { part, profile }) {
  const group = ringElements[part];
  const props = DEGREES_OF_FREEDOM[profile];

  const delta = deltaSupplier(timeDelta, props, group);
  GEOMETRY[part].h = THREE.MathUtils.clamp(
    GEOMETRY[part].h + delta[props?.axis],
    props.min,
    props.max
  );
  if (GEOMETRY[part].h === props.min || GEOMETRY[part].h === props.max) {
    group.dir = -1 * group.dir;
  }
  group.position.setY(GEOMETRY[part].h);
  group.scale.set(1, 1, GEOMETRY[part].h / 4); // 4 is the default height of the ring
}

function deltaSupplier(timeDelta, props, group) {
  const vec = new THREE.Vector3();
  vec[props?.axis] = group.movementFlag ? group.dir || (group.dir = 1) : 0;
  return vec.normalize().multiplyScalar(RING_LINEAR_VELOCITY * timeDelta);
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
  let button = VRButton.createButton(renderer);
  button.style.background = 'rgba(0,0,0,1)'; // make the button more visible
  document.body.appendChild(button);

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

function movementHandleFactory(parts) {
  return (event, isKeyDown) => {
    if (!isKeyDown || event.repeat) {
      return;
    }
    parts.forEach((part) => {
      ringElements[part].movementFlag = !ringElements[part].movementFlag;
    });
  };
}

function keyActionFactory(handler) {
  return (event, isKeyDown) => {
    if (!isKeyDown || event.repeat) {
      return;
    }
    handler(event);
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
function createParametricObjectMesh({ name, x = 0, y = 0, z = 0, scale, parent, geomFunc }) {
  const material = MATERIAL[name];
  const object = new THREE.Mesh(new ParametricGeometry(geomFunc, 25, 25), material);
  object.position.set(x, y, z);
  object.scale.set(scale, scale, scale);
  parent.add(object);
  return object;
}

init();
animate();
