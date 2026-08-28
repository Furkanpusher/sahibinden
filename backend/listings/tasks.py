from celery import shared_task
from listings.services.notification_services import (
    send_price_change_notifications,
    send_favorite_update_notifications,
    send_seller_followers_notifications,
)
from listings.services.alarm_services import (
    evaluate_all_active_criteria_alarms,
)


@shared_task
def price_update_notification(old_price, new_price, listing_pk):
    send_price_change_notifications(old_price, new_price, listing_pk)


@shared_task
def listing_updated_notification(listing_pk):
    send_favorite_update_notifications(listing_pk)


@shared_task
def check_new_listing_alarms():
    return evaluate_all_active_criteria_alarms()


@shared_task
def send_seller_followers_notification(listing_pk):
    send_seller_followers_notifications(listing_pk)
