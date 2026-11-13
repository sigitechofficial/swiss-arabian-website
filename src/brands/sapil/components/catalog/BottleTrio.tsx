import { MediaImage } from "@/components/ui/MediaImage";
import { cx } from "../../ui/shared";

/**
 * Three bottles standing together (v9 `.shop-hero .imgs`, `.ch-media.trio`,
 * `.ccard .imgs`): the first in the middle, the other two smaller behind it.
 * Decorative (empty alt). `height` is the middle bottle's share of the box.
 */
export function BottleTrio({
  images,
  className,
  imgClassName,
  sizes = "200px",
  eager = false,
  shadow = "drop-shadow(0 18px 18px rgba(22,20,15,.18))",
  bottom = "0",
  height = "100%",
  spread = false,
}: {
  images: string[];
  className?: string;
  imgClassName?: string;
  sizes?: string;
  eager?: boolean;
  shadow?: string;
  /** distance of the bottles from the box bottom */
  bottom?: string;
  height?: string;
  /** collection cards: the side bottles lean out on hover (parent needs `group`) */
  spread?: boolean;
}) {
  const transforms = [
    "[transform:translateX(-50%)] z-[2]",
    cx(
      "[transform:translateX(-100%)_scale(.74)] origin-bottom-right",
      spread && "group-hover:[transform:translateX(-104%)_scale(.74)_rotate(-5deg)]",
    ),
    cx(
      "[transform:translateX(0)_scale(.74)] origin-bottom-left",
      spread && "group-hover:[transform:translateX(4%)_scale(.74)_rotate(5deg)]",
    ),
  ];
  return (
    <span aria-hidden="true" className={cx("block", className)}>
      {images.slice(0, 3).map((src, i) => (
        <MediaImage
          key={`${src}-${i}`}
          src={src}
          alt=""
          width={400}
          height={600}
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          style={{ bottom, height, filter: shadow }}
          className={cx("absolute left-1/2 w-auto max-w-full object-contain [transition:transform_.6s_var(--sapil-ease)]", transforms[i], imgClassName)}
        />
      ))}
    </span>
  );
}
