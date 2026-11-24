'use strict';
/* Catatan Kuliah — simpan materi, belajar ulang, dan ubah jadi kuis.
   Semua data tersimpan di browser (localStorage). Gunakan menu Backup untuk ekspor/impor. */

const KEY = 'catatanKuliah.v1';
const COLORS = ['#2f6f5e', '#3b6fb6', '#b5523b', '#8a5cb8', '#c08a1e', '#2f8f9d', '#b83b7a', '#5f7f2f'];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtDate = (t) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

/* ---------- Data ---------- */
function emptyDb() { return { version: 1, courses: [], notes: [], questions: [], stats: {}, attempts: [] }; }

function seed() {
  const c = { id: uid(), name: 'Contoh: Basis Data', semester: 'Semester 3', color: COLORS[0], createdAt: Date.now() };
  const n = {
    id: uid(), courseId: c.id, title: 'Normalisasi Database', createdAt: Date.now(), updatedAt: Date.now(),
    content: `Normalisasi adalah proses mengorganisasi tabel untuk mengurangi **redundansi** data dan mencegah anomali.

## Bentuk Normal
- 1NF :: Setiap kolom berisi nilai atomik dan tidak ada grup berulang
- 2NF :: Memenuhi 1NF dan setiap atribut non-kunci bergantung penuh pada seluruh primary key
- 3NF :: Memenuhi 2NF dan tidak ada ketergantungan transitif
- BCNF :: Setiap determinan merupakan candidate key

## Kunci
Kolom yang secara unik mengidentifikasi setiap baris disebut **primary key**.
Kolom yang merujuk ke primary key tabel lain disebut **foreign key**.

> Ini catatan contoh. Tulis kata dengan dua bintang (tebal) untuk membuat soal isian otomatis, dan tulis "Istilah :: Definisi" untuk soal pilihan ganda otomatis. Hapus mata kuliah contoh ini kapan saja.`,
  };
  const d = emptyDb();
  d.courses.push(c);
  d.notes.push(n);
  d.questions.push({
    id: uid(), noteId: n.id, type: 'tf', prompt: 'Tabel yang memenuhi 3NF pasti juga memenuhi 2NF.',
    answer: 'true', options: [], explanation: '3NF mensyaratkan tabel sudah memenuhi 2NF.',
  });
  return d;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(emptyDb(), JSON.parse(raw));
  } catch (e) { /* storage unavailable */ }
  return seed();
}
let db = load();
let storageOk = true;

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); storageOk = true; return true; }
  catch (e) { storageOk = false; toast('Gagal menyimpan di browser ini. Segera ekspor backup!'); return false; }
}

const course = (id) => db.courses.find((c) => c.id === id);
const note = (id) => db.notes.find((n) => n.id === id);
const notesOf = (courseId) => db.notes.filter((n) => n.courseId === courseId).sort((a, b) => a.title.localeCompare(b.title, 'id'));

/* ---------- Markdown (ringan) ---------- */
function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/==([^=]+)==/g, '<mark>$1</mark>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
const DEF_RE = /^\s*(?:[-*]\s+)?(.+?)\s+::\s+(.+)$/;

