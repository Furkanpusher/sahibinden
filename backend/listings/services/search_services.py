from ..documents import CarListingDocument, HouseListingDocument


def format_hit(hit, index_name=None):
    # Formats an Elasticsearch hit into a clean python dictionary
    data = hit.to_dict()
    data['id'] = int(hit.meta.id) if hasattr(
        hit, 'meta') and hasattr(hit.meta, 'id') else data.get('id')
    if index_name:
        data['category'] = 'car' if 'car' in index_name else 'house'
    return data


def apply_term_filter(s, field_name, value):
    if value in (None, "", []):
        return s
    if isinstance(value, (list, tuple, set)):
        clean_list = [v for v in value if v not in (None, "")]
        if clean_list:
            return s.filter("terms", **{field_name: clean_list})
        return s
    return s.filter("term", **{field_name: value})


def apply_range_filter(s, field_name, min_val=None, max_val=None):
    # Applies numeric range filter (gte/lte) to min max fields
    if min_val in (None, "") and max_val in (None, ""):
        return s
    r = {}
    if min_val not in (None, ""):
        try:
            r["gte"] = float(min_val)
        except (ValueError, TypeError):
            pass
    if max_val not in (None, ""):
        try:
            r["lte"] = float(max_val)
        except (ValueError, TypeError):
            pass
    if r:
        return s.filter("range", **{field_name: r})
    return s


def normalize_transmission(value):
    if not value:
        return value

    def _norm(v):
        if not isinstance(v, str):
            return [v]
        cleaned = v.strip().lower().replace("ı", "i").replace("İ", "i")
        if cleaned in ("otomatik", "automatic"):
            return ["Otomatik", "otomatik"]
        if cleaned in ("duz", "düz", "manuel", "manual"):
            return ["Düz", "düz", "manuel"]
        if cleaned in ("yari otomatik", "yarı otomatik"):
            return ["Yarı Otomatik", "yarı otomatik"]
        return [v]

    if isinstance(value, (list, tuple, set)):
        res = []
        for v in value:
            res.extend(_norm(v))
        return list(set(res))

    return _norm(value)


def normalize_brand(value):
    if not value:
        return value

    def _norm(b):
        if not isinstance(b, str):
            return [b]
        b_clean = b.strip()
        if b_clean.lower() in ("mercedes-benz", "mercedes - benz", "mercedes"):
            return ["Mercedes-Benz", "Mercedes - Benz"]
        return [b_clean]

    if isinstance(value, (list, tuple, set)):
        res = []
        for b in value:
            res.extend(_norm(b))
        return list(set(res))

    return _norm(value)


def search_car_listings(
    q=None,
    brand=None,
    model=None,
    city=None,
    district=None,
    transmission_type=None,
    min_price=None,
    max_price=None,
    max_km=None,
    sort='-listing_date',
    page=1,
    page_size=20,
    **kwargs
):
    s = CarListingDocument.search()

    # 1. Full text search
    if q:
        s = s.query(
            "multi_match",
            query=q,
            fields=["title^3", "brand^2", "model^2", "series", "city", "district"],
            fuzziness="AUTO"
        )

    # 2. Filters
    s = apply_term_filter(s, "brand.raw", normalize_brand(brand or kwargs.get("brands")))
    s = apply_term_filter(s, "model.raw", model or kwargs.get("models"))
    s = apply_term_filter(s, "city", city)
    s = apply_term_filter(s, "district", district)
    s = apply_term_filter(s, "transmission_type", normalize_transmission(transmission_type or kwargs.get("transmission_types")))

    # 3. Numeric Range filters (Fiyat, KM)
    s = apply_range_filter(s, "price", min_price or kwargs.get("price_min"), max_price or kwargs.get("price_max"))
    s = apply_range_filter(s, "km", max_val=max_km or kwargs.get("km_max"))

    s = s.sort(sort or '-listing_date')

    # Pagination
    start = (int(page) - 1) * int(page_size)
    end = start + int(page_size)
    s = s[start:end]

    response = s.execute()
    total = response.hits.total.value if hasattr(
        response.hits.total, 'value') else response.hits.total

    return {
        'count': total,
        'total': total,
        'page': int(page),
        'page_size': int(page_size),
        'results': [format_hit(hit, 'cars') for hit in response]
    }


def search_house_listings(
    q=None,
    city=None,
    district=None,
    number_of_rooms=None,
    floor=None,
    min_price=None,
    max_price=None,
    min_meter_squared=None,
    sort='-listing_date',
    page=1,
    page_size=20,
    **kwargs
):
    s = HouseListingDocument.search()

    # 1. Full text search
    if q:
        s = s.query(
            "multi_match",
            query=q,
            fields=["title^3", "city^2", "district",
                    "number_of_rooms", "floor"],
            fuzziness="AUTO"
        )

    # 2. Filters
    s = apply_term_filter(s, "city", city)
    s = apply_term_filter(s, "district", district)
    s = apply_term_filter(s, "number_of_rooms", number_of_rooms)
    s = apply_term_filter(s, "floor", floor)

    # 3. Range filters
    s = apply_range_filter(s, "price", min_price or kwargs.get("price_min"), max_price or kwargs.get("price_max"))
    s = apply_range_filter(s, "meter_squared", min_val=min_meter_squared)

    s = s.sort(sort or '-listing_date')

    # Pagination
    start = (int(page) - 1) * int(page_size)
    end = start + int(page_size)
    s = s[start:end]

    response = s.execute()
    total = response.hits.total.value if hasattr(
        response.hits.total, 'value') else response.hits.total

    return {
        'count': total,
        'total': total,
        'page': int(page),
        'page_size': int(page_size),
        'results': [format_hit(hit, 'houses') for hit in response]
    }
