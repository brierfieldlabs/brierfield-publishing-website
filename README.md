# Brierfield Publishing website

Public website for Brierfield Publishing.

## Status

Pre-release static site prepared for GitHub Pages.

## Development rules

- Development and Git work run on the Brierfield workbench.
- CI runs on the Brierfield self-hosted CI runner.
- Do not use laptops for Git, builds, or CI.
- The IONOS-managed public domain remains unchanged until the GitHub Pages preview is approved.

## Local preview

From the repository root:

```sh
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`.

## Deployment

Pushes to `main` validate the site and deploy it to GitHub Pages after the CT-based validation job succeeds.