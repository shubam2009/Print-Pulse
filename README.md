# Print Pulse

CSV-powered QR engagement reporting for Banana Media advertiser campaigns.

This version is intentionally database-free. The operator uploads a monthly CSV export from Hovercode or another QR
platform, and the browser generates an advertiser report from that file. Supabase and API integrations can be added later
without changing the report vocabulary.

## Current workflow

1. Export monthly scan data as CSV.
2. Open the dashboard.
3. Upload the CSV.
4. Review scan volume, time trends, hourly behavior, location concentration, device mix, and QR-level performance.
5. Print or save the report as PDF for the advertiser.

## Expected CSV columns

The importer accepts common aliases, but these fields are recommended:

- `timestamp`
- `campaign`
- `qr_code`
- `city`
- `region`
- `country`
- `latitude`
- `longitude`
- `device`
- `browser`
- `scanner_id`

Location is treated as approximate and aggregate. It is for reporting heatmaps and market-level analysis, not GPS-level
user tracking.

## Local setup

```bash
npm install
npm run generate:sample
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run test
```

This regenerates the sample CSV and runs a production Next.js build.

## Future database path

When Supabase is introduced, keep the CSV parser as an ingestion fallback. Add tables for advertisers, campaigns, QR
codes, monthly report uploads, scan events, and generated report snapshots.
