from django.urls import path
from . import views # accounts/views.py

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
     path("register/", RegisterView.as_view(), name="register"),
]