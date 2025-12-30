import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(["dist", ".next"]),
  ...compat.extends("plugin:prettier/recommended"),
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      "import/no-anonymous-default-export": "off",
      "jsx-a11y/alt-text": "off",
      "react/prop-types": "off",
      "react/display-name": "off",

      "react/no-unknown-property": [
        2,
        {
          ignore: ["css"],
        },
      ],

      "@next/next/no-img-element": "off",
    },
  },
]);
