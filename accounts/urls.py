from django.urls import path
from .views import csrf_view, SignupView, LoginView, LogoutView, ProfileView


urlpatterns = [
    path('csrf/', csrf_view, name='csrf'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
]