from celery import shared_task
from listings.alarm_services import (
    process_price_change_notifications,
    process_favorite_updated_notifications,
)


@shared_task
def price_update_notification(old_price, new_price, listing_pk):
    process_price_change_notifications(old_price, new_price, listing_pk)


@shared_task
def listing_updated_notification(listing_pk):
    process_favorite_updated_notifications(listing_pk)
