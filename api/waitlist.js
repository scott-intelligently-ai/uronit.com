const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SAVED = "You're on the list. We'll email you when Onit is ready.";
const INVALID = "Please enter a full email address, like you@school.edu.";
const FAILED = "Something went wrong saving your email. Please try again.";

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    send(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  const body = await readBody(req);
  if (body.company) {
    send(res, 200, { ok: true, message: SAVED });
    return;
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 320) {
    send(res, 400, { ok: false, message: INVALID });
    return;
  }

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) {
    send(res, 500, { ok: false, message: FAILED });
    return;
  }

  let stored;
  try {
    stored = await fetch(`${base.replace(/\/$/, "")}/rest/v1/waitlist`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    send(res, 502, { ok: false, message: FAILED });
    return;
  }

  if (stored.ok || stored.status === 409) {
    send(res, 200, { ok: true, message: SAVED });
    return;
  }

  send(res, 502, { ok: false, message: FAILED });
};
