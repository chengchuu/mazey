/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import rollupTypescript from "rollup-plugin-typescript2";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import cleaner from "rollup-plugin-cleaner";
import terser from "@rollup/plugin-terser";
import { dts } from "rollup-plugin-dts";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _resolve = (_path) => path.resolve(__dirname, _path);
const pkgVersion = process.env.SCRIPTS_NPM_PACKAGE_VERSION || process.env.VERSION || "unknown";
const debugMode = process.env.SCRIPTS_NPM_PACKAGE_DEBUG;
const banner =
  "/*!\n" +
  ` * Mazey v${pkgVersion} https://github.com/chengchuu/mazey\n` +
  ` * (c) 2018-${new Date().getFullYear()} Cheng\n` +
  " * Released under the MIT License.\n" +
  " */";
const plugins = [
  rollupTypescript(),
  commonjs({
    include: /node_modules/,
  }),
  babel({
    babelHelpers: "runtime",
    // Just convert the source code, don't run external dependencies.
    exclude: "**/node_modules/**",
    // Babel does not support TypeScript by default; it needs to be manually added.
    extensions: [
      ...DEFAULT_EXTENSIONS,
      ".ts",
    ],
  }),
];
const iifePlugins = [];
const dTsConf = {
  input: _resolve("../src/typing.d.ts"),
  // https://rollupjs.org/guide/en/#outputformat
  output: [
    {
      file: _resolve("../lib/typing.d.ts"),
      format: "es",
    },
  ],
  plugins: [
    dts(),
  ],
  external: [],
};
const gTsConf = {
  input: _resolve("../types/global.d.ts"),
  output: [
    {
      file: _resolve("../lib/global.d.ts"),
      format: "es",
    },
  ],
  plugins: [
    dts(),
  ],
  external: [],
};

if (debugMode !== "open") {
  iifePlugins.push(
    // Add minification.
    // https://github.com/TrySound/rollup-plugin-terser
    terser({ // https://github.com/terser/terser
      format: {
        // https://github.com/terser/terser#format-options
        comments: /^!\n\s\*\sMazey/,
      },
    }),
  );
}

// https://rollupjs.org/guide/en/
export default [
  {
    input: _resolve("../src/index.ts"),
    // https://rollupjs.org/guide/en/#outputformat
    output: [
      {
        file: _resolve("../lib/index.cjs.js"),
        format: "cjs",
        banner,
        plugins: iifePlugins,
      },
      {
        file: _resolve("../lib/index.esm.js"),
        format: "esm",
        banner,
        plugins: iifePlugins,
      },
      {
        file: _resolve("../lib/mazey.min.js"),
        format: "iife",
        name: "mazey",
        banner,
        plugins: iifePlugins,
      },
    ],
    plugins: [
      ...plugins,
      cleaner({
        targets: [
          _resolve("../lib/"),
        ],
      }),
    ],
    external: [],
  },
  dTsConf,
  gTsConf,
];
