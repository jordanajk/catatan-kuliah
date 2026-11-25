'use strict';
/* Catatan Kuliah — antarmuka aplikasi. Membutuhkan core.js. */

/* ---------- Helpers ---------- */
const app = $('#app');
const DAY = 86400000;
const SEMESTERS = Array.from({ length: 14 }, (_, i) => `Semester ${i + 1}`);
const TYPE_LABEL = { mc: 'Pilihan ganda', tf: 'Benar / Salah', short: 'Isian' };
const ic = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const getLS = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const setLS = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
const pctOf = (a) => Math.round((a.score / a.total) * 100);
function relTime(t) {
  const start = (d) => new Date(d).setHours(0, 0, 0, 0);
  const d = Math.round((start(Date.now()) - start(t)) / DAY);
  if (d <= 0) return 'hari ini';
  if (d === 1) return 'kemarin';
  if (d < 30) return `${d} hari lalu`;
  return fmtDate(t);
}

let toastTimer;
function toast(msg, kind) {
  kind = kind || (/^gagal/i.test(msg) ? 'err' : 'ok');
  const t = $('#toast');
  t.innerHTML = `${ic(kind === 'err' ? 'alert' : 'check-circle')}<span>${esc(msg)}</span>`;
  t.className = `toast show ${kind}`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function setView(html, title) {
  app.innerHTML = `<div class="page">${html}</div>`;
  document.title = title ? `${title} · Catatan Kuliah` : 'Catatan Kuliah';
  window.scrollTo(0, 0);
}

function pageHead({ crumbs = [], title, sub = '', actions = '' }) {
  const c = crumbs.length ? `<nav class="crumbs" aria-label="Jejak">${crumbs.map(([l, h]) => (h ? `<a href="${h}">${esc(l)}</a>` : `<span>${esc(l)}</span>`)).join(ic('chev'))}</nav>` : '';
  return `<div class="page-head">${c}<div class="page-head-row">
    <div class="page-title"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ''}</div></div>`;
}

function emptyState({ icon = 'file', title, text = '', actions = '', compact = false }) {
  return `<div class="empty ${compact ? 'compact' : ''}"><div class="empty-ic">${ic(icon)}</div>
    <h3>${title}</h3>${text ? `<p>${text}</p>` : ''}${actions ? `<div class="page-actions">${actions}</div>` : ''}</div>`;
}

function weakCountForNote(noteId) { return questionsFor([noteId]).filter((q) => isWeak(q.id)).length; }

function noteRow(n, showCourse = true) {
  const c = course(n.courseId);
  const weak = weakCountForNote(n.id);
  const nq = questionsFor([n.id]).length;
  return `<a class="row-item" href="#/catatan/${n.id}">
    <span class="row-icon" style="--c:${esc(c?.color || '')}">${ic('file')}</span>
    <span class="row-main"><span class="row-title">${esc(n.title)}</span>
      <span class="row-sub">${showCourse && c ? esc(c.name) + ' · ' : ''}${nq} soal · diubah ${relTime(n.updatedAt)}</span></span>
    ${weak ? `<span class="badge bad">${weak} perlu diulang</span>` : ''}
    ${ic('chev', 'row-chev')}</a>`;
}

/* ---------- Modal ---------- */
function modal({ title, body = '', confirmText = 'Simpan', cancelText = 'Batal', danger = false, validate }) {
  return new Promise((resolve) => {
    const root = $('#modalRoot');
    const prevFocus = document.activeElement;
    root.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
      <form id="mForm" novalidate>
        <div class="modal-head"><h2 id="mTitle">${esc(title)}</h2>
          <button type="button" class="icon-btn ghost sm" data-close aria-label="Tutup">${ic('x')}</button></div>
        <div class="modal-body">${body}</div>
        <div class="modal-foot">
          ${cancelText ? `<button type="button" class="btn" data-close>${esc(cancelText)}</button>` : ''}
          <button type="submit" class="btn ${danger ? 'danger-solid' : 'primary'}">${esc(confirmText)}</button></div>
      </form></div></div>`;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); } };
    function close(val) {
      document.removeEventListener('keydown', onKey, true);
      root.innerHTML = '';
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(val);
    }
    document.addEventListener('keydown', onKey, true);
    $$('[data-close]', root).forEach((b) => (b.onclick = () => close(null)));
    $('.modal-backdrop', root).addEventListener('mousedown', (e) => { if (e.target.classList.contains('modal-backdrop')) close(null); });
    const form = $('#mForm', root);
    form.onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const err = validate && validate(data);
      if (err) { toast(err, 'err'); return; }
      close(data);
    };
    ($('[autofocus]', root) || $('button[type=submit]', root)).focus();
  });
}
const confirmDialog = (title, message, confirmText = 'Hapus', danger = true) =>
  modal({ title, body: `<p>${message}</p>`, confirmText, danger }).then((r) => r !== null);

/* ---------- Sidebar ---------- */
function renderSidebar() {
  const route = location.hash || '#/';
  $$('.nav-main a').forEach((a) => {
    const n = a.dataset.nav;
    const on = n === 'home' ? route === '#/' || route === '#' : n === 'kuis' ? route.startsWith('#/kuis') : route.startsWith('#/pengaturan');
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const curNote = route.match(/^#\/catatan\/([^/?]+)/);
  const activeCourse = route.match(/^#\/matkul\/([^/?]+)/)?.[1] || (curNote && note(curNote[1])?.courseId);
  const groups = {};
  for (const c of db.courses) (groups[c.semester || 'Lainnya'] ||= []).push(c);
  const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  $('#courseList').innerHTML = keys.length ? keys.map((k) => `<div class="semester-label">${esc(k)}</div>` +
    groups[k].sort((a, b) => a.name.localeCompare(b.name, 'id')).map((c) =>
      `<a class="course-link ${c.id === activeCourse ? 'active' : ''}" href="#/matkul/${c.id}" title="${esc((c.code ? c.code + ' · ' : '') + c.name)}">
        <span class="dot" style="background:${esc(c.color)}"></span><span class="nm-wrap"><span class="nm">${esc(c.name)}</span>${c.code ? `<span class="cd">${esc(c.code)}</span>` : ''}</span>
        <span class="count">${notesOf(c.id).length}</span></a>`).join('')).join('')
    : '<p class="side-empty">Belum ada mata kuliah.</p>';

  const lb = +getLS('catatanKuliah.lastBackup');
  const stale = db.notes.length && (!lb || Date.now() - lb > 14 * DAY);
  $('#sideFoot').innerHTML = db.notes.length ? `<a class="backup-chip ${stale ? 'warn' : ''}" href="#/pengaturan">
    ${ic(stale ? 'alert' : 'check-circle')}<div><strong>${lb ? 'Backup ' + relTime(lb) : 'Belum pernah backup'}</strong>
    <span>${stale ? 'Ekspor supaya catatan aman' : 'Catatanmu aman'}</span></div></a>` : '';
}

/* ---------- Beranda ---------- */
function viewHome() {
  const allQ = questionsFor(db.notes.map((n) => n.id));
  const weak = allQ.filter((q) => isWeak(q.id));
  const att = db.attempts.slice(-30);
  const avg = att.length ? Math.round(att.reduce((s, a) => s + pctOf(a), 0) / att.length) : null;
  const recent = [...db.notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  const weakNotes = [...new Set(weak.map((q) => q.noteId))].map(note).filter(Boolean);

  if (!db.notes.length) {
    setView(pageHead({ title: 'Beranda', sub: `${db.courses.length} mata kuliah · ${totalUnits(db.courses)} unit` }) + `<div class="panel">${emptyState({
      icon: 'book', title: db.courses.length ? 'Tulis catatan pertamamu' : 'Mulai dari mata kuliah pertamamu',
      text: db.courses.length ? 'Tulis atau tempel materi dari kelas. Istilah yang kamu tebalkan akan otomatis jadi soal kuis.'
        : 'Tambahkan mata kuliah yang sedang kamu ambil, lalu tulis catatan dari pertemuan terakhir.',
      actions: db.courses.length ? `<a class="btn primary" href="#/catatan/baru">${ic('plus')} Catatan baru</a>`
        : `<button class="btn primary" id="emptyAddCourse">${ic('plus')} Tambah mata kuliah</button>`,
    })}</div>`, 'Beranda');
    const b = $('#emptyAddCourse'); if (b) b.onclick = () => courseDialog();
    return;
  }

  setView(`
    ${pageHead({
      title: 'Beranda', sub: `${db.courses.length} mata kuliah · ${totalUnits(db.courses)} unit`,
      actions: `${weak.length ? `<a class="btn" href="#/kuis?lemah=1">${ic('redo')} Ulangi ${weak.length} soal salah</a>` : ''}
        <a class="btn" href="#/kuis">${ic('play')} Mulai kuis</a>`,
    })}
    <div class="stats">
      <div class="stat"><div class="stat-ic">${ic('folder')}</div><div><div class="stat-num">${db.courses.length}</div><div class="stat-lbl">Mata kuliah</div></div></div>
      <div class="stat"><div class="stat-ic">${ic('file')}</div><div><div class="stat-num">${db.notes.length}</div><div class="stat-lbl">Catatan</div></div></div>
      <div class="stat"><div class="stat-ic">${ic('quiz')}</div><div><div class="stat-num">${allQ.length}</div><div class="stat-lbl">Soal kuis</div></div></div>
      <div class="stat"><div class="stat-ic">${ic('chart')}</div><div><div class="stat-num">${avg === null ? '–' : avg + '%'}</div><div class="stat-lbl">Rata-rata skor</div></div></div>
    </div>
    <div class="grid-2">
      <section class="panel"><div class="panel-head"><h2>${ic('file')} Terakhir diubah</h2></div>
        <div class="rows">${recent.map((n) => noteRow(n)).join('')}</div></section>
      <section class="panel"><div class="panel-head"><h2>${ic('redo')} Perlu diulang</h2>${weak.length ? '<a href="#/kuis?lemah=1">Ulangi semua</a>' : ''}</div>
        ${weakNotes.length ? `<div class="rows">${weakNotes.map((n) => noteRow(n)).join('')}</div>`
          : emptyState({ icon: 'check-circle', title: 'Semua aman', text: 'Soal yang kamu jawab salah akan muncul di sini supaya bisa diulang.', compact: true })}
      </section>
    </div>
    ${db.attempts.length ? `<section class="panel" style="margin-top:20px"><div class="panel-head"><h2>${ic('chart')} Riwayat kuis</h2></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Tanggal</th><th>Materi</th><th>Mode</th><th class="num">Skor</th></tr></thead>
        <tbody>${db.attempts.slice(-8).reverse().map((a) => {
          const p = pctOf(a);
          return `<tr><td style="white-space:nowrap">${fmtDate(a.date)}</td><td>${esc(a.label)}</td><td>${a.mode === 'flash' ? 'Flashcard' : 'Kuis'}</td>
            <td class="num">${a.score}/${a.total} <span class="badge ${p >= 80 ? 'good' : p < 60 ? 'bad' : ''}">${p}%</span></td></tr>`;
        }).join('')}</tbody></table></div></section>` : ''}
  `, 'Beranda');
}

/* ---------- Mata kuliah ---------- */
function viewCourse(id) {
  const c = course(id);
  if (!c) return viewNotFound();
  const ns = notesOf(id);
  const nq = questionsFor(ns.map((n) => n.id)).length;
  setView(`
    ${pageHead({
      crumbs: [['Beranda', '#/'], [c.semester || 'Mata kuliah']],
      title: `<span class="color-chip" style="background:${esc(c.color)}"></span>${esc(c.name)}`,
      sub: `${c.code ? `<span class="badge accent">${esc(c.code)}</span> ` : ''}${c.credit === 'external' ? '<span class="badge">Kredit eksternal</span> ' : ''}${c.units ? `${+c.units} unit · ` : ''}${ns.length} catatan · ${nq} soal`,
      actions: `${nq ? `<a class="btn" href="#/kuis?matkul=${c.id}">${ic('play')} Kuis</a><a class="btn" href="#/kuis?matkul=${c.id}&mode=flash">${ic('layers')} Flashcard</a>` : ''}
        <button class="icon-btn" id="editCourse" aria-label="Ubah mata kuliah" title="Ubah">${ic('pen')}</button>
        <button class="icon-btn danger" id="delCourse" aria-label="Hapus mata kuliah" title="Hapus">${ic('trash')}</button>
        <a class="btn primary" href="#/catatan/baru?matkul=${c.id}">${ic('plus')} Catatan</a>`,
    })}
    <section class="panel">
      ${ns.length ? `<div class="rows">${ns.map((n) => noteRow(n, false)).join('')}</div>`
        : emptyState({ icon: 'file', title: 'Belum ada catatan', text: `Tulis materi pertama untuk ${esc(c.name)}.`, actions: `<a class="btn primary" href="#/catatan/baru?matkul=${c.id}">${ic('plus')} Buat catatan</a>` })}
    </section>
  `, c.name);
  $('#editCourse').onclick = () => courseDialog(c);
  $('#delCourse').onclick = async () => {
    if (!await confirmDialog('Hapus mata kuliah?', `<strong>${esc(c.name)}</strong> beserta ${ns.length} catatan dan semua soalnya akan dihapus permanen.`)) return;
    const ids = new Set(ns.map((n) => n.id));
    db.notes = db.notes.filter((n) => !ids.has(n.id));
    db.questions = db.questions.filter((q) => !ids.has(q.noteId));
    db.courses = db.courses.filter((x) => x.id !== c.id);
    save(); toast('Mata kuliah dihapus'); location.hash = '#/';
  };
}

function lastSemester() {
  const c = [...db.courses].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
  return c?.semester || 'Semester 1';
}

async function courseDialog(existing) {
  const sems = [...new Set([...db.courses.map((c) => c.semester).filter(Boolean), ...SEMESTERS])];
  const color0 = existing ? existing.color : COLORS[db.courses.length % COLORS.length];
  const data = await modal({
    title: existing ? 'Ubah mata kuliah' : 'Mata kuliah baru',
    confirmText: existing ? 'Simpan' : 'Tambahkan',
    body: `
      <label class="field"><span class="label">Nama mata kuliah</span>
        <input class="input" name="name" maxlength="80" autofocus autocomplete="off" value="${esc(existing?.name || '')}" placeholder="mis. Basis Data"></label>
      <div class="field-row" style="grid-template-columns:1fr 1fr">
        <label class="field"><span class="label">Kode</span>
          <input class="input" name="code" maxlength="20" autocomplete="off" value="${esc(existing?.code || '')}" placeholder="mis. FOOD6003" style="text-transform:uppercase"></label>
        <label class="field"><span class="label">Unit</span>
          <input class="input" name="units" type="number" min="0" max="48" step="1" value="${esc(existing?.units ?? '')}" placeholder="mis. 6"></label>
      </div>
      <label class="field"><span class="label">Semester</span>
        <input class="input" name="semester" list="semList" autocomplete="off" value="${esc(existing?.semester || lastSemester())}" placeholder="mis. Semester 3">
        <datalist id="semList">${sems.map((s) => `<option value="${esc(s)}">`).join('')}</datalist></label>
      <div class="field"><span class="label">Warna</span><div class="swatches">
        ${COLORS.map((c, i) => `<label title="Warna ${i + 1}"><input type="radio" name="color" value="${c}" ${c === color0 ? 'checked' : ''}><span style="--c:${c}"></span></label>`).join('')}
      </div></div>`,
    validate: (d) => (!d.name.trim() ? 'Nama mata kuliah wajib diisi' : null),
  });
  if (!data) return;
  const fields = {
    name: data.name.trim(), semester: (data.semester || '').trim() || 'Lainnya', color: data.color || color0,
    code: (data.code || '').trim().toUpperCase(), units: data.units === '' ? '' : Math.max(0, +data.units || 0),
  };
  if (existing) { Object.assign(existing, fields); save(); toast('Mata kuliah diperbarui'); render(); return; }
  const c = { id: uid(), ...fields, createdAt: Date.now() };
  db.courses.push(c);
  save(); toast('Mata kuliah ditambahkan');
  if (location.hash === '#/matkul/' + c.id) render(); else location.hash = '#/matkul/' + c.id;
}

/* ---------- Catatan ---------- */
function viewNote(id) {
  const n = note(id);
  if (!n) return viewNotFound();
  const c = course(n.courseId);
  const qs = questionsFor([id]);
  const auto = qs.filter((q) => q.auto).length;
  const weak = qs.filter((q) => isWeak(q.id)).length;
  setView(`
    ${pageHead({
      crumbs: [['Beranda', '#/'], [c?.name || 'Mata kuliah', c ? '#/matkul/' + c.id : '#/']],
      title: esc(n.title),
      sub: `Dibuat ${fmtDate(n.createdAt)} · diubah ${relTime(n.updatedAt)}`,
      actions: `<button class="icon-btn danger" id="delNote" aria-label="Hapus catatan" title="Hapus">${ic('trash')}</button>
        <a class="btn" href="#/catatan/${id}/edit">${ic('pen')} Ubah</a>`,
    })}
    <div class="panel study-bar">
      <div class="info"><span class="row-icon">${ic('quiz')}</span>
        <div><strong>${qs.length ? `${qs.length} soal siap dilatih` : 'Belum ada soal'}</strong>
        <span class="small muted">${qs.length ? `${auto} otomatis dari catatan · ${qs.length - auto} buatan sendiri${weak ? ` · <span style="color:var(--bad)">${weak} perlu diulang</span>` : ''}`
          : 'Tebalkan istilah penting atau tambahkan soal di halaman Ubah.'}</span></div></div>
      ${qs.length ? `<div class="page-actions"><a class="btn" href="#/kuis?catatan=${id}&mode=flash">${ic('layers')} Flashcard</a>
        <a class="btn primary" href="#/kuis?catatan=${id}">${ic('play')} Kuis materi ini</a></div>` : ''}
    </div>
    <article class="panel paper"><div class="note-body">${renderMd(n.content) || '<p class="muted">Catatan ini masih kosong.</p>'}</div></article>
  `, n.title);
  $('#delNote').onclick = async () => {
    if (!await confirmDialog('Hapus catatan?', `<strong>${esc(n.title)}</strong> dan soal-soalnya akan dihapus permanen.`)) return;
    db.notes = db.notes.filter((x) => x.id !== id);
    db.questions = db.questions.filter((q) => q.noteId !== id);
    save(); toast('Catatan dihapus'); location.hash = '#/matkul/' + n.courseId;
  };
}

function viewEditor(id, params) {
  if (!db.courses.length) {
    setView(pageHead({ title: 'Catatan baru' }) + `<div class="panel">${emptyState({
      icon: 'folder', title: 'Buat mata kuliah dulu', text: 'Setiap catatan disimpan di dalam sebuah mata kuliah.',
      actions: `<button class="btn primary" id="mk">${ic('plus')} Tambah mata kuliah</button>`,
    })}</div>`, 'Catatan baru');
    $('#mk').onclick = () => courseDialog();
    return;
  }
  const existing = id ? note(id) : null;
  if (id && !existing) return viewNotFound();
  const draft = existing ? { ...existing } : { id: uid(), courseId: course(params.get('matkul')) ? params.get('matkul') : db.courses[0].id, title: '', content: '', createdAt: Date.now() };
  const qs = db.questions.filter((q) => q.noteId === draft.id).map((q) => ({ ...q, options: [...q.options] }));
  const backHref = existing ? '#/catatan/' + existing.id : (params.get('matkul') ? '#/matkul/' + params.get('matkul') : '#/');
  const c0 = course(draft.courseId);

  setView(`
    ${pageHead({
      crumbs: existing ? [['Beranda', '#/'], [c0?.name || '', '#/matkul/' + c0?.id], [existing.title, '#/catatan/' + existing.id]] : [['Beranda', '#/']],
      title: existing ? 'Ubah catatan' : 'Catatan baru',
    })}
    <section class="panel"><div class="panel-body">
      <div class="field-row">
        <label class="field"><span class="label">Judul materi</span>
          <input class="input" type="text" id="fTitle" value="${esc(draft.title)}" placeholder="mis. Pertemuan 3 — Normalisasi"></label>
        <label class="field"><span class="label">Mata kuliah</span>
          <select class="input" id="fCourse">${db.courses.map((c) => `<option value="${c.id}" ${c.id === draft.courseId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      </div>
      <details class="callout help"><summary>${ic('info')} Cara menulis supaya catatan otomatis jadi kuis</summary>
        <ul>
          <li><code>**kata penting**</code> → soal isian (kata itu dikosongkan)</li>
          <li><code>Istilah :: Definisi</code>, satu per baris → soal pilihan ganda dan tebak istilah</li>
          <li>Format lain: <code># Judul</code> <code>## Subjudul</code> <code>- poin</code> <code>1. nomor</code> <code>==stabilo==</code> <code>\`kode\`</code> <code>&gt; kutipan</code></li>
        </ul></details>
    </div></section>

    <section class="panel editor" style="margin-top:20px">
      <div><div class="pane-head"><label for="fContent">Tulis</label><span>Markdown</span></div>
        <textarea id="fContent" placeholder="Tulis atau tempel materi kuliahmu di sini…">${esc(draft.content)}</textarea></div>
      <div><div class="pane-head"><span>Pratinjau</span></div>
        <div class="preview note-body" id="preview"></div>
        <div class="pane-foot" id="autoCount"></div></div>
    </section>

    <section class="panel" style="margin-top:20px">
      <div class="panel-head"><h2>${ic('quiz')} Soal buatan sendiri</h2><span class="small muted" id="qCount"></span></div>
      <div id="qList"></div>
      <div class="panel-body" style="border-top:1px solid var(--border);background:var(--surface-2);border-radius:0 0 var(--radius) var(--radius)">
        <div class="field"><span class="label">Jenis soal</span>
          <div class="seg" role="radiogroup" aria-label="Jenis soal">
            <label><input type="radio" name="qType" value="mc" checked><span>Pilihan ganda</span></label>
            <label><input type="radio" name="qType" value="tf"><span>Benar / Salah</span></label>
            <label><input type="radio" name="qType" value="short"><span>Isian singkat</span></label>
          </div></div>
        <label class="field"><span class="label">Pertanyaan</span><textarea class="input" id="qPrompt" rows="2"></textarea></label>
        <div id="qTypeFields"></div>
        <label class="field"><span class="label">Pembahasan <span class="muted" style="font-weight:400">(opsional)</span></span><input class="input" type="text" id="qExpl"></label>
        <button class="btn" id="qAdd">${ic('plus')} Tambahkan soal</button>
      </div>
    </section>

    <div class="savebar">
      <span class="status" id="saveStatus">${existing ? 'Tidak ada perubahan' : 'Belum disimpan'}</span>
      <a class="btn" href="${backHref}">Batal</a>
      <button class="btn primary" id="saveNote">${ic('check')} Simpan</button>
    </div>
  `, existing ? 'Ubah ' + existing.title : 'Catatan baru');

  const content = $('#fContent');
  let dirty = false;
  const markDirty = () => { dirty = true; $('#saveStatus').textContent = 'Ada perubahan yang belum disimpan'; };
  const updatePreview = () => {
    $('#preview').innerHTML = renderMd(content.value) || '<p class="muted">Pratinjau muncul di sini.</p>';
    const p = parseNote({ content: content.value });
    const cloze = p.sentences.reduce((s, x) => s + (x.match(/\*\*[^*]+\*\*/g) || []).length, 0);
    $('#autoCount').innerHTML = `${ic('spark')} Soal otomatis: <strong>${cloze}</strong> isian · <strong>${p.defs.length}</strong> definisi`;
    $('#autoCount .ic').style.cssText = 'width:14px;height:14px;vertical-align:-2px;color:var(--accent)';
  };
  content.addEventListener('input', () => { markDirty(); updatePreview(); });
  $('#fTitle').addEventListener('input', markDirty);
  $('#fCourse').addEventListener('change', markDirty);
  updatePreview();

  const typeFields = () => {
    const t = $('input[name=qType]:checked').value;
    $('#qTypeFields').innerHTML = t === 'mc'
      ? `<label class="field"><span class="label">Pilihan jawaban</span>
          <textarea class="input" id="qOpts" rows="4" placeholder="*Jawaban benar&#10;Pilihan lain&#10;Pilihan lain"></textarea>
          <span class="hint">Satu pilihan per baris. Beri tanda * di depan jawaban yang benar.</span></label>`
      : t === 'tf'
        ? `<div class="field"><span class="label">Jawaban benar</span><div class="seg">
            <label><input type="radio" name="qTf" value="true" checked><span>Benar</span></label>
            <label><input type="radio" name="qTf" value="false"><span>Salah</span></label></div></div>`
        : `<label class="field"><span class="label">Jawaban benar</span><input class="input" type="text" id="qAns" placeholder="mis. primary key|kunci primer">
            <span class="hint">Pisahkan jawaban alternatif dengan tanda |</span></label>`;
  };
  $$('input[name=qType]').forEach((r) => r.addEventListener('change', typeFields));
  typeFields();

  const renderQList = () => {
    $('#qCount').textContent = qs.length ? `${qs.length} soal` : '';
    $('#qList').innerHTML = qs.length ? `<div class="rows">${qs.map((q, i) => `<div class="q-item">
      <div class="q-main"><span class="badge accent">${TYPE_LABEL[q.type]}</span>
        <div class="q-p" style="margin-top:6px">${esc(q.prompt)}</div>
        <div class="small muted">Jawaban: ${esc(answerLabel(q))}</div></div>
      <button class="icon-btn sm danger" data-del="${i}" aria-label="Hapus soal" title="Hapus soal">${ic('trash')}</button></div>`).join('')}</div>`
      : `<div class="panel-body small muted">Belum ada soal buatan sendiri. Soal otomatis tetap dibuat dari isi catatan.</div>`;
    $$('[data-del]').forEach((b) => (b.onclick = () => { qs.splice(+b.dataset.del, 1); markDirty(); renderQList(); }));
  };
  renderQList();

  $('#qAdd').onclick = () => {
    const type = $('input[name=qType]:checked').value;
    const promptText = $('#qPrompt').value.trim();
    if (!promptText) { toast('Tulis pertanyaannya dulu', 'err'); $('#qPrompt').focus(); return; }
    const q = { id: uid(), noteId: draft.id, type, prompt: promptText, options: [], answer: '', explanation: $('#qExpl').value.trim() };
    if (type === 'mc') {
      const lines = $('#qOpts').value.split('\n').map((l) => l.trim()).filter(Boolean);
      const right = lines.find((l) => l.startsWith('*'));
      if (lines.length < 2 || !right) { toast('Isi minimal 2 pilihan dan tandai yang benar dengan *', 'err'); return; }
      q.options = lines.map((l) => l.replace(/^\*\s*/, ''));
      q.answer = right.replace(/^\*\s*/, '');
    } else if (type === 'tf') q.answer = $('input[name=qTf]:checked').value;
    else { q.answer = $('#qAns').value.trim(); if (!q.answer) { toast('Isi jawaban yang benar', 'err'); return; } }
    qs.push(q); markDirty();
    $('#qPrompt').value = ''; $('#qExpl').value = ''; typeFields(); renderQList();
    toast('Soal ditambahkan. Jangan lupa simpan.');
  };

  const saveNote = () => {
    const title = $('#fTitle').value.trim();
    if (!title) { toast('Judul materi wajib diisi', 'err'); $('#fTitle').focus(); return; }
    const n = { ...draft, title, courseId: $('#fCourse').value, content: content.value, updatedAt: Date.now() };
    if (existing) Object.assign(existing, n); else db.notes.push(n);
    db.questions = db.questions.filter((q) => q.noteId !== n.id).concat(qs);
    dirty = false;
    if (save()) toast('Catatan tersimpan');
    location.hash = '#/catatan/' + n.id;
  };
  $('#saveNote').onclick = saveNote;
  keyHandler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveNote(); } };
  isDirty = () => dirty;
  guardLeave = () => dirty && !confirm('Perubahan belum disimpan. Tinggalkan halaman ini?');
}

/* ---------- Kuis ---------- */
let quiz = null;

function viewQuizSetup(params) {
  if (!db.notes.length) {
    setView(pageHead({ title: 'Kuis &amp; Flashcard' }) + `<div class="panel">${emptyState({
      icon: 'quiz', title: 'Belum ada materi', text: 'Tulis catatan dulu. Soal kuis dibuat dari isi catatanmu.',
      actions: `<a class="btn primary" href="#/catatan/baru">${ic('plus')} Catatan baru</a>`,
    })}</div>`, 'Kuis');
    return;
  }
  const preNote = params.get('catatan'), preCourse = params.get('matkul');
  const onlyWeak = params.get('lemah') === '1';
  const mode = params.get('mode') === 'flash' ? 'flash' : 'quiz';
  const checked = (n) => (preNote ? n.id === preNote : preCourse ? n.courseId === preCourse : true);

  setView(`
    ${pageHead({ title: 'Kuis &amp; Flashcard', sub: 'Pilih materi yang ingin diulang. Soal yang sering salah didahulukan.' })}
    <div class="grid-2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)">
      <section class="panel"><div class="panel-head"><h2>${ic('sliders')} Pengaturan</h2></div><div class="panel-body">
        <div class="mode-cards">
          <label class="mode-card"><input type="radio" name="mode" value="quiz" ${mode === 'quiz' ? 'checked' : ''}>
            <span class="row-icon">${ic('quiz')}</span><span><strong>Kuis</strong><span class="d">Jawab soal dan dapat skor</span></span></label>
          <label class="mode-card"><input type="radio" name="mode" value="flash" ${mode === 'flash' ? 'checked' : ''}>
            <span class="row-icon">${ic('layers')}</span><span><strong>Flashcard</strong><span class="d">Ingat sendiri, lalu nilai dirimu</span></span></label>
        </div>
        <div class="setting-line"><div><div class="t">Jumlah soal</div></div>
          <div class="seg">${[['5', '5'], ['10', '10'], ['20', '20'], ['50', '50'], ['9999', 'Semua']].map(([v, l]) =>
            `<label><input type="radio" name="count" value="${v}" ${v === '10' ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
        <label class="setting-line" style="cursor:pointer"><div><div class="t">Hanya soal yang pernah salah</div><div class="d">Fokus ke materi yang belum dikuasai</div></div>
          <input type="checkbox" id="weakOnly" ${onlyWeak ? 'checked' : ''}></label>
      </div></section>

      <section class="panel"><div class="panel-head"><h2>${ic('file')} Materi</h2>
          <div class="page-actions"><button class="btn sm ghost" id="selAll">Pilih semua</button><button class="btn sm ghost" id="selNone">Kosongkan</button></div></div>
        ${db.courses.map((c) => {
          const cn = notesOf(c.id);
          return cn.length ? `<div class="check-group">
            <div class="check-group-head"><span class="color-chip" style="background:${esc(c.color)};width:10px;height:10px"></span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.name)}</span>
              <button class="btn sm ghost" data-course="${c.id}">Hanya ini</button></div>
            ${cn.map((n) => `<label class="check-row"><input type="checkbox" name="n" value="${n.id}" data-c="${c.id}" ${checked(n) ? 'checked' : ''}>
              <span class="t">${esc(n.title)}</span><span class="n">${questionsFor([n.id]).length} soal</span></label>`).join('')}
          </div>` : '';
        }).join('')}
      </section>
    </div>
    <div class="savebar">
      <span class="status" id="available"></span>
      <button class="btn primary lg" id="start">${ic('play')} Mulai</button>
    </div>
  `, 'Kuis');

  const pool = () => {
    const ids = $$('input[name=n]:checked').map((i) => i.value);
    let qs = questionsFor(ids);
    if ($('#weakOnly').checked) qs = qs.filter((q) => isWeak(q.id));
    return { ids, qs };
  };
  const upd = () => {
    const { ids, qs } = pool();
    const n = Math.min(qs.length, +$('input[name=count]:checked').value);
    $('#available').textContent = qs.length ? `${n} dari ${qs.length} soal · ${ids.length} materi dipilih` : 'Tidak ada soal untuk pilihan ini';
    $('#start').disabled = !qs.length;
  };
  app.onchange = upd;
  $('#selAll').onclick = () => { $$('input[name=n]').forEach((i) => (i.checked = true)); upd(); };
  $('#selNone').onclick = () => { $$('input[name=n]').forEach((i) => (i.checked = false)); upd(); };
  $$('[data-course]').forEach((b) => (b.onclick = () => { $$('input[name=n]').forEach((i) => (i.checked = i.dataset.c === b.dataset.course)); upd(); }));
  upd();

  $('#start').onclick = () => {
    const { ids, qs } = pool();
    if (!qs.length) return;
    const n = +$('input[name=count]:checked').value;
    // Prioritaskan kotak Leitner rendah & soal baru, dengan sedikit acak
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
  const total = quiz.items.length;
  const head = `<div class="quiz-top">
      <div style="min-width:0"><div class="quiz-kicker">${quiz.mode === 'flash' ? 'Flashcard' : 'Kuis'} · ${esc(quiz.label)}</div>
        <div class="quiz-count">Soal ${quiz.i + 1} <span>/ ${total}</span></div></div>
      <button class="btn ghost sm" id="quit">${ic('x')} Berhenti</button></div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${quiz.i}"><div style="width:${(quiz.i / total) * 100}%"></div></div>`;
  quiz.answered = false;

  if (quiz.mode === 'flash') {
    setView(`<div class="quiz">${head}
      <div class="panel q-card flash">
        <div class="q-type">${esc(src?.title || '')}</div>
        <div class="q-text">${esc(q.prompt)}</div>
        <div id="ans" class="answer" hidden><strong>${esc(answerLabel(q))}</strong>${q.explanation ? `<div class="small muted" style="margin-top:8px">${esc(q.explanation)}</div>` : ''}</div>
      </div>
      <div class="flash-actions" id="ctl"><button class="btn primary lg" id="reveal">${ic('eye')} Tampilkan jawaban</button></div>
      <p class="quiz-hint">Tekan <kbd>Spasi</kbd> untuk membuka jawaban, lalu <kbd>1</kbd> belum hafal atau <kbd>2</kbd> sudah hafal</p>
    </div>`, 'Flashcard');
    const reveal = () => {
      $('#ans').hidden = false; quiz.answered = true;
      $('#ctl').innerHTML = `<button class="btn lg" id="no">${ic('x')} Belum hafal</button><button class="btn primary lg" id="yes">${ic('check')} Sudah hafal</button>`;
      $('#no').onclick = () => next(false); $('#yes').onclick = () => next(true);
      $('#yes').focus();
    };
    $('#reveal').onclick = reveal;
    keyHandler = (e) => {
      if (!quiz.answered && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); reveal(); }
      else if (quiz.answered && e.key === '1') next(false);
      else if (quiz.answered && e.key === '2') next(true);
    };
  } else {
    const opts = q.type === 'tf' ? [['true', 'Benar'], ['false', 'Salah']] : q.type === 'mc' ? q.options.map((o) => [o, o]) : null;
    setView(`<div class="quiz">${head}
      <div class="panel q-card">
        <div class="q-type">${TYPE_LABEL[q.type]} · ${esc(src?.title || '')}</div>
        <div class="q-text">${esc(q.prompt)}</div>
        ${opts ? `<div class="options">${opts.map(([v, l], i) => `<button class="option" data-v="${esc(v)}"><span class="key">${i + 1}</span><span>${esc(l)}</span><span class="state"></span></button>`).join('')}</div>`
          : `<form id="sf" class="answer-form"><input class="input" type="text" id="sa" autocomplete="off" placeholder="Ketik jawabanmu…" aria-label="Jawaban"><button class="btn primary lg">Jawab</button></form>`}
        <div id="fb"></div>
      </div>
      <p class="quiz-hint">${opts ? `Tekan <kbd>1</kbd>–<kbd>${opts.length}</kbd> untuk menjawab, lalu <kbd>Enter</kbd> untuk lanjut` : 'Salah ketik kecil tetap dianggap benar · <kbd>Enter</kbd> untuk menjawab'}</p>
    </div>`, 'Kuis');

    const finish = (ok, given) => {
      quiz.answered = true;
      quiz.results.push({ q, ok, given });
      const showAns = !ok || q.type === 'short';
      $('#fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">${ic(ok ? 'check-circle' : 'x-circle')}
        <div style="flex:1"><div class="fb-title">${ok ? 'Benar' : 'Kurang tepat'}</div>
          ${showAns ? `<div>Jawaban: <strong>${esc(answerLabel(q))}</strong></div>` : ''}
          ${q.explanation ? `<div class="fb-expl">${esc(q.explanation)}</div>` : ''}</div></div>
        <div class="quiz-foot"><button class="btn primary lg" id="nx">${quiz.i + 1 < total ? 'Lanjut' : 'Lihat hasil'} ${ic('arrow-right')}</button></div>`;
      $('#nx').onclick = () => advance();
      $('#nx').focus();
    };
    if (opts) {
      $$('.option').forEach((b) => (b.onclick = () => {
        if (quiz.answered) return;
        const ok = b.dataset.v === String(q.answer);
        $$('.option').forEach((o) => {
          o.disabled = true;
          if (o.dataset.v === String(q.answer)) { o.classList.add('correct'); $('.state', o).innerHTML = ic('check-circle'); }
        });
        if (!ok) { b.classList.add('wrong'); $('.state', b).innerHTML = ic('x-circle'); }
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
  $('#quit').onclick = async () => {
    if (!await confirmDialog('Hentikan sesi ini?', 'Jawaban yang sudah kamu berikan tetap dicatat di statistik.', 'Hentikan', false)) return;
    if (quiz.answered) { const r = quiz.results[quiz.results.length - 1]; record(r.q, r.ok); save(); }
    quiz.items = quiz.items.slice(0, quiz.results.length);
    viewQuizResult();
  };

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
  const [headline, color] = pct >= 85 ? ['Luar biasa', 'var(--good)'] : pct >= 65 ? ['Bagus, sedikit lagi', 'var(--accent)'] : ['Ayo ulangi materinya', 'var(--bad)'];
  const C = 2 * Math.PI * 52;
  setView(`<div class="quiz">
    <section class="panel result-hero">
      <div class="ring" style="--c:${color}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="bg" cx="60" cy="60" r="52"/>
        <circle class="fg" cx="60" cy="60" r="52" stroke-dasharray="${(C * pct) / 100} ${C}"/></svg><div class="num">${pct}%</div></div>
      <div style="flex:1;min-width:220px">
        <div class="quiz-kicker">${quiz.mode === 'flash' ? 'Flashcard' : 'Kuis'} · ${esc(quiz.label)}</div>
        <h2>${headline}</h2>
        <div class="meta"><div><b>${ok}</b>${quiz.mode === 'flash' ? 'sudah hafal' : 'benar'}</div><div><b>${wrong.length}</b>${quiz.mode === 'flash' ? 'belum hafal' : 'salah'}</div><div><b>${r.length}</b>total soal</div></div>
        <div class="page-actions">
          ${wrong.length ? `<button class="btn primary" id="retry">${ic('redo')} Ulangi ${wrong.length} yang salah</button>` : ''}
          <a class="btn" href="#/kuis">Kuis lain</a><a class="btn ghost" href="#/">Beranda</a></div>
      </div>
    </section>
    ${wrong.length ? `<section class="panel" style="margin-top:20px"><div class="panel-head"><h2>${ic('redo')} Yang perlu diulang</h2></div>
      ${wrong.map((x) => `<div class="mistake"><div class="q-p">${esc(x.q.prompt)}</div>
        ${x.given !== undefined ? `<div class="line bad">${ic('x')} Jawabanmu: ${esc(x.q.type === 'tf' ? (x.given === 'true' ? 'Benar' : 'Salah') : x.given)}</div>` : ''}
        <div class="line good">${ic('check')} Jawaban benar: <strong>${esc(answerLabel(x.q))}</strong></div>
        <a href="#/catatan/${x.q.noteId}">Baca materi: ${esc(note(x.q.noteId)?.title || '')} →</a></div>`).join('')}
    </section>` : ''}
  </div>`, 'Hasil kuis');
  const retry = $('#retry');
  if (retry) retry.onclick = () => {
    quiz = { mode: quiz.mode, items: shuffle(wrong.map((x) => x.q)), i: 0, results: [], label: quiz.label.replace(/ \(ulang\)$/, '') + ' (ulang)', answered: false };
    if (location.hash === '#/kuis/main') render(); else location.hash = '#/kuis/main';
  };
}

/* ---------- Pencarian ---------- */
function viewSearch(q) {
  const t = norm(q);
  const hits = t ? db.notes.filter((n) => norm(n.title + ' ' + n.content + ' ' + (course(n.courseId)?.name || '')).includes(t)) : [];
  const snippet = (n) => {
    const plain = stripMd(n.content.replace(/\n+/g, ' ').replace(/\s+::\s+/g, ': '));
    const i = norm(plain).indexOf(t);
    const s = Math.max(0, i - 60);
    let text = esc((s > 0 ? '…' : '') + plain.slice(s, s + 200) + (plain.length > s + 200 ? '…' : ''));
    const raw = q.trim();
    if (raw) text = text.replace(new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => `<mark>${m}</mark>`);
    return text;
  };
  $('#searchInput').value = q;
  setView(`${pageHead({ crumbs: [['Beranda', '#/']], title: 'Hasil pencarian', sub: `${hits.length} catatan untuk “${esc(q)}”` })}
    <section class="panel">${hits.length ? `<div class="rows">${hits.map((n) => {
      const c = course(n.courseId);
      return `<a class="row-item" href="#/catatan/${n.id}" style="align-items:flex-start">
        <span class="row-icon" style="--c:${esc(c?.color || '')}">${ic('file')}</span>
        <span class="row-main"><span class="row-title">${esc(n.title)}</span><span class="row-sub">${esc(c?.name || '')}</span>
          <span class="row-snippet">${snippet(n)}</span></span>${ic('chev', 'row-chev')}</a>`;
    }).join('')}</div>`
      : emptyState({ icon: 'search', title: 'Tidak ditemukan', text: 'Coba kata kunci lain, misalnya nama istilah atau judul materi.' })}</section>`, 'Cari');
}

/* ---------- Pengaturan ---------- */
function viewSettings() {
  const size = new Blob([JSON.stringify(db)]).size;
  const lb = +getLS('catatanKuliah.lastBackup');
  const stale = !lb || Date.now() - lb > 14 * DAY;
  const theme = getLS('catatanKuliah.theme');
  setView(`
    ${pageHead({ title: 'Backup &amp; Pengaturan', sub: 'Kelola penyimpanan dan tampilan aplikasi.' })}
    ${!storageOk ? `<div class="callout bad" style="margin-bottom:20px">${ic('alert')}<div><strong>Browser menolak penyimpanan.</strong> Perubahan terakhir mungkin tidak tersimpan. Segera ekspor backup.</div></div>`
      : db.notes.length && stale ? `<div class="callout warn" style="margin-bottom:20px">${ic('alert')}<div><strong>${lb ? `Backup terakhir ${relTime(lb)}.` : 'Kamu belum pernah backup.'}</strong>
        Catatan hanya tersimpan di browser ini. Kalau data browser dihapus atau kamu ganti perangkat, catatan bisa hilang.</div></div>` : ''}

    <section class="panel"><div class="panel-head"><h2>${ic('database')} Data &amp; backup</h2></div>
      <div class="setting"><div><div class="t">Penyimpanan di browser ini</div>
        <div class="d">${db.courses.length} mata kuliah · ${db.notes.length} catatan · ${(size / 1024).toFixed(1)} KB${lb ? ` · backup terakhir ${relTime(lb)}` : ''}</div></div></div>
      <div class="setting"><div><div class="t">Ekspor backup</div><div class="d">Unduh semua mata kuliah, catatan, soal, dan statistik sebagai satu file .json.</div></div>
        <div class="page-actions"><button class="btn primary" id="exp">${ic('download')} Ekspor</button></div></div>
      <div class="setting"><div><div class="t">Impor backup</div><div class="d">Pulihkan dari file backup. Kamu bisa memilih menggabungkan atau mengganti data.</div></div>
        <div class="page-actions"><label class="btn" tabindex="0" id="impBtn">${ic('upload')} Impor<input type="file" id="imp" accept=".json,application/json" hidden></label></div></div>
    </section>

    <section class="panel"><div class="panel-head"><h2>${ic('monitor')} Tampilan</h2></div>
      <div class="setting"><div><div class="t">Tema</div><div class="d">Pilih terang, gelap, atau ikuti pengaturan perangkat.</div></div>
        <div class="seg" role="radiogroup" aria-label="Tema">${[['', 'Sistem'], ['light', 'Terang'], ['dark', 'Gelap']].map(([v, l]) =>
          `<label><input type="radio" name="theme" value="${v}" ${theme === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
    </section>

    <section class="panel"><div class="panel-head"><h2>${ic('alert')} Zona bahaya</h2></div>
      <div class="setting"><div><div class="t">Reset statistik kuis</div><div class="d">Menghapus riwayat skor dan catatan soal yang pernah salah. Catatan tidak terhapus.</div></div>
        <div class="page-actions"><button class="btn" id="resetStats">Reset statistik</button></div></div>
      <div class="setting"><div><div class="t">Hapus semua data</div><div class="d">Menghapus semua mata kuliah, catatan, dan soal dari browser ini secara permanen.</div></div>
        <div class="page-actions"><button class="btn danger" id="wipe">${ic('trash')} Hapus semua</button></div></div>
    </section>
  `, 'Pengaturan');

  $('#exp').onclick = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `catatan-kuliah-backup-${new Date().toISOString().slice(0, 10)}.json`;
    setLS('catatanKuliah.lastBackup', String(Date.now()));
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Backup diunduh'); render();
  };
  $('#impBtn').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#imp').click(); } };
  $('#imp').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    let data;
    try {
      data = JSON.parse(await f.text());
      if (!Array.isArray(data.notes) || !Array.isArray(data.courses)) throw new Error('format tidak dikenali');
    } catch (err) { toast('Gagal impor: ' + err.message, 'err'); e.target.value = ''; return; }
    let mode = 'replace';
    if (db.notes.length) {
      const res = await modal({
        title: 'Impor backup', confirmText: 'Impor',
        body: `<p>File berisi ${data.courses.length} mata kuliah dan ${data.notes.length} catatan.</p>
          <div class="choice-list">
            <label><input type="radio" name="mode" value="merge" checked><span><strong>Gabungkan</strong><span class="d">Tambahkan isi backup ke data yang sudah ada.</span></span></label>
            <label><input type="radio" name="mode" value="replace"><span><strong>Ganti semua</strong><span class="d">Hapus data sekarang dan pakai isi backup.</span></span></label>
          </div>`,
      });
      if (!res) { e.target.value = ''; return; }
      mode = res.mode;
    }
    if (mode === 'merge') {
      const ids = (arr) => new Set(arr.map((x) => x.id));
      const add = (k) => { const have = ids(db[k]); db[k].push(...(data[k] || []).filter((x) => !have.has(x.id))); };
      ['courses', 'notes', 'questions'].forEach(add);
      db.stats = { ...(data.stats || {}), ...db.stats };
      db.attempts = [...(data.attempts || []), ...db.attempts].sort((a, b) => a.date - b.date);
    } else db = Object.assign(emptyDb(), data);
    save(); toast('Backup berhasil diimpor'); location.hash = '#/'; render();
  };
  $$('input[name=theme]').forEach((r) => (r.onchange = () => { setLS('catatanKuliah.theme', r.value); applyTheme(); }));
  $('#resetStats').onclick = async () => {
    if (!await confirmDialog('Reset statistik kuis?', 'Riwayat skor dan penanda soal yang pernah salah akan dihapus.', 'Reset')) return;
    db.stats = {}; db.attempts = []; save(); toast('Statistik direset'); render();
  };
  $('#wipe').onclick = async () => {
    const res = await modal({
      title: 'Hapus semua data?', confirmText: 'Hapus permanen', danger: true,
      body: `<p>Semua mata kuliah, catatan, soal, dan statistik di browser ini akan dihapus. Pastikan kamu sudah mengekspor backup.</p>
        <label class="field"><span class="label">Ketik <strong>HAPUS</strong> untuk melanjutkan</span><input class="input" name="confirm" autocomplete="off" autofocus></label>`,
      validate: (d) => (d.confirm !== 'HAPUS' ? 'Ketik HAPUS dengan huruf kapital' : null),
    });
    if (!res) return;
    db = emptyDb(); save(); toast('Semua data dihapus'); location.hash = '#/'; render();
  };
}

function applyTheme() {
  const t = getLS('catatanKuliah.theme');
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
}

function viewNotFound() {
  setView(`<div class="panel">${emptyState({ icon: 'search', title: 'Halaman tidak ditemukan', text: 'Catatan atau mata kuliah ini mungkin sudah dihapus.', actions: `<a class="btn primary" href="#/">Kembali ke beranda</a>` })}</div>`, 'Tidak ditemukan');
}

/* ---------- Router ---------- */
let guardLeave = null, isDirty = null, keyHandler = null, lastHash = location.hash;
document.addEventListener('keydown', (e) => {
  if ($('#modalRoot').childElementCount) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
  if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) { e.preventDefault(); $('#searchInput').focus(); return; }
  if (e.key === 'Escape' && document.activeElement === $('#searchInput')) { $('#searchInput').blur(); return; }
  if (keyHandler && !e.altKey && (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() === 's')) keyHandler(e);
});

function closeSidebar() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); }

function render() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const p = path.split('/').filter(Boolean);
  keyHandler = null; guardLeave = null; isDirty = null; app.onchange = null;
  closeSidebar();
  if (p[0] !== 'cari') $('#searchInput').value = '';

  if (!p.length) viewHome();
  else if (p[0] === 'matkul' && p[1] === 'baru') { viewHome(); history.replaceState(null, '', '#/'); setTimeout(() => courseDialog(), 30); }
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

$('#menuBtn').onclick = () => { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); };
$('#scrim').onclick = closeSidebar;
$('#addCourseBtn').onclick = () => courseDialog();
$('#searchForm').onsubmit = (e) => { e.preventDefault(); const q = $('#searchInput').value.trim(); if (q) location.hash = '#/cari?q=' + encodeURIComponent(q); };

applyTheme();
save();
render();
