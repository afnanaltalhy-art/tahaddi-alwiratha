// صورة الطالبة الكرتونية + لمسات الصالون
// المجموعات ذات الاختيار الواحد (تسريحة، لون الشعر، لون العيون، الخلفية): اختيار جديد يستبدل القديم
window.FEATURES = [
  { id: "style", name: "تسريحة الشعر", icon: "💇‍♀️", v: [
    { id: "comb", name: "فرد", icon: "〰️" }, { id: "braid", name: "ضفيرة", icon: "🪢" }, { id: "bun", name: "كعكة", icon: "🍩" } ] },
  { id: "hair", name: "لون الشعر", icon: "🎨", v: [
    { id: "black", name: "أسود", color: "#1b1411" }, { id: "brown", name: "بنّي", color: "#6b3f22" }, { id: "honey", name: "عسلي", color: "#b9803d" },
    { id: "auburn", name: "كستنائي", color: "#9a3a1c" }, { id: "pink", name: "وردي", color: "#e47aa3" }, { id: "purple", name: "بنفسجي", color: "#8a63d2" } ] },
  { id: "eyes", name: "لون العيون", icon: "👁️", v: [
    { id: "honey", name: "عسلي", color: "#a8742c" }, { id: "green", name: "أخضر", color: "#3f8f5a" }, { id: "blue", name: "أزرق", color: "#3b7fc4" } ] },
  { id: "blush", name: "أحمر خدود", icon: "🌸", v: [
    { id: "pink", name: "وردي", color: "#ff8fa6" }, { id: "coral", name: "مرجاني", color: "#ff8a70" }, { id: "rose", name: "زهري", color: "#e86b9a" } ] },
  { id: "lips", name: "أحمر شفاه", icon: "💄", v: [
    { id: "red", name: "أحمر", color: "#e2456a" }, { id: "nude", name: "طبيعي", color: "#d98274" }, { id: "berry", name: "توتي", color: "#a8285e" } ] },
  { id: "shadow", name: "ظل عيون", icon: "✨", v: [
    { id: "purple", name: "بنفسجي", color: "#9b6fd8" }, { id: "pink", name: "وردي", color: "#f48fb1" }, { id: "gold", name: "ذهبي", color: "#e6b84a" } ] },
  { id: "lashes", name: "كحل ورموش", icon: "🖤", v: [{ id: "on", name: "أضيفي" }] },
  { id: "bow", name: "فيونكة", icon: "🎀", v: [
    { id: "pink", name: "وردية", color: "#ff6f9f" }, { id: "blue", name: "زرقاء", color: "#5aa9e6" }, { id: "purple", name: "بنفسجية", color: "#9b6fd8" } ] },
  { id: "flower", name: "وردة", icon: "🌼", v: [
    { id: "yellow", name: "صفراء", color: "#ffd23f" }, { id: "pink", name: "وردية", color: "#ff8fb8" }, { id: "white", name: "بيضاء", color: "#ffffff" } ] },
  { id: "earrings", name: "أقراط", icon: "💎", v: [
    { id: "aqua", name: "فيروزي", color: "#5ec8e5" }, { id: "pearl", name: "لؤلؤ", color: "#f3ede2" }, { id: "ruby", name: "ياقوت", color: "#e2456a" } ] },
  { id: "goggles", name: "نظارة المختبر", icon: "🥽", v: [{ id: "on", name: "أضيفي" }] },
  { id: "crown", name: "تاج نجمة العلوم", icon: "👑", v: [{ id: "on", name: "أضيفي" }] },
  { id: "bg", name: "الخلفية", icon: "🖼️", v: [
    { id: "pink", name: "وردية", color: "#ffd9e8" }, { id: "mint", name: "نعناعية", color: "#d4f3e6" }, { id: "sky", name: "سماوية", color: "#d6ebff" }, { id: "gold", name: "ذهبية", color: "#fff0c2" } ] },
];
window.featureColor = (look, f, def) => { const v = look && look[f]; if (!v) return def; const it = FEATURES.find(x => x.id === f).v.find(x => x.id === v); return (it && it.color) || def; };

