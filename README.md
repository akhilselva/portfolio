# Akhil Selvakumar Portfolio

This repository contains the source for a personal portfolio website for Akhil Selvakumar. It is a lightweight static site built with plain HTML and CSS and designed to present professional background, experience, skills, and contact information in a clean single-page layout.

The site is intended to be served as a static website and includes metadata and supporting assets for search engines, social sharing, favicons, and installable browser support.

## Overview

The portfolio is structured as a single-page website with the following content sections:

- Introductory profile summary
- Professional experience
- Skills and technology stack
- Contact information

The site also includes:

- Open Graph and Twitter metadata for link previews
- Structured data using Schema.org JSON-LD
- A web app manifest
- `robots.txt` and `sitemap.xml` for SEO support
- Multiple favicon and app icon sizes

## Project Structure

```text
.
|-- README.md
|-- index.html
|-- styles.css
|-- robots.txt
|-- sitemap.xml
|-- site.webmanifest
|-- akhil.jpg
|-- apple-touch-icon.png
|-- android-chrome-192x192.png
|-- android-chrome-512x512.png
|-- favicon-16x16.png
|-- favicon-32x32.png
`-- favicon.ico
```

## Files

### `index.html`

The main application file for the portfolio. It contains:

- Core page structure and content
- Professional summary for Akhil Selvakumar
- Experience entries for WebMD, Mastercard, and BrandLock
- Skills rendered as tag-like labels
- Contact links for email and LinkedIn
- SEO and social metadata
- Several JSON-LD structured data blocks describing the person, profile page, website, and webpage

The document references the production domain:

- `https://akhilselva.com/`

It also points to:

- Social preview image: `https://akhilselva.com/akhil.jpg`
- Canonical URL: `https://akhilselva.com/`

### `styles.css`

The stylesheet defines the visual presentation of the portfolio, including:

- Root color variables
- Page typography and spacing
- Card-based layout
- Hover effects for cards, links, and skill tags
- Entry animations such as fade-in and slide-in
- Responsive adjustments for tablet and mobile screen sizes

The styling approach is simple and framework-free, relying entirely on custom CSS.

### `robots.txt`

Allows search engines to crawl the site and declares the sitemap location:

- `https://akhilselva.com/sitemap.xml`

### `sitemap.xml`

Contains the main site URL and a `lastmod` value for crawlers.

### `site.webmanifest`

Provides installable web app metadata and references Android Chrome icon assets. The manifest currently defines:

- `display: standalone`
- White theme color
- White background color

### Image and Icon Assets

The repository includes:

- `akhil.jpg` for profile and social preview usage
- Apple touch icon
- Android Chrome icons in 192x192 and 512x512 sizes
- Standard favicons in `16x16`, `32x32`, and `.ico` formats

## Content Summary

The portfolio presents Akhil Selvakumar as:

- A Senior Software Engineer and Technical Lead
- Currently at WebMD
- Previously at Mastercard and BrandLock
- A full-stack engineer with 7+ years of experience

Highlighted areas of experience include:

- Frontend and backend engineering
- Scalable architecture
- Performance optimization
- SEO and analytics
- Team leadership
- Automated testing and quality workflows

Highlighted technologies include:

- Node.js
- JavaScript
- TypeScript
- Vue.js
- React.js
- Next.js
- Express.js
- NestJS
- Postgres
- MongoDB
- Redis
- Cypress
- Jest
- Puppeteer
- Docker
- Kubernetes
- AWS
- GitHub Actions

## SEO and Structured Data

The site includes several SEO-focused elements directly in `index.html`:

- Author metadata
- Open Graph title, description, image, URL, and type
- Twitter card metadata
- Canonical URL
- Last modified metadata

Structured data is provided using JSON-LD for:

- `Person`
- `WebPage`
- `ProfilePage`
- `WebSite`

These help search engines better understand the page and profile identity represented by the site.

## Design Notes

The current UI uses:

- A centered container layout
- White content cards on a light background
- Blue as the primary accent color
- Lightweight animations for page load and job entries
- Responsive scaling for smaller screens

This keeps the site easy to host, easy to maintain, and fast to render.

## Local Development

This project does not use a framework, package manager, or build step. You can work on it locally by opening the HTML file directly in a browser or by serving the folder with any static file server.

Examples:

1. Open `index.html` directly in a browser.
2. Serve the directory with a simple static server if you want browser behavior closer to production.

Because all assets are referenced as static files, deployment is straightforward.

## Deployment

This repository is suitable for any static hosting platform, such as:

- GitHub Pages
- Netlify
- Vercel static hosting
- Cloudflare Pages
- Traditional web servers serving static files

To deploy, publish the repository root as the site root so that:

- `index.html` is served at `/`
- `styles.css` is served at `/styles.css`
- icons and image assets remain available at their current paths

## Maintenance Notes

When updating the portfolio, likely touchpoints include:

- `index.html` for content, metadata, and structured data changes
- `styles.css` for design updates
- `sitemap.xml` for `lastmod` updates
- `robots.txt` if sitemap or crawl behavior changes
- `site.webmanifest` if app identity or theme settings are updated

It is also a good idea to keep these values aligned whenever content changes:

- Page title
- Open Graph metadata
- Twitter metadata
- Canonical URL
- `lastmod` metadata
- sitemap `lastmod`
- JSON-LD profile details

## Contact Information in the Site

The current contact section points users to:

- Email: `ak@akhilselva.com`
- LinkedIn: `https://linkedin.com/in/akhilselvakumar`

## Notes

- This repository is intentionally minimal and easy to maintain.
- There is no JavaScript application logic outside of embedded structured data.
- No external CSS framework or frontend build system is used.
