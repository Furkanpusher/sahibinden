from listings.models import Alarm
from listings.serializers import AlarmSerializer
from rest_framework import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
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

        alarm = create_alarm(alarm_type, params, listing_id, user)

        if not alarm:
            return Response({'error': 'Alarm creation failed'}, status=status.HTTP_400_BAD_REQUEST)


# but how will I distinguish the listing based alarms from non listing based alarms?

        # there can be different type of alarms
        # if it's not a listing based alarm like notify me when this comes,
        #  we won't have listing, or listing id

        # if it's a listing based alarm like
        # notify me when this listings price drops we need the listing_id
        # for post request
