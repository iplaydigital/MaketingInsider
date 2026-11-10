# Marketing Insider

An independent, editorial-style publication about how modern marketing actually works —
built as a **zero-dependency static site** (plain HTML, CSS and JavaScript). No build step,
no framework, no package manager.

Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## What's here

| Path | Page |
| --- | --- |
| `index.html` | Home — featured story, most-read strip, latest grid, desks, archive picks |
| `articles.html` | Archive with desk filters + live text search |
| `articles/*.html` | Six full-length stories |
| `about.html` | Mission, editorial standards, team, contact |
| `assets/css/site.css` | Design system and all layout (one file, token-driven) |
| `assets/js/site.js` | Behaviour (one file, no dependencies) |
| `assets/img/` | Six generated cover illustrations + favicon |

## Features

- **Editorial design system** — token-based colour, type and spacing; Inter for UI, Newsreader italic for accents.
- **Light + dark theme**, persisted in `localStorage` and reflected in the browser chrome colour.
- **Command-palette search** (`⌘K` / `Ctrl K` / `/`) with ranked results, arrow-key navigation and an empty state.
- **Archive filtering** — desk pills + text search, live result count, empty state, and shareable `?category=` deep links.
- **Article reading experience** — reading-progress bar, generated table of contents with scrollspy, key-point boxes, pull-stat blocks, author card, related stories.
- **Responsive** down to 360px, with a mobile drawer nav and reduced-motion / print styles.
- Accessible: semantic landmarks, skip link, visible focus rings, labelled controls, `aria-pressed` / `aria-expanded` state.

## Editing

Content is hard-coded in the HTML files, so any page can be edited directly. Shared pieces
(header, footer, newsletter block) are duplicated across pages by design — change them in
each file, or add a generator later if the site grows.

Colours, type and spacing live at the top of `assets/css/site.css` under `:root` and
`[data-theme="dark"]`. Article search results are indexed in the `INDEX` array near the
bottom of `assets/js/site.js` — add an entry when you add a story.
