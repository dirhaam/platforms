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

---

## 7. 🎬 Animation & Transitions (Animasi)

Sneat menggunakan animasi yang halus dan subtle untuk meningkatkan user experience tanpa berlebihan. Semua animasi mendukung `prefers-reduced-motion` untuk aksesibilitas.

### Timing Functions
| Timing | CSS Value | Penggunaan |
| :--- | :--- | :--- |
| **Ease In-Out** | `ease-in-out` | Default untuk kebanyakan transisi. |
| **Ease** | `ease` | Collapse/expand menu, height animations. |
| **Ease Out** | `ease-out` | Modal entrance. |
| **Linear** | `linear` | Fade, spinner animations. |

### Durasi Standar
| Kategori | Durasi | Penggunaan |
| :--- | :--- | :--- |
| **Micro** | `150ms` | Fade, tooltip show/hide. |
| **Fast** | `200ms` | Button hover, icon rotate, form controls. |
| **Medium** | `250ms` | Offcanvas slide, menu sub-item. |
| **Slow** | `350ms` | Collapse/expand (accordion, dropdown). |

### Button Animations
Semua tombol menggunakan transisi universal untuk hover dan focus states:
```css
/* Button default transition */
transition: all 0.2s ease-in-out;
```

**Tailwind Classes:**
```jsx
// Primary Button dengan hover effect
<button className="bg-primary text-white px-5 py-2 rounded-md transition-all duration-200 ease-in-out hover:bg-[#5f61e6] hover:shadow-md">
  Button
</button>

// Outline Button
<button className="border border-primary text-primary px-5 py-2 rounded-md transition-all duration-200 ease-in-out hover:bg-primary hover:text-white">
  Outline
</button>
```

### Dropdown / Menu Animations
Dropdown menggunakan kombinasi opacity fade dan height transition:
```css
/* Dropdown fade */
transition: opacity 0.15s linear;

/* Collapse height (submenu expand) */
transition: height 0.35s ease;
```

**Tailwind Implementation untuk Sidebar Dropdown:**
```jsx
// Sidebar menu item dengan submenu
<div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
  {/* Submenu items */}
</div>
```

**Icon Rotate pada Dropdown:**
```jsx
// Chevron icon rotation
<i className={`bx bx-chevron-down transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`}></i>
```

### Accordion Animations
```css
/* Accordion content expand */
transition: all 0.2s ease-in-out, border-radius 0.15s ease;

/* Accordion icon rotate */
transform: rotate(-180deg);
transition: transform 0.2s ease-in-out;
```

### Nav Link Hover
```css
transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
```

**Tailwind:**
```jsx
<a className="px-4 py-2 text-txt-secondary transition-colors duration-150 ease-in-out hover:text-primary hover:bg-primary-light rounded">
  Nav Link
</a>
```

### Form Input Focus
```css
transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
```

**Tailwind:**
```jsx
<input className="w-full px-4 py-2 border border-gray-200 rounded-md transition-all duration-150 ease-in-out focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none" />
```

### Modal Animation
Modal menggunakan kombinasi translate dan scale untuk entrance effect:
```css
/* Modal entrance */
transition: transform 0.15s ease-out;
transform: translateY(-100px) scale(0.8);

/* When visible */
transform: translateY(0) scale(1);
```

### Offcanvas / Drawer Animation
```css
transition: transform 0.25s ease-in-out;
```

### Table Row Hover
```jsx
<tr className="transition-colors duration-150 ease-in-out hover:bg-gray-50">
  {/* cells */}
</tr>
```

### Card Hover Effect (Optional)
```jsx
<div className="bg-white rounded-card shadow-card transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
  {/* card content */}
</div>
```

### Loading Spinners
```css
/* Spinner border rotation */
animation: 0.75s linear infinite spinner-border;

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

/* Spinner grow pulse */
animation: 0.75s linear infinite spinner-grow;

@keyframes spinner-grow {
  0% { transform: scale(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}
```

