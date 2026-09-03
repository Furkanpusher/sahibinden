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
    # Applies 'terms' filter if value is list/tuple/set, or 'term' if single value
    if value in (None, "", []):
        return s
    if isinstance(value, (list, tuple, set)):
        clean_list = [v for v in value if v not in (None, "")]
        if clean_list:
            return s.filter("terms", **{field_name: clean_list})
        return s
    return s.filter("term", **{field_name: value})


def apply_range_filter(s, field_name, min_val=None, max_val=None):
    # Applies numeric range filter (gte/lte) safely
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


def search_car_listings(
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
    page=1,
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

    # 2. Exact & Multi-value filters (Dropdowns)
    s = apply_term_filter(s, "brand.raw", brands or brand)
    s = apply_term_filter(s, "model.raw", models or model)
    s = apply_term_filter(s, "city", city)
    s = apply_term_filter(s, "district", district)
    s = apply_term_filter(s, "transmission_type",
                          transmission_types or transmission_type)

    # 3. Numeric Range filters (Fiyat, Yıl, KM)
    eff_min_price = min_price if min_price is not None else kwargs.get(
        'price_min')
    eff_max_price = max_price if max_price is not None else kwargs.get(
        'price_max')
    s = apply_range_filter(s, "price", eff_min_price, eff_max_price)

    # 4. Sorting
    sort_mapping = {
        'price_asc': 'price',
        'price_desc': '-price',
        'year_asc': 'year',
        'year_desc': '-year',
        'km_asc': 'km',
        'km_desc': '-km',
        'date_asc': 'listing_date',
        'date_desc': '-listing_date',
        '-listing_date': '-listing_date',
    }
    s = s.sort(sort_mapping.get(sort, '-listing_date'))

    # 5. Pagination & Execution
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
    building_aged=None,
    floor=None,
    floors=None,
    credit_eligibility=None,
    min_price=None,
    max_price=None,
    min_meter_squared=None,
    max_meter_squared=None,
    min_floors=None,
    max_floors=None,
    sort='-listing_date',
    page=1,
    page_size=20,
    **kwargs
):
    s = HouseListingDocument.search()

    # 1. Full text search across title, city, district, number of rooms, and floor number
    if q:
        s = s.query(
            "multi_match",
            query=q,
            fields=["title^3", "city^2", "district",
                    "number_of_rooms", "floor"],
            fuzziness="AUTO"
        )

    # 2. Exact & Multi-value filters
    s = apply_term_filter(s, "city", city)
    s = apply_term_filter(s, "district", district)
    s = apply_term_filter(s, "number_of_rooms", number_of_rooms)
    s = apply_term_filter(s, "building_aged", building_aged)
    s = apply_term_filter(s, "floor", floors or floor)

    if credit_eligibility is not None:
        credit_val = str(credit_eligibility).lower() in ['true', '1', 'yes'] if isinstance(
            credit_eligibility, str) else bool(credit_eligibility)
        s = s.filter("term", credit_eligibility=credit_val)

    # 3. Numeric Range filters (Price, m2, Floors)
    eff_min_price = min_price if min_price is not None else kwargs.get(
        'price_min')
    eff_max_price = max_price if max_price is not None else kwargs.get(
        'price_max')
    s = apply_range_filter(s, "price", eff_min_price, eff_max_price)

    eff_min_m2 = min_meter_squared if min_meter_squared is not None else kwargs.get(
        'meter_squared_min')
    eff_max_m2 = max_meter_squared if max_meter_squared is not None else kwargs.get(
        'meter_squared_max')
    s = apply_range_filter(s, "meter_squared", eff_min_m2, eff_max_m2)

    s = apply_range_filter(s, "number_of_floors", min_floors, max_floors)

    # 4. Sorting
    sort_mapping = {
        'price_asc': 'price',
        'price_desc': '-price',
        'meter_asc': 'meter_squared',
        'meter_desc': '-meter_squared',
        'date_asc': 'listing_date',
        'date_desc': '-listing_date',
        '-listing_date': '-listing_date',
    }
    s = s.sort(sort_mapping.get(sort, '-listing_date'))

    # 5. Pagination & Execution
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
