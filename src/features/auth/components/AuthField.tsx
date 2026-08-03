import type { InputHTMLAttributes, ReactNode } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  trailing?: ReactNode;
};

export function AuthField({
  label,
  error,
  hint,
  trailing,
  id,
  className = "",
  ...props
}: AuthFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={fieldId}
        className="text-xs font-semibold leading-normal text-sa-primary"
      >
        {label}
      </label>
      <div
        className={`flex items-center border bg-page px-3 py-[11px] ${
          error ? "border-[var(--sa-action-danger)]" : "border-sa-input"
        }`}
      >
        <input
          id={fieldId}
          className={`min-w-0 flex-1 bg-transparent text-sm text-sa-primary outline-none placeholder:text-sa-secondary ${className}`}
          {...props}
        />
        {trailing}
      </div>
      {hint ? (
        <p className="text-[11.5px] leading-normal text-sa-secondary">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs leading-normal text-[var(--sa-action-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
