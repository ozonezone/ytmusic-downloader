import { getLoginCode, loginAndSetup } from "@/lib/muse/auth";

export async function GET(request: Request) {
  return Response.json(await getLoginCode() ?? null);
}

export async function POST(request: Request) {
  const body = await request.json();
  await loginAndSetup(body);
  return new Response(null, { status: 204 });
}
