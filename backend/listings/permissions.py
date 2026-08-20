from django.db.models.expressions import result
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):

    # overrided the has_object_permission() from Base.permission class
    def has_object_permission(self, request, view, obj):

        result = (obj.listing_owner == request.user)

    # if it's a safe method (GET, HEAD, OPTIONS) return true without checking anything else
        if request.method in permissions.SAFE_METHODS:
            return True

        # if it's put or delete only allow if the user == owner
        return result


class IsStaffUser(permissions.BasePermission):
    # user must be authenticated and user must be a staff

    def has_permission(self, request, view):
        # overriding the root has_permission() function with exact args
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
