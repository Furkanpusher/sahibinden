from rest_framework import serializers
from accounts.models import CustomUser

class RegisterSerializer(serializers.ModelSerializer):

    # reactten gelen jsonu django objesine çevirir, dönüşte de tekrar JSON'a çevirir
    password = serializers.CharField(write_only=True, min_length = 8) #write_only True olsun ki dönüş de password gözükmesin

    class Meta: # ModelSerializer'a hangi model üzerinde çalışcağını söylüyor hem de nasıl görüntüleyeceğini falan filan söylüyor, formating ile alakalı
        model = CustomUser
        fields = ['username', 'email', 'password', 'phone_number', 'profile_picture']

    def create(self, validated_data): # root create override ettim.
        # .create_user() otomatik hasliyor
        return CustomUser.objects.create_user(**validated_data)
        # Customuser.objects.create(user_name = "ali") gibi olurdu
        # yani hashlenmezdi

