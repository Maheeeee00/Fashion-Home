/**
 * ================================================================
 *  FASHION HOME — Google Sheets backend for the website
 * ================================================================
 *  What this script does
 *   • Website reads Categories + Products from this Google Sheet.
 *   • Product / category photos are stored in a Google Drive folder.
 *   • Contact-form enquiries are saved to the "Enquiries" sheet,
 *     emailed to you, and any attached picture is saved to Drive.
 *
 *  How to install (full guide: GOOGLE-SHEETS-SETUP.md)
 *   1. In your Google Sheet: Extensions → Apps Script.
 *   2. Delete everything in Code.gs, paste this whole file, Save.
 *   3. Choose the function "setup" at the top and click Run
 *      (allow the permissions it asks for).
 *   4. Deploy → New deployment → type "Web app"
 *        Execute as: Me      Who has access: Anyone
 *      Copy the Web app URL (ends with /exec) into js/config.js.
 *
 *  After editing THIS code later, always:
 *   Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy
 * ================================================================
 */

const CONFIG = {
  SHEET_ID: '',                                     // leave empty when the script is opened from the Sheet
  IMAGES_FOLDER: 'Fashion Home - Website Images',   // put product/category photos here
  UPLOADS_FOLDER: 'Fashion Home - Enquiry Uploads', // customer attachments are saved here (private)
  NOTIFY_EMAIL: '',                                 // empty = your own Google account email
  CACHE_SECONDS: 300,                               // website data refreshes at least every 5 minutes
  MAX_UPLOAD_MB: 5,
};

const SH = { PRODUCTS: 'Products', CATEGORIES: 'Categories', ENQUIRIES: 'Enquiries' };
const HEAD = {
  Categories: ['Key', 'Name', 'Group', 'Image', 'Show'],
  Products:   ['Category', 'Name', 'Description', 'Tags', 'Image', 'Badge', 'Show', 'Order'],
  Enquiries:  ['Date', 'Name', 'Email', 'Phone', 'Interest', 'Message', 'Attachment', 'Page', 'Status'],
};
const CACHE_KEY = 'fh_data_v1';

/* ================================================================
   Sheet menu
   ================================================================ */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Fashion Home')
    .addItem('1) Set up sheets & Drive folders', 'setup')
    .addItem('2) Link images from Drive folder', 'syncImages')
    .addSeparator()
    .addItem('Refresh website data now', 'refreshNow')
    .addItem('Open images folder', 'openImagesFolder')
    .addItem('Help', 'showHelp')
    .addToUi();
}

// Any edit in the sheet makes the website pick up the change on next load.
function onEdit() { clearCache_(); }

/* ================================================================
   Step 0 (optional): run this first if "setup" shows an error.
   It only asks Google for the permissions the script needs.
   ================================================================ */
function authorize() {
  const ss = ss_();
  DriveApp.getRootFolder().getName();
  MailApp.getRemainingDailyQuota();
  CacheService.getScriptCache().get('x');
  console.log('Permissions OK for "' + ss.getName() + '". Now run "setup".');
}

/* ================================================================
   One-time setup
   ================================================================ */
function setup() {
  const ss = ss_();
  console.log('Setting up "' + ss.getName() + '" …');
  const cat = setupSheet_(ss, SH.CATEGORIES, HEAD.Categories, SEED_CATEGORIES, [120, 160, 130, 320, 70]);
  const prod = setupSheet_(ss, SH.PRODUCTS, HEAD.Products, SEED_PRODUCTS, [120, 200, 340, 200, 260, 110, 70, 70]);
  const enq = setupSheet_(ss, SH.ENQUIRIES, HEAD.Enquiries, [], [150, 150, 200, 140, 150, 360, 220, 140, 110]);

  const yesNo = SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(false).build();
  cat.getRange('E2:E').setDataValidation(yesNo);
  prod.getRange('G2:G').setDataValidation(yesNo);
  prod.getRange('A2:A').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(cat.getRange('A2:A'), true).setAllowInvalid(true).build());
  prod.getRange('C2:C').setWrap(true);
  enq.getRange('F2:F').setWrap(true);
  enq.getRange('A2:A').setNumberFormat('dd-mmm-yyyy hh:mm');
  enq.getRange('I2:I').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Contacted', 'Closed'], true).build());

  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);

  let folderInfo = '';
  try {
    const images = imagesFolder_();
    try { images.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    uploadsFolder_();
    folderInfo = images.getUrl();
  } catch (e) {
    folderInfo = '(Drive folders could not be created yet: ' + e.message + ' — run setup again later.)';
  }
  clearCache_();

  note_(ss, 'Setup complete ✔',
    'Sheets are ready: Categories, Products, Enquiries.\n\n' +
    'Upload website photos to this Drive folder:\n' + folderInfo + '\n\n' +
    'Then type the photo file name (e.g. sheets-percale.jpg) in the "Image" column ' +
    'and use menu Fashion Home → 2) Link images from Drive folder.\n\n' +
    'Next: Deploy → New deployment → Web app (Execute as: Me, Access: Anyone).');
}

