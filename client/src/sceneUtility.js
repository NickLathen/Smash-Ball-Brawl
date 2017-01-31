const THREE = require('three');
const objectBuilder = require('./objectBuilder');
const config = require('../../config/config.js');
const flat = require('../../config/flat.js');
const audio = require('./audio');
const userProfile = require('./component/userProfile.js');
const _ = require('underscore');

import { browserHistory } from 'react-router';

const redBallStack = (function() {
  const result = [];
  const mesh = new objectBuilder.redBall({radius: config.ballRadius, widthSegments: 32, heightSegments: 32});
  for (var i = 0; i < 15; i++) {
    result.push(mesh.clone());
  }
  return result;
})();

let remoteClients = {};
let remoteScene = {};
let currentGame = {};

//make sure object exists
currentGame.matchInfo = {clients: {}};

let pitch = 0;
let yaw = 0;
let host = false;
let shotCount = config.maxShots;
let shotRegen = false;
let jumpCount = config.maxJumps;
let jumpRegen = false;
let latestServerUpdate;
let serverShapeMap = {};
let meshLookup = {init: false};
let clearLookup = {};

//DEBUGGING
let ticks = 0;
let lastTick;
let averageTickRate = 0;

module.exports = {
  addLookControls: function addLookControls(camera, socketUtility) {
    $(document).mousemove(() => {
      const movementX = event.movementX;
      const movementY = event.movementY;
      yaw -= movementX * config.mouseSensitivity;
      pitch -= movementY * config.mouseSensitivity;
      const yawQuat = new THREE.Quaternion();
      const pitchQuat = new THREE.Quaternion();
      yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      pitchQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
      const quat = yawQuat.multiply(pitchQuat);
      camera.quaternion.copy(quat);
      if (currentGame.on) {
        socketUtility.emitClientQuaternion(camera);
      }
    });
  },
  addMoveControls: function addMoveControls(camera, socketUtility) {
    const playerInput = {};
    let flyControlsTick;
    const movePerTick = .3;
    playerInput.up = false;
    playerInput.left = false;
    playerInput.down = false;
    playerInput.right = false;
    playerInput.jump = false;
    playerInput.uuid = camera.uuid.slice(0, config.uuidLength);

    if (!currentGame.on) {
      flyControlsTick = setInterval(function() {
          if (!currentGame.on) {
            const direction = camera.getWorldDirection();
            const currPosition = camera.position;
            if (playerInput.up) {
              camera.position.set(currPosition.x + movePerTick * direction.x, currPosition.y + movePerTick * direction.y, currPosition.z + movePerTick * direction.z);
            }
            if (playerInput.down) {
              camera.position.set(currPosition.x - movePerTick * direction.x, currPosition.y - movePerTick * direction.y, currPosition.z - movePerTick * direction.z);
            }
            if (playerInput.right) {
              camera.position.set(currPosition.x - movePerTick * direction.z, currPosition.y, currPosition.z + movePerTick * direction.x);
            }
            if (playerInput.left) {
              camera.position.set(currPosition.x + movePerTick * direction.z, currPosition.y, currPosition.z - movePerTick * direction.x);
            }
          }
      }, 1/60*1000);
    }

    const onKeyDown = function onKeyDown(event) {
      if (event.keyCode === 87 || event.keyCode === 38) {
        playerInput.up = true;
      }
      if (event.keyCode === 65 || event.keyCode === 37) {
        playerInput.left = true;
      }
      if (event.keyCode === 83 || event.keyCode === 40) {
        playerInput.down = true;
      }
      if (event.keyCode === 68 || event.keyCode === 39) {
        playerInput.right = true;
      }
      if (currentGame.on) {
        if (flyControlsTick) {
          clearInterval(flyControlsTick);
          flyControlsTick = false;
        }
        if (event.keyCode === 32) {
          event.preventDefault();
          if (jumpCount > 0 && playerInput.jump === false) {
            audio.smashBrawl.shootRound(0, 1, 0.08, 0, 0);
            document.getElementById('jump' + jumpCount).style.opacity = '0';
            jumpCount--;
            playerInput.jump = true;
          }
          const regen = function regen() {
            if (jumpCount < config.maxJumps) {
              jumpCount++;
              if (userProfile.matchUrl || userProfile.createMatch) {
                document.getElementById('jump' + jumpCount).style.opacity = '1';
              }
            }
            if (jumpCount < config.maxJumps) {
              setTimeout(regen, config.jumpRegen)
            } else {
              jumpRegen = false;
            }
          };
          if (!jumpRegen && jumpCount < 3) {
            jumpRegen = true;
            setTimeout(function() {
              regen();
            }, config.jumpRegen)
          }
        }
        socketUtility.emitClientPosition(camera, playerInput);
      }
    };

    const onKeyUp = function onKeyUp(event) {
      if (event.keyCode === 87 || event.keyCode === 38) {
        playerInput.up = false;
      }
      if (event.keyCode === 65 || event.keyCode === 37) {
        playerInput.left = false;
      }
      if (event.keyCode === 83 || event.keyCode === 40) {
        playerInput.down = false;
      }
      if (event.keyCode === 68 || event.keyCode === 39) {
        playerInput.right = false;
      }
      if (currentGame.on) {
        if (flyControlsTick) {
          clearInterval(flyControlsTick);
          flyControlsTick = false;
        }
        socketUtility.emitClientPosition(camera, playerInput);
      }
    };
    $(document).on('keydown', onKeyDown);
    $(document).on('keyup', onKeyUp);
    return playerInput;
  },
  addClickControls: function addClickControls(socketUtility) {
    const clickHandler = function clickHandler() {
      if (currentGame.on) {
        if (shotCount > 0) {
          audio.smashBrawl.shootRound(1, 1, 0.08, 0, 1);
          document.getElementById('ammo' + shotCount).style.opacity = '0';
          shotCount--;
          socketUtility.emitShootBall({
            position: currentGame.camera.position,
            direction: currentGame.camera.getWorldDirection(),
            uuid: currentGame.camera.uuid.slice(0, config.uuidLength),
          });
        }
        const regen = function regen() {
          if (shotCount < config.maxShots) {
            shotCount++;
            if (userProfile.matchUrl || userProfile.createMatch) {
              document.getElementById('ammo' + shotCount).style.opacity = '1';
            }
          }
          if (shotCount < config.maxShots) {
            setTimeout(regen, config.shotRegen)
          } else {
            shotRegen = false;
          }
        };
        if (!shotRegen && shotCount < 3) {
          shotRegen = true;
          setTimeout(function() {
            regen();
          }, config.shotRegen)
        }
      }
    };
    $(document).on('click', clickHandler);
  },
  animate: function animate(game) {
    currentGame = game;
    if(latestServerUpdate) {
      module.exports.loadPhysicsUpdate(latestServerUpdate);
    }
    game.renderer.render(game.scene, game.camera);
    requestAnimationFrame(animate.bind(null, game));
  },
  loadMatchInfo: function loadMatchInfo(matchInfo, quitMatch) {
    currentGame.matchInfo = matchInfo;

    let victory = false;
    let playersAlive = [];
    let players = Object.keys(matchInfo.clients).length || 0;

    const messageEl = document.getElementById('criticalMessage');
    if (messageEl.innerText.indexOf('Game') === 0 && players >= matchInfo.maxPlayers) {
      messageEl.innerText = '';
    }

    //check who is alive and set health and names
    Object.keys(matchInfo.clients).forEach( (uuid) => {
      let client = matchInfo.clients[uuid];
      document.getElementById('player' + client.playerNumber + 'Box').style.opacity = '1';
      document.getElementById('player' + client.playerNumber + 'life1').style.opacity = client.lives > 0 ? '1' : '0';
      document.getElementById('player' + client.playerNumber + 'life2').style.opacity = client.lives > 1 ? '1' : '0';
      document.getElementById('player' + client.playerNumber + 'life3').style.opacity = client.lives > 2 ? '1' : '0';
      document.getElementById('player' + client.playerNumber + 'Name').innerHTML = client.name;
      if (!client.mass) {
        client.mass = 50;
      }
      let percent = Math.floor((config.playerModelMass - client.mass) * 7);

      document.getElementById('player' + client.playerNumber + 'Percent').innerHTML = percent + '%';
      document.getElementById('player' + client.playerNumber + 'Score').innerHTML = client.score;
      if (client.lives > 0) {
        playersAlive.push(client.name);
      } else {
        document.getElementById('player' + client.playerNumber + 'Box').style.opacity = '0';
      }
    });

    //if you are the last player alive, display victory screen
    if (players > 1 && playersAlive.length === 1 && matchInfo.maxPlayers !== 0) { //matchInfo does not contain maxPlayers yet
      document.getElementById('HUD').style.display = 'none';
      // document.getElementById('victoryBox').style.display = '';
      document.getElementById('victoryBox').style.opacity = '1';
      document.getElementById('victoryBox').style.height = '300px';
      document.getElementById('victoryBox').style.marginTop = '15%';
      document.getElementById('victor').innerHTML = playersAlive[0] + ' Wins!';
      userProfile.winner = playersAlive[0];

      //END GAME
      quitMatch()
      remoteClients = {};
      currentGame = {};
      remoteScene = {};
      pitch = 0;
      yaw = 0;
      host = false;
      shotCount = null;
      shotRegen = false;
      jumpCount = null;
      jumpRegen = null;
      latestServerUpdate = null;
      serverShapeMap = null;
      meshLookup = {};
      clearLookup = {};
      userProfile.scoreBoard = [];
      // populate scoreboard
      Object.keys(matchInfo.clients).forEach( (uuid) => {
        let client = matchInfo.clients[uuid];
        userProfile.scoreBoard.push({username: client.name, score: client.score, gameID: currentGame.uuid});
      });
      userProfile.scoreBoard = _.sortBy(userProfile.scoreBoard, 'score');

      setTimeout(() => {
        userProfile.matchId = null;
        userProfile.maxPlayers = null;
        userProfile.createMatch = false;
        let canvas = document.getElementsByTagName('canvas');
        canvas[0].remove();
        document.exitPointerLock();
        $(document).off(); //removes all event listeners
        const screenOverlay = document.getElementById( 'screenOverlay' );
        const victoryBox = document.getElementById( 'victoryBox' );
        victoryBox.style.display = 'none';
        screenOverlay.style.display = 'none';
        browserHistory.push('GameOver')
      }, 4000)
    }
  },
  loadClientUpdate: function loadClientUpdate(clientPosition) {
    // Player out of bounds -> death
    if (Math.abs(clientPosition.position.y) > config.playerVerticalBound
    || Math.abs(clientPosition.position.x) > config.playerHorizontalBound
    || Math.abs(clientPosition.position.z) > config.playerHorizontalBound) {
      if (currentGame.matchInfo.clients[clientPosition.uuid] && currentGame.matchInfo.clients[clientPosition.uuid].lives > 0) {
        //death sound
        audio.smashBrawl.shootRound(2, 1, 0.08, 0, 1);
        //reset ammo and jumps if you are the player that died
        if (currentGame.camera.uuid.slice(0, config.uuidLength) === clientPosition.uuid) {
          jumpCount = 3;
          shotCount = 3;

          for (var i = 1; i <= 3; i++) {
            if (userProfile.matchId || userProfile.createMatch) {
              document.getElementById('jump' + i).style.opacity = '1';
              document.getElementById('ammo' + i).style.opacity = '1';
            }
          }
        }
      }

    }

    if (currentGame.camera.uuid.slice(0, config.uuidLength) !== clientPosition.uuid) {
      if (remoteClients[clientPosition.uuid]) {
        //Update existing client
        const localPlayer = remoteClients[clientPosition.uuid];
        localPlayer.position.copy(clientPosition.position);
        localPlayer.quaternion.copy(clientPosition.quaternion).multiply(config.skinAdjustQ);
      } else if (!clearLookup[clientPosition.uuid]){
        //Create new client
        const uuid = clientPosition.uuid;
        const client = currentGame.matchInfo.clients[uuid];
        let color;
        let skinPath;
        let name;

        if (client) {
          color = client.color;
          skinPath = client.skinPath;
        } else {
          console.log('client doesnt exist');
        }

        const mesh = objectBuilder.playerModel(clientPosition.position, clientPosition.quaternion, color, skinPath);
        const hatCallBack = function(hat) {
          mesh.add(hat);
          hat.position.y = -1;
          hat.position.x = 0;
          hat.position.z = 0;
          hat.quaternion.multiply(config.hatAdjustQ)
          hat.castShadow = true;
          hat.receiveShadow = true;
        }
        const hat = objectBuilder.hat(hatCallBack)
        currentGame.scene.add(mesh);
        remoteClients[clientPosition.uuid] = mesh;
      }
    } else {
      //Move camera to client
      currentGame.camera.position.copy(clientPosition.position);
    }
  },
  savePhysicsUpdate: function(meshObject) {
    latestServerUpdate = meshObject;
  },
  loadPhysicsUpdate: function loadPhysicsUpdate(meshObject) {
    if (!currentGame.on) {
      if (currentGame.on === undefined) {
        currentGame.on = 0; //this allows the initial physics update to load once without starting controls
      } else {
        currentGame.on = true;
      }
    }
    meshObject = JSON.parse(meshObject);
    if (!meshLookup.init) {
      currentGame.scene.children.forEach(function(mesh) {
        meshLookup[mesh.uuid.slice(0, config.uuidLength)] = mesh;
      });
    }
    if(meshObject[4] && meshObject[4].play) {
      audio.smashBrawl.shootRound(meshObject[4].play, 1, 0.08, 0, 0 );
    }
    if (meshObject[3]) {
      meshObject[3].forEach(function(uuid) {
        const mesh = meshLookup[uuid] || meshLookup[serverShapeMap[uuid]] || remoteClients[uuid];
        if (mesh) {
          currentGame.scene.remove(mesh);
          if (mesh.userData.name === 'ballMesh') {
            const i = redBallStack.indexOf(mesh);
            redBallStack.splice(i, 1);
            redBallStack.push(mesh);
          }
          meshLookup.length--;
          clearLookup[uuid] = true;
          if (meshLookup[uuid]) {
            delete meshLookup[uuid];
          } else if (meshLookup[serverShapeMap[uuid]]) {
            delete meshLookup[serverShapeMap[uuid]];
            delete serverShapeMap[uuid];
          } else if (remoteClients[uuid]) {
            delete remoteClients[uuid];
          }
        }
      });
    }
    let localMesh;
    meshObject[0].forEach((serverMesh) => {
      serverMesh = flat.reBox(serverMesh);
      localMesh = meshLookup[serverMesh.uuid] || meshLookup[serverShapeMap[serverMesh.uuid]];
      if (localMesh) {
        localMesh.position.copy(serverMesh.position);
        localMesh.quaternion.copy(serverMesh.quaternion);
      } else if (!clearLookup[serverMesh.uuid]) {
        const serverGeometry = serverMesh.geometry;
        const serverPosition = serverMesh.position;
        const serverQuaternion = serverMesh.quaternion;
        const serverType = serverMesh.type;
        const boxMesh = objectBuilder[serverType](serverGeometry, serverPosition, serverQuaternion)
        serverShapeMap[serverMesh.uuid] = boxMesh.uuid.slice(0, config.uuidLength);
        meshLookup[boxMesh.uuid.slice(0, config.uuidLength)] = boxMesh;
        currentGame.scene.add(boxMesh);
      }
      localMesh = undefined;
    });
    meshObject[1].forEach((serverMesh) => {
      serverMesh = flat.reBall(serverMesh);
      localMesh = meshLookup[serverMesh.uuid] || meshLookup[serverShapeMap[serverMesh.uuid]];
      if (localMesh) {
        localMesh.position.copy(serverMesh.position);
        localMesh.quaternion.copy(serverMesh.quaternion);
      } else if(!clearLookup[serverMesh.uuid]) {
        const ballMesh = redBallStack.pop();
        redBallStack.unshift(ballMesh);
        serverShapeMap[serverMesh.uuid] = ballMesh.uuid.slice(0, config.uuidLength);
        meshLookup[ballMesh.uuid.slice(0, config.uuidLength)] = ballMesh;
        ballMesh.position.copy(serverMesh.position);
        ballMesh.quaternion.copy(serverMesh.quaternion);
        currentGame.scene.add(ballMesh);
      }
    });
    meshObject[2].forEach(function(client) {
      module.exports.loadClientUpdate(flat.rePlayer(client));
    });
  },
  getCamera: function getCamera() {
    return currentGame.camera;
  }
};
