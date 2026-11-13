"use client";

import {
  useId,
  useState,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cx } from "./shared";

/** v9 `.co fieldset` + `legend`: white rounded form card. */
export function Fieldset({
  legend,
  children,
  className,
  ...rest
}: FieldsetHTMLAttributes<HTMLFieldSetElement> & { legend: ReactNode }) {
  return (
    <fieldset
      {...rest}
      className={cx(
        "border-0 bg-sapil-white rounded-[24px] pt-[24px] px-[24px] pb-[26px] max-900:py-[20px] max-900:px-[16px] max-900:rounded-[20px]",
        className,
      )}
    >
      <legend className="float-left w-full font-sapil-sans font-[700] text-[20px] leading-[1.2] tracking-[-.02em] mb-[18px]">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

/** v9 `.fgrid`: two-column field grid, one column at ≤900px. */
export function FieldGrid({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cx("grid grid-cols-[repeat(2,minmax(0,1fr))] gap-y-[14px] gap-x-[16px] clear-both max-900:grid-cols-[1fr]", className)}
    />
  );
}

const CONTROL =
  "h-[50px] border bg-sapil-card px-[16px] font-sapil-sans font-[400] text-[15px] leading-[normal] text-sapil-ink placeholder:text-[#757575] w-full [transition:border-color_.18s,box-shadow_.18s] focus:outline-none focus:border-sapil-accent focus:shadow-[0_0_0_3px_var(--sapil-accent-soft)]";

type FieldShell = {
  label: ReactNode;
  /** adds "(optional)" after the label */
  optional?: boolean | string;
  /** error message; shows it and marks the control invalid (v9 `.fld.err`) */
  error?: ReactNode;
  /** spans both grid columns (v9 `.fld.wide`) */
  wide?: boolean;
  className?: string;
};

function Shell({
  id,
  label,
  optional,
  error,
  errorId,
  wide,
  className,
  children,
}: FieldShell & { id: string; errorId: string; children: ReactNode }) {
  return (
    <div className={cx("flex flex-col gap-[6px] text-[14px] font-[500]", wide && "col-span-full", className)}>
      <label htmlFor={id}>
        {label}
        {optional && (
          <>
            {" "}
            <small className="font-[400] [font-size:smaller] text-sapil-muted">
              {typeof optional === "string" ? optional : "(optional)"}
            </small>
          </>
        )}
      </label>
      {children}
      {error && (
        <em id={errorId} className="block not-italic text-[13px] text-sapil-sale">
          {error}
        </em>
      )}
    </div>
  );
}

export type FieldProps = FieldShell &
  Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
    type?: "text" | "email" | "tel" | "number" | "password" | "search";
    /** fixed prefix box, e.g. "+971" (v9 `.phone b`) */
    prefix?: ReactNode;
    inputClassName?: string;
  };

/** v9 `.fld`: label above a 50px input; optional prefix (`.phone`) and error line. */
export function Field({ label, optional, error, wide, className, prefix, inputClassName, id, type = "text", ...input }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const errorId = `${fid}-err`;
  const control = (
    <input
      {...input}
      id={fid}
      type={type}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : input["aria-describedby"]}
      className={cx(
        CONTROL,
        error ? "border-sapil-sale" : "border-sapil-line-2",
        prefix ? "rounded-e-[14px] rounded-s-none" : "rounded-[14px]",
        inputClassName,
      )}
    />
  );
  return (
    <Shell id={fid} errorId={errorId} label={label} optional={optional} error={error} wide={wide} className={className}>
      {prefix ? (
        <span className="flex items-stretch">
          <b className="grid place-items-center px-[12px] border border-sapil-line-2 border-e-0 rounded-s-[14px] bg-sapil-paper text-[15px] font-[600]">
            {prefix}
          </b>
          {control}
        </span>
      ) : (
        control
      )}
    </Shell>
  );
}

export type SelectFieldProps = FieldShell &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & { children: ReactNode };

// chevron as an inline style: a data-URL inside a class name would also reach the host
// app's Tailwind build (it scans this folder) and break its CSS url() resolution.
const SELECT_ARROW = "appearance-none bg-no-repeat bg-[position:right_14px_center] bg-[length:18px] pr-[40px]";
const SELECT_ARROW_IMAGE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e1b18' stroke-width='1.6'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E\")";