function setupSheet_(ss, name, headers, seed, widths) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (seed.length) sh.getRange(2, 1, seed.length, headers.length).setValues(seed);
  }
  sh.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#a3243b');
  sh.setFrozenRows(1);
  (widths || []).forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

/* ================================================================
   Drive images
   ================================================================ */
function syncImages() {
  const map = imageMap_(true); // also makes every photo viewable by link
  const ss = ss_();
  const missing = [];
  [SH.CATEGORIES, SH.PRODUCTS].forEach(name => {
    rows_(ss.getSheetByName(name)).forEach(r => {
      if (r.Image && !imageUrl_(r.Image, map)) missing.push(`${name} row ${r._row}: "${r.Image}"`);
    });
  });
  clearCache_();
  ui_('Images linked',
    `${new Set(Object.values(map)).size} photo(s) found in "${CONFIG.IMAGES_FOLDER}" and made viewable on the website.` +
    (missing.length ? '\n\nThese Image names were NOT found in the folder:\n' + missing.slice(0, 20).join('\n') : '\n\nAll Image names matched ✔'));
}

function imageMap_(share) {
  const map = {};
  const files = imagesFolder_().getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (!/^image\//.test(f.getMimeType())) continue;
    if (share) { try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {} }
    const n = f.getName().toLowerCase().trim();
    map[n] = f.getId();
    map[n.replace(/\.[a-z0-9]+$/, '')] = f.getId();
  }
  return map;
}

