import { defineConfig } from "orval";

export default defineConfig({
  splitters: {
    input: {
      target: "../backend/openapi.json",
    },
    output: {
      target: "./src/generated/api.ts",
      client: "axios",
      mode: "tags-split",
      override: {
        mutator: {
          path: "./src/api/client.ts",
          name: "customInstance",
        },
      },
    },
  },
});
