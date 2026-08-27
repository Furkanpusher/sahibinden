from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
# pyrefly: ignore [missing-import] sürekli uyarı veriyo gereksiz
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserProfileSerializer
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser


# Create your views here.

# LoginView


class LoginView(APIView):
    permission_classes = [AllowAny]  # everyone can log in

    authentication_classes = []  # don't check any tokens it doesnt matter
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

        user_dict = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
            "is_staff": user.is_staff,
        }

        return Response(
            {
                "access": str(refresh.access_token),
                "access_token": str(refresh.access_token),
                "refresh": str(refresh),
                "refresh_token": str(refresh),
                "user_id": user.id,
                "username": user.username,
                "user": user_dict,
            },
            status=status.HTTP_200_OK
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]  # everyone can register

    # Token control is disabled here for the same reason.
    authentication_classes = []

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            user_dict = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
                "is_staff": user.is_staff,
            }

            return Response(
                {
                    "mesaj": "Register Successful",
                    "access": str(refresh.access_token),
                    "access_token": str(refresh.access_token),
                    "refresh": str(refresh),
                    "refresh_token": str(refresh),
                    "user_id": user.id,  # Needed for personel authorizations
                    "username": user.username,
                    "user": user_dict,
                },
                status=status.HTTP_201_CREATED
            )

        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        # context= necessary for returning images in URLS instead of media files
        serializer = UserProfileSerializer(
            request.user, context={"request": request})
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=False,
            context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
