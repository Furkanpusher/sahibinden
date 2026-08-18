from django.urls import path
from . import views # accounts/views.py

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),  # It makes #redirect operations easier and is good for dynamic URLs.
    path("register/", views.RegisterView.as_view(), name="register"),
]

