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
    # we only need term here because we don't support multiple terms in one key (yet)
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
    # gotta normalize the transmission_Type due to inconsistencies in the DB
    if not value:
        return value

    def _norm(v):
        if not isinstance(v, str):
            return v
        cleaned = v.strip().lower().replace("ı", "i").replace("İ", "i")
        if cleaned == "otomatik":
            return "Otomatik"
        if cleaned in ("duz", "düz", "manuel"):
            return "Düz"
        if cleaned in ("yari otomatik", "yarı otomatik"):
            return "Yarı Otomatik"
        return v

    if isinstance(value, (list, tuple, set)):
        return [_norm(v) for v in value]
    return _norm(value)


def search_car_listings(  # params we do the search with
    q=None,
    brand=None,
    brands=None,
    model=None,
    models=None,
    city=None,
    district=None,
    transmission_type=None,
    transmission_types=None,
    min_price=None,
    max_price=None,
    max_km=None,
    sort='-listing_date',
    page=1,  # just for output pagination in the frontend don't need it normally
    page_size=20,
    **kwargs
):
    s = CarListingDocument.search()

    # 1. Full text search across title, brand, model, series, city, district
    if q:
        s = s.query(
            "multi_match",
            query=q,
            fields=["title^3", "brand^2", "model^2",
                    "series", "city", "district"],
            fuzziness="AUTO"
        )

    # Exact & Multi-value filters (Dropdowns)
    s = apply_term_filter(s, "brand.raw", brands or brand)  # HAS TO BE RAW
    s = apply_term_filter(s, "model.raw", models or model)
    s = apply_term_filter(s, "city", city)
    s = apply_term_filter(s, "district", district)
    norm_trans = normalize_transmission(
        transmission_types or transmission_type)
    s = apply_term_filter(s, "transmission_type", norm_trans)

    # Numeric Range filters (Fiyat, Yıl, KM)
    eff_min_price = min_price
    eff_max_price = max_price

    s = apply_range_filter(s, "price", eff_min_price, eff_max_price)

    s = s.sort('-listing_date')

    # Pagination
    start = (int(page) - 1) * int(page_size)
    end = start + int(page_size)
    s = s[start:end]  # Elastic Search does this lazily.

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
    page=1,
    page_size=20,
    **kwargs
):

    s = HouseListingDocument.search()

    # Full text search across title, city, district, number of rooms, and floor number
    if q:
        s = s.query(
            "multi_match",
            query=q,
            fields=["title^3", "city^2", "district",
                    "number_of_rooms", "floor"],
            fuzziness="AUTO"
        )

    # Exact & Value filters
    s = apply_term_filter(s, "city", city)
    s = apply_term_filter(s, "district", district)
    s = apply_term_filter(s, "number_of_rooms", number_of_rooms)
    s = apply_term_filter(s, "floor", floor)

    s = apply_range_filter(s, "price", min_price, max_price)
    s = apply_range_filter(s, "meter_squared", min_val=min_meter_squared)

    s = s.sort('-listing_date')

    # Pagination & Execution
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
