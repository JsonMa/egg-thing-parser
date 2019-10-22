'use strict';

module.exports = {
  title: 'packager schema',
  type: 'object',
  properties: {
    version: {
      type: 'string',
      pattern: '^[0-9]{1,2}(.0){2}',
    }, // 版本号：1.0.0
    id: {
      type: 'integer',
      minimum: 1, // 0x00000001
      maximum: 4294967295, // 0xffffffff
    },
    method: {
      type: 'string',
      enum: [ 'read', 'write', 'notify', 'reset', 'recovery' ],
    }, // 操作码
    groupId: {
      type: 'integer',
      maximum: 65535, // 0xffff
      minimum: 512, // 001 00 00000000000b
    }, // 组合功能点数据
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          resourceId: {
            type: 'integer',
            maximum: 65535, // 0xffff
            minimum: 512, // 001 00 00000000000b
          }, // 资源值
          valueType: {
            type: 'string',
            enum: [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ],
          },
          value: {
            type: [ 'string', 'boolean', 'number' ],
          },
        },
        required: [ 'resourceId' ],
        additionalProperties: false,
      },
    }, // 普通功能点数据
  },
  required: [ 'version', 'method', 'data' ],
  additionalProperties: false,
};
