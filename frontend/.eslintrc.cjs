module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // shadcn/ui primitives intentionally co-export non-component values
      // (e.g. `buttonVariants`) alongside the component - this is the
      // standard shadcn/ui pattern and does not affect Fast Refresh in
      // practice since these files rarely change during development.
      files: ["src/components/ui/**/*.tsx"],
      rules: {
        "react-refresh/only-export-components": "off",
      },
    },
    {
      // Context modules conventionally co-export a `*Provider` component
      // alongside its `use*` hook - splitting them into separate files
      // would only add indirection with no real benefit here.
      files: ["src/contexts/**/*.tsx"],
      rules: {
        "react-refresh/only-export-components": "off",
      },
    },
  ],
};
