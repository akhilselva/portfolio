# Akhil Selvakumar Portfolio

Static portfolio and Labs pages for https://akhilselva.com/.

## Run locally

Serve this directory with a static web server, for example `python3 -m http.server 8000`, and open http://localhost:8000. No build step is needed. The portfolio homepage also opens directly as a standalone HTML file.

## Design

The portfolio uses Outfit and Space Mono, a restrained blue accent, and responsive layouts. Labs share `labs/shared.css` and `labs/theme.js`. The homepage keeps its own styles and theme control inline so it remains a single downloadable HTML file.

Appearance follows the system preference initially. The sun/moon toggle stores an explicit choice under `akhil-theme` in local storage, shared across pages on the same origin.

## Pages

- `/`: personal profile, experience, skills, education, and contact details.
- `/labs/`: project directory.
- `/labs/games/tic-tac-toe.html`: local two-player game.
- `/labs/route-planner/`: route, fuel cost, and arrival weather tool.
- `/labs/akhil-anjali-wishlist/`: wishlist and its existing admin interface.

## Existing integrations

The wishlist uses Vue and Vuetify from its existing CDNs and calls the existing wishlist API. The route planner uses its existing OSRM and OpenWeather integrations. Their availability is required for live data. No API endpoint or stored-data format was changed by the redesign.

## Hosting and discovery

Publish this directory as the site root, retaining every subdirectory and asset path. `akhil.jpg` remains the portfolio social preview image. Favicons, `site.webmanifest`, `robots.txt`, and `sitemap.xml` retain their existing paths. Existing `noindex, nofollow` directives on the Labs directory and wishlist are preserved.

## Checks

The redesign is checked in light and dark modes on mobile and desktop. Tool flows are exercised with mocked network responses so validation does not write to the live wishlist or depend on weather services.
