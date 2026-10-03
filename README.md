# Fashion Home — Textile + Apparels

A responsive, animated multi-page website built with plain HTML, CSS and JavaScript (no build step).

## Pages
| Menu | File |
|---|---|
| Home | `index.html` |
| About | `about.html` |
| Home Textile | `home-textile.html` |
| ↳ Sheets, Comforters, Duvets, Blankets, Towels, Kitchen, Curtains | `sheets.html`, `comforters.html`, `duvets.html`, `blankets.html`, `towels.html`, `kitchen.html`, `curtains.html` |
| Apparels | `apparels.html` |
| ↳ Men, Women, Kids, Formal, Sportswear | `men.html`, `women.html`, `kids.html`, `formal.html`, `sportswear.html` |
| Contact Us | `contact.html` |

All pages share `css/style.css` and `js/main.js`.

## Run locally
Open `index.html` in a browser.

## Deploy
1. **GitHub:** create a new repository and upload everything in this folder (keep the `css` and `js` folders) to the repository root.
2. **Vercel:** vercel.com → *Add New → Project* → import the repo → Framework Preset **Other** → **Deploy**.

## Customise
- Contact details: `contact.html`.
- Brand colours: variables at the top of `css/style.css`.
- Images: replace the Unsplash URLs with your own product photos.
- The contact form is a front-end demo; connect it to a service like Formspree to receive real messages.
- The menu is repeated on every page, so a change to the menu must be made in every HTML file.
