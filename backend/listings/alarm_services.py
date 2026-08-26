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
    # alarm which triggers when the price change happens
    # price_change alarm
    if old_price is None or new_price is None or Decimal(str(old_price)) == Decimal(str(new_price)):
        return

    old_price_dec = Decimal(str(old_price))
    new_price_dec = Decimal(str(new_price))
    is_price_drop = new_price_dec < old_price_dec

    # 1. get favorited users
    target_user_ids = set(
        Favorite.objects.filter(listing_id=listing_pk).values_list(
            "user_id", flat=True)
    )

    # 2. get price_change alarm users
    alarm_user_ids = Alarm.objects.filter(
        listing_id=listing_pk,
        alarm_type="price_change",
        is_active=True
    ).values_list("user_id", flat=True)
    target_user_ids.update(alarm_user_ids)

    if not target_user_ids:  # no users to notify
        print(
            f"[ALARM] İlan #{listing_pk} için fiyat değişti ({old_price} -> {new_price}) fakat bilgilendirilecek kullanıcı bulunamadı.")
        return

    # notification messages
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

    # bulk create the notifications
    notifications = [
        Notification(
            user_id=user_id,
            listing_id=listing_pk,
            message=message,
        )
        for user_id in target_user_ids
    ]

    Notification.objects.bulk_create(notifications)
    print(f"{len(notifications)} kişiye bildirim başarıyla kaydedildi!")


def process_favorite_updated_notifications(listing_pk):
    # if any part of the listing changes other than price, send notification
    # favorite_updated alarm
    target_user_ids = set(
        Favorite.objects.filter(listing_id=listing_pk).values_list(
            "user_id", flat=True)
    )

    alarm_user_ids = Alarm.objects.filter(
        listing_id=listing_pk,
        alarm_type="favorite_updated",
        is_active=True
    ).values_list("user_id", flat=True)
    target_user_ids.update(alarm_user_ids)

    if not target_user_ids:
        return

    listing = Listing.objects.filter(pk=listing_pk).only("title").first()
    if not listing:
        return

    message = f"Favori ilanınız güncellendi: {listing.title}"

    # bulk notification creation
    notifications = [
        Notification(
            user_id=user_id,
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

    filters = {  # base filter for created or new updated listings
        "listing_update__gt": alarm.last_checked or alarm.created_at,
    }
    # add param filters based on the category mappings
    for key, lookup in category_lookups.items():
        if key in params and params[key]:
            val = params[key]
            filters[lookup] = [val] if (lookup.endswith(
                "__in") and not isinstance(val, list)) else val

    # get all the model objects that satisfied all criteria
    matched = list(
        model_class.objects.filter(**filters)
        # exclude the listing owner from notification receivers
        .exclude(listing_owner=alarm.user)
        .only("id", "title")
    )

    # send notifications
    if matched:
        notifications = [
            Notification(
                user=alarm.user,
                listing_id=item.id,
                message=f"Kriterlerinize uygun yeni ilan: {item.title}",
            )
            for item in matched
        ]
        Notification.objects.bulk_create(notifications)

    # update timestamp
    alarm.last_checked = timezone.now()
    alarm.save(update_fields=["last_checked"])
    return len(matched)
