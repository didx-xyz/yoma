# Maintenance page (GitHub Pages)

This branch contains a static maintenance page for emergency traffic switching.

## Files

- `index.html` - page to serve when `yoma.world` is temporarily pointed to GitHub Pages.
- `yoma.webp` - Yoma logo used by the page.

## Intended SRE flow

1. Publish this branch via GitHub Pages.
2. Update Cloudflare DNS so `yoma.world` points to the GitHub Pages endpoint.
3. Once maintenance is complete, revert Cloudflare DNS to the Vercel endpoint.

## Local testing

```bash
# run from the repository root
python3 -m http.server 8080
```

Open: `http://localhost:8080/`
