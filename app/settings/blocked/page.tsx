'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldOff, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BlockedUser {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  blockedAt: string;
}

export default function BlockedListPage() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/users/blocked', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setBlockedUsers(data.blockedUsers);
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string, name: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setUnblockingId(userId);

    try {
      const res = await fetch(`/api/users/${userId}/block`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
        toast?.success?.(`${name} unblocked`) || alert(`${name} unblocked`);
      } else {
        toast?.error?.(data.error || 'Failed to unblock') || alert('Failed to unblock');
      }
    } catch {
      toast?.error?.('Network error') || alert('Network error');
    } finally {
      setUnblockingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white pt-20 pb-10 px-4 flex flex-col items-center transition-colors">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition text-sm font-medium group mb-4"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Blocked Users</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading blocked users...</p>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <UserX className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-base font-medium">No blocked users</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">Users you block will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  onClick={() => router.push(`/user/${user._id}`)}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-500 uppercase">
                        {(user.name || 'U')[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    {user.username && (
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate">@{user.username}</p>
                    )}
                    {user.blockedAt && (
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs">
                        Blocked on {formatDate(user.blockedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleUnblock(user._id, user.name)}
                  disabled={unblockingId === user._id}
                  className="ml-3 px-4 py-2 text-sm font-semibold rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                >
                  {unblockingId === user._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Unblock'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
