from ..documents import CarListingDocument, HouseListingDocument


def format_hit(hit, index_name=None):
    """Formats an Elasticsearch hit into a clean python dictionary."""
    data = hit.to_dict()
    data['id'] = int(hit.meta.id) if hasattr(
        hit, 'meta') and hasattr(hit.meta, 'id') else data.get('id')
    if index_name:
        data['category'] = 'car' if 'car' in index_name else 'house'
    return data


def apply_term_filter(s, field_name, value):
    """
    Applies Elasticsearch 'terms' filter if value is a list/tuple/set,
    or 'term' filter if it is a single value.
    """
    if value in (None, "", []):
        return s
    if isinstance(value, (list, tuple, set)):
        clean_list = [v for v in value if v not in (None, "")]
        if clean_list:
            return s.filter("terms", **{field_name: clean_list})
        return s
    return s.filter("term", **{field_name: value})


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
    fuel_type=None,
    body_type=None,
    color=None,
    for_trade=None,
    from_whom=None,
    min_price=None,
    max_price=None,
    price_min=None,
    price_max=None,
    min_year=None,
    max_year=None,
    year_min=None,
    year_max=None,
    min_km=None,
    max_km=None,
    km_min=None,
    km_max=None,
    sort='-listing_date',
    page=1,
    page_size=20,
    **kwargs
):
    """
    Elasticsearch search and filter function for Car Listings.
    Supports full-text fuzzy search, exact filters, multi-value list filters, and range queries.
    """
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

    # 2. Exact & Multi-value filters
    s = apply_term_filter(s, "brand.raw", brands or brand)
    s = apply_term_filter(s, "model.raw", models or model)
    s = apply_term_filter(s, "city", city)
    s = apply_term_filter(s, "district", district)
    s = apply_term_filter(s, "transmission_type", transmission_types or transmission_type)
    s = apply_term_filter(s, "fuel_type", fuel_type)
    s = apply_term_filter(s, "body_type", body_type)
    s = apply_term_filter(s, "color", color)
    s = apply_term_filter(s, "from_whom", from_whom)

    if for_trade is not None:
        trade_val = str(for_trade).lower() in ['true', '1', 'yes'] if isinstance(for_trade, str) else bool(for_trade)
        s = s.filter("term", for_trade=trade_val)

    # 3. Numeric Range filters (Price)
    effective_min_price = min_price if min_price is not None else price_min
    effective_max_price = max_price if max_price is not None else price_max
    if effective_min_price is not None or effective_max_price is not None:
        p_range = {}
        if effective_min_price not in (None, ""):
            p_range["gte"] = float(effective_min_price)
        if effective_max_price not in (None, ""):
            p_range["lte"] = float(effective_max_price)
        if p_range:
            s = s.filter("range", price=p_range)

    # Numeric Range filters (Year)
    effective_min_year = min_year if min_year is not None else year_min
    effective_max_year = max_year if max_year is not None else year_max
    if effective_min_year is not None or effective_max_year is not None:
        y_range = {}
        if effective_min_year not in (None, ""):
            y_range["gte"] = int(effective_min_year)
        if effective_max_year not in (None, ""):
            y_range["lte"] = int(effective_max_year)
        if y_range:
            s = s.filter("range", year=y_range)

    # Numeric Range filters (KM)
    effective_min_km = min_km if min_km is not None else km_min
    effective_max_km = max_km if max_km is not None else km_max
    if effective_min_km is not None or effective_max_km is not None:
        km_range = {}
        if effective_min_km not in (None, ""):
            km_range["gte"] = int(effective_min_km)
        if effective_max_km not in (None, ""):
            km_range["lte"] = int(effective_max_km)
        if km_range:
            s = s.filter("range", km=km_range)

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
    price_min=None,
    price_max=None,
    min_meter_squared=None,
    max_meter_squared=None,
    meter_squared_min=None,
    meter_squared_max=None,
    min_floors=None,
    max_floors=None,
    sort='-listing_date',
    page=1,
    page_size=20,
    **kwargs
):
    """
    Elasticsearch search and filter function for House Listings.
    Supports full-text fuzzy search, exact filters, multi-value list filters, and range queries.
    """
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
        credit_val = str(credit_eligibility).lower() in ['true', '1', 'yes'] if isinstance(credit_eligibility, str) else bool(credit_eligibility)
        s = s.filter("term", credit_eligibility=credit_val)

    # 3. Numeric Range filters (Price)
    effective_min_price = min_price if min_price is not None else price_min
    effective_max_price = max_price if max_price is not None else price_max
    if effective_min_price is not None or effective_max_price is not None:
        p_range = {}
        if effective_min_price not in (None, ""):
            p_range["gte"] = float(effective_min_price)
        if effective_max_price not in (None, ""):
            p_range["lte"] = float(effective_max_price)
        if p_range:
            s = s.filter("range", price=p_range)

    # Numeric Range filters (Meter squared)
    effective_min_m2 = min_meter_squared if min_meter_squared is not None else meter_squared_min
    effective_max_m2 = max_meter_squared if max_meter_squared is not None else meter_squared_max
    if effective_min_m2 is not None or effective_max_m2 is not None:
        m_range = {}
        if effective_min_m2 not in (None, ""):
            m_range["gte"] = int(effective_min_m2)
        if effective_max_m2 not in (None, ""):
            m_range["lte"] = int(effective_max_m2)
        if m_range:
            s = s.filter("range", meter_squared=m_range)

    # Numeric Range filters (Number of floors)
    if min_floors is not None or max_floors is not None:
        f_range = {}
        if min_floors not in (None, ""):
            f_range["gte"] = int(min_floors)
        if max_floors not in (None, ""):
            f_range["lte"] = int(max_floors)
        if f_range:
            s = s.filter("range", number_of_floors=f_range)

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
