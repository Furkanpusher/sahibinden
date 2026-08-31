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






# users will be able to follow sellers, when seller creates a new listing, the follower will get a notification

# also in the detail page. when click to seller, it should go to all the listings of that seller


# DONE
Phase 1: Database & Model Design
Create an Explicit Follow Relation:
An intermediate model linking follower (User) and seller (User).
Add a created_at timestamp.
Add a unique constraint on (follower, seller) so a user cannot follow the same seller twice.
Add validation to prevent a user from following themselves.


# DONE
Phase 2: Follow Management APIs
Follow / Unfollow Endpoint:
An authenticated endpoint (e.g., POST /api/sellers/{id}/follow/ or toggle action) to follow/unfollow a seller.
Follow Status & Count Endpoint:
Return follower count for the seller.
Return a boolean flag (is_following: true/false) when the authenticated user views a seller's profile or listing.
"Sellers I Follow" List Endpoint:
For the user's dashboard/settings to view and manage all sellers they currently follow.


# DONE
Phase 3: Seller Showcase / Public Profile API
Seller Listings Endpoint:
An endpoint (e.g., GET /api/sellers/{id}/listings/ or filtering GET /api/listings/?owner={id}) that returns all active listings by that seller.
Support your existing pagination, sorting, and category filters.
Seller Profile Summary:
Include public details: name/store name, join date, total active listings count, and follower count.


# DONE
Phase 4: Notification Trigger Logic
Hook into Listing Creation:
When a new listing is successfully published (status = active):
Query the seller's active followers via the relationship.
Bulk-create Notification records for all followers (e.g., "X published a new listing: [Title]").
Link each notification directly to the new listing_id.


# IN PROGRESS
Phase 5: Frontend UI / UX
Listing Detail Page:
In the seller info card, make the seller's name/avatar a clickable link to their profile page.
Add a dynamic "Takip Et" (Follow) / "Takip Ediliyor" (Following) button right next to the seller's name.
Seller Profile Page (/sellers/:id or /users/:id/listings):
Header: Seller avatar, username/store name, member since date, total listings count, and Follow button.
Content Grid: Display all car/house listings owned by this seller.
Notification Integration:
When a follower clicks a "New listing from followed seller" notification, route them directly to the new listing detail page.






# Map
# Mail



# api/listings/cars speed : 40,0601 ms 
# api/listings/house speed: 39,0232 ms 

# cache api/listings/cars speed :  13,2518 ms
# cache api/listings/house speed:  15,5752 ms




# Harita, leaflet # 3
# Elastic Search # 1
# Mail # 2
# Performance # 4

# REFRESH TOKEN SENDS TO /LOGIN
