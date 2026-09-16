# Kujang Frontend

Admin dashboard untuk manajemen security guard: master data, absensi, cuti, user & permission.

Status: **UI prototype**. Semua data masih di `localStorage` — belum ada backend.

## Menjalankan

```bash
yarn install
yarn dev      # http://localhost:5173
yarn build
yarn lint
```

---

## Tech Stack

| Layer | Pilihan | Versi |
|---|---|---|
| Build tool | Vite (rolldown) | 8.3 |
| UI | React | 19.2 |
| Routing | React Router (`createBrowserRouter`) | 7.18 |
| Styling | Tailwind CSS + `@tailwindcss/vite` | 4.3 |
| Bahasa | JavaScript (JSX), tanpa TypeScript | — |
| Icon | `@iconify/react` | 6.0 |
| Chart | `chart.js` + `react-chartjs-2` | 4.5 / 5.3 |
| Peta | `leaflet` + `react-leaflet` | 1.9 / 5.0 |
| QR | `react-qr-code` | 2.2 |
| Lint | oxlint | 1.81 |
| Data layer | `localStorage` via hook sendiri | — |

Tidak dipakai: state manager (Redux/Zustand), data fetcher (React Query/SWR), component library (MUI/Ant/shadcn), form library (RHF/Formik), test runner.

---

## Arsitektur

### Struktur folder

```
src/
  main.jsx            # entry — RouterProvider
  routes.jsx          # satu array route, semua halaman didaftarkan di sini
  index.css           # @import tailwind + @theme + tooltip CSS
  components/         # dipakai lintas modul
    MultiSelect.jsx   #   dropdown multi-pilih (native <details>/<summary>)
    Pagination.jsx    #   pagination global
    Navbar.jsx  Sidebar.jsx
  constants/
    menus.json        # sumber tunggal menu sidebar + permission tree
  hooks/
    useLocalState.js  # pengganti API
    useSession.js     # session + entity scope
  pages/
    Authentication/
    Dashboard/
      components/     # lokal, hanya untuk Dashboard
    Entity/
    MasterData/
      Client/  Employee/  Host/  Leave/  Level/
      Location/  Position/  Visitor/  WorkShift/
    User/
      master/  role/  permission/
```

### Konvensi

**Dua tingkat komponen.** `src/components/` = dipakai lebih dari satu modul. `src/pages/{Modul}/components/` = milik modul itu saja. Naik ke `src/components/` hanya kalau modul kedua benar-benar memakainya.

**Satu modul = satu folder.** `index.jsx` (list) dan `form.jsx` (modal form) di root folder modul; sisanya di `components/`.

**Kode English, UI Bahasa.** Variabel, nama file, route, dan komentar dalam bahasa Inggris. Hanya teks yang tampil di layar (judul, header tabel, label input, tombol, alert) yang Bahasa Indonesia.

**Komentar `ponytail:`** menandai penyederhanaan yang disengaja dan menyebut jalur upgrade-nya. Contoh: `// ponytail: filtering client-side — pindahkan ke server saat API siap`.

### Data layer

Tidak ada backend. `useLocalState(key, initial)` membaca dari `localStorage`, menulis kembali di setiap perubahan, dan bertindak seperti `useState`.

```js
const [employees, setEmployees] = useLocalState("employees", []);
```

Karena setiap pemanggilan membuat salinan sendiri, **satu key hanya boleh di-mount di satu tempat aktif**. `SCHEMA_VERSION` di `useLocalState.js` menghapus seluruh storage saat dinaikkan — dipakai ketika bentuk data berubah.

### Cross-module options

Modul tidak pernah meng-hardcode data modul lain. Setiap modul pemilik meng-export hook opsi yang sudah tersaring entity scope:

```js
// MasterData/Client/index.jsx
export const useClients = () => { ... };   // → [{value, label}]
```

Dipakai `useClients` (Client), `useLevels` (Level), `usePositions` (Position), `useEmployees` (Employee), `useLeaveTypes` (Leave). Efeknya: dropdown dan label di modul konsumen otomatis ikut scope session, tanpa kode tambahan.

