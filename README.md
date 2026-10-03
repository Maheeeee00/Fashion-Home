# Fashion Home — Textile + Apparels

A responsive, animated one-page website built with plain HTML, CSS and JavaScript (no build step).

## Sections
- Home (hero with animated counters)
- About
- Home Textile: Sheets, Comforters, Duvets, Blankets, Towels, Kitchen, Curtains
- Apparels: Men, Women, Kids, Formal, Sportswear
- Contact Us

## Project structure
```
index.html
css/style.css
js/main.js
vercel.json
```

## Run locally
Just open `index.html` in a browser.

## Deploy
1. **GitHub:** create a new repository, then upload all files in this folder (keep the `css` and `js` folders) to the repository root.
2. **Vercel:** go to vercel.com → *Add New → Project* → import the GitHub repo.
   - Framework Preset: **Other**
   - Build Command: leave empty
   - Output Directory: leave empty (root)
   - Click **Deploy** and share the generated `.vercel.app` link.

## Customise
- Contact details: edit the *Contact* section in `index.html`.
- Brand colours: change the variables at the top of `css/style.css` (`--red`, `--gray`, etc.).
- Images: replace the Unsplash URLs in `index.html` with your own product photos.
- The contact form is a front-end demo; connect it to a service like Formspree to receive real messages.
