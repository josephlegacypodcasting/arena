"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

import { BOOKING_EMBED_URL, BOOKING_FALLBACK_URL } from "@/lib/config";
import type { Lead } from "@/lib/schema";

const CALENDLY_SCRIPT = "https://assets.calendly.com/assets/external/widget.js";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget(options: {
        url: string;
        parentElement: HTMLElement;
        resize?: boolean;
      }): void;
    };
  }
}

/**
 * Calendly's inline widget. widget.js only scans the page for
 * `.calendly-inline-widget` once, on load, so a React render that happens
 * later would be missed — the widget is mounted explicitly with
 * `initInlineWidget` instead, both when the script finishes loading and when
 * this component mounts with the script already on the page.
 */
export function BookingEmbed({ lead }: { lead?: Lead | null }) {
  const container = useRef<HTMLDivElement>(null);

  const src = new URL(BOOKING_EMBED_URL);
  src.searchParams.set("hide_gdpr_banner", "1");

  // The visitor just typed these in, so they are not asked to type them again.
  // They go on the URL rather than through initInlineWidget's `prefill`
  // option, which the current widget.js drops from the iframe URL.
  if (lead) {
    src.searchParams.set("name", `${lead.firstName} ${lead.lastName}`.trim());
    src.searchParams.set("first_name", lead.firstName);
    src.searchParams.set("last_name", lead.lastName);
    src.searchParams.set("email", lead.email);
  }
  // URLSearchParams writes spaces as "+", which widget.js re-encodes to a
  // literal "+" in the name; "%20" survives.
  const url = src.toString().replace(/\+/g, "%20");

  function mount() {
    const parent = container.current;
    if (!parent || !window.Calendly) return;
    parent.innerHTML = "";
    window.Calendly.initInlineWidget({ url, parentElement: parent, resize: true });
  }

  useEffect(() => {
    mount();
    // mount only depends on url.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <>
      <div
        ref={container}
        className="w-full overflow-hidden rounded-[var(--radius)]"
        style={{ minWidth: 320, height: 700 }}
      />
      <Script src={CALENDLY_SCRIPT} strategy="lazyOnload" onLoad={mount} />
      <noscript>
        <a
          href={BOOKING_FALLBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          Open the booking calendar
        </a>
      </noscript>
    </>
  );
}
