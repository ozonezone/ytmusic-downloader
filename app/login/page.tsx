"use client";

import { LoginCode } from "libmuse";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const [loginCode, setLoginCode] = useState<LoginCode | null>(null);
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const code: LoginCode | null = await (await fetch("/login/code")).json();
      if (code) {
        setLoginCode(code);
      } else {
        router.push("/");
      }
    })();
  }, []);

  if (loginCode) {
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
        <button
          className="rounded-md bg-gray-200 p-2"
          onClick={async () => {
            await fetch("/login/code", {
              method: "POST",
              body: JSON.stringify(loginCode),
            });
            router.push("/");
          }}
        >
          Click this button after login
        </button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
