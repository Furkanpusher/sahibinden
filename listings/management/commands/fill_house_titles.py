from listings.models import HouseListing
 
bos_olanlar = HouseListing.objects.filter(title="")
print(f"Güncellenecek kayıt sayısı: {bos_olanlar.count()}")
 
guncellenen = 0
for house in bos_olanlar:
    parcalar = []
 
    if house.number_of_rooms:
        parcalar.append(house.number_of_rooms)
    if house.meter_squared:
        parcalar.append(f"{house.meter_squared} m²")
    if house.location:
        parcalar.append(house.location)
 
    yeni_baslik = " ".join(parcalar).strip() or f"İlan #{house.id}"
 
    house.title = yeni_baslik
    house.save(update_fields=["title"])
    guncellenen += 1
 
print(f"Güncellenen kayıt sayısı: {guncellenen}")
 