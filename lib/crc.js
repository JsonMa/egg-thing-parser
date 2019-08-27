'use strict';

class CrC {

  getCrc16(buffer) {
    let crcIn = 0xFFFF;
    const poly = 0x1021;

    for (let i = 0; i < buffer.length; i++) {
      crcIn = (buffer[i] << 8) ^ crcIn; // eslint-disable-line
      for (let j = 0; j < 8; j++) {
        if (crcIn & 0x8000) { // eslint-disable-line
          crcIn = (crcIn << 1) ^ poly; // eslint-disable-line
        } else {
          crcIn = crcIn << 1; // eslint-disable-line
        }
      }
    }
    return crcIn & 0xffff; // eslint-disable-line
  }
}
module.exports = CrC;
