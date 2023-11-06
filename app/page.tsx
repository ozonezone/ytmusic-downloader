import { redirect } from "next/navigation";
import PageClient from "./pageClient";
import { authed, setup } from "@/lib/muse/auth";
import { get_current_user } from "libmuse";

export default async function Home() {
  if (!authed()) {
    redirect("/login");
  }
  setup();
  const me = await get_current_user();

  return <PageClient me={me} />;
}
