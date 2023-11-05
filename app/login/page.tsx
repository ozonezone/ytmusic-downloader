import { getLoginCode, loginAndSetup } from "@/lib/muse/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const loginCode = await getLoginCode();
  if (!loginCode) {
    return <div>Maybe you're already logged in?</div>;
  }

  return (
    <div className="flex flex-col justify-center items-center h-[100vh] w-full gap-3">
      <div>
        Open{" "}
        <a className="text-blue-600" href={loginCode.verification_url}>
          {loginCode.verification_url}
        </a>
      </div>
      <div>
        Enter below code <br />
        <span className="font-bold text-xl">{loginCode.user_code}</span>
      </div>
      <form
        action={async () => {
          "use server";
          await loginAndSetup(loginCode);
          redirect("/");
        }}
      >
        <button className="rounded-md bg-gray-200 p-2">
          Click this button after login
        </button>
      </form>
    </div>
  );
}
