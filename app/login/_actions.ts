"use server";

import { loginAndSetup } from "@/lib/muse/auth";
import { LoginCode } from "libmuse";
import { redirect } from "next/navigation";

export async function verifyCode(loginCode: LoginCode) {
  await loginAndSetup(loginCode);
  redirect("/");
}
