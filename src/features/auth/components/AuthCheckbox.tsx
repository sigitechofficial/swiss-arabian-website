import type { InputHTMLAttributes } from "react";

type AuthCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
};

export function AuthCheckbox({ label, id, ...props }: AuthCheckboxProps) {
  const fieldId = id ?? props.name;

  return (
    <label
      htmlFor={fieldId}
      className="flex cursor-pointer items-center gap-2 text-[13px] text-sa-primary"
    >
      <input
        id={fieldId}
        type="checkbox"
        className="size-4 shrink-0 appearance-none border-[1.5px] border-sa-border bg-surface checked:border-[var(--sa-action-primary)] checked:bg-[var(--sa-action-primary)]"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