### Entity scope

Setiap baris data membawa array `entities`. Resep yang dipakai seragam di semua modul MasterData:

1. Tidak ada `SEED` — `useLocalState("<key>", [])`
2. `inScope(session, row)` sebagai klausa **pertama** di filter
3. `canSeeEntities` menentukan tampil/tidaknya kolom Entity di tabel
4. `canAssignEntities` menentukan tampil/tidaknya field Entity di form
5. Baris baru mewarisi scope pembuatnya jika kosong
6. `colSpan` menyesuaikan kondisional

`canSeeEntities` bernilai true untuk superuser atau akun yang mencakup lebih dari satu entity — akun satu entity tidak perlu melihat kolom yang isinya selalu sama.

> **Peringatan keamanan.** `session` disimpan di `localStorage` dan bisa diedit siapa pun menjadi `role: "superuser"`. Seluruh gating role, entity, dan flag `locked` di aplikasi ini bersifat **kosmetik, bukan access control**. Password saat ini juga disimpan plaintext. Sebelum produksi: hash password di server, terbitkan token yang ditandatangani, dan lakukan seluruh scoping di query server-side.

---

## Plus / Minus Pilihan Teknologi

### Vite (rolldown) vs Next.js / CRA

- **+** Dev server & HMR instan; full build ~300–450ms untuk 47 file.
- **+** Hanya SPA — tanpa server runtime, deploy cukup static hosting.
- **+** Rolldown (Rust) lebih cepat dari esbuild+Rollup Vite 5.
- **−** Tidak ada SSR/SSG — SEO dan first paint lebih lemah. Untuk dashboard internal di balik login, tidak relevan.
- **−** Tanpa file-based routing, API route, dan image optimization bawaan Next.
- **−** Vite 8 + rolldown masih baru; ekosistem plugin belum setua Vite 5.

### React Router 7 (`createBrowserRouter`) vs file-based routing

- **+** Seluruh route terlihat di satu file (`routes.jsx`) — mudah di-audit.
- **+** Nested layout, loader, dan error boundary tersedia bila nanti dibutuhkan.
- **−** Menambah halaman = dua langkah (buat file + daftarkan route), bukan satu.
- **−** Perlu konfigurasi rewrite di hosting agar deep link tidak 404.

### Tailwind v4 vs CSS Modules / styled-components / component library

- **+** Config di CSS (`@theme`), tanpa `tailwind.config.js`; plugin Vite meniadakan langkah PostCSS.
- **+** Styling menempel di markup — tidak ada file CSS yatim saat komponen dihapus.
- **+** Tanpa runtime CSS-in-JS: tidak ada biaya JS saat render.
- **−** Class panjang membuat JSX ramai; utility yang berulang harus disiplin diekstrak.
- **−** v4 breaking dari v3 — `bg-gradient-to-*` menjadi `bg-linear-to-*`; sebagian tutorial lama tidak berlaku.
- **−** Seluruh Card/Badge/Modal/Table dibuat manual. Konsekuensinya markup lebih panjang, tapi tidak ada kompromi aksesibilitas atau styling yang harus di-override.

### JavaScript vs TypeScript

- **+** Tanpa langkah type-check, iterasi UI lebih cepat.
- **+** Bentuk data belum stabil karena API belum ada — menulis tipe sekarang berarti menulis ulang nanti.
- **−** Tidak ada autocomplete pada bentuk data; salah ketik nama field baru ketahuan saat runtime.
- **−** Refactor lintas modul tidak punya jaring pengaman. Ini biaya paling terasa saat ini.
- **→** Migrasi ke TS layak dilakukan bersamaan dengan integrasi API, saat kontrak data sudah jelas.

### localStorage vs mock server (MSW / json-server)

