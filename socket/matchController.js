"use strict";
let liveMatch;
const Match = require('./match.js');

const deleteMatch = function deleteMatch() {
  liveMatch.shutdown();
  liveMatch = undefined;
};

module.exports = {
  getNewMatch: function getNewMatch() {
    let match = new Match(deleteMatch);
    liveMatch = match;
    return liveMatch;
  },
  getMatch: function getMatch() {
    return liveMatch;
  },
  deleteMatch: deleteMatch,
};

