from rest_framework import serializers
from accounts.models import CustomUser

class RegisterSerializer(serializers.ModelSerializer):

    # this will convert the json from react to django object, then convert it back to JSON when sending back.
    password = serializers.CharField(write_only=True, min_length = 8) #write_only set to True so that the password does not appear on return


    class Meta: # It tells ModelSerializer which model it is working on and how it will be displayed etc. it is related to formatting
        model = CustomUser
        fields = ['username', 'email', 'password', 'phone_number', 'profile_picture']

    def create(self, validated_data): # overrided the root create function
        # .create_user() hashes the password automatically

        return CustomUser.objects.create_user(**validated_data)
        # It would be like customuser.objects.create(user_name = "ali")
        # so it wouldn't be hashed


