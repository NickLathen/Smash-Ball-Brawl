const socketPort = process.env.SOCKET_PORT || 3001;
const socketManager = process.env.SOCKET_MANAGER || '127.0.0.1';
const socketManagerPort = 4444;
const io = require('socket.io')(socketPort);
const matchController = require('./matchController.js');
const request = require('request');

const sendServerUpdate = function sendServerUpdate() {
  let body = matchController.getMatch() ? matchController.getMatch().buildMatchInfo() : {};
  body.port = socketPort;
  body = JSON.stringify(body);
  const options = {
    method: 'POST',
    uri: `http://${socketManager}:${socketManagerPort}/statusPoll`,
    headers: {
      'Content-Type': 'text/plain'
    },
    body: body
  };
  request(options, function (error, response, body) {
    if (error) {
      console.error(error);
    }
  });
};


setInterval(function() {
  sendServerUpdate();
}, 1500);


console.log('Physics server listening on ' + socketPort);
io.on('connection', (socket) => {

  socket.on('fullScene', function (fullScene) {
    if (matchController.getMatch() === undefined) {
      const scene = fullScene.scene;
      const player = fullScene.camera;
      const match = matchController.getNewMatch();
      const maxPlayers = fullScene.maxPlayers;
      socket.join(match.guid);
      match.loadFullScene(scene, player, io, maxPlayers, fullScene.spawnPoints, fullScene.owner, fullScene.mapChoice);
      socket.on('shootBall', function(camera) {
        match.shootBall(camera);
      });
      socket.on('clientUpdate', function (camera) { // listener for client position updates
        match.loadClientUpdate(camera); // update server's copy of client position
      });
      socket.on('clientQ', function (clientQuaternion) {
        match.loadClientQuaternion(clientQuaternion);
      });
      socket.on('poll', function(clientUuid) {
        match.loadPoll(clientUuid);
      });
      if (match.maxPlayers === 0) {
        match.startPhysics();
        match.killFloor();
      }
    }
  });

  socket.on('addMeToMatch', function (newMatchRequest) {
    const player = newMatchRequest.player;
    const match = matchController.getMatch();
    if (!match || match.maxPlayers === Object.keys(match.clients).length || Object.keys(match.clients).length >= 6) {
      socket.emit('matchUnavailable');
    } else {
      socket.join(match.guid, function() {
        match.loadNewClient(player);
        match.sendFull = true;
        match.physicsEmit(match, socket);
        socket.on('shootBall', function(camera) {
          match.shootBall(camera);
        });
        socket.on('clientUpdate', function (clientPosition) { // listener for client position updates
          match.loadClientUpdate(clientPosition); // update server's copy of client position
        });
        socket.on('clientQ', function (clientQuaternion) {
          match.loadClientQuaternion(clientQuaternion);
        });
        socket.on('poll', function(clientUuid) {
          match.loadPoll(clientUuid);
        });
        if (match.maxPlayers === Object.keys(match.clients).length) {
          setTimeout(function() {
            match.startPhysics();
            match.killFloor();
          }, 2000)
        }
      });
    }
  });
});