"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type InputHTMLAttributes } from "react";
import { authAssets } from "../constants/authAssets";
import { AuthField } from "./AuthField";

type AuthPasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  error?: string;
  forgotHref?: string;
};

export function AuthPasswordField({
  label = "Password",
  error,
  forgotHref,
  ...props
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex w-full flex-col gap-[5px]">
      <AuthField
        label={label}
        error={forgotHref ? undefined : error}
        type={visible ? "text" : "password"}
        autoComplete={props.autoComplete ?? "current-password"}
        {...props}
        trailing={
          <button
            type="button"
            className="-m-2 ml-1 flex size-8 shrink-0 items-center justify-center"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
          >
            <Image
              src={authAssets.eye}
              alt=""
              width={9}
              height={9}
              className="block size-[9px]"
              unoptimized
            />
          </button>
        }
      />
      {forgotHref ? (
        <div className="flex h-[22px] items-center justify-end pt-1">
          <Link
            href={forgotHref}
            className="text-xs font-semibold text-[var(--sa-action-primary)] hover:text-[var(--sa-action-primary-hover)]"
          >
            Forgot password?
          </Link>
        </div>
      ) : null}
      {forgotHref && error ? (
        <p className="text-xs leading-normal text-[var(--sa-action-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
