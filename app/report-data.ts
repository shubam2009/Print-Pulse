export type ScanRow = {
  timestamp: Date;
  qrCode: string;
  campaign: string;
  city: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  device: string;
  browser: string;
  scannerId: string;
};

export type Metric = {
  label: string;
  value: string;
  note: string;
};

export type ChartPoint = {
  label: string;
  scans: number;
};

export type LocationPoint = {
  city: string;
  region: string;
  scans: number;
  share: number;
  latitude: number | null;
  longitude: number | null;
};

export type QrPerformance = {
  qrCode: string;
  scans: number;
  uniqueScanners: number;
  repeatRate: number;
  topCity: string;
};

export type ReportData = {
  rows: ScanRow[];
  campaignName: string;
  dateRange: string;
  metrics: Metric[];
  daily: ChartPoint[];
  weekly: ChartPoint[];
  monthly: ChartPoint[];
  hourly: ChartPoint[];
  deviceMix: ChartPoint[];
  browserMix: ChartPoint[];
  locations: LocationPoint[];
  qrPerformance: QrPerformance[];
  insights: string[];
};

const timestampKeys = ["timestamp", "scan_time", "scan date", "scan_date", "date", "created_at"];
const qrKeys = ["qr_code", "qr code", "qr", "code", "dynamic_link", "link"];
const campaignKeys = ["campaign", "campaign_name", "campaign name"];
const cityKeys = ["city", "estimated_city", "location_city"];
const regionKeys = ["region", "state", "estimated_region", "province"];
const countryKeys = ["country", "estimated_country"];
const latitudeKeys = ["latitude", "lat", "estimated_latitude"];
const longitudeKeys = ["longitude", "lng", "lon", "estimated_longitude"];
const deviceKeys = ["device", "device_type", "device type"];
const browserKeys = ["browser", "client", "user_agent", "user agent"];
const scannerKeys = ["scanner_id", "scanner id", "visitor_id", "visitor id", "ip_hash", "anonymous_id"];

function getValue(row: Record<string, unknown>, keys: string[], fallback = "") {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value])
  );
  for (const key of keys) {
    const value = normalized[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return fallback;
}

function parseNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function weekKey(date: Date) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((copy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `W${weekNo}`;
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item || "Unknown"] = (acc[item || "Unknown"] ?? 0) + 1;
    return acc;
  }, {});
}

function toChartPoints(counts: Record<string, number>) {
  return Object.entries(counts).map(([label, scans]) => ({ label, scans }));
}

function topEntry(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["Unknown", 0];
}

