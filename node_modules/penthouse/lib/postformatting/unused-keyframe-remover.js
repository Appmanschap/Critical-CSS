"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = unusedKeyframeRemover;

var _cssTree = _interopRequireDefault(require("css-tree"));

var _debug = _interopRequireDefault(require("debug"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debuglog = (0, _debug.default)('penthouse:css-cleanup:unused-keyframe-remover');

function getAllKeyframes(ast) {
  return new Set(_cssTree.default.lexer.findAllFragments(ast, 'Type', 'keyframes-name').map(entry => {
    const keyframeName = _cssTree.default.generate(entry.nodes.first());

    debuglog('found used keyframe animation: ' + keyframeName);
    return keyframeName;
  }));
}

function unusedKeyframeRemover(ast) {
  debuglog('getAllAnimationKeyframes');
  const usedKeyFrames = getAllKeyframes(ast);
  debuglog('getAllAnimationKeyframes AFTER, usedKeyFrames: ' + usedKeyFrames.size); // remove all unused keyframes

  _cssTree.default.walk(ast, {
    visit: 'Atrule',
    enter: (atrule, item, list) => {
      const keyword = _cssTree.default.keyword(atrule.name);

      if (keyword.basename === 'keyframes') {
        const keyframeName = _cssTree.default.generate(atrule.prelude);

        if (!usedKeyFrames.has(keyframeName)) {
          debuglog(`drop unused @${keyword.name}: ${keyframeName}`);
          list.remove(item);
        }
      }
    }
  });
}