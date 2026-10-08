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
      className="flex cursor-pointer items-center gap-2 text-[14px] text-sa-secondary"
    >
      <input
        id={fieldId}
        type="checkbox"
        className="size-[18px] shrink-0 appearance-none rounded-[4px] border border-sa-input bg-surface checked:border-terra checked:bg-terra"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
