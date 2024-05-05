'use strict';

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

  containerFloor: new THREE.MeshBasicMaterial({ color: '#FF00FF' }),
  smallContainerWall: new THREE.MeshBasicMaterial({ color: '#FF0000' }),
  bigContainerWall: new THREE.MeshBasicMaterial({ color: '#FF0000' }),

  object1: new THREE.MeshBasicMaterial({ color: '#008000' }),
  object2: new THREE.MeshBasicMaterial({ color: '#000080' }),
  object3: new THREE.MeshBasicMaterial({ color: '#800080' }),
  object4: new THREE.MeshBasicMaterial({ color: '#00FFFF' }),
  object5: new THREE.MeshBasicMaterial({ color: '#FF69B4' }),
});

// box and tetrahedron: w = width (X axis), h = height (Y axis), d = depth (Z axis)
// cylinder and sphere: r = radius, rx = rotation on X axis, etc.
const GEOMETRY = {
  base: { w: 6, h: 2, d: 6 },
  tower: { w: 2, h: 17, d: 2 },
  cab: { w: 4, h: 3, d: 4 },
  apex: { l: 4, h: 5, ry: Math.PI / 4 },
  jib: { w: 19, h: 2, d: 2 },
  counterjib: { w: 11, h: 2, d: 2 },
  counterweight: { w: 4, h: 2, d: 2 },
  rearPendant: { r: 0.1, h: 10, rz: -Math.PI / 2.4 },
  frontPendant: { r: 0.1, h: 18.5, rz: Math.PI / 2.2 },
  trolley: { w: 3, h: 2, d: 2 },
  cable: { r: 0.3, h: 9 },

  clawWrist: { r: 0.5 },
  clawFingerBody: { w: 1.5, h: 0.2, d: 0.2 },
  clawFingerTip: { l: 0.2, h: 1, rz: -Math.PI / 2 },

  containerFloor: { w: 10, h: 0.2, d: 6 },
  smallContainerWall: { w: 0.2, h: 7, d: 6 },
  bigContainerWall: { w: 10, h: 7, d: 0.2 },

  object1: { w: 2, h: 3, d: 2 },
  object2: { r: 1.5 },
  object3: { r: 2 },
  object4: { r: 1.75 },
  object5: { r: 1 },
};

/* TODO
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
  clawAABB: [new THREE.Vector3(-5, -5, -5), new THREE.Vector3(5, 5, 5)],
  orthogonalDistance: 30,
  orthogonalNear: 1,
  orthogonalFar: 1000,
  perspectiveDistance: 30,
  perspectiveFov: 70,
  perspectiveNear: 1,
  perspectiveFar: 1000,
});

// degrees of freedom for each profile
const DEGREES_OF_FREEDOM = Object.freeze({
  top: {
    applier: rotateDynamicPart,
    min: -Math.PI,
    max: Math.PI,
    axis: 'y',
  },
  trolley: {
    applier: translateDynamicPart,
    min: GEOMETRY.cab.w / 2 + GEOMETRY.trolley.w / 2,
    max: GEOMETRY.jib.w - 1,
    axis: 'x',
  },
  cable: {
    applier: resizeCable,
    min: 0,
    max: GEOMETRY.cable.h,
    axis: 'y',
  },
  claw: {
    applier: translateDynamicPart,
    min: -(GEOMETRY.trolley.h / 2 + GEOMETRY.cable.h + GEOMETRY.clawWrist.r),
    max: -(GEOMETRY.trolley.h / 2 + GEOMETRY.clawWrist.r),
    axis: 'y',
  },
  finger: {
    applier: rotateDynamicParts,
    min: -Math.PI / 4,
    max: 0,
    axis: 'z',
  },
});

const CRANE_DYNAMIC_PARTS = Object.freeze([
  { part: 'top', profile: 'top' },
  { part: 'trolley', profile: 'trolley' },
  { part: 'cable', profile: 'cable' },
  { part: 'claw', profile: 'claw' },
  { part: 'fingers', profile: 'finger' },
]);

const MOVEMENT_FLAGS_VECTORS = Object.freeze({
  xPositive: new THREE.Vector3(1, 0, 0),
  xNegative: new THREE.Vector3(-1, 0, 0),
  yPositive: new THREE.Vector3(0, 1, 0),
  yNegative: new THREE.Vector3(0, -1, 0),
  zPositive: new THREE.Vector3(0, 0, 1),
  zNegative: new THREE.Vector3(0, 0, -1),
});

const MOVEMENT_TIME = 2000; // miliseconds
const DELTAS = Object.freeze(
  Object.fromEntries([
    // automatically generate DELTAs for the parts with defined degrees of freedom
    ...Object.entries(DEGREES_OF_FREEDOM).map(([key, { min, max }]) => {
      const val = (max - min) / MOVEMENT_TIME;

      return [key, val];
    }),
  ])
);

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let renderer, scene;
let activeCamera;
let prevTimeStamp;

const dynamicElements = {};

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
  // mobile perspective projection
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
  scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper(20));
  scene.background = BACKGROUND;

  createFloor();
  createCrane();
  createContainer();
  createCargo();
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
 * Finally, updates the projection matrix of the camera.
 */
