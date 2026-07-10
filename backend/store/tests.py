from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Category, Product, ProductInventory, Order

User = get_user_model()


class StoreTestBase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='shopper', email='shopper@example.com', password='strongpass123'
        )
        self.client.login(username='shopper@example.com', password='strongpass123')

        self.category = Category.objects.create(name='Gadgets', is_active=True)
        self.inactive_category = Category.objects.create(name='Retired', is_active=False)

        self.product = Product.objects.create(
            category=self.category, name='Widget', price=Decimal('19.99'), is_available=True
        )
        ProductInventory.objects.create(product=self.product, stock_quantity=5, low_stock_level=2)

        self.oos_product = Product.objects.create(
            category=self.category, name='OutOfStock', price=Decimal('9.99'), is_available=True
        )
        ProductInventory.objects.create(product=self.oos_product, stock_quantity=0, low_stock_level=2)

        self.no_inventory_product = Product.objects.create(
            category=self.category, name='NoInventoryRow', price=Decimal('5.00'), is_available=True
        )
        # deliberately no ProductInventory row


class BrowsingTests(StoreTestBase):

    def test_category_list_requires_auth(self):
        self.client.logout()
        resp = self.client.get('/api/store/categories/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_category_list_excludes_inactive(self):
        resp = self.client.get('/api/store/categories/')
        names = [c['name'] for c in resp.data]
        self.assertIn('Gadgets', names)
        self.assertNotIn('Retired', names)

    def test_product_list_search_and_filter(self):
        resp = self.client.get('/api/store/products/', {'search': 'Widget'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['name'], 'Widget')

    def test_product_detail(self):
        resp = self.client.get(f'/api/store/products/{self.product.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('inventory', resp.data)


class CartTests(StoreTestBase):

    def test_add_to_cart(self):
        resp = self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 2})
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(resp.data['cart']['total_items'], 1)
        self.assertEqual(resp.data['cart']['cart_total'], '39.98')

    def test_add_more_than_stock_rejected(self):
        resp = self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 999})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_product_without_inventory_row_fails_cleanly(self):
        resp = self.client.post('/api/store/cart/add/', {'product_id': self.no_inventory_product.id, 'quantity': 1})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_cart_quantity(self):
        self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 1})
        resp = self.client.patch(f'/api/store/cart/update/{self.product.id}/', {'quantity': 3}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(resp.data['cart']['items'][0]['quantity'], 3)

    def test_remove_from_cart(self):
        self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 1})
        resp = self.client.delete(f'/api/store/cart/remove/{self.product.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['cart']['total_items'], 0)

    def test_clear_cart(self):
        self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 1})
        resp = self.client.delete('/api/store/cart/clear/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        cart_resp = self.client.get('/api/store/cart/')
        self.assertEqual(cart_resp.data['total_items'], 0)


VALID_ADDRESS = {
    'full_name': 'Shopper One',
    'email': 'shopper@example.com',
    'address': '123 Main St',
    'city': 'Lahore',
    'postal_code': '54000',
    'country': 'Pakistan',
}


class CheckoutTests(StoreTestBase):

    def test_checkout_empty_cart_rejected(self):
        resp = self.client.post('/api/store/checkout/', VALID_ADDRESS, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_success_decrements_stock(self):
        self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 2})
        resp = self.client.post('/api/store/checkout/', VALID_ADDRESS, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.stock_quantity, 3)
        # cart should be cleared
        cart_resp = self.client.get('/api/store/cart/')
        self.assertEqual(cart_resp.data['total_items'], 0)

    def test_checkout_failure_rolls_back_cleanly(self):
        """
        Fixed behavior: CheckoutView now raises serializers.ValidationError
        instead of returning early, so a failure partway through the loop
        actually rolls back the @transaction.atomic block -- no orphan
        Order, no OrderItems, and stock is left untouched.
        """
        orders_before = Order.objects.count()
        stock_before = self.product.inventory.stock_quantity

        self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 1})
        session = self.client.session
        session['cart'][str(self.oos_product.id)] = {'quantity': 1}
        session.save()

        resp = self.client.post('/api/store/checkout/', VALID_ADDRESS, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(Order.objects.count(), orders_before)

        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.stock_quantity, stock_before)

    def test_checkout_out_of_stock_item_alone(self):
        session = self.client.session
        session['cart'] = {str(self.oos_product.id): {'quantity': 1}}
        session.save()
        resp = self.client.post('/api/store/checkout/', VALID_ADDRESS, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_requires_auth(self):
        self.client.logout()
        resp = self.client.post('/api/store/checkout/', VALID_ADDRESS, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class OrderHistoryTests(StoreTestBase):

    def test_order_history_only_shows_own_orders(self):
        self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 1})
        self.client.post('/api/store/checkout/', VALID_ADDRESS, format='json')

        other_user = User.objects.create_user(username='other', email='other@example.com', password='strongpass123')
        self.client.logout()
        self.client.login(username='other@example.com', password='strongpass123')

        resp = self.client.get('/api/store/orders/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 0)

    def test_order_detail_not_visible_to_other_user(self):
        self.client.post('/api/store/cart/add/', {'product_id': self.product.id, 'quantity': 1})
        checkout_resp = self.client.post('/api/store/checkout/', VALID_ADDRESS, format='json')
        order_id = checkout_resp.data['order']['id']

        other_user = User.objects.create_user(username='other2', email='other2@example.com', password='strongpass123')
        self.client.logout()
        self.client.login(username='other2@example.com', password='strongpass123')

        resp = self.client.get(f'/api/store/orders/{order_id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