### Progress Bar Animation
```css
transition: width 0.6s ease;

/* Striped animation */
animation: 1s linear infinite progress-bar-stripes;

@keyframes progress-bar-stripes {
  0% { background-position-x: 0.375rem; }
}
```

### Best Practices Animasi
1. **Konsistensi:** Gunakan durasi dan timing function yang sama untuk elemen sejenis.
2. **Subtle:** Animasi tidak boleh mengganggu atau terlalu "flashy".
3. **Performance:** Preferensikan animasi pada `transform` dan `opacity` (GPU-accelerated).
4. **Aksesibilitas:** Selalu hormati `prefers-reduced-motion`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
5. **Feedback:** Animasi harus memberikan feedback visual yang bermakna kepada user.

---

## 8. 🌓 Dark Mode & Light Mode (Theming)

Sneat menggunakan CSS Custom Properties (CSS Variables) untuk mendukung theming yang konsisten antara light dan dark mode. Tema diaktifkan dengan attribute `data-bs-theme` pada elemen root.

### Aktivasi Theme
```html
<!-- Light Mode (Default) -->
<html data-bs-theme="light">

<!-- Dark Mode -->
<html data-bs-theme="dark">
```

### Light Mode Colors
| Variable | Hex Code | Penggunaan |
| :--- | :--- | :--- |
| `--bs-body-bg` | `#f5f5f9` | Background utama halaman |
| `--bs-body-color` | `#646e78` | Warna teks body |
| `--bs-heading-color` | `#384551` | Warna heading/judul |
| `--bs-paper-bg` | `#ffffff` | Background card/sidebar/navbar |
| `--bs-border-color` | `#e4e6e8` | Warna border umum |
| `--bs-secondary-color` | `#a7acb2` | Teks sekunder/muted |
| `--bs-link-color` | `#696cff` | Warna link (Primary) |
| `--bs-link-hover-color` | `#5f61e6` | Warna link saat hover |

### Dark Mode Colors
| Variable | Hex Code | Penggunaan |
| :--- | :--- | :--- |
| `--bs-body-bg` | `#232333` | Background utama halaman |
| `--bs-body-color` | `#b2b2c4` | Warna teks body |
| `--bs-heading-color` | `#d5d5e2` | Warna heading/judul |
| `--bs-paper-bg` | `#2b2c40` | Background card/sidebar/navbar |
| `--bs-border-color` | `#4e4f6c` | Warna border umum |
| `--bs-secondary-color` | `#7e7f96` | Teks sekunder/muted |
| `--bs-link-color` | `#a5a7ff` | Warna link (Primary lighter) |
| `--bs-link-hover-color` | `#aeb0ff` | Warna link saat hover |

### Gray Scale Comparison
| Scale | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| `--bs-gray-100` | `#e9eaec` | `#4a4b69` |
| `--bs-gray-200` | `#e4e6e8` | `#4e4f6c` |
| `--bs-gray-300` | `#bdc1c5` | `#6d6e87` |
| `--bs-gray-400` | `#a7acb2` | `#7e7f96` |
| `--bs-gray-500` | `#91979f` | `#8f90a5` |
| `--bs-gray-600` | `#7a838b` | `#a1a1b5` |
| `--bs-gray-700` | `#646e78` | `#b2b2c4` |
| `--bs-gray-800` | `#4e5965` | `#c3c4d3` |
| `--bs-gray-900` | `#384551` | `#d5d5e2` |

### Functional Colors (Subtle Backgrounds)
| Color | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| `--bs-primary-bg-subtle` | `#e7e7ff` | `#35365f` |
| `--bs-success-bg-subtle` | `#e8fadf` | `#36483f` |
| `--bs-danger-bg-subtle` | `#ffe0db` | `#4d2f3a` |
| `--bs-warning-bg-subtle` | `#fff2d6` | `#4d4036` |
| `--bs-info-bg-subtle` | `#d7f5fc` | `#25445c` |

