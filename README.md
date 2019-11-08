# egg-thing-parser

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-thing-parser.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-thing-parser
[travis-image]: https://img.shields.io/travis/eggjs/egg-thing-parser.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-thing-parser
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-thing-parser.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-thing-parser?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-thing-parser.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-thing-parser
[snyk-image]: https://snyk.io/test/npm/egg-thing-parser/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-thing-parser
[download-image]: https://img.shields.io/npm/dm/egg-thing-parser.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-thing-parser

<!--
Description here.
-->

## Install

```bash
$ npm i egg-thing-parser --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.thingParser = {
  enable: true,
  package: 'egg-thing-parser'
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.thingParser = {};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

### 数据解析

```javascript
// TLV数据解析：app.thing.tlv.parser.parse(buffer)
// 输入:Buffer
// 输出:
{
  version: "1.0.0",
  id：xxxx, // 消息id，4字节无符号整数
  operations: {
    code: xxxx, // 操作码，1字节无符号整数
    operation: 'response', // 操作类型 'request','response'
    type: 'device', // 设备类型 'device'-普通设备,'subDevice'-子设备
    target: 'resource', // 操作对象 'resource'-资源,'system'-系统
    method：'read', // 操作名 'read', 'write', 'notify', 'reset', 'recovery', 'register', 'deregister','enable','disable','label','upgrade','online','offline'
  }, // 操作码信息
  code: xxxx, // 响应码，1字节无符号整数
  time: "xxxxxx", // 时间戳（插件注入，非设备上报）
  data: {
    groupId: 3, // 组合功能点Id
    params: {
      3: {
        value: {
          1： {
            value: "xxxx",
            type: "boolean", // 数据类型 - ['boolean', 'enum', 'integer', 'float', 'buffer', 'string', 'exception']
            resource: "common", // 资源类型 - ['common'-普通, 'static'-固定, 'combine'-组合]
            message: "property" // 功能点类型 - ['property'-属性, 'event'-事件, 'reserve'-保留字段, 'custom'-自定义]
          }
        },
        type: "buffer",
        resource: "combine",
        message: "property",
      },
      2: {
        value: "xxxx",
        type: "boolean",
        resource: "static",
        message: "property",
      }
    }
  }
}
```

### 数据封装

```javascript
// TLV数据封装: app.thing.tlv.packager.package(json)
// 输出：Buffer
// 输入：
{
  version: '1.0.0', // 版本号：1.0.0
  id: xxxx, // 消息id，4字节无符号整数
  operations: {
    code: xxxx, // 操作码，1字节无符号整数（当code存在时，code的值即为操作码值，否则需要通过method、target、type和operation共同计算出操作码）
    operation: 'response', // 操作类型 'request','response'
    type: 'device', // 设备类型 'device','subDevice'
    target: 'resource', // 操作对象 'resource','system'
    method：'read', // 操作名 'read', 'write', 'notify', 'reset', 'recovery', 'register', 'deregister','enable','disable','label','upgrade','online','offline'
  }, // 操作码信息
  code: xxxx, // 响应码，1字节无符号整数(operation为response时必须传)
  data: {
     groupId: xxxx, // 组合功能点id，2字节无符号整数（当groupId存在时，data为其包含的子功能点数据）
     params: [{
      functionId: xxxx, // 功能点id，2字节无符号整数
      valueType: 'string', // 数据类型 [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ]
      value: 'asdf'
    }], // 当method为read且operation为request时，只需传functionId即可
  }
}
```

## Questions & Suggestions

Please open an issue [here](https://github.com/jsonma/egg-thing-parser/issues).

## License

[MIT](LICENSE)
