from rest_framework import serializers
from accounts.models import CustomUser


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'phone_number', 'profile_picture']


class RegisterSerializer(serializers.ModelSerializer):
    # this will convert the json from react to django object, then convert it back to JSON when sending back.
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password',
                  'phone_number', 'profile_picture']

    def create(self, validated_data):
        # .create_user() hashes the password automatically
        return CustomUser.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'phone_number',
                  'profile_picture', 'date_joined']
