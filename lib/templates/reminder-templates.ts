export interface ReminderTemplate {
  id: string;
  name: string;
  type: 'booking_confirmation' | 'payment_reminder' | 'arrival_reminder' | 'reschedule_notification' | 'cancellation_notification' | 'follow_up' | 'custom';
  template: string;
  variables: string[];
  timing?: {
    before?: number; // minutes/hours before event
    after?: number; // minutes/hours after event
    unit?: 'minutes' | 'hours' | 'days';
  };
  isActive: boolean;
}

export const reminderTemplates: ReminderTemplate[] = [
  // Booking Confirmation
  {
    id: 'booking_confirmation_1',
    name: 'Booking Confirmation - Standard',
    type: 'booking_confirmation',
    template: 'Hai {{customerName}}! 🎉 Booking Anda untuk {{serviceName}} telah dikonfirmasi.\n\n📅 Tanggal: {{bookingDate}}\n⏰ Waktu: {{bookingTime}}\n📍 Lokasi: {{location}}\n💰 Total: IDR {{totalAmount}}\n\nMohon datang 15 menit sebelum jadwal. Terima kasih!',
    variables: ['customerName', 'serviceName', 'bookingDate', 'bookingTime', 'location', 'totalAmount'],
    isActive: true
  },
  {
    id: 'booking_confirmation_2',
    name: 'Booking Confirmation - Home Visit',
    type: 'booking_confirmation',
    template: 'Hai {{customerName}}! 🏠 Kunjungan rumah Anda untuk {{serviceName}} telah dikonfirmasi.\n\n📅 Tanggal: {{bookingDate}}\n⏰ Waktu: {{bookingTime}}\n📍 Alamat: {{homeVisitAddress}}\n💰 Total: IDR {{totalAmount}}\n\nTim kami akan tiba di alamat Anda pada waktu yang ditentukan. Pastikan alamat lengkap dan mudah diakses. Terima kasih!',
    variables: ['customerName', 'serviceName', 'bookingDate', 'bookingTime', 'homeVisitAddress', 'totalAmount'],
    isActive: true
  },

  // Payment Reminder
  {
    id: 'payment_reminder_1',
    name: 'Payment Reminder - Before Booking',
    type: 'payment_reminder',
    template: 'Hai {{customerName}}! 💳 Reminder pembayaran untuk booking Anda.\n\n📋 Layanan: {{serviceName}}\n📅 Tanggal: {{bookingDate}}\n⏰ Waktu: {{bookingTime}}\n💰 Jumlah: IDR {{totalAmount}}\n\nSilakan lakukan pembayaran sebelum jadwal untuk mengkonfirmasi booking Anda. Terima kasih!',
    variables: ['customerName', 'serviceName', 'bookingDate', 'bookingTime', 'totalAmount'],
    timing: { before: 24, unit: 'hours' },
    isActive: true
  },
  {
    id: 'payment_reminder_2',
    name: 'Payment Reminder - Overdue',
    type: 'payment_reminder',
    template: 'Hai {{customerName}}! ⚠️ Pembayaran Anda terlambat.\n\n📋 Layanan: {{serviceName}}\n📅 Tanggal: {{bookingDate}}\n💰 Jumlah: IDR {{totalAmount}}\n📆 Terlambat: {{daysOverdue}} hari\n\nSilakan segera lakukan pembayaran untuk menghindari pembatalan booking. Hubungi kami jika ada kendala. Terima kasih!',
    variables: ['customerName', 'serviceName', 'bookingDate', 'totalAmount', 'daysOverdue'],
    isActive: true
  },
  {
    id: 'payment_reminder_3',
    name: 'Payment Confirmation - Thank You',
    type: 'payment_reminder',
    template: 'Hai {{customerName}}! ✅ Pembayaran Anda telah diterima.\n\n📋 Layanan: {{serviceName}}\n📅 Tanggal: {{bookingDate}}\n⏰ Waktu: {{bookingTime}}\n💰 Jumlah: IDR {{totalAmount}}\n📝 Metode: {{paymentMethod}}\n\nTerima kasih atas pembayarannya! Kami tunggu kehadiran Anda. Sampai jumpa!',
    variables: ['customerName', 'serviceName', 'bookingDate', 'bookingTime', 'totalAmount', 'paymentMethod'],
    isActive: true
  },

  // Arrival Reminder
  {
    id: 'arrival_reminder_1',
    name: 'Arrival Reminder - 1 Day Before',
    type: 'arrival_reminder',
    template: 'Hai {{customerName}}! 📅 Reminder jadwal Anda besok.\n\n📋 Layanan: {{serviceName}}\n📅 Tanggal: {{bookingDate}}\n⏰ Waktu: {{bookingTime}}\n📍 Lokasi: {{location}}\n\nJangan lupa datang 15 menit sebelum jadwal. Jika perlu reschedule, hubungi kami segera. Terima kasih!',
    variables: ['customerName', 'serviceName', 'bookingDate', 'bookingTime', 'location'],
    timing: { before: 24, unit: 'hours' },
    isActive: true
  },
  {
    id: 'arrival_reminder_2',
    name: 'Arrival Reminder - 2 Hours Before',
    type: 'arrival_reminder',
    template: 'Hai {{customerName}}! ⏰ Reminder 2 jam lagi.\n\n📋 Layanan: {{serviceName}}\n📅 Hari Ini: {{bookingDate}}\n⏰ Waktu: {{bookingTime}}\n📍 Lokasi: {{location}}\n\nSiap-siap ya! Kami tunggu kehadiran Anda. Sampai jumpa!',
    variables: ['customerName', 'serviceName', 'bookingDate', 'bookingTime', 'location'],
    timing: { before: 2, unit: 'hours' },
    isActive: true
  },
  {
    id: 'arrival_reminder_3',
    name: 'Arrival Reminder - 30 Minutes Before',
    type: 'arrival_reminder',
    template: 'Hai {{customerName}}! 🚀 30 menit lagi!\n\n📋 Layanan: {{serviceName}}\n⏰ Waktu: {{bookingTime}}\n📍 Lokasi: {{location}}\n\nKami sudah menanti Anda. Sampai jumpa segera!',
    variables: ['customerName', 'serviceName', 'bookingTime', 'location'],
    timing: { before: 30, unit: 'minutes' },
    isActive: true
  },

  // Reschedule Notification
  {
    id: 'reschedule_notification_1',
    name: 'Reschedule Notification - Customer Request',
    type: 'reschedule_notification',
    template: 'Hai {{customerName}}! 📅 Perubahan jadwal Anda telah dikonfirmasi.\n\n📋 Layanan: {{serviceName}}\n🗓️ Jadwal Lama: {{oldDateTime}}\n✅ Jadwal Baru: {{newDateTime}}\n📍 Lokasi: {{location}}\n\nTerima kasih telah menginformasikan perubahan jadwal. Kami tunggu kehadiran Anda di waktu baru. Sampai jumpa!',
    variables: ['customerName', 'serviceName', 'oldDateTime', 'newDateTime', 'location'],
    isActive: true
  },

  // Cancellation Notification
  {
    id: 'cancellation_notification_1',
    name: 'Cancellation Notification - Customer',
    type: 'cancellation_notification',
    template: 'Hai {{customerName}}! ❌ Pembatalan booking Anda telah diproses.\n\n📋 Layanan: {{serviceName}}\n📅 Tanggal: {{bookingDate}}\n⏰ Waktu: {{bookingTime}}\n💰 Total: IDR {{totalAmount}}\n\n{{refundMessage}}\n\nTerima kasih telah menginformasikan pembatalan. Semoga pelayanan kami bisa membantu Anda di lain waktu. Sampai jumpa!',
    variables: ['customerName', 'serviceName', 'bookingDate', 'bookingTime', 'totalAmount', 'refundMessage'],
    isActive: true
  },

  // Follow Up
  {
    id: 'follow_up_1',
    name: 'Follow Up - After Service',
    type: 'follow_up',
    template: 'Hai {{customerName}}! 😊 Semoga Anda puas dengan layanan {{serviceName}} kami.\n\n📅 Tanggal: {{bookingDate}}\n⭐ Kami sangat menghargai feedback Anda.\n\nJika ada yang bisa kami tingkatkan, jangan ragu untuk memberikan review. Terima kasih telah mempercayai layanan kami!',
    variables: ['customerName', 'serviceName', 'bookingDate'],
    timing: { after: 2, unit: 'hours' },
    isActive: true
  },
  {
    id: 'follow_up_2',
    name: 'Follow Up - Review Request',
    type: 'follow_up',
    template: 'Hai {{customerName}}! ⭐ Bantu kami meningkatkan pelayanan.\n\n📋 Layanan: {{serviceName}}\n📅 Tanggal: {{bookingDate}}\n\nKami sangat menghargai review Anda tentang pengalaman dengan layanan kami. Terima kasih atas dukungan Anda!',
    variables: ['customerName', 'serviceName', 'bookingDate'],
    timing: { after: 24, unit: 'hours' },
    isActive: true
  }
];

export function getTemplateById(id: string): ReminderTemplate | undefined {
  return reminderTemplates.find(template => template.id === id);
}

export function getTemplatesByType(type: ReminderTemplate['type']): ReminderTemplate[] {
  return reminderTemplates.filter(template => template.type === type && template.isActive);
}

export function getAllActiveTemplates(): ReminderTemplate[] {
  return reminderTemplates.filter(template => template.isActive);
}

export function processTemplate(template: string, variables: Record<string, string>): string {
  let processed = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value || `{{${key}}}`);
  });
  
  return processed;
}
