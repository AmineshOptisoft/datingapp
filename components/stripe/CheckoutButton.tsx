"use client";

import React, { useState } from "react";

interface CheckoutButtonProps {
    aiProfileId: string;
    planType: 'monthly' | 'annual' | 'lifetime';
    buttonText?: string;
    className?: string;
}

export default function CheckoutButton({
    aiProfileId,
    planType,
    buttonText = "Purchase Now",
    className = ""
}: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login to continue');
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    aiProfileId,
                    planType,
                }),
            });

            const data = await response.json();

            if (data.success && data.url) {
                // Redirect to Stripe checkout
                window.location.href = data.url;
            } else {
                alert(data.message || 'Failed to create checkout session');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert('Failed to initiate checkout');
            setLoading(false);
        }
    };

    return (
        <button
            className={`checkout-button ${className}`}
            onClick={handleCheckout}
            disabled={loading}
        >
            {loading ? 'Processing...' : buttonText}
        </button>
    );
}
