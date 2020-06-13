/**
 * Based on information from 
 * https://stronghold.fandom.com/wiki/GM1_file_format, https://stronghold.fandom.com/wiki/TGX_file_format
 * and https://github.com/sourcehold/Sourcehold/wiki/Gm1-file
 */

/**
 * Works with:
 * - interface
 * - font
 * - compressed image
 * - animation
 * not tested with:
 * - tilesets
 * - uncompressed image
 * - 0x07
 */

const PNG = require('pngjs').PNG;
const fs = require('fs');

const Utils = require('./utils.js');
const TGX = require('./TGX.js');

const PALLETE_NUMBER = 10;
const PALLETE_SIZE = 256;

const TYPE_INTERFACE = 1;
const TYPE_ANIMATIONS = 2;
const TYPE_BUILDINGS_TILES = 3;
const TYPE_FONT = 4;
const TYPE_UNCOMPRESSED = 5;
const TYPE_COMPRESSED = 6;
const TYPE_7 = 7;

class GM1 {

  constructor() {
    this.pallets = [];

    this.images = [];
    this.type = null;
    this.size = 0;
  }

  /**
   * Imports a GM1 formatted buffer and places its result in this instance.
   * @param {Buffer} data Data to import
   */
  import(data) {
    let number = data.readUInt32LE(12);
    this.type = data.readUInt32LE(20);
    this.size = data.readUInt32LE(80);

    const index_palette = 88;
    const index_offset_list = index_palette + 5120;
    const index_sizes_list = index_offset_list + number * 4;
    const index_headers = index_sizes_list + number * 4;
    const index_images = index_headers + number * 16;

    let offsets = [];
    let sizes = [];
    let headers = [];

    for (let i = 0; i < number; i++) {
      offsets.push(data.readUInt32LE(index_offset_list + i * 4));
      sizes.push(data.readUInt32LE(index_sizes_list + i * 4));
      headers.push(this.readImageHeader(data, index_headers + i * 16));
    }

    for (let i = 0; i < PALLETE_NUMBER; i++) {
      this.pallets[i] = [];
      for (let j = 0; j < PALLETE_SIZE; j++) {
        this.pallets[i][j] = Utils.colorFromUShort(data.readUInt16LE(88 + j * 2 + i * 512));
      }
    }

    if (this.type == TYPE_ANIMATIONS) {
      for (let i = 0; i < number; i++) {
        let header = headers[i];
        let offset = offsets[i] + index_images;
        this.images[i] = TGX.tgxToImage(data.slice(offset, offset + sizes[i]), header.width, header.height, this.pallets[header.color]);
      }
    } else if (this.type == TYPE_BUILDINGS_TILES) {
      for (let i = 0; i < number; i++) {
        let header = headers[i];

        if (header.imagePart == 0) {
          let offset = offsets[i] + index_images;
          this.images.push(this.readTile(data.slice(offset, offset + sizes[i]), headers[i]));
          i += header.subParts;
        }

      }
    } else if (this.type == TYPE_INTERFACE || this.type == TYPE_FONT || this.type == TYPE_COMPRESSED) {
      for (let i = 0; i < number; i++) {
        let header = headers[i];
        let offset = offsets[i] + index_images;
        this.images[i] = TGX.tgxToImage(data.slice(offset, offset + sizes[i]), header.width, header.height);
      }
    } else if (this.type == TYPE_UNCOMPRESSED || this.type == TYPE_7) {

    } else {
      throw new Error("Unkown GM1 Type. Is this GM1 data?");
    }
    
  }

  readImageHeader(buffer, offset) {
    return {
      width: buffer.readUInt16LE(offset),
      height: buffer.readUInt16LE(offset + 2),
      widthOffset: buffer.readUInt16LE(offset + 4),
      heightOffset: buffer.readUInt16LE(offset + 6),
      imagePart: buffer.readUInt8(offset + 8),
      subParts: buffer.readUInt8(offset + 9),
      tileOffset: buffer.readUInt16LE(offset + 10),
      direction: buffer.readUInt8(offset + 12),
      horizontalOffset: buffer.readUInt8(offset + 13),
      buildingWidth: buffer.readUInt8(offset + 14),
      color: buffer.readUInt8(offset + 15)
    }
  }

  readTile(buffer, header) {
    let tilesW = header.width / 30;
    let tilesTotal = tilesW * tilesW;

    let tileParts = [];
    for (let i = 0; i < tilesTotal; i++) {
      tileParts.push(this.readTilePart(buffer.slice(i * 512)));
    }

    /*return {
      width: 30,
      height: 16,
      pixelData: this.readTilePart(buffer)
    };*/
  
    let overlay = TGX.tgxToImage(buffer.slice(512 * tilesTotal), header.width, header.height);
    return overlay;

    return {
      width: header.width,
      height: header.height,
      pixelData: data
    };
  }

  readTilePart(buffer) {
    const pixelsPerRow = [2, 6, 10, 14, 18, 22, 26, 30, 30, 26, 22, 18, 14, 10, 6, 2];

    let data = Buffer.alloc(30*16*4);

    let i = 0;
    for (let y = 0; y < pixelsPerRow.length; y++) {
      let row = pixelsPerRow[y];
      for (let col = 0; col < row; col++) {
        let x = 15 + col - row / 2;
        let pixel = Utils.colorFromUShort(buffer.readUInt16LE(i * 2));
        let idx = (x + y * 30) * 4;
        data[idx] =     Math.round(pixel.b);
        data[idx + 1] = Math.round(pixel.g);
        data[idx + 2] = Math.round(pixel.r);
        data[idx + 3] = 255;
        i++;
      }
    }

    return data;
  }

  savePalletsPNG(path) {
    let image = new PNG({
      width: 256,
      height: 10,
    });

    for (let i = 0; i < PALLETE_SIZE; i++) {
      for (let j = 0; j < PALLETE_NUMBER; j++) {
        image.data[(i+j*256) * 4] = this.pallets[j][i].r;
        image.data[(i+j*256) * 4 + 1] = this.pallets[j][i].g;
        image.data[(i+j*256) * 4 + 2] = this.pallets[j][i].b;
        image.data[(i+j*256) * 4 + 3] = this.pallets[j][i].a;
      }
    }
    image.pack().pipe(fs.createWriteStream(path));
  }

  savePNG(index, path) {
    if (index > this.number || index < 0) throw new Error("Image with that index does not exists! Please specify a number between 0 and " + this.number+".");
    let image = this.images[index];

    let png = new PNG({
      width: image.width,
      height: image.height
    });

    png.data[0] = 0;
    image.pixelData.copy(png.data);
    
    png.pack().pipe(fs.createWriteStream(path));
  }

}

function RGB(number) {
  return {
    r: Math.round((number & 0x7C00) << 7),
    g: Math.round((number & 0x03E0) >> 2),
    b: Math.round((number & 0x001F) << 3)
  }
}

module.exports = GM1;