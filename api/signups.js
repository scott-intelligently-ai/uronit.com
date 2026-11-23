const crypto = require("crypto");

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

function eastern(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

async function listSignups(base, key) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; from < 20000; from += pageSize) {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/rest/v1/waitlist?select=email,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Range: `${from}-${from + pageSize - 1}`,
        },
      }
    );
    if (res.status === 416) break;
    if (!res.ok) return null;
    const batch = await res.json();
    if (!Array.isArray(batch)) return null;
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function page(rows) {
  const emails = rows.map((row) => String(row.email || "")).filter(Boolean);
  const data = JSON.stringify(emails).replace(/</g, "\\u003c");
  const body = emails.length
    ? rows
        .map((row) => {
          const when = eastern(row.created_at);
          return `<tr><td>${esc(row.email)}</td><td>${esc(when)}</td></tr>`;
        })
        .join("")
    : `<tr><td colspan="2" class="empty">No signups yet.</td></tr>`;
  const count = emails.length === 1 ? "1 signup" : `${emails.length} signups`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Onit signups</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #F6F4FF; color: #17132E; font: 16px/1.45 "Segoe UI", system-ui, sans-serif; }
  header { background: #4A35F2; color: #fff; }
  header .wrap, main { max-width: 820px; margin: 0 auto; padding: 18px 22px; }
  h1 { margin: 0; font-size: 1.7rem; letter-spacing: -.03em; }
  .bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin: 22px 0 14px; }
  .count { font-weight: 800; }
  button { font: inherit; font-weight: 800; border: 0; border-radius: 999px; padding: 9px 16px; background: #17132E; color: #fff; cursor: pointer; }
  button.sun { background: #FFC83A; color: #17132E; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 18px; overflow: hidden; }
  th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #E3E0F2; }
  th { font-size: .78rem; letter-spacing: .05em; text-transform: uppercase; color: #625E80; }
  td:first-child { font-weight: 700; word-break: break-all; }
  tr:last-child td { border-bottom: 0; }
  .empty { color: #625E80; font-weight: 600; }
  p.note { color: #625E80; font-size: .92rem; }
  #status { min-height: 1.4em; font-weight: 700; color: #0E9B79; }
</style>
</head>
<body>
<header><div class="wrap"><h1>Onit signups</h1></div></header>
<main>
  <div class="bar">
    <span class="count">${esc(count)}</span>
    <div class="actions">
      <button class="sun" id="copy" type="button">Copy emails</button>
      <button id="download" type="button">Download .txt</button>
    </div>
  </div>
  <p id="status" role="status"></p>
  <table>
    <thead><tr><th>Email</th><th>Signed up (Eastern)</th></tr></thead>
    <tbody>${body}</tbody>
  </table>
  <p class="note">Times are Eastern. This page is not linked from the site.</p>
</main>
<script id="emails" type="application/json">${data}</script>
<script>
  var emails = JSON.parse(document.getElementById('emails').textContent);
  var status = document.getElementById('status');
  function text() { return emails.join('\\n'); }
  document.getElementById('copy').addEventListener('click', function () {
    if (!emails.length) { status.textContent = 'Nothing to copy yet.'; return; }
    navigator.clipboard.writeText(text()).then(function () {
      status.textContent = 'Copied ' + emails.length + (emails.length === 1 ? ' email.' : ' emails.');
    }, function () { status.textContent = 'Copy failed. Select the list instead.'; });
  });
  document.getElementById('download').addEventListener('click', function () {
    var blob = new Blob([text() + (emails.length ? '\\n' : '')], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'onit-signups.txt';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
</script>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    notFound(res);
    return;
  }

  const token = req.query && typeof req.query.token === "string" ? req.query.token : "";
  if (!tokensMatch(token, process.env.SIGNUP_VIEW_SECRET)) {
    notFound(res);
    return;
  }

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rows = base && key ? await listSignups(base, key) : null;
  if (!rows) {
    res.status(500);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.end("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Onit signups</title></head><body><p>The signup list could not be loaded. Refresh to try again.</p></body></html>");
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(page(rows));
};
