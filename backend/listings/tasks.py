from listings.models import Favorite, Notification
# pyrefly: ignore [missing-import]
from celery import shared_task


@shared_task
def price_update_notification(old_price, new_price, listing_pk):
    if old_price and new_price and old_price > new_price:
        # find users who have that listing favorited
        user_ids = Favorite.objects.filter(
            listing_id=listing_pk).values_list("user_id", flat=True)

        if not user_ids:
            return

        # create notifications in bulk
        notifications = []
        for user_id in user_ids:
            obj = Notification(
                user_id=user_id,
                listing_id=listing_pk,
                message=f"Fiyat düştü: {old_price} -> {new_price}",
                old_price=old_price,
                new_price=new_price
            )
            notifications.append(obj)
        Notification.objects.bulk_create(notifications)  # only 1 sql query
