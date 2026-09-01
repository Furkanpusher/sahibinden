Yapacaklarım(öncelik listesine göre)

2. report etme, favoriler, admin tarafından kaldırabilme
3. profil sayfası kendi ilanlarını görebilme.

# viewsdaki reportdan devam.


staff

staffuser
password123


env variables  DONE
pagination will move to the backend DONE
frontend folder structure DONE
response popups (used sonner) DONE
fiter problem DONE
profile
rediscachede listings in main listing page
PEP-8 DONE
fix the commentlines DONE
logout - login problem   DONE
while creating listing, remove the date part and make it auto_now_add = True DONE
reduce endpoints(from top level to bottom level group your endpoints) DONE
accces token süresi dolunca bir aksiyon alınca oturum süresi dolmuştur de logout edip logine yönlendir DONE

Price drop notification DONE
Comparing Module DONE


KATEGORİYE GÖRE ALARM KURMA 
AlarmChecker (base)
├── NewListingAlarm      → "şu kriterlerde ilan çıkınca haber ver"
├── PriceDropAlarm       → zaten var (price_update_notification)
├── BackInStockAlarm     → pasif ilan tekrar aktif olunca
├── ViewCountAlarm       → "ilanım X görüntülenmeye ulaşınca haber ver"  ← satıcı tarafı
├── FavoriteAlarm        → "favorilediğin ilan güncellenince haber ver"
└── (ileride) PriceTargetAlarm → "fiyat X'in altına düşünce haber ver"














# api/listings/cars speed : 40,0601 ms 
# api/listings/house speed: 39,0232 ms 

# cache api/listings/cars speed :  13,2518 ms
# cache api/listings/house speed:  15,5752 ms







# json bırak backend ilçe kullan.


Adım 1: İlçe Koordinat Servisi (In-Memory Lookup)
Ürettiğiniz district_coordinates.json dosyasını backend ayağa kalktığında hafızaya (RAM) yükleyen küçük bir servis/fonksiyon tasarlanır.
Bu servis veriyi bir Python sözlüğü (Dictionary) olarak tutar: (Şehir, İlçe) -> (Enlem, Boylam).
Böylece diske tekrar tekrar gitmeden, mikrosaniyeler içinde O(1) hızında koordinat sorgulanır.


Adım 2: Hafif Harita Serializer'ı (Lightweight Serializer)
Haritaya özel sadece pinin ihtiyaç duyduğu alanları (id, title, price, image, city, district, listing_type) içeren sade bir Serializer hazırlanır.
Serializer, ilanın city ve district değerini alıp Adım 1'deki hafıza sözlüğünden latitude ve longitude değerlerini hesaplayıp JSON çıktısına ekler.


Adım 3: Harita API View'ı (MapListingsAPIView)
Haritaya özel bir APIView oluşturulur.
Bu View şu filtreleri kabul eder:
category: car veya house
city: Kullanıcı belirli bir ili seçtiyse (örn. İstanbul)
q: Arama çubuğuna yazılan metin
Veritabanından (veya Elasticsearch'ten) sadece harita için gerekli alanlar only() optimizasyonuyla minimum SQL yüküyle çekilir.


Adım 4: URL Rotasının Tanımlanması (urls.py)
backend/listings/urls.py altına path("map/", MapListingsAPIView.as_view(), name="map-listings") rotası eklenir.


Adım 5: Frontend'in Sadeleştirilmesi
Frontend tarafındaki (MapPage.jsx) iki ayrı arama endpoint'ini çağırıp birleştirme karmaşası kaldırılır.


















# race condition

# django silk






