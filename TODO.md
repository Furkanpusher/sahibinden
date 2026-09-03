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











# django silk






