from decimal import Decimal
from listings.models import Favorite, Alarm, Notification, Listing
from accounts.models import Follow


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
        a.user_id: a  # {}a.user_id : alarm object
        for a in Alarm.objects.filter(
            listing_id=listing_pk,
            alarm_type="price_change",
            is_active=True
        )
    }
    # keys are user_id's. we add them to target_user_ids.
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
        f"{len(target_user_ids)} kullanici bulundu!"
    )

    notifications = [
        Notification(
            user_id=user_id,
            # price_alarms[user_id] = alarm_id
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
            # because it is a non listing alarm, no listing_id here.
            user=alarm.user,
            alarm=alarm,  # alarm.type
            listing_id=item.id,
            message=f"Kriterlerinize uygun ilan bulundu: {item.title}",
        )
        for item in matched_listings
    ]
    return bulk_create_notifications(notifications)


def send_seller_followers_email(listing_pk):
    """
    Sends an email to all followers of a seller when a new listing is published
    via AbstractUser send_email() function.
    """
    listing = Listing.objects.select_related(
        "listing_owner").filter(pk=listing_pk).first()
    if not listing or not listing.listing_owner:
        return

    seller = listing.listing_owner
    seller_followers = seller.followers.select_related("follower")
    if not seller_followers.exists():
        return

    email_subject = f"Yeni İlan: {seller.username} bir ilan yayinladi"
    email_body = (
        f"Merhaba,\n\n"
        f"Takip ettiğiniz satici '{seller.username}' yeni bir ilan yayinladi!\n\n"
        f"Başlık: {listing.title}\n"
        f"Fiyat: {listing.price} ₺\n"
        f"Şehir: {listing.city}\n\n"
        f"İlani platformda görüntüleyebilirsiniz."
    )

    for follow in seller_followers:
        follower = follow.follower
        if follower.email:
            try:
                follower.email_user(
                    subject=email_subject,
                    message=email_body,
                    fail_silently=False,
                )
            except Exception as e:
                print(
                    f"[EMAIL ERROR] {follower.email} adresine mail gönderilemedi: {e}")


def send_seller_followers_notifications(listing_pk):
    """
    Creates in-app database notifications for all followers of a seller.
    """
    # get the listing and the owner
    listing = Listing.objects.select_related(
        "listing_owner").filter(pk=listing_pk).first()
    if not listing or not listing.listing_owner:
        return
    seller = listing.listing_owner

    # Get the seller's followers id's for sending in app notifications
    target_user_ids = set(
        seller.followers.values_list("follower_id", flat=True)
    )
    if not target_user_ids:
        return

    # set the message
    message = f"Takip ettiğiniz {seller.username} yeni bir ilan yayınladı: {listing.title}"

    # create the notifications
    notifications = [
        Notification(
            user_id=user_id,
            listing_id=listing_pk,
            message=message,
        )
        for user_id in target_user_ids
    ]
    bulk_create_notifications(notifications)
    print(
        f"[FOLLOW] Satıcı {seller.username} yeni ilan (#{listing_pk}) yayınladı, {len(notifications)} takipçiye bildirim iletildi."
    )
