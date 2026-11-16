# Celjie Magbunag · Portfolio

A static portfolio site with one Vercel serverless function for the contact workflow.
No build step is needed: Vercel serves the files as they are.

## What's inside

```
index.html          the page (fonts and styles)
app.js              the page's content and interactions
vendor/             React 18 (bundled, so the site has no outside script dependencies)
assets/             images: photo, ID cut-out, hero scenery, Mayon Volcano, coconut palm, app icons, Grok logo
api/contact.js      POST /api/contact: emails you, then auto-replies to the visitor (Gmail SMTP)
package.json        tells Vercel to install nodemailer for the function
```

## Deploy

1. Create a new GitHub repository and upload everything in this folder (keep the folder structure).
2. In Vercel: **Add New → Project → Import** that repository.
   - Framework Preset: **Other**
   - Build Command: leave empty
   - Output Directory: leave empty
3. Before (or after) the first deploy, open **Settings → Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `GMAIL_USER` | `magbunagceljie@gmail.com` |
   | `GMAIL_APP_PASSWORD` | your 16-character Google App Password |

   Optional: `CONTACT_TO_EMAIL` (send messages to a different inbox).
4. **Redeploy** so the function picks up the variables.

## Google App Password

Google Account → **Security** → turn on **2-Step Verification** → search **App passwords** →
create one named "Portfolio" → copy the 16-character password into `GMAIL_APP_PASSWORD`.
Never put the password in the code or in GitHub.

## Test

Open your live site, click **Email me** (or the first node of the workflow), fill in the form and press
**Run workflow**. You should get the message in Gmail, and the address you typed gets a thank-you reply.
If something fails, check **Vercel → your project → Logs**.

## Editing later

- Project links ("Open app" buttons) and the contact endpoint live near the top of `app.js`
  (search for `talyerv1` / `pinv1` / `/api/contact`).
- Skill percentages: search `LEVELS` in `app.js`.
