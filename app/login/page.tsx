"use client";

import { LoginCode } from "libmuse";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyCode } from "./_actions";

export default function Page() {
  const [loginCode, setLoginCode] = useState<LoginCode | null>(null);
  useEffect(() => {
    (async () => {
      const code: LoginCode | null = await (await fetch("/login/code")).json();
      if (code) {
        setLoginCode(code);
      } else {
        redirect("/");
      }
    })();
  }, []);

  if (loginCode) {
    const verifyCodeBinded = verifyCode.bind(null, loginCode);
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
          action={verifyCodeBinded}
        >
          <button className="rounded-md bg-gray-200 p-2">
            Click this button after login
          </button>
        </form>
      </div>
    );
  }

  return <div>Loading...</div>;
}
