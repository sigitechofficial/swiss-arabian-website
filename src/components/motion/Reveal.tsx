"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { useRef, type ReactNode } from "react";
import {
  fadeUpVariants,
  revealTransition,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/motion/variants";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Fade only — no vertical travel */
  fade?: boolean;
} & Omit<
  HTMLMotionProps<"div">,
  "children" | "initial" | "animate" | "variants"
>;

/** Scroll-triggered fade-up — use once per section block */
export function Reveal({
  children,
  className,
  delay = 0,
  fade = false,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={fade ? { opacity: 0 } : { opacity: 0, y: 22 }}
      animate={
        isInView
          ? fade
            ? { opacity: 1 }
            : { opacity: 1, y: 0 }
          : fade
            ? { opacity: 0 }
            : { opacity: 0, y: 22 }
      }
      transition={{ ...revealTransition, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /**
   * `scroll` — play when in viewport (home sections).
   * `mount` — play as soon as the grid mounts (async catalog / filtered lists).
   */
  mode?: "scroll" | "mount";
};

/**
 * Parent for staggered children — pair with StaggerItem.
 * `mount` mode avoids stuck opacity:0 when content appears after data fetch.
 */
export function Stagger({
  children,
  className,
  mode = "scroll",
}: StaggerProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.05,
    // Always true check skipped when mount mode — we don't need the observer
  });
  const shouldShow = mode === "mount" || isInView;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      animate={shouldShow ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}

/** Soft continuous float — decorative only, pauses with reduced motion */
export function SoftFloat({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0] }}
      transition={{
        duration: 5.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

/** Single item that fades up when it enters the viewport (lazy grids). */
export function InViewItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.15,
    margin: "0px 0px -40px 0px",
  });

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={revealTransition}
    >
      {children}
    </motion.div>
  );
}

export { fadeUpVariants };
