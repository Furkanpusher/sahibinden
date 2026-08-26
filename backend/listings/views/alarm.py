from listings.models import Alarm
from listings.serializers import AlarmSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from listings.services import create_alarm, delete_alarm, toggle_alarm


class AlarmView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # user can see the alarms
        alarms = Alarm.objects.filter(
            user=request.user).select_related('listing')
        serializer = AlarmSerializer(alarms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # user can create new alarms
        alarm_type = request.data.get('alarm_type')
        params = request.data.get('params')
        listing_id = request.data.get('listing_id')  # for post use listing_id
        user = request.user

        alarm = create_alarm(alarm_type, params, listing_id, user)
        serializer = AlarmSerializer(alarm)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        # user can delete their own alarms
        pk = request.data.get('pk')
        delete_alarm(request.user, pk)
        return Response({'message': 'Alarm deleted successfully'}, status=status.HTTP_200_OK)

    def patch(self, request):
        # user can toggle their alarms from active to inactive
        pk = request.data.get('pk')
        is_now_active = toggle_alarm(request.user, pk)
        msg = 'Alarm activated successfully' if is_now_active else 'Alarm deactivated successfully'
        return Response({'message': msg, 'is_active': is_now_active}, status=status.HTTP_200_OK)

