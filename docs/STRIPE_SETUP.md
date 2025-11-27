# Stripe Integration - Quick Setup Guide

## 🚀 Quick Start

### 1. Environment Variables (REQUIRED)

Add to your `.env.local`:

```env
# Add this line (get from Stripe Dashboard after webhook setup)
STRIPE_WEBHOOK_SECRET=whsec_...

# Add this line
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Update AI Profiles with Pricing

You need to add pricing information to each AI profile in your database. Here's a script to help:

```javascript
// Run this in MongoDB or create a migration script
db.aiprofiles.updateMany(
  {},
  {
    $set: {
      pricing: {
        monthlyPrice: 9.99,
        annualPrice: 99.99,
        lifetimePrice: 249.99,
        monthlyPriceId: "price_xxxxx",  // Get from Stripe Dashboard
        annualPriceId: "price_xxxxx",   // Get from Stripe Dashboard
        lifetimePriceId: "price_xxxxx"  // Get from Stripe Dashboard
      }
    }
  }
);
```

### 3. Stripe Dashboard Setup

1. **Create Products** (Stripe Dashboard → Products → Add Product)
   - Create a product for each AI profile
   - Add 3 prices per product:
     - Monthly recurring ($9.99/month)
     - Annual recurring ($99.99/year)
     - One-time payment ($249.99)

2. **Setup Webhooks** (Stripe Dashboard → Developers → Webhooks)
   - Endpoint URL: `http://localhost:3000/api/stripe/webhook` (for testing)
   - Events to select:
     - ✅ checkout.session.completed
     - ✅ customer.subscription.created
     - ✅ customer.subscription.updated
     - ✅ customer.subscription.deleted
     - ✅ invoice.payment_succeeded
     - ✅ invoice.payment_failed
   - Copy the webhook signing secret → Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 4. Test with Stripe CLI (Local Development)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

### 5. Test Card Numbers

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Use any future expiry date and any 3-digit CVC

---

## 📝 Integration Example

```tsx
import PricingCard from "@/components/stripe/PricingCard";

// In your AI profile page
export default function ProfilePage({ profile }) {
    return (
        <div>
            <h1>{profile.name}</h1>
            
            {profile.pricing && (
                <PricingCard
                    aiProfileId={profile._id}
                    aiProfileName={profile.name}
                    pricing={profile.pricing}
                />
            )}
        </div>
    );
}
```

---

## ✅ What's Already Done

- ✅ All backend API routes created
- ✅ Webhook handler with signature verification
- ✅ Automatic Stripe customer creation
- ✅ Frontend components (PricingCard, CheckoutButton)
- ✅ Success/Cancel pages
- ✅ Subscription management APIs

## ⏳ What You Need to Do

1. Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
2. Add `NEXT_PUBLIC_APP_URL` to `.env.local`
3. Create products and prices in Stripe Dashboard
4. Update AI profiles with Stripe Price IDs
5. Configure webhook endpoint in Stripe Dashboard
6. Test the complete flow

---

## 🔍 Testing Checklist

- [ ] Can create checkout session
- [ ] Redirects to Stripe checkout
- [ ] Payment completes successfully
- [ ] Webhook receives events
- [ ] Subscription saved to database
- [ ] User can see their purchases
- [ ] Success page displays correctly
- [ ] Cancel page works

---

## 📚 Documentation

- [Full Walkthrough](file:///C:/Users/optisoft/.gemini/antigravity/brain/c12eff3a-a5b2-4a22-a50b-b52ded88823f/walkthrough.md)
- [Usage Examples](file:///d:/datingapp/docs/stripe-integration-usage.md)
