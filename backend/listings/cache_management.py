from django.core.cache import cache


# all cache management logic will be here

CACHE_TIMEOUT = 60 * 60  # 1 hour
CACHEABLE_PAGES = {"1", "2"}

# Prefix Tanımları
CAR_CACHE_PREFIX = "car_listings_page"
HOUSE_CACHE_PREFIX = "house_listings_page"


def get_cached_listing_page(prefix, request):
    # if the request has no filters, and is page 1 or 2, return cached data
    page_number = request.query_params.get("page", "1")
    has_custom_filters = any(key != "page" for key in request.query_params)
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


def invalidate_listing_cache(prefix):
    # if any listing is deleted, updated or created, flush the cache
    keys_to_delete = [f"{prefix}_{page}" for page in CACHEABLE_PAGES]
    cache.delete_many(keys_to_delete)
