from django.contrib import admin
from django import forms
from django.forms.models import BaseInlineFormSet

from .models import (
    Category,
    Product,
    ProductInventory,
    Order,
    OrderItem,
    ProductImage,
    ShippingAddress,
    Cart,
    CartItem,
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


class ProductImageInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()

        active_image_forms = []
        primary_forms = []

        for form in self.forms:
            if not hasattr(form, 'cleaned_data'):
                continue

            cleaned_data = form.cleaned_data

            if not cleaned_data:
                continue

            if cleaned_data.get('DELETE'):
                continue

            image = cleaned_data.get('image')
            existing_image = form.instance.pk

            if image or existing_image:
                active_image_forms.append(form)

                if cleaned_data.get('is_primary'):
                    primary_forms.append(form)

        if not active_image_forms:
            return

        if len(primary_forms) > 1:
            raise forms.ValidationError(
                'Only one product image can be marked as primary.'
            )

        if len(primary_forms) == 0:
            first_form = active_image_forms[0]
            first_form.cleaned_data['is_primary'] = True
            first_form.instance.is_primary = True


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    formset = ProductImageInlineFormSet
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

    inlines = [
        OrderItemInline,
        ShippingAddressInline,
    ]

    def get_fields(self, request, obj=None):
        return (
            'user',
            'status',
            'paid',
            'total_amount',
            'created_at',
            'updated_at',
        )

    def get_readonly_fields(self, request, obj=None):
        base = ['total_amount', 'created_at', 'updated_at']
        if obj is not None:
            # Editing an existing order: lock the user, it shouldn't change
            # once the order is placed. On the add form (obj is None) user
            # stays editable so it can actually be selected.
            base.insert(0, 'user')
        return base


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

    def get_fields(self, request, obj=None):
        fields = ['order', 'product', 'product_name', 'unit_price', 'quantity']
        if obj is not None:
            # line_total is only safe to render once unit_price/quantity
            # are actually saved; on the blank "add" form those are None
            # and evaluating the property crashes (fixed defensively in
            # the model too, but we also just hide it here on add).
            fields.append('line_total')
        return fields

    def get_readonly_fields(self, request, obj=None):
        if obj is not None:
            return ('line_total',)
        return ()


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

    search_fields = (
        'product__name',
    )

    list_filter = (
        'updated_at',
    )

    readonly_fields = (
        'updated_at',
    )

    def is_low_stock(self, obj):
        return obj.is_low_stock
    is_low_stock.boolean = True
    is_low_stock.short_description = 'Low stock?'


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


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0

    fields = (
        'product',
        'quantity',
        'line_total_display',
    )

    readonly_fields = (
        'line_total_display',
    )

    def line_total_display(self, obj):
        if obj.pk:
            return obj.line_total
        return '-'
    line_total_display.short_description = 'Line total'


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'total_items',
        'cart_total',
        'created_at',
        'updated_at',
    )

    search_fields = (
        'user__username',
        'user__email',
    )

    list_filter = (
        'created_at',
        'updated_at',
    )

    inlines = [
        CartItemInline,
    ]

    def get_fields(self, request, obj=None):
        return ('user', 'created_at', 'updated_at')

    def get_readonly_fields(self, request, obj=None):
        base = ['created_at', 'updated_at']
        if obj is not None:
            # Lock the owner once the cart exists; only selectable on add.
            base.insert(0, 'user')
        return base

    def total_items(self, obj):
        return obj.total_items

    def cart_total(self, obj):
        return obj.cart_total


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        'cart',
        'product',
        'quantity',
        'line_total',
        'created_at',
        'updated_at',
    )

    search_fields = (
        'cart__user__username',
        'cart__user__email',
        'product__name',
    )

    list_filter = (
        'created_at',
        'updated_at',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )
