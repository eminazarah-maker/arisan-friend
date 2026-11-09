# Spesifikasi Produk — ARISAN KELUARGA

## Identitas
- Platform: Android (Flutter)
- Backend: Supabase Auth + PostgreSQL + Row Level Security
- Warna: hitam, ungu, pink
- Nilai iuran awal: Rp10.000 (dapat diubah Admin)
- Jadwal dan periode: fleksibel, nama dan tanggal ditentukan pengurus

## Peran
- Admin: pengaturan kelompok, nominal iuran, periode, anggota, pembayaran, undian, laporan.
- Bendahara: anggota, pembayaran, undian, laporan. Tidak dapat mengubah pengaturan kelompok atau membuat periode.

## Alur utama
1. Admin membuat kelompok, menentukan nominal default dan periode pembayaran.
2. Admin membuat periode arisan sesuai kesepakatan keluarga.
3. Pengurus menambahkan anggota beserta nomor WhatsApp.
4. Bendahara mencatat pembayaran; status lunas/tertunda dan nominal disimpan pada transaksi.
5. Dashboard dan laporan menjumlahkan transaksi berstatus lunas.
6. Undian server-side memilih anggota aktif yang sudah lunas pada periode tersebut.
7. Pengingat dapat dibuka ke WhatsApp dengan pesan terisi. Pengiriman API otomatis adalah integrasi terpisah yang membutuhkan kredensial dan template Meta.

## Database
Tabel utama: `profiles`, `groups`, `members`, `periods`, `payments`, `expenses`, `draws`, `draw_participants`, `audit_logs`.
RLS diwajibkan pada semua tabel yang memuat data keluarga atau transaksi.

## Kriteria uji sebelum produksi
- Login admin dan bendahara.
- Pastikan bendahara tidak dapat mengubah kelompok/periode melalui API langsung.
- Tambah, edit, dan nonaktifkan anggota.
- Catat pembayaran lunas/tertunda dan verifikasi total.
- Coba duplikasi pembayaran anggota pada periode yang sama.
- Verifikasi peserta undian hanya anggota aktif yang lunas.
- Uji PDF/spreadsheet dan pesan WhatsApp.
- Uji backup, pemulihan, serta keamanan kredensial.
