# supabase-setup.ps1 - Skrip otomatisasi setup Supabase untuk PowerShell

# Periksa apakah Supabase CLI terinstal
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI tidak ditemukan. Silakan instal terlebih dahulu:" -ForegroundColor Red
    Write-Host "   winget install supabase --source msstore" -ForegroundColor Yellow
    Write-Host "   Atau download dari: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
    exit 1
}

Write-Host "🎉 Mulai setup otomatis Supabase" -ForegroundColor Green

# Inisialisasi proyek Supabase
Write-Host "🔧 Menginisialisasi proyek Supabase lokal..." -ForegroundColor Yellow
supabase init

# Minta informasi proyek dari pengguna
Write-Host "📋 Silakan buka https://supabase.com/dashboard/project untuk mendapatkan Project ID Anda" -ForegroundColor Cyan
$projectRef = Read-Host "Masukkan Project Reference (Project ID)"

if ([string]::IsNullOrWhiteSpace($projectRef)) {
    Write-Host "❌ Project Reference tidak boleh kosong" -ForegroundColor Red
    exit 1
}

# Koneksikan ke proyek Supabase
Write-Host "🔗 Menghubungkan ke proyek Supabase..." -ForegroundColor Yellow
supabase link --project-ref $projectRef

# Salin schema ke direktori Supabase
Write-Host "📁 Menyalin schema ke direktori Supabase..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "supabase/migrations" -ErrorAction SilentlyContinue
# Buat migration file (timestamp + extension .sql)
$migrationFileName = "$(Get-Date -Format 'yyyyMMddHHmmss')_schema.sql"
$migrationPath = "supabase/migrations/$migrationFileName"
Copy-Item "supabase/schema.sql" $migrationPath

# Jalankan skema ke database
Write-Host "🚀 Menerapkan skema ke database..." -ForegroundColor Yellow
supabase db push

Write-Host "✅ Setup Supabase selesai!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Langkah selanjutnya:" -ForegroundColor Cyan
Write-Host "   1. Tambahkan variabel lingkungan ke Vercel:" -ForegroundColor White
Write-Host "      - NEXT_PUBLIC_SUPABASE_URL (dari dashboard Supabase)" -ForegroundColor White
Write-Host "      - NEXT_PUBLIC_SUPABASE_ANON_KEY (dari dashboard Supabase)" -ForegroundColor White
Write-Host "      - SUPABASE_SERVICE_ROLE_KEY (dari dashboard Supabase)" -ForegroundColor White
Write-Host ""
Write-Host "   2. Deploy aplikasi Anda ke Vercel" -ForegroundColor White
Write-Host ""
Write-Host "   3. Untuk pengembangan lokal, tambahkan nilai-nilai tersebut ke .env.local" -ForegroundColor White