from django.db.models.expressions import result
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission): 
    def has_object_permission(self, request, view, obj): 

        result = (obj.listing_owner == request.user)

        if request.method in permissions.SAFE_METHODS: # SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS') ana permission da böyle tanımlanış
            return True
        
        # put delete ise listing owner ile user aynı olmalı
        return result


class IsStaffUser(permissions.BasePermission): 
    def has_permission(self, request, view): # root has_permission override ediyoruz
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
        # hem giriş yapmış olmalı hem staff olmalı