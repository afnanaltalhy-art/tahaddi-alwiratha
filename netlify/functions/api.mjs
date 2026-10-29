import { getStore } from "@netlify/blobs";
import { QUESTIONS, SKILLS, SECONDS_PER_Q, FEEDBACK_MS, COUNTDOWN_MS, publicQuestion } from "../../lib/questions.mjs";

const CLASSES = ["3-1", "3-2", "3-3"];
const store = () => getStore({ name: "attempts-v1", consistency: "strong" });
const QMAP = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

// توحيد الاسم: لمنع تكرار المحاولة بنفس الاسم مع اختلاف الهمزات أو المسافات
const normName = (s) => String(s || "")
  .replace(/[ً-ْـ]/g, "")
  .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
  .replace(/\s+/g, " ").trim().toLowerCase();
const cleanName = (s) => String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
const randToken = () => crypto.randomUUID().replace(/-/g, "");
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const summary = (r) => {
  const ans = r.answers || {};
  const vals = Object.values(ans);
  const correct = vals.filter(v => v.ok).length;
  const points = vals.reduce((s, v) => s + (v.pts || 0), 0);
  const timeMs = vals.reduce((s, v) => s + (v.ms || 0), 0);
  return { name: r.name, cls: r.cls, correct, answered: vals.length, total: r.order.length, points, timeMs,
           done: r.status === "done", startedAt: r.startedAt, finishedAt: r.finishedAt || null };
};

const rankSort = (a, b) => (b.points - a.points) || (b.correct - a.correct) || (a.timeMs - b.timeMs);

let cache = { at: 0, rows: null };
async function allRecords(force = false) {
  if (!force && cache.rows && Date.now() - cache.at < 8000) return cache.rows;
  const s = store();
  const { blobs } = await s.list();
  const rows = (await Promise.all(blobs.map(async b => {
    const r = await s.get(b.key, { type: "json" });
    return r ? { key: b.key, rec: r } : null;
  }))).filter(Boolean);
  cache = { at: Date.now(), rows };
  return rows;
}

function remaining(rec) {
  return rec.order.filter(id => !rec.answers[id]).map(id => publicQuestion(QMAP[id]));
}

async function start(body) {
  const name = cleanName(body.name);
  const cls = String(body.cls || "");
  if (name.split(" ").length < 2 || name.length < 5) return json({ error: "اكتبي اسمك الثنائي أو الثلاثي كاملًا" }, 400);
  if (!CLASSES.includes(cls)) return json({ error: "اختاري الفصل" }, 400);
  const key = `${cls}/${normName(name)}`;
  const s = store();
  const existing = await s.get(key, { type: "json" });
  if (existing) {
    // استكمال المحاولة نفسها على الجهاز نفسه فقط (لو انقطع الاتصال)
    if (body.token && body.token === existing.token && existing.status !== "done") {
      return json({ key, token: existing.token, resumed: true, questions: remaining(existing),
                    total: existing.order.length, sum: summary(existing), seconds: SECONDS_PER_Q });
    }
    return json({ error: existing.status === "done"
      ? "هذا الاسم أنهى المحاولة مسبقًا — لكل طالبة محاولة واحدة فقط."
      : "هذا الاسم بدأ المحاولة مسبقًا — لكل طالبة محاولة واحدة فقط. راجعي معلمتك." }, 409);
  }
  const now = Date.now();
  const rec = { name, cls, token: randToken(), startedAt: now, clockAt: now + COUNTDOWN_MS,
                order: shuffle(QUESTIONS.map(q => q.id)), answers: {}, status: "active" };
  const res = await s.setJSON(key, rec, { onlyIfNew: true });
  if (!res.modified) return json({ error: "هذا الاسم مسجّل مسبقًا — لكل طالبة محاولة واحدة فقط." }, 409);
  cache.at = 0;
  return json({ key, token: rec.token, resumed: false, questions: remaining(rec), total: rec.order.length, seconds: SECONDS_PER_Q });
}

