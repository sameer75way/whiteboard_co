module.exports = {
  root: true,

  parser: "@typescript-eslint/parser",

  plugins: ["@typescript-eslint", "react-hooks"],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],

  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",

    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
};