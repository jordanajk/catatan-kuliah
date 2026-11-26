'use strict';
/* Catatan Kuliah — inti data: penyimpanan, markdown, dan pembuatan soal.
   Dipakai oleh app.html (aplikasi) dan index.html (halaman depan). Tanpa akses DOM selain $ helper. */

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

/* Mata kuliah yang diambil. Ditambahkan otomatis sekali ke data di browser (lihat ensureMyCourses). */
const MY_COURSES = [
  { code: 'FOOD6003', name: 'Global Food and Nutrition Science Capstone Project A', units: 12, semester: '2026 Semester 1', color: '#b5523b' },
  { code: 'FOOD6004', name: 'Global Food and Nutrition Science Capstone Project B', units: 12, semester: '2026 Semester 2', color: '#b5523b' },
  { code: 'PROJX500', name: 'Project Management Fundamentals', units: 6, semester: '2026 Semester 2', color: '#2f8f9d' },
  { code: 'MARK5005', name: 'Consumer Behaviour and Insights', units: 6, semester: '2026 Semester 2', color: '#8a5cb8' },
  { code: 'FOOD6007', name: 'Innovations in Food Proc', units: 6, semester: 'Kredit eksternal', credit: 'external', color: '#2f6f5e' },
  { code: 'ECON5015', name: 'Global Food and Ag Mkt', units: 6, semester: 'Kredit eksternal', credit: 'external', color: '#c08a1e' },
  { code: 'FOOD5006', name: 'Sensory and Flavour Science', units: 6, semester: 'Kredit eksternal', credit: 'external', color: '#2f6f5e' },
  { code: 'FOOD5007', name: 'Advance in Food and Nutrition', units: 6, semester: 'Kredit eksternal', credit: 'external', color: '#2f6f5e' },
  { code: 'FOODX300', name: 'Food Prod Future Climate', units: 6, semester: 'Kredit eksternal', credit: 'external', color: '#2f6f5e' },
  { code: 'ENGPX415', name: 'Food Processing and Safety', units: 6, semester: 'Kredit eksternal', credit: 'external', color: '#3b6fb6' },
  { code: 'FOOD5009', name: 'Nutrition Metabolism', units: 6, semester: 'Kredit eksternal', credit: 'external', color: '#2f6f5e' },
  { code: 'ECON6013', name: 'Globalisation Agric Emerg Eco1', units: 6, semester: 'Kredit eksternal', credit: 'external', color: '#c08a1e' },
];
const MY_COURSES_VERSION = 1;

/* Isi catatan contoh versi lama — dipakai untuk mengenali contoh yang belum pernah diubah. */
const SAMPLE_CONTENT = `Normalisasi adalah proses mengorganisasi tabel untuk mengurangi **redundansi** data dan mencegah anomali.

## Bentuk Normal
- 1NF :: Setiap kolom berisi nilai atomik dan tidak ada grup berulang
- 2NF :: Memenuhi 1NF dan setiap atribut non-kunci bergantung penuh pada seluruh primary key
- 3NF :: Memenuhi 2NF dan tidak ada ketergantungan transitif
- BCNF :: Setiap determinan merupakan candidate key

## Kunci
Kolom yang secara unik mengidentifikasi setiap baris disebut **primary key**.
Kolom yang merujuk ke primary key tabel lain disebut **foreign key**.

> Ini catatan contoh. Tulis kata dengan dua bintang (tebal) untuk membuat soal isian otomatis, dan tulis "Istilah :: Definisi" untuk soal pilihan ganda otomatis. Hapus mata kuliah contoh ini kapan saja.`;

function ensureMyCourses(d) {
  if ((d.myCoursesVersion || 0) >= MY_COURSES_VERSION) return d;
  // Buang mata kuliah contoh hanya jika masih persis seperti bawaan (belum dipakai).
  const sample = d.courses.find((c) => c.name === 'Contoh: Basis Data');
  if (sample) {
    const ns = d.notes.filter((n) => n.courseId === sample.id);
    if (ns.every((n) => n.content === SAMPLE_CONTENT)) {
      const ids = new Set(ns.map((n) => n.id));
      d.notes = d.notes.filter((n) => !ids.has(n.id));
      d.questions = d.questions.filter((q) => !ids.has(q.noteId));
      d.courses = d.courses.filter((c) => c !== sample);
    }
  }
  for (const m of MY_COURSES) {
    if (!d.courses.some((c) => c.code === m.code)) d.courses.push({ id: 'mk-' + m.code.toLowerCase(), ...m, createdAt: Date.now() });
  }
  d.myCoursesVersion = MY_COURSES_VERSION;
  return d;
}

function load() {
  let d = emptyDb();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) d = Object.assign(emptyDb(), JSON.parse(raw));
  } catch (e) { /* storage unavailable */ }
  return ensureMyNotes(ensureMyCourses(d));
}

/* Tambahkan catatan dari materi.js sekali saja; yang sudah pernah ditambahkan tidak diulang walau dihapus. */
function ensureMyNotes(d) {
  if (typeof MY_NOTES === 'undefined') return d;
  d.myNotesApplied = Array.isArray(d.myNotesApplied) ? d.myNotesApplied : [];
  for (const m of MY_NOTES) {
    if (d.myNotesApplied.includes(m.id)) continue;
    const now = Date.now();
    if (!d.courses.some((c) => c.id === m.course.id)) d.courses.push({ ...m.course, createdAt: now });
    if (!d.notes.some((n) => n.id === m.id)) d.notes.push({ id: m.id, courseId: m.course.id, title: m.title, content: m.content, createdAt: now, updatedAt: now });
    for (const q of m.questions || []) {
      if (!d.questions.some((x) => x.id === q.id)) d.questions.push({ options: [], explanation: '', ...q, noteId: m.id });
    }
    d.myNotesApplied.push(m.id);
  }
  return d;
}
const totalUnits = (courses) => courses.reduce((s, c) => s + (+c.units || 0), 0);
let db = load();
let storageOk = true;

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); storageOk = true; return true; }
  catch (e) { storageOk = false; if (typeof toast === 'function') toast('Gagal menyimpan di browser ini. Segera ekspor backup!'); return false; }
}

const course = (id) => db.courses.find((c) => c.id === id);
const note = (id) => db.notes.find((n) => n.id === id);
// Urut sesuai waktu dibuat (urutan pertemuan), lalu judul
const notesOf = (courseId) => db.notes.filter((n) => n.courseId === courseId).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || a.title.localeCompare(b.title, 'id', { numeric: true }));

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

