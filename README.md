# BRIN Environmental Observatory — AQMS Dashboard

Dashboard pemantauan kualitas udara dan kondisi lingkungan berbasis sensor dan IoT. Proyek ini menyajikan data pengukuran dalam satu antarmuka untuk memantau kondisi terkini, membaca tren, menelusuri histori, dan menyiapkan data untuk analisis riset. Website menampilkan kolaborasi BRIN × Universitas Sriwijaya.

🔗 **Demo:** https://arc.ilkom.unsri.ac.id/aqms_ng

## Fitur

- **Dashboard:** memilih alat atau titik pengamatan untuk melihat data pengukuran.
- **Analisis:** grafik tren, pilihan rentang waktu, parameter yang dapat dipilih, serta ringkasan rata-rata, nilai minimum, dan maksimum.
- **Histori:** tabel rekaman sensor dengan filter tanggal, navigasi halaman, dan opsi ekspor CSV, Excel, serta cetak/PDF ketika data tersedia.
- **Perangkat:** ilustrasi komponen alat dan dokumentasi referensi koneksi perangkat.
- **Tentang & Tim:** penjelasan alur pemantauan dan profil tim riset.
- **Pembaruan data:** halaman data menyediakan pembaruan manual dan indikator pembaruan otomatis setiap 10 detik.

## Parameter yang ditampilkan

| Parameter | Satuan yang ditampilkan |
| --- | --- |
| Kecepatan angin | m/s |
| Suhu udara | °C |
| Tekanan udara | hPa |
| VOC | kΩ |
| Karbon monoksida (CO) | ppm |
| Karbon dioksida (CO₂) | ppm |
| Amonia (NH₃) | ppm |
| Partikel debu | ppm |

## Alur sistem

1. Sensor membaca parameter udara dan lingkungan pada stasiun pemantauan.
2. Perangkat mengirimkan hasil pembacaan ke sistem penyimpanan.
3. Dashboard mengambil data dari API secara berkala dan menampilkan pengukuran serta tren.
4. Pengguna dapat menelusuri, memfilter, dan mengekspor rekaman yang tersedia.

## Cara menggunakan demo

1. Buka tautan demo di atas.
2. Pilih alat pada **Dashboard** atau pemilih alat di **Analisis** jika ada alat yang tersedia.
3. Buka **Analisis** untuk memilih rentang waktu dan parameter grafik.
4. Buka **Histori** untuk memfilter tanggal dan mengekspor rekaman yang sudah dimuat.

Tampilan data bergantung pada ketersediaan alat, koneksi API, dan rekaman sensor. Ketika belum ada data, grafik serta opsi ekspor akan menampilkan keadaan kosong atau tidak aktif.

## Catatan pembacaan

Dashboard menampilkan keluaran sensor untuk keperluan pemantauan dan penelitian; kategori kualitas udara bukan penetapan resmi ISPU/AQI. Nilai VOC yang ditampilkan dalam kΩ adalah resistansi sensor, bukan konsentrasi VOC. Interpretasi data perlu mempertimbangkan kalibrasi, satuan, dan validasi perangkat yang digunakan.

## Pengembangan lokal

Langkah instalasi, perintah menjalankan proyek, dan konfigurasi API perlu disesuaikan dengan source code yang diunggah ke repositori. Jangan unggah kredensial atau file `.env` yang berisi rahasia.

## Kredit

Proyek ditampilkan sebagai kolaborasi riset **BRIN × Universitas Sriwijaya**. Pengembangan antarmuka: **Yasyir Masy'al** (Frontend Developer). Informasi anggota dan pembimbing lainnya tersedia di halaman **Tim** pada demo.
