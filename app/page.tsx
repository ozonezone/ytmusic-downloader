import { redirect } from "next/navigation";
import PageClient from "./pageClient";
import { authed } from "@/lib/muse/auth";
import { get_current_user } from "@/lib/muse/api";

export default async function Home() {
  if (!authed()) {
    redirect("/login");
  }

  const me = await get_current_user();

  return <PageClient me={me} />;
}
