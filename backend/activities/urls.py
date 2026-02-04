from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ActivityViewSet, TimeDistributionView, ProductivityView, HistoryListView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/time-distribution/', TimeDistributionView.as_view(), name='time-distribution'),
    path('analytics/productivity/', ProductivityView.as_view(), name='productivity'),
    path('analytics/history-list/', HistoryListView.as_view(), name='history-list'),
]
