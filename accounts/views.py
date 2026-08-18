from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
# pyrefly: ignore [missing-import] sürekli uyarı veriyo gereksiz
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer


# Create your views here.

# LoginView

class LoginView(APIView):
    permission_classes = [AllowAny]  # everyone can log in

    authentication_classes = []  # Never check tokens on this endpoint
    # (Even if there is an old/invalid token in localStorage, the login request should not be affected)


    def post(self, request):


        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {"hata": "The username or password is incorrect."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        login(request, user)  # Starts a browser session (session cookie)


        refresh = RefreshToken.for_user(user)


        return Response(
            {
                "access": str(refresh.access_token),
                "access_token": str(refresh.access_token),
                "refresh": str(refresh),
                "refresh_token": str(refresh),
                "user_id": user.id,
                "username": user.username,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_staff": user.is_staff,
                }
            },
            status=status.HTTP_200_OK
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]  # everyone can register

    authentication_classes = []  # Token control is disabled here for the same reason.


    def post(self, request):
     

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "mesaj": "Register Successful",
                    "access": str(refresh.access_token),
                    "access_token": str(refresh.access_token),
                    "refresh": str(refresh),
                    "refresh_token": str(refresh),
                    "user_id": user.id, # Needed for personel authorizations
                    "username": user.username,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        
                    }
                },
                status=status.HTTP_201_CREATED
            )

        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)