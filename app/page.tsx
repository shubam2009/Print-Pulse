"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Download, FileUp, Printer, RotateCcw } from "lucide-react";
import { buildReport, ChartPoint, normalizeRows, ReportData } from "./report-data";

type RangeMode = "daily" | "weekly" | "monthly";

const colors = ["#f7d83e", "#2f56d9", "#111111", "#6d6a5f", "#bda43b", "#8ea2ff"];

function parseCsv(text: string) {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });
  return normalizeRows(parsed.data);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="chart-frame">{children}</div>;
}

function EmptyState() {
  return (
    <main className="empty-state">
      <div>
        <p className="eyebrow">Print Pulse</p>
        <h1>Upload a scan CSV to generate the advertiser report.</h1>
        <p>
          Use the sample data to preview the dashboard, then replace it with a monthly export from Hovercode or any QR
          tool that includes timestamp, QR code, city, device, and anonymous visitor data.
        </p>
      </div>
    </main>
  );
}

function MiniMap({ locations }: { locations: ReportData["locations"] }) {
  const mapped = locations.filter((location) => location.latitude !== null && location.longitude !== null).slice(0, 8);
  const latitudes = mapped.map((location) => location.latitude as number);
  const longitudes = mapped.map((location) => location.longitude as number);
  const minLat = Math.min(...latitudes, 28.2);
  const maxLat = Math.max(...latitudes, 29);
  const minLon = Math.min(...longitudes, 76.6);
  const maxLon = Math.max(...longitudes, 77.6);
  const spreadLat = maxLat - minLat || 1;
  const spreadLon = maxLon - minLon || 1;
  const maxScans = Math.max(...mapped.map((location) => location.scans), 1);

  return (
    <div className="map-panel" aria-label="Estimated scan location map">
      <div className="map-base">
        <div className="map-road ring-a" />
        <div className="map-road ring-b" />
        <div className="map-line horizontal one" />
        <div className="map-line horizontal two" />
        <div className="map-line vertical one" />
        <div className="map-line vertical two" />
        {mapped.map((location) => {
          const x = (((location.longitude as number) - minLon) / spreadLon) * 78 + 11;
          const y = 89 - (((location.latitude as number) - minLat) / spreadLat) * 78;
          const size = 18 + (location.scans / maxScans) * 48;
          return (
            <div
              className="map-bubble"
              key={`${location.city}-${location.region}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`
              }}
              title={`${location.city}: ${formatNumber(location.scans)} scans`}
            >
              <span />
              <strong>{location.city}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="#ded8ca" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#625f56", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#625f56", fontSize: 12 }} width={42} />
          <Tooltip contentStyle={{ border: "1px solid #111", borderRadius: 0 }} />
          <Line type="monotone" dataKey="scans" stroke="#2f56d9" strokeWidth={3} dot={{ r: 3, fill: "#2f56d9" }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function BarPanel({ data }: { data: ChartPoint[] }) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="#ded8ca" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#625f56", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#625f56", fontSize: 12 }} width={42} />
          <Tooltip contentStyle={{ border: "1px solid #111", borderRadius: 0 }} />
          <Bar dataKey="scans" fill="#111111" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default function Home() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [rangeMode, setRangeMode] = useState<RangeMode>("daily");
  const [fileName, setFileName] = useState("sample-hovercode-activity.csv");

  async function loadSample() {
    const response = await fetch("/sample-hovercode-activity.csv");
    const text = await response.text();
    setReport(buildReport(parseCsv(text)));
    setFileName("sample-hovercode-activity.csv");
  }

  useEffect(() => {
    loadSample();
  }, []);

  async function handleUpload(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setReport(buildReport(parseCsv(text)));
    setFileName(file.name);
  }

  const trendData = useMemo(() => {
    if (!report) return [];
    if (rangeMode === "weekly") return report.weekly;
    if (rangeMode === "monthly") return report.monthly;
    return report.daily;
  }, [rangeMode, report]);

  if (!report) return <EmptyState />;

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Print Pulse</p>
          <h1>
            See how every QR scan moved your campaign.
          </h1>
          <p className="subhead">
            A monthly advertiser report built from scan exports: reach, timing, location, QR placement, device mix, and
            repeat engagement in one view.
          </p>
        </div>
        <div className="actions">
          <label className="button primary">
            <FileUp size={18} />
            Upload CSV
            <input accept=".csv" type="file" onChange={(event) => handleUpload(event.target.files?.[0] ?? null)} />
          </label>
          <button className="button" onClick={loadSample} type="button">
            <RotateCcw size={18} />
            Sample
          </button>
          <button className="button" onClick={() => window.print()} type="button">
            <Printer size={18} />
            Print
          </button>
        </div>
      </header>

      <section className="report-meta">
        <span>{report.campaignName}</span>
        <span>{report.dateRange}</span>
        <span>{fileName}</span>
      </section>

      <section className="metrics-grid">
        {report.metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.note}</span>
          </article>
        ))}
      </section>

      <section className="section-grid wide-left">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Scan velocity</p>
              <h2>Daily, weekly, and monthly scan trend</h2>
            </div>
            <div className="segmented">
              {(["daily", "weekly", "monthly"] as RangeMode[]).map((mode) => (
                <button className={rangeMode === mode ? "active" : ""} key={mode} onClick={() => setRangeMode(mode)}>
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <TrendChart data={trendData} />
        </article>

        <article className="panel insight-panel">
          <p className="eyebrow">Readout</p>
          <h2>What changed this month</h2>
          <ul>
            {report.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="section-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Time of day</p>
              <h2>Hourly scan pattern</h2>
            </div>
          </div>
          <BarPanel data={report.hourly} />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Device context</p>
              <h2>Device and browser mix</h2>
            </div>
          </div>
          <div className="mix-layout">
            <ResponsiveContainer width="48%" height={230}>
              <PieChart>
                <Pie data={report.deviceMix} dataKey="scans" nameKey="label" outerRadius={86}>
                  {report.deviceMix.map((entry, index) => (
                    <Cell fill={colors[index % colors.length]} key={entry.label} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend-list">
              {[...report.deviceMix, ...report.browserMix.slice(0, 4)].map((item, index) => (
                <div key={`${item.label}-${index}`}>
                  <span style={{ background: colors[index % colors.length] }} />
                  <p>{item.label}</p>
                  <strong>{formatNumber(item.scans)}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="section-grid wide-left">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Estimated scan locations</p>
              <h2>Where engagement concentrated</h2>
            </div>
          </div>
          <MiniMap locations={report.locations} />
        </article>

        <article className="panel table-panel">
          <p className="eyebrow">Top markets</p>
          <h2>Location analysis</h2>
          <table>
            <tbody>
              {report.locations.slice(0, 7).map((location, index) => (
                <tr key={`${location.city}-${location.region}`}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td>
                    <strong>{location.city}</strong>
                    <span>{location.region}</span>
                  </td>
                  <td>{formatNumber(location.scans)}</td>
                  <td>{Math.round(location.share)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">QR placement performance</p>
            <h2>Which QR codes generated action</h2>
          </div>
          <button className="button" onClick={() => window.print()} type="button">
            <Download size={18} />
            Save report
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>QR code</th>
              <th>Scans</th>
              <th>Unique scanners</th>
              <th>Repeat rate</th>
              <th>Top city</th>
            </tr>
          </thead>
          <tbody>
            {report.qrPerformance.map((qr) => (
              <tr key={qr.qrCode}>
                <td>{qr.qrCode}</td>
                <td>{formatNumber(qr.scans)}</td>
                <td>{formatNumber(qr.uniqueScanners)}</td>
                <td>{Math.round(qr.repeatRate)}%</td>
                <td>{qr.topCity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
