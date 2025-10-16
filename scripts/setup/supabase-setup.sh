#!/bin/bash
# supabase-setup.sh - Skrip otomatisasi setup Supabase

# Pastikan Supabase CLI sudah terinstal
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI tidak ditemukan. Silakan instal terlebih dahulu:"
    echo "   Untuk Windows: winget install supabase --source msstore"
    echo "   Atau lihat: https://github.com/supabase/cli/releases"
    exit 1
fi

echo "🎉 Mulai setup otomatis Supabase"

# Inisialisasi proyek Supabase
echo "🔧 Menginisialisasi proyek Supabase lokal..."
supabase init

# Minta informasi proyek dari pengguna
echo "📋 Silakan buka https://supabase.com/dashboard/project untuk mendapatkan Project ID Anda"
read -p "Masukkan Project Reference (Project ID): " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project Reference tidak boleh kosong"
    exit 1
fi

# Koneksikan ke proyek Supabase
echo "🔗 Menghubungkan ke proyek Supabase..."
supabase link --project-ref $PROJECT_REF

# Salin schema ke direktori Supabase
echo "📁 Menyalin schema ke direktori Supabase..."
mkdir -p supabase/migrations
# Buat migration file (timestamp + extension .sql)
MIGRATION_FILE="supabase/migrations/$(date +%Y%m%d%H%M%S)_schema.sql"
cp supabase/schema.sql $MIGRATION_FILE

# Jalankan skema ke database
echo "🚀 Menerapkan skema ke database..."
supabase db push

echo "✅ Setup Supabase selesai!"
echo ""
echo "📝 Langkah selanjutnya:"
echo "   1. Tambahkan variabel lingkungan ke Vercel:"
echo "      - NEXT_PUBLIC_SUPABASE_URL (dari dashboard Supabase)"
echo "      - NEXT_PUBLIC_SUPABASE_ANON_KEY (dari dashboard Supabase)"
echo "      - SUPABASE_SERVICE_ROLE_KEY (dari dashboard Supabase)"
echo ""
echo "   2. Deploy aplikasi Anda ke Vercel"
echo ""
echo "   3. Untuk pengembangan lokal, tambahkan nilai-nilai tersebut ke .env.local"