module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    // Override rules for specific cases
    "max-len": ["error", {"code": 80}], // Adjust max length globally
    "camelcase": "error", // Enforce camelCase globally
  },
  overrides: [
    {
      files: ["index.js", "another/path/*.js"],
      rules: {
        "max-len": "off",
        "camelcase": "off",
      },
    },
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