function refreshCameraParameters({ getCameraParameters, camera }) {
  const parameters = getCameraParameters();

  Object.assign(camera, parameters);
  camera.updateProjectionMatrix();
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

// Create a geometry for the floor (a plane)
function createFloor() {
  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = new THREE.MeshBasicMaterial({ color: '#abF7B1' });

  const plane = new THREE.Mesh(geometry, material);
  plane.rotateX(-Math.PI / 2); // Rotate it so that it is in the xOz plane

  scene.add(plane);
}

function createCrane() {
  const baseGroup = createGroup({ y: GEOMETRY.base.h / 2, parent: scene });
  const topGroup = createGroup({ y: GEOMETRY.base.h / 2 + GEOMETRY.tower.h, parent: baseGroup });
  const trolleyGroup = createGroup({
    x: GEOMETRY.jib.w - 1,
    y: GEOMETRY.trolley.h,
    parent: topGroup,
  });
  const clawGroup = createGroup({
    y: -(GEOMETRY.trolley.h / 2 + GEOMETRY.cable.h + GEOMETRY.clawWrist.r),
    parent: trolleyGroup,
  });

  dynamicElements.top = topGroup;
  dynamicElements.trolley = trolleyGroup;
  dynamicElements.claw = clawGroup;

  createBase(baseGroup);
  createTop(topGroup);
  createTrolley(trolleyGroup);
  createClaw(clawGroup);
}

function createBase(baseGroup) {
  createBoxMesh({ name: 'base', parent: baseGroup });
  createBoxMesh({
    name: 'tower',
    y: GEOMETRY.base.h / 2 + GEOMETRY.tower.h / 2,
    parent: baseGroup,
  });
}

function createTop(topGroup) {
  // Center
  createBoxMesh({ name: 'cab', y: GEOMETRY.cab.h / 2, parent: topGroup });
  createPyramidMesh({ name: 'apex', y: GEOMETRY.cab.h + GEOMETRY.apex.h / 2, parent: topGroup });

  // Left side
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

  // Right side
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
}

function createTrolley(trolleyGroup) {
  createBoxMesh({ name: 'trolley', parent: trolleyGroup });
  dynamicElements.cable = createCylinderMesh({
    name: 'cable',
    y: -(GEOMETRY.cable.h + GEOMETRY.trolley.h) / 2,
    parent: trolleyGroup,
  });
}

function createClaw(clawGroup) {
  // Wrist
  createRadialObjectMesh({ name: 'clawWrist', parent: clawGroup, geomFunc: THREE.SphereGeometry });

  // Fingers
  dynamicElements.fingers = [];
  createFinger(clawGroup, 0); // Right finger
  createFinger(clawGroup, Math.PI); // Left Finger
  createFinger(clawGroup, Math.PI / 2); // Back Finger
  createFinger(clawGroup, -Math.PI / 2); // Front Finger
}

function createFinger(clawGroup, rot) {
  const fingerBodyGroup = createGroup({
    parent: clawGroup,
  });
  createBoxMesh({
    name: 'clawFingerBody',
    x: GEOMETRY.clawWrist.r + GEOMETRY.clawFingerBody.w / 2,
    parent: fingerBodyGroup,
  });
  const fingerTipGroup = createGroup({
    x: GEOMETRY.clawWrist.r + GEOMETRY.clawFingerBody.w,
    parent: fingerBodyGroup,
  });
  createPyramidMesh({
    name: 'clawFingerTip',
    x: GEOMETRY.clawFingerTip.h / 2,
    parent: fingerTipGroup,
  });
  fingerTipGroup.rotation.set(0, 0, -Math.PI / 3);
  fingerBodyGroup.rotation.set(0, rot, -Math.PI / 4);
  dynamicElements.fingers.push(fingerBodyGroup);
}

function createContainer() {
  const containerGroup = createGroup({ x: 8, z: 8, parent: scene });
  createBoxMesh({
    name: 'containerFloor',
    y: GEOMETRY.containerFloor.h / 2,
    parent: containerGroup,
  });
  createBoxMesh({
    name: 'smallContainerWall',
    x: GEOMETRY.containerFloor.w / 2,
    y: GEOMETRY.smallContainerWall.h / 2,
    parent: containerGroup,
  });
  createBoxMesh({
    name: 'smallContainerWall',
    x: -GEOMETRY.containerFloor.w / 2,
    y: GEOMETRY.smallContainerWall.h / 2,
    parent: containerGroup,
  });
  createBoxMesh({
    name: 'bigContainerWall',
    y: GEOMETRY.smallContainerWall.h / 2,
    z: -GEOMETRY.containerFloor.d / 2,
    parent: containerGroup,
  });
  createBoxMesh({
    name: 'bigContainerWall',
    y: GEOMETRY.smallContainerWall.h / 2,
    z: +GEOMETRY.containerFloor.d / 2,
    parent: containerGroup,
  });
}

function createCargo() {
  const cargoGroup = createGroup({ parent: scene });
  createBoxMesh({ name: 'object1', x: -10, y: GEOMETRY.object1.h / 2, z: -5, parent: cargoGroup });
  createRadialObjectMesh({
    name: 'object2',
    x: 16,
    y: GEOMETRY.object2.r,
    z: -5,
    parent: cargoGroup,
    geomFunc: THREE.DodecahedronGeometry,
  });
  createRadialObjectMesh({
    name: 'object3',
    y: GEOMETRY.object3.r,
    z: -10,
    parent: cargoGroup,
    geomFunc: THREE.IcosahedronGeometry,
  });
  createRadialObjectMesh({
    name: 'object4',
    x: 10,
    y: GEOMETRY.object4.r,
    z: 15,
    parent: cargoGroup,
    geomFunc: THREE.TorusGeometry,
  });
  createRadialObjectMesh({
    name: 'object5',
    x: -13,
    y: GEOMETRY.object5.r,
    z: 12,
    parent: cargoGroup,
    geomFunc: THREE.TorusKnotGeometry,
  });
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////

function checkCollisions() {}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////

function handleCollisions() {}

////////////
/* UPDATE */
////////////

function update(timeDelta) {
  CRANE_DYNAMIC_PARTS.forEach((part) => DEGREES_OF_FREEDOM[part.profile].applier(timeDelta, part));
}

function rotateDynamicParts(timeDelta, { part, profile }) {
  const group = dynamicElements[part];
  if (!group.userData?.movementFlags) {
    return;
  }

  const props = DEGREES_OF_FREEDOM[profile];
  const delta = deltaSupplier({ profile, group, timeDelta });
  group.forEach((part) => {
    rotateGroup(part, props, delta);
  });
}

function rotateDynamicPart(timeDelta, { part, profile }) {
  const group = dynamicElements[part];
  if (!group.userData?.movementFlags) {
    return;
  }

  const props = DEGREES_OF_FREEDOM[profile];
  const delta = deltaSupplier({ profile, group, timeDelta });
  rotateGroup(group, props, delta);
}

function rotateGroup(group, props, delta) {
  group.rotation.fromArray(
    ['x', 'y', 'z'].map((axis) => {
      const newValue = group.rotation[axis] + delta[axis];
      if (props?.axis === axis) {
        return THREE.MathUtils.clamp(newValue, props.min, props.max);
      }
      return newValue;
    })
  );
}

function translateDynamicPart(timeDelta, { part, profile }) {
  const group = dynamicElements[part];
  if (!group.userData?.movementFlags) {
    return;
  }

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

function resizeCable(timeDelta, { part, profile }) {
  var group = dynamicElements[part];
  if (!group.userData?.movementFlags) {
    return;
  }

  const props = DEGREES_OF_FREEDOM[profile];
  const delta = deltaSupplier({ profile, group, timeDelta });

  GEOMETRY.cable.h = THREE.MathUtils.clamp(GEOMETRY.cable.h - delta['y'], props.min, props.max);
  group.position.setY(-(GEOMETRY.cable.h + GEOMETRY.trolley.h) / 2);
  group.scale.set(1, GEOMETRY.cable.h / 9); // 9 is the default length of the cable
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
  renderer.render(scene, activeCamera.camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createScene();
  createCameras();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////

function animate(timestamp) {
  const timeDelta = timestamp - prevTimeStamp;

  update(timeDelta);
  render();
  prevTimeStamp = timestamp;
  requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (window.innerHeight > 0 && window.innerWidth > 0) {
    refreshCameraParameters(activeCamera);
  }
}

//////////////////
/* KEY HANDLERS */
//////////////////

const keyHandlers = {
  // Cameras
  Digit1: changeActiveCameraHandleFactory(cameras.front),
  Digit2: changeActiveCameraHandleFactory(cameras.side),
  Digit3: changeActiveCameraHandleFactory(cameras.top),
  Digit4: changeActiveCameraHandleFactory(cameras.orthogonal),
  Digit5: changeActiveCameraHandleFactory(cameras.perspective),
  Digit6: changeActiveCameraHandleFactory(cameras.mobile),

  // Rotations and translations

  // top
  KeyQ: transformDynamicPartHandleFactory({ parts: ['top'], flag: 'yPositive' }),
  KeyA: transformDynamicPartHandleFactory({ parts: ['top'], flag: 'yNegative' }),
  // trolley
  KeyW: transformDynamicPartHandleFactory({ parts: ['trolley'], flag: 'xPositive' }),
  KeyS: transformDynamicPartHandleFactory({ parts: ['trolley'], flag: 'xNegative' }),
  // cable and claw
  KeyE: transformDynamicPartHandleFactory({ parts: ['cable', 'claw'], flag: 'yPositive' }),
  KeyD: transformDynamicPartHandleFactory({ parts: ['cable', 'claw'], flag: 'yNegative' }),
  // fingers
  KeyR: transformDynamicPartHandleFactory({ parts: ['fingers'], flag: 'zPositive' }),
  KeyF: transformDynamicPartHandleFactory({ parts: ['fingers'], flag: 'zNegative' }),
};

function changeActiveCameraHandleFactory(cameraDescriptor) {
  return (_event, isKeyUp) => {
    if (isKeyUp) {
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

// main: Start everything
init();
requestAnimationFrame(animate);
