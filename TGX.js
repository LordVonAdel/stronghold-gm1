/**
 * Source of information about the format:
 * https://stronghold.fandom.com/wiki/TGX_file_format
 */

const TOKEN_STREAM      = 0b0000_0000;
const TOKEN_NEW_LINE    = 0b1000_0000;
const TOKEN_REPEAT      = 0b0100_0000;
const TOKEN_TRANSPARENT = 0b0010_0000;

const utils = require('./utils.js');

/**
 * Converts a tgx to png image
 * @param {Buffer} buffer Input buffer
 * @param {=Number} width If width is set, the header will be skipped
 * @param {=Number} height If height is set, the header will be skipped
 * @param {=Array} pallet If a pallete is given, all pixels are read as only 1 byte and the color will be looked up in the pallete.
 * @returns {Object}
 */
function tgxToImage(buffer, width = 0, height = 0, pallete = null) {
  let offset = 0;

  if (width == 0) {
    width = buffer.readUInt16LE(0);
    height = buffer.readUInt16LE(4);
    offset = 8;
  }

  let pixelData = Buffer.alloc(width * height * 4);

  let y = 0;
  let x = 0;
  while (offset < buffer.length) {
    let token = buffer[offset];
    let option = token & 0b1110_0000;
    let length = (token & 0b0001_1111) + 1;

    offset += 1;
    if (option == TOKEN_STREAM) {
      for (let i = 0; i < length; i++) {

        if (pallete) {
          setPixel(x, y, pallete[buffer[offset]]);
          offset += 1;
        } else {
          let color = utils.colorFromUShort(buffer.readUInt16LE(offset));
          setPixel(x, y, color);
          offset += 2;
        }

        x++;
      }
    } else if (option == TOKEN_NEW_LINE) {
      if (length != 1) throw new Error("Length in new-line token is not equal 0. Is this a token? The data may be corrupted or not in tgx format.");
      y++;
      x=0;
    } else if (option == TOKEN_REPEAT) {
      let color;

      if (pallete) {
        color = pallete[buffer[offset]];
        offset += 1;
      } else {
        color = utils.colorFromUShort(buffer.readUInt16LE(offset));
        offset += 2;
      }

      for (let i = 0; i < length; i++) {
        setPixel(x, y, color);
        x++;
      }
    } else if (option == TOKEN_TRANSPARENT) {
      x += length;
    } else {
      throw new Error("Unkown token type! Is the data not TGX or corrupted?")
    }

    if (x >= width && y >= height) {
      break;
    }

  }

  function setPixel(x, y, color) {
    let idx = (x + y * width) * 4;
    pixelData[idx] = color.r;
    pixelData[idx + 1] = color.g;
    pixelData[idx + 2] = color.b;
    pixelData[idx + 3] = color.a;
  }

  return {
    width,
    height,
    pixelData
  };

}

/**
 * Creates a buffer with an image in tgx format.
 * @param {Number} width Image width
 * @param {Height} height Image height
 * @param {Buffer} pixelData RGBA8888 pixel array
 * @returns {Buffer} tgx formatted data in a new buffer
 */
function createTgx(width, height, pixelData) {
  let tokensPerLine = Math.ceil(width / 32) + 1;
  let pixelBytesPerLine = width * 2;
  let size = 8 + (pixelBytesPerLine + tokensPerLine) * height;

  let buffer = Buffer.alloc(size);
  buffer.writeUInt16LE(width, 0);
  buffer.writeUInt16LE(height, 4);

  let offset = 8;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 32) {
      let length = Math.min(32, width - x);

      buffer[offset] = TOKEN_STREAM | (length - 1);
      offset ++;
      for (let i = 0; i < length; i++) {
        buffer.writeUInt16LE(getPixel(x + i, y), offset);
        offset += 2;
      }
    }
    buffer[offset] = TOKEN_NEW_LINE;
    offset++;
  }

  function getPixel(x, y) {
    let idx = (x + y * width) * 4;
    return utils.colorToUShort(
      pixelData[idx],
      pixelData[idx + 1],
      pixelData[idx + 2],
      pixelData[idx + 3]
    );
  }

  return buffer;
}

module.exports = {
  tgxToImage,
  createTgx
}