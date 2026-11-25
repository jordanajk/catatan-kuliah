# 📚 Catatan Kuliah

Ruang belajar pribadi untuk menyimpan semua materi kuliah, membacanya ulang kapan saja, dan mengubahnya menjadi kuis atau flashcard.

## Fitur

- **Mata kuliah per semester**: kelompokkan catatan berdasarkan mata kuliah dan semester.
- **Catatan materi** dengan format sederhana (judul, poin, tebal, stabilo, kode, kutipan) dan pratinjau langsung.
- **Kuis otomatis dari catatan**:
  - `**kata penting**` → soal isian (kata itu dikosongkan)
  - `Istilah :: Definisi` → soal pilihan ganda + soal isian istilah
- **Soal buatan sendiri**: pilihan ganda, benar/salah, dan isian singkat (jawaban alternatif dipisah `|`, salah ketik kecil tetap diterima).
- **Mode kuis & flashcard**: soal yang sering salah didahulukan (sistem kotak Leitner), plus tombol "ulangi yang salah".
- **Beranda**: statistik, materi yang perlu diulang, dan riwayat skor.
- **Pencarian** di semua catatan.
- **Backup**: ekspor/impor file `.json` untuk pindah perangkat.
- **Halaman depan pribadi**: sapaan dengan nama panggilan, lanjutkan materi terakhir, soal yang perlu diulang, pengingat backup, dan rak mata kuliah per semester.
- Tampilan terang/gelap dan bisa dipakai di HP.
- Tidak diindeks mesin pencari (`noindex`).

## Cara pakai

**Online:** https://jordanajk.github.io/catatan-kuliah/ (halaman depan pribadi) → tombol **Buka catatan** (`app.html`).

Tidak perlu instalasi. Bisa juga dibuka langsung dari file `index.html` / `app.html` di browser.

> ⚠️ Data tersimpan di browser (localStorage). Ekspor backup secara rutin lewat menu **Backup & Pengaturan**.

## Struktur

```
index.html   halaman depan: sapaan, ringkasan belajar, rak mata kuliah, contekan
app.html     aplikasi catatan & kuis
core.js      inti data: penyimpanan, markdown, pembuatan soal (dipakai kedua halaman)
app.js       antarmuka aplikasi
styles.css   tampilan aplikasi
```
