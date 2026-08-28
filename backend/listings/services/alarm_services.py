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
from listings.services.notification_services import send_criteria_match_notifications

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


def evaluate_criteria_alarm(alarm):
    """
    Checks matching listings for a single 'new_listing_check' alarm
    and creates notifications for the alarm owner.
    """
    if alarm.alarm_type != "new_listing_check" or not alarm.is_active:
        return 0
    params = alarm.params or {}
    category = params.get("category", "car")
    config = CATEGORY_CONFIG.get(category)
    if not config:
        return 0

    model_class = config["model"]
    category_lookups = config["lookups"]

    # Build criteria filters
    filters = {}
    for key, lookup in category_lookups.items():
        if key in params and params[key]:
            val = params[key]
            if lookup.endswith("__in"):  # list
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

    # Exclude already notified listings for this alarm
    already_notified_ids = Notification.objects.filter(  # Check thsi
        alarm=alarm,
        listing_id__isnull=False,
    ).values_list("listing_id", flat=True)

    # Fetch matching listings not owned by alarm owner and not previously notified
    matched = list(
        model_class.objects.filter(**filters)
        .exclude(listing_owner=alarm.user)
        .exclude(id__in=already_notified_ids)
        .only("id", "title")
    )

    # Dispatch/Send notifications
    if matched:
        send_criteria_match_notifications(alarm, matched)

    alarm.last_checked = timezone.now()
    alarm.save(update_fields=["last_checked"])
    return len(matched)


def evaluate_all_active_criteria_alarms():
    """
    Orchestrates scanning all active 'new_listing_check' alarms.
    Used directly by the Celery periodic task.
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