- **+** Nol dependensi, nol proses tambahan; data bertahan saat refresh.
- **+** Satu hook menggantikan seluruh layer fetch — tidak ada loading/error state yang harus dibuang saat API masuk.
- **−** Tidak ada validasi, relasi, maupun transaksi; delete tidak cascade.
- **−** Satu key di dua komponen = dua salinan yang tidak sinkron.
- **−** Perubahan bentuk data mengharuskan bump `SCHEMA_VERSION`, yang menghapus data lokal pengguna.
- **−** Bentuk request/response tidak teruji sampai backend benar-benar ada.

### Tanpa state manager (Redux/Zustand)

- **+** Modul saling terisolasi; state global hanya session dan entity, keduanya sudah lewat `useLocalState`.
- **+** Satu konsep state yang harus dipahami, bukan dua.
- **−** Dua komponen dengan key sama tidak saling update — harus dihindari lewat konvensi, bukan dicegah oleh tooling.
- **→** Pertimbangkan Zustand kalau nanti state harus dibagi lintas route tanpa remount.

### Tanpa data fetcher (React Query / SWR)

- **+** Belum ada yang perlu di-fetch. Menambah sekarang = konfigurasi tanpa pemakaian.
- **−** Cache, retry, invalidation, dan optimistic update harus dibangun saat API masuk.
- **→** Ini kandidat dependensi pertama begitu backend tersedia; `useLocalState` diganti langsung oleh hook React Query.

### `@iconify/react` vs react-icons / SVG lokal

- **+** Icon diambil per nama saat runtime — bundle tidak tumbuh seiring jumlah icon.
- **+** Satu API untuk seluruh icon set (`fa6-solid:`, `fa6-brands:`, dst).
- **−** Butuh jaringan pada pemakaian pertama; icon tidak muncul saat offline sebelum ter-cache.
- **−** Nama icon salah ketik baru ketahuan di layar.

### MultiSelect sendiri vs react-select

- **+** ~40 baris pakai `<details>/<summary>` native. Tanpa portal, tanpa handler klik-di-luar, tanpa dependensi.
- **+** Keyboard dan screen reader ditangani browser.
- **−** Tidak ada search di dalam dropdown, tidak ada async load, tidak ada virtualisasi.
- **→** Ganti ke react-select kalau daftar opsi melewati ~100 item atau butuh pencarian.

### Tanpa test runner

- **−** Regresi hanya tertangkap oleh build dan pengecekan manual.
- **→** Tambahkan Vitest saat logic non-trivial pindah dari UI ke fungsi murni (aturan approval cuti, perhitungan shift).

---

## Utang Teknis

Terlacak, belum dikerjakan:

- `SCHEMA_VERSION` masih `"2"` — baris lama tanpa field `entities` tidak terlihat oleh non-superuser sampai disimpan ulang.
- **Modul lookup belum tersambung.** Empat modul lookup (`ShiftType`, `LocationType`, `ClientGroup`, `VisitorType`) sudah ada beserta hook opsinya, tapi modul konsumen masih memakai array hardcoded lama:

  | Konsumen | Array | Ganti dengan |
  |---|---|---|
  | `Location/index.jsx` + `form.jsx` | `LOCATION_TYPES` (didefinisikan dua kali) | `useLocationTypes()` |
  | `WorkShift/index.jsx` + `form.jsx` | `SHIFT_TYPES` | `useShiftTypes()` |
  | `Client/form.jsx` | `CLIENT_GROUPS` | `useClientGroups()` |
  | `Visitor/index.jsx` | `CLASS_BADGE` | `useVisitorTypes()` |

  `CLASS_BADGE` perlu keputusan lebih dulu: isinya bukan hanya nama, tapi juga warna badge. Pilihannya menambahkan field warna di lookup, atau memisahkan warna dari data.

  Menyambungkan berarti nilai `value` berubah dari id statis (`"1"`, `"2"`) menjadi `Date.now()` milik baris lookup — baris lama yang menyimpan id statis jadi menampilkan `-`. Lakukan bersamaan dengan bump `SCHEMA_VERSION`.
- Password plaintext dan gating yang bersifat kosmetik — lihat peringatan keamanan di atas.
