from django.core.cache import cache


# all cache management logic will be here

CACHE_TIMEOUT = 60 * 60  # 1 hour
CACHEABLE_PAGES = {"1", "2"}

CAR_CACHE_PREFIX = "car_listings_page"
HOUSE_CACHE_PREFIX = "house_listings_page"


def get_cached_listing_page(prefix, request):
    # if the request has no active filters, and is page 1 or 2, return cached data
    page_number = str(request.query_params.get("page", "1"))

    # Check if there are real, non-empty filter parameters other than page & page_size
    has_custom_filters = any(
        key not in {"page", "page_size"} and str(value).strip() != ""
        for key, value in request.query_params.items()
    )
    is_cacheable = (not has_custom_filters) and (
        page_number in CACHEABLE_PAGES)

    if not is_cacheable:
        return None, None

    cache_key = f"{prefix}_{page_number}"
    cached_data = cache.get(cache_key)
    return cache_key, cached_data


def set_cached_listing_page(cache_key, data):
    # write the cache data with the right cache key and timeout
    if cache_key:
        cache.set(cache_key, data, timeout=CACHE_TIMEOUT)


def flush_listing_cache(prefix):
    # if any listing is deleted, updated or created, flush the cache
    keys_to_delete = [f"{prefix}_{page}" for page in CACHEABLE_PAGES]
    cache.delete_many(keys_to_delete)
