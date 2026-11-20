"use client";

import { useWriteReview } from "@/features/catalog/hooks/useWriteReview";
import { Button, Checkbox, Drawer, Field, TextAreaField } from "../../ui";
import { cx } from "../../ui/shared";

/**
 * v9 panel for writing a review from the product page (as on Swiss Arabian):
 * rating, optional title, the review, the name shown, and the honesty check.
 * Behaviour is shared (`useWriteReview`): a guest signs in first; the server
 * says whether it is published or waits for approval.
 */
export function SapilWriteReview({
  open,
  onClose,
  productId,
  productTitle,
  variantId,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  variantId?: string;
}) {
  const { t, form, rating, bodyLength, setRating, submit, submitting, canWrite } = useWriteReview({
    open,
    onClose,
    productId,
    variantId,
    anchor: "reviews",
  });
  const errors = form.formState.errors;

  return (
    <Drawer
      open={canWrite}
      onClose={onClose}
      title={t.write}
      closeLabel={t.close}
      footer={
        <Button type="submit" form="sapil-write-review" className="w-full" disabled={submitting}>
          {submitting ? t.posting : t.post}
        </Button>
      }
    >
      <form id="sapil-write-review" noValidate onSubmit={submit} className="flex flex-col gap-[16px] py-[14px]">
        <p className="m-0 text-[15px] font-[600]">{productTitle}</p>
        <fieldset className="m-0 p-0 border-0">
          <legend className="text-[14px] font-[600] mb-[8px]">{t.yourRating}</legend>
          <div role="radiogroup" aria-label={t.yourRating} className="flex items-center gap-[4px]">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={t.starsOf(value, t.ratings[value])}
                onClick={() => setRating(value)}
                className={cx(
                  "text-[28px] leading-none px-[2px] cursor-pointer bg-transparent border-0",
                  rating >= value ? "text-sapil-ok-2" : "text-sapil-line-2",
                )}
              >
                ★
              </button>
            ))}
            <span className="ms-[8px] text-[14px] text-sapil-ink-2">{t.ratings[rating] ?? ""}</span>
          </div>
          {errors.rating ? <em className="block not-italic text-[13px] text-sapil-sale mt-[6px]">{errors.rating.message}</em> : null}
        </fieldset>
        <Field label={t.titleOptional} placeholder={t.titleExample} {...form.register("title")} />
        <div>
          <TextAreaField
            label={t.yourReview}
            rows={5}
            placeholder={t.bodyHint}
            error={errors.body?.message}
            {...form.register("body")}
          />
          <p className="m-0 mt-[6px] flex justify-between text-[13px] text-sapil-ink-2">
            <span>{errors.body ? "" : t.minChars}</span>
            <span dir="ltr">{bodyLength} / 2,000</span>
          </p>
        </div>
        <div>
          <Field label={t.shownAs} autoComplete="name" error={errors.name?.message} {...form.register("name")} />
          {!errors.name ? <p className="m-0 mt-[6px] text-[13px] text-sapil-ink-2">{t.nameHint}</p> : null}
        </div>
        <div>
          <Checkbox {...form.register("honest")}>{t.honest}</Checkbox>
          {errors.honest ? <em className="block not-italic text-[13px] text-sapil-sale mt-[6px]">{errors.honest.message}</em> : null}
        </div>
        <p className="m-0 text-[13px] text-sapil-ink-2">{t.panelNote}</p>
      </form>
    </Drawer>
  );
}
