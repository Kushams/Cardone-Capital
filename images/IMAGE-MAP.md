# IMAGE MAP — Batch 1: logo + Dashboard Recent Offering cards

Source: Cardone Capital investor portal (investors.appfolioim.com), captured 2026-11-01.
How to use: replace the placeholder image in the named page/slot with the file listed.
Keep the original layout, sizing and cropping (object-fit: cover, same aspect ratio).

## Logo

- `logo/cardone-capital-logo.png` — Cardone Capital logo. Used at the top of the sidebar on every portal page and on the login page.

## Dashboard — Recent Offerings cards

Page: Dashboard, route `/investor/investments`. Cards appear in exactly this order; NN in the file name is the position.

| # | File | Offering (as shown on the card) | Format |
|---|------|----------------------------------|--------|
| 1 | `dashboard-recent-offerings/01-fund-32-card.png` | Cardone Equity Fund 32, LLC | PNG |
| 2 | `dashboard-recent-offerings/02-10x-space-coast-card.jpg` | 10X Space Coast Fund, LLC | JPEG |
| 3 | `dashboard-recent-offerings/03-fund-25-card.jpg` | Cardone Equity Fund 25, LLC | JPEG |
| 4 | `dashboard-recent-offerings/04-fund-24-card.jpg` | Cardone Equity Fund 24, LLC | JPEG |
| 5 | `dashboard-recent-offerings/05-fund-23-card.jpg` | Cardone Equity Fund 23, LLC | JPEG |
| 6 | `dashboard-recent-offerings/06-fund-22-card.jpg` | Cardone Equity Fund 22, LLC | JPEG |
| 7 | `dashboard-recent-offerings/07-fund-21-card.jpg` | Cardone Equity Fund 21, LLC | JPEG |
| 8 | `dashboard-recent-offerings/08-fund-20-card.jpg` | Cardone Equity Fund 20, LLC | JPEG |
| 9 | `dashboard-recent-offerings/09-fund-17-card.jpg` | Cardone Equity Fund 17, LLC | JPEG |
| 10 | `dashboard-recent-offerings/10-fund-18-card.jpg` | Cardone Equity Fund 18, LLC | JPEG |
| 11 | `dashboard-recent-offerings/11-fund-16-card.jpg` | Cardone Equity Fund 16, LLC | JPEG |
| 12 | `dashboard-recent-offerings/12-fund-15-card.jpg` | Cardone Equity Fund 15, LLC | JPEG |
| 13 | `dashboard-recent-offerings/13-fund-14-card.jpg` | Cardone Equity Fund 14, LLC | JPEG |
| 14 | `dashboard-recent-offerings/14-fund-12-card.jpg` | Cardone Equity Fund 12, LLC | JPEG |
| 15 | `dashboard-recent-offerings/15-fund-11-card.jpg` | Cardone Equity Fund 11, LLC | JPEG |
| 16 | `dashboard-recent-offerings/16-fund-10-card.jpg` | Cardone Equity Fund 10, LLC | JPEG |
| 17 | `dashboard-recent-offerings/17-fund-09-card.jpg` | Cardone Equity Fund 9, LLC | JPEG |
| 18 | `dashboard-recent-offerings/18-fund-06-card.jpg` | Cardone Equity Fund 6, LLC | JPEG |
| 19 | `dashboard-recent-offerings/19-fund-08-card.jpg` | Cardone Equity Fund 8, LLC | JPEG |
| 20 | `dashboard-recent-offerings/20-fund-04-card.jpg` | Cardone Equity Fund 4, LLC | JPEG |
| 21 | `dashboard-recent-offerings/21-fund-05-card.jpg` | Cardone Equity Fund 5, LLC | JPEG |
| 22 | `dashboard-recent-offerings/22-fund-03-card.jpg` | Cardone Equity Fund 3, LLC | JPEG |
| 23 | `dashboard-recent-offerings/23-fund-02-card.jpg` | Cardone Equity Fund 2, LLC | JPEG |
| 24 | `dashboard-recent-offerings/24-fund-01-card.jpg` | Cardone Equity Fund 1, LLC | JPEG |

