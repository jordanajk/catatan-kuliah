# 📚 Catatan Kuliah

Website pribadi untuk menyimpan semua materi kuliah, membacanya ulang kapan saja, dan mengubahnya menjadi kuis atau flashcard.

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
- Tampilan terang/gelap dan bisa dipakai di HP.

## Cara pakai

**Online:** https://jordanajk.github.io/catatan-kuliah/ (landing page) → tombol **Buka aplikasi** (`app.html`).

Tidak perlu instalasi. Bisa juga dibuka langsung dari file `index.html` / `app.html` di browser.

> ⚠️ Data tersimpan di browser (localStorage). Ekspor backup secara rutin lewat menu **Backup & Pengaturan**.

## Struktur

```
index.html   landing page
app.html     aplikasi
styles.css   tampilan aplikasi
assets/      screenshot untuk landing page
app.js       semua logika (data, markdown, pembuatan soal, kuis)
```
