"use client";

import Image from "next/image";
import { useState, type InputHTMLAttributes } from "react";
import { authAssets } from "../constants/authAssets";
import { AuthField } from "./AuthField";

type AuthPasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  error?: string;
};

export function AuthPasswordField({
  label = "Password",
  error,
  ...props
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      label={label}
      error={error}
      type={visible ? "text" : "password"}
      autoComplete={props.autoComplete ?? "current-password"}
      {...props}
      trailing={
        <button
          type="button"
          className="-m-1.5 ml-1 flex size-[19px] shrink-0 cursor-pointer items-center justify-center text-sa-muted"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          <Image
            src={authAssets.eye}
            alt=""
            width={19}
            height={19}
            className="block size-[19px]"
            unoptimized
          />
        </button>
      }
    />
  );
}
