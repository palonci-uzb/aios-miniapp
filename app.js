/* AIOS Mini App — ekranlar: HOME, READING, FULL PRACTICE, QUESTION TYPES, RETRY LAB, RESULT, WEAKNESS, PROGRESS, PROFILE.
   Natijalar backend'ga yuboriladi (server baholaydi). Memory/XP/streak/weakness backendda.
   Mavjud Reading HTML testlari O'ZGARTIRILMAYDI: natija same-origin iframe'dan o'qiladi. */
(function () {
  "use strict";
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { try { tg.ready(); tg.expand(); } catch (e) {} }
  const API = ((window.AIOS_CONFIG && window.AIOS_CONFIG.API_BASE) || "").replace(/\/$/, "");
  const $ = (s) => document.querySelector(s);
  const screenEl = $("#screen");
  const state = { me: null, passages: [], qtypes: [], screen: "home", offline: false, authError: false, practice: null, resultCtx: null, resultDetails: [] };

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (v) => (v == null ? "—" : v + "%");
  const barCls = (v) => (v == null ? "" : v >= 80 ? "" : v >= 60 ? "warn" : "bad");
  const bar = (v) => `<div class="bar ${barCls(v)}"><i style="width:${v == null ? 0 : v}%"></i></div>`;
  const shortTitle = (t) => String(t || "").replace(/^IELTS Reading Test - /, "");

  function banner(msg) { const b = $("#banner"); if (!msg) { b.classList.add("hidden"); return; } b.textContent = msg; b.classList.remove("hidden"); }

  async function api(path, body) {
    const opts = { headers: { "X-Telegram-Init-Data": (tg && tg.initData) || "" } };
    if (body !== undefined) { opts.method = "POST"; opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    try {
      const r = await fetch(API + path, opts);
      let data = {}; try { data = await r.json(); } catch (e) {}
      if (r.status === 401) { state.authError = true; banner("Mini App'ni Telegram bot orqali oching."); return null; }
      if (!r.ok) { banner(data.error || "Server xatosi"); return null; }
      state.offline = false; state.authError = false; banner("");
      return data;
    } catch (e) {
      state.offline = true;
      banner("Backend bilan aloqa yo'q — natijalar saqlanmaydi. main.py ishlayotganini tekshiring.");
      return null;
    }
  }

  /* ----------------------------- yuklash ----------------------------- */
  async function loadAll() {
    const [me, ps, qt] = await Promise.all([api("/api/me"), api("/api/passages"), api("/api/qtypes")]);
    if (me) state.me = me;
    if (ps) state.passages = ps.passages;
    if (qt) state.qtypes = qt.types;
    if (!ps) await loadOfflinePassages();
  }
  async function loadOfflinePassages() {
    try {   // faqat backend yo'q bo'lganda: testlarni natijasiz ochish uchun
      const r = await fetch("content_bank.json"); const b = await r.json();
      state.passages = b.passages.map((p) => ({ id: p.id, order: p.order, title: p.title, filename: p.filename, question_count: p.question_count, types: {} }));
    } catch (e) { state.passages = []; }
  }
  async function refreshMe() { const me = await api("/api/me"); if (me) state.me = me; }

  /* ----------------------------- router ----------------------------- */
  function go(name, arg) {
    state.screen = name;
    document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("active",
      b.dataset.nav === name || (name === "weakness" && b.dataset.nav === "progress") || (name === "profile" && b.dataset.nav === "home")));
    $("#nav").classList.toggle("hidden", name === "practice");
    screenEl.innerHTML = "";
    SCREENS[name](arg);
    window.scrollTo(0, 0);
  }
  document.querySelectorAll("#nav button").forEach((b) => b.addEventListener("click", async () => {
    if (["home", "retry", "progress", "types"].includes(b.dataset.nav)) await refreshMe();
    go(b.dataset.nav);
  }));
  function html(h) {
    screenEl.innerHTML = h;
    screenEl.querySelectorAll("[data-act]").forEach((el) => el.addEventListener("click", () => ACTIONS[el.dataset.act](el.dataset)));
  }

  /* ----------------------------- ekranlar ----------------------------- */
  const SCREENS = {
    home() {
      const m = state.me;
      if (!m) return html(`<div class="h-title">AIOS</div><div class="card"><p class="muted">${state.authError ? "Mini App'ni Telegram bot orqali oching." : "Ma'lumot yuklanmadi."}</p><button class="btn" data-act="reload">Qayta urinish</button></div>`);
      const st = { active: "🔥", at_risk: "⚠️", broken: "💤", new: "🌱" }[m.streak_status] || "🔥";
      const missions = m.missions.map((x) => `<div class="card ${x.completed ? "res-ok" : ""}"><div class="row"><div><h3>${x.completed ? "✅ " : ""}${esc(x.title)}</h3><div class="muted">${esc(x.description)}</div></div><span class="pill">${Math.min(x.progress, x.need)}/${x.need}</span></div>${x.completed ? "" : `<button class="btn small secondary" style="margin-top:8px" data-act="mission" data-screen="${esc(x.action.screen)}" data-qtype="${esc(x.action.qtype || "")}">Boshlash · +${x.xp} XP</button>`}</div>`).join("");
      const w = m.weakness[0];
      html(`<div class="row"><div class="h-title">Salom${m.name ? ", " + esc(m.name) : ""}!</div><button class="btn small secondary" data-act="goto" data-screen="profile">👤</button></div>
        <div class="stats"><div class="stat"><b>${st} ${m.streak}</b><small>streak</small></div><div class="stat"><b>⭐ ${m.xp}</b><small>XP · Lv ${m.level}</small></div><div class="stat"><b>🏆 ${m.reputation}</b><small>reputation</small></div><div class="stat"><b>🎯 ${m.target_band}</b><small>target</small></div></div>
        <div class="card"><div class="row"><span class="muted">Bugungi XP</span><b>${m.today.xp}/${m.today.goal}</b></div>${bar(Math.min(100, Math.round(100 * m.today.xp / m.today.goal)))}</div>
        <div class="card"><h3>👉 Keyingi qadam</h3><div class="muted">${esc(m.recommendation.label)}</div><button class="btn" data-act="recommend">Boshlash</button></div>
        <div class="section-title">Bugungi missionlar</div>${missions}
        ${w ? `<div class="card" data-act="goto" data-screen="weakness"><h3>🧠 Eng zaif joy: ${esc(w.type)}</h3><div class="muted">${w.reason ? esc(w.reason) + " · " : ""}aniqlik ${pct(w.accuracy)}</div>${bar(w.accuracy)}</div>` : ""}
        ${m.yesterday ? `<div class="muted" style="margin:6px 2px">📝 ${esc(m.yesterday)}</div>` : ""}`);
    },

    reading() {
      const cards = state.passages.map((p, i) => `<div class="test-card" data-act="open_passage" data-id="${esc(p.id)}"><div class="test-number-tag">P${i + 1}</div><div class="test-details"><div class="test-title-text">${esc(shortTitle(p.title))}</div><div class="muted">${p.question_count} savol${Object.keys(p.types || {}).length ? " · " + esc(Object.keys(p.types).join(", ")) : ""}</div></div><div class="play-icon">▶</div></div>`).join("");
      html(`<div class="h-title">📖 Reading</div>
        <div class="card"><h3>Full Practice</h3><div class="muted">P1 → P2 → P3 ketma-ket. Har passage tugagach keyingisi ochiladi, oxirida umumiy natija chiqadi.</div><button class="btn" data-act="full_seq" ${state.passages.length ? "" : "disabled"}>▶ Full Practice boshlash</button></div>
        <div class="section-title">Alohida passage'lar</div><div class="test-list">${cards || '<p class="muted">Passage topilmadi.</p>'}</div>`);
    },

    types() {
      const rows = state.qtypes.map((t) => {
        const pr = (state.me && state.me.progress.find((p) => p.type === t.type)) || {};
        return `<div class="card" data-act="pick_type" data-type="${esc(t.type)}"><div class="row"><h3>${esc(t.type)}</h3><span class="pill">${t.count} savol</span></div><div class="muted">Aniqlik: ${pct(pr.accuracy)} · urinishlar: ${pr.attempts || 0}</div>${bar(pr.accuracy == null ? null : pr.accuracy)}</div>`;
      }).join("");
      html(`<div class="h-title">🎯 Question Types</div>
        <div class="card"><h3>Adaptive practice</h3><div class="muted">AIOS eng zaif turni o'zi tanlaydi (random emas).</div><button class="btn" data-act="adaptive">🧠 Adaptive boshlash</button></div>
        <div class="section-title">Tur bo'yicha mashq</div>${rows || '<p class="muted">Ma\'lumot yo\'q.</p>'}`);
    },

    retry() {
      const c = state.me ? state.me.mistakes : { open: 0, due: 0, mastered: 0 };
      html(`<div class="h-title">🔁 Retry Lab</div>
        <div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><b>${c.open}</b><small>ochiq xato</small></div><div class="stat"><b>${c.due}</b><small>takrorlash vaqti</small></div><div class="stat"><b>${c.mastered}</b><small>o'zlashtirilgan</small></div></div>
        <div class="card"><h3>Faqat xato savollar</h3><div class="muted">To'g'ri ishlangan savollar qayta berilmaydi. Yana xato qilsangiz — keyingi Retry'da faqat qolgan xatolar.</div><button class="btn" data-act="retry_open" ${c.open ? "" : "disabled"}>Retry (${c.open})</button></div>
        <div class="card"><h3>Spaced repetition</h3><div class="muted">Day 1 → 3 → 7 → 14. Xato qilsangiz interval qisqaradi, to'g'ri bo'lsa uzayadi.</div><button class="btn" data-act="retry_due" ${c.due ? "" : "disabled"}>Takrorlash (${c.due})</button></div>`);
    },

    weakness() {
      const ws = state.me ? state.me.weakness : [];
      const rows = ws.map((w) => `<div class="card"><div class="row"><h3>${esc(w.type)}</h3><span class="pill ${w.status === "weak" ? "bad" : w.status === "improving" ? "ok" : ""}">${esc(w.status)}</span></div><div class="muted">${w.reason ? "Sabab: <b>" + esc(w.reason) + "</b><br>" : ""}${esc(w.reason_text || "")}</div><div class="muted" style="margin-top:4px">Aniqlik ${pct(w.accuracy)} · xatolar ${w.errors}</div>${bar(w.accuracy)}${w.skill === "Reading" && w.type !== "General" ? `<button class="btn small secondary" style="margin-top:8px" data-act="start_type" data-type="${esc(w.type)}">🎯 Shu turda mashq</button>` : ""}</div>`).join("");
      html(`<div class="h-title">🧠 Weakness</div>${rows || '<div class="card"><p class="muted">Hali ma\'lumot yo\'q. Bitta mashq bajaring — AIOS zaif joylarni sabab bilan aniqlaydi.</p></div>'}`);
    },

    progress() {
      const m = state.me; if (!m) return html('<div class="card"><p class="muted">Ma\'lumot yo\'q.</p></div>');
      const rows = m.progress.map((p) => `<div style="margin-bottom:10px"><div class="row"><span>${esc(p.type)}</span><b>${pct(p.accuracy)}</b></div>${bar(p.accuracy)}</div>`).join("");
      const rec = m.recent.map((r) => `<div class="row" style="padding:6px 0"><span class="muted">${esc(r.date)} · ${esc(r.title.slice(0, 30))}</span><b>${r.correct}/${r.total}</b></div>`).join("");
      html(`<div class="h-title">📈 Progress</div>
        <div class="stats"><div class="stat"><b>${m.reading.avg_percent}%</b><small>Reading o'rt.</small></div><div class="stat"><b>${m.reading.attempts}</b><small>mashq</small></div><div class="stat"><b>${m.best_streak}</b><small>eng yaxshi streak</small></div><div class="stat"><b>${m.missions_completed}</b><small>mission</small></div></div>
        <div class="card"><h3>Savol turlari bo'yicha</h3>${rows || '<p class="muted">Hali ma\'lumot yo\'q.</p>'}</div>
        <div class="card"><h3>Oxirgi natijalar</h3>${rec || '<p class="muted">Hali natija yo\'q.</p>'}</div>
        <button class="btn secondary" data-act="goto" data-screen="weakness">🧠 Weakness ekrani</button>`);
    },

    profile() {
      const m = state.me || {};
      html(`<div class="h-title">👤 Profil</div>
        <div class="card"><div class="row"><span class="muted">Ism</span><b>${esc(m.name || "—")}</b></div><div class="row"><span class="muted">Telegram ID</span><b>${esc(m.user_id || "—")}</b></div><div class="row"><span class="muted">Maqsad</span><b>${esc(m.goal || "IELTS 8.0")}</b></div><div class="row"><span class="muted">Level</span><b>${esc(m.level_title || "")} (${m.level || 1})</b></div><div class="row"><span class="muted">Reputation</span><b>${m.reputation || 0}</b></div></div>
        <div class="card"><div class="row"><span class="muted">Backend</span><b>${state.offline ? "❌ ulanmagan" : "✅ ulangan"}</b></div><div class="muted" style="margin-top:6px">Ma'lumotlaringiz faqat sizning Telegram ID'ngiz bilan saqlanadi.</div></div>
        <button class="btn secondary" data-act="goto" data-screen="home">← Home</button>`);
    },

    result(r) {
      const agg = r.agg || r;
      state.resultCtx = r;
      const typeRows = Object.entries(agg.by_type).map(([t, v]) => `<div style="margin-bottom:8px"><div class="row"><span>${esc(t)}</span><b>${v.c}/${v.n}</b></div>${bar(Math.round(100 * v.c / v.n))}</div>`).join("");
      const missions = (agg.new_missions || []).map((x) => `<div class="card res-ok">🎉 Mission bajarildi: ${esc(x.title)} (+${x.xp} XP)</div>`).join("");
      const tm = agg.time_sec ? ` · ⏱ ${Math.floor(agg.time_sec / 60)}m ${agg.time_sec % 60}s` : "";
      state.resultDetails = agg.details.slice().sort((a, b) => Number(a.ok) - Number(b.ok));
      const details = state.resultDetails.map((d, i) => `<div class="card ${d.ok ? "res-ok" : "res-bad"}"><div class="row"><span class="pill">${esc(d.type)} · #${d.number}</span><b>${d.ok ? "✓" : "✗"}</b></div><div style="margin:6px 0">${esc(d.text)}</div><div class="muted">Sizning javob: <b>${esc(d.user || "—")}</b>${d.ok ? "" : " · To'g'ri: <b>" + esc(d.correct_answer) + "</b>"}</div>${d.ok ? "" : `<div class="muted" style="margin-top:4px">Sabab: ${esc(d.reason || "")}</div>`}<details><summary>Matndagi dalil / izoh</summary><div class="muted" style="margin-top:4px">${esc(d.explanation)}</div></details>${d.ok ? "" : `<button class="btn small secondary" style="margin-top:8px" data-act="explain" data-i="${i}">🤖 Nega xato qildim?</button><div class="muted" id="why-${i}" style="margin-top:6px;white-space:pre-line"></div>`}</div>`).join("");
      const open = agg.mistakes ? agg.mistakes.open : 0;
      html(`<div class="h-title">📊 Natija</div>
        <div class="card"><div class="row"><div><div style="font-size:34px;font-weight:800">${agg.correct}/${agg.total}</div><div class="muted">${agg.percent}% to'g'ri · ${agg.wrong} xato${tm}</div></div><div style="text-align:right"><div>⭐ +${agg.xp_gained} XP</div><div>🏆 +${agg.rep_gained} REP</div><div>🔥 ${agg.streak}</div></div></div>${bar(agg.percent)}${agg.xp_note ? `<div class="muted" style="margin-top:6px">${esc(agg.xp_note)}</div>` : ""}</div>
        ${missions}
        <div class="card"><h3>🧠 Diagnosis</h3><div class="muted" style="white-space:pre-line" id="diag">${esc(agg.diagnosis)}</div><button class="btn small secondary" style="margin-top:8px" data-act="ai_diag">🤖 AI tahlil</button></div>
        <div class="card"><h3>Savol turlari bo'yicha</h3>${typeRows}</div>
        <div class="card"><h3>Weakness</h3>${(agg.weakness || []).map((w) => `<div class="muted">• ${esc(w.type)} — ${pct(w.accuracy)}${w.reason ? " → " + esc(w.reason) : ""}</div>`).join("") || '<div class="muted">Yangi weakness aniqlanmadi.</div>'}</div>
        <button class="btn" data-act="retry_after" ${open ? "" : "disabled"}>🔁 Retry — ${open} ta xato</button>
        <button class="btn secondary" data-act="goto" data-screen="home">🏠 Home</button>
        <div class="section-title" style="margin-top:14px">Savollar tahlili</div>${details}`);
    },
  };

  /* ----------------------------- harakatlar ----------------------------- */
  const ACTIONS = {
    goto: (d) => go(d.screen),
    reload: async () => { await loadAll(); go("home"); },
    mission: (d) => {
      if (d.screen === "qtypes") return startSession({ mode: "qtype", qtype: d.qtype, count: 10 });
      if (d.screen === "full") return go("reading");
      if (d.screen === "retry") return go("retry");
      go("home");
    },
    recommend: () => {
      const r = state.me.recommendation;
      if (r.action === "retry") return startSession({ mode: "retry" });
      if (r.action === "review") return startSession({ mode: "review" });
      if (r.action === "adaptive") return startSession({ mode: "adaptive", count: 10 });
      go("reading");
    },
    open_passage: (d) => openPassage(d.id, null),
    full_seq: () => { const seq = { results: [] }; openPassage(state.passages[0].id, seq); },
    pick_type: (d) => chooseCount(d.type),
    count: (d) => startSession({ mode: "qtype", qtype: d.type, count: Number(d.n) }),
    start_type: (d) => startSession({ mode: "qtype", qtype: d.type, count: 10 }),
    adaptive: () => startSession({ mode: "adaptive", count: 10 }),
    retry_open: () => startSession({ mode: "retry" }),
    retry_due: () => startSession({ mode: "review" }),
    retry_after: () => { const r = state.resultCtx; startSession({ mode: "retry", ref: r && !r.agg ? r.session_id : null }); },
    ai_diag: async () => {
      const r = state.resultCtx; const sid = r && (r.agg ? r.agg.session_id : r.session_id); if (!sid) return;
      $("#diag").textContent = "AI tahlil qilmoqda…";
      const out = await api("/api/diagnose", { session_id: sid });
      $("#diag").textContent = out ? (out.text + (out.note ? "\n\n" + out.note : "")) : "AI diagnostic vaqtincha unavailable.";
    },
    explain: async (d) => {
      const x = state.resultDetails[Number(d.i)]; const box = $("#why-" + d.i); box.textContent = "…";
      const out = await api("/api/explain", { qid: x.id, answer: x.user });
      box.textContent = out ? (out.text + (out.note ? "\n(" + out.note + ")" : "")) : "AI diagnostic vaqtincha unavailable.";
    },
  };

  function chooseCount(type) {
    html(`<div class="h-title">${esc(type)}</div><div class="card"><div class="muted">Nechta savol?</div>${[5, 10, 15].map((n) => `<button class="btn secondary" data-act="count" data-n="${n}" data-type="${esc(type)}">${n} ta savol</button>`).join("")}</div><button class="btn secondary" data-act="goto" data-screen="types">← Orqaga</button>`);
  }

  /* ----------------------------- native practice ----------------------------- */
  async function startSession(body) {
    const s = await api("/api/session", body);
    if (!s) return;
    if (!s.items.length) {
      html(`<div class="h-title">${esc(s.title)}</div><div class="card"><p class="muted">${esc(s.note || "Hozircha savol yo'q.")}</p></div><button class="btn secondary" data-act="goto" data-screen="home">← Home</button>`);
      return;
    }
    state.practice = { session: s, answers: {}, t0: Date.now(), passages: {} };
    go("practice");
  }
  SCREENS.practice = function () {
    const p = state.practice, s = p.session; let lastKey = "";
    const cards = s.items.map((q, i) => {
      const key = q.passage_id + "|" + q.rubric + "|" + q.instruction;
      const head = key !== lastKey ? `<div class="instr"><b>${esc(shortTitle(q.passage_title))}</b> — ${esc(q.rubric)}\n${esc(q.instruction)}</div>${q.input === "choice" && q.context ? `<div class="q-ctx">${esc(q.context)}</div>` : ""}` : "";
      lastKey = key;
      let input;
      if (q.input === "text") input = `<input class="txt" data-q="${esc(q.id)}" placeholder="Javobingiz" autocomplete="off">`;
      else {
        const long = q.options.some((o) => o.label.length > 3);
        input = `<div class="opts ${long ? "col" : ""}">${q.options.map((o) => `<button class="opt" data-q="${esc(q.id)}" data-v="${esc(o.value)}">${esc(o.label)}</button>`).join("")}</div>`;
      }
      return `<div class="q-card">${head}<div class="row"><span class="pill">${esc(q.type)}</span><button class="btn small secondary" data-passage="${esc(q.passage_id)}">📄 Matn</button></div><div class="q-text"><b>${i + 1}.</b> ${esc(q.text)}</div>${input}</div>`;
    }).join("");
    screenEl.innerHTML = `<div class="row"><div class="h-title">${esc(s.title)}</div><button class="btn small secondary" id="p-exit">✕</button></div>${s.note ? `<div class="muted" style="margin-bottom:8px">${esc(s.note)}</div>` : ""}<div id="p-prog" class="muted">0/${s.items.length} javob berildi</div>${cards}<div class="sticky-bar"><button class="btn" id="p-finish">✅ Yakunlash</button></div>`;
    const upd = () => { const n = Object.values(p.answers).filter(Boolean).length; $("#p-prog").textContent = `${n}/${s.items.length} javob berildi`; };
    screenEl.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.q; p.answers[id] = b.dataset.v;
      screenEl.querySelectorAll(".opt").forEach((x) => { if (x.dataset.q === id) x.classList.toggle("sel", x === b); });
      upd();
    }));
    screenEl.querySelectorAll(".txt").forEach((i) => i.addEventListener("input", () => { p.answers[i.dataset.q] = i.value.trim(); upd(); }));
    screenEl.querySelectorAll("[data-passage]").forEach((b) => b.addEventListener("click", () => showPassage(b.dataset.passage)));
    $("#p-exit").addEventListener("click", () => { if (confirm("Chiqsangiz natija saqlanmaydi. Chiqasizmi?")) { state.practice = null; go("home"); } });
    $("#p-finish").addEventListener("click", async () => {
      const n = Object.values(p.answers).filter(Boolean).length;
      if (n < s.items.length && !confirm(`${s.items.length - n} ta savol javobsiz. Baribir yakunlaysizmi?`)) return;
      $("#p-finish").disabled = true;
      const r = await api("/api/submit", { session_id: s.session_id, answers: p.answers, time_sec: Math.round((Date.now() - p.t0) / 1000) });
      if (!r) { $("#p-finish").disabled = false; return; }
      state.practice = null; await refreshMe(); go("result", r);
    });
  };
  async function showPassage(pid) {
    const p = state.practice; let txt = p && p.passages[pid];
    if (!txt) { const r = await api("/api/passage?id=" + encodeURIComponent(pid)); if (!r) return; txt = r.title + "\n\n" + r.text; if (p) p.passages[pid] = txt; }
    const d = document.createElement("div"); d.className = "passage-drawer";
    d.innerHTML = `<button class="btn small secondary" style="position:sticky;top:0">✕ Yopish</button><div style="margin-top:12px">${esc(txt)}</div>`;
    d.querySelector("button").addEventListener("click", () => d.remove());
    document.body.appendChild(d);
  }

  /* ----------------------------- Full test (mavjud HTML, iframe) ----------------------------- */
  let watcher = null;
  async function openPassage(pid, seq) {
    const p = state.passages.find((x) => x.id === pid); if (!p) return;
    let sid = null;
    if (!state.offline) { const s = await api("/api/session", { mode: "full", passage_id: pid }); if (s) sid = s.session_id; }
    const idx = state.passages.indexOf(p);
    const frame = $("#test-frame"); const t0 = Date.now(); let done = false;
    $("#active-test-title").textContent = (seq ? `Full Practice · P${idx + 1}/${state.passages.length} · ` : "") + shortTitle(p.title);
    $("#test-overlay").classList.add("hidden");
    $("#test-view").classList.remove("hidden");
    frame.src = "practise reading/" + encodeURIComponent(p.filename);
    clearInterval(watcher);
    watcher = setInterval(async () => {
      if (done) return;
      let doc; try { doc = frame.contentDocument; } catch (e) { return; }
      if (!doc) return;
      const modal = doc.getElementById("submissionModal");
      if (!modal || modal.style.display !== "flex") return;
      done = true; clearInterval(watcher);
      const answers = {};
      doc.querySelectorAll("[name]").forEach((el) => {
        const m = /^q(\d+)$/i.exec(el.getAttribute("name") || ""); if (!m) return;
        const qid = pid + ":q" + m[1];
        if (el.type === "radio" || el.type === "checkbox") { if (el.checked) answers[qid] = el.value; }
        else answers[qid] = (el.value || "").trim();
      });
      const time_sec = Math.round((Date.now() - t0) / 1000);
      if (!sid) { overlay(`<div class="muted">Backend ulanmagan — natija saqlanmadi.</div><button class="btn secondary" id="ov-close">Yopish</button>`, { "ov-close": closeTest }); return; }
      overlay(`<div class="muted">Natija saqlanmoqda…</div>`, {});
      const r = await api("/api/submit", { session_id: sid, answers, time_sec });
      if (!r) { overlay(`<div class="muted">Natijani saqlab bo'lmadi.</div><button class="btn secondary" id="ov-close">Yopish</button>`, { "ov-close": closeTest }); return; }
      onFullDone(r, seq, idx);
    }, 600);
  }
  function overlay(h, handlers) {
    const o = $("#test-overlay"); o.innerHTML = h; o.classList.remove("hidden");
    Object.keys(handlers).forEach((id) => { const el = o.querySelector("#" + id); if (el) el.addEventListener("click", handlers[id]); });
  }
  function closeTest() { clearInterval(watcher); $("#test-view").classList.add("hidden"); $("#test-frame").src = "about:blank"; $("#test-overlay").classList.add("hidden"); }
  $("#test-back").addEventListener("click", () => { if (confirm("Testdan chiqasizmi? Topshirilmagan natija saqlanmaydi.")) { closeTest(); refreshMe().then(() => go(state.screen)); } });

  function onFullDone(r, seq, idx) {
    const summary = `<div><b>✅ Saqlandi: ${r.correct}/${r.total} (${r.percent}%)</b> · ⭐ +${r.xp_gained} XP</div>`;
    if (seq) {
      seq.results.push(r);
      const next = state.passages[idx + 1];
      if (next) { overlay(summary + `<button class="btn" id="ov-next">Keyingi: P${idx + 2} →</button><button class="btn secondary" id="ov-res">Shu natijani ko'rish</button>`, { "ov-next": () => openPassage(next.id, seq), "ov-res": () => showResult(r) }); return; }
      overlay(summary + `<button class="btn" id="ov-all">📊 Umumiy natija</button>`, { "ov-all": () => showResult(aggregate(seq.results)) });
      return;
    }
    overlay(summary + `<button class="btn" id="ov-res">📊 Natija va tahlil</button><button class="btn secondary" id="ov-close">Testni ko'rib chiqish</button>`, { "ov-res": () => showResult(r), "ov-close": () => $("#test-overlay").classList.add("hidden") });
  }
  async function showResult(r) { closeTest(); await refreshMe(); go("result", r); }
  function aggregate(rs) {
    const by = {}; let c = 0, t = 0, time = 0, xp = 0, rep = 0; const details = []; const nm = [];
    rs.forEach((r) => {
      c += r.correct; t += r.total; time += r.time_sec; xp += r.xp_gained; rep += r.rep_gained; details.push(...r.details); nm.push(...(r.new_missions || []));
      Object.entries(r.by_type).forEach(([k, v]) => { by[k] = by[k] || { n: 0, c: 0 }; by[k].n += v.n; by[k].c += v.c; });
    });
    const last = rs[rs.length - 1];
    const wrongTypes = {}; details.filter((d) => !d.ok).forEach((d) => { wrongTypes[d.type] = (wrongTypes[d.type] || 0) + 1; });
    const worst = Object.entries(wrongTypes).sort((a, b) => b[1] - a[1])[0];
    const diag = `Full Practice: ${c}/${t} (${Math.round(100 * c / Math.max(t, 1))}%).` + (worst ? `\nEng ko'p xato: ${worst[0]} — ${worst[1]} ta. Retry Lab'da shu xatolarni qayta ishlang.` : "\nBarcha savollar to'g'ri!");
    return { agg: { total: t, correct: c, wrong: t - c, percent: Math.round(100 * c / Math.max(t, 1)), time_sec: time, by_type: by, details, xp_gained: xp, rep_gained: rep, streak: last.streak, xp_note: "", new_missions: nm, diagnosis: diag, weakness: last.weakness, mistakes: last.mistakes, session_id: last.session_id }, session_id: last.session_id };
  }

  /* ----------------------------- start ----------------------------- */
  (async function init() {
    screenEl.innerHTML = '<p class="muted" style="padding:20px">Yuklanmoqda…</p>';
    await loadAll();
    go("home");
  })();
})();
