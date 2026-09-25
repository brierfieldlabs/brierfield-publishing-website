# Brierfield Publishing website

Public website for Brierfield Publishing, deployed to GitHub Pages.

## Stack

- Static HTML, CSS and lightweight JavaScript
- Node.js 24 build step
- No front-end framework and no runtime server
- GitHub Pages deployment
- CI on the Brierfield self-hosted runner

## Development

Node.js 24 is the supported build version.

Build with: npm run build
Validate with: npm run check

The build writes the deployable website to dist/.

## Rules

- Git, builds and CI run on Brierfield infrastructure rather than laptops.
- Genuine Brierfield artwork is used where an approved/current asset exists.
- A text treatment is used when there is no authoritative cover image rather than inventing artwork.
- The IONOS-managed public domain remains unchanged until the Pages version is approved for cutover.