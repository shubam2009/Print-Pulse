import { writeFileSync } from "node:fs";

const cities = [
  ["Delhi", "Delhi", "India", 28.6139, 77.209, 432],
  ["Noida", "Uttar Pradesh", "India", 28.5355, 77.391, 186],
  ["Gurugram", "Haryana", "India", 28.4595, 77.0266, 141],
  ["Ghaziabad", "Uttar Pradesh", "India", 28.6692, 77.4538, 98],
  ["Faridabad", "Haryana", "India", 28.4089, 77.3178, 82],
  ["Unknown", "Unknown", "India", "", "", 109]
];

const qrCodes = ["NCR-STATE-01", "NCR-STATE-02", "SCHOOL-PACK-01", "COVER-INSIDE-01", "RETAIL-PARTNER-01"];
const devices = ["Mobile", "Mobile", "Mobile", "Desktop", "Tablet"];
const browsers = ["Chrome", "Chrome", "Safari", "Samsung Internet", "Edge"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function timestamp(index) {
  const day = 1 + (index % 30);
  const hour = [8, 10, 13, 16, 18, 19, 20, 21][index % 8];
  const minute = (index * 7) % 60;
  return `2026-07-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`;
}

const rows = [
  "timestamp,campaign,qr_code,city,region,country,latitude,longitude,device,browser,scanner_id"
];

let index = 0;
for (const [city, region, country, latitude, longitude, total] of cities) {
  for (let i = 0; i < total; i += 1) {
    const qrCode = qrCodes[(index + i) % qrCodes.length];
    const device = devices[(index + i) % devices.length];
    const browser = browsers[(index + i * 2) % browsers.length];
    const scannerId = `anon-${pad((index + i) % 740)}`;
    rows.push(
      [
        timestamp(index),
        "July Notebook QR Pilot",
        qrCode,
        city,
        region,
        country,
        latitude,
        longitude,
        device,
        browser,
        scannerId
      ].join(",")
    );
    index += 1;
  }
}

writeFileSync(new URL("../public/sample-hovercode-activity.csv", import.meta.url), `${rows.join("\n")}\n`);
