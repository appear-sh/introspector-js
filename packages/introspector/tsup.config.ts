import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/entrypoints/index.ts", "src/entrypoints/node.ts"],
  sourcemap: true,
  clean: true,
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  noExternal: ["@opentelemetry/instrumentation/hook.mjs"],
})
