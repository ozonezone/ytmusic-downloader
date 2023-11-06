import * as path from "path";
export const CONFIG_PATH = path.join(
  process.env.CONFIG_DIR ?? "./config",
  "token.json",
);
export const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR ?? "./downloads";
