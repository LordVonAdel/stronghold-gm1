# Stronghold GM1
This module can read GM1 and TGX files, used in the games Stronghold and Stronghold Crusader.
More information about GM1 can be found here: https://stronghold.fandom.com/wiki/GM1_file_format

## TGX to PNG
This example converts a TGX file to a PNG:
```js
fs.readFile("frontend_loading.tgx", (err, data) => {
  if (err) console.error(err)

  // Returns an image object
  let image = TGX.tgxToImage(data);

  let png = new PNG({
    width: image.width,
    height: image.height,
  });

  png.data[0] = 0;
  image.pixelData.copy(png.data);

  png.pack().pipe(fs.createWriteStream("frontend_loading.png"));
});
```

## PNG to TGX
This example converts a PNG file to a TGX:
```js
fs.createReadStream("frontend_loading.png").pipe(
  new PNG({
    filterType: 4,
  })
).on("parsed", function () {
  // TGX.createTgx returns a buffer with the content of a TGX file. The data attribute is an array with 4 entries per pixel. RGB and Alpha from 0 to 255.
  let tgx = TGX.createTgx(this.width, this.height, this.data);
  fs.writeFile("frontend_loading.tgx", tgx, () => {});
});
```

## Image object
An image object is structured like this:
```js
{
  width: Number,
  height: Number,
  pixelData: Array // RGBA8888
}
```

## Getting images out of a GM1 file
```js
fs.readFile(filename, (err, data) => {
  let gm1 = new GM1();
  gm1.import(data);

  gm1.savePalletsPNG('out/pallets.png');

  for (let i = 0; i < gm1.images.length; i++) {
    gm1.savePNG(i, "out/image_" + i + ".png");
  }
});
```
