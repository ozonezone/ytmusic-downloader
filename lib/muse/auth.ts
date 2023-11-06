import { get_option, LoginCode, setup as setupMuse } from "libmuse";
import { NodeFileStore } from "./store";

export async function setup() {
  setupMuse({
    store: new NodeFileStore("config/token.json"),
    debug: true,
    language: "ja",
  });
}

export function authed() {
  setup();
  const auth = get_option("auth");
  return auth.has_token();
}

export async function getLoginCode() {
  setup();
  const auth = get_option("auth");
  if (auth.has_token()) return;
  console.log("Getting login code...");

  const loginCode = await auth.get_login_code();

  return loginCode;
}
export async function loginAndSetup(loginCode: LoginCode) {
  setup();
  const auth = get_option("auth");
  const token = await auth.load_token_with_code(loginCode);
}