/** Image cell can be: a file name in the images folder, a Drive share link, a Drive file ID, or any https URL. */
function imageUrl_(value, map) {
  const v = String(value || '').trim();
  if (!v) return '';
  const m = v.match(/\/d\/([-\w]{20,})/) || v.match(/[?&]id=([-\w]{20,})/);
  if (m && /google\.com/i.test(v)) return driveUrl_(m[1]);
  if (/^https?:\/\//i.test(v)) return v;
  const k = v.toLowerCase();
  if (map[k]) return driveUrl_(map[k]);
  const k2 = k.replace(/\.[a-z0-9]+$/, '');
  if (map[k2]) return driveUrl_(map[k2]);
  if (/^[-\w]{25,}$/.test(v)) return driveUrl_(v);
  return '';
}
function driveUrl_(id) { return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600'; }

/* ================================================================
   Website API — GET returns all categories + products as JSON
   ================================================================ */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'all';
    if (action === 'ping') return json_({ ok: true, time: new Date().toISOString() });
    const cache = CacheService.getScriptCache();
    let out = cache.get(CACHE_KEY);
    if (!out) {
      out = JSON.stringify(buildData_());
      if (out.length < 95000) cache.put(CACHE_KEY, out, CONFIG.CACHE_SECONDS);
    }
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function buildData_() {
  const ss = ss_();
  const map = imageMap_(false);
  const categories = rows_(ss.getSheetByName(SH.CATEGORIES))
    .filter(r => r.Key && show_(r.Show))
    .map(r => ({ key: slug_(r.Key), name: str_(r.Name), group: str_(r.Group), image: imageUrl_(r.Image, map) }));

  const toKey = {};
  categories.forEach(c => { toKey[c.key] = c.key; toKey[c.name.toLowerCase()] = c.key; });

  const products = {};
  rows_(ss.getSheetByName(SH.PRODUCTS))
    .filter(r => r.Name && r.Category && show_(r.Show))
    .map(r => ({
      category: toKey[str_(r.Category).toLowerCase()] || slug_(r.Category),
      name: str_(r.Name),
      description: str_(r.Description),
      tags: str_(r.Tags).split(',').map(t => t.trim()).filter(Boolean),
      image: imageUrl_(r.Image, map),
      badge: str_(r.Badge),
      order: Number(r.Order) || 9999 + r._row,
    }))
    .sort((a, b) => a.order - b.order)
    .forEach(p => { (products[p.category] = products[p.category] || []).push(p); });

  return { ok: true, updated: new Date().toISOString(), categories, products };
}

/* ================================================================
   Website API — POST saves a contact-form enquiry
   ================================================================ */
function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return json_({ ok: true });            // spam trap field filled by bots

    const name = clean_(d.name, 100);
    const email = clean_(d.email, 150);
    const phone = clean_(d.phone, 40);
    const interest = clean_(d.interest, 60);
    const message = clean_(d.message, 3000);
    const page = clean_(d.page, 120);
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({ ok: false, error: 'Please fill in your name, a valid email and a message.' });
    }

    let attachment = '';
    if (d.file && d.file.data) attachment = saveUpload_(d.file, name);

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const ss = ss_();
      const sh = ss.getSheetByName(SH.ENQUIRIES) || setupSheet_(ss, SH.ENQUIRIES, HEAD.Enquiries, []);
      sh.appendRow([new Date(), safe_(name), safe_(email), phone ? "'" + phone : '', safe_(interest), safe_(message), attachment, safe_(page), 'New']);
    } finally {
      lock.releaseLock();
    }

    notify_({ name, email, phone, interest, message, attachment });
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function saveUpload_(file, who) {
  const type = String(file.type || '').toLowerCase();
  if (!/^(image\/(jpeg|jpg|png|webp|gif|heic|heif)|application\/pdf)$/.test(type)) {
    throw new Error('Only image (JPG, PNG, WEBP) or PDF files can be attached.');
  }
  const bytes = Utilities.base64Decode(String(file.data).replace(/^data:[^,]*,/, ''));
  if (bytes.length > CONFIG.MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error('Attachment is larger than ' + CONFIG.MAX_UPLOAD_MB + ' MB.');
  }
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  const fileName = (stamp + ' - ' + who + ' - ' + (file.name || 'attachment')).replace(/[\\/:*?"<>|]/g, '_').slice(0, 150);
  return uploadsFolder_().createFile(Utilities.newBlob(bytes, type, fileName)).getUrl();
}

function notify_(d) {
  try {
    const to = CONFIG.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
    if (!to) return;
    const row = (k, v) => v ? `<tr><td style="padding:6px 12px;color:#777">${k}</td><td style="padding:6px 12px">${esc_(v)}</td></tr>` : '';
    MailApp.sendEmail({
      to,
      replyTo: d.email,
      subject: 'New website enquiry — ' + d.name + (d.interest ? ' (' + d.interest + ')' : ''),
      htmlBody:
        '<h2 style="font-family:Georgia,serif;color:#a3243b">New enquiry from your website</h2>' +
        '<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
        row('Name', d.name) + row('Email', d.email) + row('Phone', d.phone) + row('Interested in', d.interest) +
        row('Message', d.message) + (d.attachment ? `<tr><td style="padding:6px 12px;color:#777">Attachment</td><td style="padding:6px 12px"><a href="${d.attachment}">Open file</a></td></tr>` : '') +
        '</table><p style="font-family:Arial;font-size:12px;color:#999">Reply to this email to answer the customer directly. All enquiries are listed in your Google Sheet.</p>',
    });
  } catch (e) { /* email quota or permission issue — enquiry is still saved in the sheet */ }
}

/* ================================================================
   Menu helpers
   ================================================================ */
function refreshNow() {
  clearCache_();
  ss_().toast('The website will show your latest changes on the next page load.', 'Fashion Home', 5);
}

function openImagesFolder() {
  const url = imagesFolder_().getUrl();
  const html = HtmlService.createHtmlOutput(
    `<p style="font-family:Arial">Upload your website photos here:</p><p><a href="${url}" target="_blank" style="font-family:Arial;font-size:16px">Open "${esc_(CONFIG.IMAGES_FOLDER)}" ↗</a></p>`
  ).setWidth(380).setHeight(130);
  SpreadsheetApp.getUi().showModalDialog(html, 'Images folder');
}

function showHelp() {
  ui_('Fashion Home — how it works',
    'CATEGORIES sheet\n• Key must match the page name (sheets, comforters, men …).\n• Image = photo used on the category cards and banner.\n\n' +
    'PRODUCTS sheet\n• Category = a Key from the Categories sheet.\n• Tags = comma separated, e.g. "300 TC, Cotton".\n' +
    '• Image = file name in the Drive images folder (or a Drive link). Empty = fabric pattern.\n' +
    '• Badge = small label such as New or Best Seller.\n• Show = No hides the row.  Order = position (1, 2, 3 …).\n\n' +
    'ENQUIRIES sheet\n• Filled automatically by the website contact form.\n\n' +
    'Changes appear on the website within 5 minutes (or use "Refresh website data now").');
}

/* ================================================================
   Utilities
   ================================================================ */
function ss_() {
  if (CONFIG.SHEET_ID) return SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from your Google Sheet (Extensions → Apps Script) or set CONFIG.SHEET_ID.');
  return ss;
}

function folder_(name, propKey) {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(propKey);
  if (id) {
    try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {}
  }
  const it = DriveApp.getFoldersByName(name);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(name);
  props.setProperty(propKey, f.getId());
  return f;
}
function imagesFolder_() { return folder_(CONFIG.IMAGES_FOLDER, 'IMAGES_FOLDER_ID'); }
function uploadsFolder_() { return folder_(CONFIG.UPLOADS_FOLDER, 'UPLOADS_FOLDER_ID'); }

function rows_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const head = values.shift().map(h => String(h).trim());
  return values.map((r, i) => {
    const o = { _row: i + 2 };
    head.forEach((h, j) => { o[h] = r[j]; });
    return o;
  }).filter(o => head.some(h => String(o[h]).trim() !== ''));
}

function show_(v) { return !/^(no|false|0|hide|hidden)$/i.test(String(v).trim()); }
function str_(v) { return String(v == null ? '' : v).trim(); }
function slug_(v) { return str_(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function clean_(v, max) { return str_(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max); }
function safe_(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; } // stop formulas being injected into the sheet
function esc_(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function clearCache_() { try { CacheService.getScriptCache().remove(CACHE_KEY); } catch (e) {} }
/** Non-blocking message: shows a small toast in the Sheet and writes to the Execution log. */
function note_(ss, title, msg) {
  console.log(title + '\n' + msg);
  try { ss.toast(msg.split('\n')[0], title, 10); } catch (e) {}
}
function ui_(title, msg) {
  try { SpreadsheetApp.getUi().alert(title, msg, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { Logger.log(title + '\n' + msg); }
}

/* ================================================================
   Starting data — copied from the current website.
   Only used by setup() when the sheets are empty.
   ================================================================ */
const SEED_CATEGORIES = [
  ["sheets", "Sheets", "Home Textile", "", "Yes"],
  ["comforters", "Comforters", "Home Textile", "", "Yes"],
  ["duvets", "Duvets", "Home Textile", "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80", "Yes"],
  ["blankets", "Blankets", "Home Textile", "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=1200&q=80", "Yes"],
  ["towels", "Towels", "Home Textile", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80", "Yes"],
  ["kitchen", "Kitchen", "Home Textile", "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80", "Yes"],
  ["curtains", "Curtains", "Home Textile", "https://images.unsplash.com/photo-1629302477738-32f97d5c86e4?w=1200&q=80", "Yes"],
  ["men", "Men", "Apparels", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80", "Yes"],
  ["women", "Women", "Apparels", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80", "Yes"],
  ["kids", "Kids", "Apparels", "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&q=80", "Yes"],
  ["formal", "Formal", "Apparels", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80", "Yes"],
  ["sportswear", "Sportswear", "Apparels", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80", "Yes"]
];

const SEED_PRODUCTS = [
  ["sheets", "Classic Percale Set", "Breathable 300TC percale with a crisp, matte finish.", "300 TC, 100% Cotton", "", "New", "Yes", 1],
  ["sheets", "Luxury Sateen Set", "Silky 600TC sateen weave with a soft sheen.", "600 TC, Sateen", "", "Best Seller", "Yes", 2],
  ["sheets", "Stonewashed Linen Set", "Relaxed, airy linen that softens over time.", "Linen, All-season", "", "", "Yes", 3],
  ["sheets", "Striped Hotel Set", "Timeless satin stripe used by luxury hotels.", "Hotel, 400 TC", "", "", "Yes", 4],
  ["sheets", "Printed Cotton Set", "Fresh seasonal prints on soft cotton.", "Printed, Kids & Teens", "", "", "Yes", 5],
  ["sheets", "Egyptian Cotton Set", "Ultra-fine 1000TC for the ultimate sleep.", "1000 TC, Premium", "", "", "Yes", 6],
  ["comforters", "All-Season Comforter", "Medium-weight fill for comfort in every season.", "Microfibre, Box-stitch", "", "New", "Yes", 1],
  ["comforters", "Winter Heavyweight", "Extra loft and warmth for cold nights.", "High loft, Winter", "", "Best Seller", "Yes", 2],
  ["comforters", "Summer Light", "Thin, breathable layer for warm climates.", "Lightweight, Cotton shell", "", "", "Yes", 3],
  ["comforters", "Down Alternative", "The feel of down without the allergens.", "Hypoallergenic", "", "", "Yes", 4],
  ["comforters", "Quilted Bedspread", "Decorative quilting that doubles as a cover.", "Quilted, Reversible", "", "", "Yes", 5],
  ["comforters", "Comforter Set 7-pc", "Comforter, shams and cushions in one bag.", "Bed-in-a-bag", "", "", "Yes", 6],
  ["duvets", "Plain Dyed Cover", "Clean solid colours in soft cotton.", "Solid, Button closure", "", "New", "Yes", 1],
  ["duvets", "Embroidered Cover", "Delicate border embroidery for a refined look.", "Embroidered", "", "Best Seller", "Yes", 2],
  ["duvets", "Waffle Texture Cover", "Textured waffle weave adds depth.", "Textured", "", "", "Yes", 3],
  ["duvets", "Printed Floral Cover", "Soft florals printed with low-impact dyes.", "Printed, Eco dyes", "", "", "Yes", 4],
  ["duvets", "Duvet Insert", "Light, lofty insert with corner tabs.", "Insert, Corner tabs", "", "", "Yes", 5],
  ["duvets", "Reversible Cover", "Two looks in one cover.", "Reversible", "", "", "Yes", 6],
  ["blankets", "Flannel Fleece", "Velvety, lightweight and super warm.", "Fleece, 280 GSM", "", "New", "Yes", 1],
  ["blankets", "Sherpa Throw", "Fleece front with fluffy sherpa reverse.", "Sherpa, Reversible", "", "Best Seller", "Yes", 2],
  ["blankets", "Chunky Knit Throw", "Hand-feel knit for a cosy look.", "Knitted", "", "", "Yes", 3],
  ["blankets", "Cotton Waffle Blanket", "Breathable all-year blanket.", "Cotton, Waffle", "", "", "Yes", 4],
  ["blankets", "Mink Blanket", "Heavy, plush and luxurious.", "Heavyweight", "", "", "Yes", 5],
  ["blankets", "Baby Blanket", "Extra-soft and gentle on skin.", "Baby, OEKO-TEX", "", "", "Yes", 6],
  ["towels", "Bath Towel", "Plush 600 GSM terry for everyday luxury.", "600 GSM, Ring-spun", "", "New", "Yes", 1],
  ["towels", "Hand Towel", "Quick-drying and soft for daily use.", "Hand, Dobby border", "", "Best Seller", "Yes", 2],
  ["towels", "Turkish Peshtemal", "Light, flat-woven and quick drying.", "Turkish, Beach", "", "", "Yes", 3],
  ["towels", "Waffle Bath Towel", "Lightweight texture that dries fast.", "Waffle", "", "", "Yes", 4],
  ["towels", "Hotel Collection", "Durable white towels for hospitality.", "Hotel, Bulk", "", "", "Yes", 5],
  ["towels", "Bath Sheet", "Extra-large wrap-around size.", "Oversize, 700 GSM", "", "", "Yes", 6],
  ["kitchen", "Tea Towel Set", "Absorbent cotton in checks and stripes.", "Set of 3, Cotton", "", "New", "Yes", 1],
  ["kitchen", "Chef Apron", "Heavy canvas with adjustable strap.", "Canvas, Pockets", "", "Best Seller", "Yes", 2],
  ["kitchen", "Oven Mitt & Pot Holder", "Heat-resistant quilted padding.", "Heat-safe", "", "", "Yes", 3],
  ["kitchen", "Table Cloth", "Stain-resistant finish, many sizes.", "Table linen", "", "", "Yes", 4],
  ["kitchen", "Placemats & Napkins", "Coordinated dining sets.", "Dining, Set", "", "", "Yes", 5],
  ["kitchen", "Table Runner", "Elegant runners for any table.", "Decor", "", "", "Yes", 6],
  ["curtains", "Sheer Voile", "Soft, airy panels that filter light.", "Sheer, Eyelet", "", "New", "Yes", 1],
  ["curtains", "Blackout Curtain", "Triple-weave for 99% light blocking.", "Blackout, Thermal", "", "Best Seller", "Yes", 2],
  ["curtains", "Jacquard Curtain", "Woven patterns with a luxurious feel.", "Jacquard", "", "", "Yes", 3],
  ["curtains", "Linen-Look Curtain", "Natural texture for modern spaces.", "Linen-look", "", "", "Yes", 4],
  ["curtains", "Velvet Curtain", "Rich velvet for a dramatic finish.", "Velvet", "", "", "Yes", 5],
  ["curtains", "Kids Room Curtain", "Fun prints with blackout lining.", "Kids, Lined", "", "", "Yes", 6],
  ["men", "Oxford Shirt", "Classic button-down in soft oxford cotton.", "Cotton, Regular fit", "", "New", "Yes", 1],
  ["men", "Polo T-Shirt", "Breathable piqué knit polo.", "Piqué, Casual", "", "Best Seller", "Yes", 2],
  ["men", "Chino Trousers", "Stretch cotton chinos for all-day comfort.", "Stretch", "", "", "Yes", 3],
  ["men", "Denim Jeans", "Durable denim in slim and straight cuts.", "Denim", "", "", "Yes", 4],
  ["men", "Crew Neck Tee", "Soft combed-cotton basics.", "Basics, 180 GSM", "", "", "Yes", 5],
  ["men", "Hoodie", "Brushed fleece hoodie for cool days.", "Fleece", "", "", "Yes", 6],
  ["women", "Maxi Dress", "Flowing silhouette in light viscose.", "Viscose, Summer", "", "New", "Yes", 1],
  ["women", "Lawn Suit 3-pc", "Printed lawn with chiffon dupatta.", "Eastern, Lawn", "", "Best Seller", "Yes", 2],
  ["women", "Blouse", "Elegant tops for work and weekends.", "Tops", "", "", "Yes", 3],
  ["women", "Lounge Set", "Soft jersey set for relaxing at home.", "Lounge, Jersey", "", "", "Yes", 4],
  ["women", "Kurti", "Easy everyday kurti in cotton.", "Cotton, Casual", "", "", "Yes", 5],
  ["women", "Night Suit", "Breathable sleepwear in prints.", "Sleepwear", "", "", "Yes", 6],
  ["kids", "Baby Romper", "Snap-button rompers in organic cotton.", "0–24 months, Organic", "", "New", "Yes", 1],
  ["kids", "Graphic Tee", "Fun prints kids love.", "Printed", "", "Best Seller", "Yes", 2],
  ["kids", "Jogger Pants", "Comfy elastic-waist joggers.", "Play-ready", "", "", "Yes", 3],
  ["kids", "School Uniform", "Durable shirts and trousers.", "Uniform, Bulk", "", "", "Yes", 4],
  ["kids", "Party Dress", "Twirl-worthy dresses for special days.", "Occasion", "", "", "Yes", 5],
  ["kids", "Pyjama Set", "Soft, cosy sleepwear.", "Sleepwear", "", "", "Yes", 6],
  ["formal", "Two-Piece Suit", "Wool-blend suit with a modern cut.", "Wool blend, Tailored", "", "New", "Yes", 1],
  ["formal", "Blazer", "Single-breasted blazer for smart looks.", "Blazer", "", "Best Seller", "Yes", 2],
  ["formal", "Dress Shirt", "Easy-iron cotton dress shirts.", "Easy-iron", "", "", "Yes", 3],
  ["formal", "Formal Trousers", "Flat-front trousers with sharp creases.", "Office", "", "", "Yes", 4],
  ["formal", "Waistcoat", "Perfect for weddings and events.", "Occasion", "", "", "Yes", 5],
  ["formal", "Women’s Office Suit", "Tailored blazer and trousers.", "Women, Office", "", "", "Yes", 6],
  ["sportswear", "Track Suit", "Jacket and joggers in soft poly-knit.", "Track, Unisex", "", "New", "Yes", 1],
  ["sportswear", "Dri-Fit Tee", "Moisture-wicking training tee.", "Quick-dry", "", "Best Seller", "Yes", 2],
  ["sportswear", "Leggings", "Squat-proof four-way stretch.", "Stretch, Women", "", "", "Yes", 3],
  ["sportswear", "Shorts", "Lightweight running shorts.", "Running", "", "", "Yes", 4],
  ["sportswear", "Team Jersey", "Custom sublimated kits for teams.", "Custom, Bulk", "", "", "Yes", 5],
  ["sportswear", "Windbreaker", "Light, water-resistant shell.", "Outerwear", "", "", "Yes", 6]
];

