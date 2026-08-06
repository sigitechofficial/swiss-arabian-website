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
        className="text-[13px] font-medium leading-normal text-sa-secondary"
      >
        {label}
      </label>
      <div
        className={`flex items-center rounded-[10px] border bg-surface py-3 pl-4 pr-3 ${
          error ? "border-[var(--sa-action-danger)]" : "border-sa-input"
        }`}
      >
        <input
          id={fieldId}
          className={`min-w-0 flex-1 bg-transparent text-[15px] text-sa-primary outline-none placeholder:text-sa-muted ${className}`}
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
