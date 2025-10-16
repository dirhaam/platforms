# Untuk menguji koneksi dan menerapkan skema ke Supabase secara langsung menggunakan psql
# Pastikan Anda sudah menginstal PostgreSQL (termasuk psql client)

# 1. Install PostgreSQL client jika belum punya
#   - Download dari: https://www.postgresql.org/download/windows/
#   - Atau gunakan: scoop install postgresql (jika menggunakan Scoop)

# 2. Dapatkan connection string dari dashboard Supabase
#    Format: postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
#    Contoh: postgresql://postgres:your_password_here@eupeagvnnnysqkbytzwr.supabase.co:5432/postgres

# 3. Buat file connection string (jangan commit file ini!)
Write-Host "🔧 Membuat template connection string..."
@"
# Supabase Connection Template
# Ganti YOUR_PASSWORD dengan password database dari dashboard Supabase
SUPABASE_CONNECTION_STRING=postgresql://postgres:YOUR_PASSWORD@eupeagvnnnysqkbytzwr.supabase.co:5432/postgres
"@ | Out-File -FilePath "supabase-connection.txt" -Encoding utf8

Write-Host "✅ Template connection string dibuat di supabase-connection.txt" -ForegroundColor Green

# 4. Instruksi penggunaan
Write-Host ""
Write-Host "📝 Instruksi:" -ForegroundColor Cyan
Write-Host "   1. Buka dashboard Supabase Anda: https://supabase.com/dashboard/project/eupeagvnnnysqkbytzwr/settings/database" -ForegroundColor White
Write-Host "   2. Salin password database dari bagian 'Database Settings'" -ForegroundColor White
Write-Host "   3. Ganti YOUR_PASSWORD di file supabase-connection.txt dengan password tersebut" -ForegroundColor White
Write-Host "   4. Jalankan perintah berikut untuk menerapkan skema:" -ForegroundColor White
Write-Host "      psql -d 'postgresql://postgres:YOUR_PASSWORD@eupeagvnnnysqkbytzwr.supabase.co:5432/postgres' -f supabase/schema.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Catatan: Jangan commit file connection string ke repository!" -ForegroundColor Red