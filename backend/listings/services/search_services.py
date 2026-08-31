from ..documents import CarListingDocument, HouseListingDocument


def format_hit(hit, index_name=None):
    """Formats an Elasticsearch hit into a clean python dictionary."""
    data = hit.to_dict()
    data['id'] = int(hit.meta.id) if hasattr(hit, 'meta') and hasattr(hit.meta, 'id') else data.get('id')
    if index_name:
        data['category'] = 'car' if 'car' in index_name else 'house'
    return data


def search_car_listings(
    q=None,
    brand=None,
    model=None,
    city=None,
    district=None,
    transmission_type=None,
    fuel_type=None,
    body_type=None,
    color=None,
    for_trade=None,
    from_whom=None,
    min_price=None,
    max_price=None,
    min_year=None,
    max_year=None,
    min_km=None,
    max_km=None,
    sort='-listing_date',
    page=1,
    page_size=20
):
    """
    Elasticsearch search and filter function for Car Listings.
    """
    s = CarListingDocument.search()

    # Full text search across title, brand, model, series
    if q:
        s = s.query(
            "multi_match",
            query=q,
            fields=["title^3", "brand^2", "model^2", "series"],
            fuzziness="AUTO"
        )

    # Exact filters
    if brand:
        s = s.filter("term", **{"brand.raw": brand})
    if model:
        s = s.filter("term", **{"model.raw": model})
    if city:
        s = s.filter("term", city=city)
    if district:
        s = s.filter("term", district=district)
    if transmission_type:
        s = s.filter("term", transmission_type=transmission_type)
    if fuel_type:
        s = s.filter("term", fuel_type=fuel_type)
    if body_type:
        s = s.filter("term", body_type=body_type)
    if color:
        s = s.filter("term", color=color)
    if from_whom:
        s = s.filter("term", from_whom=from_whom)
    if for_trade is not None:
        s = s.filter("term", for_trade=for_trade)

    # Range filters
    if min_price or max_price:
        p_range = {}
        if min_price is not None:
            p_range["gte"] = float(min_price)
        if max_price is not None:
            p_range["lte"] = float(max_price)
        s = s.filter("range", price=p_range)

    if min_year or max_year:
        y_range = {}
        if min_year is not None:
            y_range["gte"] = int(min_year)
        if max_year is not None:
            y_range["lte"] = int(max_year)
        s = s.filter("range", year=y_range)

    if min_km or max_km:
        km_range = {}
        if min_km is not None:
            km_range["gte"] = int(min_km)
        if max_km is not None:
            km_range["lte"] = int(max_km)
        s = s.filter("range", km=km_range)

    # Sorting
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

    # Pagination
    start = (int(page) - 1) * int(page_size)
    end = start + int(page_size)
    s = s[start:end]

    response = s.execute()
    total = response.hits.total.value if hasattr(response.hits.total, 'value') else response.hits.total

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
    credit_eligibility=None,
    min_price=None,
    max_price=None,
    min_meter_squared=None,
    max_meter_squared=None,
    min_floors=None,
    max_floors=None,
    sort='-listing_date',
    page=1,
    page_size=20
):
    """
    Elasticsearch search and filter function for House Listings.
    """
    s = HouseListingDocument.search()

    # Full text search across title, city, district
    if q:
        s = s.query(
            "multi_match",
            query=q,
            fields=["title^3", "city^2", "district"],
            fuzziness="AUTO"
        )

    # Exact filters
    if city:
        s = s.filter("term", city=city)
    if district:
        s = s.filter("term", district=district)
    if number_of_rooms:
        s = s.filter("term", number_of_rooms=number_of_rooms)
    if building_aged:
        s = s.filter("term", building_aged=building_aged)
    if floor:
        s = s.filter("term", floor=floor)
    if credit_eligibility is not None:
        s = s.filter("term", credit_eligibility=credit_eligibility)

    # Range filters
    if min_price or max_price:
        p_range = {}
        if min_price is not None:
            p_range["gte"] = float(min_price)
        if max_price is not None:
            p_range["lte"] = float(max_price)
        s = s.filter("range", price=p_range)

    if min_meter_squared or max_meter_squared:
        m_range = {}
        if min_meter_squared is not None:
            m_range["gte"] = int(min_meter_squared)
        if max_meter_squared is not None:
            m_range["lte"] = int(max_meter_squared)
        s = s.filter("range", meter_squared=m_range)

    if min_floors or max_floors:
        f_range = {}
        if min_floors is not None:
            f_range["gte"] = int(min_floors)
        if max_floors is not None:
            f_range["lte"] = int(max_floors)
        s = s.filter("range", number_of_floors=f_range)

    # Sorting
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

    # Pagination
    start = (int(page) - 1) * int(page_size)
    end = start + int(page_size)
    s = s[start:end]

    response = s.execute()
    total = response.hits.total.value if hasattr(response.hits.total, 'value') else response.hits.total

    return {
        'count': total,
        'total': total,
        'page': int(page),
        'page_size': int(page_size),
        'results': [format_hit(hit, 'houses') for hit in response]
    }
