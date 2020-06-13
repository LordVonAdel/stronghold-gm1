const fs = require("fs");
const TGX = require("./TGX.js");

const PNG = require('pngjs').PNG;

/*
fs.readFile("./test/frontend_loading.tgx", (err, data) => {
  if (err) console.error(err)

  let image = TGX.tgxToImage(data);
  let png = new PNG({
    width: image.width,
    height: image.height,
  });

  png.data[0] = 0;
  image.pixelData.copy(png.data);

  png.pack().pipe(fs.createWriteStream("test/test.png"));

});
*/

fs.createReadStream("test/test.png").pipe(
  new PNG({
    filterType: 4,
  })
).on("parsed", function () {
  let tgx = TGX.createTgx(this.width, this.height, this.data);
  fs.writeFile("test/frontend_loading.tgx", tgx, () => {});
});
