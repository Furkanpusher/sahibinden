from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views  # accounts/views.py

urlpatterns = [
    # nIt makes #redirect operations easier and is good for dynamic URLs.
    path('login/', views.LoginView.as_view(), name='login'),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # auth.jsx uses this endpoints
    path("my-profile/", views.ProfileView.as_view(), name="my-profile"),
]