window.avatarSVG = function (look, opts) {
  look = (look && !Array.isArray(look)) ? look : {};
  const L = { has: (f) => !!look[f] };
  const o = Object.assign({ bg: true, id: "a" + Math.random().toString(36).slice(2, 7) }, opts || {});
  const C = (f, def) => featureColor(look, f, def);
  const HAIR = C("hair", "#3a2318");
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (c) => Math.max(0, Math.min(255, Math.round(c * k))); return "#" + [n >> 16, (n >> 8) & 255, n & 255].map(c => f(c).toString(16).padStart(2, "0")).join(""); };
  const HAIR2 = shade(HAIR, 1.35), HAIRD = shade(HAIR, 0.75);
  const EYE = C("eyes", "#3b2a20");
  const BG = C("bg", null);
  const SKIN = "#f7d2b4", SKIN2 = "#eab896";
  const style = look.style || "messy";
  const neat = style !== "messy";

  const spiky = (cx, cy, rx, ry, a0, a1, n, k) => {
    let d = "";
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180, r = i % 2 ? k : 1;
      d += (i ? " L" : "M") + (cx + Math.cos(a) * rx * r).toFixed(1) + " " + (cy + Math.sin(a) * ry * r).toFixed(1);
    }
    return d;
  };

  const s = [];
  s.push(`<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="صورة الطالبة">`);
  s.push(`<defs><radialGradient id="${o.id}g" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#fdf2ff"/><stop offset="1" stop-color="${BG || "#e9e2fb"}"/></radialGradient>
    <clipPath id="${o.id}c"><circle cx="120" cy="130" r="120"/></clipPath></defs>`);
  s.push(`<g clip-path="url(#${o.id}c)">`);
  if (o.bg) s.push(`<circle cx="120" cy="130" r="120" fill="${BG ? BG : `url(#${o.id}g)`}"/>`);
  if (o.bg && BG) s.push(`<circle cx="40" cy="60" r="5" fill="#fff" opacity=".8"/><circle cx="205" cy="190" r="4" fill="#fff" opacity=".8"/><circle cx="210" cy="70" r="3" fill="#fff" opacity=".8"/>`);

  // الشعر الخلفي
  if (style === "messy") {
    s.push(`<path d="${spiky(120, 112, 86, 80, 150, 390, 26, 0.8)} Z" fill="${HAIR}"/>`);
    s.push(`<path d="${spiky(120, 150, 74, 62, 95, 175, 8, 0.82)} L120 150 Z" fill="${HAIR}"/>`);
    s.push(`<path d="${spiky(120, 150, 74, 62, 5, 85, 8, 0.82)} L120 150 Z" fill="${HAIR}"/>`);
  } else if (style === "comb") {
    s.push(`<path d="M60 122 C54 58 90 36 120 36 C152 36 188 58 180 124 L188 214 C172 224 152 218 150 214 L150 150 L90 150 L90 214 C86 220 66 224 52 214 Z" fill="${HAIR}"/>`);
  } else if (style === "bun") {
    s.push(`<circle cx="120" cy="34" r="26" fill="${HAIR}"/><path d="M100 30 Q120 18 140 30" fill="none" stroke="${HAIR2}" stroke-width="3" stroke-linecap="round"/>`);
    s.push(`<path d="M62 124 C56 62 90 44 120 44 C150 44 184 62 178 124 Z" fill="${HAIR}"/>`);
  } else { // braid
    s.push(`<path d="M62 124 C56 60 90 40 120 40 C150 40 184 60 178 124 Z" fill="${HAIR}"/>`);
  }

  // الجسم: معطف المختبر
  s.push(`<path d="M34 262 C40 212 76 194 120 194 C164 194 200 212 206 262 Z" fill="#ffffff" stroke="#d9dcea" stroke-width="2"/>`);
  s.push(`<path d="M100 196 L120 232 L140 196 Z" fill="#6b5bb5"/>`);
  s.push(`<path d="M96 196 L120 238 L104 262 M144 196 L120 238 L136 262" fill="none" stroke="#d9dcea" stroke-width="2"/>`);
  s.push(`<rect x="148" y="228" width="26" height="18" rx="3" fill="none" stroke="#d9dcea" stroke-width="2"/><rect x="153" y="222" width="3" height="14" rx="1.5" fill="#1f8a8a"/><rect x="160" y="224" width="3" height="12" rx="1.5" fill="#e39a4f"/>`);
  s.push(`<rect x="106" y="168" width="28" height="32" rx="10" fill="${SKIN2}"/>`);

  // الضفيرة الجانبية (فوق الكتف)
  if (style === "braid") {
    for (let i = 0; i < 6; i++) s.push(`<ellipse cx="${66 - i * 1.5}" cy="${142 + i * 17}" rx="13" ry="11" fill="${i % 2 ? HAIRD : HAIR}"/>`);
    s.push(`<rect x="51" y="236" width="18" height="7" rx="3" fill="#ff6f9f"/><path d="M60 243 l-6 14 M60 243 l0 16 M60 243 l6 14" stroke="${HAIR}" stroke-width="4" stroke-linecap="round"/>`);
  }

  // الأذنان والأقراط
  s.push(`<circle cx="67" cy="128" r="11" fill="${SKIN2}"/><circle cx="173" cy="128" r="11" fill="${SKIN2}"/>`);
  if (L.has("earrings")) for (const x of [66, 174]) s.push(`<circle cx="${x}" cy="142" r="3.5" fill="#e0a624"/><path d="M${x} 145 L${x - 6} 156 L${x} 164 L${x + 6} 156 Z" fill="${C("earrings", "#5ec8e5")}" stroke="#e0a624" stroke-width="1.5"/>`);

  // الوجه
  s.push(`<ellipse cx="120" cy="122" rx="53" ry="58" fill="${SKIN}"/>`);
  if (L.has("shadow")) s.push(`<ellipse cx="98" cy="117" rx="14" ry="8" fill="${C("shadow", "#9b6fd8")}" opacity=".6"/><ellipse cx="142" cy="117" rx="14" ry="8" fill="${C("shadow", "#9b6fd8")}" opacity=".6"/>`);
  for (const x of [98, 142]) s.push(`<ellipse cx="${x}" cy="125" rx="10" ry="11" fill="#fff"/><circle cx="${x}" cy="127" r="6.5" fill="${EYE}"/><circle cx="${x}" cy="127" r="3" fill="#1d1410"/><circle cx="${x + 2.5}" cy="124" r="2.2" fill="#fff"/>`);
  if (L.has("lashes")) {
    s.push(`<path d="M87 121 Q98 110 110 121" fill="none" stroke="#1d1410" stroke-width="3.2" stroke-linecap="round"/><path d="M131 121 Q142 110 154 121" fill="none" stroke="#1d1410" stroke-width="3.2" stroke-linecap="round"/>`);
    s.push(`<path d="M88 120 l-5 -4 M90 117 l-4 -6 M150 117 l4 -6 M153 120 l5 -4" stroke="#1d1410" stroke-width="2.2" stroke-linecap="round"/>`);
  }
  s.push(neat
    ? `<path d="M86 104 Q98 97 110 103 M130 103 Q142 97 154 104" fill="none" stroke="${HAIRD}" stroke-width="3.5" stroke-linecap="round"/>`
    : `<path d="M86 101 Q98 102 110 106 M130 106 Q142 102 154 101" fill="none" stroke="${HAIRD}" stroke-width="3.5" stroke-linecap="round"/>`);
  s.push(`<path d="M118 132 Q121 142 116 146" fill="none" stroke="${SKIN2}" stroke-width="3" stroke-linecap="round"/>`);
  if (L.has("blush")) s.push(`<circle cx="84" cy="146" r="11" fill="${C("blush", "#ff8fa6")}" opacity=".55"/><circle cx="156" cy="146" r="11" fill="${C("blush", "#ff8fa6")}" opacity=".55"/>`);
  s.push(L.has("lips")
    ? `<path d="M104 157 Q112 152 120 156 Q128 152 136 157 Q128 170 120 170 Q112 170 104 157 Z" fill="${C("lips", "#e2456a")}"/><path d="M106 158 Q120 162 134 158" fill="none" stroke="${shade(C("lips", "#e2456a"), .75)}" stroke-width="1.5"/>`
    : `<path d="M106 157 Q120 168 134 157" fill="none" stroke="#b5654f" stroke-width="3.2" stroke-linecap="round"/>`);

  // الغرة
  if (neat) {
    s.push(`<path d="M64 116 C66 66 98 50 124 52 C154 54 178 72 176 116 C164 92 144 78 120 80 C106 82 94 92 90 106 C84 96 76 98 64 116 Z" fill="${HAIR}"/>`);
    s.push(`<path d="M100 60 C112 56 132 56 146 62" fill="none" stroke="${HAIR2}" stroke-width="3" stroke-linecap="round"/>`);
  } else {
    s.push(`<path d="M62 112 L70 74 L80 96 L88 62 L100 90 L110 56 L120 88 L132 56 L142 90 L152 62 L160 96 L170 74 L178 112 C170 86 150 78 120 80 C92 80 72 88 62 112 Z" fill="${HAIR}"/>`);
    s.push(`<path d="M40 70 q8 -10 16 0 q8 10 16 0 M182 44 q10 -6 14 4" fill="none" stroke="${HAIR}" stroke-width="3" stroke-linecap="round"/>`);
    s.push(`<text x="196" y="72" font-size="30" font-weight="700" fill="#e39a4f" font-family="Almarai,sans-serif">؟</text><text x="30" y="58" font-size="22" font-weight="700" fill="#1f8a8a" font-family="Almarai,sans-serif">؟</text>`);
  }

  if (L.has("bow")) s.push(`<g transform="translate(70 70) rotate(-20)"><path d="M0 0 L-20 -12 L-20 12 Z M0 0 L20 -12 L20 12 Z" fill="${C("bow", "#ff6f9f")}" stroke="${shade(C("bow", "#ff6f9f"), .8)}" stroke-width="2" stroke-linejoin="round"/><circle r="6" fill="${shade(C("bow", "#ff6f9f"), .8)}"/></g>`);
  if (L.has("flower")) {
    s.push(`<g transform="translate(170 78)">`);
    for (let i = 0; i < 5; i++) { const a = i * 72 * Math.PI / 180; s.push(`<circle cx="${(Math.cos(a) * 9).toFixed(1)}" cy="${(Math.sin(a) * 9).toFixed(1)}" r="7.5" fill="${C("flower", "#ffd23f")}" stroke="${shade(C("flower", "#ffd23f"), .85)}" stroke-width="1"/>`); }
    s.push(`<circle r="5.5" fill="#f08a24"/></g>`);
  }
  if (L.has("goggles")) {
    s.push(`<path d="M62 84 Q120 66 178 84" fill="none" stroke="#2f6f7a" stroke-width="6"/>`);
    s.push(`<rect x="82" y="66" width="34" height="24" rx="10" fill="#bfeef2" fill-opacity=".85" stroke="#2f6f7a" stroke-width="4"/><rect x="124" y="66" width="34" height="24" rx="10" fill="#bfeef2" fill-opacity=".85" stroke="#2f6f7a" stroke-width="4"/>`);
    s.push(`<rect x="114" y="74" width="12" height="5" rx="2" fill="#2f6f7a"/><path d="M89 72 l8 0 M131 72 l8 0" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
  }
  if (L.has("crown")) {
    const cy = style === "bun" ? 6 : 0;
    s.push(`<g transform="translate(0 ${cy})"><path d="M88 52 L92 22 L106 38 L120 14 L134 38 L148 22 L152 52 Z" fill="#f2c230" stroke="#c9961a" stroke-width="3" stroke-linejoin="round"/>`);
    s.push(`<path d="M120 26 l3.5 7 7.6 1 -5.5 5.3 1.3 7.6 -6.9 -3.6 -6.9 3.6 1.3 -7.6 -5.5 -5.3 7.6 -1 Z" fill="#fff6c9"/>`);
    s.push(`<circle cx="92" cy="22" r="4" fill="#ff6f9f"/><circle cx="148" cy="22" r="4" fill="#5ec8e5"/></g>`);
  }
  s.push(`</g></svg>`);
  return s.join("");
};
