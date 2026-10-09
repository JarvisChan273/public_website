import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));

export default {
  resolve: {
    alias: {
      "@platform/contracts": `${root}packages/contracts/src/index.ts`,
      "@platform/observability": `${root}packages/observability/src/index.ts`,
      "@platform/content": `${root}services/content/src/index.ts`,
      "@platform/inquiry": `${root}services/inquiry/src/index.ts`,
      "@platform/gateway": `${root}services/gateway/src/index.ts`,
    },
  },
};
