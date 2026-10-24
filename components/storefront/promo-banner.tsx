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

  // Build the visual content once.
  // Each promo is separated by a decorative diamond.
  // We render 4 copies per half (8 total) so each half is ≥ 2000px,
  // preventing visible gaps on large viewports (1536px+).
  const renderPromoList = (keyPrefix: string) =>
    promotions.map((promo, index) => (
      <span key={`${keyPrefix}-${promo.id}`} className="inline-flex items-center gap-3 px-4">
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
              animation: promo-banner-marquee 50s linear infinite;
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
              font-size: 0.875rem;
              line-height: 1.4;
              white-space: nowrap;
            }
            @media (prefers-reduced-motion: reduce) {
              .promo-banner-track { animation: none; }
            }
          `,
        }}
      />

      <div
        className="w-full overflow-hidden bg-purple-950 py-3"
        role="region"
        aria-label="Promociones activas"
      >
        <div className="promo-banner-track flex w-max items-center">
          {/* First half — 4 copies for ≥ 2000px width */}
          <div className="flex shrink-0 items-center">
            {renderPromoList("a1")}
            {renderPromoList("a2")}
            {renderPromoList("a3")}
            {renderPromoList("a4")}
          </div>
          {/* Second half — identical for seamless loop, hidden from a11y tree */}
          <div className="flex shrink-0 items-center" aria-hidden="true">
            {renderPromoList("b1")}
            {renderPromoList("b2")}
            {renderPromoList("b3")}
            {renderPromoList("b4")}
          </div>
        </div>
      </div>
    </>
  );
}
