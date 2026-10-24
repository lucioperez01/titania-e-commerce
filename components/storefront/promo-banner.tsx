"use client";

import type { FormattedPromotion } from "@/lib/promotions/get-active-promotions";

type PromoBannerProps = {
  promotions: FormattedPromotion[];
};

/**
 * Storefront promo banner.
 *
 * Renders a full-width dark strip above the navbar with a seamless
 * right-to-left marquee of active automatic promotions.
 *
 * Returns null when there are no promotions to display, so the layout
 * collapses cleanly without leaving an empty gap.
 */
export default function PromoBanner({ promotions }: PromoBannerProps) {
  if (promotions.length === 0) return null;

  // Build the visual content once and duplicate it for the seamless loop.
  // Each promo is separated by a decorative diamond.
  const content = promotions.map((promo, index) => (
    <span key={promo.id} className="inline-flex items-center gap-3 px-4">
      <span className="promo-banner-text">{promo.message}</span>
      {index < promotions.length - 1 && (
        <span className="text-amber-400/40" aria-hidden>
          ✦
        </span>
      )}
    </span>
  ));

  return (
    <>
      {/* Scoped keyframes + reduced-motion override.
          Class names use a `promo-banner-` prefix to avoid collisions. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes promo-banner-marquee {
              from { transform: translate3d(0, 0, 0); }
              to   { transform: translate3d(-50%, 0, 0); }
            }
            .promo-banner-track {
              animation: promo-banner-marquee 30s linear infinite;
              will-change: transform;
            }
            .promo-banner-text {
              background: linear-gradient(90deg, #fbbf24 0%, #f5d084 40%, #c084fc 100%);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              font-weight: 600;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              font-size: 0.8125rem;
              line-height: 1;
              white-space: nowrap;
            }
            @media (prefers-reduced-motion: reduce) {
              .promo-banner-track { animation: none; }
            }
          `,
        }}
      />

      <div
        className="w-full overflow-hidden bg-neutral-950"
        role="region"
        aria-label="Promociones activas"
      >
        <div className="promo-banner-track flex w-max">
          {/* First set */}
          <div className="flex shrink-0">{content}</div>
          {/* Duplicated set for seamless loop — hidden from a11y tree */}
          <div className="flex shrink-0" aria-hidden="true">
            {content}
          </div>
        </div>
      </div>
    </>
  );
}
