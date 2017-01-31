'use strict';
const httpPort = 4444;
const http = require('http');
const physicsServers = {};

const server = http.createServer((req, res) => {
  if (req.url === '/register') {
    register(req, res);
  }
  if (req.url === '/liveGames') {
    liveGames(req, res);
  }
  if (req.url === '/statusPoll') {
    statusPoll(req, res);
  }
});
server.listen(httpPort);

const liveGames = function(req, res) {
  console.log('serving livegames')
  res.statusCode = 200;
  let liveGames = {};
  for (var url in physicsServers) {
    const matchInfo = physicsServers[url].matchInfo;
    liveGames[url] = matchInfo || 'empty';
  }
  console.log(liveGames);
  res.end(JSON.stringify(liveGames));
};

const statusPoll = function(req, res) {
  let serverUrl = req.connection.remoteAddress;
  if (serverUrl.indexOf('::ffff:') !== -1) {
    serverUrl = serverUrl.slice(7);
  }
  let statusPoll = '';
  req.on('data', function(chunk) {statusPoll += chunk});
  req.on('end', function() {
    statusPoll = JSON.parse(statusPoll);
    serverUrl = serverUrl + ':' + statusPoll.port;
    let server = physicsServers[serverUrl];
    if (!server) {
      server = register(serverUrl);
    }
    if (Object.keys(statusPoll).length > 1) { //there is a live match
      server.status = 'live';
      server.matchInfo = statusPoll;
    } else { //there is no live match
      server.status = 'empty';
      server.matchInfo = undefined;
    }
    server.lastUpdate = Date.now();
    res.statusCode = 200;
    res.end();
  });
};

const register = function(serverUrl) {
  console.log('Registering new physics server at ' + serverUrl)
  physicsServers[serverUrl] = {status: 'empty'};
  const newServer = physicsServers[serverUrl];
  newServer.lastUpdate = Date.now();
  newServer.timeout = setInterval(function() {
    if (Date.now() - newServer.lastUpdate > 8000) {
      console.log(`Server at ${serverUrl} timed out.`);
      clearInterval(newServer.timeout);
      delete physicsServers[serverUrl];
    }
  }, 10 * 1000);
  return newServer;
};

console.log(`SocketManager listening on ${httpPort}`);