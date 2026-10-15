# Menjalankan Bot ELVRAEN di Termux

Panduan ini membawa Anda dari nol sampai bot menjawab `.ping`. Bot starter ada di
`Example/elvraen-bot.ts`; semua helper tersedia lewat `sock.elvraen` (lihat `ELVRAEN-API.md`).

> **Status verifikasi:** langkah di bawah belum diuji penyusunnya di perangkat Android/Termux.
> Yang sudah diperiksa hanya kode dan tipenya. Jika ada langkah yang gagal, salin **pesan error-nya saja**
> (jangan pernah kode pairing atau isi folder sesi).

## 1. Instalasi (sekali saja)

```sh
pkg update -y && pkg upgrade -y
pkg install -y nodejs git
node -v        # harus v20 atau lebih baru

git clone -b elvraen https://github.com/dikzXdarknes/elvraen-baileys.git
cd elvraen-baileys
corepack enable
yarn install
```

- Proyek ini menetapkan Yarn 4 (`packageManager: yarn@4.9.2`). `corepack enable` mengaktifkannya.
  Jika `corepack` tidak tersedia di Termux Anda, pakai `npm install` sebagai gantinya
  (npm mengabaikan blok `resolutions`, yang hanya mengunci versi paket turunan untuk keamanan).
- `yarn install` ikut menjalankan build TypeScript (`prepare`), jadi bisa memakan waktu beberapa menit di HP.

## 2. Menjalankan bot

```sh
yarn start
```

(`npm run start` jika memakai npm.) Pertama kali, bot menanyakan nomor WhatsApp yang akan dipasangkan:
kode negara tanpa `+`, misalnya `62812xxxxxxx`. Awalan `08` otomatis diubah menjadi `628`.
Anda juga bisa melewati pertanyaan itu: `ELVRAEN_PHONE=62812xxxxxxx yarn start`.

Lalu di WhatsApp: **Pengaturan → Perangkat tertaut → Tautkan perangkat → Tautkan dengan nomor telepon**,
dan ketik kode 8 karakter yang tampil di terminal. Kode hanya Anda ketik di HP; tidak perlu dikirim ke siapa pun,
termasuk ke asisten AI.

Setelah pairing, WhatsApp memutus koneksi satu kali; bot menyambung ulang sendiri dan mencatat
`ELVRAEN Baileys tersambung ke WhatsApp`. Kirim `.ping` dari nomor lain ke nomor bot untuk mengetes.
Perintah bawaan: `.ping`, `.menu`, `.id`.

Menghentikan bot: tekan `Ctrl+C`.

Agar Android tidak mematikan proses saat layar mati, jalankan `termux-wake-lock` sebelum `yarn start`
(dan atur baterai Termux ke "tidak dibatasi" di pengaturan Android).

## 3. Sesi dan keamanan

- Sesi tersimpan di `elvraen_auth/` (ubah dengan `ELVRAEN_AUTH_DIR`). Folder ini berisi kunci login akun Anda:
  **jangan di-commit, jangan di-zip lalu dikirim, jangan dibagikan.** `.gitignore` sudah mengabaikan
  `elvraen_auth/`, `auth_info/`, `session/`, `sessions/`, dan `*_auth/`.
- Jika WhatsApp mengeluarkan perangkat ini (logout), bot berhenti dan **tidak** menghapus sesi sendiri.
  Untuk menautkan ulang, hapus folder sesi secara manual lalu jalankan lagi.
- `useMultiFileAuthState` cocok untuk bot kecil; untuk beban besar, simpan sesi di database.

## 4. Perilaku koneksi

| Situasi | Yang dilakukan bot |
| --- | --- |
| Koneksi putus biasa | Menyambung ulang dengan jeda 2, 4, 8, 16, lalu maks. 30 detik |
| Setelah pairing (`restartRequired`) | Menyambung ulang otomatis |
| Logout (401) | Berhenti dan menjelaskan cara menautkan ulang |
| Ditolak (403) / `multideviceMismatch` (411) | Berhenti |
| `Ctrl+C` / `SIGTERM` | Menutup koneksi lalu keluar |

Error saat memproses satu perintah dicatat di log dan tidak menghentikan bot.

## 5. Memakai socket di bot sendiri

```ts
import makeWASocket, { useMultiFileAuthState } from './src' // atau 'elvraen-baileys' bila terpasang sebagai paket

const { state, saveCreds } = await useMultiFileAuthState('./elvraen_auth')
const sock = makeWASocket({ auth: state })
sock.ev.on('creds.update', saveCreds)

sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return
  for (const message of messages) {
    const jid = message.key.remoteJid
    const text = message.message?.conversation ?? message.message?.extendedTextMessage?.text
    if (!jid || message.key.fromMe || text?.trim() !== '.ping') continue
    await sock.elvraen.sendReply(jid, 'Pong!', message)
  }
})
```

Kode di atas hanya menunjukkan pemakaian helper. Agar tersambung ulang dan pairing berjalan benar, salin pola
`connection.update` dari `Example/elvraen-bot.ts`. Satu hal penting: `requestPairingCode()` **harus** dipanggil setelah event
`qr` muncul, bukan langsung setelah `makeWASocket()`, karena sebelum itu WebSocket belum terbuka dan
panggilannya gagal dengan `Connection Closed`.

## 6. Pemeriksaan

```sh
yarn typecheck           # tipe seluruh sumber
yarn typecheck:example   # tipe starter bot
yarn build               # kompilasi ke lib/
yarn test                # tes unit (Jest)
```

Tes unit memeriksa bahwa setiap helper meneruskan argumen yang benar dan bahwa payload-nya diterima generator
pesan Baileys. Tes itu **tidak** membuktikan pesan terkirim atau tampil di semua versi WhatsApp.

## 7. Batasan yang perlu diketahui

- Pesan interaktif (`sendButtons`, `sendList`, `sendCTA`, `sendCarousel`, `sendTemplate`, `sendInteractive`,
  `sendNativeFlow`) hanya membentuk payload protobuf. Kode pengirim Baileys di repo ini tidak menambahkan node
  `biz` khusus, dan WhatsApp sering tidak menampilkan format ini di akun biasa. Uji langsung di akun dan versi WhatsApp Anda
  sebelum mengandalkannya; saya tidak bisa menguji pengiriman nyata dari lingkungan pengembangan ini.
- `sendVoice()` dan `sendVideoNote()` hanya memberi penanda `ptt` / `ptv`; format audio/video tidak dikonversi.
- Helper tidak melewati aturan atau privasi WhatsApp dan tidak mencegah pembatasan akun. Pakai dengan wajar.
