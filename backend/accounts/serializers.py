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
        fields = ['username', 'email', 'password', 'phone_number', 'profile_picture']

    def create(self, validated_data):
        # .create_user() hashes the password automatically
        return CustomUser.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'phone_number', 'profile_picture', 'date_joined']
        read_only_fields = ['id', 'date_joined']

    def validate_username(self, value):
        username = value.strip()
        if len(username) < 3:
            raise serializers.ValidationError("Kullanıcı adı en az 3 karakter olmalıdır.")

        # Check uniqueness excluding the current user instance
        user = self.instance
        if user and CustomUser.objects.exclude(pk=user.pk).filter(username__iexact=username).exists():
            raise serializers.ValidationError("Bu kullanıcı adı zaten kullanılmaktadır.")
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        if not email:
            raise serializers.ValidationError("E-posta adresi boş bırakılamaz.")

        # Check email uniqueness excluding current user
        user = self.instance
        if user and CustomUser.objects.exclude(pk=user.pk).filter(email__iexact=email).exists():
            raise serializers.ValidationError("Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır.")
        return email

    def validate_phone_number(self, value):
        if not value:
            return ""
        cleaned = "".join(filter(str.isdigit, str(value)))
        if cleaned and len(cleaned) < 10:
            raise serializers.ValidationError("Geçerli bir telefon numarası giriniz (en az 10 hane).")
        return value.strip()

    def validate_profile_picture(self, value):
        if value and hasattr(value, "size"):
            max_size = 5 * 1024 * 1024  # 5 MB
            if value.size > max_size:
                raise serializers.ValidationError("Profil fotoğrafı en fazla 5MB olabilir.")
        return value
