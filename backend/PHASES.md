# Proje Fazları

## FAZ 1 — Veri Çekme, İşleme, Model Oluşturma, Migration İşlemleri

- Kaggle.com'dan çekilen verilerin **sütun isimlerini projemize uygun olarak işle** (Türkçe/İngilizce karışıklığını çöz, encoding sorunlarını gider).
- Bu sütunların değerlerine ve dokümantasyondaki işlevselliklere göre **modelleri oluştur** (`Listing` base + `CarListing`/`HouseListing` alt modelleri, multi-table inheritance).
- Postgres veritabanını **containerize et** (Docker Compose ile, sadece veritabanı servisi).
- **Migration'ları oluştur ve uygula**, tabloların doğru şemayla ayağa kalktığını doğrula.
- CSV'den veritabanına **toplu veri aktarım script'ini** (management command) yaz — sayısal/tarih alanlarını temizleyip doğru tipe çevir.
- Django shell üzerinden import edilen verinin doğruluğunu **manuel olarak kontrol et**.

## FAZ 2 — Uygulama Mimarisi ve App Yapısı

- Projeyi **domain'lere göre app'lere böl** (`listings` — ilan yönetimi, `accounts` — kullanıcı/auth/profil).
- İlan iş mantığını view'lardan ayırıp **service layer** (`ListingService(services.py)` benzeri bir katman) olarak kurgula.
- Class-based view iskeletini tasarla, `get - post gibi metod içeriklerini sözde kod ile yaz`(services.py için lazım)


## FAZ 3 — Temel CRUD İşlevselliği

- İlan **ekleme, güncelleme, silme** view'larını testleriyle beraber yaz(örneğin bir get de 200 dönsün ve contextte `listings` anahtarı olsun)
- İlan **listeleme ve detay görüntüleme** view'larını oluştur.
- Yetkilendirme kurallarını uygula (sadece ilan sahibi kendi ilanını düzenleyebilsin/silebilsin).

## FAZ 4 — Arama ve Filtreleme

- Query building mantığını view'dan bağımsız, **ayrı bir modül** olarak yani search.py olarak tasarlıcaz. sonra örneğin `search_listings()` üzerinden viewda kullanılcak.
- Fiyat aralığı, konum, kategoriye özel alanlar (marka/model, oda sayısı vb.) üzerinden filtreleme desteği ekle.
- Arama sonuçlarının performansını (N+1 query problemi gibi) kontrol et.
(Dataloader falan çözüyor)

## FAZ 5 — Kullanıcı Hesabı ve Profil

- `accounts` app'i altında **register/login/logout/profil** akışlarını kur.
- Kullanıcının **kendi ilanlarını görebildiği** profil/dashboard sayfasını oluştur.
- profil sayfası mvp için basit olcak

## FAZ 6 — Ek Özellikler (Kapsam Genişletme)

- İlan **şikayet etme** mekanizmasını (`is_reported`, `reported_at`) ve admin tarafından kaldırma akışını uygula.

## FAZ 7 — Dokümantasyon ve Sunum Hazırlığı

- Dökümantasyonu son haline çevir.
