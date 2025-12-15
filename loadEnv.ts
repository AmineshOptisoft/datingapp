import { config } from "dotenv";
import { resolve } from "path";

// Load .env
config({ path: resolve(process.cwd(), ".env") });

export {};
