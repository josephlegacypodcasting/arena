"use client";

import Script from "next/script";

import { BOOKING_EMBED_ID, BOOKING_EMBED_URL, BOOKING_FALLBACK_URL } from "@/lib/config";
import type { Lead } from "@/lib/schema";

/**
 * GoHighLevel's booking widget. `form_embed.js` listens for a postMessage from
 * the iframe and sets its height, so the iframe ships with no height of its own
 * — the min-height below is only to stop it collapsing before that runs.
 */
export function BookingEmbed({ lead }: { lead?: Lead | null }) {
  const src = new URL(BOOKING_EMBED_URL);

  // The visitor just typed these in. Carrying them across saves retyping and
  // keeps the booking attached to the same person in the CRM. GoHighLevel
  // ignores params it does not recognise.
  if (lead) {
    src.searchParams.set("first_name", lead.firstName);
    src.searchParams.set("last_name", lead.lastName);
    src.searchParams.set("email", lead.email);
  }

  return (
    <>
      <iframe
        src={src.toString()}
        id={BOOKING_EMBED_ID}
        title="Book a call with Arena Strategic AI"
        allow="payment"
        scrolling="no"
        className="block w-full overflow-hidden rounded-[var(--radius)] border-none"
        style={{ minHeight: 680 }}
      />
      <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="lazyOnload" />
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
