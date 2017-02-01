'use strict';
const CANNON = require('cannon');
const THREE = require('three');
const config = require('../config/config.js');
const flat = require('../config/flat.js')
let kill;
const scoreTable = {};

const getGuid = function getGuid() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-_{}[]|;:<>,./?`~';
  return [0, 0, 0, 0].map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
};
let collisionSound;

const random = function random(low, high) {
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

module.exports = function Match(deleteMatch) {
  this.guid = getGuid();
  this.open = true;
  this.clients = {}; // key is client UUID, value is current information about client
  this.clientToCannon = {}; // key is client UUID, value is cannon body
  this.boxes = [];
  this.balls = [];
  this.world;
  this.loadClientUpdate = loadClientUpdate.bind(this);
  this.loadClientQuaternion = loadClientQuaternion.bind(this);
  this.loadNewClient = loadNewClient.bind(this);
  this.loadFullScene = loadFullScene.bind(this);
  this.startPhysics = startPhysics.bind(this);
  this.physicsLoop = physicsLoop;
  this.physicsEmit = physicsEmit;
  this.buildPhysicsEmit = buildPhysicsEmit;
  this.shootBall = shootBall.bind(this);
  this.shutdown = shutdown.bind(this);
  this.loadPoll = loadPoll.bind(this);
  this.deleteMatch = deleteMatch;
  this.physicsTick = config.gameSpeed * config.tickRate / 2;
  this.tickRate = config.tickRate;
  this.killFloor = killFloor.bind(this);
  this.sendFull = true;
  this.io;
  this.buildMatchInfo = buildMatchInfo.bind(this);
  this.lastPoll = performance.now();
  this.sendPoll = sendPoll.bind(this);
  this.clientPoll = setInterval(function() {
    this.sendPoll();
  }.bind(this), 2000);
};

const loadPoll = function loadPoll(clientUuid) {
  if (this.clients[clientUuid]) {
    this.clients[clientUuid].lastUpdate = performance.now();
  }
  this.lastPoll = performance.now();
};

const buildMatchInfo = function buildMatchInfo() {
  const matchInfo = {clients: {}, maxPlayers: this.maxPlayers, numPlayers: this.numPlayers, owner: this.owner, mapChoice: this.mapChoice };
  for (var key in this.clients) {
    const client = this.clients[key];
    let score = 0;
    if (scoreTable[key] !== undefined) {
      score = scoreTable[key];
    }
    matchInfo.clients[client.uuid] = ({
      uuid: client.uuid,
      name: client.name,
      lives: client.lives,
      skinPath: client.skinPath,
      color: client.color,
      playerNumber: client.playerNumber,
      mass: client.mass, //FIXME
      score
    });
  }
  return matchInfo;
};

const sendPoll = function sendPoll() {
  const now = performance.now();
  if (now - this.lastPoll > 10 * 1000) {
    this.deleteMatch();
  } else {
    this.io.to(this.guid).compress(true).emit('poll', JSON.stringify(this.buildMatchInfo()));
  }
};

const loadClientUpdate = function loadClientUpdate(clientPosition) {
  clientPosition = JSON.parse(clientPosition);
  clientPosition = flat.rePlayerInput(clientPosition);
  const localClient = this.clients[clientPosition.uuid];
  if (localClient) {
    localClient.up = clientPosition.up;
    localClient.left = clientPosition.left;
    localClient.right = clientPosition.right;
    localClient.down = clientPosition.down;
    localClient.direction = clientPosition.direction;
    localClient.jump = clientPosition.jump;
    localClient.lastUpdate = performance.now();
  }
};

const loadClientQuaternion = function loadClientQuaternion(clientQuaternion) {
  clientQuaternion = JSON.parse(clientQuaternion);
  clientQuaternion = flat.reClientQuaternion(clientQuaternion);
  const localClient = this.clients[clientQuaternion.uuid];
  if (localClient) {
    localClient.quaternion = clientQuaternion.quaternion;
    localClient.lastUpdate = performance.now();
  }
};

const buildPhysicsEmit = function buildPhysicsEmit(match) {
  const balls = [];
  const boxes = [];
  const clear = [];
  const players = [];
  const expiredBoxes = [];
  const expiredBoxIndices = [];
  const expiredBallIndices = [];
  const now = performance.now();
  for (var key in match.clients) {
    const client = match.clients[key];
    if (now - client.lastUpdate > config.playerTimeout) {
      const clientBody = match.clientToCannon[client.uuid];
      match.world.remove(clientBody);
      clear.push(client.uuid);
      delete match.clients[key];
      delete match.clientToCannon[client.uuid];
    } else {
      players.push(flat.player(match.clients[key]));
    }
  }
  while (match.balls.length > config.maxBalls) {
    const ball = match.balls.shift();
    match.world.remove(ball);
    clear.push(ball.id);
  }
  match.balls.forEach(function(ball, i) {
    if (Math.abs(ball.position.x) > config.physicsBounds ||
    Math.abs(ball.position.y) > config.physicsBounds ||
    Math.abs(ball.position.z) > config.physicsBounds) {
      expiredBallIndices.push(i);
      match.world.remove(ball);
      clear.push(ball.id)
    } else {
      balls.push(flat.ball(ball));
    }
  });
  match.boxes.forEach(function(box, i) {
    if (Math.abs(box.position.x) > 200
    || Math.abs(box.position.y) > 200
    || Math.abs(box.position.z) > 200) {
        match.world.remove(box);
        match.boxes.splice(i, 1);
        clear.push(box.uuid);
    } else {
      if (box.mass || match.sendFull) {
        boxes.push(flat.box(box));
      };
    }
  });
  if (expiredBallIndices.length > 0) {
    let offset = 0;
    expiredBallIndices.forEach(function(index) {
      match.balls.splice(index - offset, 1);
      offset--;
    });
  }
  const update = [boxes, balls, players, clear, collisionSound];
  collisionSound = undefined;
  return update;
}

const physicsEmit = function physicsEmit (match, socket) {
  const update = buildPhysicsEmit(match);
  const players = update[2];
  const clear = update[3];
  if (socket === undefined) {
    if (players.length > 0) {
      if (match.sendFull || clear.length > 0) {
        match.io.to(match.guid).compress(true).emit('fullPhysicsUpdate', JSON.stringify(update));
      } else {
        match.io.to(match.guid).volatile.compress(true).emit('physicsUpdate', JSON.stringify(update));
      }
    } else {
      match.deleteMatch(match.guid);
    }
  } else {
    socket.compress(true).emit('fullPhysicsUpdate', JSON.stringify(update));
  }
  match.sendFull = false;
};

const updateScoreTable = function updateScoreTable(uuid, num) {
  if (num > 0 ) {
    const bonus = config.pointsOnPlayerDeath * (num - 1);
    for (var key in scoreTable) {
      if (key !== uuid) {
        scoreTable[key] += bonus;
      }
    }
  }
}
const physicsLoop = function physicsLoop(match) {
  for (var key in match.clients) {
    const client = match.clients[key];
    const clientBody = match.clientToCannon[client.uuid];
    const currVelocity = clientBody.velocity;
    let movePerTick = config.playerMovePerTick;
    let isMoving = false;
    if (Math.abs(clientBody.position.y) > config.playerVerticalBound ||
    Math.abs(clientBody.position.x) > config.playerHorizontalBound ||
    Math.abs(clientBody.position.z) > config.playerHorizontalBound) {
      //PLAYER DEATH & RESPAWN
      client.lives--
      const spawn = match.spawnPoints[random(0, match.spawnPoints.length - 1)];

      if (client.lives <= 0) {
        // Remove player from physics so they can fly around
        // match.numPlayers -= 1;
      }
      if (client.lives > 0) {
        updateScoreTable(client.uuid, match.numPlayers);
        clientBody.position.set(spawn[0], spawn[1], spawn[2]);
        clientBody.mass = client.mass = config.playerModelMass;
        clientBody.linearDamping = config.playerDamping;
        clientBody.velocity.set(0,0,0);
        match.sendPoll();
        continue;
      }
    }
    if (client.up && client.left || client.up && client.right || client.down && client.left || client.down && client.right) {
      movePerTick = movePerTick * .707;
    }
    if (client.up) {
      isMoving = true;
      clientBody.velocity.set(currVelocity.x + movePerTick * client.direction.x, currVelocity.y, currVelocity.z + movePerTick * client.direction.z);
    }
    if (client.down) {
      isMoving = true;
      clientBody.velocity.set(currVelocity.x - movePerTick * client.direction.x, currVelocity.y, currVelocity.z - movePerTick * client.direction.z);
    }
    if (client.right) {
      isMoving = true;
      clientBody.velocity.set(currVelocity.x - movePerTick * client.direction.z, currVelocity.y, currVelocity.z + movePerTick * client.direction.x);
    }
    if (client.left) {
      isMoving = true;
      clientBody.velocity.set(currVelocity.x + movePerTick * client.direction.z, currVelocity.y, currVelocity.z - movePerTick * client.direction.x);
    }
    if (client.jump) {
      isMoving = true;
        clientBody.velocity.set(currVelocity.x, currVelocity.y + config.jumpVelocity, currVelocity.z);
        client.jump = false;
    }
    if (clientBody.velocity.x < 40 && clientBody.velocity.z < 40 && !isMoving) {
      clientBody.velocity.set(clientBody.velocity.x / 1.05, clientBody.velocity.y, clientBody.velocity.z / 1.05);
    }
  }

  match.world.step(match.physicsTick);
  match.world.step(match.physicsTick);
  physicsEmit(match);
};

const startPhysics = function startPhysics() {
  for (var key in this.clients) {
    const client = this.clients[key];
    const clientBody = this.clientToCannon[client.uuid];
    const spawn = this.spawnPoints[random(0, this.spawnPoints.length - 1)]
    clientBody.position.set(spawn[0], spawn[1], spawn[2]);
    clientBody.velocity.set(0, 0, 0);
  };
  this.physicsClock = setInterval(this.physicsLoop.bind(null, this), this.tickRate * 1000);
};

const shootBall = function shootBall(camera) {
  camera = flat.reShootBall(JSON.parse(camera));
  let x = camera.position.x;
  let y = camera.position.y;
  let z = camera.position.z;

  const ballBody = new CANNON.Body({ mass: config.ballMass });
  const ballShape = new CANNON.Sphere(config.ballRadius);
  ballBody.addShape(ballShape);
  this.world.add(ballBody);
  this.balls.push(ballBody);
  ballBody.linearDamping = .1;
  ballBody.angularDamping = .1;
  ballBody.useruuid = camera.uuid;
  const context = this;

  const shootDirection = camera.direction;
  ballBody.velocity.set(shootDirection.x * config.ballVelocity,
    shootDirection.y * config.ballVelocity,
    shootDirection.z * config.ballVelocity);
  x += shootDirection.x * 2.5;
  y += shootDirection.y * 2.5;
  z += shootDirection.z * 2.5;
  ballBody.position.set(x, y, z);

  ballBody.addEventListener('collide', function (e) {
  if(e.body.userData && e.body.userData.shapeType >= 3) {
    collisionSound = { play: e.body.userData.shapeType };
  } else if( e.target.useruuid
  && (e.body.userData)
  && (e.body.userData.playername)
  && (e.target.mass === config.ballMass)
  && (e.target.useruuid !== e.body.uuid)) {
    if (e.body.mass > config.onShootMassLoss * 2 + 1) {
      e.body.mass -= config.onShootMassLoss;

      if (e.body.linearDamping > config.onShootDampingLoss + .05) {
        e.body.linearDamping -= config.onShootDampingLoss;
      }

      context.clients[e.body.uuid].mass = e.body.mass;
      if(scoreTable[e.target.useruuid] !== undefined) {
        scoreTable[e.target.useruuid] = scoreTable[e.target.useruuid] + config.onShootScore;
        e.target.useruuid = null;
      }
  }
    collisionSound = { play: 7 };
  }
});

};

const loadNewClient = function loadNewClient(player) {
  const x = player.position.x;
  const y = player.position.y;
  const z = player.position.z;
  player.object.uuid = player.object.uuid.slice(0, config.uuidLength);
  const ballBody = new CANNON.Body({ mass: config.playerModelMass });
  const ballShape = new CANNON.Sphere(config.playerModelRadius);
  ballBody.position.x = x;
  ballBody.position.y = y;
  ballBody.position.z = z;
  ballBody.addShape(ballShape);
  ballBody.linearDamping = config.playerDamping;
  ballBody.angularDamping = config.playerDamping;
  ballBody.uuid = player.object.uuid;
  scoreTable[ballBody.uuid] = 0;
  const playerNumber = Object.keys(this.clients).length + 1;
  this.clientToCannon[player.object.uuid] = ballBody;
  player.name = player.name || 'Guest';
  ballBody.userData = { playername: player.name };

  // player data for other users
  this.clients[player.object.uuid] = {uuid: player.object.uuid,
    position: ballBody.position, direction: player.direction,
    quaternion: player.quaternion,
    up: false, left: false, right: false, down: false,
    lastUpdate: performance.now(), skinPath: player.skinPath, name: player.name,
    color: config.colors[playerNumber - 1], lives: 3, playerNumber: playerNumber };
  this.world.add(ballBody);
  this.sendPoll();
};

const loadFullScene = function loadFullScene(scene, player, io, maxPlayers, spawnPoints, owner, mapChoice) {
  // Setup our world
  this.io = io;
  this.maxPlayers = maxPlayers;
  this.numPlayers = maxPlayers;
  this.spawnPoints = spawnPoints;
  this.owner = owner;
  this.mapChoice = mapChoice;
  const context = this;
  let world = new CANNON.World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;

  const solver = new CANNON.GSSolver();

  world.defaultContactMaterial.contactEquationStiffness = 1e9;
  world.defaultContactMaterial.contactEquationRelaxation = 4;

  solver.iterations = 1;
  solver.tolerance = 0.5;
  world.solver = new CANNON.SplitSolver(solver);

  world.gravity.set(0, config.gravity, 0);
  world.broadphase = new CANNON.NaiveBroadphase();

  // Create a slippery material (friction coefficient = 0.0)
  const physicsMaterial = new CANNON.Material("slipperyMaterial");
  const physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, 0.0, 0.3);
  // We must add the contact materials to the world
  world.addContactMaterial(physicsContactMaterial);

  // Loop through objects in scene and create copy in CANNON world
  scene.object.children.forEach(function(mesh) {
    if (!mesh.userData || mesh.userData.mass === undefined || mesh.userData.mass < 0) {
      return;
    }
    let meshGeometry;
    scene.geometries.forEach(function(geometry) {
      if (geometry.uuid === mesh.geometry) {
        meshGeometry = geometry;
      }
    });
    if (meshGeometry && meshGeometry.type === 'BoxGeometry') {
      let position = new THREE.Vector3();
      let quaternion = new THREE.Quaternion();
      let matrix = new THREE.Matrix4();
      matrix.fromArray(mesh.matrix);
      position.setFromMatrixPosition(matrix);
      quaternion.fromArray(mesh.matrix);
      const width = meshGeometry.width;
      const height = meshGeometry.height;
      const depth = meshGeometry.depth;
      const cannonPosition = new CANNON.Vec3(position.x, position.y, position.z);
      const cannonQuat = new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      let cannonSize;
      if (mesh.userData.name === 'grassFloor') {
        cannonSize = new CANNON.Vec3(width / 2 - .065, height / 2 + .065, depth / 2 - .065);
      } else {
        cannonSize = new CANNON.Vec3(width / 2 + .065, height / 2 + .065, depth / 2 + .065);
      }
      const cannonBox = new CANNON.Box(cannonSize);
      const cannonBody = new CANNON.Body({mass: mesh.userData.mass});
      cannonBody.addShape(cannonBox);
      cannonBody.position = cannonPosition;
      cannonBody.quaternion = cannonQuat;
      cannonBody.linearDamping = 0.01;
      cannonBody.angularDamping = 0.01;
      cannonBody.uuid = mesh.uuid.slice(0, config.uuidLength);
      cannonBody.userData = {shapeType: mesh.userData.name, geometry: {width, height, depth}};

      context.boxes.push(cannonBody);
      world.add(cannonBody);
    }
  });
  this.world = world;
  this.loadNewClient(player);
};

// Remove floor tiles periodically
const killFloor = function killFloor() {
  let floorTiles = [];
  let spacer = 76;

  setTimeout(() => {
    this.world.bodies.forEach((ele) => {
      if(ele.userData && ele.userData.shapeType && ele.userData.shapeType === flat.shapeEncoder['grassFloor']) {
        floorTiles.push(ele);
      }
    });

    this.killFloorInterval = setInterval(() => {
      if (floorTiles.length === 0) {
        clearInterval(this.killFloorInterval);
      }
      if (floorTiles.length < spacer * 2) {
        spacer /= 2;
      }
      let randIndex = Math.floor(Math.random() * spacer);
      let tile = floorTiles[randIndex];
      if (floorTiles[randIndex]) {
        tile.mass = 1000;
        tile.updateMassProperties()
        tile.type = 1;
        tile.velocity.y = config.killFloorUpVelocity;
        floorTiles.splice(randIndex, 1)
      }
    }, config.killFloorInterval);
  }, 5000);
}

const shutdown = function shutdown() {
  this.open = false;
  clearInterval(this.clientPoll);
  clearInterval(this.physicsClock);
  clearInterval(this.killFloorInterval);
};
