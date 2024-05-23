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

const BACKGROUND = new THREE.Color(0x230000);

const MATERIAL = Object.freeze({
  // Main cylinder
  mainCylinder: {
    basic: new THREE.MeshBasicMaterial({ color: '#fffcdf' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#fffcdf' }),
    phong: new THREE.MeshPhongMaterial({ color: '#fffcdf', shininess: 100 }),
    toon: new THREE.MeshToonMaterial({ color: '#fffcdf' }),
    normal: new THREE.MeshNormalMaterial(),
  },

  // Inner ring, central ring and outer ring
  innerRing: {
    basic: new THREE.MeshBasicMaterial({ color: '#990000' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#990000' }),
    phong: new THREE.MeshPhongMaterial({ color: '#990000', shininess: 70 }),
    toon: new THREE.MeshToonMaterial({ color: '#990000' }),
    normal: new THREE.MeshNormalMaterial(),
  },
  centralRing: {
    basic: new THREE.MeshBasicMaterial({ color: '#fffcdf' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#fffcdf' }),
    phong: new THREE.MeshPhongMaterial({ color: '#fffcdf', shininess: 80 }),
    toon: new THREE.MeshToonMaterial({ color: '#fffcdf' }),
    normal: new THREE.MeshNormalMaterial(),
  },
  outerRing: {
    basic: new THREE.MeshBasicMaterial({ color: '#990000' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#990000' }),
    phong: new THREE.MeshPhongMaterial({ color: '#990000', shininess: 50 }),
    toon: new THREE.MeshToonMaterial({ color: '#990000' }),
    normal: new THREE.MeshNormalMaterial(),
  },

  // Mobius strip
  mobiusStrip: {
    basic: new THREE.MeshBasicMaterial({ color: '#990000' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#990000' }),
    phong: new THREE.MeshPhongMaterial({ color: '#990000', specular: '#ffffff', shininess: 30 }),
    toon: new THREE.MeshToonMaterial({ color: '#990000', opacity: 0.7 }),
    normal: new THREE.MeshNormalMaterial(),
  },

  // Figures 1-8
  fig1: {
    // hyperboloid
    basic: new THREE.MeshBasicMaterial({ color: '#008b8b' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#008b8b' }),
    phong: new THREE.MeshPhongMaterial({ color: '#008b8b', shininess: 80 }),
    toon: new THREE.MeshToonMaterial({ color: '#008b8b' }),
    normal: new THREE.MeshNormalMaterial(),
  },
  fig2: {
    // klein bottle
    basic: new THREE.MeshBasicMaterial({ color: '#f8766d', side: THREE.DoubleSide }),
    lambert: new THREE.MeshLambertMaterial({ color: '#f8766d', side: THREE.DoubleSide }),
    phong: new THREE.MeshPhongMaterial({ color: '#f8766d', shininess: 60, side: THREE.DoubleSide }),
    toon: new THREE.MeshToonMaterial({ color: '#f8766d', side: THREE.DoubleSide }),
    normal: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
  },
  fig3: {
    // torus
    basic: new THREE.MeshBasicMaterial({ color: '#ffcc00' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#ffcc00' }),
    phong: new THREE.MeshPhongMaterial({ color: '#ffcc00', shininess: 70 }),
    toon: new THREE.MeshToonMaterial({ color: '#ffcc00' }),
    normal: new THREE.MeshNormalMaterial(),
  },
  fig4: {
    // plane
    basic: new THREE.MeshBasicMaterial({ color: '#55565b', side: THREE.DoubleSide }),
    lambert: new THREE.MeshLambertMaterial({ color: '#55565b', side: THREE.DoubleSide }),
    phong: new THREE.MeshPhongMaterial({ color: '#55565b', shininess: 50, side: THREE.DoubleSide }),
    toon: new THREE.MeshToonMaterial({ color: '#55565b', side: THREE.DoubleSide }),
    normal: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
  },
  fig5: {
    // torus knot
    basic: new THREE.MeshBasicMaterial({ color: '#00ff7f' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#00ff7f' }),
    phong: new THREE.MeshPhongMaterial({ color: '#00ff7f', shininess: 60 }),
    toon: new THREE.MeshToonMaterial({ color: '#00ff7f' }),
    normal: new THREE.MeshNormalMaterial(),
  },
  fig6: {
    // sphere
    basic: new THREE.MeshBasicMaterial({ color: '#661f99' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#661f99' }),
    phong: new THREE.MeshPhongMaterial({ color: '#661f99', shininess: 70 }),
    toon: new THREE.MeshToonMaterial({ color: '#661f99' }),
    normal: new THREE.MeshNormalMaterial(),
  },
  fig7: {
    // dinis
    basic: new THREE.MeshBasicMaterial({ color: '#40e0d0', side: THREE.DoubleSide }),
    lambert: new THREE.MeshLambertMaterial({ color: '#40e0d0', side: THREE.DoubleSide }),
    phong: new THREE.MeshPhongMaterial({ color: '#40e0d0', shininess: 80, side: THREE.DoubleSide }),
    toon: new THREE.MeshToonMaterial({ color: '#40e0d0', side: THREE.DoubleSide }),
    normal: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
  },
  fig8: {
    // ellipsoid
    basic: new THREE.MeshBasicMaterial({ color: '#3a86ff' }),
    lambert: new THREE.MeshLambertMaterial({ color: '#3a86ff' }),
    phong: new THREE.MeshPhongMaterial({ color: '#3a86ff', shininess: 90 }),
    toon: new THREE.MeshToonMaterial({ color: '#3a86ff' }),
    normal: new THREE.MeshNormalMaterial(),
  },
});

const LIGHT_INTENSITY = Object.freeze({
  ambient: 1,
  directional: 2,
  point: 2,
  objectSpotlight: 100,
});

const OBJECT_SPOTLIGHT_ANGLE = Math.PI / 9;
const OBJECT_SPOTLIGHT_PENUMBRA = 0.3;

const DOME_RADIUS = 64;
const SPHERE_SEGMENTS = 32;

const SKY_MAP_PATH = './assets/an-optical-poem.jpg';

// box and tetrahedron: w = width (X axis), h = height (Y axis), d = depth (Z axis)
// cylinder and sphere: r = radius, rx = rotation on X axis, etc.
const GEOMETRY = {
  skyDome: new THREE.SphereGeometry(
    DOME_RADIUS,
    SPHERE_SEGMENTS,
    SPHERE_SEGMENTS,
    0,
    2 * Math.PI,
    0,
    Math.PI / 2
  ),

  mainCylinder: { r: 1, h: 21 },
  innerRing: { ir: 1, or: 6, h: 4, rx: Math.PI / 2 },
  centralRing: { ir: 6, or: 12, h: 4, rx: Math.PI / 2 },
  outerRing: { ir: 12, or: 18, h: 4, rx: Math.PI / 2 },
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
  fov: 60,
  near: 1,
  far: 1000,
  x: -32,
  y: 19,
  z: -50,
});
const FIXED_CAMERA = createPerspectiveCamera({
  fov: 55,
  near: 1,
  far: 1000,
  x: -32,
  y: 19,
  z: -50,
  atY: -17,
});

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let renderer, scene;
let activeCamera = FIXED_CAMERA;

// textures
let skyMap;

// for translations and rotations
let baseGroup, carouselGroup;
const ringElements = {};
const figures = [];

// flags for event handlers
let updateProjectionMatrix = false;
let toggleActiveCamera = false;
let toggleObjectSpotlight = false;

// lights
let ambientLight, directionalLight, activeMaterial;
let materialChanged = false;
let objectSpotlights = [];

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene() {
  scene = new THREE.Scene();
  scene.background = BACKGROUND;

  baseGroup = createGroup({ y: -21, parent: scene });
  carouselGroup = createGroup({ parent: baseGroup });

  createLights();
  createSkyDome();
  createCarousel();
  createMobiusStrip();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras() {
  const controls = new OrbitControls(ORBITAL_CAMERA, renderer.domElement);
  controls.target.set(0, -17, 0);
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

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createLights() {
  ambientLight = new THREE.AmbientLight(0xff5500, LIGHT_INTENSITY.ambient);
  baseGroup.add(ambientLight);
  directionalLight = new THREE.DirectionalLight(0xffffff, LIGHT_INTENSITY.directional);
  directionalLight.position.set(0.5, 1, 0);
  baseGroup.add(directionalLight);
}

function createSpotlight(x, y, z, ringGroup) {
  // Create and position the spotlight
  const spotlightTarget = new THREE.Object3D();
  spotlightTarget.position.set(x, y, z); // point at figure
  ringGroup.add(spotlightTarget);

  const spotLight = new THREE.SpotLight(0xffffff, LIGHT_INTENSITY.objectSpotlight);
  spotLight.position.set(x, y - 8, z); // Position it under the figure, so it points to its base
  spotLight.target = spotlightTarget;
  spotLight.angle = OBJECT_SPOTLIGHT_ANGLE;
  spotLight.penumbra = OBJECT_SPOTLIGHT_PENUMBRA;
  spotLight.castShadow = true;
  ringGroup.add(spotLight);

  objectSpotlights.push(spotLight);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createSkyDome() {
  const material = new THREE.MeshPhongMaterial({ map: skyMap, side: THREE.BackSide });
  const plane = new THREE.Mesh(GEOMETRY.skyDome, material);
  plane.name = 'skydome';
  baseGroup.add(plane);
}

function createCarousel() {
  createMainCylinder();
  createInnerRing();
  createCentralRing();
  createOuterRing();
}

function createMainCylinder() {
  createCylinderMesh({
    name: 'mainCylinder',
    y: GEOMETRY.mainCylinder.h / 2,
    parent: carouselGroup,
  });
}

function createInnerRing() {
  ringElements.innerRing = createRingMesh({
    name: 'innerRing',
    y: GEOMETRY.innerRing.h,
    parent: carouselGroup,
  });
  ringElements.innerFigures = createGroup({ y: GEOMETRY.innerRing.h, parent: carouselGroup });
  createObjects(
    ringElements.innerFigures,
    GEOMETRY.innerRing.ir + (GEOMETRY.innerRing.or - GEOMETRY.innerRing.ir) / 2,
    [0.5, 0.2, 0.4, 0.2, 0.4, 1, 0.5, 0.5],
    [-1, 1.6, 1.2, 1, 0, 1, 0.42, 0.75]
  );
  ringElements.innerRing.movementFlag = true;
  ringElements.innerFigures.movementFlag = true;
}

function createCentralRing() {
  ringElements.centralRing = createRingMesh({
    name: 'centralRing',
    y: GEOMETRY.centralRing.h,
    parent: carouselGroup,
  });
  ringElements.centralFigures = createGroup({ y: GEOMETRY.centralRing.h, parent: carouselGroup });
  createObjects(
    ringElements.centralFigures,
    GEOMETRY.centralRing.ir + (GEOMETRY.centralRing.or - GEOMETRY.centralRing.ir) / 2,
    [0.7, 0.3, 0.6, 0.4, 0.6, 1.2, 0.7, 0.7],
    [-1.4, 2.4, 1.8, 2, 0, 1.2, 0.59, 1.05]
  );
  ringElements.centralRing.movementFlag = true;
  ringElements.centralFigures.movementFlag = true;
}

function createOuterRing() {
  ringElements.outerRing = createRingMesh({
    name: 'outerRing',
    y: GEOMETRY.outerRing.h,
    parent: carouselGroup,
  });
  ringElements.outerFigures = createGroup({ y: GEOMETRY.outerRing.h, parent: carouselGroup });
  createObjects(
    ringElements.outerFigures,
    GEOMETRY.outerRing.ir + (GEOMETRY.outerRing.or - GEOMETRY.outerRing.ir) / 2,
    [0.9, 0.4, 0.8, 0.6, 0.8, 1.4, 0.8, 0.9],
    [-1.8, 3.2, 2.4, 3, 0, 1.4, 0.67, 1.35]
  );
  ringElements.outerRing.movementFlag = true;
  ringElements.outerFigures.movementFlag = true;
}

function createObjects(ringGroup, radius, scales, yaxis) {
  const figs = ['fig1', 'fig2', 'fig3', 'fig4', 'fig5', 'fig6', 'fig7', 'fig8'];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]; // 8 possible angles
  const funcs = [
    (u, v, target) => {
      // hyperboloid
      const a = 1,
        b = 1,
        c = 2;
      u = (u - 0.5) * Math.PI;
      v = (v - 0.5) * 2 * Math.PI;
      const x = a * Math.sinh(u) * Math.cos(v);
      const z = b * Math.sinh(u) * Math.sin(v);
      const y = c * Math.cosh(u);
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
        q = -8;
      const r = 2 + Math.cos(q * v);
      const x = r * Math.cos(p * u);
      const y = r * Math.sin(p * u);
      const z = -Math.sin(q * u);
      target.set(x, y, z);
    },
    (u, v, target) => {
      // sphere
      const r = 1;
      const x = r * Math.cos(u * 2 * Math.PI) * Math.sin(v * 2 * Math.PI);
      const y = r * Math.sin(u * 2 * Math.PI) * Math.sin(v * 2 * Math.PI);
      const z = r * Math.cos(v * 2 * Math.PI);
      target.set(x, y, z);
    },
    (u, v, target) => {
      // dinis
      u = u * 4 * Math.PI;
      if (v == 0) {
        v = 0.01;
      }
      const a = 1,
        b = 0.2;
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
    const x = Math.cos((angles[i] * Math.PI) / 180) * radius;
    const y = yaxis.shift();
    const z = Math.sin((angles[i] * Math.PI) / 180) * radius;

    figures.push(
      createParametricObjectMesh({
        name: fig,
        x: x,
        y: y,
        z: z,
        scale: scales.shift(),
        parent: ringGroup,
        geomFunc: funcs.shift(),
      })
    );
    angles.splice(i, 1); // Remove used up angle

    createSpotlight(x, y, z, ringGroup);
  });
}

function createMobiusStrip() {
  const geometry = new THREE.BufferGeometry();

  // prettier-ignore
  // Define vertices manually measured for a Möbius strip with radius 12 and width 3
  const vertices = new Float32Array([
    // X       Y       Z           Vertex #
    12,        1.5,    0,       // 0
    9,         1.5,    0,       // 1
    10.5,      1.6,    5.4,     // 2
    8.6,       1.4,    4.2,     // 3
    8,         1.7,    9,       // 4
    6.25,      1.3,    7,       // 5
    4,         2.1,    11.25,   // 6
    3.25,      0.9,    9.5,     // 7
    0,         2.5,    12,      // 8
    0,         0.5,    10.5,    // 9
    -4,        2.8,    11.25,   // 10
    -3.75,     0.2,    10.4,    // 11
    -8,        2.9,    9,       // 12
    -7.75,     0.1,    8.75,    // 13
    -10.5,     2.95,   5.4,     // 14
    -10.5,     0.05,   5.4,     // 15
    -12,       3,      0,       // 16
    -12,       0,      0,       // 17
    -10.5,     2.95,   -5.4,    // 18
    -10.5,     0.05,   -5.4,    // 19
    -8,        0.1,    -8.75,   // 20
    -7.75,     2.9,    -8.75,   // 21
    -4,        0.2,    -11.25,  // 22
    -3.75,     2.8,    -10.4,   // 23
    0,         0.5,    -12,     // 24
    0,         2.5,    -10.5,   // 25
    4,         0.9,    -11.25,  // 26
    3.25,      2.2,    -9.5,    // 27
    8,         1.3,    -9,      // 28
    6.25,      1.7,    -7,      // 29
    10.5,      1.5,    -5.4,    // 30
    8.6,       1.5,    -4.2,    // 31
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  // Define indices to form triangles
  let indices = [
    0, 1, 3, 14, 15, 17, 0, 3, 2, 14, 17, 16, 2, 3, 5, 16, 17, 19, 2, 5, 4, 16, 19, 18, 4, 5, 7, 18,
    19, 21, 4, 7, 6, 19, 20, 21, 6, 7, 9, 20, 21, 23, 6, 9, 8, 20, 23, 22, 8, 9, 11, 22, 23, 25, 8,
    11, 10, 22, 25, 24, 10, 11, 13, 24, 25, 27, 10, 13, 12, 24, 27, 26, 12, 13, 15, 26, 27, 29, 12,
    15, 14, 26, 29, 28, 30, 31, 1, 28, 29, 31, 30, 1, 0, 28, 31, 30,
  ];

  let length = indices.length;

  for (let i = 0; i < length; i += 3) {
    indices.push(indices[i + 2], indices[i + 1], indices[i]);
  }

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = MATERIAL.mobiusStrip.basic;
  const mobiusStrip = new THREE.Mesh(geometry, material);
  mobiusStrip.position.set(0, 21, 0);
  mobiusStrip.name = 'mobiusStrip';

  baseGroup.add(mobiusStrip);
}

////////////
/* UPDATE */
////////////

function update(timeDelta) {
  // rotations
  carouselGroup.rotation.y =
    (carouselGroup.rotation.y + timeDelta * BASE_ANGULAR_VELOCITY) % (2 * Math.PI);
  figures.forEach((figure) => {
    figure.rotation.y = (figure.rotation.y + timeDelta * FIGURE_ANGULAR_VELOCITY) % (2 * Math.PI);
  });

  // compute animation for rings
  CAROUSEL_DYNAMIC_PARTS.forEach((dynamicPart) => {
    if (ringElements[dynamicPart.part]?.movementFlag) {
      DEGREES_OF_FREEDOM[dynamicPart.profile].applier(timeDelta, dynamicPart);
    }
  });

  // materials
  if (materialChanged) {
    materialChanged = false;
    scene.traverse((object) => {
      if (object.isMesh && object.name !== 'skydome') {
        object.material = MATERIAL[object.name][activeMaterial];
      }
    });
  }

  // cameras
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

  // lights
  if (toggleObjectSpotlight) {
    toggleObjectSpotlight = !toggleObjectSpotlight;
    objectSpotlights.forEach((spotLight) => {
      spotLight.visible = !spotLight.visible;
    });
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

  const loader = new THREE.TextureLoader();
  skyMap = loader.load(SKY_MAP_PATH);

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

  KeyD: keyActionFactory(() => (directionalLight.visible = !directionalLight.visible)),
  KeyQ: materialHandleFactory('lambert'),
  KeyW: materialHandleFactory('phong'),
  KeyE: materialHandleFactory('toon'),
  KeyR: materialHandleFactory('normal'),
  KeyT: materialHandleFactory('basic'),
  //KeyP:
  KeyS: keyActionFactory(() => (toggleObjectSpotlight = !toggleObjectSpotlight)),

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

function materialHandleFactory(material) {
  return keyActionFactory(() => {
    activeMaterial = material;
    materialChanged = true;
  });
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
  const material = MATERIAL[name].basic;

  // allows for smooth edges on small cylinders, while also preventing too
  // many segments on smaller ones
  const radialSegments = THREE.MathUtils.clamp(Math.round(100 * r), 5, 35);
  const geometry = new THREE.CylinderGeometry(r, r, h, radialSegments);

  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.position.set(x, y, z);
  cylinder.rotation.set(rx, ry, rz);
  cylinder.name = name;

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
  const material = MATERIAL[name].basic;

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
  ring.name = name;

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
  const material = MATERIAL[name].basic;
  const object = new THREE.Mesh(new ParametricGeometry(geomFunc, 25, 25), material);
  object.position.set(x, y, z);
  object.name = name;
  object.scale.multiplyScalar(scale);
  parent.add(object);
  return object;
}

init();
animate();
