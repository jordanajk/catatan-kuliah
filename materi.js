'use strict';
/* Catatan materi yang dikirim lewat repo. Masing-masing ditambahkan SEKALI ke data di browser
   (lihat ensureMyNotes di core.js). Kalau dihapus di aplikasi, tidak akan ditambahkan lagi.
   Untuk menambah materi baru: tambahkan objek baru dengan id unik, lalu naikkan ?v= di app.html & index.html. */
const MY_NOTES = [
  {
    id: 'catatan-claude-01',
    course: { id: 'mk-claude-ai', code: '', name: 'Claude Masterclass (AI)', semester: 'Belajar mandiri', color: '#b83b7a' },
    title: 'Pengantar: AI agent & empat demo Claude',
    content: `Ringkasan video pembuka kursus Claude Masterclass (pengajar: Ryan Ahmed). Kursus ini membahas tiga cara memakai Claude: chat, Cowork, dan Claude Code.

## Produk Claude yang dipelajari
- Claude Chat :: Antarmuka percakapan untuk bertanya, berdiskusi, dan menulis bersama Claude
- Claude Cowork :: Mode agen yang bekerja langsung di folder komputer untuk riset, membaca file, dan membuat dokumen seperti model Excel
- Claude Code :: Agen untuk membangun halaman web, aplikasi, dan kode tanpa harus menulis kodenya sendiri
- Claude in Chrome :: Ekstensi browser yang membuat Claude bisa menjelajah web dan bertindak atas nama pengguna

## Konsep inti: AI agent
**AI agent** adalah AI yang tidak hanya menjawab, tetapi juga mengambil tindakan atas nama penggunanya.
Agen menerima perintah dalam bahasa sehari-hari, lalu memecahnya menjadi **subtask** yang ia susun sendiri.
Setelah bertindak, agen mengambil **screenshot** untuk mengamati hasilnya, lalu menentukan langkah berikutnya.
- Prompt :: Instruksi dalam bahasa sehari-hari yang diberikan kepada AI
- Subtask :: Langkah-langkah kecil yang dibuat agen sendiri dari satu perintah besar
- Skills :: Paket kemampuan yang dipakai agen untuk tugas tertentu, misalnya membaca PDF atau membuat file Excel

## Demo 1 — Mencari hotel lewat browser
Perintah diberikan lewat suara, tanpa mengetik: cari 3 hotel terbaik di Shibuya, Tokyo, tanggal 1–4 April.
Syaratnya budget $300 per malam, cari di booking.com, minimal bintang 4, rating minimal 8 dari 10, dan diurutkan berdasarkan **value**.
Claude membuka browser, memilih area dan tanggal, memasang filter, lalu menyajikan tiga pilihan.
- Pelajaran: perintah yang lengkap (lokasi, tanggal, budget, filter, kriteria urutan, dan "jangan bertanya") membuat agen bisa bekerja mandiri.
- Peringatan: jangan dulu memberi akses ==kartu kredit== untuk pemesanan otomatis karena teknologinya masih eksperimental.

## Demo 2 — Riset dan model keuangan dengan Cowork
- Claude diberi akses ke satu folder yang berisi laporan pasar kondominium dalam bentuk PDF.
- Prompt memakai peran: "kamu adalah analis keuangan real estate tingkat institusional".
- Agen membaca skill Excel dan PDF, riset di web, membangun model keuangan dinamis, menjalankan analisis sensitivitas, dan menulis laporan.
- Hasilnya file Excel dengan banyak tab, grafik, dan proyeksi arus kas yang tersimpan langsung di folder.
Menurut pengajar, akurasi modelnya sekitar **90–95%**, jadi angkanya tetap harus dicek ulang.
- Analisis sensitivitas :: Menguji seberapa besar hasil berubah kalau asumsi diubah

## Demo 3 — Halaman dan flyer dengan Claude Code
- Agen membuat halaman web dan flyer.
Agen bisa diatur agar menulis dengan **brand voice**, yaitu gaya bahasa khas sebuah merek.
Untuk desain antarmuka, dipasang skill bernama **frontend design**.

## Demo 4 — Aplikasi pelacak kalori
Aplikasi ini dibuat dengan Claude Code tanpa menulis satu baris kode pun.
Pengguna mengunggah foto makanan, lalu aplikasi memanggil sebuah **API** untuk mengenali makanannya (misalnya salmon dan kentang) beserta kalorinya.
- API :: Antarmuka yang memungkinkan satu program meminta layanan dari program lain

> Inti pesan: agen AI sangat berguna untuk riset, membuat Excel, PowerPoint, dan aplikasi, tetapi hasilnya tetap perlu diperiksa dan akses sensitif sebaiknya belum diberikan.`,
    questions: [
      { id: 'q-claude-01-a', type: 'tf', prompt: 'Pengajar menyarankan langsung memberi akses kartu kredit ke agen supaya hotel bisa dipesan otomatis.', answer: 'false', explanation: 'Pengajar justru menyarankan untuk belum melakukannya karena teknologinya masih eksperimental.' },
      { id: 'q-claude-01-b', type: 'mc', prompt: 'Pada demo Cowork, bahan apa yang diberikan ke Claude di dalam folder?', options: ['Laporan pasar kondominium (PDF)', 'Spreadsheet arus kas yang sudah jadi', 'Presentasi PowerPoint', 'Daftar hotel dari booking.com'], answer: 'Laporan pasar kondominium (PDF)', explanation: 'Claude membaca PDF itu, riset di web, lalu membangun model keuangan di Excel.' },
      { id: 'q-claude-01-c', type: 'mc', prompt: 'Pada demo pencarian hotel, hasil diminta diurutkan berdasarkan apa?', options: ['Value (nilai terbaik untuk harganya)', 'Harga termurah', 'Jarak terdekat ke stasiun', 'Jumlah ulasan terbanyak'], answer: 'Value (nilai terbaik untuk harganya)', explanation: '' },
      { id: 'q-claude-01-d', type: 'tf', prompt: 'Model keuangan buatan agen tetap perlu dicek ulang karena akurasinya sekitar 90–95%.', answer: 'true', explanation: '' },
      { id: 'q-claude-01-e', type: 'mc', prompt: 'Produk Claude mana yang bekerja langsung di dalam folder komputermu?', options: ['Claude Cowork', 'Claude Chat', 'Claude in Chrome', 'Claude Code'], answer: 'Claude Cowork', explanation: '' },
    ],
  },
];
