# Panduan Konfigurasi & Deployment — Store Location Validation

Dokumen ini menjelaskan langkah lengkap untuk menyiapkan **Google Sheets**, **Google Drive**, **Google Apps Script**, izin akses, dan menghubungkannya dengan frontend **Store Location Validation**.

---

## 1. Persiapan Google Sheets

Pastikan Spreadsheet Anda memiliki **dua sheet** dengan nama dan header kolom persis sebagai berikut (baris ke-1 adalah header):

### Sheet 1: `Validasi Long Lad`

Pastikan header `last_update` tersedia. Apps Script mengisi kolom ini saat validasi berhasil disimpan dengan format `yyyy-MM-dd HH:mm:ss`, menggunakan zona waktu project Apps Script.

| keterangan | distributor_code | customer_id | customer_name | distributor_branch | supervisor | address | city | picture | longitude | latitude | last_update |
|---|---|---|---|---|---|---|---|---|---|---|---|

- `customer_id` digunakan sebagai kunci pencarian baris saat memperbarui hasil validasi.
- Kolom `picture`, `longitude`, `latitude`, dan `last_update` akan diperbarui setiap kali supervisor menyimpan hasil validasi. Kolom data toko lainnya tidak diubah dan baris baru tidak ditambahkan.

### Sheet 2: `Account`
| supervisor | username | password |
|---|---|---|

- Nilai `supervisor` pada sheet `Account` harus sama dengan nilai kolom `supervisor` pada sheet `Validasi Long Lad` (pencocokan mengabaikan spasi berlebih dan huruf besar/kecil).
- Isi sheet `Account` **hanya dibaca oleh Google Apps Script di sisi server** dan tidak pernah dikirim ke frontend.

Catat **Spreadsheet ID** dari URL spreadsheet Anda:
`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

---

## 2. Persiapan Folder Google Drive

1. Buka Google Drive dan buat folder khusus, misalnya **Store Location Validation Photos**.
2. Buka folder tersebut dan salin **Folder ID** dari URL:
   `https://drive.google.com/drive/folders/<DRIVE_FOLDER_ID>`
3. Pastikan akun Google yang menjalankan (deploy) Google Apps Script memiliki akses **Editor** pada folder Drive dan Spreadsheet tersebut.

---

## 3. Konfigurasi Google Apps Script (Backend)

1. Dari Spreadsheet Anda, klik **Extensions → Apps Script** (atau buat proyek baru di [script.google.com](https://script.google.com)).
2. Hapus kode bawaan di `Code.gs`, lalu salin seluruh isi file `apps-script/Code.gs` dari proyek ini ke editor Apps Script.
3. Simpan proyek (`Ctrl + S` / `Cmd + S`) dan beri nama misalnya **Store Location Validation API**.
4. Buka **Project Settings** (ikon gerigi di sisi kiri) → bagian **Script Properties** → klik **Add script property** dan tambahkan:
   - `SPREADSHEET_ID` = `<ID Spreadsheet Anda>` *(wajib jika standalone; opsional jika script terikat ke Spreadsheet)*
   - `DRIVE_FOLDER_ID` = `<ID Folder Google Drive tujuan foto>` *(wajib)*
   - `TOKEN_SECRET` = `<string acak panjang minimal 32 karakter, misalnya hasil random generator>` *(wajib)*

---

## 4. Izin Akses & Deployment Web App

1. Di editor Apps Script, klik tombol **Deploy → New deployment**.
2. Klik ikon gerigi di samping *Select type* dan pilih **Web app**.
3. Isi konfigurasi berikut:
   - **Description**: `v1 - Store Location Validation`
   - **Execute as**: **Me** (akun pemilik script yang memiliki izin edit Spreadsheet & Google Drive)
   - **Who has access**: **Anyone** *(wajib `Anyone` agar browser HP supervisor dapat mengirim permintaan POST; autentikasi tetap dijaga ketat oleh backend melalui akun sheet `Account` dan token sesi bertanda tangan HMAC)*
4. Klik **Deploy**.
5. Saat diminta **Authorize access**:
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced → Go to Store Location Validation API (unsafe) → Allow**.
   - Script akan meminta izin akses Google Sheets dan Google Drive sesuai kebutuhan aplikasi.
6. Salin **Web app URL** yang berakhiran `/exec`, contoh:
   `https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec`

> **Catatan pembaruan script**: Jika di kemudian hari Anda mengubah `Code.gs`, deploy ulang melalui **Deploy → Manage deployments → Edit (ikon pensil) → Version: New version → Deploy** agar URL `/exec` tetap sama.

---

## 5. Menghubungkan Frontend ke Google Apps Script

Konfigurasi endpoint disimpan terpisah di `src/config/endpoint.ts`. Anda dapat menggantinya dengan salah satu cara berikut:

### Cara A (Disarankan — melalui Environment Variable)
Buat file `.env` (atau atur di dashboard hosting seperti Vercel / Netlify / Cloud Run):
```env
VITE_GAS_ENDPOINT_URL="https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec"
```

### Cara B (Langsung di file konfigurasi)
Ubah nilai `DEFAULT_GAS_ENDPOINT_URL` di `src/config/endpoint.ts`:
```ts
const DEFAULT_GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec';
```

### Build & Deploy Frontend
```bash
npm install
npm run build
```
Folder `dist/` berisi aplikasi frontend statis yang siap dideploy ke hosting HTTPS apa pun (Vercel, Netlify, Firebase Hosting, atau Cloudflare Pages).

> **Penting (HTTPS Wajib untuk Kamera & GPS)**: Browser HP modern **hanya mengizinkan akses kamera (`getUserMedia`) dan GPS (`geolocation`) melalui HTTPS** (atau `localhost` saat pengembangan). Pastikan domain produksi selalu menggunakan HTTPS.
