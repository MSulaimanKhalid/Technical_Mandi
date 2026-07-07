from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView, settings

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from .models import CustomUser
from .serializers import SignupSerializer, LoginSerializer, UserSerializer


@api_view(['GET'])
@ensure_csrf_cookie
def csrf_view(request):
    return Response({
        'message': 'CSRF cookie set.'
    })


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key = settings.JWT_REFRESH_COOKIE_NAME,  
        value = refresh_token,
        httponly = settings.JWT_REFRESH_COOKIE_HTTPONLY,
        secure = settings.JWT_REFRESH_COOKIE_SECURE,
        samesite = settings.JWT_REFRESH_COOKIE_SAMESITE,
        path = settings.JWT_REFRESH_COOKIE_PATH,
    )
    return response

def delete_refresh_cookie(response):
    response.delete_cookie(
        key = settings.JWT_REFRESH_COOKIE_NAME,
        path = settings.JWT_REFRESH_COOKIE_PATH,
        samesite = settings.JWT_REFRESH_COOKIE_SAMESITE,
    )
    return response

class SignupView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]


class JWTLoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        login(request, user)
 
        response = Response({
            'message': 'Login successful.',
            'access': str(access),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)
    
        set_refresh_cookie(response, str(refresh))

        return response
    
class JWTRefreshView(APIView):
    
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)

        if refresh_token is None:
            return Response({
                'error': 'Refresh token not found.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        response = Response({
            'access': data['access'],
        }, status=status.HTTP_200_OK)

        if 'refresh' in data:
            set_refresh_cookie(response, data['refresh'])

            
        return response
    

class JWTLogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)

        response = Response({
            'message': 'Logout successful.'
        }, status=status.HTTP_200_OK)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception :
                pass

    
        delete_refresh_cookie(response)

        return response

class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)

        return Response({
            'message': 'Logout successful.'
        }, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user