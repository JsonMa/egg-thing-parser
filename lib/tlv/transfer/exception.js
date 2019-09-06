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
    assert(Buffer.isBuffer(binary), `[ExceptionParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`);
    assert(binary.length === 4, `[ExceptionParse][binaryToType] - 数据错误，长度需为4字节，实际为: ${binary.length}`);

    const value = binary.readUInt32BE();
    return value.toString(2);
  }
}
module.exports = ExceptionParse;