async function answer(body) {
  const s = store();
  const rec = await s.get(String(body.key || ""), { type: "json" });
  if (!rec || rec.token !== body.token) return json({ error: "جلسة غير صالحة" }, 403);
  const q = QMAP[body.qid];
  if (!q || !rec.order.includes(q.id)) return json({ error: "سؤال غير معروف" }, 400);
  if (rec.answers[q.id]) { const a = rec.answers[q.id]; return json({ ok: a.ok, ans: q.ans, pts: a.pts, sum: summary(rec) }); }
  const now = Date.now();
  const ms = Math.max(0, now - (rec.clockAt || now));
  const limit = SECONDS_PER_Q * 1000 + 2500; // سماحية بسيطة لتأخر الشبكة
  const choice = ["a", "b", "c", "d"].includes(body.choice) ? body.choice : null;
  const ok = !!choice && choice === q.ans && ms <= limit;
  const left = Math.max(0, SECONDS_PER_Q * 1000 - ms);
  const pts = ok ? 100 + Math.round(50 * left / (SECONDS_PER_Q * 1000)) : 0;
  rec.answers[q.id] = { c: choice, ok, ms: Math.min(ms, SECONDS_PER_Q * 1000), pts };
  rec.clockAt = now + FEEDBACK_MS;
  if (Object.keys(rec.answers).length >= rec.order.length) { rec.status = "done"; rec.finishedAt = now; }
  await s.setJSON(body.key, rec);
  cache.at = 0;
  return json({ ok, ans: q.ans, pts, sum: summary(rec) });
}

// نتيجة الطالبة نفسها فقط (الترتيب يظهر للمعلمة وحدها)
async function me(url) {
  const key = url.searchParams.get("key") || "";
  const rec = await store().get(key, { type: "json" });
  if (!rec || rec.token !== url.searchParams.get("token")) return json({ error: "جلسة غير صالحة" }, 403);
  const bySkill = {};
  for (const id of rec.order) {
    const sk = QMAP[id].skill; bySkill[sk] ??= { name: SKILLS[sk], ok: 0, n: 0 };
    bySkill[sk].n++; if (rec.answers[id]?.ok) bySkill[sk].ok++;
  }
  return json({ ...summary(rec), bySkill });
}

function teacherOk(req, url) {
  const k = Netlify.env.get("TEACHER_KEY");
  return k && (url.searchParams.get("k") === k || req.headers.get("x-teacher-key") === k);
}

async function teacher(req, url) {
  if (!teacherOk(req, url)) return json({ error: "رابط المعلمة غير صحيح" }, 403);
  const rows = await allRecords(true);
  const list = rows.map(r => ({ key: r.key, ...summary(r.rec),
    detail: Object.fromEntries(Object.entries(r.rec.answers).map(([q, a]) => [q, a.ok ? 1 : 0])) }));
  const doneSorted = list.filter(x => x.done).sort(rankSort);
  list.forEach(x => { x.rank = x.done ? doneSorted.indexOf(x) + 1 : null; });
  const questions = QUESTIONS.map(q => ({ id: q.id, skill: q.skill, text: q.text }));
  return json({ list, questions, skills: SKILLS });
}

async function teacherDelete(req, url, body) {
  if (!teacherOk(req, url)) return json({ error: "رابط المعلمة غير صحيح" }, 403);
  await store().delete(String(body.key || ""));
  cache.at = 0;
  return json({ ok: true });
}

export default async (req) => {
  const url = new URL(req.url);
  const p = url.pathname.replace(/^\/api\/?/, "");
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (p === "start") return await start(body);
      if (p === "answer") return await answer(body);
      if (p === "teacher/delete") return await teacherDelete(req, url, body);
    } else {
      if (p === "me") return await me(url);
      if (p === "count") return json({ total: QUESTIONS.length });
      if (p === "teacher") return await teacher(req, url);
    }
    return json({ error: "not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "حدث خطأ في الخادم، حاولي مرة أخرى" }, 500);
  }
};

export const config = { path: "/api/*" };
