# ARISAN KELUARGA — Flutter Android + Supabase

Aplikasi Android untuk pengelolaan arisan keluarga. Tema gelap hitam dengan aksen ungu dan pink. Dibangun dari proyek Flutter sebelumnya, dengan nama, tema, nominal awal, dan alur fleksibel yang diperbarui.

## Fitur dalam source saat ini
- Login Supabase Auth (email/kata sandi).
- Role akun `admin` dan `treasurer` (bendahara).
- Dashboard: jumlah anggota aktif, total pembayaran lunas, pembayaran tertunda, dan periode aktif.
- Data anggota: tambah, edit, nonaktifkan, simpan nomor WhatsApp.
- Pembayaran: catat per anggota dan periode, nominal default mengambil pengaturan kelompok (awal Rp10.000), status lunas/tertunda, total dihitung dari transaksi.
- Pengaturan kelompok: nama, iuran default, dan teks periode pembayaran fleksibel.
- Periode arisan: Admin dapat membuat periode dengan nama/tanggal yang ditentukan sendiri.
- Pengundian server-side untuk anggota aktif yang lunas pada periode terkait.
- Laporan PDF dan spreadsheet.
- Tombol pengingat WhatsApp membuka chat anggota dengan pesan yang telah diisi.
- Contoh Supabase Edge Function untuk WhatsApp Business Cloud API tersedia, tetapi perlu konfigurasi Meta, template pesan disetujui, dan pemanggilan terautentikasi sebelum pengiriman API aktif.

## 1. Buat proyek Supabase
1. Buat project di Supabase.
2. Buka SQL Editor dan jalankan `0001_initial_schema.sql`, lalu `0002_flexible_arisan.sql` secara berurutan. Jika database lama sudah menjalankan skema awal sebelumnya, jalankan `0002_flexible_arisan.sql` saja.
3. Di Authentication > Users, buat user Admin dan Bendahara (email + password).
4. Salin UUID masing-masing user. Jalankan SQL berikut dengan UUID yang benar:

```sql
insert into public.profiles(id, full_name, role)
values
  ('UUID_ADMIN', 'Admin Arisan', 'admin'),
  ('UUID_BENDAHARA', 'Bendahara Arisan', 'treasurer');

insert into public.groups(name, contribution_amount, payment_frequency)
values ('ARISAN KELUARGA', 10000, 'Fleksibel');

insert into public.periods(group_id, name, starts_on, status)
select id, 'Putaran Pertama', current_date, 'open'
from public.groups
order by created_at desc limit 1;
```

Ganti nilai `UUID_ADMIN` dan `UUID_BENDAHARA` dengan UUID asli dari Supabase. Jangan membagikan password, `service_role` key, atau token WhatsApp.

## 2. Menjalankan di komputer
Perlu Flutter stable dan Android SDK.

```bash
flutter create --platforms=android --org id.arisan.keluarga .
flutter pub get
flutter run --dart-define=SUPABASE_URL=https://PROJECT.supabase.co --dart-define=SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
```

## 3. Build APK melalui GitHub Actions
Workflow tersedia di `.github/workflows/build-apk.yml`.
1. Upload isi folder proyek ini ke repository GitHub, bukan file ZIP di dalam repository.
2. Di Settings > Secrets and variables > Actions, buat secrets `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari Project Settings > API Supabase.
3. Buka tab Actions, pilih **Build ARISAN KELUARGA APK**, lalu tekan **Run workflow**.
4. Jika selesai hijau, buka hasil run dan unduh artifact `arisan-keluarga-release-apk`. Ekstrak ZIP artifact untuk mendapatkan `app-release.apk`.

Workflow mencoba ulang build hingga tiga kali untuk mengatasi gangguan unduhan Gradle sementara seperti HTTP 504 yang pernah muncul pada build sebelumnya. Jika secret belum diisi, APK tetap dapat dibangun tetapi aplikasi akan menampilkan halaman konfigurasi dan belum dapat terhubung ke database.

## 4. WhatsApp
- Saat ini aplikasi menyediakan tombol untuk membuka WhatsApp dengan pesan pengingat yang telah diisi otomatis.
- Pengiriman otomatis tanpa tindakan manual memerlukan WhatsApp Business Platform, nomor bisnis, token, Phone Number ID, template `payment_reminder` yang disetujui Meta, persetujuan (opt-in) penerima, dan deployment Edge Function.
- Deploy function dari Supabase CLI setelah login dan link project:
  ```bash
  supabase functions deploy send-whatsapp-reminder
  supabase secrets set WHATSAPP_TOKEN=TOKEN_META WHATSAPP_PHONE_NUMBER_ID=PHONE_NUMBER_ID SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY
  ```
- Pastikan template `payment_reminder` yang dipakai function sudah disetujui Meta dan memiliki tiga parameter body: nama anggota, nominal, dan nama/jadwal periode. Pengiriman massal dari aplikasi hanya menargetkan anggota aktif yang belum lunas pada periode aktif.
- Simpan `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, dan `SUPABASE_SERVICE_ROLE_KEY` hanya sebagai Supabase secrets. Jangan pernah menaruhnya di APK.

## 5. Hak akses dan keamanan
- Admin: pengaturan kelompok dan periode, pengelolaan anggota, pembayaran, laporan, undian.
- Bendahara: operasional anggota, pembayaran, laporan, dan undian; tidak dapat mengubah pengaturan kelompok atau membuat periode baru.
- RLS di database menjadi pengaman utama; pembatasan UI bukan pengganti RLS.
- Aktifkan MFA untuk akun admin bila memungkinkan. Uji RLS menggunakan kedua jenis akun sebelum dipakai untuk uang sungguhan.

## Catatan status
Ini adalah source project yang disiapkan untuk build di GitHub Actions, bukan APK yang sudah dikompilasi atau diuji pada perangkat. Build Android memerlukan Flutter/Gradle dan kredensial Supabase milik pemilik project. Lakukan uji coba dengan data contoh sebelum penggunaan keluarga secara nyata.
