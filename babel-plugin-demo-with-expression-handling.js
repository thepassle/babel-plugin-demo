const sass = require('node-sass');

/**
Handles:

const padding = 0;
const textCol = "black";

class MyDemo extends LitElement {
  static get styles() {
    return css`
      $base-color: #c6538c;
      $border-dark: rgba($base-color, 0.88);

      .alert {
        border: 1px solid $border-dark;
      }

      nav {
        ul {
          ${mixin()}
          background-color: ${"red"};
          margin: ${0};
          padding: ${padding};
          list-style: none;
        }
      }
    `;
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
              const isCallExpression = path.node.quasi.expressions[i].type === 'CallExpression';
              if(isCallExpression) {
                // use a different placeholder if its a function, or a 'mixin' function, Sass requires it to be valid CSS
                result += `color: var(__PLACEHOLDER${i});`;
              } else {
                result += `#{"/*placeholder${i}*/"}`;
              }
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

              const isString = path.node.quasi.expressions[j].type === 'StringLiteral';
              const isCallExpression = path.node.quasi.expressions[j].type === 'CallExpression';
              if(isString) {
                // if the expression is a string, we have to handle that
                sassifiedStyles = sassifiedStyles.replace(`/*placeholder${j}*/`, '${'+ path.node.quasi.expressions[j].extra.raw +'}')
              } else if (isCallExpression){
                // if the expression is a function, we want to call it
                sassifiedStyles = sassifiedStyles.replace(`color: var(__PLACEHOLDER${j});`, '${'+ path.node.quasi.expressions[j].callee.name +'()}')
              } else {
                // if the expression is a number/boolean, we can just place the value
                sassifiedStyles = sassifiedStyles.replace(`/*placeholder${j}*/`, '${'+ path.node.quasi.expressions[j].value +'}')
              }
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
