# North Stone Photography

A responsive photography portfolio for Sarah, serving Eastern Pennsylvania. Built with Vite, locally hosted fonts, and the photographs supplied in this repository.

## Local development

Use Node.js 22.12 or newer (Node 24 is used in CI).

```sh
npm ci
npm run dev
```

The development server runs at `http://127.0.0.1:5173`. The first run generates responsive photographs and takes longer than later runs.

## Production

```sh
npm run build
npm run preview
```

Publish the contents of `dist/` to your static web host. Relative asset URLs support hosting at either a domain root or a subdirectory. The GitHub workflow builds and tests the website and saves `dist` as an artifact; it does not deploy it automatically.

Vite adds content hashes to JavaScript, CSS, fonts, and photo filenames. When an asset changes, its URL changes, so returning visitors receive the updated asset. Serve `index.html` with `Cache-Control: no-cache`, and hashed `/assets/` files with `Cache-Control: public, max-age=31536000, immutable`. The included `_headers` file applies these settings on hosts that support it, including Netlify and Cloudflare Pages; configure equivalent headers on other hosts. Avoid caching the HTML indefinitely.

## Business details and inquiries

Edit `src/site.js` to update Sarah’s name, service area, booking email, or an optional Instagram URL. No social account, pricing, client reviews, or delivery promises have been invented.

The inquiry form validates session details and prepares an email to `northstonephotography@outlook.com`. Visitors must send it from their email app. The page explains this and provides the direct email address and a link to reopen the draft. Form details are not stored on the website and there is no email delivery backend.

## Photography assets

Original photographs remain under `assets/photos/`. The raw `.CR2` file is preserved and is not served to visitors. Add or replace JPG photos within the existing category folders, then restart development or rebuild.

`scripts/prepare-photos.mjs` generates 480, 960, and 1920 pixel WebP variants, corrects EXIF orientation, and checks source content hashes to avoid reprocessing unchanged images. Generated files live in the ignored `src/generated/` directory; a fresh checkout regenerates them automatically. Every production photo is imported through Vite, including images in the gallery and viewer.

Curated ordering, collection covers, and descriptive alternative text are in `src/portfolio.js`. Add descriptive text there for new photos. The four collections are Graduation, Couples & Engagement, Family, and Maternity.

## Verification

```sh
npm test
npm run build
npm run test:browser
```

Browser checks use an installed Google Chrome in headless mode and start their own production preview on port 4173. They cover all four categories, all 47 portfolio images, load more, photo navigation, Escape and focus restoration, mobile navigation, six viewport sizes (320–1440 px), form validation and email composition, reduced motion, and automated WCAG A/AA checks. Screenshots and accessibility results are written to the ignored `.local/` folder. The test prevents the email draft from opening an external email app.

The design uses keyboard-accessible controls, a native modal photo viewer, lazy images, reserved image dimensions, gentle reveal animations, and a small scroll-linked hero drift. Motion effects respect `prefers-reduced-motion`.
