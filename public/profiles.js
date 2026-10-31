// بيانات كل مدرسة: الرابط ?s=<id> يحدد المدرسة (بدونه: المدرسة الافتراضية)
window.PROFILES = {
  default: { school: "متوسطة أم المؤمنين ميمونة", prep: "أ. خلود المطيري", principal: "أ. نادية العتيبي",
             classes: [["3-1", "ثالث ١"], ["3-2", "ثالث ٢"], ["3-3", "ثالث ٣"]] },
  sakhaibra: { school: "الابتدائية والمتوسطة الأولى بصخيبرة", prep: "د. أفنان الطلحي", principal: "أ. مها العروي",
               classes: [["3", "ثالث متوسط"]] },
};
window.SCHOOL_ID = (() => { const s = new URLSearchParams(location.search).get("s"); return PROFILES[s] ? s : "default"; })();
window.PROFILE = PROFILES[SCHOOL_ID];
window.CLS_AR = Object.fromEntries(PROFILE.classes);
window.applyProfile = () => {
  document.querySelectorAll("[data-p]").forEach(el => { el.textContent = PROFILE[el.dataset.p]; });
};
