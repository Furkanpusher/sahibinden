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




✅ Tamamlananlar
Alarm modeli → tüm field'lar, choices, migration uygulandı
AlarmSerializer → GET için nested listing, POST/PUT için listing_id, params, is_active

📋 Kalanlar
Backend:
 View → AlarmViewSet (list, create, update, destroy) + perform_create'te user=request.user
 URL → api/alarms/ endpoint'e ekle
 tasks.py → AlarmChecker base + NewListingAlarm, PriceDropAlarm, BackInStockAlarm, ViewCountAlarm, FavoriteAlarm checker'ları
 Celery Beat → 5dk'da bir track_alarms() görevi
Frontend:

 Alarm kurma UI (kullanıcı alarm tipi + parametrelerini seçer)
 Alarmlarım sayfası (aktif alarmları listele, sil, pasifleştir)
Nereden devam edelim? Ben View + URL öneririm, 10 dakika iş, sonra direkt test edebilirsin.








Profile Picture Fallback (Approach 2):
- Keep `profile_picture = models.ImageField(..., blank=True, null=True)` in CustomUser model without hardcoded default in DB.
- Use a dynamic model `@property` or DRF `SerializerMethodField` (`avatar_url`) that returns `user.profile_picture.url` if uploaded, otherwise returns a fallback static/default avatar URL.
- Benefits: Keeps database clean (no media pollution), prevents accidental shared file deletion on user cleanup, and allows changing default avatar design anytime with zero DB migrations.


# api/listings/cars speed : 40,0601
# api/listings/house speed: 39,0232

# cache api/listings/cars speed :  13,2518
# cache api/listings/house speed:  15,5752