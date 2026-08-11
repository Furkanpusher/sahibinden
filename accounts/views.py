from django.shortcuts import render, redirect
from django.views import View # view base classı üzerinden gidicez
from django.contrib.auth import authenticate, login, logout 

# Create your views here.

# LoginView

class LoginView(View):
    template_name = 'templates/accounts/login.html'

    def get(self, request):
        if request.user.is_authenticated: # senaryo 1: kullanıcı giriş yapmış --> anasayfaya yönlendir
            return redirect('home')

        else: # senaryo 2: kullanıcı giriş yapmamış --> login sayfası göster
            return render(request, self.template_name)


    def post(self, request): # kullanıcı login bilgilerini gönderdiğinde yani Senaryo 2

        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password) 

        if user is not None: # kullanıcı bilgileri var ise
            login(request, user)
            

