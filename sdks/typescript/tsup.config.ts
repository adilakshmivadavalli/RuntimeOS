import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/middleware/langgraph.ts",
    "src/middleware/openai-agents.ts",
    "src/middleware/crewai.ts",
    "src/middleware/google-adk.ts",
    "src/middleware/mcp.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  target: "node18",
  outDir: "dist",
});
