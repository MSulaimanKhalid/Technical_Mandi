from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser

        fields = (
            'id',
            'username',
            'email',
            'is_staff',
            'is_active',
            'created_at',
            'updated_at',
        )

        read_only_fields = (
            'id',
            'is_staff',
            'is_active',
            'created_at',
            'updated_at',
        )


class SignupSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'username',
            'email',
            'password',
            'password2',
        )

        read_only_fields = (
            'id',
        )

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({
                'password': 'Passwords do not match.'
            })

        
        temp_user = CustomUser(
            username=data.get('username'),
            email=data.get('email'),
        )
        try:
            password_validation.validate_password(data['password'], user=temp_user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})

        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(
            username=validated_data['username'],
            email=validated_data['email'],
        )
        user.set_password(password)
        user.save()

        return user


class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password
        )

        if user is None:
            raise serializers.ValidationError(
                'Invalid email or password.'
            )

        if not user.is_active:
            raise serializers.ValidationError(
                'This account is inactive.'
            )

        data['user'] = user

        return data
