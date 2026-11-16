"use client";

import type {
  FieldErrors,
  FieldValues,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { accountInputClass } from "@/features/account/constants/accountForm";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { AfterSalesOrderLine } from "../types/afterSales";

type AfterSalesLinePickerProps<T extends FieldValues> = {
  catalog: AfterSalesOrderLine[];
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  showReplacement?: boolean;
};

export function AfterSalesLinePicker<T extends FieldValues>({
  catalog,
  register,
  watch,
  errors,
  showReplacement = false,
}: AfterSalesLinePickerProps<T>) {
  const t = useShopCopy();
  const lines = watch("lines" as never) as unknown as
    | { selected?: boolean }[]
    | undefined;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
        {t("afterSales.items")}
      </legend>
      {typeof (errors.lines as { message?: string; root?: { message?: string } } | undefined)
        ?.message === "string" ||
      typeof (errors.lines as { root?: { message?: string } } | undefined)?.root
        ?.message === "string" ? (
        <p className="text-[12px] text-red-600">
          {formErrorText(
            t,
            (errors.lines as { message?: string; root?: { message?: string } }).message ??
              (errors.lines as { root?: { message?: string } }).root?.message,
          )}
        </p>
      ) : null}
      {catalog.map((line, index) => {
        const selected = lines?.[index]?.selected;
        const lineErrors = (
          errors.lines as Record<
            number,
            { quantity?: { message?: string }; replacementSku?: { message?: string } }
          > | undefined
        )?.[index];
        const qtyError = lineErrors?.quantity?.message;
        const skuError = lineErrors?.replacementSku?.message;
        return (
          <div
            key={line.orderLineId}
            className="flex flex-col gap-3 border border-sa-border p-4"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[#B46E57]"
                {...register(`lines.${index}.selected` as never)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-sa-primary">
                  {line.productName ?? line.sku}
                </p>
                <p className="mt-0.5 text-[12px] text-sa-muted">
                  {[line.variantName, line.sku, t("afterSales.ordered", { count: line.quantity })]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="w-20 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={line.quantity}
                  disabled={!selected}
                  className={accountInputClass}
                  {...register(`lines.${index}.quantity` as never, {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
            {qtyError ? (
              <p className="text-[12px] text-red-600">{formErrorText(t, String(qtyError))}</p>
            ) : null}
            {showReplacement && selected ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
                    {t("afterSales.replacementSku")}
                  </p>
                  <input
                    className={accountInputClass}
                    placeholder={line.sku}
                    {...register(`lines.${index}.replacementSku` as never)}
                  />
                  {skuError ? (
                    <p className="mt-1 text-[12px] text-red-600">
                      {formErrorText(t, String(skuError))}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
                    {t("afterSales.sizeVariant")}
                  </p>
                  <input
                    className={accountInputClass}
                    placeholder={t("afterSales.sizePlaceholder")}
                    {...register(`lines.${index}.replacementSize` as never)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}
