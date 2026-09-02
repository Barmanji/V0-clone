import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { Template, defaultBuildLogger } from "e2b";
import { template } from "./template";

async function main() {
  const apiKey = process.env.E2B_API_KEY;

  if (!apiKey) {
    throw new Error("E2B_API_KEY is not defined in your .env file.");
  }

  await Template.build(template, "v0-clone-build-dev", {
    onBuildLogs: defaultBuildLogger(),
    apiKey: apiKey,
  });
}

main().catch(console.error);
