# Manual QA Checklist — Fix Home Carousel & ProductCard Layout

## Home Page Carousel
- [ ] Carousel renders without clipping on mobile (< 640px)
- [ ] 2 slides visible on tablet (640px - 1280px)
- [ ] 3 slides visible on desktop (> 1280px)
- [ ] Carousel arrows are visible and functional
- [ ] "Encuentra tu estilo" text is visible and centered
- [ ] Container is centered with proper padding
- [ ] No horizontal scroll on any viewport

## ProductCard Layout
- [ ] ProductCard displays correctly in home carousel
- [ ] ProductCard displays correctly in shop grid (2 columns on lg)
- [ ] Product name truncates properly when too long
- [ ] Product description truncates properly when too long
- [ ] Price aligns correctly with text
- [ ] Wishlist button positioned correctly (top-right)

## Shop Page Grid
- [ ] Product grid renders correctly on mobile (single column)
- [ ] Product grid renders correctly on desktop (2 columns)
- [ ] Cards have consistent sizing
- [ ] No layout shift or overflow

## Product Detail Page
- [ ] Image carousel still works correctly
- [ ] Product info layout not affected
- [ ] No visual regressions

## Responsive Breakpoints
- [ ] Mobile (< 640px): 1 slide, single column grid
- [ ] Tablet (640px - 1280px): 2 slides, 2 column grid
- [ ] Desktop (> 1280px): 3 slides, 2 column grid

## Cross-browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

## Notes
- Test with products that have long names/descriptions
- Test with products that have multiple images
- Test carousel autoplay behavior
