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
