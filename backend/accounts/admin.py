from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('username', 'email')


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = '__all__'

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    form = CustomUserChangeForm   
    add_form = CustomUserCreationForm 
    list_display = ('username','email', 'is_staff', 'is_active','created_at', 'updated_at')
    search_fields = ('email', 'username')
    list_filter = ('is_staff', 'is_active','is_superuser')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_staff', 'is_active')

    fieldsets = (
        ('Information', {'fields': ('username', 'email', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser')})
    )

    add_fieldsets = (
        ('Information', {'fields': ('username', 'email', 'password1', 'password2')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser')})
    )
