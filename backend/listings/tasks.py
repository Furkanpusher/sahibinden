from celery import shared_task
from listings.models import Alarm
from listings.alarm_services import (
    process_price_change_notifications,
    process_favorite_updated_notifications,
    process_criteria_matching_listing_notifications,
)


@shared_task
def price_update_notification(old_price, new_price, listing_pk):
    process_price_change_notifications(old_price, new_price, listing_pk)


@shared_task
def listing_updated_notification(listing_pk):
    process_favorite_updated_notifications(listing_pk)


@shared_task
def check_new_listing_alarms():
    """
    Periodic task (runs every 5 minutes via Celery Beat).
    Scans all active 'new_listing_check' alarms and notifies users of matches.
    """
    active_alarms = Alarm.objects.filter(
        alarm_type="new_listing_check",
        is_active=True
    ).select_related("user")

    total_notifications = 0
    for alarm in active_alarms:
        total_notifications += process_criteria_matching_listing_notifications(alarm)

    return f"Processed {active_alarms.count()} alarms, created {total_notifications} notifications."
