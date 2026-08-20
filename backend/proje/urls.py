"""
URL configuration for proje project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""  

from django.contrib import admin
from django.conf import settings
from django.urls import path, include
from django.conf.urls.static import static

# pyrefly: ignore [missing-import]
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


print("proje/urls.py çalıştı")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')), 
    path('accounts/', include('accounts.urls')), 
    path('api/listings/', include('listings.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# admin/
# api-auth/
# accounts/
# api/listings/ all-cars/ [name='all-cars']
# api/listings/ all-houses/ [name='all-houses']
# api/listings/ car/<int:pk>/ [name='car-detail']
# api/listings/ house/<int:pk>/ [name='house-detail']
# api/listings/ car-options/ [name='car-options']
# api/listings/ house-options/ [name='house-options']
# api/listings/ listing/<int:pk>/favorite/ [name='toggle-favorite']
# api/listings/ my-favorites/ [name='user-favorites']
# api/listings/ listing/<int:pk>/report/ [name='report-listing']
# api/listings/ my-reports/ [name='user-reports']
# api/listings/ staff/reports/ [name='staff-reports']
# api/listings/ staff/reports/<int:pk>/delete/ [name='staff-delete-report']
# api/listings/ staff/listings/<int:pk>/delete/ [name='staff-delete-listing']