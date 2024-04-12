"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cleanup;

var _debug = _interopRequireDefault(require("debug"));

var _commentRemover = _interopRequireDefault(require("./comment-remover"));

var _embeddedBase64Remover = _interopRequireDefault(require("./embedded-base64-remover"));

var _unusedKeyframeRemover = _interopRequireDefault(require("./unused-keyframe-remover"));

var _unusedFontfaceRemover = _interopRequireDefault(require("./unused-fontface-remover"));

var _unwantedPropertiesRemover = _interopRequireDefault(require("./unwanted-properties-remover"));

var _ruleSelectorRemover = _interopRequireDefault(require("./rule-selector-remover"));

var _finalRuleRemover = _interopRequireDefault(require("./final-rule-remover"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debuglog = (0, _debug.default)('penthouse:css-cleanup'); // NOTE: mutates the ast

function cleanup({
  ast,
  selectorNodeMap,
  criticalSelectors,
  propertiesToRemove,
  maxEmbeddedBase64Length
}) {
  debuglog('start');
  (0, _commentRemover.default)(ast);
  debuglog('commentRemover');
  (0, _ruleSelectorRemover.default)(ast, selectorNodeMap, criticalSelectors);
  debuglog('ruleSelectorRemover');
  (0, _unusedKeyframeRemover.default)(ast);
  debuglog('unusedKeyframeRemover'); // remove data-uris that are too long

  (0, _embeddedBase64Remover.default)(ast, maxEmbeddedBase64Length);
  debuglog('embeddedbase64Remover'); // remove bad and unused @fontface rules

  (0, _unusedFontfaceRemover.default)(ast);
  debuglog('unusedFontFaceRemover'); // remove irrelevant css properties via rule walking

  (0, _unwantedPropertiesRemover.default)(ast, propertiesToRemove);
  debuglog('propertiesToRemove'); // remove empty and unwanted rules and at-rules

  (0, _finalRuleRemover.default)(ast);
  debuglog('finalRuleRemover');
}