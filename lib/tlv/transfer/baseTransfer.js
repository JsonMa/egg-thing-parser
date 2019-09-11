'use strict';

const CONVERT = [ 'BOOLEAN', 'ENUM', 'INTEGER', 'FLOAT', 'BUFFER', 'EXCEPTION', 'STRING', 'JSON' ];
/**
 * @class FormatService
 */
class Processor {
  /**
   * Creates an instance of ParseService.
   *
   * @param {string} index - parser类型
   * @memberof ParseService
   */
  constructor(index) {
    this.index = index;
  }

  /**
   * 数据封装
   *
   * @param {Buffer} data         - buffer数据
   * @param {Number} type         - 固定类型
   * @param {Number} length       - 固定长度
   * @return {Buffer} tlv package
   */
  package(data, type = 1, length = 2) {
    let {
      index,
      value,
    } = data;
    const fixedLength = type + length; // tl buffer 长度
    const dataLength = value.length; // 数据 buffer 长度

    index = CONVERT.indexOf(index);
    if (index < 0) throw new Error('解析类型不存在');
    const dataType = index + 1;
    const fixedBuffer = Buffer.alloc(fixedLength);
    fixedBuffer.writeIntLE(dataType, 0, type); // 0-1字节写入数据类型
    fixedBuffer.writeIntLE(dataLength, type, length); // 1-2字节写入数据长度
    return Buffer.concat([ fixedBuffer, value ], fixedLength + dataLength);
  }

  /**
   * 数据解析
   *
   * @todo
   * @param {*} data
   * @memberof Processor
   */
  parse(data) {
    // TODO
  }
}

module.exports = Processor;
