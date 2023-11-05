import { redirect } from "next/navigation";
import PageClient from "./pageClient";
import { authed } from "@/lib/muse/auth";

export default async function Home() {
  if (!authed()) {
    redirect("/login");
  }

  return <PageClient />;
}
