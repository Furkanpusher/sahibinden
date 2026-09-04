from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry
from .models import CarListing, HouseListing


@registry.register_document  # this will catche the post_save or post_delete signal
# Turns the car instance to json using CarListingDocument
class CarListingDocument(Document):
    title = fields.TextField(  # lowers the text, and strips it
        attr='title',
        fields={
            'raw': fields.KeywordField(),  # don't strip the text
            'suggest': fields.CompletionField(),  # for auto complete
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
            'raw': fields.KeywordField(),  # for EXACT MATCH
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

    class Index:  # this is the index name and the rules for storing the data
        name = 'cars'
        settings = {
            'number_of_shards': 1,  # amount of times we split the data
            'number_of_replicas': 0  # copies of the data for backup and faster search
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

    class Index:
        name = 'houses'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0  # No need for replicas
        }

    class Django:
        model = HouseListing
        fields = [
            'id',
        ]

    def prepare_image(self, instance):
        # name should be prepare_<field_name>
        if instance.image:
            return instance.image.url
        return None

    def prepare_owner_id(self, instance):
        if instance.listing_owner_id:
            return instance.listing_owner_id
        return None

    def prepare_owner_username(self, instance):
        if instance.listing_owner:  # we check if it's null, it can't but still good practice!
            return instance.listing_owner.username
        return None
