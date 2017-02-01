const THREE = require('three');
const objectBuilder = require('./objectBuilder');
const userProfile = require('./component/userProfile');

const random = function random(low, high) {
  return (Math.random() * (high - low + 1)) + low;
}

//FLOOR BLOCKS
const addGrassBlock = function addGrassBlock(x, y, z, width, height, depth, scene) {
  depth = depth || width;
  height = height || width;

  let mesh = objectBuilder.grassFloor({width: width, height: height, depth: depth},
    {x: x, y: y, z: z});
  scene.add(mesh);
};
const addRockBlock = function addRockBlock(x, y, z, width, height, depth, scene) {
  depth = depth || width;
  height = height || width;

  let mesh = objectBuilder.rockFloor({width: width, height: height, depth: depth},
    {x: x, y: y, z: z});
  scene.add(mesh);
};
const addRockCenter = function addRockCenter(width, height, depth, x, y, z, scene) {
  let mesh = objectBuilder.rockFloor({width: width, height: height, depth: depth},
    {x: x, y: y, z: z});
  scene.add(mesh);
};


module.exports = {
  sunlight: function sunlight(x, y, z, intensity) {
    let sun = new THREE.DirectionalLight();
    sun.position.set(x, y, z);
    sun.intensity = intensity;

    if (userProfile.graphics > 0) {
      sun.castShadow = true;
      sun.shadow.mapSize.x = sun.shadow.mapSize.y = 512 + 512 * userProfile.graphics;

      sun.shadow.camera.near = 10;
      sun.shadow.camera.far = 400;
      sun.shadow.camera.left = -200;
      sun.shadow.camera.right = 200;
      sun.shadow.camera.top = 200;
      sun.shadow.camera.bottom = -200;

    } else {
      sun.castShadow = false;
    }

    return sun;
  },

  // buildFloor(A, B, y, width, height, depth) builds square grass floor of A by A with a rock center of B by B, at y height.
    // Blocks will be width x height x depth;
  buildFloor: function buildFloor(A, B, fx, fy, fz, width, height, depth, scene) {
    let block = addGrassBlock;

    depth = depth || width;
    height = height || 6;

    if (A <= B) {
      addRockCenter(B * width, height, B * depth, fx, fy, fz, scene);
      return;
    }

    for (let x = 0; x < A + 1; x++) {
      block((-A / 2 + x) * width + fx, fy, -A * depth / 2 + fz, width, height, depth, scene);
    }
    for (let z = 1; z < A + 1; z++) {
      block(A * width / 2 + fx, fy, (-A / 2 + z) * depth + fz, width, height, depth, scene)
    }
    for (let x = 1; x < A + 1; x++) {
      block((A / 2 - x) * width + fx, fy, A * depth / 2 + fz, width, height, depth, scene);
    }
    for (let z = 1; z < A; z++) {
      block(-A * width / 2 + fx, fy, (A / 2 - z) * depth + fz, width, height, depth, scene)
    }

    if (A >= 2) {
      buildFloor(A-2, B, fx, fy, fz, width, height, depth, scene);
    }
  },

  //randomCrateGen(n, a, b, fx, fy, fz, r)
  //builds n crates of size a to b at fx, fy, fz with r random variance in fx and fz
  randomCrateGen: function randomCrateGen (n, a, b, fx, fy, fz, r, scene) {
    for (var i = 0; i < n + 1; i++) {
      const types = ['metalCrate', 'questionCrate', 'woodCrate', 'ancientCrate'];
      const size = random(a, b);
      const x = random(fx - r, fx + r);
      const y = fy + i * 10;
      const z = random(fz - r, fz + r);
      const type = Math.floor(random(0, types.length - 1));
      let mesh = objectBuilder[types[type]]({width: size, height: size, depth: size}, {x, y, z});
      scene.add(mesh);
    }
  }
}
