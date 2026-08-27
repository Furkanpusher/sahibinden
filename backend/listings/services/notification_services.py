from decimal import Decimal
from listings.models import Favorite, Alarm, Notification, Listing


def bulk_create_notifications(notifications):
    """
    Helper function to bulk create notification objects if list is not empty.
    """
    if notifications:
        return Notification.objects.bulk_create(notifications)
    return []


def send_price_change_notifications(old_price, new_price, listing_pk):
    """
    Sends notifications to users who favorited the listing or created a price change alarm.
    """
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

    bulk_create_notifications(notifications)
    print(f"{len(notifications)} kişiye bildirim başarıyla kaydedildi!")


def send_favorite_update_notifications(listing_pk):
    """
    Sends notifications when a favorited listing gets updated.
    """
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

    bulk_create_notifications(notifications)
    print(
        f"[ALARM] İlan #{listing_pk} güncellendi, {len(notifications)} kişiye bildirim iletildi."
    )


def send_criteria_match_notifications(alarm, matched_listings):
    """
    Creates and sends notifications for a user when their criteria alarm matches new listings.
    """
    if not matched_listings:
        return []

    notifications = [
        Notification(
            user=alarm.user,
            alarm=alarm,
            listing_id=item.id,
            message=f"Kriterlerinize uygun ilan bulundu: {item.title}",
        )
        for item in matched_listings
    ]
    return bulk_create_notifications(notifications)


# Aliases for backwards compatibility
process_price_change_notifications = send_price_change_notifications
process_favorite_updated_notifications = send_favorite_update_notifications
