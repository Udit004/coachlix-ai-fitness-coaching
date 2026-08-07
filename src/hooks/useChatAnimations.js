"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

/**
 * Reusable GSAP animation helpers for the chat experience.
 *
 * Abstracts the message-entry and status-banner animations away from the
 * components, keeping them consistent, smooth, and responsive across all
 * screen sizes (mobile through desktop) with React 19 + StrictMode-safe
 * teardown (context.revert()).
 */

// Respect users who prefer reduced motion.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const EASE = "power3.out";
const MSG_DURATION = 0.45;
const BANNER_DURATION = 0.4;
const STREAM_MAX_DURATION = 1.6;

/**
 * Animate a newly-mounted message into view.
 * Left (user) messages slide in from the right; right-aligned (assistant /
 * default) messages slide from the left; all fade + gently rise.
 *
 * @param {HTMLElement} el   message root element
 * @param {object}      opts { align, isStreaming }
 * @returns {() => void}     a cleanup function that reverts the animation
 */
export function useMessageEnterAnimation(ref, options = {}) {
  const ctx = useRef();

  useEffect(() => {
    if (!ref.current) return undefined;
    if (prefersReducedMotion()) return undefined;

    const el = ref.current;
    const { align = "assistant", delay = 0 } = options;
    const fromLeft = align === "user" ? -28 : 28;

    ctx.current = gsap.context(() => {
      gsap.set(el, {
        opacity: 0,
        y: 14,
        x: fromLeft,
        transformOrigin: "center",
      });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        x: 0,
        duration: MSG_DURATION,
        delay,
        ease: EASE,
        overwrite: "auto",
        clearProps: "x,y",
      });
    }, el);

    return () => ctx.current?.revert();
  }, [ref, options?.align, options?.delay]);

  return ctx;
}

/**
 * Animate a streaming assistant message: subtle "breathing" opacity tied to
 * token arrival, then settle. Vision flicker-free (uses transform/opacity),
 * so it stays smooth even as content grows.
 *
 * @param {HTMLElement} el  message root element (while streaming)
 */
export function useStreamingMessageAnimation(ref, isStreaming) {
  const ctx = useRef();

  useEffect(() => {
    if (!ref.current) return undefined;
    if (!isStreaming) return undefined;
    if (prefersReducedMotion()) return undefined;

    ctx.current = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0.78, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: STREAM_MAX_DURATION,
          ease: "power2.out",
          overwrite: true,
        }
      );
    }, ref.current);

    return () => ctx.current?.revert();
  }, [ref, isStreaming]);

  return ctx;
}

/**
 * Animate the AI status / lifecycle banner (thinking, tool calling, intent,
 * streaming) as it appears and changes. Content swaps are faded in-place so
 * text changes feel buttery rather than abrupt.
 *
 * @param {HTMLElement} el      banner root element
 * @param {string}      statusKey  a value that changes on every status update
 */
export function useStatusBannerAnimation(ref, statusKey) {
  const ctx = useRef();

  useEffect(() => {
    if (!ref.current) return undefined;
    if (prefersReducedMotion()) return undefined;

    ctx.current = gsap.context(() => {
      const el = ref.current;
      gsap.fromTo(
        el,
        { opacity: 0, y: -12, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: BANNER_DURATION,
          ease: EASE,
          overwrite: "auto",
        }
      );
    }, ref.current);

    return () => ctx.current?.revert();
  }, [ref, statusKey]);

  return ctx;
}

/**
 * Animate all message elements currently in a container (used for nice
 * staggered entry when the list first renders / on scroll into view).
 *
 * @param {HTMLElement} container the scrollable messages wrapper
 */
export function useMessagesStagger(containerRef) {
  const ctx = useRef();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (prefersReducedMotion()) return undefined;

    const items = gsap.utils.toArray(
      container.querySelectorAll("[data-chat-message]")
    );
    if (!items.length) return undefined;

    ctx.current = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: EASE,
          overwrite: "auto",
        }
      );
    }, container);

    return () => ctx.current?.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ctx;
}

export { gsap };

