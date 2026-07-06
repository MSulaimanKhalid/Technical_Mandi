from rest_framework import serializers
from .models import (
    Category,
    Product,
    ProductImage,
    ProductInventory,
    Order,
    OrderItem,
    ShippingAddress,
)


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = (
            'id',
            'name',
            'description',
            'is_active',
        )


class ProductImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductImage
        fields = (
            'id',
            'image',
            'alt_text',
            'is_primary',
        )


class ProductInventorySerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductInventory
        fields = (
            'stock_quantity',
            'low_stock_level',
            'is_low_stock',
        )


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )

    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id',
            'category',
            'category_name',
            'name',
            'description',
            'price',
            'is_available',
            'primary_image',
        )

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first()

        if image:
            return ProductImageSerializer(image, context=self.context).data

        return None


class ProductDetailSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )

    images = ProductImageSerializer(many=True, read_only=True)

    inventory = ProductInventorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id',
            'category',
            'category_name',
            'name',
            'description',
            'price',
            'is_available',
            'images',
            'inventory',
        )


class CartAddSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_product_id(self, product_id):

        try:
            Product.objects.get(
                id=product_id,
                is_available=True,
                category__is_active=True
            )
        except Product.DoesNotExist:
            raise serializers.ValidationError(
                'Product does not exist or is not available.'
            )

        return product_id


class CartUpdateSerializer(serializers.Serializer):

    quantity = serializers.IntegerField(min_value=1)


class ShippingAddressInputSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            'id',
            'product',
            'product_name',
            'unit_price',
            'quantity',
            'line_total',
        )

    def get_line_total(self, obj):
        return obj.line_total


class ShippingAddressSerializer(serializers.ModelSerializer):
    """
    Shows shipping address in order response.
    """

    class Meta:
        model = ShippingAddress
        fields = (
            'id',
            'full_name',
            'email',
            'address',
            'city',
            'postal_code',
            'country',
        )


class OrderSerializer(serializers.ModelSerializer):
    """
    Shows complete order response.
    """

    order_items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)

    class Meta:
        model = Order
        fields = (
            'id',
            'user',
            'status',
            'paid',
            'total_amount',
            'order_items',
            'shipping_address',
            'created_at',
            'updated_at',
        )