from django.db.models.expressions import result
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Özel İzin Sınıfı:
    - Herkes ilanları okuyabilir (GET, HEAD, OPTIONS).
    - Sadece ilanın sahibi ilanı güncelleyebilir veya silebilir (PUT, DELETE).
    """
    def has_object_permission(self, request, view, obj):

        result = (obj.listing_owner == request.user)

        print("\n=== HAS_OBJECT_PERMISSION ÇALIŞTI ===")
        print(f"İstek Atan Kullanıcı: {request.user}")
        print(f"İlan Sahibi: {obj.listing_owner}")
        print(f"İzin Verildi mi? -> {result}") 
        print("===================================\n")
        

        if request.method in permissions.SAFE_METHODS: # SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS') ana permission da böyle tanımlanış
            return True
        
        # put delete ise listing owner ile user aynı olmalı
        return result


class IsStaffUser(permissions.BasePermission): 
    def has_permission(self, request, view): # root has_permission override ediyoruz
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
        # hem giriş yapmış olmalı hem staff olmalı