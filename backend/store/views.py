from decimal import Decimal

from django.db import transaction
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .models import (
    Category,
    Product,
    ProductInventory,
    Cart,
    CartItem,
    Order,
    OrderItem,
    ShippingAddress,
)

from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    CartSerializer,
    CartAddSerializer,
    CartUpdateSerializer,
    ShippingAddressInputSerializer,
    OrderSerializer,
)

def get_or_create_cart(user):
    cart, created = Cart.objects.get_or_create(user=user)
    return cart



def get_cart(session):

    cart = session.get('cart')

    if cart is None:
        cart = {}
        session['cart'] = cart

    return cart


def build_cart_response(cart):
    items = []
    cart_total = Decimal('0.00')

    for product_id, item_data in cart.items():
        try:
            product = Product.objects.get(
                id=product_id,
                is_available=True,
                category__is_active=True
            )
        except Product.DoesNotExist:
            continue

        quantity = item_data['quantity']
        unit_price = product.price
        line_total = unit_price * quantity
        cart_total += line_total

        primary_image = product.images.filter(is_primary=True).first()

        image_url = primary_image.image.url if primary_image else None

        items.append({
            'product_id': product.id,
            'name': product.name,
            'price': str(unit_price),
            'quantity': quantity,
            'line_total': str(line_total),
            'image': image_url,
        })

    return {
        'items': items,
        'cart_total': str(cart_total),
        'total_items': len(items),
    }


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(
            is_active=True
        ).order_by('name')


class ProductListView(generics.ListAPIView):

    serializer_class = ProductListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.select_related(
            'category'
        ).prefetch_related(
            'images'
        ).filter(
            is_available=True,
            category__is_active=True
        )

        category_id = self.request.query_params.get('category')
        search_text = self.request.query_params.get('search')

        if category_id:
            if not category_id.isdigit():
                raise serializers.ValidationError({
                    'category': 'Category must be a valid integer.'
                })

            queryset = queryset.filter(category_id=int(category_id))

        if search_text:
            queryset = queryset.filter(name__icontains=search_text.strip())

        return queryset.order_by('-created_at')


class ProductDetailView(generics.RetrieveAPIView):

    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.select_related(
            'category'
        ).prefetch_related(
            'images'
        ).filter(
            is_available=True,
            category__is_active=True
        )


class CartDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request.user)
        serializers = CartSerializer(cart,context={'request': request})
        return Response(serializers.data,status=status.HTTP_200_OK)


class CartAddView(APIView):

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CartAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']

        product = Product.objects.get(
            id=product_id,
            is_available=True,
            category__is_active=True
        )

        try:
            product = Product.objects.get(id=product_id, is_available=True, category__is_active=True)
        except Product.DoesNotExist:
            return Response({'detail': 'Product no longer available.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inventory = ProductInventory.objects.select_for_update().get(product=product)
        except ProductInventory.DoesNotExist:
            return Response({
                'detail': f'Inventory not found for {product.name}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        cart = get_or_create_cart(request.user)
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product,defaults={'quantity': 0})
        new_quantity = cart_item.quantity + quantity

        if inventory.stock_quantity < new_quantity:
            return Response({
                'detail': f'Not enough stock. Available: {inventory.stock_quantity}'
            }, status=status.HTTP_400_BAD_REQUEST)

        cart_item.quantity = new_quantity
        cart_item.save()

        cart.refresh_from_db()

        return Response({
            'message': 'Product added to cart.',
            'cart': CartSerializer(cart, context={'request': request}).data,
        }, status=status.HTTP_200_OK)


class CartUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, product_id):
        serializer = CartUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data['quantity']
        cart = get_or_create_cart(request.user)

        try:
            cart_item = CartItem.objects.select_related('product').get(cart=cart, product_id=product_id)
        except CartItem.DoesNotExist:
            return Response({'detail': 'Product is not in cart.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            inventory = ProductInventory.objects.select_for_update().get(product=cart_item.product)
        except ProductInventory.DoesNotExist:
            return Response(
                {'detail': f'Inventory not found for {cart_item.product.name}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if inventory.stock_quantity < quantity:
            return Response(
                {'detail': f'Not enough stock. Available: {inventory.stock_quantity}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()
        return Response({'message': 'Cart updated.', 'cart': CartSerializer(cart, context={'request': request}).data})

class CartRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        cart = get_or_create_cart(request.user)

        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except CartItem.DoesNotExist:
            return Response({
                'detail': 'Product is not in cart.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        cart_item.delete()
        cart.refresh_from_db()

        return Response({
            'message': 'Product removed from cart.',
            'cart': CartSerializer(cart, context={'request': request}).data,
        })


class CartClearView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.cart_items.all().delete()

        return Response({
            'message': 'Cart cleared.',
            'cart': CartSerializer(cart, context={'request': request}).data,
        })


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = ShippingAddressInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request.user)

        cart_items = list(cart.cart_items.select_related('product', 'product__category'))

        if not cart_items:
            return Response({
                'detail': 'Cart is empty.'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        order = Order.objects.create(
            user=user,
            status='pending',
            paid=False,
            total_amount=Decimal('0.00')
        )

        total_amount = Decimal('0.00')

        for cart_item in cart_items:
            product = cart_item.product
            quantity = cart_item.quantity

            if not product.is_available or not product.category.is_active:
                raise ValidationError(f'Product {product.name} is not available anymore.')


            try:
                inventory = ProductInventory.objects.select_for_update().get(product=product)
            except ProductInventory.DoesNotExist:
                raise ValidationError(f'Inventory not found for {product.name}.')
            

            if inventory.stock_quantity < quantity:
                raise serializers.ValidationError(
                    f'Not enough stock for {product.name}. Available: {inventory.stock_quantity}'
                )

            unit_price = product.price
            line_total = unit_price * quantity
            total_amount += line_total

            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                unit_price=unit_price,
                quantity=quantity,
            )

            inventory.stock_quantity -= quantity
            inventory.save(update_fields=['stock_quantity','updated_at'])

        ShippingAddress.objects.create(
            order=order,
            full_name=serializer.validated_data['full_name'],
            email=serializer.validated_data['email'],
            address=serializer.validated_data['address'],
            city=serializer.validated_data['city'],
            postal_code=serializer.validated_data['postal_code'],
            country=serializer.validated_data['country'],
        )

        order.total_amount = total_amount
        order.save(update_fields=['total_amount','updated_at'])

        cart.cart_items.all().delete()

        return Response({
            'message': 'Checkout successful.',
            'order': OrderSerializer(order).data,
        }, status=status.HTTP_201_CREATED)


class OrderHistoryView(generics.ListAPIView):

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).select_related(
            'user',
            'shipping_address'
        ).prefetch_related(
            'order_items'
        ).order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).select_related(
            'user',
            'shipping_address'
        ).prefetch_related(
            'order_items'
        )