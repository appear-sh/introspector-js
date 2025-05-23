import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/entrypoints/index.ts", "src/entrypoints/node.ts"],
  sourcemap: true,
  clean: true,
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  shims: true,
  noExternal: ["import-in-the-middle/hook.mjs"],
  splitting: false,
  external: [],
})
