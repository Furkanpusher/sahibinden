from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


# burda django tarafından gelen .AUTH_USER_MODEL'in kendisi yetmiyor bize AbstractUser'ı ezip tel ve profil fotosuda eklicem

class CustomUser(AbstractUser):  # AbstractBaseUser tanımlarsam username, ğpassword gibi alanları da kendim tanımlamam gerekir
    phone_number = models.CharField(max_length=15, blank=True) 
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True,  null = True)
