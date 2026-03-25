# Implement Following and Followers Feature

This implementation plan outlines the steps needed to add follow functionality, allowing users to follow each other, and displaying accurate "Followers" and "Following" counts on user profiles and the Reel feed.

## Proposed Changes

### Backend (Database & Models)

#### [NEW] [Follow.ts](file:///c:/Users/Admin/Desktop/datingapp/models/Follow.ts)
- Create a new Mongoose schema to track follow relationships.
- Fields: `followerId` (ObjectId, ref: 'User') and `followingId` (ObjectId, ref: 'User').
- Add a compound unique index on `{ followerId: 1, followingId: 1 }` to prevent duplicate follows.

#### [MODIFY] [User.ts](file:///c:/Users/Admin/Desktop/datingapp/models/User.ts)
- Add `followersCount` (Number, default: 0) and `followingCount` (Number, default: 0) to `UserSchema`.

### API Routes

#### [NEW] [route.ts](file:///c:/Users/Admin/Desktop/datingapp/app/api/users/[id]/follow/route.ts)
- [POST](file:///c:/Users/Admin/Desktop/datingapp/app/api/reels/route.ts#109-157): Create a follow relationship, increment the target user's `followersCount` and the current user's `followingCount`.
- `DELETE`: Remove a follow relationship, decrement the counts.

#### [MODIFY] [route.ts](file:///c:/Users/Admin/Desktop/datingapp/app/api/users/[id]/route.ts)
- Update the GET profile endpoint to look up if the `currentUserId` (from the token) is following the requested user.
- Return `followersCount`, `followingCount`, and `isFollowing` in the response so the frontend can display them accurately.

#### [MODIFY] [route.ts](file:///c:/Users/Admin/Desktop/datingapp/app/api/reels/route.ts)
- When fetching reels, determine if the current user is following each reel's poster.
- Return `isFollowing` inside the `poster` object attached to each reel.

### Frontend (UI Components)

#### [MODIFY] [page.tsx](file:///c:/Users/Admin/Desktop/datingapp/app/(main)/user/[id]/page.tsx)
- Replace the hardcoded `0 Followers` and `0 Following` with actual counts from `profileUser.followersCount` and `profileUser.followingCount`.
- Add a dynamic "Follow" / "Unfollow" button next to the name/bio if the profile is not the current user's own profile.
- Implement the click handler to call the new `/api/users/[id]/follow` endpoints and optimistically update the state.

#### [MODIFY] [page.tsx](file:///c:/Users/Admin/Desktop/datingapp/app/(main)/profile/page.tsx)
- Similar to the public profile, fetch and display the current user's own `followersCount` and `followingCount` replacing the hardcoded `0` values.

#### [MODIFY] [page.tsx](file:///c:/Users/Admin/Desktop/datingapp/app/reels/page.tsx)
- Receive `isFollowing` from the reel's poster data.
- Update the Reel Card's "Follow" button to show "Following" if already followed, or visually hide it.
- Implement click handler to toggle follow status via API.

## Verification Plan

### Automated/Basic Tests
- Start the Next.js dev server successfully and check for compilation errors.

### Manual Verification
1. Login with user A. 
2. Go to user B's profile. Verify it initially says 0 followers/following.
3. Click "Follow". Verify the UI updates to show 1 follower for user B, and the button changes to "Unfollow".
4. Go to user A's own profile and check that it says 1 Following.
5. Go to Reels feed, find a reel by user B. Verify it shows "Following" (or the follow button is hidden). Find a reel by user C, and try following them directly from the reel. 
6. Refresh pages to ensure state persists (API/DB worked).
