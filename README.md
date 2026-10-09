# Brierfield Publishing website

Public website for Brierfield Publishing.

## Status

The production site is live at:

https://brierfieldpublishing.co.uk/

A protected staging copy is available at:

https://brierfieldpublishing.co.uk/staging/

The staging copy is built from the `staging` branch, displays a visible test-site banner, is marked `noindex,nofollow`, has a blocking staging `robots.txt`, and does not publish a staging sitemap.

Production search metadata includes canonical URLs, explicit `index,follow`, XML sitemap discovery, Open Graph/Twitter metadata and Organization JSON-LD on the home page. `npm run check` validates those search-facing artifacts.

## Stack

- Static HTML, CSS and lightweight JavaScript
- Node.js 24 build step
- No front-end framework and no runtime server
- GitHub Pages deployment
- CI on the Brierfield self-hosted runner

## Development

Node.js 24 is the supported build version.

Build with:

`npm run build`

Validate with:

`npm run check`

The normal build writes the deployable website to `dist/`.

### Publishing Hub release data

Website presentation data remains in `src/books.json`. An exact Publishing Hub staging handoff may additionally be stored as `src/hub-release-feed.json`.

During the build, matching title slugs are overlaid with Hub-owned release/catalogue truth while website-owned category and artwork choices are preserved. Recent-release cards are then derived from the resulting publication dates rather than a hard-coded list.

To copy an exact Hub handoff into the website source:

`npm run sync:hub-release -- /path/to/hub-staging-handoff.json`

That command is intentionally guarded. It runs only when the checked-out Git branch is exactly `staging`, explicitly refuses `main`, and also refuses feature branches. Feature work tests the overlay logic without performing a real handoff.

A successful Hub sync or staging build never grants production approval.

## Deployment

- `main` is the production source.
- `staging` is the test source.
- Pushes to either branch are validated on the Brierfield runner.
- GitHub Pages deploys one combined artifact containing production at the domain root and staging under `/staging/`.
- **Mandatory release gate:** every change MUST be reviewed on `staging` first. Promotion to `main` requires an explicit instruction to publish/promote the reviewed change. See [`RULEBOOK.md`](RULEBOOK.md).

## Rules

The mandatory website operating rules are documented in [`RULEBOOK.md`](RULEBOOK.md). The production release gate is non-optional.

- Git, builds and CI run on Brierfield infrastructure rather than laptops.
- Genuine Brierfield artwork is used where an approved/current asset exists.
- A text treatment is used when there is no authoritative cover image rather than inventing artwork.
- The production domain is managed through GitHub Pages and IONOS DNS.
- The website does not use release/version numbers in its public presentation or routine commit messages.
