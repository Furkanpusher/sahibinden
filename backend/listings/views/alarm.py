from listings.models import Alarm
from listings.serializers import AlarmSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from listings.services import create_alarm


class AlarmView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # user can see the alarms
        alarms = Alarm.objects.filter(user=request.user)
        serializer = AlarmSerializer(alarms, many=True)
        # in GET request, we will return the whole listing object for listing based alarms
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # user can create new alarms
        alarm_type = request.data.get('alarm_type')
        params = request.data.get('params')
        # for post I use listing_id
        listing_id = request.data.get('listing_id')
        user = request.user

        try:
            alarm = create_alarm(alarm_type, params, listing_id, user)
        except ValidationError as e:
            return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AlarmSerializer(alarm)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