function renderMd(src) {
  const lines = String(src || '').split('\n');
  const out = [];
  let list = null, para = [], defs = [], inCode = false, code = [];
  const flushPara = () => { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.type}>` + list.items.map((i) => `<li>${inline(i)}</li>`).join('') + `</${list.type}>`); list = null; } };
  const flushDefs = () => { if (defs.length) { out.push('<dl class="defs">' + defs.map(([t, d]) => `<div class="def"><dt>${inline(t)}</dt><dd>${inline(d)}</dd></div>`).join('') + '</dl>'); defs = []; } };
  const flushAll = () => { flushPara(); flushList(); flushDefs(); };

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCode) { out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); code = []; inCode = false; }
      else { flushAll(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(line); continue; }
    let m;
    if (!line.trim()) { flushAll(); continue; }
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flushAll(); const l = m[1].length + 1; out.push(`<h${l}>${inline(m[2])}</h${l}>`); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { flushAll(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = line.match(DEF_RE))) { flushPara(); flushList(); defs.push([m[1], m[2]]); continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { flushPara(); flushDefs(); if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); flushDefs(); if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    flushList(); flushDefs(); para.push(line);
  }
  if (inCode) out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
  flushAll();
  return out.join('\n');
}

/* ---------- Pembuatan soal ---------- */
const stripMd = (s) => s.replace(/\*\*|==|`/g, '').replace(/^\s*(?:[-*]|\d+[.)]|#{1,3}|>)\s+/, '').trim();

function parseNote(n) {
  const defs = [], sentences = [];
  let inCode = false;
  for (const line of String(n.content || '').split('\n')) {
    if (/^```/.test(line)) { inCode = !inCode; continue; }
    if (inCode || !line.trim() || /^>/.test(line)) continue;
    const m = line.match(DEF_RE);
    if (m) { defs.push({ term: stripMd(m[1]), def: stripMd(m[2]) }); continue; }
    if (line.includes('**')) {
      for (const s of line.split(/(?<=[.!?])\s+/)) if (/\*\*[^*]+\*\*/.test(s)) sentences.push(s);
    }
  }
  return { defs, sentences };
}

/** Soal otomatis dari isi catatan + soal buatan sendiri. */
function questionsFor(noteIds) {
  const set = new Set(noteIds);
  const qs = [];
  const parsed = new Map();
  for (const n of db.notes) parsed.set(n.id, parseNote(n));

  for (const id of set) {
    const n = note(id);
    if (!n) continue;
    const { defs, sentences } = parsed.get(id);
    // Pool definisi pengecoh: mata kuliah yang sama dulu, lalu semua
    const poolSame = db.notes.filter((x) => x.courseId === n.courseId).flatMap((x) => parsed.get(x.id).defs);
    const poolAll = db.notes.flatMap((x) => parsed.get(x.id).defs);

    for (const d of defs) {
      const others = (arr) => [...new Set(arr.filter((x) => x.term !== d.term && x.def !== d.def).map((x) => x.def))];
      let distract = shuffle(others(poolSame)).slice(0, 3);
      if (distract.length < 3) distract = [...new Set([...distract, ...shuffle(others(poolAll))])].slice(0, 3);
      if (distract.length >= 1) {
        qs.push({ id: 'a:' + hash(id + '|def|' + d.term), noteId: id, auto: true, type: 'mc',
          prompt: `Apa yang dimaksud dengan "${d.term}"?`, options: shuffle([d.def, ...distract]), answer: d.def, explanation: '' });
      }
      qs.push({ id: 'a:' + hash(id + '|term|' + d.term), noteId: id, auto: true, type: 'short',
        prompt: `Istilah apa yang dimaksud: "${d.def}"?`, answer: d.term, options: [], explanation: '' });
    }
    for (const s of sentences) {
      const terms = [...s.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]);
      for (const t of terms) {
        const prompt = stripMd(s.replace(`**${t}**`, '_____'));
        qs.push({ id: 'a:' + hash(id + '|cloze|' + prompt + '|' + t), noteId: id, auto: true, type: 'short',
          prompt: 'Lengkapi: ' + prompt, answer: t, options: [], explanation: stripMd(s) });
      }
    }
  }
  for (const q of db.questions) if (set.has(q.noteId)) qs.push({ ...q, options: q.type === 'mc' ? shuffle(q.options) : q.options });
  return qs;
}

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = dp[j]; dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return dp[b.length];
}
function checkShort(given, answer) {
  const g = norm(given);
  if (!g) return false;
  return String(answer).split('|').some((alt) => {
    const a = norm(alt);
    if (g === a) return true;
    const tol = a.length >= 10 ? 2 : a.length >= 5 ? 1 : 0; // toleransi salah ketik
    return lev(g, a) <= tol;
  });
}
const answerLabel = (q) => q.type === 'tf' ? (q.answer === 'true' ? 'Benar' : 'Salah') : String(q.answer).split('|')[0];

/* Statistik per soal (sistem kotak Leitner 1–5) */
function record(q, correct) {
  const s = db.stats[q.id] || { box: 1, correct: 0, wrong: 0, last: 0 };
  if (correct) { s.correct++; s.box = Math.min(5, s.box + 1); } else { s.wrong++; s.box = 1; }
  s.last = Date.now();
  db.stats[q.id] = s;
}
const isWeak = (qid) => { const s = db.stats[qid]; return s && s.wrong > 0 && s.box <= 2; };

/* ---------- UI helpers ---------- */
const app = $('#app');
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function setView(html, title) {
  app.innerHTML = html;
  document.title = title ? `${title} · Catatan Kuliah` : 'Catatan Kuliah';
  window.scrollTo(0, 0);
}
function weakCountForNote(noteId) { return questionsFor([noteId]).filter((q) => isWeak(q.id)).length; }

function noteCard(n, showCourse = true) {
  const c = course(n.courseId);
  const weak = weakCountForNote(n.id);
  const nq = questionsFor([n.id]).length;
  return `<a class="card note-item" href="#/catatan/${n.id}">
    <div class="title">${esc(n.title)}</div>
    <div class="row small-text muted" style="margin-top:4px">
      ${showCourse && c ? `<span>${esc(c.name)}</span>·` : ''}
      <span>${nq} soal</span>·<span>diubah ${fmtDate(n.updatedAt)}</span>
      ${weak ? `<span class="pill weak">${weak} perlu diulang</span>` : ''}
    </div></a>`;
}

function renderSidebar() {
  const route = location.hash || '#/';
  $$('.sidebar nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === route || (a.dataset.nav === 'kuis' && route.startsWith('#/kuis'))));
  const groups = {};
  for (const c of db.courses) (groups[c.semester || 'Lainnya'] ||= []).push(c);
  const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  $('#courseList').innerHTML = keys.length ? keys.map((k) => `<div class="semester-label">${esc(k)}</div>` +
    groups[k].sort((a, b) => a.name.localeCompare(b.name, 'id')).map((c) =>
      `<a class="course-link ${route === '#/matkul/' + c.id ? 'active' : ''}" href="#/matkul/${c.id}">
        <span class="dot" style="background:${esc(c.color)}"></span><span>${esc(c.name)}</span>
        <span class="count">${notesOf(c.id).length}</span></a>`).join('')).join('')
    : '<p class="muted small-text" style="padding:0 10px">Belum ada mata kuliah.</p>';
}

/* ---------- Views ---------- */
function viewHome() {
  const allQ = questionsFor(db.notes.map((n) => n.id));
  const weak = allQ.filter((q) => isWeak(q.id));
  const att = db.attempts.slice(-30);
  const avg = att.length ? Math.round(att.reduce((s, a) => s + (a.score / a.total) * 100, 0) / att.length) : null;
  const recent = [...db.notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  const weakNotes = [...new Set(weak.map((q) => q.noteId))].map(note).filter(Boolean);

  setView(`
    <h1>Selamat belajar 👋</h1>
    <p class="muted">Simpan materi kuliahmu, baca ulang kapan saja, dan uji pemahamanmu dengan kuis.</p>
    <div class="stats">
      <div class="card stat"><div class="num">${db.courses.length}</div><div class="lbl">Mata kuliah</div></div>
      <div class="card stat"><div class="num">${db.notes.length}</div><div class="lbl">Catatan materi</div></div>
      <div class="card stat"><div class="num">${allQ.length}</div><div class="lbl">Soal kuis</div></div>
      <div class="card stat"><div class="num">${avg === null ? '–' : avg + '%'}</div><div class="lbl">Rata-rata skor kuis</div></div>
    </div>
    <div class="row">
      <a class="btn primary" href="#/catatan/baru">+ Catatan baru</a>
      <a class="btn" href="#/kuis">📝 Mulai kuis</a>
      ${weak.length ? `<a class="btn" href="#/kuis?lemah=1">🔁 Ulangi ${weak.length} soal yang salah</a>` : ''}
    </div>
    ${weakNotes.length ? `<h2>Perlu diulang</h2><div class="list">${weakNotes.map((n) => noteCard(n)).join('')}</div>` : ''}
    <h2>Terakhir diubah</h2>
    ${recent.length ? `<div class="list">${recent.map((n) => noteCard(n)).join('')}</div>`
      : `<div class="card empty">Belum ada catatan. Tambahkan mata kuliah di menu kiri, lalu buat catatan pertamamu.</div>`}
    ${db.attempts.length ? `<h2>Riwayat kuis</h2><div class="table-scroll"><table>
      <tr><th>Tanggal</th><th>Materi</th><th>Mode</th><th>Skor</th></tr>
      ${db.attempts.slice(-10).reverse().map((a) => `<tr><td>${fmtDate(a.date)}</td><td>${esc(a.label)}</td><td>${a.mode === 'flash' ? 'Flashcard' : 'Kuis'}</td>
        <td class="num">${a.score}/${a.total} (${Math.round((a.score / a.total) * 100)}%)</td></tr>`).join('')}
    </table></div>` : ''}
  `);
}

function viewCourse(id) {
  const c = course(id);
  if (!c) return viewNotFound();
  const ns = notesOf(id);
  const nq = questionsFor(ns.map((n) => n.id)).length;
  setView(`
    <div class="spread">
      <div><h1><span class="dot" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${esc(c.color)}"></span> ${esc(c.name)}</h1>
      <div class="muted">${esc(c.semester || '')} · ${ns.length} catatan · ${nq} soal</div></div>
      <div class="row">
        <a class="btn primary" href="#/catatan/baru?matkul=${c.id}">+ Catatan</a>
        ${nq ? `<a class="btn" href="#/kuis?matkul=${c.id}">📝 Kuis</a><a class="btn" href="#/kuis?matkul=${c.id}&mode=flash">🃏 Flashcard</a>` : ''}
        <button class="btn" id="editCourse">Ubah</button>
        <button class="btn danger" id="delCourse">Hapus</button>
      </div>
    </div>
    <h2>Materi</h2>
    ${ns.length ? `<div class="list">${ns.map((n) => noteCard(n, false)).join('')}</div>`
      : `<div class="card empty">Belum ada catatan untuk mata kuliah ini.<br><br><a class="btn primary" href="#/catatan/baru?matkul=${c.id}">+ Buat catatan</a></div>`}
  `, c.name);
  $('#editCourse').onclick = () => courseDialog(c);
  $('#delCourse').onclick = () => {
    if (!confirm(`Hapus "${c.name}" beserta ${ns.length} catatan dan soalnya? Tindakan ini tidak bisa dibatalkan.`)) return;
    const ids = new Set(ns.map((n) => n.id));
    db.notes = db.notes.filter((n) => !ids.has(n.id));
    db.questions = db.questions.filter((q) => !ids.has(q.noteId));
    db.courses = db.courses.filter((x) => x.id !== c.id);
    save(); toast('Mata kuliah dihapus'); location.hash = '#/';
  };
}

function courseDialog(existing) {
  const name = prompt('Nama mata kuliah:', existing ? existing.name : '');
  if (name === null || !name.trim()) return;
  const semester = prompt('Semester (contoh: Semester 1):', existing ? existing.semester : 'Semester 1');
  if (semester === null) return;
  if (existing) { existing.name = name.trim(); existing.semester = semester.trim(); }
  else {
    const c = { id: uid(), name: name.trim(), semester: semester.trim(), color: COLORS[db.courses.length % COLORS.length], createdAt: Date.now() };
    db.courses.push(c);
    save(); location.hash = '#/matkul/' + c.id; return;
  }
  save(); render();
}

function viewNote(id) {
  const n = note(id);
  if (!n) return viewNotFound();
  const c = course(n.courseId);
  const qs = questionsFor([id]);
  const auto = qs.filter((q) => q.auto).length;
  setView(`
    <div class="small-text"><a href="#/matkul/${c?.id}">← ${esc(c?.name || 'Mata kuliah')}</a></div>
    <div class="spread" style="margin-top:6px">
      <div><h1>${esc(n.title)}</h1><div class="muted small-text">Dibuat ${fmtDate(n.createdAt)} · diubah ${fmtDate(n.updatedAt)}</div></div>
      <div class="row">
        <a class="btn" href="#/catatan/${id}/edit">✏️ Ubah</a>
        <button class="btn danger" id="delNote">Hapus</button>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="spread">
        <div><strong>${qs.length} soal</strong> <span class="muted small-text">(${auto} otomatis dari catatan, ${qs.length - auto} buatan sendiri)</span></div>
        <div class="row">
          ${qs.length ? `<a class="btn primary" href="#/kuis?catatan=${id}">📝 Kuis materi ini</a><a class="btn" href="#/kuis?catatan=${id}&mode=flash">🃏 Flashcard</a>`
            : `<span class="muted small-text">Tebalkan istilah atau tambahkan soal di halaman Ubah untuk membuat kuis.</span>`}
        </div>
      </div>
    </div>
    <article class="note-body">${renderMd(n.content) || '<p class="muted">Catatan ini masih kosong.</p>'}</article>
  `, n.title);
  $('#delNote').onclick = () => {
    if (!confirm(`Hapus catatan "${n.title}"?`)) return;
    db.notes = db.notes.filter((x) => x.id !== id);
    db.questions = db.questions.filter((q) => q.noteId !== id);
    save(); toast('Catatan dihapus'); location.hash = '#/matkul/' + n.courseId;
  };
}

function viewEditor(id, params) {
  if (!db.courses.length) {
    setView(`<h1>Catatan baru</h1><div class="card empty">Buat mata kuliah dulu sebelum menulis catatan.<br><br>
      <button class="btn primary" id="mk">+ Tambah mata kuliah</button></div>`);
    $('#mk').onclick = () => courseDialog();
    return;
  }
  const existing = id ? note(id) : null;
  if (id && !existing) return viewNotFound();
  const draft = existing ? { ...existing } : { id: uid(), courseId: params.get('matkul') || db.courses[0].id, title: '', content: '', createdAt: Date.now() };
  let qs = db.questions.filter((q) => q.noteId === draft.id).map((q) => ({ ...q, options: [...q.options] }));

  setView(`
    <h1>${existing ? 'Ubah catatan' : 'Catatan baru'}</h1>
    <div class="row" style="margin:16px 0">
      <label class="field" style="flex:2;min-width:220px;margin:0"><span>Judul materi</span>
        <input type="text" id="fTitle" style="width:100%" value="${esc(draft.title)}" placeholder="mis. Pertemuan 3 — Normalisasi"></label>
      <label class="field" style="flex:1;min-width:180px;margin:0"><span>Mata kuliah</span>
        <select id="fCourse" style="width:100%">${db.courses.map((c) => `<option value="${c.id}" ${c.id === draft.courseId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
    </div>
    <details class="help"><summary><strong>Cara menulis catatan supaya otomatis jadi kuis</strong></summary>
      <ul>
        <li><code>**kata penting**</code> → <strong>soal isian</strong> (kata itu dikosongkan)</li>
        <li><code>Istilah :: Definisi</code> (satu per baris) → <strong>soal pilihan ganda</strong> dan isian istilah</li>
        <li><code># Judul</code>, <code>## Subjudul</code>, <code>- poin</code>, <code>1. nomor</code>, <code>==stabilo==</code>, <code>\`kode\`</code>, <code>&gt; kutipan</code></li>
      </ul></details>
    <div class="editor-grid">
      <label class="field" style="margin:0"><span>Isi materi</span>
        <textarea id="fContent" rows="20" placeholder="Tulis atau tempel materi kuliahmu di sini…">${esc(draft.content)}</textarea></label>
      <div><div style="font-weight:600;font-size:.9rem;margin-bottom:4px">Pratinjau</div>
        <div class="card preview note-body" id="preview"></div>
        <div class="small-text muted" id="autoCount" style="margin-top:6px"></div></div>
    </div>

    <h2>Soal buatan sendiri</h2>
    <div id="qList"></div>
    <div class="card" id="qForm">
      <div class="row" style="margin-bottom:10px">
        <label><input type="radio" name="qType" value="mc" checked> Pilihan ganda</label>
        <label><input type="radio" name="qType" value="tf"> Benar / Salah</label>
        <label><input type="radio" name="qType" value="short"> Isian singkat</label>
      </div>
      <label class="field"><span>Pertanyaan</span><textarea id="qPrompt" rows="2"></textarea></label>
      <div id="qTypeFields"></div>
      <label class="field"><span>Pembahasan (opsional)</span><input type="text" id="qExpl" style="width:100%"></label>
      <button class="btn" id="qAdd">+ Tambahkan soal</button>
    </div>

    <div class="row" style="margin-top:24px;position:sticky;bottom:0;background:var(--bg);padding:12px 0;border-top:1px solid var(--border)">
      <button class="btn primary" id="saveNote">💾 Simpan</button>
      <a class="btn" href="${existing ? '#/catatan/' + existing.id : '#/'}">Batal</a>
    </div>
  `, existing ? 'Ubah ' + existing.title : 'Catatan baru');

  const content = $('#fContent');
  let dirty = false;
  const updatePreview = () => {
    $('#preview').innerHTML = renderMd(content.value) || '<p class="muted">Pratinjau muncul di sini.</p>';
    const p = parseNote({ content: content.value });
    const cloze = p.sentences.reduce((s, x) => s + (x.match(/\*\*[^*]+\*\*/g) || []).length, 0);
    $('#autoCount').textContent = `Soal otomatis: ${cloze} isian dari kata tebal · ${p.defs.length} definisi (pilihan ganda + isian istilah)`;
  };
  content.addEventListener('input', () => { dirty = true; updatePreview(); });
  $('#fTitle').addEventListener('input', () => { dirty = true; });
  updatePreview();

  const typeFields = () => {
    const t = $('input[name=qType]:checked').value;
    $('#qTypeFields').innerHTML = t === 'mc'
      ? `<label class="field"><span>Pilihan jawaban (satu per baris, beri tanda * di depan jawaban yang benar)</span>
          <textarea id="qOpts" rows="4" placeholder="*Jawaban benar&#10;Pilihan lain&#10;Pilihan lain"></textarea></label>`
      : t === 'tf'
        ? `<div class="field row"><strong>Jawaban:</strong><label><input type="radio" name="qTf" value="true" checked> Benar</label><label><input type="radio" name="qTf" value="false"> Salah</label></div>`
        : `<label class="field"><span>Jawaban benar (pisahkan jawaban alternatif dengan | )</span><input type="text" id="qAns" style="width:100%" placeholder="mis. primary key|kunci primer"></label>`;
  };
  $$('input[name=qType]').forEach((r) => r.addEventListener('change', typeFields));
  typeFields();

  const renderQList = () => {
    $('#qList').innerHTML = qs.length ? qs.map((q, i) => `<div class="q-item spread">
      <div style="min-width:0;flex:1"><div class="meta">${{ mc: 'Pilihan ganda', tf: 'Benar/Salah', short: 'Isian' }[q.type]}</div>
      <div>${esc(q.prompt)}</div><div class="small-text muted">Jawaban: ${esc(answerLabel(q))}</div></div>
      <button class="btn small danger" data-del="${i}">Hapus</button></div>`).join('')
      : '<p class="muted small-text">Belum ada soal buatan sendiri. Soal otomatis tetap dibuat dari isi catatan.</p>';
    $$('[data-del]').forEach((b) => (b.onclick = () => { qs.splice(+b.dataset.del, 1); dirty = true; renderQList(); }));
  };
  renderQList();

  $('#qAdd').onclick = () => {
    const type = $('input[name=qType]:checked').value;
    const promptText = $('#qPrompt').value.trim();
    if (!promptText) return toast('Tulis pertanyaannya dulu');
    const q = { id: uid(), noteId: draft.id, type, prompt: promptText, options: [], answer: '', explanation: $('#qExpl').value.trim() };
    if (type === 'mc') {
      const lines = $('#qOpts').value.split('\n').map((l) => l.trim()).filter(Boolean);
      const right = lines.find((l) => l.startsWith('*'));
      if (lines.length < 2 || !right) return toast('Isi minimal 2 pilihan dan tandai yang benar dengan *');
      q.options = lines.map((l) => l.replace(/^\*\s*/, ''));
      q.answer = right.replace(/^\*\s*/, '');
    } else if (type === 'tf') q.answer = $('input[name=qTf]:checked').value;
    else { q.answer = $('#qAns').value.trim(); if (!q.answer) return toast('Isi jawaban yang benar'); }
    qs.push(q); dirty = true;
    $('#qPrompt').value = ''; $('#qExpl').value = ''; typeFields(); renderQList();
    toast('Soal ditambahkan — jangan lupa Simpan');
  };

  $('#saveNote').onclick = () => {
    const title = $('#fTitle').value.trim();
    if (!title) { toast('Judul materi wajib diisi'); $('#fTitle').focus(); return; }
    const n = { ...draft, title, courseId: $('#fCourse').value, content: content.value, updatedAt: Date.now() };
    if (existing) Object.assign(existing, n); else db.notes.push(n);
    db.questions = db.questions.filter((q) => q.noteId !== n.id).concat(qs);
    dirty = false;
    if (save()) toast('Tersimpan ✓');
    location.hash = '#/catatan/' + n.id;
  };
  isDirty = () => dirty;
  guardLeave = () => dirty && !confirm('Perubahan belum disimpan. Tinggalkan halaman ini?');
}

/* ---------- Kuis ---------- */
let quiz = null;

function viewQuizSetup(params) {
  const ns = db.notes;
  if (!ns.length) { setView(`<h1>Kuis &amp; Flashcard</h1><div class="card empty">Belum ada materi. Buat catatan dulu, lalu kembali ke sini.</div>`, 'Kuis'); return; }
  const preNote = params.get('catatan'), preCourse = params.get('matkul');
  const onlyWeak = params.get('lemah') === '1';
  const mode = params.get('mode') === 'flash' ? 'flash' : 'quiz';
  const checked = (n) => (preNote ? n.id === preNote : preCourse ? n.courseId === preCourse : true);

  setView(`
    <h1>Kuis &amp; Flashcard</h1>
    <p class="muted">Pilih materi yang ingin diulang. Soal yang sering salah akan didahulukan.</p>
    <div class="card" style="margin-top:16px">
      <div class="row" style="margin-bottom:14px">
        <label class="choice"><input type="radio" name="mode" value="quiz" ${mode === 'quiz' ? 'checked' : ''}><span><strong>📝 Kuis</strong><br><span class="small-text muted">Jawab soal, dapat skor</span></span></label>
        <label class="choice"><input type="radio" name="mode" value="flash" ${mode === 'flash' ? 'checked' : ''}><span><strong>🃏 Flashcard</strong><br><span class="small-text muted">Ingat sendiri, lalu nilai dirimu</span></span></label>
      </div>
      <div class="row" style="margin-bottom:14px">
        <label>Jumlah soal <select id="count"><option>5</option><option selected>10</option><option>20</option><option>50</option><option value="9999">Semua</option></select></label>
        <label><input type="checkbox" id="weakOnly" ${onlyWeak ? 'checked' : ''}> Hanya soal yang pernah salah</label>
      </div>
      <div class="spread" style="margin-bottom:8px"><strong>Materi</strong>
        <span class="row"><button class="btn small" id="selAll">Pilih semua</button><button class="btn small" id="selNone">Kosongkan</button></span></div>
      ${db.courses.map((c) => { const cn = notesOf(c.id); return cn.length ? `
        <div style="margin:12px 0 6px;font-weight:600">${esc(c.name)} <button class="btn small" data-course="${c.id}">pilih</button></div>
        <div class="choice-grid">${cn.map((n) => `<label class="choice"><input type="checkbox" name="n" value="${n.id}" data-c="${c.id}" ${checked(n) ? 'checked' : ''}>
          <span>${esc(n.title)}<br><span class="small-text muted">${questionsFor([n.id]).length} soal</span></span></label>`).join('')}</div>` : ''; }).join('')}
      <div class="row" style="margin-top:18px"><button class="btn primary" id="start">Mulai ▶</button><span class="muted small-text" id="available"></span></div>
    </div>
  `, 'Kuis');

  const pool = () => {
    const ids = $$('input[name=n]:checked').map((i) => i.value);
    let qs = questionsFor(ids);
    if ($('#weakOnly').checked) qs = qs.filter((q) => isWeak(q.id));
    return { ids, qs };
  };
  const upd = () => { $('#available').textContent = `${pool().qs.length} soal tersedia`; };
  app.onchange = upd;
  $('#selAll').onclick = () => { $$('input[name=n]').forEach((i) => (i.checked = true)); upd(); };
  $('#selNone').onclick = () => { $$('input[name=n]').forEach((i) => (i.checked = false)); upd(); };
  $$('[data-course]').forEach((b) => (b.onclick = () => { $$('input[name=n]').forEach((i) => (i.checked = i.dataset.c === b.dataset.course)); upd(); }));
  upd();

  $('#start').onclick = () => {
    const { ids, qs } = pool();
    if (!qs.length) return toast('Tidak ada soal untuk pilihan ini');
    const n = +$('#count').value;
    // Prioritaskan kotak Leitner rendah & yang lama tidak dilihat, dengan sedikit acak
    const score = (q) => { const s = db.stats[q.id]; return (s ? s.box : 0) * 10 + Math.random() * 6 - (s ? 0 : 3); };
    const items = shuffle(qs.map((q) => [score(q), q]).sort((a, b) => a[0] - b[0]).slice(0, n).map((x) => x[1]));
    const label = ids.length === 1 ? note(ids[0]).title
      : [...new Set(ids.map((i) => course(note(i).courseId)?.name))].join(', ') + ` (${ids.length} materi)`;
    quiz = { mode: $('input[name=mode]:checked').value, items, i: 0, results: [], label, answered: false };
    location.hash = '#/kuis/main';
  };
}

function viewQuizRun() {
  if (!quiz) { location.hash = '#/kuis'; return; }
  if (quiz.i >= quiz.items.length) return viewQuizResult();
  const q = quiz.items[quiz.i];
  const src = note(q.noteId);
  const pct = (quiz.i / quiz.items.length) * 100;
  const head = `<div class="spread small-text muted"><span>Soal ${quiz.i + 1} dari ${quiz.items.length}</span>
    <span>${esc(src?.title || '')}</span></div><div class="progress"><div style="width:${pct}%"></div></div>`;
  quiz.answered = false;

  if (quiz.mode === 'flash') {
    setView(`<div class="quiz-wrap">${head}
      <div class="card flashcard"><div class="question" style="margin:0">${esc(q.prompt)}</div>
        <div id="ans" class="answer" hidden><strong>${esc(answerLabel(q))}</strong>${q.explanation ? `<div class="small-text muted" style="margin-top:8px">${esc(q.explanation)}</div>` : ''}</div></div>
      <div class="row" style="margin-top:16px;justify-content:center" id="ctl">
        <button class="btn primary" id="reveal">Tampilkan jawaban (Spasi)</button></div>
      <div class="row" style="margin-top:24px"><button class="btn small" id="quit">Berhenti</button></div></div>`, 'Flashcard');
    const reveal = () => {
      $('#ans').hidden = false; quiz.answered = true;
      $('#ctl').innerHTML = `<button class="btn" id="no">😕 Belum hafal (1)</button><button class="btn primary" id="yes">😊 Sudah hafal (2)</button>`;
      $('#no').onclick = () => next(false); $('#yes').onclick = () => next(true);
    };
    $('#reveal').onclick = reveal;
    keyHandler = (e) => {
      if (!quiz.answered && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); reveal(); }
      else if (quiz.answered && e.key === '1') next(false);
      else if (quiz.answered && e.key === '2') next(true);
    };
  } else {
    const opts = q.type === 'tf' ? [['true', 'Benar'], ['false', 'Salah']] : q.type === 'mc' ? q.options.map((o) => [o, o]) : null;
    setView(`<div class="quiz-wrap">${head}
      <div class="question">${esc(q.prompt)}</div>
      ${opts ? `<div class="options">${opts.map(([v, l], i) => `<button class="option" data-v="${esc(v)}"><span class="key">${i + 1}</span><span>${esc(l)}</span></button>`).join('')}</div>`
        : `<form id="sf" class="row"><input type="text" id="sa" autocomplete="off" style="flex:1;min-width:200px" placeholder="Ketik jawabanmu…"><button class="btn primary">Jawab</button></form>`}
      <div id="fb"></div>
      <div class="row" style="margin-top:24px"><button class="btn small" id="quit">Berhenti</button></div></div>`, 'Kuis');

    const finish = (ok, given) => {
      quiz.answered = true;
      quiz.lastOk = ok;
      quiz.results.push({ q, ok, given });
      $('#fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}"><strong>${ok ? '✅ Benar!' : '❌ Kurang tepat.'}</strong>
        ${ok && q.type !== 'short' ? '' : `<div>Jawaban: <strong>${esc(answerLabel(q))}</strong></div>`}
        ${q.explanation ? `<div class="small-text" style="margin-top:6px">${esc(q.explanation)}</div>` : ''}</div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="nx">${quiz.i + 1 < quiz.items.length ? 'Lanjut →' : 'Lihat hasil'} (Enter)</button></div>`;
      $('#nx').onclick = () => advance();
      $('#nx').focus();
    };
    if (opts) {
      $$('.option').forEach((b) => (b.onclick = () => {
        if (quiz.answered) return;
        const ok = b.dataset.v === String(q.answer);
        $$('.option').forEach((o) => { o.disabled = true; if (o.dataset.v === String(q.answer)) o.classList.add('correct'); });
        if (!ok) b.classList.add('wrong');
        finish(ok, b.dataset.v);
      }));
    } else {
      $('#sa').focus();
      $('#sf').onsubmit = (e) => {
        e.preventDefault();
        if (quiz.answered) return;
        const g = $('#sa').value;
        if (!g.trim()) return;
        $('#sa').disabled = true;
        finish(checkShort(g, q.answer), g);
      };
    }
    keyHandler = (e) => {
      if (quiz.answered && e.key === 'Enter' && document.activeElement?.id !== 'nx') { e.preventDefault(); advance(); }
      else if (!quiz.answered && opts && /^[1-9]$/.test(e.key) && document.activeElement?.tagName !== 'INPUT') { $$('.option')[+e.key - 1]?.click(); }
    };
  }
  $('#quit').onclick = () => { if (confirm('Hentikan sesi ini? Jawaban yang sudah diberikan tetap dicatat.')) { if (quiz.answered) { record(quiz.results[quiz.results.length - 1].q, quiz.results[quiz.results.length - 1].ok); save(); } quiz.items = quiz.items.slice(0, quiz.results.length); viewQuizResult(); } };

  function next(ok) { quiz.results.push({ q, ok }); advance(); }
  function advance() {
    const r = quiz.results[quiz.results.length - 1];
    if (r) record(r.q, r.ok);
    save();
    quiz.i++;
    viewQuizRun();
  }
}

function viewQuizResult() {
  keyHandler = null;
  const r = quiz.results;
  if (!quiz.saved && r.length) {
    db.attempts.push({ date: Date.now(), label: quiz.label, mode: quiz.mode, score: r.filter((x) => x.ok).length, total: r.length });
    if (db.attempts.length > 200) db.attempts = db.attempts.slice(-200);
    save(); quiz.saved = true;
  }
  const ok = r.filter((x) => x.ok).length;
  const pct = r.length ? Math.round((ok / r.length) * 100) : 0;
  const wrong = r.filter((x) => !x.ok);
  const msg = pct >= 85 ? 'Luar biasa! 🎉' : pct >= 65 ? 'Bagus, sedikit lagi! 💪' : 'Ayo ulangi materinya 📖';
  setView(`<div class="quiz-wrap">
    <div class="card" style="text-align:center"><div class="muted">${esc(quiz.label)}</div>
      <div class="score-big">${pct}%</div><div>${ok} dari ${r.length} ${quiz.mode === 'flash' ? 'sudah hafal' : 'benar'} — ${msg}</div>
      <div class="row" style="justify-content:center;margin-top:16px">
        ${wrong.length ? `<button class="btn primary" id="retry">🔁 Ulangi ${wrong.length} yang salah</button>` : ''}
        <a class="btn" href="#/kuis">Kuis lain</a><a class="btn" href="#/">Beranda</a></div></div>
    ${wrong.length ? `<h2>Yang perlu diulang</h2><div class="list">${wrong.map((x) => `<div class="card">
      <div>${esc(x.q.prompt)}</div>
      ${x.given !== undefined ? `<div class="small-text" style="color:var(--bad)">Jawabanmu: ${esc(x.q.type === 'tf' ? (x.given === 'true' ? 'Benar' : 'Salah') : x.given)}</div>` : ''}
      <div class="small-text" style="color:var(--good)">Jawaban benar: <strong>${esc(answerLabel(x.q))}</strong></div>
      <div class="small-text"><a href="#/catatan/${x.q.noteId}">Baca materi: ${esc(note(x.q.noteId)?.title || '')}</a></div></div>`).join('')}</div>` : ''}
  </div>`, 'Hasil kuis');
  const retry = $('#retry');
  if (retry) retry.onclick = () => {
    quiz = { mode: quiz.mode, items: shuffle(wrong.map((x) => x.q)), i: 0, results: [], label: quiz.label + ' (ulang)', answered: false };
    location.hash = '#/kuis/main'; render();
  };
}

/* ---------- Pencarian & pengaturan ---------- */
function viewSearch(q) {
  const t = norm(q);
  const hits = t ? db.notes.filter((n) => norm(n.title + ' ' + n.content + ' ' + (course(n.courseId)?.name || '')).includes(t)) : [];
  const snippet = (n) => {
    const plain = stripMd(n.content.replace(/\n+/g, ' '));
    const i = norm(plain).indexOf(t);
    const s = Math.max(0, i - 60);
    return (s > 0 ? '…' : '') + plain.slice(s, s + 180) + '…';
  };
  setView(`<h1>Hasil pencarian</h1><p class="muted">“${esc(q)}” — ${hits.length} catatan</p>
    <div class="list">${hits.map((n) => `<a class="card note-item" href="#/catatan/${n.id}"><div class="title">${esc(n.title)}</div>
      <div class="small-text muted">${esc(course(n.courseId)?.name || '')}</div><div class="small-text">${esc(snippet(n))}</div></a>`).join('') || '<div class="card empty">Tidak ditemukan.</div>'}</div>`, 'Cari');
}

function viewSettings() {
  const size = new Blob([JSON.stringify(db)]).size;
  setView(`
    <h1>Backup &amp; Pengaturan</h1>
    <div class="card" style="margin-top:16px;${storageOk ? '' : 'border-color:var(--bad)'}">
      <strong>⚠️ Penting:</strong> semua catatan tersimpan di <em>browser ini saja</em> (${(size / 1024).toFixed(1)} KB).
      Kalau riwayat/data browser dihapus atau kamu pindah perangkat, data bisa hilang. Ekspor backup secara rutin,
      lalu impor file itu di perangkat lain.
    </div>
    <h2>Backup</h2>
    <div class="row">
      <button class="btn primary" id="exp">⬇️ Ekspor backup (.json)</button>
      <label class="btn">⬆️ Impor backup<input type="file" id="imp" accept=".json,application/json" hidden></label>
    </div>
    <h2>Tampilan</h2>
    <div class="row">
      <select id="theme"><option value="">Ikuti sistem</option><option value="light">Terang</option><option value="dark">Gelap</option></select>
    </div>
    <h2>Zona bahaya</h2>
    <div class="row"><button class="btn" id="resetStats">Reset statistik kuis</button><button class="btn danger" id="wipe">Hapus semua data</button></div>
  `, 'Pengaturan');

  $('#exp').onclick = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `catatan-kuliah-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#imp').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.notes) || !Array.isArray(data.courses)) throw new Error('Format tidak dikenali');
      const merge = db.notes.length && confirm('Gabungkan dengan data yang ada?\n\nOK = gabungkan, Batal = ganti semua data dengan backup');
      if (merge) {
        const ids = (arr) => new Set(arr.map((x) => x.id));
        const add = (k) => { const have = ids(db[k]); db[k].push(...(data[k] || []).filter((x) => !have.has(x.id))); };
        ['courses', 'notes', 'questions'].forEach(add);
        db.stats = { ...(data.stats || {}), ...db.stats };
        db.attempts = [...(data.attempts || []), ...db.attempts].sort((a, b) => a.date - b.date);
      } else db = Object.assign(emptyDb(), data);
      save(); toast('Backup berhasil diimpor ✓'); location.hash = '#/'; render();
    } catch (err) { toast('Gagal impor: ' + err.message); }
  };
  const th = $('#theme');
  try { th.value = localStorage.getItem('catatanKuliah.theme') || ''; } catch (e) { /* ignore */ }
  th.onchange = () => { try { localStorage.setItem('catatanKuliah.theme', th.value); } catch (e) { /* ignore */ } applyTheme(); };
  $('#resetStats').onclick = () => { if (confirm('Reset semua statistik dan riwayat kuis?')) { db.stats = {}; db.attempts = []; save(); toast('Statistik direset'); } };
  $('#wipe').onclick = () => {
    if (prompt('Ketik HAPUS untuk menghapus semua mata kuliah, catatan, dan soal:') !== 'HAPUS') return;
    db = emptyDb(); save(); toast('Semua data dihapus'); location.hash = '#/'; render();
  };
}

function applyTheme() {
  let t = '';
  try { t = localStorage.getItem('catatanKuliah.theme') || ''; } catch (e) { /* ignore */ }
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
}

function viewNotFound() { setView(`<div class="card empty">Halaman tidak ditemukan. <a href="#/">Kembali ke beranda</a></div>`); }

/* ---------- Router ---------- */
let guardLeave = null, isDirty = null, keyHandler = null, lastHash = location.hash;
document.addEventListener('keydown', (e) => { if (keyHandler && !e.ctrlKey && !e.metaKey && !e.altKey) keyHandler(e); });

function render() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const p = path.split('/').filter(Boolean);
  keyHandler = null; guardLeave = null; isDirty = null; app.onchange = null;
  $('#sidebar').classList.remove('open');

  if (!p.length) viewHome();
  else if (p[0] === 'matkul' && p[1]) viewCourse(p[1]);
  else if (p[0] === 'catatan' && p[1] === 'baru') viewEditor(null, params);
  else if (p[0] === 'catatan' && p[1] && p[2] === 'edit') viewEditor(p[1], params);
  else if (p[0] === 'catatan' && p[1]) viewNote(p[1]);
  else if (p[0] === 'kuis' && p[1] === 'main') viewQuizRun();
  else if (p[0] === 'kuis') viewQuizSetup(params);
  else if (p[0] === 'cari') viewSearch(params.get('q') || '');
  else if (p[0] === 'pengaturan') viewSettings();
  else viewNotFound();
  renderSidebar();
  lastHash = location.hash;
}

window.addEventListener('hashchange', () => {
  if (guardLeave && guardLeave()) { history.replaceState(null, '', lastHash); return; }
  render();
});
window.addEventListener('beforeunload', (e) => { if (isDirty && isDirty()) { e.preventDefault(); e.returnValue = ''; } });

$('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
$('#addCourseBtn').onclick = () => courseDialog();
$('#searchForm').onsubmit = (e) => { e.preventDefault(); const q = $('#searchInput').value.trim(); if (q) location.hash = '#/cari?q=' + encodeURIComponent(q); };

applyTheme();
save();
render();