/** v9 `.fld select`: same shell as Field, custom chevron. */
export function SelectField({ label, optional, error, wide, className, id, children, ...select }: SelectFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const errorId = `${fid}-err`;
  return (
    <Shell id={fid} errorId={errorId} label={label} optional={optional} error={error} wide={wide} className={className}>
      <select
        {...select}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : select["aria-describedby"]}
        style={{ backgroundImage: SELECT_ARROW_IMAGE, ...select.style }}
        className={cx(CONTROL, "rounded-[14px]", SELECT_ARROW, error ? "border-sapil-sale" : "border-sapil-line-2")}
      >
        {children}
      </select>
    </Shell>
  );
}

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  children: ReactNode;
  className?: string;
};

/** v9 `.check`: 18px native checkbox in navy with a label. */
export function Checkbox({ children, className, ...input }: CheckboxProps) {
  return (
    <label className={cx("flex items-center gap-[10px] mt-[16px] text-[14px] text-sapil-ink-2 cursor-pointer", className)}>
      <input {...input} type="checkbox" className="w-[18px] h-[18px] accent-sapil-accent" />
      <span>{children}</span>
    </label>
  );
}

export type RadioCardOption = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  /** right side: a fee (`.o-fee`) */
  fee?: ReactNode;
  /** right side: logos (`.o-logos`), e.g. <CardLogo kind="visa" /> */
  logos?: ReactNode;
  /** content shown under the option while it is selected (v9 `.pay-panel`) */
  panel?: ReactNode;
  disabled?: boolean;
};

export type RadioCardGroupProps = {
  name: string;
  options: RadioCardOption[];
  /** controlled value */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** accessible name when not inside a fieldset with a legend */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
};

/** v9 `.opts` / `.opt`: native radios styled as selectable cards. */
export function RadioCardGroup({
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  ...aria
}: RadioCardGroupProps) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value);
  const current = value ?? inner;
  return (
    <div role="radiogroup" {...aria} className={cx("flex flex-col gap-[10px] clear-both", className)}>
      {options.map((o) => (
        <RadioCardItem
          key={o.value}
          name={name}
          option={o}
          checked={current === o.value}
          onSelect={() => {
            if (value === undefined) setInner(o.value);
            onValueChange?.(o.value);
          }}
        />
      ))}
    </div>
  );
}

function RadioCardItem({
  name,
  option: o,
  checked,
  onSelect,
}: {
  name: string;
  option: RadioCardOption;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <>
      <label
        className={cx(
          "flex items-center gap-[14px] border rounded-[16px] py-[16px] px-[18px] cursor-pointer [transition:border-color_.18s,background_.18s]",
          checked ? "border-sapil-accent bg-sapil-accent-soft" : "border-sapil-line-2 hover:border-sapil-ink",
        )}
      >
        <input
          type="radio"
          name={name}
          value={o.value}
          checked={checked}
          disabled={o.disabled}
          onChange={onSelect}
          className="w-[20px] h-[20px] accent-sapil-accent flex-none"
        />
        <span className="flex-1 min-w-0">
          <b className="block text-[15px] font-[600]">{o.title}</b>
          {o.description && <small className="block text-[13px] text-sapil-ink-2 mt-[2px]">{o.description}</small>}
        </span>
        {o.fee !== undefined && <span className="font-[600] tabular-nums">{o.fee}</span>}
        {o.logos && (
          <span className="flex gap-[6px]" aria-hidden="true">
            {o.logos}
          </span>
        )}
      </label>
      {o.panel && (
        <div
          hidden={!checked}
          className="border border-sapil-line rounded-[16px] p-[18px] mt-[-4px] mb-[4px] bg-sapil-card"
        >
          {o.panel}
        </div>
      )}
    </>
  );
}

/** v9 `.cl`: small payment-brand marks shown on a radio card. Decorative. */
export function CardLogo({ kind }: { kind: "visa" | "mastercard" | "tabby" }) {
  const base =
    "grid place-items-center h-[26px] min-w-[40px] px-[6px] rounded-[6px] border not-italic text-[11px]";
  if (kind === "visa")
    return <i className={cx(base, "bg-sapil-white border-sapil-line font-[800] text-sapil-accent tracking-[.04em]")}>VISA</i>;
  if (kind === "tabby")
    return <i className={cx(base, "bg-sapil-p-mint border-sapil-p-mint font-[700]")}>tabby</i>;
  return (
    <i className={cx(base, "relative bg-sapil-white border-sapil-line font-[800]")}>
      <s className="absolute w-[14px] h-[14px] rounded-full top-[5px] left-[9px] bg-sapil-sale opacity-[.85]" />
      <s className="absolute w-[14px] h-[14px] rounded-full top-[5px] left-[17px] bg-sapil-star opacity-[.85]" />
    </i>
  );
}
