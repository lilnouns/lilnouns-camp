import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(["dist"]),
  ...compat.extends(
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier",
  ),
  {
    languageOptions: {
      globals: {
        AbortController: "readonly",
        Event: "readonly",
        FileReader: "readonly",
        Image: "readonly",
        IntersectionObserver: "readonly",
        MutationObserver: "readonly",
        ResizeObserver: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        alert: "readonly",
        btoa: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        document: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        location: "readonly",
        matchMedia: "readonly",
        navigator: "readonly",
        process: "readonly",
        requestAnimationFrame: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
    plugins: {
      // Plugins are already included via compat.extends if they are named in the same way
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/no-unknown-property": [2, { ignore: ["css"] }],
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
]);
