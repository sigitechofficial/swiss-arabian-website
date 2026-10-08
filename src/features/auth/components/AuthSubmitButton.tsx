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
      className={`flex w-full cursor-pointer items-center justify-center rounded-full bg-terra py-4 text-[15px] font-medium text-white transition-colors hover:bg-[var(--sa-action-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
