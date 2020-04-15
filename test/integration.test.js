const { expect } = require('chai');
const path = require('path');
const babel = require('@babel/core');
const fs = require('fs');
const prettier = require("prettier");

const beforeDir = path.join(__dirname, 'before');
const afterDir = path.join(__dirname, 'after');

if (!fs.existsSync(afterDir)) {
  fs.mkdirSync(afterDir);
}

const testCases = fs.readdirSync(beforeDir);

describe('integration tests', () => {
  testCases.forEach((testCase) => {
    it(`Testcase ${testCase}`, async () => {
      const config = {
        caller: {
          name: 'babel-plugin-demo',
        },
        plugins: [
          require.resolve('../babel-plugin-demo.js'),
        ],
        sourceMap: false,
      };

      const beforeFilePath = path.join(beforeDir, testCase);
      const before = fs.readFileSync(beforeFilePath, 'utf-8');

      const result = await babel.transformAsync(before, {
        filename: beforeFilePath,
        ...config,
      });
 
      const afterFilePath = path.join(afterDir, testCase);
      if (!fs.existsSync(afterFilePath)) {
        throw new Error('No snapshot found for ' + testCase);
      }
      const after = fs.readFileSync(afterFilePath, 'utf-8');

      expect(prettier.format(result.code, {parser: 'babel'})).to.equal(after);
    });
  });
});