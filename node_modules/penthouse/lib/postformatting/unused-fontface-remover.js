"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = unusedFontfaceRemover;

var _cssTree = _interopRequireDefault(require("css-tree"));

var _debug = _interopRequireDefault(require("debug"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debuglog = (0, _debug.default)('penthouse:css-cleanup:unused-font-face-remover');

function decodeFontName(node) {
  let name = _cssTree.default.generate(node); // TODO: use string decode


  if (name[0] === '"' || name[0] === "'") {
    name = name.substr(1, name.length - 2);
  }

  return name;
}

function getAllFontNameValues(ast) {
  const fontNameValues = new Set();
  debuglog('getAllFontNameValues');

  _cssTree.default.walk(ast, {
    visit: 'Declaration',
    enter: function (node) {
      // walker pass through `font-family` declarations inside @font-face too
      // this condition filters them, to walk through declarations inside a rules only
      if (this.rule) {
        _cssTree.default.lexer.findDeclarationValueFragments(node, 'Type', 'family-name').forEach(entry => {
          const familyName = decodeFontName({
            type: 'Value',
            children: entry.nodes
          }).toLowerCase();

          if (!fontNameValues.has(familyName)) {
            debuglog('found used font-family: ' + familyName);
            fontNameValues.add(familyName);
          }
        });
      }
    }
  });

  debuglog('getAllFontNameValues AFTER');
  return fontNameValues;
}

function unusedFontfaceRemover(ast) {
  const fontNameValues = getAllFontNameValues(ast); // remove @font-face at-rule when:
  // - it's never unused
  // - has no a `src` descriptor

  _cssTree.default.walk(ast, {
    visit: 'Atrule',
    enter: (atrule, atruleItem, atruleList) => {
      if (_cssTree.default.keyword(atrule.name).basename !== 'font-face') {
        return;
      }

      let hasSrc = false;
      let used = true;

      _cssTree.default.walk(atrule, {
        visit: 'Declaration',
        enter: declaration => {
          const name = _cssTree.default.property(declaration.property).name;

          if (name === 'font-family') {
            const familyName = decodeFontName(declaration.value).toLowerCase(); // was this @font-face used?

            if (!fontNameValues.has(familyName)) {
              debuglog('drop unused @font-face: ' + familyName);
              used = false;
            }
          } else if (name === 'src') {
            hasSrc = true;
          }
        }
      });

      if (!used || !hasSrc) {
        if (used && !hasSrc) {
          debuglog('drop @font-face with no src descriptor');
        }

        atruleList.remove(atruleItem);
      }
    }
  });
}