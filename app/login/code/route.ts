import { getLoginCode } from "@/lib/muse/auth";

export async function GET(request: Request) {
  return Response.json(await getLoginCode());
}
