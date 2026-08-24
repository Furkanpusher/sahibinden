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
show the listing owner info in the detail page IN PROGRESS
add a profile page, so user can modify his/her information
make itl ook like sahibinden homepage



Profile Picture Fallback (Approach 2):
- Keep `profile_picture = models.ImageField(..., blank=True, null=True)` in CustomUser model without hardcoded default in DB.
- Use a dynamic model `@property` or DRF `SerializerMethodField` (`avatar_url`) that returns `user.profile_picture.url` if uploaded, otherwise returns a fallback static/default avatar URL.
- Benefits: Keeps database clean (no media pollution), prevents accidental shared file deletion on user cleanup, and allows changing default avatar design anytime with zero DB migrations.


# api/listings/cars speed : 40,0601
# api/listings/house speed: 39,0232

# cache api/listings/cars speed :  13,2518
# cache api/listings/house speed:  15,5752