from listings.models import HouseListing
 
empty_ones = HouseListing.objects.filter(title="")
print(f"Number of records to be updated: {empty_ones.count()}")
 
updated = 0
for house in empty_ones:
    parts = []
 
    if house.number_of_rooms:
        parts.append(house.number_of_rooms)
    if house.meter_squared:
        parts.append(f"{house.meter_squared} m²")
    if house.location:
        parts.append(house.location)
 
    new_title = " ".join(parts).strip() or f"Listing #{house.id}"
 
    house.title = new_title
    house.save(update_fields=["title"])
    updated += 1
 
print(f"Number of updated records: {updated}")
 