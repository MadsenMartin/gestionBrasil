from rest_framework import generics, serializers
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import permissions

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.StringRelatedField(many=True)
    class Meta:
        model = User
        fields = ['id','username', 'email', 'groups', 'is_staff', 'is_active']

class UserDataView(generics.RetrieveAPIView):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
