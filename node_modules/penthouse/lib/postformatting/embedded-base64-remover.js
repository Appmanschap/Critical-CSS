"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = embeddedbase64Remover;

var _cssTree = _interopRequireDefault(require("css-tree"));

var _debug = _interopRequireDefault(require("debug"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debuglog = (0, _debug.default)('penthouse:css-cleanup:embeddedbase64Remover');
const BASE64_ENCODE_PATTERN = /data:[^,]*;base64,/;

function embeddedbase64Remover(ast, maxEmbeddedBase64Length) {
  debuglog('config: maxEmbeddedBase64Length = ' + maxEmbeddedBase64Length);

  _cssTree.default.walk(ast, {
    visit: 'Declaration',
    enter: (declaration, item, list) => {
      let tooLong = false;

      _cssTree.default.walk(declaration, {
        visit: 'Url',
        enter: function (url) {
          const value = url.value.value;

          if (BASE64_ENCODE_PATTERN.test(value) && value.length > maxEmbeddedBase64Length) {
            tooLong = true;
          }
        }
      });

      if (tooLong) {
        const value = _cssTree.default.generate(declaration.value);

        debuglog('DROP: ' + `${declaration.property}: ${value.slice(0, 50)}..., (${value.length} chars)`);
        list.remove(item);
      }
    }
  });
}