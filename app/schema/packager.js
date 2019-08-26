'use strict';

module.exports = {
  title: 'packager schema',
  type: 'object',
  properties: {
    version: {
      type: 'string',
      enum: [ 'infrared', 'gateway', 'common' ],
    }, // 版本号：需正则校验
    method: {
      type: 'string',
      enum: [ 'read', 'write', 'notify', 'reset', 'recovery' ],
    }, // 操作码
    groupId: {
      type: 'object',
      properties: {
        messageType: {
          type: 'string',
          enum: [ 'system', 'device', 'property', 'event' ],
        }, // 消息类型
        resourceId: {
          type: 'integer',
        }, // 资源值
      },
    }, // 组合功能点id
    data: {
      type: 'object',
      properties: {
        messageType: {
          type: 'string',
          enum: [ 'system', 'device', 'property', 'event' ],
        }, // 消息类型
        resourceId: {
          type: 'integer',
        }, // 资源值
      },
    }, //
  },
  required: [ 'version', 'method', 'data' ],
  additionalProperties: false,
};
