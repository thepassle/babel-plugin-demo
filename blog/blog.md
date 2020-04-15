---
title: How I Learned To Stop Worrying And Love Babel
published: false
description: 
tags: babel, plugin
---

> **TL;DR:** Babel plugins are fun. Want to look at some code instead? You can find the example plugin repo [here](https://github.com/thepassle/babel-plugin-demo).

Many developers will be familiar with Babel, wether you've used it while setting up a project, or tweaking existing configurations, im sure most of us have had to deal with Babel at some point in our careers. And I think it's safe to say that for many of us, it probably wasn't a great experience. Babel errors are hard to debug, hard to google, and frankly, usually a bother.

And to me, Babel was also very much a black box. I had a grasp of what it does _conceptually_, but I've always refrained from going very in depth into it, because I thought: "This probably isn't for me, this stuff is way too advanced, it must just be some kind of voodoo magic". 

## _but_

I was wrong! Babel is _fun_. There, I said it. Babel is an extremely powerful tool and writing plugins, surprisingly, isn't that hard. If I can do it, you can too! And in this blog I'll tell you all about it.

## Opening The Black Box

### What the hell is Babel?

Before we dive in, let's discuss some theory. If we're going to work with Babel, we better understand it. Don't worry, we'll get our hands dirty and write some code soon enough.

Babel is a _transpiler_. What that means is that you give Babel some code, and it outputs different code. The difference between a compiler and a transpiler, is that a transpiler generally _transpiles_ source-to-source, whereas a compiler _compiles_ source to a lower level language, like assembly, or bytecode. Babel will take some JavaScript, and output different JavaScript.

So how does Babel do all this magic? By the magical power of 💫✨**Abstract Syntax Trees!** ✨💫 This is where things may start to feel daunting, but stay with me here. An Abstract Syntax Tree (or, AST) is kind of like a _meta-description_ of your code. Consider the following example (taken from the [babel-handbook](https://github.com/jamiebuilds/babel-handbook/)):

```js
function square(n) {
  return n * n;
}
```

Here's a pretty regular looking JavaScript function. Let's do an exercise in taking a different perspective on this piece of code. How would you describe this code? Chances are, you'll think of this code as something like: "Its a function that takes a parameter, and returns the parameter squared". For humans, this would be a decent enough explanation. Now try to, word-by-word, describe the function instead.

You might describe something like:

- There is a function
- the function is named `square`
- it takes a parameter, named `n`
- the function returns something
- and the return value is `n` times (`*`) `n`

Now let's take it even one step further, and try to answer these following questions:
> There is a function

What kind of function is it? An arrow function? A function declaration?

> the function is named `square`

Would you say this is an identifier?

> it takes a parameter, named `n`

Does it only take only one parameter? And would you say the identifier is `n`?

> the function returns something

So does that mean the function has a body?

> and the return value is `n` times (`*`) `n`

So there is some type of expression with a value on the left, a value on the right, and some specific kind of operator?

If you were able to answer these questions, congrats! You just became Babel. Excellent. Now let's see how an AST would actually describe this function:

```json
{
  type: "FunctionDeclaration",
  id: {
    type: "Identifier",
    name: "square"
  },
  params: [{
    type: "Identifier",
    name: "n"
  }],
  body: {
    type: "BlockStatement",
    body: [{
      type: "ReturnStatement",
      argument: {
        type: "BinaryExpression",
        operator: "*",
        left: {
          type: "Identifier",
          name: "n"
        },
        right: {
          type: "Identifier",
          name: "n"
        }
      }
    }]
  }
}
```

Looks fairly similar to the description we arrived at, huh? Babel will give an extremely detailed description of every aspect of your code, and convert it to an object. We can see the `FunctionDeclaration`, the function `Identifier`, the parameter, the body of the function (`BlockStatement`), and the `ReturnStatement`, to name a few. These are also described as 'Nodes' of the AST. As you can see, there are many different types of Nodes.

We won't go too deep into _how_ Babel arrives at this AST (Parse, Transform, Generate), but if you're interested, please check out the [babel handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-stages-of-babel), which is an incredible resource.

### The Visitor Pattern

Alright, so Babel will create a big ol' detailed object out of the code that you give it, but how exactly do we mutate it? The answer is, err, well. You just kinda mutate it. This is where babel plugins come into play, lets take a look!

Babel plugins make use of the [visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern). I'll show you by example:

```js
export default function (babel) {
  return {
    name: "my-cool-babel-plugin",
    visitor: {
      Identifier(path) {
        path.node.name = path.node.name.split('').reverse().join('');
      }
    }
  };
}

```
> Example taken from the [babel handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)

What we have here is world's smallest babel plugin. A babel plugin is just a function that returns an object. The `visitor` property on the object is whats interesting for us. While traversing the AST, every time babel encounters a Node, it will run the corresponding function on your `visitor` against it, and (in this case) reverse the Identifier's `name`. 

So if we take the following code, where `greeting` is the identifier:
```js
const greeting = "hello";
```

The plugin will output:
```js
const gniteerg = "hello";
```

Here's another example, where `doThing` is the identifier:

```js
function doThing() {}
```

Output:
```js
function gnihTod() {}
```

This means we can basically do all sorts of things with the code, lets take a look at another example. 

### Remove all the things!

Let's say I want to remove a certain type of function from my entire codebase, here's what my `visitor` would look like. I tell Babel that whenever you encounter a `FunctionDeclaration`, and if the identifier of that function is `"doThing"`, just remove it entirely:

```js
export default function (babel) {
  return {
    name: "remove-function",
    visitor: {
      FunctionDeclaration(path) {
        if(path.node.id.name === "doThing") {
          path.remove();          
        }
      }
    }
  };
}
```

Input:
```js
function doThing(){}
function doAnotherThing(){}
```

Output:
```js
function doAnotherThing(){}
```

Note that we're _only_ targetting `FunctionDeclaration`s. This babel plugin will not handle:

```js
const doThing = () => {}
```

If you're writing babel plugins, you have to be really specific, and make sure to double check the assumptions that you make. In my experience: You _will_ make assumptions, and you _will_ be wrong. 😅

### Async all the things!

Lets take a look at one more example. Let's say we want to make every function declaration async for some reason:

```js
export default function (babel) {
  return {
    name: "async-all-the-things",
    visitor: {
      FunctionDeclaration(path) {
        path.node.async = true;
      }
    }
  };
}
```

This will turn:

```js
function doThing() {}
```

Into:
```js
async function doThing() {}
```

See what I meant with _"You just kinda mutate it"_? 

As you can see, Babel is pretty powerful, and you can do loads of things with it. But how do you start? How do you know which Nodes exactly you want to target and alter? The answer is: [astexplorer](https://astexplorer.net/). If you click on the 'Transform' button in the menu bar and select 'babelv7', you should now see 4 panels in total:

- top-left: source code
- top-right: AST
- bottom-left: babel plugin
- bottom-right: output

![astexplorer](https://i.imgur.com/WxKMigu.png)

You can spend all the time in the world reading about how Babel works internally (and if thats your thing, all the best to you!), but I found that simply getting your hands dirty with astexplorer will make things just 'click'.

Just start by entering some source code that you want to alter in the top-left panel, click around in the AST to figure out which kind of Nodes you need to target and how to identify them correctly, and then start mutating!

## A more elaborate example

Alright, small basic examples are nice to get a feeling of how things work, but lets take a look at a more elaborate example. For this example we'll be making a sass-transformer for LitElement. If you're not familiar with LitElement, don't worry, here's what a minimal LitElement looks like:

```js
class MyElement extends LitElement {
  static get styles {
    return css`
      :host {
        background-color: red;
      }
    `;
  }
  render() {
    return html`<h1>Hello world!</h1>`;
  }
}
```

As you can see, styles are written in a `css` tagged template literal. So in order to run Sass on our styles, we'll have to _extract_ the styles from that `css` tagged template literal somehow, run Sass on it, and replace the original with the sassified styles.

Here's how we'll do it:

> ⚠️ Note: this is a very naive implementation to show you how you could create a more 'involved' babel plugin. This example plugin does not account for any expressions in the `css` tagged template literal, but it should give you a good idea of how to implement different libraries in your babel plugin.

To keep things simple, I made an example repo [here](https://github.com/thepassle/babel-plugin-demo), so you can follow along with the code and try other things out at home.

First of all, we'll need to install `node-sass`, so we can call Sass from a Nodejs context:
```bash
npm i -S node-sass
```

We can then import it in our `babel-plugin-demo.js`, which contains our babel plugin.

```js
const sass = require('node-sass');
```

Next, we'll set up some scaffolding for our actual babel plugin function:

```js
const sass = require('node-sass');

function babelPluginDemo({ types: t }) {
  return {
    visitor: {}
  };
}

module.exports = babelPluginDemo;
```

Great! We now have a babel plugin that does exactly nothing. So let's write an implementation. I already know that the styles that I need to extract are written in a `css` tagged template literal, so I can target any `TaggedTemplateExpression` in my visitor like so:

```js
function babelPluginDemo({ types: t }) {
  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if (path.node.tag.name === "css") {

        }
      }
    }
  };
}

module.exports = babelPluginDemo;
```

I also do a check to see if the `name` of this tagged template literal is `css`, since we only want to run Sass on the styles, and not on the `html` tagged template literal.

<!-- Since tagged template literals give you an array of strings, we'll need to flatten those strings together, and _then_ call Sass on the result. -->

If you're not familiar with how tagged template literals work, here's a very simple example. The _tag_ in a tagged template literal is really just a function, that gets an array of _strings_, and an array of _expressions_.

```js
function css(strings, ...values) {
  console.log('Strings:', strings);
  console.log('Values:', values);
}

css`hello ${true} world`
// Strings: ["hello ", " world"]
// Values: [true]
```

And if we take a look at the AST for this code, we can see that we get a similar output, with the strings (or _'quasis'_, in fancy AST-language) and expressions in their own array:

```json
"quasi": {
  "type": "TemplateLiteral",
  "expressions": [
    {
      "value": true,
    }
  ],
  "quasis": [
    {
      "type": "TemplateElement",
      "value": {
        "raw": "hello ",
      },
      "tail": false
    },
    {
      "type": "TemplateElement",
      "value": {
        "raw": " world",
      },
      "tail": true
    }
  ]
}
```

To keep things minimal, we'll ignore the _expressions_, and simply flatten the array of `quasis` to one string.

> If you'd like to take things a little bit further, and see how you could solve handling expressions, see the `babel-plugin-demo-with-expression-handling.js`  example in the [demo repo](https://github.com/thepassle/babel-plugin-demo/blob/master/babel-plugin-demo-with-expression-handling.js).

```js
function babelPluginDemo({ types: t }) {
  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if (path.node.tag.name === "css") {
          // `quasis` is an array of objects, so we naively join them together
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

module.exports = babelPluginDemo;
```

One important thing to note here, is how I replace the original value of the node. In my case, all I needed to do was simply replace the original array, and assign a new array with a new template string (or `templateElement`), but there are many other ways you can mutate the node, such as:
- `replaceWith`
- `replaceWithMultiple`
- `replaceWithSourceString`
- `insertBefore`
- `insertAfter`

Which one of these to use depends largely on what you're trying to achieve. If you're unsure of which one to use, I very much recommend checking out the `Manipulation` section of the [babel-plugin-handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#manipulation).

Another great tool to use for this is [ast-builder](https://rajasegar.github.io/ast-builder/), which is the opposite of ASTExplorer. In ast-builder, you can enter some source code, like:

```js
const foo = true;
```

And it'll output what that node would look like in babel syntax:

```js
t.variableDeclaration(
  "const",
  [t.variableDeclarator(t.identifier("foo"), t.booleanLiteral(true))]
);
```

And that's it! Now, if we use the following code as input:

```js
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
          margin: 0;
          padding: 0;
          list-style: none;
        }
      }
    `;
  }
}
```

We'll get the following output:

```js
class MyDemo extends LitElement {
  static get styles() {
    return css`
      .alert {
        border: 1px solid rgba(198, 83, 140, 0.88);
      }

      nav ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }
    `;
  }
}
```

And we achieved all of this with 5 lines of implementation code. Pretty powerful, huh?


## Takeaways

Before I end this blog, I'd like to leave you with some personal takeaways that I gathered while working on a babel plugin, as well as some resources.

### You will make assumptions, and you will be wrong

![assumptions](https://i.imgur.com/JBk4SG7.png)

Keep track of any assumptions you make in a document, it can really help you out when you run into a bug, or if something doesn't transpile quite as you'd expect it to. I kept a markdown file in my repo where I logged all the assumptions that I made, and it proved to be really valuable in the process.

### Tests, tests, and lots of tests

I generally don't practice TDD, but while writing a babel plugin, I found myself clinging on to my unit tests for dear life, and a great tool to stay confident that my code kept working as intended.

I also wrote a lot of integration tests. I kept a 'before' and 'after' folder with files for the various transformations I did on the code. In my test, I would simply run the babel plugin on the 'before' files, and compare the result of that with the 'after' (the 'expected' result) files. Not only does it give you the confidence things dont break after you make changes, it's also great documentation!

Make sure to check out the demo repo to see the [testing setup](https://github.com/thepassle/babel-plugin-demo/tree/master/test)

### Types

Starting out, I wrote everything in good ol' plain JavaScript. At some point I really found myself wanting more confidence/security, so I started using JSDoc types. It really helps keep track of which types of Nodes you're working with, and the autocompletion/suggestions in VS Code are a godsend.

## Resources

Finally, I'd like to share some resources that I found to be extremely variable while working with Babel

- ASTExplorer
https://astexplorer.net/

- Babel types
https://babeljs.io/docs/en/babel-types

- Babel template
https://babeljs.io/docs/en/babel-template

- Babel plugin handbook
https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-state

- Matchers
https://github.com/codemod-js/codemod/blob/master/packages/matchers/README.md

- AST Builder
https://rajasegar.github.io/ast-builder/
