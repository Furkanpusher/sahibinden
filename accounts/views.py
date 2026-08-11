from django.shortcuts import render, redirect
from django.views import View # view base classı üzerinden gidicez
from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer
 

# Create your views here.

# LoginView

class LoginView(APIView):
    permission_classes = [AllowAny]  # herkes giriş yapabilsin

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password) # doğrula

        if user is None: # kullancı veritabanında yok ise
            return Response(
                {"hata": "Kullanıcı adı veya şifre hatalı."},
                {status.HTTP_401_UNAUTHORIZED},
            )
            
        refresh = RefreshToken.for_user(user) # var ise refresh token üret çünkü yeni giriş yapıyor

        return Response(
            {
                "access": str(refresh.access_token),    # tokenlara yaz
                "refresh": str(refresh),
            },
            status = status.HTTP_200_OK
        )


class RegisterView(APIView):
    permission_classes = [AllowAny] # herkes kayıt olabilsin

    def post(self, request):
        serializer = RegisterSerializer(data=request.data) # serializer ile veriyi doğrula

        if serializer.is_valid(): # serializerden gelen veri okeyse
            serializer.save() # veriyi kaydet

            return Response(
                {"mesaj": "Kayıt başarılı"},
                status=status.HTTP_201_CREATED
                )

        else: # serializerden gelen veri okey değilse
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)