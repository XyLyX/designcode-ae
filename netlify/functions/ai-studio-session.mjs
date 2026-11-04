import { authorize, limit as enforceLimit } from "./_ai-studio-security.mjs";
// Internal-only API scaffold. Deliberately fails closed until access controls,
// privacy consent, rate limits and operational monitoring are approved.
import { timingSafeEqual, createHmac } from "node:crypto";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const equal = (a, b) => {
  const x = Buffer.from(a || ""), y = Buffer.from(b || "");
  return x.length === y.length && timingSafeEqual(x, y);
};
const allowedRooms = new Set(["living_room", "bedroom"]);
const allowedStyles = new Set(["", "contemporary", "minimal", "warm_modern", "classic"]);
const text = (v, max) => typeof v === "string" && v.length <= max ? v.trim() : null;

export default async function handler(request) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  // A default-off kill switch ensures a deploy cannot accidentally open this API.
  if (process.env.AI_STUDIO_API_ENABLED !== "true") return json({ error: "Not available" }, 503);
  const previewKey = process.env.AI_STUDIO_PREVIEW_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_URL;
  if (!serviceKey || !process.env.AI_STUDIO_SESSION_SIGNING_SECRET || process.env.AI_STUDIO_SESSION_SIGNING_SECRET.length < 32 || !url ||
      !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
    return json({ error: "Server not configured" }, 503);
  }
  if (process.env.AI_STUDIO_REQUIRE_PREVIEW_KEY === "true" && (!previewKey || previewKey.length < 32 || !equal(request.headers.get("x-ai-studio-preview-key"), previewKey))) {
    return json({ error: "Unauthorized" }, 401);
  }
  const auth=await authorize(request);
  if(auth.error)return auth.error;
  if(!await enforceLimit(auth.key,auth.userId,"ai-studio-session.mjs",12))return json({error:"Rate limit exceeded"},429);
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("application/json")) return json({ error: "JSON required" }, 415);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 4096) return json({ error: "Payload too large" }, 413);
  let raw;
  try { raw = await request.text(); } catch { return json({ error: "Invalid request" }, 400); }
  if (Buffer.byteLength(raw, "utf8") > 4096) return json({ error: "Payload too large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid data" }, 400);
  const room = body.room_type, style = body.style_preference ?? "";
  const dimensions = text(body.dimensions_note ?? "", 200);
  const restrictions = text(body.restrictions_note ?? "", 1000);
  if (!allowedRooms.has(room) || !allowedStyles.has(style) || dimensions === null || restrictions === null) {
    return json({ error: "Invalid design details" }, 400);
  }
  const budget = body.budget_aed === "" || body.budget_aed == null ? null : body.budget_aed;
  if (budget !== null && (typeof budget !== "number" || !Number.isFinite(budget) || budget < 0 || budget > 100000000)) {
    return json({ error: "Invalid budget" }, 400);
  }
  // Never accept consent implicitly; no photos or AI processing occur in this scaffold.
  const payload = { owner_user_id: auth.userId, room_type: room, style_preference: style || null, dimensions_note: dimensions,
    restrictions_note: restrictions, budget_aed: budget };
  try {
    const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/ai_design_sessions", {
      method: "POST", headers: { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey,
        "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return json({ error: "Unable to create draft" }, 502);
    const records = await response.json();
    if (!Array.isArray(records) || !records[0]?.id) return json({ error: "Unexpected backend response" }, 502);
    const secret = process.env.AI_STUDIO_SESSION_SIGNING_SECRET;
    if (!secret || secret.length < 32) return json({ error: "Session signing not configured" }, 503);
    const expires = Math.floor(Date.now() / 1000) + 1800;
    const claim = records[0].id + "." + expires;
    const signature = createHmac("sha256", secret).update(claim).digest("hex");
    return json({ id: records[0].id, status: "draft", session_token: claim + "." + signature,
      expires_at: new Date(expires * 1000).toISOString() }, 201);
  } catch {
    return json({ error: "Backend unavailable" }, 502);
  }
}
