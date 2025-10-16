# supabase-deploy.ps1 - Skrip deploy otomatis ke Supabase

# Ganti PROJECT_REF dengan project reference Anda
$PROJECT_REF = "eupeagvnnnysqkbytzwr"

# Periksa apakah Supabase CLI terinstal
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI tidak ditemukan. Silakan instal terlebih dahulu:" -ForegroundColor Red
    Write-Host "   winget install supabase --source msstore" -ForegroundColor Yellow
    Write-Host "   Atau download dari: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
    exit 1
}

Write-Host "🎉 Mulai deploy otomatis ke Supabase" -ForegroundColor Green

# Inisialisasi proyek Supabase lokal (jika belum)
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "🔧 Menginisialisasi proyek Supabase lokal..." -ForegroundColor Yellow
    supabase init
}

# Koneksikan ke proyek Supabase
Write-Host "🔗 Menghubungkan ke proyek Supabase..." -ForegroundColor Yellow
supabase link --project-ref $PROJECT_REF

# Buat direktori migrations jika belum ada
Write-Host "📁 Memastikan direktori migrations ada..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "supabase/migrations" -ErrorAction SilentlyContinue

# Generate migration dari schema saat ini
$migrationFileName = "$(Get-Date -Format 'yyyyMMddHHmmss')_booq_platform_schema.sql"
$migrationPath = "supabase/migrations/$migrationFileName"
Write-Host "📝 Membuat migration file: $migrationFileName" -ForegroundColor Yellow
Copy-Item "supabase/schema.sql" $migrationPath

# Jalankan skema ke database
Write-Host "🚀 Menerapkan skema ke database Supabase..." -ForegroundColor Yellow
supabase db push

Write-Host "✅ Deploy ke Supabase selesai!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Langkah selanjutnya:" -ForegroundColor Cyan
Write-Host "   1. Tambahkan variabel lingkungan ke Vercel:" -ForegroundColor White
Write-Host "      - NEXT_PUBLIC_SUPABASE_URL (harus seperti: https://$PROJECT_REF.supabase.co)" -ForegroundColor White
Write-Host "      - NEXT_PUBLIC_SUPABASE_ANON_KEY (dari Settings > API di dashboard Supabase)" -ForegroundColor White
Write-Host "      - SUPABASE_SERVICE_ROLE_KEY (dari Settings > API di dashboard Supabase)" -ForegroundColor White
Write-Host ""
Write-Host "   2. Deploy aplikasi Anda ke Vercel" -ForegroundColor White
Write-Host ""
Write-Host "   3. Untuk pengembangan lokal, tambahkan nilai-nilai tersebut ke .env.local" -ForegroundColor White