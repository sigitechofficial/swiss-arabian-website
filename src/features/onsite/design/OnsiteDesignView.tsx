"use client";

/**
 * Draws an on-site campaign design (popup, bar or slide-in).
 *
 * SHARED FILE: the same file lives in the admin (src/features/website-management/onsite-design/)
 * and the storefront (src/features/onsite/design/), so the admin playground shows exactly what the
 * website draws. Plain React with inline styles only: no Tailwind, MUI or app imports. Change both
 * copies together.
 *
 * `frame="viewport"`: on the website, fixed over the page. `frame="canvas"`: inside a positioned
 * box (the admin preview). With `editing`, clicks select blocks instead of acting.
 */

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  countdownParts,
  type OnsiteDevice,
  type OnsiteDesignLayout,
  type ResolvedBlock,
  type ResolvedDesign,
} from "./onsiteDesign";

export type OnsiteDesignEditing = {
  selectedId: string | null;
  /** A block id, "layout" for the box itself, or null. */
  onSelect: (id: string | null) => void;
};

/** What the email form sends. `interests` are the indexes of the ticked choices. */
export type OnsiteLeadPayload = { email: string; phone: string; interests: number[]; consent: boolean };

/** What the platform answers: for a wheel, the slice it landed on and its code (empty = no prize). */
export type OnsiteLeadResult = { prize: { index: number; label: string; code: string } | null };

export type OnsiteDesignViewProps = {
  design: ResolvedDesign;
  device: OnsiteDevice;
  frame: "viewport" | "canvas";
  onClose: () => void;
  /** A link in the message was followed (button or image link). */
  onCta?: () => void;
  /** Sends the email form. Rejects with an Error whose message is shown to the visitor. */
  onLead?: (payload: OnsiteLeadPayload) => Promise<OnsiteLeadResult>;
  editing?: OnsiteDesignEditing;
  /** Editing only: which page to draw (the form page or the thank-you page). */
  page?: "main" | "success";
};

