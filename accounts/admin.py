from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
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
