from __future__ import annotations

from datetime import date, timedelta
from django.db.models import Exists, OuterRef, Count, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
import django_filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Activity, ActivityCompletion
from .serializers import CategorySerializer, ActivitySerializer, ActivityCompletionSerializer


class IsOwnerQuerysetMixin:
    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(IsOwnerQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)


class ActivityFilter(django_filters.FilterSet):
    # Filter by category
    class Meta:
        model = Activity
        fields = ["category"]


class ActivityViewSet(IsOwnerQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ActivityFilter

    def get_queryset(self):
        # We need to annotate 'is_completed' for a specific date
        # Default to today if not provided
        target_date_str = self.request.query_params.get("date", str(date.today()))
        try:
            target_date = date.fromisoformat(target_date_str)
        except ValueError:
            target_date = date.today()

        completion_subquery = ActivityCompletion.objects.filter(
            activity=OuterRef("pk"),
            date=target_date
        )

        return Activity.objects.filter(user=self.request.user).annotate(
            is_completed=Exists(completion_subquery),
            occurrence_count=Coalesce(
                Subquery(
                    completion_subquery.values('occurrence_count')[:1]
                ),
                0
            )
        ).select_related("category").order_by("title")

    @action(detail=True, methods=["post"])
    def toggle_complete(self, request, pk=None):
        """
        Toggle completion status for a specific date.
        For multi-occurrence tasks, increments occurrence_count.
        Body: { "date": "YYYY-MM-DD", "increment": true/false } (optional, defaults to today and increment=true)
        """
        activity = self.get_object()
        target_date_str = request.data.get("date", str(date.today()))
        increment = request.data.get("increment", True)
        
        try:
            target_date = date.fromisoformat(target_date_str)
        except ValueError:
            return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)

        completion, created = ActivityCompletion.objects.get_or_create(
            activity=activity,
            date=target_date,
            defaults={'occurrence_count': 0}
        )

        if increment:
            # Increment occurrence count (max = daily_occurrences)
            if completion.occurrence_count < activity.daily_occurrences:
                completion.occurrence_count += 1
                completion.save()
        else:
            # Decrement occurrence count
            if completion.occurrence_count > 0:
                completion.occurrence_count -= 1
                if completion.occurrence_count == 0:
                    completion.delete()
                else:
                    completion.save()
        
        # Return updated activity state
        is_completed = completion.occurrence_count == activity.daily_occurrences if ActivityCompletion.objects.filter(activity=activity, date=target_date).exists() else False
        occurrence_count = completion.occurrence_count if ActivityCompletion.objects.filter(activity=activity, date=target_date).exists() else 0
        
        serializer = ActivitySerializer(activity, context={"request": request})
        data = serializer.data
        data["is_completed"] = is_completed
        data["occurrence_count"] = occurrence_count
        return Response(data)


class ProductivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        end = date.today()
        start = end - timedelta(days=days - 1)

        # Calculate completion scores per day
        # Score = SUM(occurrence_count / daily_occurrences) per activity
        completions = (
            ActivityCompletion.objects
            .filter(activity__user=request.user, date__range=(start, end))
            .select_related("activity")
        )

        completed_scores_by_date = {}
        for c in completions:
            if c.activity.daily_occurrences > 0:
                ratio = min(c.occurrence_count / c.activity.daily_occurrences, 1.0)
                completed_scores_by_date[c.date] = completed_scores_by_date.get(c.date, 0.0) + ratio
        
        # Total active activities count (approximation for "planned")
        total_activities = Activity.objects.filter(user=request.user).count()

        results = []
        for i in range(days):
            d = start + timedelta(days=i)
            # Round to 2 decimal places for clean UI (e.g., 5.25 tasks completed)
            completed_score = round(completed_scores_by_date.get(d, 0.0), 2)
            
            results.append({
                "date": d.isoformat(),
                "planned_count": total_activities, 
                "completed_count": completed_score,
                # Duration is deprecated, zeroing out
                "planned_minutes": 0,
                "completed_minutes": 0,
            })
        return Response(results)


class TimeDistributionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        end = date.today()
        start = end - timedelta(days=days - 1)
        
        # Count completions by category
        qs = (
            ActivityCompletion.objects
            .filter(activity__user=request.user, date__range=(start, end))
            .values("activity__category__name", "activity__category__color_hex")
            .annotate(count=Count("id"))
            .order_by("activity__category__name")
        )

        results = []
        for row in qs:
            name = row["activity__category__name"] or "Uncategorized"
            color = row["activity__category__color_hex"] or "#9CA3AF"
            count = row["count"]
            
            results.append({
                "category": name,
                "color_hex": color,
                "minutes": count * 15, # Placeholder: each task ~15 mins effectively for chart viz
                "hours": round((count * 15) / 60.0, 2),
                "count": count
            })
        return Response(results)


class HistoryListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        end = date.today()
        start = end - timedelta(days=days - 1)
        
        completions = (
            ActivityCompletion.objects
            .filter(activity__user=request.user, date__range=(start, end))
            .select_related("activity", "activity__category")
            .order_by("-date", "activity__title")
        )
        
        results = []
        for c in completions:
            results.append({
                "id": c.id,
                "date": c.date.isoformat(),
                "activity_title": c.activity.title,
                "category_name": c.activity.category.name if c.activity.category else "Uncategorized",
                "category_color": c.activity.category.color_hex if c.activity.category else "#9CA3AF",
            })
        return Response(results)