/** Shared by the blocks of one drawing: the prize won, and how to send the form. */
type DrawContext = {
  editing: boolean;
  /** Thank-you page: the prize won (or a sample while editing). */
  prize: { label: string; code: string } | null;
  /** Main page: the slice the wheel must stop on, once the platform has drawn it. */
  spinTo: number | null;
  submit: (payload: OnsiteLeadPayload) => Promise<void>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SPIN_MS = 4200;

const HEADING_FONT = "var(--font-heading, var(--font-serif, Georgia, 'Times New Roman', serif))";
const BODY_FONT = "var(--font-body, var(--font-sans, inherit))";
const BUTTON_PADDING = { sm: "8px 16px", md: "11px 22px", lg: "14px 30px" } as const;
const BUTTON_FONT = { sm: 13, md: 14, lg: 16 } as const;
const Z_INDEX = 220;

function hexToRgba(hex: string, alpha: number): string {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000";
  const r = parseInt(value.slice(1, 3), 16);
  const g = parseInt(value.slice(3, 5), 16);
  const b = parseInt(value.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function animationName(layout: OnsiteDesignLayout): string | null {
  if (layout.animation === "none") return null;
  if (layout.animation === "fade") return "sa-onsite-fade";
  if (layout.animation === "zoom") return "sa-onsite-zoom";
  return layout.position === "top" ? "sa-onsite-slide-down" : "sa-onsite-slide-up";
}

const KEYFRAMES = `
@keyframes sa-onsite-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes sa-onsite-zoom { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: scale(1) } }
@keyframes sa-onsite-slide-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
@keyframes sa-onsite-slide-down { from { opacity: 0; transform: translateY(-24px) } to { opacity: 1; transform: translateY(0) } }
@media (prefers-reduced-motion: reduce) { [data-onsite-box] { animation: none !important } }
`;

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

function Countdown({ block }: { block: Extract<ResolvedBlock, { type: "countdown" }> }) {
  const now = useNow(true);
  const parts = countdownParts(block.endsAt, now);
  if (!parts) {
    return block.expiredText ? (
      <div style={{ color: block.color, background: block.background, borderRadius: 8, padding: "10px 14px", fontSize: 14 }}>
        {block.expiredText}
      </div>
    ) : null;
  }
  const cells: Array<[number, string]> = [
    [parts.days, "d"],
    [parts.hours, "h"],
    [parts.minutes, "m"],
    [parts.seconds, "s"],
  ];
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }} dir="ltr" aria-label="Time left">
      {cells.map(([value, unit]) => (
        <div
          key={unit}
          style={{
            minWidth: 52,
            padding: "8px 6px",
            borderRadius: 8,
            background: block.background,
            color: block.color,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>{String(value).padStart(2, "0")}</div>
          <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase" }}>{unit}</div>
        </div>
      ))}
    </div>
  );
}

function Coupon({
  block,
  editing,
  prize,
}: {
  block: Extract<ResolvedBlock, { type: "coupon" }>;
  editing: boolean;
  prize: DrawContext["prize"];
}) {
  const [copied, setCopied] = useState(false);
  // A prize coupon shows the code just won; while editing, the sample code stands in.
  const code = block.source === "prize" ? (editing ? block.code : (prize?.code ?? "")) : block.code;
  const copy = () => {
    if (editing) return;
    void navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  };
  if (!code) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        border: `1.5px dashed ${block.color}`,
        background: block.background,
        color: block.color,
        borderRadius: 10,
        padding: "8px 8px 8px 14px",
      }}
    >
      <span dir="ltr" style={{ fontWeight: 700, letterSpacing: "0.08em", fontSize: 16 }}>
        {code}
      </span>
      <button
        type="button"
        onClick={copy}
        style={{
          border: "none",
          cursor: "pointer",
          borderRadius: 8,
          padding: "7px 12px",
          background: block.color,
          color: block.background,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {copied ? block.copiedLabel : block.copyLabel}
      </button>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,.18)",
  background: "#ffffff",
  color: "#1f1a16",
  fontSize: 14,
  fontFamily: "inherit",
};

function LeadForm({ block, ctx }: { block: Extract<ResolvedBlock, { type: "form" }>; ctx: DrawContext }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (ctx.editing || busy) return;
    if (!EMAIL_PATTERN.test(email.trim())) return setError("Please enter a valid email address.");
    if (block.phone === "required" && !phone.trim()) return setError("Please enter your phone number.");
    if (!consent) return setError("Please tick the box to agree.");
    setError("");
    setBusy(true);
    try {
      await ctx.submit({ email: email.trim(), phone: phone.trim(), interests: picked, consent });
    } catch (problem) {
      setError(problem instanceof Error && problem.message ? problem.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  const label: CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, textAlign: "start" };
  return (
    <form
      onSubmit={(event) => void send(event)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: 12, pointerEvents: ctx.editing ? "none" : undefined }}
    >
      <div>
        <label style={label}>
          {block.emailLabel} <span aria-hidden>*</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            placeholder={block.emailPlaceholder}
            onChange={(event) => setEmail(event.target.value)}
            style={{ ...fieldStyle, marginTop: 6, fontWeight: 400 }}
            dir="ltr"
          />
        </label>
      </div>
      {block.phone !== "off" ? (
        <div>
          <label style={label}>
            {block.phoneLabel} {block.phone === "required" ? <span aria-hidden>*</span> : null}
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              placeholder="+971"
              onChange={(event) => setPhone(event.target.value)}
              style={{ ...fieldStyle, marginTop: 6, fontWeight: 400 }}
              dir="ltr"
            />
          </label>
        </div>
      ) : null}
      {block.interests.length ? (
        <fieldset style={{ border: "none", margin: 0, padding: 0, textAlign: "start" }}>
          {block.interestsLabel ? <legend style={{ ...label, padding: 0 }}>{block.interestsLabel}</legend> : null}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
            {block.interests.map((choice, index) => (
              <label key={choice + index} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={picked.includes(index)}
                  onChange={(event) =>
                    setPicked((list) => (event.target.checked ? [...list, index] : list.filter((i) => i !== index)))
                  }
                />
                {choice}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, lineHeight: 1.4, textAlign: "start" }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          style={{ marginTop: 2 }}
          required
        />
        <span>
          {block.consentText} <span aria-hidden>*</span>
        </span>
      </label>
      {error ? (
        <div role="alert" style={{ color: "#b42318", fontSize: 13, textAlign: "start" }}>
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        style={{
          border: "none",
          cursor: busy ? "wait" : "pointer",
          borderRadius: block.radius,
          padding: "12px 18px",
          fontSize: 15,
          fontWeight: 600,
          background: block.buttonBackground,
          color: block.buttonColor,
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "…" : block.submitLabel}
      </button>
    </form>
  );
}

/** A wheel of slices with a pointer on top. It spins to `spinTo` once the platform has drawn the prize. */
function Wheel({ block, spinTo }: { block: Extract<ResolvedBlock, { type: "wheel" }>; spinTo: number | null }) {
  const count = block.segments.length;
  const slice = 360 / count;
  // Turns several times, then stops with the chosen slice's middle under the pointer.
  const rotation = spinTo === null ? 0 : 360 * 6 + (360 - (spinTo * slice + slice / 2));
  const r = 100;
  const point = (angle: number, radius = r) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [r + radius * Math.cos(rad), r + radius * Math.sin(rad)];
  };
  return (
    <div style={{ position: "relative", width: block.size, maxWidth: "100%", margin: "0 auto" }} aria-hidden>
      <div
        style={{
          position: "absolute",
          top: -4,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "22px solid #c0392b",
          zIndex: 1,
          filter: "drop-shadow(0 2px 2px rgba(0,0,0,.3))",
        }}
      />
      <svg
        viewBox="0 0 200 200"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          transform: `rotate(${rotation}deg)`,
          transition: spinTo === null ? undefined : `transform ${SPIN_MS}ms cubic-bezier(.17,.67,.12,.99)`,
        }}
      >
        {block.segments.map((segment, index) => {
          const start = index * slice;
          const end = start + slice;
          const [x1, y1] = point(start);
          const [x2, y2] = point(end);
          const large = slice > 180 ? 1 : 0;
          const [tx, ty] = point(start + slice / 2, r * 0.62);
          return (
            <g key={index}>
              <path d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={segment.color} stroke="#ffffff" strokeWidth={1.5} />
              <text
                x={tx}
                y={ty}
                fill={block.textColor}
                fontSize={count > 8 ? 8 : 10}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${start + slice / 2}, ${tx}, ${ty})`}
              >
                {segment.label.length > 14 ? `${segment.label.slice(0, 13)}…` : segment.label}
              </text>
            </g>
          );
        })}
        <circle cx={r} cy={r} r={14} fill="#ffffff" stroke="rgba(0,0,0,.15)" />
      </svg>
    </div>
  );
}

function BlockView({
  block,
  layout,
  editing,
  onClose,
  onCta,
  ctx,
}: {
  block: ResolvedBlock;
  layout: OnsiteDesignLayout;
  editing: boolean;
  onClose: () => void;
  onCta?: () => void;
  ctx: DrawContext;
}): ReactNode {
  const follow = (event: MouseEvent) => {
    if (editing) {
      event.preventDefault();
      return;
    }
    onCta?.();
  };
  switch (block.type) {
    case "text": {
      // {{prize}} on the thank-you page becomes the slice won.
      const text = block.text.replace(/\{\{\s*prize\s*\}\}/g, ctx.prize?.label ?? "");
      if (!text.trim()) return null;
      return (
        <div
          style={{
            margin: 0,
            fontSize: block.size,
            fontWeight: block.weight,
            color: block.color,
            textAlign: block.align ?? layout.align,
            fontStyle: block.italic ? "italic" : undefined,
            textTransform: block.uppercase ? "uppercase" : undefined,
            letterSpacing: block.uppercase ? "0.04em" : undefined,
            fontFamily: block.font === "heading" ? HEADING_FONT : BODY_FONT,
            lineHeight: 1.3,
            whiteSpace: "pre-line",
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>
      );
    }
    case "image": {
      if (!block.src) return editing ? <ImagePlaceholder height={block.height} radius={block.radius} /> : null;
      const image = (
        // eslint-disable-next-line @next/next/no-img-element -- admin-provided URL, shown as is
        <img
          src={block.src}
          alt={block.alt}
          style={{
            display: "block",
            width: "100%",
            height: block.height,
            objectFit: block.fit,
            borderRadius: block.radius,
          }}
        />
      );
      return block.href ? (
        <a href={block.href} onClick={follow} data-onsite-cta>
          {image}
        </a>
      ) : (
        image
      );
    }
    case "button": {
      const style: CSSProperties = {
        display: block.fullWidth ? "flex" : "inline-flex",
        width: block.fullWidth ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: BUTTON_PADDING[block.size],
        fontSize: BUTTON_FONT[block.size],
        fontWeight: 600,
        borderRadius: block.radius,
        background: block.background,
        color: block.color,
        border: "none",
        cursor: "pointer",
        textDecoration: "none",
      };
      const wrap: CSSProperties = { textAlign: layout.align };
      if (block.action === "close") {
        return (
          <div style={wrap}>
            <button type="button" style={style} onClick={() => !editing && onClose()}>
              {block.label}
            </button>
          </div>
        );
      }
      return (
        <div style={wrap}>
          <a href={block.href} style={style} onClick={follow} data-onsite-cta>
            {block.label}
          </a>
        </div>
      );
    }
    case "spacer":
      return <div style={{ height: block.height }} aria-hidden />;
    case "divider":
      return <hr style={{ border: "none", borderTop: `1px solid ${block.color}`, margin: 0 }} />;
    case "countdown":
      return <Countdown block={block} />;
    case "coupon":
      return <Coupon block={block} editing={editing} prize={ctx.prize} />;
    case "form":
      return <LeadForm block={block} ctx={ctx} />;
    case "wheel":
      return <Wheel block={block} spinTo={ctx.spinTo} />;
    default:
      return null;
  }
}

/** Where a picture will go, while the admin has not chosen one yet (never drawn on the website). */
function ImagePlaceholder({ height, radius, width }: { height: number | string; radius?: number; width?: string }) {
  return (
    <div
      style={{
        height,
        width: width ?? "100%",
        flexShrink: 0,
        borderRadius: radius ?? 0,
        background: "repeating-linear-gradient(45deg, #e7ddcb, #e7ddcb 10px, #efe7da 10px, #efe7da 20px)",
        color: "#857565",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontFamily: BODY_FONT,
      }}
    >
      Add your image
    </div>
  );
}

function Selectable({
  id,
  editing,
  children,
  inline,
}: {
  id: string;
  editing?: OnsiteDesignEditing;
  children: ReactNode;
  inline?: boolean;
}) {
  if (!editing) return <>{children}</>;
  const selected = editing.selectedId === id;
  return (
    <div
      data-onsite-block={id}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Edit element ${id}`}
      onClick={(event) => {
        event.stopPropagation();
        editing.onSelect(id);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          editing.onSelect(id);
        }
      }}
      onFocus={(event) => {
        if (!selected) event.currentTarget.style.outline = "2px dashed #3b82f6";
      }}
      onBlur={(event) => {
        if (!selected) event.currentTarget.style.outline = "1px dashed transparent";
      }}
      style={{
        position: "relative",
        cursor: "pointer",
        display: inline ? "inline-block" : undefined,
        outline: selected ? "2px solid #3b82f6" : "1px dashed transparent",
        outlineOffset: 2,
        borderRadius: 4,
      }}
      onMouseEnter={(event) => {
        if (!selected) event.currentTarget.style.outline = "1px dashed #93c5fd";
      }}
      onMouseLeave={(event) => {
        if (!selected) event.currentTarget.style.outline = "1px dashed transparent";
      }}
    >
      {children}
    </div>
  );
}

export function OnsiteDesignView({
  design,
  device,
  frame,
  onClose,
  onCta,
  onLead,
  editing,
  page = "main",
}: OnsiteDesignViewProps) {
  const { layout } = design;
  const isEditing = Boolean(editing);
  // After the form is sent: the platform's answer (and, for a wheel, the slice to spin to).
  const [result, setResult] = useState<OnsiteLeadResult | null>(null);
  const [spinTo, setSpinTo] = useState<number | null>(null);
  const showSuccess = isEditing ? page === "success" : result !== null;
  const blocks = useMemo(
    () => (showSuccess ? design.successBlocks : design.blocks).filter((block) => !block.hideOn?.includes(device)),
    [design.blocks, design.successBlocks, showSuccess, device],
  );
  const wheel = design.blocks.find((block) => block.type === "wheel");
  // While editing, the thank-you page shows a sample prize (the first slice) so it reads naturally.
  const samplePrize = wheel && wheel.type === "wheel" ? { label: wheel.segments[0]?.label ?? "", code: "" } : null;
  const ctx: DrawContext = {
    editing: isEditing,
    prize: isEditing ? samplePrize : (result?.prize ?? null),
    spinTo,
    submit: async (payload) => {
      if (!onLead) throw new Error("This form is not available right now.");
      const answer = await onLead(payload);
      if (answer.prize && wheel) {
        setSpinTo(answer.prize.index);
        window.setTimeout(() => setResult(answer), SPIN_MS + 600);
      } else {
        setResult(answer);
      }
    },
  };

  useEffect(() => {
    if (isEditing || layout.autoCloseSeconds <= 0) return;
    const timer = window.setTimeout(onClose, layout.autoCloseSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [isEditing, layout.autoCloseSeconds, onClose]);

  useEffect(() => {
    if (isEditing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditing, onClose]);

  const position = frame === "viewport" ? "fixed" : "absolute";
  const isBar = layout.type === "bar";
  const isPopup = layout.type === "popup";
  const mobile = device === "mobile";
  const media = layout.media;
  const split = media && (media.position === "left" || media.position === "right") && !mobile && !isBar;
  const anim = animationName(layout);

  const box: CSSProperties = {
    position: "relative",
    boxSizing: "border-box",
    background: layout.background,
    color: layout.textColor,
    borderRadius: isBar ? 0 : layout.radius,
    overflow: "hidden",
    boxShadow: isBar ? "0 -2px 12px rgba(0,0,0,.12)" : "0 18px 50px rgba(0,0,0,.25)",
    fontFamily: BODY_FONT,
    textAlign: layout.align,
    width: isBar ? "100%" : `min(${layout.width}px, calc(100% - 32px))`,
    maxHeight: isBar ? undefined : "calc(100% - 32px)",
    overflowY: isBar ? undefined : "auto",
    display: split ? "flex" : "block",
    flexDirection: split && media?.position === "right" ? "row-reverse" : "row",
    animation: anim ? `${anim} .35s ease-out both` : undefined,
    backgroundImage: media?.position === "background" && media.src ? `url("${media.src}")` : undefined,
    backgroundSize: media?.position === "background" ? media.fit : undefined,
    backgroundPosition: "center",
  };

  const content: CSSProperties = {
    padding: isBar ? `${Math.min(layout.padding, 16)}px ${Math.max(layout.padding, 16)}px` : layout.padding,
    display: "flex",
    flexDirection: isBar && !mobile ? "row" : "column",
    flexWrap: isBar ? "wrap" : undefined,
    alignItems: isBar && !mobile ? "center" : "stretch",
    justifyContent: isBar ? "center" : undefined,
    gap: layout.gap,
    flex: 1,
    minWidth: 0,
    paddingInlineEnd: layout.showClose && isBar ? 44 : undefined,
  };

  const mediaHeight = media ? (split ? "auto" : media.position === "top" ? media.size : 160) : 0;
  const mediaView =
    media && media.position !== "background" && !media.src ? (
      isEditing ? (
        <ImagePlaceholder height={split ? "auto" : mediaHeight} width={split ? `${media.size}%` : undefined} />
      ) : null
    ) : media && media.position !== "background" ? (
      // eslint-disable-next-line @next/next/no-img-element -- admin-provided URL, shown as is
      <img
        src={media.src}
        alt=""
        style={{
          display: "block",
          objectFit: media.fit,
          width: split ? `${media.size}%` : "100%",
          // Left/right images sit on top on phones, at a fixed height.
          height: mediaHeight,
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />
    ) : null;

  const close = layout.showClose ? (
    <button
      type="button"
      aria-label="Close"
      onClick={(event) => {
        event.stopPropagation();
        if (!isEditing) onClose();
      }}
      style={{
        position: "absolute",
        top: 8,
        insetInlineEnd: 8,
        zIndex: 1,
        width: 32,
        height: 32,
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        background: "transparent",
        color: layout.closeColor,
        fontSize: 22,
        lineHeight: 1,
      }}
    >
      ×
    </button>
  ) : null;

  const boxView = (
    <div
      role={isPopup ? "dialog" : "region"}
      aria-modal={isPopup && !isEditing ? true : undefined}
      aria-label="Message"
      dir={design.rtl ? "rtl" : "ltr"}
      lang={design.language}
      data-onsite-box
      style={{
        ...box,
        outline: editing?.selectedId === "layout" ? "2px solid #3b82f6" : undefined,
        outlineOffset: 2,
      }}
      onClick={(event) => {
        if (!editing) return;
        event.stopPropagation();
        editing.onSelect("layout");
      }}
    >
      {close}
      {/* A bar is too slim for a picture. */}
      {mediaView && !isBar ? mediaView : null}
      <div style={content}>
        {blocks.map((block) => (
          <Selectable key={block.id} id={block.id} editing={editing} inline={isBar && !mobile}>
            <BlockView block={block} layout={layout} editing={isEditing} onClose={onClose} onCta={onCta} ctx={ctx} />
          </Selectable>
        ))}
      </div>
    </div>
  );

  const placement: CSSProperties = (() => {
    if (isBar) {
      return layout.position === "top" ? { top: 0, left: 0, right: 0 } : { bottom: 0, left: 0, right: 0 };
    }
    if (layout.type === "slide_in") {
      const side = layout.position === "bottom_left" ? { left: 16 } : { right: 16 };
      return { bottom: 16, ...side, width: `min(${layout.width}px, calc(100% - 32px))` };
    }
    return {};
  })();

  return (
    <>
      <style>{KEYFRAMES}</style>
      {isPopup ? (
        <div
          style={{
            position,
            inset: 0,
            zIndex: Z_INDEX,
            display: "flex",
            alignItems: layout.position === "top" ? "flex-start" : layout.position === "bottom" ? "flex-end" : "center",
            justifyContent: "center",
            padding: 16,
            background: hexToRgba(layout.overlayColor, layout.overlayOpacity / 100),
          }}
          onClick={() => {
            if (editing) editing.onSelect(null);
            else if (layout.closeOnOverlay) onClose();
          }}
        >
          <div onClick={(event) => event.stopPropagation()} style={{ display: "contents" }}>
            {boxView}
          </div>
        </div>
      ) : (
        <div style={{ position, zIndex: Z_INDEX, ...placement }}>{boxView}</div>
      )}
    </>
  );
}
