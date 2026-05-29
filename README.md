# NYC Gallery Radar — Small Prototype

A tiny demo of your gallery-opening idea: a map of NYC shows, artist links, and a personal saved list.

**No coding experience needed to run this.**

---

## What this prototype does

- **Dark, minimal layout** inspired by [NOLA Livewire](https://nola-livewire-niels.fly.dev/)
- **Map** or **List** view (toggle at top)
- **All** or **Saved** filter
- 14 sample shows — including 5 in **Williamsburg**
- Color-coded venue types, artist links, and browser-based saves

This uses **sample data** (not live feeds). The goal is to see if the idea feels right before building something bigger.

---

## How to open it (2 minutes)

### Option A — Easiest (Mac)

1. Open Finder
2. Go to `Documents → AI Playground → nyc-gallery-radar`
3. **Double-click `index.html`**
4. It opens in your web browser

> Some browsers block maps when opening files directly. If the map looks broken, use Option B.

### Option B — If the map does not load

1. Open **Terminal** (Spotlight → type "Terminal")
2. Copy and paste this line, then press Enter:

```bash
cd "/Users/gradwell/Documents/AI Playground/nyc-gallery-radar" && python3 -m http.server 8080
```

3. Open your browser and go to: **http://localhost:8080**
4. When you are done, go back to Terminal and press **Ctrl + C** to stop

---

## Project files (what each piece does)

| File | Purpose |
|------|---------|
| `index.html` | The page you see — layout and structure |
| `css/style.css` | Colors, fonts, spacing |
| `js/data.js` | Sample shows, venues, and artists (fake but realistic) |
| `js/app.js` | Map, clicking pins, saving shows |
| `README.md` | This guide |

Think of it like a mini website split into four files instead of one giant document.

---

## How saving works

When you click **Save show**, your browser remembers it in **local storage** (a small private notebook inside Chrome or Safari). It stays on your computer. Clear your browser data for this site and saved shows disappear.

---

## Next steps (when you are ready)

1. **Add real shows** — edit `js/data.js` and copy the format of existing entries
2. **Add neighborhoods** — more pins in Bushwick, Ridgewood, etc.
3. **Upgrade to a real app** — install [Node.js](https://nodejs.org), then we can move this to Next.js with a database and live data

---

## Quick glossary

| Term | Plain English |
|------|----------------|
| **Prototype** | A rough first version to test an idea |
| **HTML** | The skeleton of a web page |
| **CSS** | Makes it look good |
| **JavaScript (JS)** | Makes buttons, map, and save work |
| **localStorage** | Browser memory for your saved list |
| **localhost** | "This computer" — a private way to preview a site |
