import { setupMuse } from "@/lib/muse";
import { redirect } from "next/navigation";
import PageClient from "./pageClient";

export default async function Home() {
  try {
    await setupMuse();
  } catch {
    redirect("/login");
  }

  return <PageClient />;
}
