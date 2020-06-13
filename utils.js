module.exports = {
  /**
   * Converts a 2 byte uint to a color
   * @param {Number} number Little-Endian formatted 16 byte number
   */
  colorFromUShort(number) {
    /**
     * https://stronghold.fandom.com/wiki/TGX_file_format#Pixel_Data
     *
     * pure-red:    01111100-00000000(7C00) (r255 g0 b0)
     * pure-green:  00000011-11100000(03E0) (r0 g255 b0)
     * pure-blue:   00000000-00011111(001F) (r0 g0 b255)
     */

    return {
      r: Math.round((number & 0x7C00) >> 7),
      g: Math.round((number & 0x03E0) >> 2),
      b: Math.round((number & 0x001F) << 3),
      a: number & 0x8000 ? 255 : 0
    }
    
  },

  /**
   * Generates a 16 bit LE number. This conversion is lossy. Only the 5 MS-bits of every color are used.
   * @param {Number} r Red value (0-255)
   * @param {Number} g Red value (0-255)
   * @param {Number} b Red value (0-255)
   * @param {Number} a Alpha value (0-255)
   * @param {Number} alpha_test alpha test (0-255). Transparency is binary, every alpha under this value will be fully transparent.
   * @returns {Number} TGX color value (Little-Endian)
   */
  colorToUShort(r, g, b, a, alpha_test = 100) {
    return  ((r & 0b11111000) << 7)
          | ((g & 0b11111000) << 2)
          | ((b & 0b11111000) >> 3)
          | ((a < alpha_test) ? 0 : (1 << 15))
  }
}