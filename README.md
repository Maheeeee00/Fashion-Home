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

All pages share `css/style.css`, `js/config.js` and `js/main.js`.

## Google Sheets backend (optional)
Products, category photos and contact-form enquiries can be managed from a Google Sheet, with pictures stored in Google Drive.
See **GOOGLE-SHEETS-SETUP.md**. The script to paste into Google Apps Script is `google-apps-script/Code.gs`.
Until a Web app URL is added to `js/config.js`, the site uses its built-in products and the contact form runs in demo mode.

## Run locally
Open `index.html` in a browser.

## Deploy
1. **GitHub:** create a new repository and upload everything in this folder (keep the `css` and `js` folders) to the repository root.
2. **Vercel:** vercel.com → *Add New → Project* → import the repo → Framework Preset **Other** → **Deploy**.

## Customise
- Contact details: `contact.html` (phone +92 42 3552 5391 is also in the header, mobile menu and footer of every page).
- Brand colours: variables at the top of `css/style.css`.
- Images: replace the Unsplash URLs with your own product photos.
- The menu is repeated on every page, so a change to the menu must be made in every HTML file.
