# views.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Vote
from .serializers import VoteSerializer, VoteCreateSerializer
from voters.models import Voter  # Import the Voter model

class VoteViewSet(viewsets.ModelViewSet):
    """
    A viewset that provides the CRUD operations for the Vote model.
    Automatically handles: List, Create, Retrieve, Update, Delete.
    """
    queryset = Vote.objects.all()  # Retrieve all Vote instances.
    permission_classes = [IsAuthenticated]  # Only allow authenticated users to interact with the API.

    def get_serializer_class(self):
        """
        Return the appropriate serializer class based on the HTTP method.
        Use VoteCreateSerializer for POST requests (creating votes).
        Use VoteSerializer for other requests (GET, PUT, PATCH, DELETE).
        """
        if self.request.method == 'POST':
            return VoteCreateSerializer  # For creating a vote
        return VoteSerializer  # For listing, retrieving, updating, deleting votes

    def perform_create(self, serializer):
        """
        Automatically associate the logged-in user with the vote when creating it.
        """
        user = self.request.user
        
        try:
            # Retrieve the Voter instance associated with the User
            voter = Voter.objects.get(userid=user)  # Assuming 'userid' is the ForeignKey in Voter
        except Voter.DoesNotExist:
            raise ValidationError("You must be a registered voter to vote.")

        # Save the vote instance with the Voter instance
        serializer.save(voter=voter)  # Save the vote instance with the current Voter instance