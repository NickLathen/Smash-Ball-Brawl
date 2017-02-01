'use strict';
const express = require('express');
const request = require('request');
const socketManager = process.env.SOCKET_MANAGER || '127.0.0.1';
const socketManagerPort = 4444;

const router = express.Router();

router.route('/liveGames')
  .get((req, res) => {
    request(`http://${socketManager}:${socketManagerPort}/liveGames`, function(error, response, body) {
      res.send(body);
    });
  });
module.exports = router;