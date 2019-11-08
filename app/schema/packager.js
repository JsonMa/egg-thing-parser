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
      minimum: 1,
      maximum: 0xffffffff,
    },
    operations: {
      type: 'object',
      properties: {
        code: {
          type: 'integer',
          minimum: 0,
          maximum: 255,
        }, // 操作码
        method: {
          type: 'string',
          enum: [
            'read',
            'write',
            'notify',
            'reset',
            'recovery',
            'register',
            'deregister',
            'enable',
            'disable',
            'label',
            'upgrade',
            'online',
            'offline',
          ],
        },
        target: {
          type: 'string',
          enum: [ 'resource', 'system' ],
        },
        type: {
          type: 'string',
          enum: [ 'device', 'subDevice' ],
        },
        operation: {
          type: 'string',
          enum: [ 'request', 'response' ],
        },
        additionalProperties: false,
      },
    },
    code: {
      type: 'integer',
      minimum: 0,
      maximum: 255,
    }, // 响应码
    data: {
      type: 'object',
      properties: {
        groupId: {
          type: 'integer',
          maximum: 65535, // 0xffff
          minimum: 512, // 001 00 00000000000b
        }, // 组合功能点id
        params: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              functionId: {
                type: 'integer',
                minimum: 512, // 001 00 00000000000b
                maximum: 0xffff,
              }, // 普通功能点id
              valueType: {
                type: 'string',
                enum: [
                  'boolean',
                  'enum',
                  'integer',
                  'float',
                  'buffer',
                  'exception',
                  'string',
                ],
              },
              value: {
                type: [ 'string', 'boolean', 'number', 'object' ],
              },
            },
            required: [ 'functionId' ],
            additionalProperties: false,
          },
        },
      },
      required: [ 'params' ],
      additionalProperties: false,
    },
  },
  required: [ 'version', 'operations' ],
  additionalProperties: false,
};
