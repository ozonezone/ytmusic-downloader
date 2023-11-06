import * as path from "path";
export const CONFIG_PATH = path.join(
  process.env.CONFIG_DIR ?? "./config",
  "token.json",
);
console.log("CONFIG_PATH", CONFIG_PATH);
export const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR ?? "./downloads";
console.log("DOWNLOAD_DIR", DOWNLOAD_DIR);
