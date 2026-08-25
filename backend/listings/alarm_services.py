from decimal import Decimal
from listings.models import Favorite, Alarm, Notification, Listing


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
