from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError, PermissionDenied


def custom_exception_handler(exc, context):
    # Let DRF handle its own exceptions first (e.g. NotAuthenticated, NotFound)
    response = exception_handler(exc, context)
    if response is not None:
        return response

    # PermissionDenied
    if isinstance(exc, PermissionDenied):
        return Response({'error': str(exc)}, status=status.HTTP_403_FORBIDDEN)

    # ValidationError
    if isinstance(exc, ValidationError):
        # message can be a list when multiple errors are raised
        errors = exc.messages if hasattr(exc, 'messages') else [str(exc)]
        return Response({'error': errors}, status=status.HTTP_400_BAD_REQUEST)

    # let django handle with the rest
    return None
