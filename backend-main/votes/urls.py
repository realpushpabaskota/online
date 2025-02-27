from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoteViewSet

# Register VoteViewSet with the router
router = DefaultRouter()
router.register(r'votes', VoteViewSet, basename="votes")  # ✅ Registers `/api/votes/`

urlpatterns = [
    path('api/', include(router.urls)),  # ✅ This includes `/api/votes/top-winners/`
]
