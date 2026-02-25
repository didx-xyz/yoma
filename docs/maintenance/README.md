# Maintenance page (GitHub Pages)

This folder contains a static maintenance page for emergency traffic switching.

## File

- `index.html` - page to serve when `yoma.world` is temporarily pointed to GitHub Pages.
- `yoma-logo.webp` - Yoma logo used by the page.

## Intended SRE flow

1. Publish this `index.html` on GitHub Pages.
2. Update Cloudflare DNS so `yoma.world` points to the GitHub Pages endpoint.
3. Once maintenance is complete, revert Cloudflare DNS to the Vercel endpoint.

## Notes

- Keep this page lightweight and static so it can be served from any static host.
- Update only the message copy if needed; avoid adding scripts or external runtime dependencies.

## Local testing

### 1) Test the static page (GitHub Pages equivalent)

Use this to preview the standalone static file:

```bash
cd /home/admin/work/didx/yoma/docs/maintenance
python3 -m http.server 8080
```

Open: `http://localhost:8080/`
