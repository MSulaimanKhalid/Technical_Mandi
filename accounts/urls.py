from django.urls import path
from .views import csrf_view, SignupView, JWTLogoutView, LogoutView, ProfileView, JWTLoginView, JWTRefreshView 


urlpatterns = [
    path('csrf/', csrf_view, name='csrf'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', JWTLoginView.as_view(), name='login'),
    path('refresh/', JWTRefreshView.as_view(), name='refresh'),
    path('logout/', JWTLogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
]