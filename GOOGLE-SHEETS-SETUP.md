# Google Sheets + Google Drive setup

Your website can use a **Google Sheet** as its data backend:

- **Products & categories** are edited in the Sheet, and the website shows them automatically.
- **Pictures** are stored in a **Google Drive** folder.
- **Contact-form enquiries** are saved in the Sheet and emailed to you. Customer attachments are saved in Drive.

It takes about 10 minutes. You only need a Google (Gmail) account.

---

## Step 1: Create the Google Sheet
1. Go to **sheets.google.com** and create a **Blank spreadsheet**.
2. Name it, for example **Fashion Home Website**.

## Step 2: Paste the script
1. In the Sheet, click **Extensions → Apps Script**.
2. Delete everything in the `Code.gs` editor.
3. Open `google-apps-script/Code.gs` from this zip, copy **all** of it, and paste it in.
4. Click the 💾 **Save** icon.

## Step 3: Run setup (one time)
1. At the top of the editor, choose the function **`setup`** in the dropdown and click **▶ Run**.
2. Google asks for permission. Click **Review permissions**, choose your account, then **Advanced → Go to … (unsafe) → Allow**.
   The warning appears because this is your own new script. It only accesses your own Sheet, Drive and email.
3. Go back to the Sheet and reload the page. You will see:
   - three tabs: **Categories**, **Products** and **Enquiries**, already filled with your current website products
   - a new menu, **Fashion Home**
   - a new Drive folder, **Fashion Home - Website Images**

## Step 4: Publish the script as a Web app
1. In Apps Script, click **Deploy → New deployment**.
2. Click the ⚙️ next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy** and copy the **Web app URL**. It ends with `/exec`.

## Step 5: Connect the website
1. Open `js/config.js` and paste the URL between the quotes:
   ```js
   window.FH_CONFIG = {
     SCRIPT_URL: 'https://script.google.com/macros/s/AKfy....../exec'
   };
   ```
2. Upload the changed `js/config.js` to GitHub (**Add file → Upload files → Commit changes**). Vercel updates the site by itself.

To test, open your live site, send a message from **Contact Us**, and check the **Enquiries** tab and your email.

---

## Adding pictures (Google Drive)
1. In the Sheet, use **Fashion Home → Open images folder** and upload your photos there.
   Use simple file names like `sheets-percale.jpg` or `men-oxford-shirt.jpg`.
2. In the **Products** or **Categories** tab, type the file name in the **Image** column.
   You can also paste a Google Drive share link or any image web link.
3. Click **Fashion Home → 2) Link images from Drive folder**.
   This makes the photos viewable on the website and tells you if any file name was not found.

If a product has no Image, the website shows the animated fabric pattern instead.

## Editing products
| Column | What to put |
|---|---|
| **Category** | The category Key, e.g. `sheets`, `towels`, `men`, `sportswear` |
| **Name** | Product name |
| **Description** | One short sentence |
| **Tags** | Comma-separated, e.g. `300 TC, Cotton` |
| **Image** | Photo file name from the Drive folder (optional) |
| **Badge** | Small label like `New` or `Best Seller` (optional) |
| **Show** | `Yes` to show, `No` to hide |
| **Order** | 1, 2, 3 … (position on the page) |

The **Categories** tab controls the big photo used for each category's cards and page banner.
Keep the **Key** values as they are, because they match the website page names.

Changes appear on the website within about **5 minutes**. Use **Fashion Home → Refresh website data now** to speed it up.
Visitors who already have the site open may need to open it in a new tab.

## Enquiries
- Every contact-form message adds a row to **Enquiries**, with date, name, email, phone, interest and message.
- You get an email for each one. Click **Reply** to answer the customer directly.
- Attachments are saved in the private Drive folder **Fashion Home - Enquiry Uploads**. The sheet links to each file.
- Use the **Status** column (New / Contacted / Closed) to track follow-ups.
- To send notifications to a different email, set `NOTIFY_EMAIL` at the top of the script.

## If you change the script later
After any edit to `Code.gs`, publish a new version, otherwise the website keeps using the old one:
**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
The URL stays the same.

## Troubleshooting
- **Website still shows the old products:** wait 5 minutes or use *Refresh website data now*, then open the site in a new tab. Check that `js/config.js` has the right URL ending in `/exec`.
- **Photo not showing:** run *Link images from Drive folder*, and make sure the file is directly inside the images folder, not in a sub-folder.
- **Contact form says it could not send:** in the deployment settings, *Who has access* must be **Anyone**.
- **No email arrives:** check spam. Free Gmail accounts can send about 100 notification emails per day. Enquiries are always saved in the Sheet.
