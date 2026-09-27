# Order Management System

A complete Order Management System for a shop owner — customers, products,
orders, editable invoices, and Gujarati PDF invoice generation — built with
Node.js, Express, MongoDB, and EJS.

## Features

- Secure single-owner login (session-based, bcrypt password hashing)
- Dashboard with live stats (customers, products, orders, today's/this
  month's orders) and 10 latest orders / recent customers
- Customers: add, edit, delete, search, view details + order history
- Products: add, edit, delete, search — Hinglish name auto-transliterated
  to Gujarati (editable before saving)
- Orders: create, **edit anytime**, delete, search, filter by date /
  customer, sort newest/oldest, pagination
- Today's Orders page
- Gujarati PDF invoice generation (Puppeteer + Noto Sans Gujarati font)
- Responsive Bootstrap 5 UI: sidebar nav, cards, tables, delete
  confirmation modal, toasts, loading spinner

## 1. Quick Start (Local)

**Requirements:** Node.js 18+, a MongoDB connection (Atlas or local)

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment file and fill in your MongoDB URI
cp .env.example .env
# edit .env and set MONGODB_URI (see Atlas setup below)

# 3. Run the app
npm start
# or, for auto-reload during development:
npm run dev
```

Open **http://localhost:3000** in your browser. You'll be redirected to
`/login`.

### Default login

```
Username: admin
Password: admin
```

This works out of the box because `.env.example` already ships with a
valid bcrypt hash for the password `admin`. **Change this before putting
the app in front of real customers** — see "Changing the login password"
below.

### Changing the login password

```bash
node scripts/generatePasswordHash.js yourNewPassword
```

This prints an `OWNER_PASSWORD_HASH` line — copy it into your `.env` file
(replacing the existing one). You can also change `OWNER_USERNAME` to
anything you like.

## 2. MongoDB Atlas Setup (Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free
   account (or sign in).
2. Click **"Build a Database"** → choose the **M0 Free** tier → pick a
   cloud provider/region close to you → **Create**.
3. **Create a database user:**
   - Under "Security" → "Database Access" → "Add New Database User"
   - Choose a username and password (autogenerate is fine — save it
     somewhere safe)
   - Give it "Read and write to any database" permission
4. **Allow network access:**
   - Under "Security" → "Network Access" → "Add IP Address"
   - For quick setup, click "Allow Access from Anywhere" (`0.0.0.0/0`).
     For production, restrict this to your server's IP once you know it
     (e.g., Render's static outbound IPs, if enabled on your plan).
5. **Get your connection string:**
   - Go to "Database" → click **"Connect"** on your cluster → **"Drivers"**
   - Copy the connection string, which looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user's
     credentials, and add a database name before the `?`, e.g.:
     ```
     mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/order_management?retryWrites=true&w=majority
     ```
6. Paste this full string into your `.env` file as `MONGODB_URI`.

That's it — the app will create all necessary collections (customers,
products, orders, sessions) automatically the first time it runs.

## 3. Deploying to Render

1. Push this project to a GitHub repository.
2. Go to https://dashboard.render.com → **"New +"** → **"Web Service"**
3. Connect your GitHub repo.
4. Configure the service:
   - **Environment:** Docker (Render will automatically detect and use
     the included `Dockerfile`, which installs Chromium and all
     dependencies Puppeteer needs for PDF generation)
   - **Instance Type:** Free or Starter (Starter+ recommended for
     reliable PDF generation performance)
5. Add the following **Environment Variables** in the Render dashboard
   (Settings → Environment):

   | Key | Value |
   |---|---|
   | `PORT` | `3000` |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | your Atlas connection string |
   | `SESSION_SECRET` | a long random string |
   | `OWNER_USERNAME` | `admin` (or your choice) |
   | `OWNER_PASSWORD_HASH` | your bcrypt hash (see above) |
   | `SHOP_NAME` | your shop's name |
   | `SHOP_ADDRESS` | your shop's address |
   | `SHOP_PHONE` | your shop's phone number |
   | `TRUST_PROXY` | `true` |

6. Click **"Create Web Service"**. Render will build the Docker image and
   deploy it. The first build may take a few minutes since it installs
   Chromium.
7. Once deployed, visit your Render URL — you should see the login page.

**Note on MongoDB Atlas Network Access with Render:** Render's free/starter
plans use dynamic outbound IPs, so keeping "Allow Access from Anywhere"
(`0.0.0.0/0`) in Atlas Network Access is the simplest option unless you're
on a Render plan with static outbound IPs.

## 4. Project Structure

```
project/
├── config/            # DB connection, session store config
├── controllers/       # Route handler logic (MVC "C")
├── middleware/        # Auth guard, error handler
├── models/            # Mongoose schemas (MVC "M")
├── routes/            # Express route definitions
├── services/          # Puppeteer PDF generation service
├── utils/             # Transliteration, invoice numbering, async wrapper
├── views/             # EJS templates (MVC "V")
│   ├── partials/       # Shared header/footer/sidebar/navbar
│   ├── customers/, products/, orders/
│   ├── invoice/        # Standalone invoice template used by Puppeteer
│   └── errors/          # 404 / 500 pages
├── public/             # Static CSS/JS
├── scripts/            # CLI helper to generate password hashes
├── app.js
├── package.json
├── Dockerfile
└── .env.example
```

## 5. Notes on Gujarati Transliteration

Hinglish → Gujarati conversion uses the `@indic-transliteration/sanscript`
library with the ITRANS romanization scheme. This is **phonetic
transliteration**, not translation — it converts the *sound* of what you
type into Gujarati script (e.g. `tameta` → `તમેત`). Because Gujarati has
vowel-length distinctions that plain Hinglish typing doesn't always
capture precisely, results are usually close but occasionally need a
small manual correction — which is why the Gujarati field is always
editable both when adding a product and inline on the order form.

## 6. Troubleshooting

- **"Owner credentials are not configured" on login:** Your `.env` file
  is missing `OWNER_USERNAME` / `OWNER_PASSWORD_HASH`, or the app can't
  find your `.env` file (make sure it's named exactly `.env` and sits in
  the project root, next to `package.json`).
- **MongoDB connection errors on startup:** Double-check `MONGODB_URI` in
  `.env` — verify the username/password are correct (no `<`/`>` brackets
  left in) and that your current IP is allowed in Atlas Network Access.
- **PDF invoice fails to generate locally:** Puppeteer needs to download
  Chromium the first time you run `npm install` (this requires internet
  access to Google's storage servers). If you're behind a restrictive
  firewall/proxy, see https://pptr.dev/troubleshooting for alternatives,
  or use the provided `Dockerfile`, which uses the system Chromium
  package instead.
- **Gujarati text shows boxes/garbled characters in the PDF:** This is
  almost always a font-loading issue — check that the server generating
  the PDF has internet access to `fonts.googleapis.com` (the invoice
  template loads Noto Sans Gujarati from Google Fonts).