### Shadow Adjustments
| Shadow | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| `--bs-box-shadow` | `rgba(34,48,62,0.1)` | `rgba(20,20,29,0.22)` |
| `--bs-box-shadow-sm` | `rgba(34,48,62,0.08)` | `rgba(20,20,29,0.2)` |
| `--bs-box-shadow-lg` | `rgba(34,48,62,0.14)` | `rgba(20,20,29,0.24)` |

### Tailwind Configuration untuk Dark Mode
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // atau 'media' untuk system preference
  theme: {
    extend: {
      colors: {
        // Light mode defaults
        body: '#f5f5f9',
        paper: '#ffffff',
        'txt-primary': '#384551',
        'txt-secondary': '#697a8d',
        'txt-muted': '#a1acb8',
        
        // Dark mode overrides akan menggunakan class dark:
      }
    }
  }
}
```

### Implementation Pattern (React/Next.js)
```jsx
// ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.setAttribute('data-bs-theme', systemTheme);
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.setAttribute('data-bs-theme', theme);
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Dark Mode Tailwind Classes
```jsx
// Contoh Card dengan dark mode support
<div className="bg-white dark:bg-[#2b2c40] rounded-card shadow-card 
               text-txt-primary dark:text-[#d5d5e2] 
               border border-gray-200 dark:border-[#4e4f6c]">
  <h5 className="text-txt-primary dark:text-[#d5d5e2]">Card Title</h5>
  <p className="text-txt-secondary dark:text-[#b2b2c4]">Card content</p>
</div>

// Sidebar dengan dark mode
<aside className="bg-white dark:bg-[#2b2c40] border-r border-gray-200 dark:border-[#4e4f6c]">
  <nav>
    <a className="text-txt-secondary dark:text-[#b2b2c4] hover:text-primary hover:bg-primary-light 
                  dark:hover:bg-[#35365f] transition-colors duration-150">
      Menu Item
    </a>
  </nav>
</aside>

// Input field dengan dark mode
<input className="bg-gray-50 dark:bg-[#2b2c40] 
                  border border-gray-200 dark:border-[#4e4f6c]
                  text-txt-primary dark:text-[#d5d5e2]
                  placeholder:text-txt-muted dark:placeholder:text-[#7e7f96]
                  focus:border-primary focus:ring-primary/20" />
```

### Theme Toggle Button
```jsx
// ThemeToggle.tsx
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button 
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md transition-colors duration-200 
                 hover:bg-gray-100 dark:hover:bg-[#4e4f6c]"
    >
      {theme === 'dark' ? (
        <i className="bx bx-sun text-xl text-warning"></i>
      ) : (
        <i className="bx bx-moon text-xl text-txt-secondary"></i>
      )}
    </button>
  );
}
```

### CSS Variables Approach (Alternative)
```css
/* globals.css */
:root {
  --body-bg: #f5f5f9;
  --paper-bg: #ffffff;
  --text-primary: #384551;
  --text-secondary: #697a8d;
  --text-muted: #a1acb8;
  --border-color: #e4e6e8;
}

[data-bs-theme="dark"],
.dark {
  --body-bg: #232333;
  --paper-bg: #2b2c40;
  --text-primary: #d5d5e2;
  --text-secondary: #b2b2c4;
  --text-muted: #7e7f96;
  --border-color: #4e4f6c;
}

/* Usage */
.card {
  background-color: var(--paper-bg);
  color: var(--text-primary);
  border-color: var(--border-color);
}
```

### Best Practices Dark Mode
1. **Kontras:** Pastikan rasio kontras minimal 4.5:1 untuk teks normal.
2. **Tidak Pure Black:** Gunakan `#232333` bukan `#000000` untuk mengurangi eye strain.
3. **Subtle Shadows:** Shadow di dark mode harus lebih gelap dan subtle.
4. **Desaturate Colors:** Warna-warna cerah sedikit di-desaturate di dark mode.
5. **System Preference:** Hormati `prefers-color-scheme` user.
6. **Persistence:** Simpan preferensi user di localStorage.
7. **No Flash:** Gunakan script blocking untuk menghindari flash saat load.
