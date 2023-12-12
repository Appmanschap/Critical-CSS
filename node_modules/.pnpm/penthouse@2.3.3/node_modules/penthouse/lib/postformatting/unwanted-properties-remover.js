"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = unwantedPropertiesRemover;

var _cssTree = _interopRequireDefault(require("css-tree"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function unwantedPropertiesRemover(ast, propertiesToRemove) {
  const propertiesToRemoveRegexes = propertiesToRemove.map(text => new RegExp(text));

  _cssTree.default.walk(ast, {
    visit: 'Declaration',
    enter: (declaration, item, list) => {
      const shouldRemove = propertiesToRemoveRegexes.some(pattern => pattern.test(declaration.property));

      if (shouldRemove) {
        list.remove(item);
      }
    }
  });
}