const THREE = require('three');
const io = require('socket.io-client');
const sceneUtility = require('./sceneUtility');
const flat = require('../../config/flat');
const config = require('../../config/config');
const userProfile = require('./component/userProfile');
const lastEmittedClient = {theta: 0};
const audio = require('./audio');
let socket;
let canEmitQ = true;
let emitQ;

const addUpdateListeners = function addUpdateListeners(socket) {
  socket.on('physicsUpdate', function(meshesObject) {
    sceneUtility.savePhysicsUpdate(meshesObject);
  });
  socket.on('fullPhysicsUpdate', function(meshesObject) {
    sceneUtility.loadPhysicsUpdate(meshesObject);
  });
  socket.on('poll', function(matchInfo) {
    socket.emit('poll', sceneUtility.getCamera().uuid.slice(0, config.uuidLength));
    sceneUtility.loadMatchInfo(JSON.parse(matchInfo), module.exports.quitMatch);
  });
}

const roundToDec = function round(num, decimals) {
  decimals = decimals || 3;
  const mult = Math.pow(10, decimals);
  return Math.round(num * mult) / mult;
}
const roundPosition = function roundPosition (position, decimals) {
  const newPosition = {};
  newPosition.x = roundToDec(position.x, decimals);
  newPosition.y = roundToDec(position.y, decimals);
  newPosition.z = roundToDec(position.z, decimals);
  return newPosition;
};
const roundQuaternion = function roundQuaternion (quaternion, decimals) {
  const newQuaternion = {};
  newQuaternion._w = roundToDec(quaternion.w, decimals);
  newQuaternion._x = roundToDec(quaternion.x, decimals);
  newQuaternion._y = roundToDec(quaternion.y, decimals);
  newQuaternion._z = roundToDec(quaternion.z, decimals);
  return newQuaternion;
};
const hasChangedInput = function hasChangedInput(playerInput) {
  let hasChanged = false;
  const isMoving = lastEmittedClient.up || lastEmittedClient.down || lastEmittedClient.left || lastEmittedClient.right;
  const newTheta = Math.atan2(playerInput.direction.z, playerInput.direction.x);
  if (isMoving && Math.abs(newTheta - lastEmittedClient.theta) > .05) {
    hasChanged = true;
  } else if (playerInput.up !== lastEmittedClient.up) {
    hasChanged = true;
  } else if (playerInput.down !== lastEmittedClient.down) {
    hasChanged = true;
  } else if (playerInput.left !== lastEmittedClient.left) {
    hasChanged = true;
  } else if (playerInput.right !== lastEmittedClient.right) {
    hasChanged = true;
  } else if (playerInput.jump === true && playerInput.jump !== lastEmittedClient.jump) {
    hasChanged = true;
  }
  if (hasChanged) {
    lastEmittedClient.up = playerInput.up;
    lastEmittedClient.down = playerInput.down;
    lastEmittedClient.right = playerInput.right;
    lastEmittedClient.left = playerInput.left;
    lastEmittedClient.jump = playerInput.jump;
    lastEmittedClient.direction = playerInput.direction;
    lastEmittedClient.theta = newTheta;
  }
  return hasChanged;
}


module.exports = {
  requestNewMatch: function requestNewMatch(game, maxPlayers) {
    $.ajax({
      url: '/api/liveGames',
      method: 'GET',
      success: (data) => {
        const physicsServers = JSON.parse(data);
        let serverUrl;
        for (var url in physicsServers) {
          const server = physicsServers[url];
          if (server === 'empty') {
            serverUrl = url;
            break;
          }
        }
        socket = io(serverUrl);
        socket.addEventListener('connect', function() {
          addUpdateListeners(socket);
          const camera = game.camera.toJSON();
          camera.position = game.camera.position;
          camera.quaternion = game.camera.quaternion;
          camera.direction = game.camera.getWorldDirection();
          // declare your name and skin
          camera.skinPath = userProfile.ChosenSkin;
          camera.name = userProfile.User;
          const fullScene = {camera: camera, scene: game.scene.toJSON(), spawnPoints: game.spawnPoints,
          maxPlayers: game.maxPlayers, owner: game.owner, mapChoice: game.mapChoice};
          socket.emit('fullScene', fullScene);
        });
      }
    });
  },
  joinMatch: function joinMatch(matchUrl, game) {
    socket = io(matchUrl + ':3001');

    setTimeout(function() {
      addUpdateListeners(socket);
      const player = game.camera.toJSON();
      player.position = game.camera.position;
      player.direction = game.camera.getWorldDirection();
      player.quaternion = game.camera.quaternion;

      // sending my name and skin to other players
      player.name = userProfile.User;
      player.skinPath = userProfile.ChosenSkin;
      socket.emit('addMeToMatch', {player: player});
    }, 1500);
  },
  emitClientPosition: function emitClientPositon(camera, playerInput) {
    playerInput.direction = camera.getWorldDirection();
    if (hasChangedInput(playerInput)) {
      socket.emit('clientUpdate', JSON.stringify(flat.playerInput(playerInput)));
      playerInput.jump = false;
      lastEmittedClient.jump = false;
    }
  },
  emitClientQuaternion: function emitClientQuaternion(camera) {
    emitQ = camera ? JSON.stringify(flat.clientQuaternion({uuid: camera.uuid.slice(0, config.uuidLength), quaternion: camera.quaternion})) : emitQ;
    if (canEmitQ && emitQ) {
      socket.emit('clientQ', emitQ);
      canEmitQ = false;
      emitQ = undefined;
      setTimeout(function() {
        canEmitQ = true;
        module.exports.emitClientQuaternion();
      }, 1 / 30 * 1000);
    }
  },
  emitShootBall: function emitShootBall(camera) {
    socket.emit('shootBall', JSON.stringify(flat.shootBall(camera)));
  },
  quitMatch: function quitMatch() {
    socket.removeAllListeners();
    socket.disconnect();
  }
};
