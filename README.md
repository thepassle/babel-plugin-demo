# Babel-plugin-demo

This repo is an example repo to follow along to the blogpost TODO.

## Usage

Install dependencies:
```bash
npm i
```

Run the babel plugin:
```bash
npm start
```
You can now see the results of the plugin in `./demo/test-out.js`.

Run the integration tests:
```bash
npm test
```

### Adding more tests

You can add more tests by adding more `before` and `after` files in the test directory. The integration tests will run the babel plugin on the files in the `before` directory, and compare the resulting code with the files in the `after` directory.

Note that in this example I call prettier on the output of the babel plugin, so the before/after examples are clear to read for humans. If you dont need this, because you want to run a plugin at buildtime only, you can remove the call to prettier in `integration.test.js` and remove `npm run format` at the end of the `npm start` script.