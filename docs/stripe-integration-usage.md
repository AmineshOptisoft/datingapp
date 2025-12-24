# Stripe Integration - Example Usage

This document shows how to integrate the Stripe payment components into your AI profile pages.

## Using PricingCard Component

```tsx
import PricingCard from "@/components/stripe/PricingCard";

// In your AI profile page
export default function AIProfilePage({ profile }) {
    return (
        <div>
            <h1>{profile.name}</h1>
            {/* Other profile content */}
            
            {profile.pricing && (
                <PricingCard
                    aiProfileId={profile._id}
                    aiProfileName={profile.name}
                    pricing={profile.pricing}
                    onPurchase={() => {
                        console.log('Purchase initiated');
                    }}
                />
            )}
        </div>
    );
}
```

## Using CheckoutButton Component

```tsx
import CheckoutButton from "@/components/stripe/CheckoutButton";

// Quick purchase button
<CheckoutButton
    aiProfileId={profile._id}
    planType="monthly"
    buttonText="Subscribe Monthly"
    className="custom-class"
/>
```

## Checking User's Purchases

```tsx
// Fetch user's purchases
const fetchPurchases = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/stripe/user-purchases', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data.purchases;
};
```

## Checking Subscription Status for Specific AI Profile

```tsx
// Check if user has access to a specific AI profile
const checkAccess = async (aiProfileId: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `/api/stripe/subscription-status?aiProfileId=${aiProfileId}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    );
    const data = await response.json();
    return data.subscriptions.length > 0;
};
```
