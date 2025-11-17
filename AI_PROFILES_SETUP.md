# AI Profiles Setup Guide

## 🚀 Quick Setup

After setting up your database, run one of these commands to create the 5 AI profiles:

### Method 1: Using npm script (Recommended)
```bash
npm run seed:ai-profiles
```

### Method 2: Using API endpoint
```bash
# POST request to setup endpoint
curl -X POST http://localhost:3000/api/setup
```

### Method 3: Using seeding API
```bash
# POST request to seeding endpoint  
curl -X POST http://localhost:3000/api/ai-profiles/seed
```

## 📋 What Gets Created

5 diverse female AI profiles:

1. **Priya Sharma (24)** - Creative Romantic 🎨💕
   - Graphic Designer from Mumbai
   - Loves art, photography, cats

2. **Ananya Gupta (26)** - Ambitious Professional 💪✨
   - Product Manager from Bangalore  
   - Fitness enthusiast, career-focused

3. **Kavya Reddy (23)** - Fun-loving Foodie 🍕😋
   - Food Blogger from Hyderabad
   - Social media influencer, loves dancing

4. **Meera Joshi (25)** - Intellectual Bookworm 📚✨
   - Research Analyst from Pune
   - Writer, philosophy lover, deep thinker

5. **Riya Malhotra (27)** - Adventure Seeker 🏔️🚀
   - Travel Photographer from Delhi
   - Motorcycling, trekking, fearless explorer

## 🎯 User Flow After Setup

1. **User logs in** → Sees dashboard
2. **Dashboard shows**:
   - "Find Someone to Chat" button
   - Quick profile preview (3 profiles)
   - Navigation to full profile selection

3. **Profile Selection** (`/select-profile`):
   - Beautiful cards showing all 5 profiles
   - Detailed bios, interests, photos
   - One-click selection and chat start

4. **Chat Integration**:
   - Selected profile info stored in localStorage
   - Redirects to `/messages?ai=profile_id`
   - Ready for AI conversation system

## 🔧 Verification

After setup, verify by:

1. **Check database**: AI profiles should be in `aiprofiles` collection
2. **Test API**: `GET /api/ai-profiles/available` should return 5 profiles
3. **Test UI**: Visit `/select-profile` to see profile cards
4. **Test dashboard**: Should show quick profile preview

## 🎨 Customization

To modify profiles:
- Edit `lib/ai-profiles-seeder.ts`
- Update profile data, photos, personalities
- Re-run seeding command

## 📱 Mobile Responsive

All components are mobile-responsive:
- Profile cards stack on mobile
- Touch-friendly buttons
- Optimized for all screen sizes

## 🔐 Security

- All APIs require authentication
- Profile selection is user-specific
- No sensitive AI data exposed to frontend

Ready to start chatting! 🎉
