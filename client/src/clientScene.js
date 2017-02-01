const sceneUtility = require('./sceneUtility');
const socketUtility = require('./socketUtility');
const LevelBuilder = require('./levelBuilder');
const levelBuilder = new LevelBuilder();
const rendererBuilder = require('./rendererBuilder');
const cameraBuilder = require('./cameraBuilder');
const userProfile = require('./component/userProfile.js');

let serverUpdateTick;

const appendRenderer = function appendRenderer(renderer) {
  document.querySelector('#GameViewContainer').appendChild(renderer.domElement);
}

const init = function init(maxPlayers) {
  const camera = cameraBuilder.buildCamera();
  const renderer = rendererBuilder.buildRenderer();
  appendRenderer(renderer);
  let scene;
  let spawnPoints = levelBuilder.spawnPoints[userProfile.map]

  // build level
  if (maxPlayers === 0) {
    scene = levelBuilder.buildSandbox();
    spawnPoints = [levelBuilder.spawnPoints[1][1]];
  }
  else if (userProfile.map === 0) {
    scene = levelBuilder.buildFraggleRock();
  } else if (userProfile.map === 1) {
    scene = levelBuilder.buildDawnMountain();
  } else {
    scene = levelBuilder.buildHighNoon();
  }

  let owner = userProfile.User;
  let mapChoice = userProfile.map;

  return { camera, renderer, scene, spawnPoints, owner, maxPlayers, mapChoice };
};

const join = function join() {
  const camera = cameraBuilder.buildCamera();
  const renderer = rendererBuilder.buildRenderer();
  appendRenderer(renderer);
  const scene = levelBuilder.buildBlankLevel();
  return { camera, renderer, scene };
}

const startGame = function startGame(maxPlayers) {
  const game = init(maxPlayers); //creates camera, renderer and scene data
  sceneUtility.addLookControls(game.camera, socketUtility);
  const playerInput = sceneUtility.addMoveControls(game.camera, socketUtility);
  sceneUtility.addClickControls(socketUtility);
  sceneUtility.animate(game); //Renders screen to page and requests re-render at next animation frame
  socketUtility.requestNewMatch(game); //Request to the server to create a new match
};

const joinGame = function joinGame(matchUrl) {
  // load game of this matchNumber
  const game = join();
  sceneUtility.addLookControls(game.camera, socketUtility);
  const playerInput = sceneUtility.addMoveControls(game.camera, socketUtility);
  sceneUtility.addClickControls(socketUtility);
  sceneUtility.animate(game);
  socketUtility.joinMatch(matchUrl, game);
};

module.exports = { startGame, joinGame };
