(() => {
  "use strict";
  const COURSE = window.COURSE, GLOSSARY = window.GLOSSARY;
  const KEY = "aipilled.v1";
  const XP_READ = 2, XP_RIGHT = 10, XP_GAME = 15, XP_NOTE = 5;
  const RANKS = [[0, "Curious"], [120, "Prompt-curious"], [350, "Tool-literate"], [700, "Builder-minded"], [1100, "Agent wrangler"], [1500, "AI-pilled"], [1900, "Operator"]];

  // ---------- icons (filled only) ----------
  const P = {
    flame: "M12 2c1 3.6 5.5 6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.3 1.1-3.9 2.3-5.1.2 1.8 1.1 2.9 2.2 3.4C10.6 8.6 10.8 5.3 12 2z",
    bolt: "M13.5 2 4 14h6.5l-1 8L19 10h-6.5l1-8z",
    star: "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z",
    lock: "M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z",
    ok: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm4.3 6.3-5.8 5.8-2.8-2.9-1.4 1.4 4.2 4.3 7.2-7.2z",
    no: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm3.5 5.1L12 10.6 8.5 7.1 7.1 8.5l3.5 3.5-3.5 3.5 1.4 1.4 3.5-3.5 3.5 3.5 1.4-1.4-3.5-3.5 3.5-3.5z",
    close: "M5.6 4.2 12 10.6l6.4-6.4 1.4 1.4-6.4 6.4 6.4 6.4-1.4 1.4-6.4-6.4-6.4 6.4-1.4-1.4 6.4-6.4-6.4-6.4z",
    more: "M5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
    down: "M6 9h12l-6 7z",
    play: "M8 5v14l11-7z",
    case: "M9 3h6a2 2 0 0 1 2 2v1h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3V5a2 2 0 0 1 2-2zm0 3h6V5H9v1z",
    trophy: "M6 3h12v3a6 6 0 0 1-5 5.9V15h3v2H8v-2h3v-3.1A6 6 0 0 1 6 6V3zM3 4h2v2c0 .9.4 1.7 1 2.2V9a4 4 0 0 1-3-4V4zm16 0h2v1a4 4 0 0 1-3 4v-.8c.6-.5 1-1.3 1-2.2V4zM7 19h10v2H7z"
  };
  const ic = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${P[n]}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (s, r = document) => r.querySelector(s);

  // ---------- state ----------
  const fresh = () => ({ xp: 0, streak: 0, last: null, levels: {}, theme: "system" });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const lv = id => (S.levels[id] ||= { seen: [], ans: {}, done: false, stars: 0, notes: null, xp: 0 });

  const today = () => new Date().toLocaleDateString("en-CA");
  const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  function touchStreak() {
    const t = today();
    if (S.last === t) return;
    S.streak = S.last && dayDiff(S.last, t) === 1 ? S.streak + 1 : 1;
    S.last = t;
  }
  function liveStreak() { return S.last && dayDiff(S.last, today()) <= 1 ? S.streak : 0; }
  function award(id, n, label) {
    if (!n) return;
    S.xp += n; lv(id).xp += n; touchStreak(); save();
    const el = document.createElement("div");
    el.className = "xp-pop num"; el.textContent = `+${n} XP${label ? " · " + label : ""}`;
    document.body.appendChild(el); setTimeout(() => el.remove(), 1200);
    const px = $(".pxp b"); if (px) px.textContent = S.xp;
  }
  function rank(xp = S.xp) {
    let i = 0; RANKS.forEach((r, j) => { if (xp >= r[0]) i = j; });
    const next = RANKS[i + 1];
    return { name: RANKS[i][1], i, next, pct: next ? (xp - RANKS[i][0]) / (next[0] - RANKS[i][0]) : 1 };
  }
  const ck = (c, i) => c.id || `${c.t}:${c.h || c.q || i}`;
  const unlocked = idx => idx === 0 || lv(COURSE[idx - 1].id).done;
  const scored = L => L.cards.filter(c => c.t === "quiz" || c.t === "match" || c.t === "order");
  function stars(L) {
    const st = lv(L.id), qs = scored(L);
    const pts = qs.reduce((a, c, i) => {
      const r = st.ans[ck(c)]; if (!r) return a;
      return a + (c.t === "quiz" ? (r.ok ? 1 : 0) : Math.max(0, 1 - r.miss * 0.25));
    }, 0);
    const p = qs.length ? pts / qs.length : 1;
    return p >= 0.85 ? 3 : p >= 0.5 ? 2 : 1;
  }

  // ---------- theme ----------
  function applyTheme() {
    const t = S.theme;
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute("content", dark ? "#0A0A0A" : "#EFEFEF"));
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---------- home ----------
  function home() {
    const app = $("#app");
    const r = rank();
    const curIdx = Math.max(0, COURSE.findIndex(L => !lv(L.id).done));
    const allDone = COURSE.every(L => lv(L.id).done);
    const cur = COURSE[allDone ? 0 : curIdx];
    const doneCount = COURSE.filter(L => lv(L.id).done).length;
    const starCount = COURSE.reduce((a, L) => a + (lv(L.id).stars || 0), 0);
    const notes = COURSE.map((L, i) => ({ L, i, n: lv(L.id).notes })).filter(x => x.n && (x.n[0] || x.n[1]));

    app.innerHTML = `
    <main class="home" data-testid="home">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">AI</span><span>AI-Pilled</span></div>
        <span class="stat flame" title="Day streak">${ic("flame")}<span class="num">${liveStreak()}</span></span>
        <span class="stat bolt" title="Total XP">${ic("bolt")}<span class="num">${S.xp}</span></span>
        <button class="icon-btn" data-act="settings" aria-label="Settings">${ic("more")}</button>
      </header>

      <section class="hero" data-testid="hero">
        <span class="hero-label">Your rank</span>
        <div class="hero-rank">${esc(r.name)}</div>
        <div class="hero-sub">${r.next ? `<span class="num">${r.next[0] - S.xp}</span> XP to ${esc(r.next[1])}` : "Top rank reached. Run the loop on a real task."}</div>
        <div class="hero-tiles">
          <div class="hero-tile"><b class="num">${doneCount}/${COURSE.length}</b><span>Levels</span></div>
          <div class="hero-tile"><b class="num">${starCount}/${COURSE.length * 3}</b><span>Stars</span></div>
          <div class="hero-tile"><b class="num">${liveStreak()}</b><span>Day streak</span></div>
        </div>
        <div class="bar"><i style="width:${Math.round(r.pct * 100)}%"></i></div>
        <button class="hero-cta" data-go="${cur.id}" data-testid="continue">${ic("play")}<span>${allDone ? "Replay" : doneCount ? "Continue" : "Start"} · ${esc(cur.title)}</span></button>
      </section>

      <section class="section">
        <h2 class="section-label">The path · ${COURSE.length} levels · about ${Math.round(COURSE.reduce((a, L) => a + L.cards.length, 0) * 0.5 / 60 * 2) / 2} hours</h2>
        <div class="list" data-testid="levels">
          ${COURSE.map((L, i) => {
            const st = lv(L.id), open = unlocked(i), isCur = !allDone && i === curIdx;
            const meta = st.done
              ? [1, 2, 3].map(k => `<span class="${k <= st.stars ? "on" : ""}">${ic("star")}</span>`).join("")
              : open ? "" : ic("lock");
            return `<button class="level ${st.done ? "done" : ""} ${isCur ? "current" : ""}" data-go="${L.id}" ${open ? "" : "disabled"} title="${esc(L.title)}">
              <span class="level-num num">${i + 1}</span>
              <span class="level-body"><span class="level-title">${esc(L.title)}</span><span class="level-sub">${esc(L.sub)} · <span class="num">${Math.max(1, Math.round(L.cards.length * 0.5))} min</span></span></span>
              <span class="level-meta">${meta}</span>
            </button>`;
          }).join("")}
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">Your two lines</h2>
        <div class="list notes">
          ${notes.length ? notes.map(x => `<div class="note"><div class="note-h">Level ${x.i + 1} · ${esc(x.L.title)}</div>
            ${x.n[0] ? `<p>${esc(x.n[0])}</p>` : ""}${x.n[1] ? `<p>${esc(x.n[1])}</p>` : ""}</div>`).join("")
            : `<div class="empty">At the end of each level you write two lines: what is now clear, and what you'll try. They collect here.</div>`}
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">Cheat sheet</h2>
        <input class="gloss-search" type="search" placeholder="Search a word: API, Snowflake, MCP…" aria-label="Search the cheat sheet" data-testid="gloss-search">
        <div class="list" id="gloss"></div>
      </section>
    </main>`;

    const renderGloss = q => {
      const rows = GLOSSARY.filter(([a, b]) => !q || (a + " " + b).toLowerCase().includes(q.toLowerCase()));
      $("#gloss").innerHTML = rows.length
        ? rows.map(([a, b]) => `<div class="gloss-row"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")
        : `<div class="empty">No match. Try a shorter word.</div>`;
    };
    renderGloss("");
    $(".gloss-search").addEventListener("input", e => renderGloss(e.target.value.trim()));
    app.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => { location.hash = "#/l/" + b.dataset.go; }));
    $('[data-act="settings"]').addEventListener("click", settings);
    window.scrollTo(0, 0);
  }

  // ---------- settings sheet ----------
  function settings() {
    const root = $("#sheet-root");
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    root.innerHTML = `<div class="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="Settings">
      <h3>Settings</h3>
      <div class="section-label">Theme</div>
      <div class="seg" style="margin-bottom:24px">
        ${["system", "light", "dark"].map(t => `<button data-theme-set="${t}" class="${S.theme === t ? "on" : ""}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}
      </div>
      <div class="section-label">Install on your phone</div>
      <p class="help">${ios ? "In Safari:" : "On iPhone, open this page in Safari, then:"}</p>
      <ol><li>Tap the Share button.</li><li>Tap “Add to Home Screen”.</li><li>Open AI-Pilled from your home screen. It works offline.</li></ol>
      <div class="row"><button class="btn ghost" data-close>Done</button></div>
      <button class="danger-link" data-reset>Reset all progress</button>
    </div></div>`;
    const close = () => { root.innerHTML = ""; };
    $(".scrim", root).addEventListener("click", e => { if (e.target.classList.contains("scrim")) close(); });
    $("[data-close]", root).addEventListener("click", close);
    root.querySelectorAll("[data-theme-set]").forEach(b => b.addEventListener("click", () => {
      S.theme = b.dataset.themeSet; save(); applyTheme();
      root.querySelectorAll("[data-theme-set]").forEach(x => x.classList.toggle("on", x === b));
    }));
    $("[data-reset]", root).addEventListener("click", () => {
      if (!confirm("Reset all XP, stars and notes? This can't be undone.")) return;
      const theme = S.theme; S = fresh(); S.theme = theme; save(); close(); home(); toast("Progress reset");
    });
  }

  // ---------- player ----------
  let io = null;
  function player(id) {
    const idx = COURSE.findIndex(L => L.id === id);
    if (idx < 0 || !unlocked(idx)) { location.hash = "#/"; return; }
    const L = COURSE[idx], st = lv(L.id);
    const replay = st.done;
    if (replay) { st.ans = {}; save(); } // replays are fresh, but earn no XP
    const cards = [...L.cards, { t: "end" }];
    const app = $("#app");
    app.innerHTML = `<div class="player" data-testid="player">
      <div class="pbar"><div class="pbar-inner">
        <button class="icon-btn" data-act="close" aria-label="Back to the path">${ic("close")}</button>
        <div class="segs">${cards.map(() => "<i></i>").join("")}</div>
        <span class="pxp">${ic("bolt")}<b class="num">${S.xp}</b></span>
      </div></div>
      <div class="feed" id="feed"></div>
    </div>`;
    $('[data-act="close"]').addEventListener("click", () => { location.hash = "#/"; });
    const feed = $("#feed");
    const segs = [...app.querySelectorAll(".segs i")];
    let shown = 0;

    io?.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.i;
      segs.forEach((s, j) => s.classList.toggle("on", j <= i));
      const c = cards[i];
      if (c.t === "idea" || c.t === "flow") {
        const key = ck(c, i); if (!st.seen.includes(key)) { st.seen.push(key); if (!replay) award(L.id, XP_READ); else save(); }
      }
    }), { root: feed, threshold: 0.3 });

    const blocks = c => ["quiz", "match", "order", "checkpoint"].includes(c.t);
    const answered = i => !!st.ans[ck(cards[i], i)];

    function revealMore() {
      while (shown < cards.length) {
        const i = shown++;
        const el = slide(cards[i], i);
        feed.appendChild(el); io.observe(el);
        if (blocks(cards[i]) && !answered(i)) break;
      }
      updateHints();
    }
    function updateHints() {
      feed.querySelectorAll(".hint").forEach(h => h.remove());
      const slides = [...feed.children];
      slides.forEach((el, k) => {
        const c = cards[+el.dataset.i];
        const canContinue = k < slides.length - 1;
        if (c.t !== "end" && (!blocks(c) || answered(+el.dataset.i)) && canContinue) {
          el.querySelector(".slide-inner").insertAdjacentHTML("beforeend", `<div class="hint">${ic("down")}Scroll for the next card</div>`);
        }
      });
    }
    function next(i) {
      revealMore();
      const target = feed.querySelector(`[data-i="${i + 1}"]`);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 650);
    }

    function slide(c, i) {
      const el = document.createElement("section");
      el.className = "slide"; el.dataset.i = i; el.dataset.type = c.t;
      const inner = document.createElement("div"); inner.className = "slide-inner"; el.appendChild(inner);
      if (c.t === "idea") {
        inner.innerHTML = `${c.k ? `<span class="kicker">${esc(c.k)}</span>` : ""}<h2>${esc(c.h)}</h2><p class="body">${esc(c.b)}</p>
          ${c.ex ? `<div class="ex"><div class="ex-h">${ic("case")}In your world</div><p>${esc(c.ex)}</p></div>` : ""}`;
      } else if (c.t === "flow") {
        inner.innerHTML = `<span class="kicker">${esc(c.k)}</span><h2>${esc(c.h)}</h2><div class="flow">${c.steps.map((s, j) =>
          `${j ? '<div class="flow-arrow"></div>' : ""}<div class="flow-step"><span class="flow-n num">${j + 1}</span><div><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div></div>`).join("")}</div>`;
      } else if (c.t === "quiz") quiz(c, i, inner);
      else if (c.t === "match") match(c, i, inner);
      else if (c.t === "order") order(c, i, inner);
      else if (c.t === "checkpoint") checkpoint(c, i, inner);
      else if (c.t === "end") end(inner);
      return el;
    }

    function quiz(c, i, inner) {
      const K = ck(c, i);
      inner.innerHTML = `<span class="kicker">Quick check</span><p class="q">${esc(c.q)}</p>
        <div class="opts">${c.o.map((o, j) => ({ o, j })).sort(() => Math.random() - 0.5).map((x, pos) =>
          `<button class="opt" data-j="${x.j}"><span class="opt-key">${"ABCD"[pos]}</span><span>${esc(x.o)}</span></button>`).join("")}</div>`;
      const show = (pick) => {
        const ok = pick === c.a;
        inner.querySelectorAll(".opt").forEach(b => {
          const j = +b.dataset.j; b.disabled = true;
          if (j === c.a) b.classList.add("right"); else if (j === pick) b.classList.add("wrong"); else b.classList.add("dim");
        });
        inner.insertAdjacentHTML("beforeend", `<div class="verdict ${ok ? "good" : "bad"}"><b>${ic(ok ? "ok" : "no")}${ok ? "Correct" : "Not quite"}</b><p>${esc(c.why)}</p></div>`);
        return ok;
      };
      if (st.ans[K]) { show(st.ans[K].pick); return; }
      inner.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
        const pick = +b.dataset.j, ok = show(pick);
        if (!ok) b.classList.add("shake");
        st.ans[K] = { pick, ok }; save();
        if (ok && !replay) award(L.id, XP_RIGHT, "correct");
        next(i);
      }));
    }

    function match(c, i, inner) {
      const K = ck(c, i);
      const terms = c.pairs.map((p, j) => ({ j, t: p[0] })).sort(() => Math.random() - 0.5);
      inner.innerHTML = `<span class="kicker">Mini-game · Match</span><p class="q">${esc(c.q)}</p>
        <p class="sub-hint">Tap a word, then tap its meaning.</p>
        <div class="chips">${terms.map(x => `<button class="chip" data-j="${x.j}" title="${esc(x.t)}">${esc(x.t)}</button>`).join("")}</div>
        <div class="defs">${c.pairs.map((p, j) => `<button class="def" data-j="${j}"><span>${esc(p[1])}</span></button>`).join("")}</div>`;
      const lock = (j) => {
        const d = inner.querySelector(`.def[data-j="${j}"]`);
        d.classList.add("ok"); d.disabled = true; d.insertAdjacentHTML("afterbegin", `<span class="tag">${esc(c.pairs[j][0])}</span>`);
        inner.querySelector(`.chip[data-j="${j}"]`).classList.add("used");
      };
      const finish = (miss) => {
        inner.insertAdjacentHTML("beforeend", `<div class="verdict good"><b>${ic("ok")}All matched</b><p>${miss ? `${miss} wrong ${miss === 1 ? "try" : "tries"} on the way.` : "Perfect, no wrong tries."}</p></div>`);
      };
      if (st.ans[K]) { c.pairs.forEach((_, j) => lock(j)); finish(st.ans[K].miss); return; }
      let sel = null, miss = 0, left = c.pairs.length;
      inner.querySelectorAll(".chip").forEach(ch => ch.addEventListener("click", () => {
        inner.querySelectorAll(".chip").forEach(x => x.classList.remove("sel"));
        sel = +ch.dataset.j; ch.classList.add("sel");
        inner.querySelectorAll(".def:not(.ok)").forEach(d => d.classList.add("armed"));
      }));
      inner.querySelectorAll(".def").forEach(d => d.addEventListener("click", () => {
        if (sel === null) { toast("Pick a word first"); return; }
        if (+d.dataset.j === sel) {
          lock(sel); sel = null; left--;
          inner.querySelectorAll(".def").forEach(x => x.classList.remove("armed"));
          if (!left) {
            st.ans[K] = { miss }; save(); finish(miss);
            if (!replay) award(L.id, Math.max(5, XP_GAME - miss * 3), "matched");
            next(i);
          }
        } else { miss++; d.classList.remove("shake"); void d.offsetWidth; d.classList.add("shake"); }
      }));
    }

    function order(c, i, inner) {
      const K = ck(c, i);
      const pool = c.items.map((t, j) => ({ t, j })).sort(() => Math.random() - 0.5);
      inner.innerHTML = `<span class="kicker">Mini-game · Order</span><p class="q">${esc(c.q)}</p>
        <p class="sub-hint">Tap the steps from first to last.</p>
        <div class="order-picked"></div><div class="order-pool">${pool.map(x => `<button class="opt" data-j="${x.j}"><span>${esc(x.t)}</span></button>`).join("")}</div>`;
      const picked = inner.querySelector(".order-picked");
      const add = j => picked.insertAdjacentHTML("beforeend", `<div class="flow-step"><span class="flow-n num">${j + 1}</span><div><b>${esc(c.items[j])}</b></div></div>`);
      const finish = miss => inner.insertAdjacentHTML("beforeend", `<div class="verdict good"><b>${ic("ok")}In order</b><p>${miss ? `${miss} wrong ${miss === 1 ? "tap" : "taps"} on the way.` : "Perfect sequence."}</p></div>`);
      if (st.ans[K]) { inner.querySelector(".order-pool").remove(); c.items.forEach((_, j) => add(j)); finish(st.ans[K].miss); return; }
      let want = 0, miss = 0;
      inner.querySelectorAll(".order-pool .opt").forEach(b => b.addEventListener("click", () => {
        if (+b.dataset.j === want) {
          b.remove(); add(want++);
          if (want === c.items.length) {
            inner.querySelector(".order-pool").remove();
            st.ans[K] = { miss }; save(); finish(miss);
            if (!replay) award(L.id, Math.max(5, XP_GAME - miss * 3), "in order");
            next(i);
          }
        } else { miss++; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); }
      }));
    }

    function checkpoint(c, i, inner) {
      const K = ck(c, i);
      const n = st.notes || ["", ""];
      inner.innerHTML = `<span class="kicker">Checkpoint · Two lines</span><p class="q">Close the level in two lines.</p>
        <p class="sub-hint">Pros end every round this way. Short is good.</p>
        <label class="field-label" for="n1-${i}">Line 1 · What is now clear to me</label>
        <textarea class="field" id="n1-${i}" maxlength="240" placeholder="e.g. An LLM predicts text, so I always check its sources.">${esc(n[0])}</textarea>
        <label class="field-label" for="n2-${i}">Line 2 · What I'll try this week</label>
        <textarea class="field" id="n2-${i}" maxlength="240" placeholder="e.g. Ask our approved AI tool to timeline one interview.">${esc(n[1])}</textarea>
        <div class="row"><button class="btn" data-save>Save my two lines</button><button class="btn ghost" data-skip>Skip</button></div>`;
      const done = (saved) => {
        const a = inner.querySelector("#n1-" + i).value.trim(), b = inner.querySelector("#n2-" + i).value.trim();
        const first = !st.ans[K];
        if (saved) {
          if (!a && !b) { toast("Write at least one line, or skip"); return; }
          st.notes = [a, b];
          if (first && !replay) award(L.id, XP_NOTE, "two lines");
          toast("Saved to your notebook");
        }
        st.ans[K] = { saved: saved || !!st.ans[K]?.saved }; save();
        if (first) next(i); else feed.querySelector(`[data-i="${i + 1}"]`)?.scrollIntoView({ behavior: "smooth" });
      };
      inner.querySelector("[data-save]").addEventListener("click", () => done(true));
      inner.querySelector("[data-skip]").addEventListener("click", () => done(false));
    }

    function end(inner) {
      const wasDone = st.done;
      const s = stars(L);
      st.done = true; st.stars = Math.max(st.stars || 0, s); touchStreak(); save();
      const nxt = COURSE[idx + 1];
      const right = L.cards.filter(c => c.t === "quiz" && st.ans[ck(c)]?.ok).length;
      const qn = L.cards.filter(c => c.t === "quiz").length;
      inner.innerHTML = `<div class="done-card" data-testid="level-done">
        <div class="done-seal">${ic("trophy")}</div>
        <span class="kicker">Gate passed · ${esc(L.badge)}</span>
        <h2>Level ${idx + 1} complete</h2>
        <div class="stars">${[1, 2, 3].map(k => `<span class="${k <= s ? "on" : ""}">${ic("star")}</span>`).join("")}</div>
        <div class="done-tiles">
          <div><b class="num">+${replay ? 0 : st.xp}</b><span>${replay ? "XP (replay)" : "XP earned"}</span></div>
          <div><b class="num">${right}/${qn}</b><span>Checks right</span></div>
          <div><b class="num">${liveStreak()}</b><span>Day streak</span></div>
        </div>
        <div class="row">
          ${nxt ? `<button class="btn" data-next title="${esc(nxt.title)}">Next level</button>` : `<button class="btn" data-home>You're AI-pilled. Back to the path</button>`}
          ${nxt ? `<button class="btn ghost" data-home>Path</button>` : ""}
        </div>
      </div>`;
      inner.querySelector("[data-next]")?.addEventListener("click", () => { location.hash = "#/l/" + nxt.id; });
      inner.querySelectorAll("[data-home]").forEach(b => b.addEventListener("click", () => { location.hash = "#/"; }));
      if (!wasDone && !replay) setTimeout(() => toast(nxt ? `Unlocked: ${nxt.title}` : "Course complete"), 400);
    }

    revealMore();
    feed.scrollTop = 0;
  }

  // ---------- router ----------
  function route() {
    $("#sheet-root").innerHTML = "";
    const m = location.hash.match(/^#\/l\/([\w-]+)/);
    if (m) player(m[1]); else { io?.disconnect(); home(); }
  }
  window.addEventListener("hashchange", route);
  applyTheme();
  route();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
