from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class SignupTests(APITestCase):

    def test_signup_success(self):
        resp = self.client.post('/api/accounts/signup/', {
            'username': 'alice',
            'email': 'alice@example.com',
            'password': 'strongpass123',
            'password2': 'strongpass123',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertTrue(User.objects.filter(email='alice@example.com').exists())
        user = User.objects.get(email='alice@example.com')
        # password must be hashed, never stored in plaintext
        self.assertNotEqual(user.password, 'strongpass123')
        self.assertTrue(user.check_password('strongpass123'))

    def test_signup_password_mismatch(self):
        resp = self.client.post('/api/accounts/signup/', {
            'username': 'bob',
            'email': 'bob@example.com',
            'password': 'strongpass123',
            'password2': 'differentpass',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_duplicate_email_rejected(self):
        User.objects.create_user(username='existing', email='dupe@example.com', password='whatever123')
        resp = self.client.post('/api/accounts/signup/', {
            'username': 'newname',
            'email': 'dupe@example.com',
            'password': 'strongpass123',
            'password2': 'strongpass123',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_all_numeric_password_rejected(self):
        """
        AUTH_PASSWORD_VALIDATORS in settings.py includes NumericPasswordValidator.
        Now that SignupSerializer calls password_validation.validate_password(),
        an all-digit password should be rejected even though it's 8+ chars.
        """
        resp = self.client.post('/api/accounts/signup/', {
            'username': 'charlie',
            'email': 'charlie@example.com',
            'password': '12345678',
            'password2': '12345678',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_password_similar_to_username_rejected(self):
        resp = self.client.post('/api/accounts/signup/', {
            'username': 'greatgatsby',
            'email': 'gatsby@example.com',
            'password': 'greatgatsby1',
            'password2': 'greatgatsby1',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class LoginLogoutProfileTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='daveuser', email='dave@example.com', password='strongpass123'
        )

    def test_login_success(self):
        resp = self.client.post('/api/accounts/login/', {
            'email': 'dave@example.com',
            'password': 'strongpass123',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(resp.data['user']['email'], 'dave@example.com')

    def test_login_wrong_password(self):
        resp = self.client.post('/api/accounts/login/', {
            'email': 'dave@example.com',
            'password': 'wrongpass',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_inactive_user_rejected(self):
        self.user.is_active = False
        self.user.save()
        resp = self.client.post('/api/accounts/login/', {
            'email': 'dave@example.com',
            'password': 'strongpass123',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_requires_auth(self):
        resp = self.client.get('/api/accounts/profile/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_profile_after_login(self):
        self.client.login(username='dave@example.com', password='strongpass123')
        resp = self.client.get('/api/accounts/profile/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['email'], 'dave@example.com')

    def test_logout_requires_auth(self):
        resp = self.client.post('/api/accounts/logout/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_after_login(self):
        self.client.login(username='dave@example.com', password='strongpass123')
        resp = self.client.post('/api/accounts/logout/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # session should now be anonymous
        resp2 = self.client.get('/api/accounts/profile/')
        self.assertEqual(resp2.status_code, status.HTTP_403_FORBIDDEN)

    def test_csrf_view_sets_cookie(self):
        resp = self.client.get('/api/accounts/csrf/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
