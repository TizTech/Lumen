# Lumen

![Lumen Logo](./LOGO.png)

A modern macOS‑first browser built on Chromium with a refined, minimal UI. Lumen focuses on calm browsing: spaces for context, ephemeral tabs, and a compact command surface.

## Features
- Real Chromium browsing (Electron `BrowserView`)
- Tabs + spaces
- Bookmarks & history (local storage)
- Downloads panel
- Arc‑style new‑tab modal (Cmd/Ctrl+T)
- macOS DMG packaging

## Development
```bash
npm install
npm run dev
```

## Build a DMG
```bash
npm run package
```
The DMG will appear in `release/`.

## Notarized DMG (Recommended)
Create an app‑specific password at https://appleid.apple.com and run:

```bash
export APPLE_ID="your-apple-id@email.com"
export APPLE_ID_PASS="app-specific-password"
npm run package
```

## Shortcuts
- Cmd/Ctrl+T: New tab (modal)
- Cmd/Ctrl+B: Toggle sidebar
- Cmd/Ctrl+W: Close tab (or window if only one tab)

