import type { Transition, Variants } from "framer-motion";

/** Luxury / enterprise easing — soft deceleration */
export const easeOutExpo: Transition["ease"] = [0.22, 1, 0.36, 1];

export const revealTransition: Transition = {
  duration: 0.7,
  ease: easeOutExpo,
};

export const staggerTransition: Transition = {
  staggerChildren: 0.09,
  delayChildren: 0.06,
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: revealTransition,
  },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6, ease: easeOutExpo },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: staggerTransition,
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: revealTransition,
  },
};

export const authCopyVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.35, ease: "easeIn" },
  },
};
