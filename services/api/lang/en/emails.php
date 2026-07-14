<?php

return [
    'layout' => [
        'tagline' => 'Yerevan Digital — Built for Armenian businesses',
    ],

    'status' => [
        'pending'    => 'Pending',
        'paid'       => 'Paid',
        'processing' => 'Processing',
        'shipped'    => 'Shipped',
        'delivered'  => 'Delivered',
        'cancelled'  => 'Cancelled',
        'refunded'   => 'Refunded',
    ],

    'order_confirmation' => [
        'subject'          => 'Order Confirmed — #:number',
        'heading'          => 'Your order is confirmed!',
        'intro'            => 'Hi :name, thank you for your purchase. We have received your order and the seller will prepare it shortly.',
        'order_number'     => 'Order number',
        'status'           => 'Status',
        'confirmed'        => 'Confirmed',
        'date'             => 'Date',
        'items'            => 'Items ordered',
        'total'            => 'Total',
        'delivery_address' => 'Delivery address',
        'track'            => 'Track Your Order',
        'questions'        => 'If you have any questions, please contact the store directly or reply to this email.',
    ],

    'new_order' => [
        'subject'  => 'New Order #:number',
        'heading'  => 'You have a new order!',
        'intro'    => 'Your store just received a new order.',
        'number'   => 'Order #',
        'customer' => 'Customer',
        'total'    => 'Total',
        'items'    => 'Items',
        'view'     => 'View Order',
    ],

    'status_changed' => [
        'subject'   => 'Your order status updated #:number',
        'heading'   => 'Your order status has been updated',
        'intro'     => 'Your order #:number status has been updated.',
        'number'    => 'Order #',
        'status'    => 'Status',
        'total'     => 'Total',
        'shipped'   => 'Your order is on its way. You should receive it soon.',
        'delivered' => 'Your order has been delivered. Enjoy your purchase!',
    ],

    'store_approved' => [
        'subject' => 'Your store is now live on Yerevan Digital!',
        'heading' => 'Congratulations, :name!',
        'intro'   => 'Your store has been approved by the Yerevan Digital team and is now live.',
        'store'   => 'Store',
        'url'     => 'URL',
        'active'  => 'Active',
        'body'    => 'Your customers can now find and shop at your store on Yerevan Digital.',
        'manage'  => 'Manage Your Store',
    ],

    'store_suspended' => [
        'subject' => 'Your store has been suspended',
        'heading' => ':name, your store has been suspended',
        'intro'   => 'Your store ":store" has been suspended by the Yerevan Digital team.',
        'reason'  => 'Reason',
        'body'    => 'If you have questions, please contact our support team.',
        'contact' => 'Contact Support',
    ],

    'welcome' => [
        'subject'    => 'Welcome to Yerevan Digital!',
        'heading'    => 'Welcome, :name!',
        'intro'      => 'Thank you for registering on Yerevan Digital. Your account has been created successfully.',
        'about'      => 'Yerevan Digital lets you build your own Armenian online store with professional templates, local payment gateways, and easy management.',
        'next_steps' => 'Next steps',
        'step1'      => 'Create your store (name, slug, description)',
        'step2'      => 'Add your products',
        'step3'      => 'Set up your payment gateway',
        'step4'      => 'Share your store link with customers',
        'panel'      => 'Go to Seller Panel',
    ],

    'orders_export' => [
        'subject' => 'Orders Export — :store',
        'line'    => 'Please find your orders export attached as a CSV file.',
    ],
];
