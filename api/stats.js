const crypto = require("crypto");

const PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_weJngzCPapVlZ6AxW2hGeALTS70i";
const TEAM_ID = process.env.VERCEL_ORG_ID || "team_RVR91Q9eHwWll5Rd9325Xgqw";

const NOT_FOUND =
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Not found</title><meta name="robots" content="noindex, nofollow"></head><body><p>Not found</p></body></html>';

function notFound(res) {
  res.status(404);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.end(NOT_FOUND);
}

function tokensMatch(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "0";
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function lastDays(count) {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const days = [];
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() - i);
    days.push(dayKey(day));
  }
  return days;
}

function countryName(code) {
  if (!code || code === "Others") return code || "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function shell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #F6F4FF; color: #17132E; font: 16px/1.45 "Segoe UI", system-ui, sans-serif; }
  header { background: #4A35F2; color: #fff; }
  header .wrap, main { max-width: 820px; margin: 0 auto; padding: 18px 22px; }
  h1 { margin: 0; font-size: 1.7rem; letter-spacing: -.03em; }
  h2 { margin: 28px 0 10px; font-size: 1.05rem; }
  .totals { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
  .card { background: #fff; border-radius: 18px; padding: 16px 18px; min-width: 160px; flex: 1; }
  .card b { display: block; font-size: 2rem; letter-spacing: -.04em; }
  .card span { color: #625E80; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 18px; overflow: hidden; }
  th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #E3E0F2; }
  th { font-size: .78rem; letter-spacing: .05em; text-transform: uppercase; color: #625E80; }
  td:not(:first-child), th:not(:first-child) { text-align: right; }
  tr:last-child td { border-bottom: 0; }
  p.note { color: #625E80; font-size: .92rem; }
</style>
</head>
<body>
<header><div class="wrap"><h1>${esc(title)}</h1></div></header>
<main>
${body}
</main>
</body>
</html>`;
}

function setupPage() {
  return shell(
    "Onit visitors",
    `<p class="note">The page is ready, and it still needs a Vercel token before it can load numbers.</p>
<p>Create a token at vercel.com/account/tokens, then add it on the uronit project as <b>ANALYTICS_READ_TOKEN</b> for Production and Preview. Redeploy after saving it. This page will then show visitors, page views, the last 7 days, and countries.</p>
<p class="note">This page is not linked from the site.</p>`
  );
}

function statsPage(count, days, countries) {
  const totals = count && count.data ? count.data : {};
  const byDay = new Map();
  for (const row of (days && days.data) || []) {
    const key = typeof row.timestamp === "string" ? row.timestamp.slice(0, 10) : "";
    if (key) byDay.set(key, row);
  }
  const dayRows = lastDays(7)
    .map((key) => {
      const row = byDay.get(key) || {};
      return `<tr><td>${esc(key)}</td><td>${esc(num(row.visitors))}</td><td>${esc(num(row.pageviews))}</td></tr>`;
    })
    .join("");
  const countryRows = ((countries && countries.data) || [])
    .filter((row) => row && (row.country || row.visitors || row.pageviews))
    .map(
      (row) =>
        `<tr><td>${esc(countryName(row.country))}</td><td>${esc(num(row.visitors))}</td><td>${esc(num(row.pageviews))}</td></tr>`
    )
    .join("");

  return shell(
    "Onit visitors",
    `<div class="totals">
  <div class="card"><b>${esc(num(totals.visitors))}</b><span>Visitors</span></div>
  <div class="card"><b>${esc(num(totals.pageviews))}</b><span>Page views</span></div>
</div>
<p class="note">Production traffic. Vercel counts a visitor once per day, and leaves out automated visits.</p>
<h2>Last 7 days</h2>
<table>
  <thead><tr><th>Day (UTC)</th><th>Visitors</th><th>Page views</th></tr></thead>
  <tbody>${dayRows}</tbody>
</table>
<h2>Countries</h2>
<table>
  <thead><tr><th>Country</th><th>Visitors</th><th>Page views</th></tr></thead>
  <tbody>${countryRows || '<tr><td colspan="3">No country data yet.</td></tr>'}</tbody>
</table>
<p class="note">This page is not linked from the site.</p>`
  );
}

async function query(path, params, token) {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${path}`);
  url.searchParams.set("projectId", PROJECT_ID);
  url.searchParams.set("teamId", TEAM_ID);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  let res;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function send(res, status, html) {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.end(html);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    notFound(res);
    return;
  }

  const token = req.query && typeof req.query.token === "string" ? req.query.token : "";
  if (!tokensMatch(token, process.env.STATS_VIEW_SECRET)) {
    notFound(res);
    return;
  }

  if (req.method === "HEAD") {
    send(res, 200, "");
    return;
  }

  const access = process.env.ANALYTICS_READ_TOKEN;
  if (!access) {
    send(res, 200, setupPage());
    return;
  }

  const days = lastDays(7);
  const since = days[0];
  const untilDate = new Date(`${days[days.length - 1]}T00:00:00Z`);
  untilDate.setUTCDate(untilDate.getUTCDate() + 1);
  const until = dayKey(untilDate);
  const filter = "environment eq 'production'";
  const [count, byDay, countries] = await Promise.all([
    query("visits/count", { filter }, access),
    query("visits/aggregate", { since, until, by: "day", filter }, access),
    query("visits/aggregate", { since, until, by: "country", limit: "10", filter }, access),
  ]);

  if (!count || !byDay || !countries) {
    send(
      res,
      200,
      shell(
        "Onit visitors",
        "<p>The numbers could not be loaded. Refresh to try again.</p>"
      )
    );
    return;
  }

  send(res, 200, statsPage(count, byDay, countries));
};
