from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry
from .models import CarListing, HouseListing, ListingImage


@registry.register_document  # this will catche the post_save or post_delete signal
# Turns the car instance to json using CarListingDocument
class CarListingDocument(Document):
    title = fields.TextField(  # lowers the text, and strips it
        attr='title',
        fields={
            'raw': fields.KeywordField(),  # don't strip the text
        }
    )
    city = fields.KeywordField(attr='city')  # no tokenization
    district = fields.KeywordField(attr='district')
    price = fields.DoubleField(attr='price')
    listing_date = fields.DateField(attr='listing_date')
    listing_update = fields.DateField(attr='listing_update')
    image = fields.TextField()
    owner_id = fields.IntegerField()
    owner_username = fields.KeywordField()

    # Car specific fields
    brand = fields.TextField(
        # normally textfield has tokenization by default,
        #  but when we put a .raw subfield, it doesn't tokenize
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

    class Index:  # this is the index name and the rules for storing the data
        name = 'cars'
        settings = {
            'number_of_shards': 1,  # amount of times we split the data
            'number_of_replicas': 0  # copies of the data for backup and faster search
        }

    class Django:
        model = CarListing  # Connected to my car model
        fields = [
            'id',
        ]
        related_models = [ListingImage]

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, ListingImage):
            if hasattr(related_instance.listing, 'carlisting'):
                return related_instance.listing.carlisting
        return None

    def prepare_image(self, instance):
        # 1. Önce kapak resmi (is_cover=True) var mı bak
        cover = instance.images.filter(is_cover=True).first()
        if cover and cover.image:
            return cover.image.url

        # 2. Kapak yoksa ilk yüklenmiş resmi al
        first_img = instance.images.first()
        if first_img and first_img.image:
            return first_img.image.url

        # 3. Modeldeki doğrudan image alanı (fallback)
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
        related_models = [ListingImage]

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, ListingImage):
            if hasattr(related_instance.listing, 'houselisting'):
                return related_instance.listing.houselisting
        return None

    def prepare_image(self, instance):
        # 1. Önce kapak resmi (is_cover=True) var mı bak
        cover = instance.images.filter(is_cover=True).first()
        if cover and cover.image:
            return cover.image.url

        # 2. Kapak yoksa ilk yüklenmiş resmi al
        first_img = instance.images.first()
        if first_img and first_img.image:
            return first_img.image.url

        # 3. Modeldeki doğrudan image alanı (fallback)
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
