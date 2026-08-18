from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
# Register your models here.

admin.site.register(CustomUser, UserAdmin)

# for now admin site works but mostly empty, staff will handle those things.