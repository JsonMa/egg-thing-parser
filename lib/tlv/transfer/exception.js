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
    assert(binary.length === 4, `[ExceptionParse][binaryToType] - 长度非4字节，binary length: ${binary.length}`);

    const value = binary.readUInt32BE();
    return value.toString(2);
  }
}
module.exports = ExceptionParse;
