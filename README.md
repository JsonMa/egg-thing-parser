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
  package: 'egg-thing-parser',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.thingParser = {
};
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
  time: "xxxxxx", // 时间戳
  data: {
    method: "notify", // 枚举值 - ['read', 'write', 'notify', 'reset', 'recovery', 'resp']
    groupId: 3, // 组合功能点Id
    params: {
      3: {
        value: {
          1： {
            value: "xxxx",
            type: "boolean", // 数据类型 - ['boolean', 'enum', 'integer', 'float', 'buffer', 'string', 'exception']
            resource: "common", // 资源类型 - ['common', 'static', 'combine']
            message: "property" // 消息类型 - ['property', 'device', 'event', 'system']
          }
        },
        type: "buffer", // 数据类型 - ['boolean', 'enum', 'integer', 'float', 'buffer', 'string', 'exception']
        resource: "combine", // 资源类型 - ['common', 'static', 'combine']
        message: "property" // 消息类型 - ['property', 'device', 'event', 'system']
      },
      2: {
        value: "xxxx",
        type: "boolean", // 数据类型 - ['boolean', 'enum', 'integer', 'float', 'buffer', 'string', 'exception']
        resource: "static", // 资源类型 - ['common', 'static', 'combine']
        message: "property" // 消息类型 - ['property', 'device', 'event', 'system']
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
  method: 'read', // 操作码 [ 'read', 'write', 'notify', 'reset', 'recovery' ]
  groupId: 123, // 组合功能点值
  data: [{
      resourceId: 2222, // 普通功能点值
      valueType: 'string', // 数据类型 [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ]
      value: 'asdf'
    } // 普通功能点数据
  ]
  // required: [ 'version', 'method', 'data' ],
}
```

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
