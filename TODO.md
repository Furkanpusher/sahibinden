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






# favorite_removed alarm
# etc. remaining alarms



Refactor our backend service layer by converting `listings/services.py` and `listings/alarm_services.py` into a clean, modular `listings/services/` package.

### Context & Motivation
1. **Consistency**: Our `listings/views/` is already a clean package with separate files (`alarm.py`, `car.py`, `house.py`, `base.py`). The services layer should match this structure.
2. **Separation of Concerns**: Separate listing CRUD, alarm evaluation rules, and notification dispatching so the concepts don't overlap.
3. **Clean Naming**: Alarms are trigger rules that get evaluated; notifications are messages that get dispatched.

---

### Implementation Plan

1. **Create `backend/listings/services/` directory** and structure it with:
   - `__init__.py`: Re-export all service functions so existing imports like `from listings.services import ...` remain backwards-compatible.
   - `listing_services.py`: Listing CRUD operations, query helpers (`get_all_listings`, `get_listing_by_id`, `filter_listings`, `create_listing`, `update_listing`, `delete_listing`), favorites, and reports.
   - `alarm_services.py`: Alarm lifecycle (`create_alarm`, `delete_alarm`, `toggle_alarm`) and criteria matching (`evaluate_criteria_alarm`, `evaluate_all_active_criteria_alarms`).
   - `notification_services.py`: Message generation and dispatching (`dispatch_price_change_notifications`, `dispatch_favorite_update_notifications`, `bulk_create_notifications`).

2. **Clean up old root files**:
   - Remove the old monolithic `listings/services.py` and `listings/alarm_services.py`.

3. **Update `backend/listings/tasks.py`**:
   - Ensure task function names and imports reflect the new modular services cleanly.

4. **Verification**:
   - Run `docker compose exec backend python manage.py check` to verify there are no broken imports or syntax issues.






# images should be base64 ?
# photo uploading -- base 64





Profile Picture Fallback (Approach 2):
- Keep `profile_picture = models.ImageField(..., blank=True, null=True)` in CustomUser model without hardcoded default in DB.
- Use a dynamic model `@property` or DRF `SerializerMethodField` (`avatar_url`) that returns `user.profile_picture.url` if uploaded, otherwise returns a fallback static/default avatar URL.
- Benefits: Keeps database clean (no media pollution), prevents accidental shared file deletion on user cleanup, and allows changing default avatar design anytime with zero DB migrations.


# api/listings/cars speed : 40,0601
# api/listings/house speed: 39,0232

# cache api/listings/cars speed :  13,2518
# cache api/listings/house speed:  15,5752