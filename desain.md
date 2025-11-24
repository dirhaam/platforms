# 🎨 Sneat Admin - Design System & UI Documentation

Dokumentasi ini mencakup panduan gaya (style guide) untuk pengembangan antarmuka pengguna (UI) pada aplikasi TenantAdmin CMS. Desain ini didasarkan pada tema **Sneat Admin** yang modern, bersih, dan *card-based*.

---

## 1. 🌈 Color Palette (Warna)

Aplikasi menggunakan skema warna yang lembut dengan warna *Primary* Ungu (#696cff). Definisi warna diatur dalam konfigurasi Tailwind di `index.html`.

### Brand Colors
| Role | Class Tailwind | Hex Code | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Primary** | `text-primary`, `bg-primary` | `#696cff` | Tombol utama, link aktif, highlight, chart utama. |
| **Primary Light** | `bg-primary-light` | `#e7e7ff` | Background state aktif pada sidebar, badge background. |
| **Secondary** | `text-secondary`, `bg-secondary` | `#8592a3` | Teks sekunder, icon non-aktif, tombol cancel. |

### Functional / State Colors
| Role | Class Tailwind | Hex Code | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Success** | `text-success` | `#71dd37` | Indikator naik (trend), status "Completed/Confirmed". |
| **Danger** | `text-danger` | `#ff3e1d` | Indikator turun (trend), error, tombol delete. |
| **Warning** | `text-warning` | `#ffab00` | Status "Pending", alert perhatian. |
| **Info** | `text-info` | `#03c3ec` | Informasi umum, chart sekunder. |

### Background & Surface
| Role | Class Tailwind | Hex Code | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Body** | `bg-body` | `#f5f5f9` | Warna latar belakang utama halaman (Light Gray). |
| **Paper/Card** | `bg-white`, `bg-paper` | `#ffffff` | Latar belakang komponen kartu, sidebar, dan navbar. |
| **Inputs** | `bg-gray-50` | `#f9fafb` | Latar belakang input field. |

### Typography Colors
| Role | Class Tailwind | Hex Code | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Heading** | `text-txt-primary` | `#566a7f` | Judul (h1-h6), nilai statistik utama. |
| **Body** | `text-txt-secondary` | `#697a8d` | Paragraf, label, teks menu. |
| **Muted** | `text-txt-muted` | `#a1acb8` | Placeholder, timestamp, teks non-penting. |

---

## 2. 🔠 Typography (Tipografi)

*   **Font Family:** `Public Sans`, sans-serif.
*   **Sumber:** Google Fonts.

### Hierarchy
*   **H1 - H3:** Digunakan jarang, biasanya untuk Landing page atau Login.
*   **H4 (Page Title):** `text-xl font-bold text-txt-primary`.
*   **H5 (Card Title):** `text-lg font-semibold text-txt-primary`.
*   **Body:** `text-sm` (sekitar 14px) adalah ukuran default untuk tabel dan konten.
*   **Small:** `text-xs` (sekitar 12px) digunakan untuk label status, sub-text, dan caption.

---

## 3. 💠 Shapes & Effects (Bentuk & Efek)

Desain ini sangat bergantung pada konsep "Card" yang melayang di atas background abu-abu muda.

### Border Radius
*   **Cards:** `rounded-card` (0.5rem / 8px). Digunakan pada hampir semua kontainer utama.
*   **Buttons & Inputs:** `rounded-md` (0.375rem / 6px).
*   **Badges:** `rounded` (0.25rem) atau `rounded-full` (capsule).

### Shadows (Bayangan)
Bayangan dibuat sangat halus dan tersebar (diffused) untuk memberikan kesan kedalaman (elevation) yang modern.

*   **Card Shadow:** `shadow-card`
    *   CSS: `box-shadow: 0 2px 6px 0 rgba(67, 89, 113, 0.12);`
    *   Penggunaan: Kartu dashboard, tabel container.
*   **Navbar Shadow:** `shadow-nav`
    *   CSS: `box-shadow: 0 0.375rem 1rem 0 rgba(161, 172, 184, 0.15);`
    *   Penggunaan: Navbar atas yang mengambang.

---

## 4. 🔷 Iconography (Ikon)

Aplikasi menggunakan **Boxicons** sebagai library ikon standar.

*   **Library:** [Boxicons](https://boxicons.com/)
*   **Style:** Regular (outline) untuk umum, Solid (`bxs-`) untuk penekanan tertentu.
*   **Alignment:** Class `.bx` memiliki `vertical-align: middle` secara default.

### Pattern Penggunaan Icon
Seringkali icon ditempatkan di dalam kotak berwarna lembut (pastel) di Dashboard:

```jsx
// Contoh Icon Container
<div className="w-10 h-10 rounded bg-primary-light flex items-center justify-center text-primary">
   <i className='bx bx-home text-2xl'></i>
</div>
```

---

## 5. 🧩 UI Components Guide

### Buttons
*   **Primary:** `bg-primary text-white shadow-md hover:bg-primary-dark`.
*   **Outline:** `border border-gray-300 text-txt-secondary hover:bg-gray-50`.
*   **Ghost/Icon Button:** `text-txt-muted hover:text-primary bg-transparent`.

### Inputs (Form)
*   Style input cenderung "flat" dengan background abu-abu sangat muda saat idle.
*   **Default:** `bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-primary/20`.
*   Border radius konsisten `rounded-md`.

### Layout Structure
1.  **Sidebar:**
    *   Fixed position sebelah kiri.
    *   Warna: Putih (`bg-white`).
    *   Item Aktif: Background ungu muda (`bg-primary-light`) dengan teks ungu (`text-primary`).
    *   Item Inaktif: Teks abu-abu (`text-txt-secondary`).
2.  **Navbar:**
    *   **Detached:** Navbar tidak menempel penuh dari kiri ke kanan, melainkan mengambang dengan margin (`m-6`).
    *   **Glassmorphism:** Menggunakan `backdrop-blur-sm` dan transparansi pada container luarnya.
3.  **Content Area:**
    *   Padding standar `p-6`.
    *   Grid system responsif (1 kolom di mobile, 12 kolom di desktop).

### Status Badges
Pola umum untuk badge status (misal: Pending, Paid):
```jsx
<span className="bg-green-100 text-success px-3 py-1 rounded text-xs font-bold uppercase">
  Confirmed
</span>
```
*   **Confirmed/Paid:** Green (bg-green-100 text-success)
*   **Pending:** Yellow (bg-yellow-100 text-warning)
*   **Cancelled/Unpaid:** Red (bg-red-100 text-danger)

---

## 6. 📊 Charts
Menggunakan library **Recharts**.
*   **Grid:** `strokeDasharray="3 3"` warna `#eceef1`.
*   **Tooltip:** Custom style dengan `boxShadow: '0 2px 6px 0 rgba(67, 89, 113, 0.12)'`, border radius `8px`.
*   **Warna:** Mengikuti palet Brand Colors di atas.
