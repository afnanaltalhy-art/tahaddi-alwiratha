import { getStore } from "@netlify/blobs";
import { QUESTIONS, SKILLS, SECONDS_PER_Q, publicQuestion } from "../../lib/questions.mjs";

const CLASSES = ["3-1", "3-2", "3-3"];
const FEATURES = {
  style: ["comb", "braid", "bun"], hair: ["black", "brown", "honey", "auburn", "pink", "purple"], eyes: ["honey", "green", "blue"],
  blush: ["pink", "coral", "rose"], lips: ["red", "nude", "berry"], shadow: ["purple", "pink", "gold"], lashes: ["on"],
  bow: ["pink", "blue", "purple"], flower: ["yellow", "pink", "white"], earrings: ["aqua", "pearl", "ruby"],
  goggles: ["on"], crown: ["on"], bg: ["pink", "mint", "sky", "gold"],
};
const store = () => getStore({ name: "salon-attempts-v1", consistency: "strong" });
const QMAP = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
const LIMIT_MS = SECONDS_PER_Q * 1000;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

// توحيد الاسم لمنع تكرار المحاولة مع اختلاف الهمزات أو المسافات
const normName = (s) => String(s || "")
  .replace(/[ً-ْـ]/g, "")
  .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
  .replace(/\s+/g, " ").trim().toLowerCase();
const cleanName = (s) => String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
const randToken = () => crypto.randomUUID().replace(/-/g, "");
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const summary = (r) => {
  const vals = Object.values(r.answers || {});
  return {
    name: r.name, cls: r.cls, look: (r.look && !Array.isArray(r.look)) ? r.look : {}, used: r.used || 0,
    correct: vals.filter(v => v.ok).length, answered: vals.length, total: r.order.length,
    points: vals.reduce((s, v) => s + (v.pts || 0), 0), timeMs: vals.reduce((s, v) => s + (v.ms || 0), 0),
    done: r.status === "done", startedAt: r.startedAt, finishedAt: r.finishedAt || null,
  };
};

async function load(body) {
  const key = String(body.key || "");
  const rec = await store().get(key, { type: "json" });
  if (!rec || rec.token !== body.token) return [null, key];
  return [rec, key];
}

async function start(body) {
  const name = cleanName(body.name);
  const cls = String(body.cls || "");
  if (name.split(" ").length < 2 || name.length < 5) return json({ error: "اكتبي اسمك الثلاثي كاملًا" }, 400);
  if (!CLASSES.includes(cls)) return json({ error: "اختاري فصلك" }, 400);
  const key = `${cls}/${normName(name)}`;
  const s = store();
  const existing = await s.get(key, { type: "json" });
  if (existing) {
    // استكمال المحاولة نفسها على الجهاز نفسه فقط (لو انقطع الاتصال)
    if (body.token && body.token === existing.token && existing.status !== "done") {
      return json({ key, token: existing.token, resumed: true, sum: summary(existing), seconds: SECONDS_PER_Q });
    }
    return json({ error: existing.status === "done"
      ? "هذا الاسم أنهى المسابقة مسبقًا — لكل طالبة محاولة واحدة فقط."
      : "هذا الاسم بدأ المسابقة مسبقًا — لكل طالبة محاولة واحدة فقط. راجعي معلمتك." }, 409);
  }
  const rec = { name, cls, token: randToken(), startedAt: Date.now(), order: shuffle(QUESTIONS.map(q => q.id)),
                answers: {}, current: null, look: {}, used: 0, status: "active" };
  const res = await s.setJSON(key, rec, { onlyIfNew: true });
  if (!res.modified) return json({ error: "هذا الاسم مسجّل مسبقًا — لكل طالبة محاولة واحدة فقط." }, 409);
  return json({ key, token: rec.token, resumed: false, sum: summary(rec), seconds: SECONDS_PER_Q });
}

// يرسل السؤال التالي ويبدأ توقيته من لحظة ظهوره
async function next(body) {
  const [rec, key] = await load(body);
  if (!rec) return json({ error: "جلسة غير صالحة" }, 403);
  const qid = rec.order.find(id => !rec.answers[id]);
  if (!qid) return json({ done: true, sum: summary(rec) });
  const now = Date.now();
  let left = LIMIT_MS;
  if (rec.current && rec.current.qid === qid) {
    left = Math.max(0, LIMIT_MS - (now - rec.current.at)); // لا يُعاد ضبط الوقت عند تحديث الصفحة
  } else {
    rec.current = { qid, at: now };
    await store().setJSON(key, rec);
  }
  return json({ q: publicQuestion(QMAP[qid]), n: Object.keys(rec.answers).length + 1, total: rec.order.length, leftMs: left, sum: summary(rec) });
}

