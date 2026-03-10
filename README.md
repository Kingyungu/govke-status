# GOV.KE Status

Real-time status monitor for Kenyan government digital services.
Live at **[status.wahenga.co.uk](https://status.wahenga.co.uk)** (migrating to status.gov.ke).

Built with Next.js 14 App Router · Supabase · Tailwind CSS · Vercel.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | Public URL (e.g. `https://status.wahenga.co.uk`) |
| `SUPABASE_URL` | yes | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | yes | Supabase service role key (server-side only) |
| `CRON_SECRET` | yes | Random string to protect the cron endpoint |

---

## Supabase — Database Schema

Run the following SQL in the Supabase **SQL editor** to create all required tables.

```sql
-- ── Services ──────────────────────────────────────────────────────────────────
create table services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  url         text not null unique,
  category    text not null check (category in ('national', 'county')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index services_category_idx on services (category);
create index services_active_idx   on services (is_active);

-- ── Checks ────────────────────────────────────────────────────────────────────
create table checks (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references services (id) on delete cascade,
  checked_at       timestamptz not null default now(),
  status           text not null check (status in ('up', 'down', 'degraded')),
  response_time_ms integer,   -- null when unreachable
  status_code      integer,   -- null when unreachable
  error            text       -- null when status = 'up'
);

create index checks_service_id_idx  on checks (service_id);
create index checks_checked_at_idx  on checks (checked_at desc);
create index checks_service_time_idx on checks (service_id, checked_at desc);

-- Prune old checks automatically (keep 90 days)
-- Set up a pg_cron job in Supabase or call this from a weekly cron:
-- delete from checks where checked_at < now() - interval '90 days';

-- ── Incidents ─────────────────────────────────────────────────────────────────
create table incidents (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references services (id) on delete cascade,
  title       text not null,
  status      text not null check (status in ('investigating', 'identified', 'monitoring', 'resolved')),
  started_at  timestamptz not null default now(),
  resolved_at timestamptz,
  updates     jsonb not null default '[]'::jsonb
  -- updates is an array of: { message: string, timestamp: string, status: IncidentStatus }
);

create index incidents_service_id_idx  on incidents (service_id);
create index incidents_started_at_idx  on incidents (started_at desc);
create index incidents_resolved_at_idx on incidents (resolved_at);

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- The app uses the service role key server-side, so RLS is optional.
-- If you want extra safety, enable RLS and allow public read access:

alter table services  enable row level security;
alter table checks    enable row level security;
alter table incidents enable row level security;

-- Public read (no auth required — this is a public status page)
create policy "Public read services"  on services  for select using (true);
create policy "Public read checks"    on checks    for select using (true);
create policy "Public read incidents" on incidents for select using (true);

-- Only the service role key can write (server-side API routes)
-- (service role bypasses RLS automatically)
```

---

## Seed the services table

After creating the schema, populate the services table:

```bash
npx tsx scripts/seed.ts
```

This uses `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` from your environment.

---

## Deployment — Vercel

1. Push this repo to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Add environment variables in the Vercel dashboard (Settings → Environment Variables):
   - `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CRON_SECRET`
4. Deploy. Vercel will automatically pick up `vercel.json` and schedule the cron.

### Custom domain

Add `status.wahenga.co.uk` in Vercel → Domains, then add a `CNAME` in Cloudflare:

```
CNAME   status   cname.vercel-dns.com   (proxied = OFF for HTTPS to work correctly)
```

---

## Cron endpoint

`GET|POST /api/cron/check` — runs all service checks and persists results.

Protected with `Authorization: Bearer <CRON_SECRET>` header.

Manual test:

```bash
curl -X POST https://status.wahenga.co.uk/api/cron/check \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## API reference

| Endpoint | Description |
|---|---|
| `GET /api/status` | Current status of all services + 90-day uptime |
| `GET /api/incidents` | All incidents in the last 90 days |
| `GET /api/checks/[serviceId]` | Raw check history for a service (for sparklines) |
| `GET /api/feed.json` | JSON Feed of last 10 incidents |

---

## Data retention

Checks accumulate at 1/minute × 20 services = ~28,800 rows/day.
At 90 days that's ~2.6M rows — well within Supabase's free tier (500MB).

To prune automatically, add this to a Supabase pg_cron job (Dashboard → Extensions → pg_cron):

```sql
select cron.schedule(
  'prune-old-checks',
  '0 3 * * *',   -- daily at 03:00 UTC
  $$delete from checks where checked_at < now() - interval '90 days'$$
);
```

---

## Disclaimer

GOV.KE Status is an independent public service built by [Wahenga Consultancy](https://wahenga.co.uk).
It is not affiliated with the ICT Authority or any Kenyan government body.
Data is provided for public interest only. No guarantees of accuracy.
