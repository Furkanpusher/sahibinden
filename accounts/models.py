from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


# AbstractUser attributes are not enough, so we'll override it to add some functionalites to it

class CustomUser(AbstractUser):  # if I use abstractbaseuser, I gotta define every field such as password etc.
    # but using AbstractUser: Username, first_name, last_name, email, password, 
    # last_login, is_superuser, is_staff, is_active, date_joined

    phone_number = models.CharField(max_length=15, blank=True) 
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True,  null = True)

    # for now profile picture can be null
