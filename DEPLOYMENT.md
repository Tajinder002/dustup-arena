# GitHub Pages deployment checklist

- [ ] (Optional) Run `npm run assets:download` locally to download the rigged character, vehicle sample and HDRI into `assets/`. These binary assets are not bundled in the prepared ZIP; without them, procedural models and generated reflections are used.
- [ ] Upload the complete contents of `dustup-arena/` to the repository root.
- [ ] Confirm `index.html`, `src/`, `styles/`, and `assets/` are all at the same repository level.
- [ ] Open **Settings → Pages**.
- [ ] Set **Deploy from a branch**, choose `main`, and choose `/(root)`.
- [ ] Save, then open the Pages URL shown by GitHub.
- [ ] Test the lobby and all four maps.
- [ ] Host a room in one browser and join it from a second browser/device.
- [ ] Check desktop and touch-device controls and graphics performance.

Do not upload only `index.html`; it imports JavaScript modules and CSS from the accompanying folders. GitHub Pages does not run the Node asset downloader; run that script on your computer before uploading if you want local copies of the optional binary assets.
