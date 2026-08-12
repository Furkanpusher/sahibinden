from django.urls import path
from . import views # accounts/views.py

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),  #redirect işlemlerini kolaylaştırıyor birde dinamik url için iyi
    path("register/", views.RegisterView.as_view(), name="register"),
]

