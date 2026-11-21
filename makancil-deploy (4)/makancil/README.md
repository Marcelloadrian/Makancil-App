# Makancil Demo (3 aplikasi terpisah)

```
index.html            halaman pilih aplikasi
client/               aplikasi pelanggan  (index.html + app.jsx)
staff/                KDS / worker        (index.html + app.jsx)
owner/                dashboard bos       (index.html + app.jsx)
shared/
  core.jsx            konstanta, ikon, data seed, store localStorage, aksi staff
  floor.jsx           denah lantai 2D (dipakai client + staff)
  header.jsx          header navigasi + fungsi mount()
  style.css, tailwind.config.js
```

Tanpa build step. React, Tailwind dan Babel dimuat dari CDN, jadi perlu internet.

## Jalankan lokal
File .jsx dimuat lewat HTTP, jadi jangan klik dua kali index.html. Pakai:
`npx serve .` lalu buka http://localhost:3000

## Deploy ke Vercel
`vercel --prod` di folder ini (Framework: Other, tanpa build command, output directory `.`),
atau push ke GitHub lalu import di dashboard Vercel.
URL: `/client/`, `/staff/`, `/owner/`

## Catatan
- Data disimpan di localStorage (`makancil_master_state`), jadi sinkron antar tab di browser/perangkat yang sama.
  Untuk sinkron antar perangkat butuh backend (mis. Supabase/Firebase).
- Akun demo client: rina@makancil.id / demo1234

## Foto menu
Cara paling gampang: taruh file di `shared/img/` dengan nama seperti di `shared/img/README.txt`
(mis. `espresso.jpg`, `es-kopi-susu.jpg`). Langsung muncul di client; kalau file tidak ada, pakai emoji.
Path default dibuat di `MENU` (`shared/core.jsx`, baris `img:`), bisa diganti ke URL lain.
Owner juga bisa upload foto / tempel URL per menu di Owner > Menu (disimpan di browser itu saja).
