const THREE = require('three');
const objectBuilder = require('./objectBuilder');
const config = require('../../config/config.js');
const helpers = require('./levelBuilderHelpers');

const spawnPoints = [
  [[0, 0, 0], [25, 5, 25], [-25, 5, 25], [25, 5, -25], [-25, 5, -25]],
  [[0, 0, 0], [50, 15, 50], [-50, -5, 50], [50, -5, -50], [-50, 15, -50]],
  [[0, 0, 0], [0, 5, 25], [0, 5, -25], [50, 20, 0], [-50, 20, 0]]
];

const buildSandbox = function buildSandbox() {
  const scene = this.buildBlankLevel();
  let mesh;

  //Side Panels
  mesh = objectBuilder.sidePanel(
    {width: 50, height: 1, depth: 6},
    {x: 0, y: -25, z: -48},
    {x: 0, y: 0, z: 0, w: 0 });
  scene.add(mesh);

  mesh = objectBuilder.sidePanel(
    {width: 50, height: 1, depth: 6},
    {x: 0, y: -25, z: 48},
    {x: 0, y: 0, z: 0, w: 0 }
  );
  scene.add(mesh);

  // buildFloor(A, B, y, width, height, depth, scene)
  // builds square grass floor of A by A with a rock center of B by B, at y height.
  // Blocks will be width x height x depth;
  helpers.buildFloor(10, 5, 0, -5, 0, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, 50, 10, 50, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, -50, 10, -50, 4, 6, 4, scene);
  helpers.buildFloor(6, 3, 50, -10, -50, 4, 6, 4, scene);
  helpers.buildFloor(6, 3, -50, -10, 50, 4, 6, 4, scene);

  //randomCrateGen(n, a, b, fx, fy, fz, r, scene)
  //builds n crates of size a to b at fx, fy, fz with +/- r random variance in fx and fz
  helpers.randomCrateGen(5, 4, 8, 0, 0, 0, 20, scene);
  helpers.randomCrateGen(5, 4, 8, -50, 0, 50, 4, scene);
  helpers.randomCrateGen(5, 4, 8, 50, 0, -50, 4, scene);

  return scene;
}

const buildFraggleRock = function buildFraggleRock(options) {
  const scene = this.buildBlankLevel();
  let mesh;

  // buildFloor(A, B, y, width, height, depth, scene)
  // builds square grass floor of A by A with a rock center of B by B, at y height.
  // Blocks will be width x height x depth;
  helpers.buildFloor(20, 20, 0, -5, 0, 6, 6, 6, scene);
  helpers.buildFloor(4, 4, 52, 3, 52, 4, 10, 4, scene);
  helpers.buildFloor(4, 4, -52, 3, -52, 4, 10, 4, scene);
  helpers.buildFloor(4, 4, 52, 3, -52, 4, 10, 4, scene);
  helpers.buildFloor(4, 4, -52, 3, 52, 4, 10, 4, scene);

  //Side Panels
  mesh = objectBuilder.sidePanel(
    {width: 48, height: 6, depth: 6},
    {x: 0, y: 2.2, z: -61},
    {x: 0, y: 0, z: 0, w: 0 });
  scene.add(mesh);

  mesh = objectBuilder.sidePanel(
    {width: 48, height: 6, depth: 6},
    {x: 0, y: 2.2, z: 61},
    {x: 0, y: 0, z: 0, w: 0 });
  scene.add(mesh);

  mesh = objectBuilder.sidePanel(
    {width: 6, height: 6, depth: 48},
    {x: 61, y: 2.2, z: 0},
    {x: 0, y: 0, z: 0, w: 0 });
  scene.add(mesh);

  mesh = objectBuilder.sidePanel(
    {width: 6, height: 6, depth: 48},
    {x: -61, y: 2.2, z: 0},
    {x: 0, y: 0, z: 0, w: 0 });
  scene.add(mesh);

  //randomCrateGen(n, a, b, fx, fy, fz, r, scene)
  //builds n crates of size a to b at fx, fy, fz with +/- r random variance in fx and fz
  helpers.randomCrateGen(3, 4, 8, 0, 0, 0, 20, scene);
  helpers.randomCrateGen(2, 4, 8, -25, 0, 25, 4, scene);
  helpers.randomCrateGen(2, 4, 8, 25, 0, -25, 4, scene);

  return scene;
}

