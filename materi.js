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
  {
    id: 'catatan-claude-02',
    course: { id: 'mk-claude-ai', code: '', name: 'Claude Masterclass (AI)', semester: 'Belajar mandiri', color: '#b83b7a' },
    title: 'Outline 8 modul Claude Masterclass',
    content: `Ringkasan video kerangka kursus. Outline lengkapnya tersedia sebagai file Excel di paket kursus. Setiap modul punya banyak latihan, jadi belajarnya sambil praktik.

## Modul 1 — Pengantar
- Tips sukses mengikuti kursus.
- Demo singkat Claude Code dan Claude Cowork.

## Modul 2 — Claude Cowork
- Bekerja langsung di folder komputer: membuat file Excel, presentasi PowerPoint, dan melakukan riset.
- Mengenal skills, plugin, dan MCP.
- Memakai plugin siap pakai untuk bidang finance, marketing, dan legal.
Plugin siap pakai itu dibuat oleh **Anthropic**, perusahaan pembuat Claude.
Salah satu plugin dipakai untuk **financial forecasting** (peramalan keuangan).
- Membuat plugin sendiri.
- Multitasking: agen melakukan deep research, menggabungkan hasil, lalu membuat PowerPoint dan PDF.

## Modul 3 — Claude Chat
- Prompt engineering dan tips menyusun prompt yang baik.
- Memakai Claude untuk membuat konten, menghasilkan kode, mempelajari topik baru, mengenali gambar, dan memecahkan masalah.
Claude juga dipakai sebagai **planning partner** untuk coding, belajar, dan menulis.

## Modul 4 — Claude di Excel
- Memasang Claude di Excel dan mencari insight dari data.
- Visualisasi data, sorting, dan filtering.
Modul ini juga membahas cara menangani **missing values** (data yang kosong).
- Membangun model keuangan lanjutan langsung di Excel.

## Modul 5 — Claude di PowerPoint
- Membuat presentasi, mengubah judul, menambah gambar, dan brainstorming.
- Merangkum presentasi yang sudah ada.
Kualitas presentasi Claude dibandingkan dengan **Microsoft Copilot** dan Google NotebookLM, lengkap dengan kelebihan dan kekurangannya.

## Modul 6 — Dasar Claude Code
Ini modul favorit pengajar.
Kita tidak perlu bisa coding, karena tugas kita hanya **mengelola tim agen AI** dengan bahasa sehari-hari, sementara agennya yang menulis kode.
- Memasang Claude Code dan memahami tiga mode kerja: plan mode, auto-accept, dan normal mode.
- Membuat landing page, lalu memasang skill frontend design agar desainnya lebih kuat.
- Membuat slash command sendiri dan menjalankan yang sudah ada.
- Plugin populer: code review, feature dev, dan Ralph Wiggum.
- Analisis pesaing dan menyusun strategi pemasaran dengan plugin.

## Modul 7 — Membangun aplikasi
Proyeknya adalah aplikasi **pelacak kalori** yang dibuat tanpa menulis satu baris kode pun.
- Desain aplikasinya kemudian diperbaiki dengan skill frontend design.

## Modul 8 — Membangun AI agent
- Tujuannya mengotomatiskan sebagian pekerjaan atau bisnis.
- Mengenal framework agen, multi-agent, dan sub-agent.
- Membuat agen yang punya tools dan memori, lalu membentuk tim agen.

## Istilah penting
- MCP :: Model Context Protocol, standar terbuka untuk menghubungkan Claude ke alat dan sumber data lain
- Plugin :: Paket siap pakai yang menggabungkan skills, perintah, dan koneksi untuk bidang tertentu
- Plan mode :: Mode Claude Code yang menyusun rencana dulu sebelum mengubah apa pun
- Auto-accept :: Mode Claude Code yang langsung menerapkan perubahan tanpa meminta persetujuan di setiap langkah
- Normal mode :: Mode Claude Code yang meminta persetujuan sebelum melakukan perubahan
- Slash command :: Perintah singkat berawalan garis miring (/) untuk menjalankan alur kerja tersimpan
- Sub-agent :: Agen pembantu yang diberi tugas khusus oleh agen utama
- Multi-agent :: Beberapa agen AI yang bekerja sama menyelesaikan satu tugas`,
    questions: [
      { id: 'q-claude-02-a', type: 'mc', prompt: 'Modul mana yang membahas penggunaan Claude di dalam Excel?', options: ['Modul 4', 'Modul 3', 'Modul 5', 'Modul 2'], answer: 'Modul 4', explanation: 'Modul 4: insight data, visualisasi, sorting/filtering, missing values, dan model keuangan.' },
      { id: 'q-claude-02-b', type: 'mc', prompt: 'Di Modul 5, kualitas presentasi Claude dibandingkan dengan alat apa?', options: ['Microsoft Copilot dan Google NotebookLM', 'ChatGPT dan Gemini', 'Canva dan Figma', 'Keynote dan Google Slides'], answer: 'Microsoft Copilot dan Google NotebookLM', explanation: '' },
      { id: 'q-claude-02-c', type: 'tf', prompt: 'Untuk mengikuti modul Claude Code, kita harus sudah bisa menulis kode.', answer: 'false', explanation: 'Tidak perlu. Kita cukup mengarahkan agen dengan bahasa sehari-hari, agen yang menulis kodenya.' },
      { id: 'q-claude-02-d', type: 'mc', prompt: 'Modul mana yang disebut pengajar sebagai modul favoritnya?', options: ['Modul 6 — Dasar Claude Code', 'Modul 2 — Claude Cowork', 'Modul 8 — Membangun AI agent', 'Modul 4 — Claude di Excel'], answer: 'Modul 6 — Dasar Claude Code', explanation: '' },
      { id: 'q-claude-02-e', type: 'tf', prompt: 'Plugin siap pakai untuk finance, marketing, dan legal dibuat oleh Anthropic.', answer: 'true', explanation: 'Anthropic adalah perusahaan yang membuat Claude.' },
      { id: 'q-claude-02-f', type: 'mc', prompt: 'Apa urutan fokus Modul 2 sampai 5?', options: ['Cowork → Chat → Excel → PowerPoint', 'Chat → Cowork → PowerPoint → Excel', 'Cowork → Excel → Chat → PowerPoint', 'Claude Code → Chat → Excel → PowerPoint'], answer: 'Cowork → Chat → Excel → PowerPoint', explanation: '' },
    ],
  },
  {
    id: 'catatan-claude-03',
    course: { id: 'mk-claude-ai', code: '', name: 'Claude Masterclass (AI)', semester: 'Belajar mandiri', color: '#b83b7a' },
    title: 'Analogi cepat (ramah ADHD): Claude & AI agent',
    content: `Versi singkat dan visual dari dua catatan sebelumnya. Satu istilah, satu gambaran.

> Cara pakai: baca satu bagian saja (paling lama 3 menit), lalu langsung buka Flashcard 5 soal. Selesai, istirahat, ulangi bagian berikutnya.

## Empat produk Claude
- Claude Chat :: Teman pintar di WhatsApp: kamu tanya, dia jawab, tapi dia tidak bisa menyentuh barang-barangmu
- Claude Cowork :: Asisten yang kamu beri kunci meja belajarmu: dia buka map, baca PDF, dan bikin file Excel langsung di situ
- Claude Code :: Mandor bersama tim tukangnya: kamu cukup bilang mau rumah seperti apa, mereka yang memasang bata (kodenya)
- Claude in Chrome :: Kurir ojol yang kamu suruh belanja: dia yang jalan ke toko online, kamu tinggal terima hasilnya

## Cara kerja agen
- AI agent :: Sopir yang menyetir sampai tujuan, sedangkan chatbot biasa cuma Google Maps yang memberi rute
- Subtask :: Resep nasi goreng: tugas besar dipecah jadi iris bawang, panaskan minyak, masukkan nasi
- Screenshot :: Main game sambil melihat layar: bertindak, lihat hasilnya, lalu koreksi langkah berikutnya
- Prompt :: Pesanan di warung: makin detail (pedas level 3, telur setengah matang, tanpa acar), makin pas hasilnya
- Skills :: Aplikasi di HP: agen memasang kemampuan baca PDF atau bikin Excel sesuai kebutuhan
- API :: Pelayan restoran: aplikasi memesan lewat pelayan, dapur (program lain) memasak, pelayan membawa hasilnya kembali

Trik **subtask** juga ampuh untuk otak ADHD: kalau tugas terasa terlalu besar, pecah sampai langkah pertamanya terasa gampang.

## Alat-alat lanjutan
- Plugin :: Starter pack: satu paket berisi beberapa skills dan perintah untuk satu bidang, misalnya finance
- MCP :: Colokan USB universal: satu bentuk colokan supaya Claude bisa tersambung ke banyak alat
- Slash command :: Tombol speed dial: satu ketukan untuk menjalankan alur kerja yang sudah disimpan
- Plan mode :: Menggambar denah dulu sebelum membangun rumah
- Normal mode :: Tukang yang selalu bertanya "boleh saya bongkar tembok ini?" sebelum bertindak
- Auto-accept :: Menitipkan kunci rumah ke tukang lalu kamu pergi ngopi
- Sub-agent :: Anggota kelompok yang diberi bagian khusus oleh ketua kelompok
- Multi-agent :: Panitia acara kampus: divisi acara, konsumsi, dan humas bekerja bareng untuk satu acara

## Dua hal yang wajib diingat
Akurasi 90–95% itu seperti **GPS**: sangat membantu, tapi kamu tetap harus melihat jalan.
Memberi kartu kredit ke agen sekarang ibarat memberi **PIN ATM** ke anak magang di minggu pertamanya.
- Analisis sensitivitas :: Menggeser slider di game: kalau harga naik 10%, untungnya jadi berapa?
- Brand voice :: Gaya chat-mu ke teman berbeda dengan gaya chat-mu ke dosen`,
    questions: [
      { id: 'q-claude-03-a', type: 'mc', prompt: 'Chatbot biasa itu seperti Google Maps yang memberi rute. Kalau AI agent seperti apa?', options: ['Sopir yang menyetir sampai tujuan', 'Peta kertas', 'Rambu lalu lintas', 'Polisi yang mengatur jalan'], answer: 'Sopir yang menyetir sampai tujuan', explanation: 'Agen tidak hanya memberi tahu caranya, tetapi ikut mengerjakan sampai selesai.' },
      { id: 'q-claude-03-b', type: 'mc', prompt: 'Mode Claude Code mana yang seperti "menitipkan kunci rumah ke tukang lalu pergi ngopi"?', options: ['Auto-accept', 'Plan mode', 'Normal mode', 'Slash command'], answer: 'Auto-accept', explanation: 'Perubahan langsung diterapkan tanpa minta persetujuan di setiap langkah.' },
      { id: 'q-claude-03-c', type: 'tf', prompt: 'MCP bisa dibayangkan seperti colokan USB universal untuk menyambungkan Claude ke banyak alat.', answer: 'true', explanation: '' },
    ],
  },
];
