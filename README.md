# Dr. Golechas

Dr. Golechas storefront and backend foundation using Next.js App Router, React, strict TypeScript, Tailwind CSS, ESLint, Prettier, MongoDB, and Mongoose.

## Run locally

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to a MongoDB connection string. Set `NEXT_PUBLIC_APP_URL` to the local or deployed app URL.
2. For local development, this workspace is configured to use `mongodb://127.0.0.1:27017/dr_golechas`; start the local MongoDB service before running the app. Replace the URI in `.env` with your secured MongoDB Atlas or other deployment URI when using a remote database. Do not commit `.env` or share database credentials.
3. Run `npm run db:check` to verify connectivity and `npm run verify:models` to check model registration.
4. Seed demo categories, products, and unapproved placeholder testimonials only when you want those records in the selected database, using `npm run seed`.
5. Check the connection at [http://localhost:3000/api/health](http://localhost:3000/api/health). It returns `503` when the database is unavailable and never returns connection details.

The seed is idempotent. Demo product copy and testimonials are placeholders; replace them with approved business information before launch. Category navigation/cards use active database categories when connected and retain demo presentation data when no database is configured. Keep `.env` local; `.env.example` contains no credentials.

## SEO, performance, and policies

- Set `NEXT_PUBLIC_APP_URL` to the exact public HTTPS origin in every deployed environment. It is used for canonical URLs, sitemap entries, social metadata, structured data, and email links. The fallback is `http://localhost:3000` for development.
- Product titles, descriptions, and keywords are editable in Admin → Products and appear in product metadata. Product pages include Product and breadcrumb JSON-LD; the storefront publishes Organization JSON-LD. `/sitemap.xml` includes active MongoDB products/categories, and `/robots.txt` excludes account, checkout, API, and admin surfaces.
- Catalog pages are server-rendered and paginated; product image rendering uses Next Image with lazy loading except the primary image. Product/category, review, order, and search indexes support catalog and account lookups.
- The privacy, terms, shipping, returns, cancellation, and disclaimer pages contain visible draft notices. Their text is not legally reviewed; replace it with business-approved, professionally reviewed policy content before launch.

## Email, invoices, and shipping

- Email templates and delivery are provider-neutral under `services/email`. Resend is the configured adapter; set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` (or retain `AUTH_FROM_EMAIL`) to enable delivery. Adding SendGrid or SMTP requires implementing the `EmailProvider` interface; no provider API key is exposed to the browser. Welcome, password-reset, order confirmation, payment confirmation, shipped, delivered, cancellation, and refund templates are available and lifecycle messages are queued after the response.
- Customers can download an owner-authorized invoice PDF from an eligible order detail page. The invoice uses store/customer/order snapshots and configured legal name/GSTIN. It becomes available for paid, COD, or refunded orders, not pending or failed online payments.
- Checkout shipping calculations use the manual provider abstraction (`services/shipping`) with the existing configurable flat-rate and free-shipping threshold settings. A future Shiprocket adapter can implement the same interface without coupling checkout to that provider.

## Admin dashboard

- Sign in at `/admin-login`; the protected dashboard and management tools are under `/admin`. Admin pages and APIs check active sessions, roles, and resource permissions on the server. Super Admins have every permission; Admins with an empty permission list receive the standard full set.
- Provision an account from a trusted operator environment by setting `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` for the process, then run `npm run admin:create`. `ADMIN_ROLE` defaults to `superadmin`; choose `admin` or `staff` as needed. Staff accounts require a comma-separated `ADMIN_PERMISSIONS` list. The command refuses existing accounts and stores only a password hash. Do not commit or persist provisioning credentials.
- The dashboard manages products, categories, orders, customers, reviews, coupons, testimonials, social links, and store settings. Image uploads accept JPEG, PNG, or WebP up to 5 MB and are stored in `ADMIN_UPLOAD_DIR` or `<working directory>/uploads`. Production deployments must mount durable storage shared by every app instance or replace the filesystem adapter with shared object storage.
- The storefront reads its brand name, tagline, logo, and social links from the store settings record.

## Product discovery and reviews

- `/product-finder` is a configurable shopping quiz. Its deterministic recommendation provider matches active product category, product type, tags, use cases, preferences, current availability, and budget; reasons refer only to the selected filters. Product finder matching is an interface in `services/recommendation` so a future provider can be injected server-side; the deterministic provider remains the default and no AI key is sent to the browser.
- Product records expose factual `productType`, `useCases`, and `preferences` metadata in the admin product editor. Only enter verified attributes; recommendations do not diagnose, prescribe, or make health-outcome claims.
- Product pages display approved review averages, rating distribution, review count, verified-purchase labels and dates. Signed-in customers can submit one review per product. New reviews start pending and require admin approval; rejected reviews stay unpublished. A verified purchase is matched against the customer’s eligible order history.
- Configure social URLs and support phone details under Admin → Store settings / Social links. The storefront uses these settings for the homepage social section, footer and floating WhatsApp link; no social destinations are hard-coded.

## Curated product catalogue

- Run `npm run seed:catalogue` to upsert the 13 Dr. Golechas catalogue records and the three product categories. The seed matches existing products by slug or SKU and refuses ambiguous matches or SKU collisions; it is safe to run again.
- The 13 records are deliberately shown as unavailable drafts. Proposed prices remain marked unapproved, stock starts at zero, and product details/regulatory fields remain pending. Suvarnaprash is separately held for regulatory review. The storefront can display the draft records and dedicated product URLs but cannot add them to cart, checkout, or recommendations until approved.
- Replace each product illustration placeholder with approved photography and enter verified ingredients, directions, storage, safety and regulatory details in Admin → Products. Set per-variant prices/SKUs/pack information and price approvals, verify product details, then move the publication status to Ready to publish or Published. Server-side publication and checkout guards reject products without those approvals.
- Catalogue price values follow the existing application’s INR rupee units (not paise), because cart, tax, payment, and order totals already use rupees. The supplied sample prices are retained as proposed values; no discounts are shown until approvals are complete.

## Customer authentication

- Registration and email/password login use bcrypt password hashes and opaque random sessions. Only SHA-256 session-token hashes are stored in MongoDB; the browser cookie is HttpOnly, SameSite=Lax, and Secure in production.
- `/account` is redirected by Next 16 `proxy.ts` when the session cookie is absent, then the server layout and each account API independently verify the session and customer role.
- Profile, order, review, and address queries are scoped by the authenticated customer ID. Address writes validate Indian phone numbers and six-digit PIN codes.
- Auth POST routes use same-origin validation and Mongo-backed per-email rate limits. Password recovery uses single-use 30-minute tokens and always returns a generic response. Configure `RESEND_API_KEY` and `AUTH_FROM_EMAIL` to deliver reset links; without them, no reset token is issued or exposed.
- Email changes require the current password. Password changes and resets revoke other active sessions.
- Google and Twilio environment fields are placeholders only. OAuth/OTP options are not shown or simulated until real provider flows are implemented and configured.

## Payments and orders

- Online checkout creates the order with the server-calculated cart total, then creates a Razorpay order through the server API. Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in `.env`; only the public key ID is sent to the browser.
- Razorpay Checkout offers the payment methods enabled for the account, including UPI, cards, and net banking. The browser callback is never trusted: the server validates the signature, fetches the payment from Razorpay, verifies the amount/currency/order, and captures authorized payments before marking the order paid.
- Configure Razorpay webhooks to call `/api/payments/webhook` with `payment.captured`, `payment.failed`, `payment.refunded`, and (where available) `order.paid`. Webhook signatures and event IDs are verified; duplicate deliveries are safe to retry.
- Payment status transitions use MongoDB transactions; use a replica-set deployment (for example, MongoDB Atlas) in production.
- COD orders remain `paymentStatus: cod`; order and payment states are tracked separately. Customers can see their owner-scoped order history at `/account/orders` and details at `/account/orders/[id]`.
- Without live credentials online checkout is disabled, unless `RAZORPAY_MOCK_MODE=true` is explicitly set outside production. Mock mode is visibly identified, collects no money, supports only failed/cancelled simulations, and cannot mark any order paid. Never enable it in production.

## Catalog API

- `GET /api/products` lists active products with search, filtering, sorting, and pagination query parameters.
- `GET /api/products/[id]` and `GET /api/products/slug/[slug]` return product details.
- `GET /api/products/search?q=...` is the dedicated search endpoint.
- `GET /api/categories?tree=true` returns the active nested category tree; `/api/categories/[idOrSlug]` returns a category and its children.
- Product/category mutations require authenticated admin sessions and server-side resource permissions; same-origin checks protect browser mutations. Deletes deactivate records. Product discounts are calculated from server-validated price/MRP values.
- `/shop` and `/shop/[slug]` use server-rendered MongoDB queries. Search and filters are represented in the URL; results are paginated on the server.

## Project structure

- `app/(store)` contains the storefront and route placeholders; `app/(admin)` isolates the future admin surface.
- `app/api/health` provides a database connection check.
- `app/api/auth` and `app/api/account` contain auth/session and owner-scoped account APIs; `proxy.ts` performs an optimistic account-route redirect.
- `lib/auth` contains password, session, rate-limit, validation, reset-email, and external-provider configuration boundaries.
- `components/ui`, `components/store`, and `components/product` contain reusable UI, store chrome, and product presentation.
- `lib/db/connect.ts` reuses the Mongoose connection across requests and development reloads; `lib/demo-data.ts` contains replaceable fixtures.
- `models` contains User, Product, Category, Order, Review, Coupon, Address, Payment, Inventory, Testimonial, SiteSettings, and Admin schemas.
- `scripts/seed.ts` safely upserts demo records; `scripts/verify-models.ts` checks model registration without a database.
- `types` contains shared domain types; `hooks`, `services`, and route folders are prepared for later phases.
- Brand colors and global accessibility styles are defined in `app/globals.css`.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm run verify:models
npm run verify:catalog
npm run verify:auth
npm run verify:payments
npm run verify:admin
npm run verify:phase8
npm run build
```
