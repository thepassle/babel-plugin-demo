const sass = require('node-sass');

function babelPluginHTMLImport({ types: t }) {
  return {
    visitor: {
      TaggedTemplateExpression(path, { opts = {} }) {
        if (path.node.tag.name === "css") {
          // `quasis` is an array of objects, so we naively concatenate them together
          const styleStrings = path.node.quasi.quasis.map(quasi => quasi.value.raw).join('')

          // Now that we have all our styles into a single string, we can run Sass against it, and stringify if again
          const sassifiedStyles = sass.renderSync({
            data: styleStrings
          }).css.toString();

          // And finally, we replace the original value of the node, with the sassified result
          path.node.quasi.quasis = [t.templateElement({
            cooked: sassifiedStyles,
            raw: sassifiedStyles
          }, true)];
        }
      }
    }
  };
}

module.exports = babelPluginHTMLImport;
