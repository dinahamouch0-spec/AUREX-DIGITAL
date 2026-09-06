"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Sparkles } from "lucide-react";
import { useHasMounted } from "@/lib/use-has-mounted";

const SESSION_KEY = "ya7kayti-loader-shown";
const NORMAL_DURATION_MS = 2500;
const REDUCED_MOTION_DURATION_MS = 300;
const FADE_MS = 450;

/**
 * A short, branded loading moment — never a blocker. Shows once per
 * browser session (not on every client-side navigation), always
 * dismisses on a hard timer even if assets are still loading, and
 * respects prefers-reduced-motion by cutting straight to a brief fade.
 */
export function Loader() {
  const t = useTranslations("loader");
  const mounted = useHasMounted();
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // sessionStorage unavailable (private mode etc.) — just show it once
    }

    if (alreadyShown) {
      // sessionStorage is only readable client-side, so this can't be
      // known until after mount — an effect is the correct place for it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemoved(true);
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? REDUCED_MOTION_DURATION_MS : NORMAL_DURATION_MS;

    const dismissTimer = setTimeout(() => {
      setFading(true);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
      const removeTimer = setTimeout(() => setRemoved(true), FADE_MS);
      return () => clearTimeout(removeTimer);
    }, duration);

    return () => clearTimeout(dismissTimer);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = removed ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted, removed]);

  if (!mounted || removed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t("message")}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-ivory transition-opacity ease-out"
      style={{
        opacity: fading ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute -top-1 -end-1 text-brand-gold animate-ya-sparkle">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="absolute -bottom-1 -start-2 text-brand-pink-soft animate-ya-sparkle [animation-delay:0.6s]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="animate-ya-float flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[var(--shadow-soft)]">
          <BookOpen className="h-9 w-9 text-brand-pink" aria-hidden="true" strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-sm font-semibold text-brand-navy-soft">{t("message")}</p>
    </div>
  );
}
