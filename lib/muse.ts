import { get_option, LoginCode, setup } from "libmuse";

import * as fs from "fs/promises";

const auth = get_option("auth");

let tokenFileContent: any | null = null;

export async function setupMuse() {
  try {
    await fs.access("./config/token.json");
  } catch {
    await fs.mkdir("./config");
  }

  try {
    tokenFileContent = JSON.parse(
      await fs.readFile("./config/token.json", "utf-8"),
    );
    auth.token = tokenFileContent;
  } catch {
    throw new Error("No token file found. Please login first");
  }

  setup({
    debug: true,
  });
}

export async function getLoginCode() {
  if (auth.has_token()) return;
  console.log("Getting login code...");

  const loginCode = await auth.get_login_code();

  return loginCode;
}
export async function loginAndSetupMuse(loginCode: LoginCode) {
  const token = await auth.load_token_with_code(loginCode);
  await fs.writeFile("./config/token.json", JSON.stringify(token));
  setup({
    debug: true,
  });
}