Notes:
- Fund 32's dashboard card photo is a PNG (the rest are JPEG) — the extension already matches the real format.
- Fund 32's New Offerings card uses this same photo; it arrives again as `new-offerings/fund-32-card` in Batch 2.
- Batch 2 (following separately): New Offerings card photos for Funds 29–32, the four Fund 29–32 detail-page hero images, and all 41 Recent Offering property thumbnails. Gallery photos follow after that.

---

# Batch 2: New Offerings cards + Recent Offering property thumbnails

Captured 2026-11-01. All card/thumbnail images are 300x300, shown with object-fit: cover.

## New Offerings — list page cards

Page: New Offerings, route `/opportunities`.

| File | Offering | Format | Status |
|------|----------|--------|--------|
| `new-offerings/fund-29-card.jpg` | Cardone Equity Fund 29, LLC | JPEG | included |
| `new-offerings/fund-30-card.png` | Cardone Equity Fund 30, LLC | PNG | included |
| `new-offerings/fund-31-card.png` | Cardone Equity Fund 31, LLC | PNG | included |
| `new-offerings/fund-32-card.png` | Cardone Equity Fund 32, LLC | PNG | included |

Hero images for the Fund 29-32 detail pages (`/opportunities/81`, `/86`, `/87`, `/88`) are CSS background images; their files (`new-offerings/fund-29-hero.jpg` ... `fund-32-hero.jpg`) will follow in a top-up once extracted.

## Recent Offerings — property asset thumbnails

Page: Recent Offering detail page (route shown per fund), slot: the property asset card photo.
Fund 32's recent page has no property asset cards. Funds 4 and 5 show the same five properties with identical photos.

- **10X Space Coast Fund, LLC** (`/recent_offerings/76`) — `recent-offerings/10x-space-coast/`
  - `10x-space-coast-town-center-thumb.jpg` — 10X Space Coast Town Center
- **Cardone Equity Fund 25, LLC** (`/recent_offerings/75`) — `recent-offerings/fund-25/`
  - `the-edge-at-flagler-village-thumb.jpg` — The Edge at Flagler Village
- **Cardone Equity Fund 24, LLC** (`/recent_offerings/74`) — `recent-offerings/fund-24/`
  - `10x-at-jacaranda-thumb.png` — 10X at Jacaranda
- **Cardone Equity Fund 23, LLC** (`/recent_offerings/73`) — `recent-offerings/fund-23/`
  - `10x-at-flagler-village-thumb.jpg` — 10X at Flagler Village
  - `10x-at-the-forum-thumb.png` — 10X at The Forum
- **Cardone Equity Fund 22, LLC** (`/recent_offerings/53`) — `recent-offerings/fund-22/`
  - `10x-tarpon-springs-thumb.jpg` — 10X Tarpon Springs
  - `the-edison-thumb.jpg` — The Edison
- **Cardone Equity Fund 21, LLC** (`/recent_offerings/49`) — `recent-offerings/fund-21/`
  - `cardone-corporate-center-thumb.jpg` — Cardone Corporate Center
- **Cardone Equity Fund 20, LLC** (`/recent_offerings/46`) — `recent-offerings/fund-20/`
  - `10x-living-at-miami-river-thumb.jpg` — 10X Living at Miami River
- **Cardone Equity Fund 17, LLC** (`/recent_offerings/45`) — `recent-offerings/fund-17/`
  - `10x-living-at-riverwalk-thumb.jpg` — 10X Living at Riverwalk
- **Cardone Equity Fund 16, LLC** (`/recent_offerings/44`) — `recent-offerings/fund-16/`
  - `10x-living-at-las-olas-walk-thumb.jpg` — 10X Living at Las Olas Walk
- **Cardone Equity Fund 18, LLC** (`/recent_offerings/48`) — `recent-offerings/fund-18/`
  - `10x-living-at-sunrise-thumb.jpg` — 10X Living at Sunrise
- **Cardone Equity Fund 15, LLC** (`/recent_offerings/43`) — `recent-offerings/fund-15/`
  - `10x-living-at-15th-street-flats-thumb.jpg` — 10X Living at 15th Street Flats
  - `10x-living-at-heights-waterworks-thumb.jpg` — 10X Living at Heights Waterworks