async function answer(body) {
  const [rec, key] = await load(body);
  if (!rec) return json({ error: "جلسة غير صالحة" }, 403);
  const q = QMAP[body.qid];
  if (!q) return json({ error: "سؤال غير معروف" }, 400);
  if (rec.answers[q.id]) { const a = rec.answers[q.id]; return json({ ok: a.ok, ans: q.ans, exp: q.exp, pts: a.pts, sum: summary(rec) }); }
  if (!rec.current || rec.current.qid !== q.id) return json({ error: "ليس هذا السؤال الحالي" }, 409);
  const now = Date.now();
  const ms = Math.max(0, now - rec.current.at);
  const choice = ["a", "b", "c", "d"].includes(body.choice) ? body.choice : null;
  const ok = !!choice && choice === q.ans && ms <= LIMIT_MS + 2500; // سماحية بسيطة لتأخر الشبكة
  const pts = ok ? 100 + Math.round(50 * Math.max(0, LIMIT_MS - ms) / LIMIT_MS) : 0;
  rec.answers[q.id] = { c: choice, ok, ms: Math.min(ms, LIMIT_MS), pts };
  rec.current = null;
  if (Object.keys(rec.answers).length >= rec.order.length) { rec.status = "done"; rec.finishedAt = now; }
  await store().setJSON(key, rec);
  return json({ ok, ans: q.ans, exp: q.exp, pts, sum: summary(rec) });
}

// لمسة الصالون: لمسة واحدة (ميزة + لونها) لكل إجابة صحيحة
async function touch(body) {
  const [rec, key] = await load(body);
  if (!rec) return json({ error: "جلسة غير صالحة" }, 403);
  const f = String(body.feature || ""), v = String(body.variant || "");
  if (!rec.look || Array.isArray(rec.look)) rec.look = {};
  rec.used ||= 0;
  const correct = Object.values(rec.answers).filter(a => a.ok).length;
  if (FEATURES[f]?.includes(v) && rec.look[f] !== v && rec.used < correct) {
    rec.look[f] = v; rec.used++;
    await store().setJSON(key, rec);
  }
  return json({ look: rec.look, used: rec.used });
}

async function me(url) {
  const [rec] = await load({ key: url.searchParams.get("key"), token: url.searchParams.get("token") });
  if (!rec) return json({ error: "جلسة غير صالحة" }, 403);
  const bySkill = {};
  for (const id of rec.order) {
    const sk = QMAP[id].skill; bySkill[sk] ??= { name: SKILLS[sk], ok: 0, n: 0 };
    bySkill[sk].n++; if (rec.answers[id]?.ok) bySkill[sk].ok++;
  }
  return json({ ...summary(rec), bySkill });
}

function teacherOk(req, url) {
  const k = Netlify.env.get("TEACHER_KEY");
  return !!k && (url.searchParams.get("k") === k || req.headers.get("x-teacher-key") === k);
}

async function teacher(req, url) {
  if (!teacherOk(req, url)) return json({ error: "رابط المعلمة غير صحيح" }, 403);
  const s = store();
  const { blobs } = await s.list();
  const list = (await Promise.all(blobs.map(async b => {
    const r = await s.get(b.key, { type: "json" });
    return r && { key: b.key, ...summary(r), detail: Object.fromEntries(Object.entries(r.answers).map(([q, a]) => [q, a.ok ? 1 : 0])) };
  }))).filter(Boolean);
  return json({ list, questions: QUESTIONS.map(q => ({ id: q.id, skill: q.skill, text: q.text })), skills: SKILLS });
}

async function teacherDelete(req, url, body) {
  if (!teacherOk(req, url)) return json({ error: "رابط المعلمة غير صحيح" }, 403);
  await store().delete(String(body.key || ""));
  return json({ ok: true });
}

export default async (req) => {
  const url = new URL(req.url);
  const p = url.pathname.replace(/^\/api\/?/, "");
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (p === "start") return await start(body);
      if (p === "next") return await next(body);
      if (p === "answer") return await answer(body);
      if (p === "touch") return await touch(body);
      if (p === "teacher/delete") return await teacherDelete(req, url, body);
    } else {
      if (p === "me") return await me(url);
      if (p === "count") return json({ total: QUESTIONS.length, seconds: SECONDS_PER_Q });
      if (p === "teacher") return await teacher(req, url);
    }
    return json({ error: "not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "حدث خطأ في الخادم، حاولي مرة أخرى" }, 500);
  }
};

export const config = { path: "/api/*" };
