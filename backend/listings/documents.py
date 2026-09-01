from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry
from .models import CarListing, HouseListing


@registry.register_document  # this will catche the post_save or post_delete signal
# Turns the car instance to json using CarListingDocument
class CarListingDocument(Document):
    title = fields.TextField(
        attr='title',
        fields={
            'raw': fields.KeywordField(),
            'suggest': fields.CompletionField(),
        }
    )
    city = fields.KeywordField(attr='city')
    district = fields.KeywordField(attr='district')
    price = fields.DoubleField(attr='price')
    listing_date = fields.DateField(attr='listing_date')
    listing_update = fields.DateField(attr='listing_update')
    image = fields.TextField()
    owner_id = fields.IntegerField()
    owner_username = fields.KeywordField()

    # Car specific fields
    brand = fields.TextField(
        attr='brand',
        fields={
            'raw': fields.KeywordField(),
        }
    )
    series = fields.TextField(attr='series')
    model = fields.TextField(
        attr='model',
        fields={
            'raw': fields.KeywordField(),
        }
    )
    year = fields.IntegerField(attr='year')
    km = fields.IntegerField(attr='km')
    # keyword field category, enum or dropdowns etc
    transmission_type = fields.KeywordField(attr='transmission_type')
    fuel_type = fields.KeywordField(attr='fuel_type')
    body_type = fields.KeywordField(attr='body_type')
    color = fields.KeywordField(attr='color')
    engine_size = fields.KeywordField(attr='engine_size')
    engine_power = fields.KeywordField(attr='engine_power')
    traction = fields.KeywordField(attr='traction')
    status = fields.KeywordField(attr='status')
    for_trade = fields.BooleanField(attr='for_trade')
    from_whom = fields.KeywordField(attr='from_whom')
    tramer = fields.DoubleField(attr='tramer')

    class Index:
        name = 'cars'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }

    class Django:
        model = CarListing  # Connedted to my car model
        fields = [
            'id',
        ]

    def prepare_image(self, instance):
        if instance.image:
            return instance.image.url
        return None

    def prepare_owner_id(self, instance):
        if instance.listing_owner_id:
            return instance.listing_owner_id
        return None

    def prepare_owner_username(self, instance):
        if instance.listing_owner:
            return instance.listing_owner.username
        return None


@registry.register_document
class HouseListingDocument(Document):
    # Common Listing fields
    title = fields.TextField(
        attr='title',
        fields={
            'raw': fields.KeywordField(),
            'suggest': fields.CompletionField(),
        }
    )
    city = fields.KeywordField(attr='city')
    district = fields.KeywordField(attr='district')
    price = fields.DoubleField(attr='price')
    listing_date = fields.DateField(attr='listing_date')
    listing_update = fields.DateField(attr='listing_update')
    image = fields.TextField()
    owner_id = fields.IntegerField()
    owner_username = fields.KeywordField()

    # House specific fields
    meter_squared = fields.IntegerField(attr='meter_squared')
    building_aged = fields.KeywordField(attr='building_aged')
    number_of_floors = fields.IntegerField(attr='number_of_floors')
    number_of_rooms = fields.KeywordField(attr='number_of_rooms')
    floor = fields.KeywordField(attr='floor')
    credit_eligibility = fields.BooleanField(attr='credit_eligibility')

    class Index:
        name = 'houses'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }

    class Django:
        model = HouseListing
        fields = [
            'id',
        ]

    def prepare_image(self, instance):
        if instance.image:
            return instance.image.url
        return None

    def prepare_owner_id(self, instance):
        if instance.listing_owner_id:
            return instance.listing_owner_id
        return None

    def prepare_owner_username(self, instance):
        if instance.listing_owner:
            return instance.listing_owner.username
        return None
