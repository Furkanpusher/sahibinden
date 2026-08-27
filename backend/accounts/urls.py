from django.urls import path
from . import views  # accounts/views.py

urlpatterns = [
    # It makes #redirect operations easier and is good for dynamic URLs.
    path('login/', views.LoginView.as_view(), name='login'),
    path("register/", views.RegisterView.as_view(), name="register"),
    # auth.jsx uses this endpoints
    path("my-profile/", views.ProfileView.as_view(), name="my-profile"),
]
