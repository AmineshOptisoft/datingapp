"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: string;
  country?: string;
  characterCount: number;
  followersCount: number;
  followingCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formAvatar, setFormAvatar] = useState("");
  const [formAvatarFile, setFormAvatarFile] = useState<File | null>(null);
  const [formAvatarPreview, setFormAvatarPreview] = useState("");
  const [formCountry, setFormCountry] = useState("USA");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.url;
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormAvatarFile(file);
      setFormAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!formName || !formEmail) return toast.error("Name and email are required");
    setSubmitting(true);
    try {
      let avatarUrl = formAvatar;
      if (formAvatarFile) {
        avatarUrl = await uploadAvatar(formAvatarFile);
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, password: formPassword || undefined, avatar: avatarUrl || undefined, country: formCountry }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch (err) {
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingUser || !formName || !formEmail) return toast.error("Name and email are required");
    setSubmitting(true);
    try {
      let avatarUrl = formAvatar;
      if (formAvatarFile) {
        avatarUrl = await uploadAvatar(formAvatarFile);
      }

      const res = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, avatar: avatarUrl, country: formCountry }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update user");
      }
    } catch (err) {
      toast.error("Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        setShowDeleteConfirm(null);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormAvatar("");
    setFormAvatarFile(null);
    setFormAvatarPreview("");
    setFormCountry("USA");
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormAvatar(user.avatar || "");
    setFormAvatarPreview(user.avatar || "");
    setFormAvatarFile(null);
    setFormCountry(user.country || "USA");
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profiles</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{pagination.total} total users</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className={`w-full pl-11 pr-4 py-3 border rounded-xl placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all text-sm ${
            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        />
      </form>

      {/* Users Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <th className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>User</th>
                <th className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Email</th>
                <th className={`text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Country</th>
                <th className={`text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Characters</th>
                <th className={`text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Followers</th>
                <th className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Joined</th>
                <th className={`text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className={`h-10 rounded-lg animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className={`w-10 h-10 rounded-full object-cover ring-2 ${isDark ? 'ring-white/10' : 'ring-gray-200'}`} />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                          <p className={`text-xs md:hidden ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm hidden md:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{user.email}</td>
                    <td className={`px-6 py-4 text-center text-sm hidden sm:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{user.country || "USA"}</td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {user.characterCount}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-center text-sm hidden lg:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{user.followersCount}</td>
                    <td className={`px-6 py-4 text-sm hidden lg:table-cell ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                      {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/profile?pid=${user._id}`)}
                          className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-green-400' : 'hover:bg-gray-100 text-gray-400 hover:text-green-600'}`}
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(user._id)}
                          className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - always visible */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className={`p-2 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark ? 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className={`p-2 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark ? 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
      </div>

      {/* ============ CREATE USER MODAL ============ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}>
          <div className={`w-full max-w-lg border rounded-2xl shadow-2xl ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className={isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {formAvatarPreview ? (
                    <img src={formAvatarPreview} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-pink-500/30" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <UserCircle className="w-8 h-8 text-zinc-500" />
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 hover:bg-white/10 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  Upload Avatar
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name *</label>
                <input
                  type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none text-sm" placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email *</label>
                <input
                  type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none text-sm" placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Country</label>
                <input
                  type="text" value={formCountry} onChange={(e) => setFormCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none text-sm" placeholder="USA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
                <input
                  type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none text-sm" placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleCreate} disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ EDIT USER MODAL ============ */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowEditModal(false) }}>
          <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {formAvatarPreview ? (
                    <img src={formAvatarPreview} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-pink-500/30" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <UserCircle className="w-8 h-8 text-zinc-500" />
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 hover:bg-white/10 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  Change Avatar
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name *</label>
                <input
                  type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email *</label>
                <input
                  type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Country</label>
                <input
                  type="text" value={formCountry} onChange={(e) => setFormCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none text-sm" placeholder="USA"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleEdit} disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DELETE CONFIRM MODAL ============ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(null) }}>
          <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete User?</h3>
              <p className="text-zinc-400 text-sm">This action cannot be undone. All user data including characters will be permanently deleted.</p>
            </div>
            <div className="flex items-center gap-3 p-6 border-t border-white/10">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm text-zinc-400 border border-white/10 rounded-xl hover:bg-white/5 transition-all">Cancel</button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
