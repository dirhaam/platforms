workflow_redesign = '''
# Workflow Redesign: Unified Booking, Sales, Invoice Panel

## 1. Transformasi Menu – Unified Panel Booking/Sales/Invoice

### Panel Detail Booking Menjadi Pusat Kerja
- Semua proses utama (lihat data customer, update status booking, payment, sales, generate/send invoice) dilakukan dari satu panel detail booking, tanpa harus pindah menu.
- Struktur tab/accordion untuk masing-masing proses (Summary, Payment, Sales, Invoice, History) mudah diakses.

### Struktur Tab/Accordion Panel
- **Summary**: Data customer yang telah booking (nama, telepon/email, layanan, jadwal, status booking, notes).
- **Payment**: Status & metode pembayaran, aksi "Mark as Paid" atau "Refund".
- **Sales**: Ringkasan transaksi penjualan, aksi terkait.
- **Invoice**: Status, nomor invoice, total, jatuh tempo, tombol generate/send/mark as paid/download, riwayat invoice.
- **History**: Riwayat perubahan booking, payment, reminder, dsb (timeline).

### Quick Action & One Click Workflow
- Semua aksi penting (konfirmasi, complete, payment, generate/send invoice, refund) tampil sebagai tombol besar di tab terkait, maksimal 1-2 klik.
- Aksi lanjutan (reschedule, refund, issue/void invoice) di advanced/overflow menu.

### Prefill Data, Minim Modal/Multi-step
- Semua data customer, layanan, jadwal diprefill otomatis.
- Editing minor melalui inline-edit (tanpa modal baru kecuali advanced).

### Status Logic/Badge
- Status booking, payment, sales, invoice ditampilkan jelas di header.
- Next Recommended Action (misal: booking PENDING → Confirm, sudah PAID → Generate Invoice) tampil kontekstual.

### Responsive & Mobile Ready
- Desain 1 kolom pada device kecil, tab/card besar mudah diklik operator.

---

## 2. Rekomendasi UI

### Struktur Panel

    ┌────────────────────────────────────┐
    │ Booking Detail (Header: Status + Customer) │
    │                                    │
    │ [Summary] [Payment] [Sales] [Invoice] [History] │
    │                                    │
    │ ● Tab Summary:                     │
    │   Nama     : Ahmad Saputra         │
    │   Telepon  : 0812xxxxxxx           │
    │   Layanan  : Spa Treatment         │
    │   Jadwal   : 2025-10-28, 14:00     │
    │   Status   : ⬤ Confirmed           │
    │   Notes    : Home visit            │
    │   Quick Action: [Complete]         │
    │                                    │
    │ ● Tab Invoice:                     │
    │   No.      : INV-202510-0001       │
    │   Status   : Sent                  │
    │   Total    : Rp500,000             │
    │   Jatuh Tempo : 2025-11-04         │
    │   Button   : [Send WhatsApp] [Download PDF] │
    │   Log      : Timeline History      │
    └────────────────────────────────────┘

- Semua tab diakses dalam 1 panel.
- Status & main action selalu visible & kontekstual.

### Prinsip UI
- Ringkas, tidak overload field
- Fitur utama langsung ditampilkan, advance/rare action tersembunyi
- Feedback cepat (toast/notif) setelah aksi
- Audit log/timeline membantu monitoring & tracing

---

## 3. Implementation Steps untuk Tim
- Refactor panel booking dengan summary utama dan tab Payment, Sales, Invoice, History dalam panel yang sama.
- Hapus menu invoice terpisah, pindahkan seluruh action/summary invoice ke panel booking/sales.
- Tambahkan filter/search di dashboard untuk menemukan booking berdasarkan status, termasuk invoice/sales status.

---

**Goal:** Proses admin jauh lebih cepat dan jelas, semua pekerjaan utama dilakukan dari satu panel detail booking/sales/invoice.
'''