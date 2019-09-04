'use strict';

module.exports = {
  title: 'packager schema',
  type: 'object',
  properties: {
    version: {
      type: 'string',
      pattern: '^[0-9]{1,2}(.0){2}',
    }, // 版本号：1.0.0
    method: {
      type: 'string',
      enum: [ 'read', 'write', 'notify', 'reset', 'recovery' ],
    }, // 操作码
    groupId: {
      type: 'integer',
    }, // 组合功能点数据
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          resourceId: {
            type: 'integer',
          }, // 资源值
          valueType: {
            type: 'string',
            enum: [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ],
          },
          value: {
            type: [ 'string', 'boolean', 'number' ],
          },
        },
        required: [ 'resourceId', 'valueType', 'value' ],
        additionalProperties: false,
      },
    }, // 普通功能点数据
  },
  required: [ 'version', 'method', 'data' ],
  additionalProperties: false,
};
