const sass = require('node-sass');

/**
 Handles:

  nav {
    ul {
      background-color: ${bgCol};
      margin: ${margin}; // js variables
      padding: ${0}; // 'raw' values
      list-style: none;
    }
  }

*/

function babelPluginDemo({ types: t }) {
  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if (path.node.tag.name === "css") {
          let result = '';

          // Loop through all the quasis, and append the raw value to `result`
          for(let i in path.node.quasi.quasis) {
            result += path.node.quasi.quasis[i].value.raw;
            // if this is _not_ the last quasi, append a special placeholder sass comment
            // we need this because sass wont be able to sass-ify the expressions
            // we'll later replace the placeholder values with their originals
            if (!path.node.quasi.quasis[i].tail) {
              result += `#{"/*placeholder${i}*/"}`;
            }
          }

          // call sass on on the result
          let sassifiedStyles = sass.renderSync({
            data: result
          }).css.toString();

          // loop through all the expressions, and replace the placeholder values with their original expressions
          for(let j in path.node.quasi.expressions) {
            if(path.node.quasi.expressions[j].name) {
              // if an expression has a name, that means its a variable
              sassifiedStyles = sassifiedStyles.replace(`/*placeholder${j}*/`, '${'+ path.node.quasi.expressions[j].name +'}')
            } else {
              // if an expression doesnt have a name, that means its just a value
              sassifiedStyles = sassifiedStyles.replace(`/*placeholder${j}*/`, '${'+ path.node.quasi.expressions[j].value +'}')
            }
          }

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

module.exports = babelPluginDemo;
