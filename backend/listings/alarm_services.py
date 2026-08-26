from decimal import Decimal
from django.utils import timezone
from listings.models import (
    Favorite,
    Alarm,
    Notification,
    Listing,
    CarListing,
    HouseListing,
)


def process_price_change_notifications(old_price, new_price, listing_pk):
    if old_price is None or new_price is None or Decimal(str(old_price)) == Decimal(str(new_price)):
        return

    old_price_dec = Decimal(str(old_price))
    new_price_dec = Decimal(str(new_price))
    is_price_drop = new_price_dec < old_price_dec

    target_user_ids = set(
        Favorite.objects.filter(listing_id=listing_pk).values_list(
            "user_id", flat=True)
    )

    price_alarms = {
        a.user_id: a
        for a in Alarm.objects.filter(
            listing_id=listing_pk,
            alarm_type="price_change",
            is_active=True
        )
    }
    target_user_ids.update(price_alarms.keys())

    if not target_user_ids:
        return

    if is_price_drop:
        message = f"Fiyat düştü: {old_price} -> {new_price}"
        log_type = "FİYAT DÜŞÜŞÜ"
    else:
        message = f"Fiyat güncellendi: {old_price} -> {new_price}"
        log_type = "FİYAT ARTIŞI"

    print(
        f"[NOTIFICATION] İlan #{listing_pk} için {log_type} ({old_price} -> {new_price}). "
        f"{len(target_user_ids)} kullanıcı bulundu!"
    )

    notifications = [
        Notification(
            user_id=user_id,
            alarm=price_alarms.get(user_id),
            listing_id=listing_pk,
            message=message,
        )
        for user_id in target_user_ids
    ]

    Notification.objects.bulk_create(notifications)
    print(f"{len(notifications)} kişiye bildirim başarıyla kaydedildi!")


def process_favorite_updated_notifications(listing_pk):
    target_user_ids = set(
        Favorite.objects.filter(listing_id=listing_pk).values_list(
            "user_id", flat=True)
    )

    fav_alarms = {
        a.user_id: a
        for a in Alarm.objects.filter(
            listing_id=listing_pk,
            alarm_type="favorite_updated",
            is_active=True
        )
    }
    target_user_ids.update(fav_alarms.keys())

    if not target_user_ids:
        return

    listing = Listing.objects.filter(pk=listing_pk).only("title").first()
    if not listing:
        return

    message = f"Favori ilanınız güncellendi: {listing.title}"

    notifications = [
        Notification(
            user_id=user_id,
            alarm=fav_alarms.get(user_id),
            listing_id=listing_pk,
            message=message,
        )
        for user_id in target_user_ids
    ]

    Notification.objects.bulk_create(notifications)
    print(
        f"[ALARM] İlan #{listing_pk} güncellendi, {len(notifications)} kişiye bildirim iletildi.")


# Maps simple frontend param names directly to Django query lookups
CATEGORY_CONFIG = {
    "car": {
        "model": CarListing,
        "lookups": {
            "min_price": "price__gte",
            "max_price": "price__lte",
            "brands": "brand__in",
            "transmission_types": "transmission_type__in",
            "max_km": "km__lte",
        },
    },
    "house": {
        "model": HouseListing,
        "lookups": {
            "min_price": "price__gte",
            "max_price": "price__lte",
            "number_of_rooms": "number_of_rooms__in",
            "min_meter_squared": "meter_squared__gte",
            "floor": "floor__in",
        },
    },
}


def process_criteria_matching_listing_notifications(alarm):
    if alarm.alarm_type != "new_listing_check" or not alarm.is_active:
        return 0
    params = alarm.params or {}
    category = params.get("category", "car")
    config = CATEGORY_CONFIG.get(category)
    if not config:
        return 0

    model_class = config["model"]
    category_lookups = config["lookups"]

    # Kriter filtrelerini oluştur
    filters = {}
    for key, lookup in category_lookups.items():
        if key in params and params[key]:
            val = params[key]
            if lookup.endswith("__in"):
                raw_list = val if isinstance(val, list) else [val]
                expanded = set()
                for item in raw_list:
                    if isinstance(item, str):
                        expanded.add(item)
                        expanded.add(item.lower())
                        expanded.add(item.capitalize())
                        expanded.add(item.upper())
                        if item.lower() in ("manuel", "düz"):
                            expanded.update(["manuel", "Manuel", "Düz", "düz"])
                    else:
                        expanded.add(item)
                filters[lookup] = list(expanded)
            else:
                filters[lookup] = val

    # Yalnızca bu alarma ait daha önce bildirilmiş ilanları hariç tut
    already_notified_ids = Notification.objects.filter(
        alarm=alarm,
        listing_id__isnull=False,
    ).values_list("listing_id", flat=True)

    # Kriterleri sağlayan, kendi ilanı olmayan ve henüz bildirilmemiş olanları getir
    matched = list(
        model_class.objects.filter(**filters)
        .exclude(listing_owner=alarm.user)
        .exclude(id__in=already_notified_ids)
        .only("id", "title")
    )

    # Bildirimleri oluştur
    if matched:
        notifications = [
            Notification(
                user=alarm.user,
                alarm=alarm,
                listing_id=item.id,
                message=f"Kriterlerinize uygun ilan bulundu: {item.title}",
            )
            for item in matched
        ]
        Notification.objects.bulk_create(notifications)

    alarm.last_checked = timezone.now()
    alarm.save(update_fields=["last_checked"])
    return len(matched)