- **Cardone Equity Fund 14, LLC** (`/recent_offerings/42`) — `recent-offerings/fund-14/`
  - `10x-living-at-mizner-park-thumb.jpg` — 10X Living at Mizner Park
- **Cardone Equity Fund 12, LLC** (`/recent_offerings/41`) — `recent-offerings/fund-12/`
  - `10x-centre-thumb.jpg` — 10X Centre
- **Cardone Equity Fund 11, LLC** (`/recent_offerings/40`) — `recent-offerings/fund-11/`
  - `10x-living-at-fort-lauderdale-thumb.jpg` — 10X Living at Fort Lauderdale
- **Cardone Equity Fund 10, LLC** (`/recent_offerings/39`) — `recent-offerings/fund-10/`
  - `10x-living-at-boca-raton-thumb.jpg` — 10X Living at Boca Raton
- **Cardone Equity Fund 9, LLC** (`/recent_offerings/38`) — `recent-offerings/fund-09/`
  - `10x-living-at-port-royale-thumb.jpg` — 10X Living at Port Royale
- **Cardone Equity Fund 8, LLC** (`/recent_offerings/37`) — `recent-offerings/fund-08/`
  - `10x-living-at-addison-place-thumb.jpg` — 10X Living at Addison Place
  - `10x-living-at-columbia-town-center-thumb.jpg` — 10X Living at Columbia Town Center
  - `10x-living-at-panama-city-beach-thumb.jpg` — 10X Living at Panama City Beach
  - `10x-living-at-retreat-pcb-thumb.jpg` — 10X Living at Retreat PCB
- **Cardone Equity Fund 6, LLC** (`/recent_offerings/36`) — `recent-offerings/fund-06/`
  - `10x-living-at-addison-place-thumb.jpg` — 10X Living at Addison Place
  - `10x-living-at-columbia-town-center-thumb.jpg` — 10X Living at Columbia Town Center
  - `10x-living-at-panama-city-beach-thumb.jpg` — 10X Living at Panama City Beach
  - `10x-living-at-retreat-at-pcb-thumb.jpg` — 10X Living at Retreat at PCB
- **Cardone Equity Fund 5, LLC** (`/recent_offerings/35`) — `recent-offerings/fund-05/`
  - `10x-living-at-breakfast-point-thumb.jpg` — 10X Living at Breakfast Point
  - `10x-living-at-delray-thumb.jpg` — 10X Living at Delray
  - `10x-living-at-naples-thumb.jpg` — 10X Living at Naples
  - `10x-living-at-sawgrass-thumb.jpg` — 10X Living at Sawgrass
  - `10x-living-at-stella-thumb.jpg` — 10X Living at Stella
- **Cardone Equity Fund 4, LLC** (`/recent_offerings/34`) — `recent-offerings/fund-04/` (same properties/photos as Fund 5)
  - `10x-living-at-breakfast-point-thumb.jpg` — 10X Living at Breakfast Point
  - `10x-living-at-delray-thumb.jpg` — 10X Living at Delray
  - `10x-living-at-naples-thumb.jpg` — 10X Living at Naples
  - `10x-living-at-sawgrass-thumb.jpg` — 10X Living at Sawgrass
  - `10x-living-at-stella-thumb.jpg` — 10X Living at Stella
- **Cardone Equity Fund 3, LLC** (`/recent_offerings/33`) — `recent-offerings/fund-03/`
  - `10x-living-at-murano-thumb.jpg` — 10X Living at Murano
  - `10x-living-at-woodway-square-thumb.jpg` — 10X Living at Woodway Square
- **Cardone Equity Fund 2, LLC** (`/recent_offerings/32`) — `recent-offerings/fund-02/`
  - `10x-living-at-ormond-beach-thumb.jpg` — 10X Living at Ormond Beach
- **Cardone Equity Fund 1, LLC** (`/recent_offerings/31`) — `recent-offerings/fund-01/`
  - `10x-living-at-port-st-lucie-thumb.jpg` — 10X Living at Port St. Lucie
