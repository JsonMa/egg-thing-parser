'use strict';

const BaseTransfer = require('./baseTransfer');
const assert = require('assert');

/**
 * Exception解析
 *
 * @class ExceptionParse
 * @extends {BaseTransfer}
 */
class ExceptionParse extends BaseTransfer {
  /**
   *Creates an instance of ExceptionParse.
   * @memberof ExceptionParse
   */
  constructor() {
    super('EXCEPTION');
  }

  /**
   * exception buffer => exception value
   *
   * @param {Buffer} binary - buffer
   * @return {Array} array value
   * @memberof ExceptionParse
   */
  binaryToType(binary) {
    assert(Buffer.isBuffer(binary), `[ExceptionParse][binaryToType] - 类型错误binary: ${binary}`);
    assert(binary.length === 8, `[ExceptionParse][binaryToType] - 长度非8字节，binary length: ${binary.length}`);

    const index = [];
    for (let offset = 0; offset < binary.length; offset++) {
      const value = binary.readUInt8(offset);
      const str = value.toString(2);

      for (let i = str.length - 1; i >= 0; i--) {
        if (parseInt(str[i]) === 1) {
          index.push(((str.length - i - 1) + offset * 8));
        }
      }
    }
    return index.toString();
  }
}
module.exports = ExceptionParse;
