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
```js

// tlv数据解析：thing.tlv.parser

// 输入参数
0x10 0x01 0x02 0x01 0x02 0x00 0x00... // 十六进制Buffer 

// 输出参数
{
  "method": "read", // 枚举值 - ['read', 'write', 'notify', 'reset', 'recovery', 'resp']
  "params": {
    "property": {
      "1": {
        "value": "xxxx",
        "time": "xxxxx",
        "type": "boolean",// 数据类型 - ['boolean', 'enum', 'integer', 'float', 'buffer', 'string', 'exception']
        "resource": "common" // 资源类型 - ['common', 'static', 'combine']
      },
    },
    "event": {
      "2": {
        "value": "xxxx",
        "time": "xxxxx",
        "type": "boolean",// 数据类型 - ['boolean', 'enum', 'integer', 'float', 'buffer', 'string', 'exception']
        "resource": "common" // 资源类型 - ['common', 'static', 'combine']
      }
    },
    "device": {
      ...
    },
    "system": {
      ...
    }
  }
}
```

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
