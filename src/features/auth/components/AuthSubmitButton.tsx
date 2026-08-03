import type { ButtonHTMLAttributes } from "react";

type AuthSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AuthSubmitButton({
  children,
  className = "",
  disabled,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`flex h-[50px] w-full items-center justify-center bg-[var(--sa-action-primary)] px-4 text-base font-semibold text-white transition-colors hover:bg-[var(--sa-action-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
