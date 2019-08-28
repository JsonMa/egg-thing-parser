'use strict';

const BaseTransfer = require('./baseTransfer');
const assert = require('assert');

/**
 * Boolean解析类
 *
 * @class BooleanParse
 * @extends {BaseTransfer}
 */
class BooleanParse extends BaseTransfer {
  /**
   *Creates an instance of BooleanParse.
   * @memberof BooleanParse
   */
  constructor() {
    super('BOOLEAN');
  }

  /**
   * value buffer => boolean
   *
   * @param {Buffer} binary   - buffer(v => 0/1)
   * @return {Boolean}        - boolean(true/false)
   * @memberof BooleanParse
   */
  binaryToType(binary) {
    assert(Buffer.isBuffer(binary), `[BooleanParse][binaryToType] - 类型错误binary: ${binary}`);
    assert(binary.length === 1, `[BooleanParse][binaryToType] - 长度非1字节，binary length: ${binary.length}`);

    const value = binary.readUInt8();
    assert([0, 1].includes(value), `[BooleanParse][binaryToType] - 数据未识别binary value: ${value}`);
    return !!value;
  }

  /**
   * boolean => tlv buffer
   *
   * @param {Boolean|Buffer} value - boolean | buffer value（0/1）
   * @return {Binary} - tlv buffer
   * @memberof BooleanParse
   */
  typeToBinary(value) {
    assert(typeof value === 'boolean', `[BooleanParse][typeToBinary] - 数据类型错误，需要为"boolean"，实际为：${typeof value}`);

    const valueBuffer = Buffer.alloc(1);
    valueBuffer.writeUInt8(Number(value));
    return valueBuffer;
  }
}

module.exports = BooleanParse;
