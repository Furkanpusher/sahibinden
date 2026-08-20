from rest_framework.views import APIView
from rest_framework.response import Response
from listings.permissions import IsStaffUser  # does staff check
from rest_framework import status
from listings.models import Report, Listing
from listings.serializers import ReportSerializer
from listings.services import get_all_reports
from django.shortcuts import get_object_or_404


class StaffReportListView(APIView):  # sees reported ads
    permission_classes = [IsStaffUser]  # Accesses if staff = true

    def get(self, request):
        reports = get_all_reports()
        serializer = ReportSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffDeleteReportView(APIView):  # Can unreport reported ads
    permission_classes = [IsStaffUser]

    def delete(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffDeleteListingView(APIView):  # deletes the reported ad
    permission_classes = [IsStaffUser]

    def delete(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)
        listing.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
