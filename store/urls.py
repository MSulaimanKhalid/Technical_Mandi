from django.urls import path
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    CartDetailView,
    CartAddView,
    CartUpdateView,
    CartRemoveView,
    CartClearView,
    CheckoutView,
    OrderHistoryView,
    OrderDetailView,
)


urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('cart/', CartDetailView.as_view(), name='cart-detail'),
    path('cart/add/', CartAddView.as_view(), name='cart-add'),
    path('cart/update/<int:product_id>/', CartUpdateView.as_view(), name='cart-update'),
    path('cart/remove/<int:product_id>/', CartRemoveView.as_view(), name='cart-remove'),
    path('cart/clear/', CartClearView.as_view(), name='cart-clear'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('orders/', OrderHistoryView.as_view(), name='order-history'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
