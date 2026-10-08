# GG Cars

دفتر فارسی برای پول خودرو: مالک بودجه یک دوره را به تومان می‌گذارد، مدیر فروش خرید، هزینه و فروش را ثبت می‌کند، و سود هر خودرو ۶۰ درصد برای شرکت و ۴۰ درصد برای مدیر فروش است. بعد از بستن دوره، بودجه بعدی جدا می‌ماند.

# GG Cars

A Persian ledger for car money. The owner opens a budget in toman, the sales manager records purchases, costs, and sales, and each car’s profit splits 60% to the company and 40% to the manager. The next budget is a separate cycle.

## Local setup

Postgres 16:

```bash
docker compose up -d db
cp .env.example .env
```

Set `AUTH_SECRET` and the owner and manager passwords in `.env`. `DATABASE_URL` and `DIRECT_URL` can be the same local database.

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open http://localhost:3000 and sign in with `OWNER_EMAIL` or `MANAGER_EMAIL`.

## Money

Every amount is a whole toman. Profit on a sold car is sale price minus purchase price minus that car’s costs. Extra money is more capital, not a car cost. A loss stays with the company. The manager’s share is paid only when the owner records it, and only while the cycle is open.

## Vercel

1. Import the project in Vercel.
2. Add Neon Postgres from the Vercel Marketplace.
3. Set `DATABASE_URL` to the pooled Neon URL and `DIRECT_URL` to the direct URL. If you are not using a pooler, set both to the same URL.
4. Set `AUTH_SECRET`, `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PASSWORD`, `MANAGER_NAME`, `MANAGER_EMAIL`, and `MANAGER_PASSWORD`.
5. Deploy. The `vercel-build` script runs `prisma migrate deploy`, seeds the two users when the user table is empty, then builds Next.js.

The dashboard is not indexed. There is no public signup.