const buildDawnMountain = function buildDawnMountain(options) {
  const scene = this.buildBlankLevel();
  let mesh;

  //Side Panels
  mesh = objectBuilder.sidePanel(
    {width: 50, height: 1, depth: 6},
    {x: 0, y: -25, z: -48},
    {x: 0, y: 0, z: 0, w: 0 });
  scene.add(mesh);

  mesh = objectBuilder.sidePanel(
    {width: 50, height: 1, depth: 6},
    {x: 0, y: -25, z: 48},
    {x: 0, y: 0, z: 0, w: 0 }
  );
  scene.add(mesh);

  // buildFloor(A, B, y, width, height, depth, scene)
  // builds square grass floor of A by A with a rock center of B by B, at y height.
  // Blocks will be width x height x depth;
  helpers.buildFloor(10, 5, 0, -5, 0, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, 50, 10, 50, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, -50, 10, -50, 4, 6, 4, scene);
  helpers.buildFloor(6, 3, 50, -10, -50, 4, 6, 4, scene);
  helpers.buildFloor(6, 3, -50, -10, 50, 4, 6, 4, scene);

  //randomCrateGen(n, a, b, fx, fy, fz, r, scene)
  //builds n crates of size a to b at fx, fy, fz with +/- r random variance in fx and fz
  helpers.randomCrateGen(3, 4, 8, 0, 0, 0, 20, scene);
  helpers.randomCrateGen(2, 4, 8, -50, 0, 50, 4, scene);
  helpers.randomCrateGen(2, 4, 8, 50, 0, -50, 4, scene);

  return scene;
}

const buildHighNoon = function buildHighNoon(options) {
  const scene = this.buildBlankLevel();
  let mesh;

  //Side Panels
  mesh = objectBuilder.sidePanel(
    {width: 50, height: 1, depth: 6},
    {x: 0, y: 25, z: -48},
    {x: 0, y: 0, z: 0, w: 0 });
  scene.add(mesh);

  mesh = objectBuilder.sidePanel(
    {width: 50, height: 1, depth: 6},
    {x: 0, y: 25, z: 48},
    {x: 0, y: 0, z: 0, w: 0 }
  );
  scene.add(mesh);

  // buildFloor(A, B, y, width, height, depth, scene)
  // builds square grass floor of A by A with a rock center of B by B, at y height.
  // Blocks will be width x height x depth;
  helpers.buildFloor(4, 3, 0, -5, 0, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, 0, 0, 25, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, 0, 0, -25, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, 25, 0, 0, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, -25, 0, 0, 4, 6, 4, scene);
  // helpers.buildFloor(4, 3, 0, 15, 50, 4, 6, 4, scene);
  // helpers.buildFloor(4, 3, 0, 15, -50, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, 50, 15, 0, 4, 6, 4, scene);
  helpers.buildFloor(4, 3, -50, 15, 0, 4, 6, 4, scene);

  //randomCrateGen(n, a, b, fx, fy, fz, r, scene)
  //builds n crates of size a to b at fx, fy, fz with +/- r random variance in fx and fz
  helpers.randomCrateGen(3, 4, 8, 0, 0, 0, 20, scene);
  helpers.randomCrateGen(2, 4, 8, 0, 0, -25, 4, scene);
  helpers.randomCrateGen(2, 4, 8, 0, 0, 25, 4, scene);

  return scene;
}

const buildBlankLevel = function buildBlankLevel() {
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0x111111));

  // sunlight(x, y, z, intensity)
  scene.add(helpers.sunlight(60, 60, 78, 1.9));

  scene.add(objectBuilder.sky());

  return scene;
}

module.exports = function LevelBuilder() {
  this.buildSandbox = buildSandbox.bind(this);
  this.buildFraggleRock = buildFraggleRock.bind(this);
  this.buildDawnMountain = buildDawnMountain.bind(this);
  this.buildHighNoon = buildHighNoon.bind(this);
  this.buildBlankLevel = buildBlankLevel.bind(this);
  this.spawnPoints = spawnPoints;
}

  // EXAMPLE CODE
  // //Score Board
  // mesh = objectBuilder.scoreBoardPole(
  //   { radiusTop: .1, radiusBottom: .1, height: 10, radiusSegments: 10, heightSegments: 10, openEnded: true },
  //   {x: -44.5, y: 2.8, z: -2}
  // );
  // scene.add(mesh);

  // mesh = objectBuilder.scoreBoardPole(
  //   { radiusTop: .1, radiusBottom: .1, height: 10, radiusSegments: 10, heightSegments: 10, openEnded: true },
  //   {x: -44.5, y: 2.8, z: 2}
  // );
  // scene.add(mesh);

  // mesh = objectBuilder.scoreBoard(
  //   {width: 1, height: 4, depth: 9},
  //   {x: -44.3, y: 7.5, z: 0}
  // );
  // scene.add(mesh);

  // mesh = objectBuilder.text(
  //   asynchAddMesh,
  //   'Arial_Regular.json',
  //   'Score',
  //   'blue',
  //   {size: 1.3, height: .06, curveSegments: 3},
  //   {x: -43.7, y: 6.3, z: 2.9}
  // );
