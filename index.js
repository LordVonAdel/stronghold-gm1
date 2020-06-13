const fs = require('fs');
const GM1 = require('./GM1.js');

//let filename = "./test/body_arab_slave.gm1";//process.argv[2];
let filename = "./test/tile_buildings2.gm1";
//let filename = "./test/mini_cursors.gm1";

fs.readFile(filename, (err, data) => {
  let gm1 = new GM1();
  gm1.import(data);

  gm1.savePalletsPNG('out/pallets.png');

  for (let i = 20; i < 30; i++) {
    gm1.savePNG(i, "out/image_" + i + ".png");
  }
});

module.exports = GM1;