from listings.services.search_services import (
    search_car_listings,
    search_house_listings,
)
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from listings.models import (
    Alarm,
    Listing,
    CarListing,
    HouseListing,
    Notification,
)


MAX_ALARMS_PER_USER = 5


def can_user_create_new_alarm(user):
    """
    Returns True if user has fewer than MAX_ALARMS_PER_USER active alarms, False otherwise.
    """
    active_alarms_count = Alarm.objects.filter(
        user=user, is_active=True).count()
    if active_alarms_count >= MAX_ALARMS_PER_USER:
        return False
    return True


def create_alarm(alarm_type, params, listing_id, user):
    """
    Creates an alarm for the given user, validating alarm constraints.
    """
    if not can_user_create_new_alarm(user):
        raise ValidationError(
            "You can have maximum 5 active alarms. Please delete or deactivate an existing alarm before creating a new one."
        )

    # LISTING_REQUIRED
    if alarm_type in Alarm.LISTING_REQUIRED:   # price_change, favorite_updated, new_listing_check
        if not listing_id:
            raise ValidationError(
                "For this alarm type, the listing must be specified."
            )
        listing = get_object_or_404(Listing, pk=listing_id)
        if listing.listing_owner == user:    # if the owner creates an alarm for his own listing
            raise ValidationError(
                "You cannot create an alarm for your own listing."
            )

        created_alarm = Alarm.objects.create(
            alarm_type=alarm_type,
            listing=listing,
            user=user,
            params={},
            is_active=True,
        )
        return created_alarm

    # NON_LISTING_REQUIRED
    if alarm_type in Alarm.NON_LISTING_REQUIRED:
        if not params:
            raise ValidationError("Params are required for this alarm type.")

        created_alarm = Alarm.objects.create(
            alarm_type=alarm_type,
            user=user,
            params=params,
            is_active=True,
            last_checked=timezone.now(),
        )
        return created_alarm

    raise ValidationError("Invalid alarm type")


def delete_alarm(user, pk):
    """
    Deletes an alarm (only owner can delete).
    """
    alarm = get_object_or_404(Alarm, pk=pk)
    if alarm.user != user:
        raise PermissionDenied("You can only delete your own alarm.")
    alarm.delete()
    return True


def toggle_alarm(user, pk):
    """
    Toggles active/inactive state of an alarm.
    """
    alarm = get_object_or_404(Alarm, pk=pk)
    if alarm.user != user:
        raise PermissionDenied("You can only deactivate your own alarm.")

    # If alarm is inactive and user cannot add more alarms (already has 5 active alarms)
    if not alarm.is_active and not can_user_create_new_alarm(user):
        raise ValidationError(
            "You can have maximum 5 active alarms. Please delete or deactivate an existing alarm before creating a new one."
        )

    alarm.is_active = not alarm.is_active
    alarm.save()
    return alarm.is_active


def evaluate_criteria_alarm(alarm):
    """
    Checks matching listings for a single 'new_listing_check' alarm using Elasticsearch
    and creates notifications for the alarm owner.
    """
    if alarm.alarm_type != "new_listing_check" or not alarm.is_active:
        return 0

    params = dict(alarm.params or {})
    category = params.pop("category", "car")

    # 1. Choose the right Elasticsearch search function
    search_func = search_house_listings if category == "house" else search_car_listings

    # 2. Run Elasticsearch query with alarm parameters
    try:
        search_result = search_func(**params, page=1, page_size=50)
        matched_hits = search_result.get("results", [])
    except Exception as e:
        print(
            f"[ALARM ERROR] Elasticsearch search failed for alarm #{alarm.id}: {e}")
        return 0

    if not matched_hits:
        # didn't found any lists for that alarm, update the last_checked for periodic checks
        alarm.last_checked = timezone.now()
        alarm.save(update_fields=["last_checked"])
        return 0

    # Skip owner's own listings and already notified listings
    new_count = 0
    for hit in matched_hits:
        listing_id = hit.get("id")
        if not listing_id:
            continue

        # Skip owner's own listings
        if hit.get("owner_id") == alarm.user_id:
            continue

        # Skip already notified listings for this alarm
        if Notification.objects.filter(alarm=alarm, listing_id=listing_id).exists():
            continue

        # Create notification for new matches
        Notification.objects.create(
            user=alarm.user,
            alarm=alarm,
            listing_id=listing_id,
            message=f"Kriterlerinize uygun ilan bulundu: {hit.get('title', 'İlan')}"
        )
        new_count += 1

    alarm.last_checked = timezone.now()
    alarm.save(update_fields=["last_checked"])
    return new_count


def evaluate_all_active_criteria_alarms():
    """
    Orchestrates scanning all active 'new_listing_check' alarms.
    Used directly by the Celery Beat periodic task.
    """
    active_alarms = Alarm.objects.filter(
        alarm_type="new_listing_check",
        is_active=True
    ).select_related("user")

    total_notifications = 0
    for alarm in active_alarms:
        total_notifications += evaluate_criteria_alarm(alarm)

    return f"Processed {active_alarms.count()} alarms, created {total_notifications} notifications."


# Aliases for backwards compatibility
process_criteria_match_notifications = evaluate_criteria_alarm
process_all_new_listing_notifications = evaluate_all_active_criteria_alarms
