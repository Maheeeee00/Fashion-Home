# Fashion Home — Textile + Apparels

A responsive, animated multi-page website built with plain HTML, CSS and JavaScript.

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

All pages share `css/style.css`, `js/config.js` and `js/main.js`. Photos are in the `images` folder.

## Google Sheets backend
Products, category photos and contact-form enquiries are managed from a Google Sheet, with pictures stored in Google Drive.
See **GOOGLE-SHEETS-SETUP.md**. The script for Google Apps Script is `google-apps-script/Code.gs`.
The Web app URL in `js/config.js` connects the website to the Sheet.

## Customise
- Contact details: `contact.html` (phone +92 42 3552 5391 is also in the header, mobile menu and footer of every page).
- Brand colours: variables at the top of `css/style.css`.
- Products and product photos: Google Sheet → Products tab.
- The menu is repeated on every page, so a change to the menu must be made in every HTML file.
