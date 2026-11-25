# BRIN Monitoring — API Ready

Frontend React + Vite dengan data dan administrasi alat dari API BRIN NG v2.
Framer Motion digunakan untuk transisi halaman, masuknya kartu perangkat,
visual jaringan sensor, grafik interaktif, dan halaman login. Aset
foto/dokumentasi asli dipertahankan.

Navigasi publik berisi menu utama saja. Ringkasan tidak menjadi menu terpisah:
buka **Dashboard**, lalu klik kartu alat untuk masuk ke **Ringkasan alat**.

## Jalankan di lokal

Node.js **22.12 atau lebih baru** diperlukan oleh toolchain Vite ini.

```bash
npm ci
npm run dev
```

Buka URL lokal yang ditampilkan terminal (biasanya http://localhost:5173).
File `.env` sudah berisi konfigurasi publik untuk API:

```env
VITE_API_BASE_URL=https://brin-api.unsri-fasilkom.cloud
VITE_BASE_PATH=/
VITE_POLL_INTERVAL=10000
VITE_SENSOR_LIMIT=500
VITE_HISTORY_MAX_ROWS=10000
VITE_STALE_MINUTES=15
VITE_API_TIMEZONE=UTC
VITE_VOC_MODE=resistance
VITE_DUST_FIELD=dust_ppm
VITE_DUST_UNIT=ppm
```

VITE_API_BASE_URL adalah URL dasar backend, **bukan endpoint sensor**.
Tidak perlu backend lokal, MySQL lokal, atau MQTT di frontend.
Perubahan `.env` saat development memerlukan restart `npm run dev`.
Semua variabel VITE_ menjadi konfigurasi publik browser: jangan memasukkan
password database, password admin, atau token rahasia di dalamnya.

## Akses login secara manual

- Dashboard publik: http://localhost:5173/
- Halaman login: http://localhost:5173/login
- Pengelolaan alat: http://localhost:5173/admin

Tidak ada tombol/link login pada dashboard publik. Setelah berhasil login,
admin diarahkan ke /admin. Dashboard hanya menampilkan shortcut ruang admin
jika sesi sudah terverifikasi. /admin tanpa sesi akan diarahkan ke /login.
Akun dibuat menggunakan script create-admin pada paket backend; tidak ada
username/password demo atau bypass login di frontend.

Login POST ke /api/auth/login. Token Bearer disimpan di sessionStorage per
backend (bertahan selama sesi tab), diverifikasi melalui /api/auth/me dan
hapus saat logout/401. Password tidak disimpan. Backend tetap harus
menegakkan autentikasi; menyembunyikan tombol bukan pembatas akses server.

## Backend yang diperlukan

Gunakan paket **BRIN-API-Upgrade** yang dibuat pada percakapan ini. Endpoint:

| Method | Endpoint | Penggunaan |
|---|---|---|
| GET | /api/devices | Daftar alat aktif untuk dashboard publik |
| GET | /api/sensor-data?device_id=1&page=1&limit=500 | Data sensor per alat |
| GET | /api/auth/me | Memverifikasi sesi admin |
| POST | /api/auth/login | username/password; data.token dan data.user |
| POST | /api/auth/logout | Mencabut token sesi |
| GET | /api/admin/devices | Daftar lengkap alat untuk admin |
| POST | /api/admin/devices | Tambah nama_alat, mqtt_topic, is_active |
| PATCH | /api/admin/devices/:id | Edit alat |
| DELETE | /api/admin/devices/:id | Nonaktifkan alat; histori dipertahankan |

Daftar dan CRUD tidak lagi disimpan di localStorage. Tidak ada fallback alat
lokal yang terlihat seperti daftar server. Jika backend lama belum menyediakan
/api/devices, dashboard menampilkan error dan tombol coba lagi. Selesaikan
migrasi backend terlebih dahulu agar login dan pengelolaan perangkat bekerja.
Untuk CORS backend, izinkan origin localhost:5173 dan domain frontend production,
atau gunakan konfigurasi CORS publik yang sudah tersedia di backend v2.

## Menambahkan alat kedua

1. Buka /login dan masuk memakai akun backend.
2. Form /admin: isi nama alat dan topik MQTT, contoh msi/device2.
3. ID perangkat dibuat server dan ditampilkan pada daftar perangkat.
4. Konfigurasi alat fisik agar publish ke topik tersebut. Jika mengirim
   device_id, gunakan ID dari server. Subscriber v2 menentukan alat dari topik.
5. Subscriber sinkron setiap 5 detik; dashboard publik memperbarui daftar
   perangkat tiap 30 detik atau saat halaman dimuat ulang.

Tidak ada field gambar CRUD karena backend v2 saat ini tidak menyediakan
penyimpanan gambar per alat. Gambar perangkat default tetap menggunakan aset
frontend. Jika backend menambahkan image_url, normalisasi daftar sudah siap
membacanya. Nama/topik/ID tetap mengikuti backend.

## Histori, ekspor dan waktu

- Polling memperbarui data terbaru tiap 10 detik; request berhenti saat tab
  tersembunyi. Pergantian alat membatalkan request sebelumnya agar data tidak
  tercampur.
- Awalnya memuat 500 baris terbaru. Pada Histori, gunakan **Muat data lebih lama**
  untuk mengambil halaman API berikutnya. Pagination tabel berisi 12 baris/page.
- Filter tanggal/grafik/CSV/Excel/cetak mencakup **rekaman yang sudah dimuat**;
  penghitung menunjukkan jumlah dimuat dibandingkan total server. Default
  batas memori 10.000 baris, dapat diatur VITE_HISTORY_MAX_ROWS. Tidak ada klaim
  bahwa seluruh database sudah diekspor saat baru sebagian halaman dimuat.
- Timestamp MySQL tanpa zona waktu dianggap UTC, sesuai subscriber v2, lalu
  ditampilkan WIB. Jika database lama benar-benar memakai WIB, atur
  VITE_API_TIMEZONE=Asia/Jakarta. Timestamp ISO dengan Z/offset tetap dihormati.
- Resistansi gas kΩ tidak dikonversi menjadi VOC ppm/AQI. Unit debu default
  mengikuti dust_ppm backend. Mengubah label satuan tidak mengkonversi nilai.
- Mode demo eksplisit tetap tersedia pada halaman sensor; tidak mengganti
  respons API gagal secara otomatis.

## Pindah ke VPS / hosting lain

Frontend statis ini bisa dihosting di VPS, Netlify, Vercel, atau hosting statis
lain yang mendukung fallback SPA. Backend boleh tetap di VPS yang sekarang.

1. Ubah `.env` atau buat `.env.production` bila URL API production berbeda.
   Bila tetap memakai API yang sama, VITE_API_BASE_URL tidak perlu diganti.
2. Untuk hosting root, VITE_BASE_PATH=/. Untuk subfolder, misalnya
   VITE_BASE_PATH=/monitoring/. Jangan memakai base ./ untuk route login manual.
3. Jalankan:

```bash
npm run build
```

4. Upload **isi folder dist** sebagai web statis. `.env` dibaca saat build;
   mengedit `.env` di samping dist tidak mengganti konfigurasi bundle yang
   sudah dibuat. Jika env berubah, build ulang dan upload dist baru.
5. Konfigurasi fallback SPA agar membuka /login langsung atau reload /admin
   tidak menghasilkan 404. Contoh Nginx untuk hosting root:

```nginx
server {
    listen 80;
    server_name DOMAIN_FRONTEND_KAMU;
    root /var/www/brin-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Jika frontend ditempatkan di subfolder /monitoring/, fallback harus menuju
/monitoring/index.html dan base build /monitoring/. Konfigurasi root/aset harus
sesuai lokasi file. Domain API tetap konfigurasi terpisah, proxy ke backend 2332.
Login production menjadi https://DOMAIN_FRONTEND/login, bukan domain API.
Tambahkan HTTPS pada hosting production.

## Aset dan animasi

Gambar alat, blueprint, wiring, dan tim menggunakan BASE_URL sehingga path
sesuai hosting root/subfolder. Opsi tambahan:

```env
VITE_DEVICE_IMAGE=assets/aqms-device.svg
VITE_BLUEPRINT_IMAGE=assets/Blueprint.png
VITE_WIRING_IMAGE=assets/wiring.jpeg
```

URL HTTPS eksternal juga didukung. Animasi menggunakan transform/opacity,
jumlah orbit tetap, dan menghormati prefers-reduced-motion. Tombol jeda
animasi dashboard menghentikan visual jaringan dan animasi CSS sensor.
Status "Terdaftar" pada kartu alat adalah registrasi alat, bukan klaim bahwa
perangkat sedang online; kondisi koneksi/data tampil pada detail alat.

## Pemeriksaan pengembangan

```bash
npm run lint
npm run build
```

Pengujian browser memakai respons API tiruan, bukan menulis data ke VPS:

```bash
npx playwright install chromium
npm run test:e2e
```

Menguji login gagal/berhasil, proteksi admin, tambah/edit/nonaktifkan perangkat,
logout, perpindahan alat, pagination API dan tabel, serta layout mobile dengan
reduced-motion. Screenshot test hanya file lokal pengujian, tidak disertakan
dalam paket distribusi. Integrasi akun/perangkat asli perlu diuji setelah
backend upgrade selesai dipasang.

## Hasil verifikasi paket ini

- ESLint dan build production berhasil.
- Tiga skenario browser di atas berhasil menggunakan respons API tiruan.
- Smoke test subfolder /monitoring/ berhasil: daftar alat, akses langsung login,
  dan aset gambar perangkat.
- Layout desktop, mobile, login, dan admin diperiksa secara visual.
- Belum mengubah atau menguji CRUD terhadap data/akun asli di VPS pengguna.
