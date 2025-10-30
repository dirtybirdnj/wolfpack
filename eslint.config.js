export default [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        Phaser: "readonly",
        GameConfig: "readonly",
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly"
      }
    },
    rules: {
      "no-unreachable": "error",
      "no-redeclare": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "warn",
      "no-extra-semi": "warn",
      "no-irregular-whitespace": "warn",
      "no-undef": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-constant-condition": "warn",
      "no-console": "off",
      "curly": ["error", "all"],
      "eqeqeq": ["warn", "always"],
      "no-var": "warn",
      "prefer-const": "warn"
    }
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "**/*.min.js",
      "phaser.min.js",
      "electron-main.js",
      "build.js"
    ]
  }
];