export function normalizeRows(rawRows: Record<string, unknown>[]) {
  return rawRows
    .map((row, index): ScanRow | null => {
      const timestampText = getValue(row, timestampKeys);
      const timestamp = timestampText ? new Date(timestampText) : null;
      if (!timestamp || Number.isNaN(timestamp.getTime())) return null;

      const qrCode = getValue(row, qrKeys, `QR-${index + 1}`);
      const campaign = getValue(row, campaignKeys, "Monthly QR Campaign");
      const city = getValue(row, cityKeys, "Unknown");
      const region = getValue(row, regionKeys, "Unknown");
      const country = getValue(row, countryKeys, "India");

      return {
        timestamp,
        qrCode,
        campaign,
        city,
        region,
        country,
        latitude: parseNumber(getValue(row, latitudeKeys)),
        longitude: parseNumber(getValue(row, longitudeKeys)),
        device: getValue(row, deviceKeys, "Unknown"),
        browser: getValue(row, browserKeys, "Unknown"),
        scannerId: getValue(row, scannerKeys, `scan-${index}`)
      };
    })
    .filter((row): row is ScanRow => row !== null)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function buildReport(rows: ScanRow[]): ReportData {
  const scans = rows.length;
  const campaignName = rows[0]?.campaign ?? "Monthly QR Campaign";
  const uniqueScanners = new Set(rows.map((row) => row.scannerId)).size;
  const locationRows = rows.filter((row) => row.city !== "Unknown");
  const datedDays = new Set(rows.map((row) => dayKey(row.timestamp))).size || 1;
  const repeatRate = scans ? ((scans - uniqueScanners) / scans) * 100 : 0;
  const mobileShare = scans
    ? (rows.filter((row) => row.device.toLowerCase().includes("mobile")).length / scans) * 100
    : 0;
  const afterSixShare = scans ? (rows.filter((row) => row.timestamp.getHours() >= 18).length / scans) * 100 : 0;

  const daily = toChartPoints(countBy(rows.map((row) => dayKey(row.timestamp))));
  const weekly = toChartPoints(countBy(rows.map((row) => weekKey(row.timestamp))));
  const monthly = toChartPoints(countBy(rows.map((row) => monthKey(row.timestamp))));
  const hourlyCounts = countBy(rows.map((row) => String(row.timestamp.getHours()).padStart(2, "0")));
  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const label = String(hour).padStart(2, "0");
    return { label, scans: hourlyCounts[label] ?? 0 };
  });

  const deviceMix = toChartPoints(countBy(rows.map((row) => row.device)));
  const browserMix = toChartPoints(countBy(rows.map((row) => row.browser))).slice(0, 6);
  const [peakHour, peakHourCount] = topEntry(hourlyCounts);
  const [topQr, topQrScans] = topEntry(countBy(rows.map((row) => row.qrCode)));

  const locationCounts = rows.reduce<Record<string, LocationPoint>>((acc, row) => {
    const key = `${row.city}, ${row.region}`;
    if (!acc[key]) {
      acc[key] = {
        city: row.city,
        region: row.region,
        scans: 0,
        share: 0,
        latitude: row.latitude,
        longitude: row.longitude
      };
    }
    acc[key].scans += 1;
    if (acc[key].latitude === null && row.latitude !== null) acc[key].latitude = row.latitude;
    if (acc[key].longitude === null && row.longitude !== null) acc[key].longitude = row.longitude;
    return acc;
  }, {});

  const locations = Object.values(locationCounts)
    .map((location) => ({
      ...location,
      share: scans ? (location.scans / scans) * 100 : 0
    }))
    .sort((a, b) => b.scans - a.scans);

  const qrPerformance = Object.entries(
    rows.reduce<Record<string, ScanRow[]>>((acc, row) => {
      acc[row.qrCode] = acc[row.qrCode] ?? [];
      acc[row.qrCode].push(row);
      return acc;
    }, {})
  )
    .map(([qrCode, qrRows]) => {
      const qrUnique = new Set(qrRows.map((row) => row.scannerId)).size;
      const [topCity] = topEntry(countBy(qrRows.map((row) => row.city)));
      return {
        qrCode,
        scans: qrRows.length,
        uniqueScanners: qrUnique,
        repeatRate: qrRows.length ? ((qrRows.length - qrUnique) / qrRows.length) * 100 : 0,
        topCity
      };
    })
    .sort((a, b) => b.scans - a.scans);

  const first = rows[0]?.timestamp;
  const last = rows[rows.length - 1]?.timestamp;
  const dateRange =
    first && last
      ? `${first.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${last.toLocaleDateString(
          "en-IN",
          { day: "2-digit", month: "short", year: "numeric" }
        )}`
      : "No scans";

  const metrics: Metric[] = [
    { label: "Total scans", value: formatNumber(scans), note: `${formatNumber(Math.round(scans / datedDays))} avg/day` },
    { label: "Unique scanners", value: formatNumber(uniqueScanners), note: `${formatPercent(repeatRate)} repeat scan rate` },
    { label: "Location coverage", value: formatPercent(scans ? (locationRows.length / scans) * 100 : 0), note: "Estimated from QR scan data" },
    { label: "Mobile share", value: formatPercent(mobileShare), note: "Device reported by scan source" },
    { label: "Peak hour", value: `${peakHour}:00`, note: `${formatNumber(peakHourCount)} scans` },
    { label: "Top QR", value: topQr, note: `${formatNumber(topQrScans)} scans` }
  ];

  const topLocation = locations[0];
  const insights = [
    topLocation
      ? `${topLocation.city} contributed ${formatPercent(topLocation.share)} of all scans, making it the strongest market in this sample.`
      : "Location data is not available for this upload.",
    `${formatPercent(afterSixShare)} of scans happened after 6 PM, useful for timing retargeting and offer reminders.`,
    `${topQr} is the strongest QR placement with ${formatNumber(topQrScans)} scans in the selected period.`
  ];

  return {
    rows,
    campaignName,
    dateRange,
    metrics,
    daily,
    weekly,
    monthly,
    hourly,
    deviceMix,
    browserMix,
    locations,
    qrPerformance,
    insights
  };
}
