from django.contrib import admin
from .models import (
    Category,
    Product,
    ProductInventory,
    Order,
    OrderItem,
    ProductImage,
    ShippingAddress,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'is_active',
        'created_at',
        'updated_at',
    )

    search_fields = (
        'name',
    )

    list_filter = (
        'is_active',
        'created_at',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductInventoryInline(admin.StackedInline):
    model = ProductInventory
    extra = 0
    max_num = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'price',
        'is_available',
        'created_at',
    )

    list_editable = (
        'price',
        'is_available',
    )

    search_fields = (
        'name',
        'description',
        'category__name',
    )

    list_filter = (
        'category',
        'is_available',
        'created_at',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    inlines = [
        ProductImageInline,
        ProductInventoryInline,
    ]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

    fields = (
        'product',
        'product_name',
        'unit_price',
        'quantity',
        'line_total',
    )

    readonly_fields = (
        'product_name',
        'unit_price',
        'quantity',
        'line_total',
    )

    def has_add_permission(self, request, obj=None):
        return False


class ShippingAddressInline(admin.StackedInline):
    model = ShippingAddress
    extra = 0
    max_num = 1

    fields = (
        'full_name',
        'email',
        'address',
        'city',
        'postal_code',
        'country',
    )

    readonly_fields = (
        'full_name',
        'email',
        'address',
        'city',
        'postal_code',
        'country',
    )

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'status',
        'paid',
        'total_amount',
        'created_at',
    )

    list_filter = (
        'status',
        'paid',
        'created_at',
    )

    search_fields = (
        'user__username',
        'user__email',
        'shipping_address__full_name',
        'shipping_address__email',
    )

    readonly_fields = (
        'user',
        'total_amount',
        'created_at',
        'updated_at',
    )

    fields = (
        'user',
        'status',
        'paid',
        'total_amount',
        'created_at',
        'updated_at',
    )

    inlines = [
        OrderItemInline,
        ShippingAddressInline,
    ]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'order',
        'product_name',
        'unit_price',
        'quantity',
        'line_total',
    )

    search_fields = (
        'product_name',
        'order__user__username',
        'order__user__email',
    )

    readonly_fields = (
        'line_total',
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = (
        'product',
        'alt_text',
        'is_primary',
        'uploaded_at',
    )

    list_filter = (
        'is_primary',
        'uploaded_at',
    )


@admin.register(ProductInventory)
class ProductInventoryAdmin(admin.ModelAdmin):
    list_display = (
        'product',
        'stock_quantity',
        'low_stock_level',
        'is_low_stock',
        'updated_at',
    )


@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = (
        'order',
        'full_name',
        'email',
        'city',
        'country',
    )

    search_fields = (
        'full_name',
        'email',
        'city',
        'country',
    )