# Brierfield Publishing website

Public website for Brierfield Publishing.

## Status

The production site is live at:

https://brierfieldpublishing.co.uk/

A protected staging copy is available at:

https://brierfieldpublishing.co.uk/staging/

The staging copy is built from the `staging` branch, displays a visible test-site banner, and is marked `noindex,nofollow`.

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

## Deployment

- `main` is the production source.
- `staging` is the test source.
- Pushes to either branch are validated on the Brierfield runner.
- GitHub Pages deploys one combined artifact containing production at the domain root and staging under `/staging/`.
- Changes should normally be reviewed on staging before being promoted to `main`.

## Rules

- Git, builds and CI run on Brierfield infrastructure rather than laptops.
- Genuine Brierfield artwork is used where an approved/current asset exists.
- A text treatment is used when there is no authoritative cover image rather than inventing artwork.
- The production domain is managed through GitHub Pages and IONOS DNS.
- The website does not use release/version numbers in its public presentation or routine commit messages.