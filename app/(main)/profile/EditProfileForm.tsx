"use client";

import { useState, ChangeEvent } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface EditProfileFormProps {
    user: any;
    onSuccess?: () => void;
}

export default function EditProfileForm({ user, onSuccess }: EditProfileFormProps) {
    const { updateUser } = useAuth();
    const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(user?.avatar || null);
    const [name, setName] = useState(user?.name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                setAvatarBase64(result);
                setPreview(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    name,
                    bio,
                    email,
                    phone,
                    avatarBase64,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage("Profile updated successfully!");
                const updatedUser = { ...user, ...data.data };
                localStorage.setItem("user", JSON.stringify(updatedUser)); // Keep strictly local storage logic if that's what was there, though context usually handles it.

                // Update AuthContext
                updateUser({
                    name: data.data.name,
                    bio: data.data.bio,
                    avatar: data.data.avatar,
                    phone: data.data.phoneNumber,
                });

                setAvatarBase64(null);
                if (onSuccess) onSuccess();
            } else {
                setMessage(data.message || "Update failed");
            }
        } catch {
            setMessage("Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Update your personal information
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 p-[3px] shadow-lg">
                            <div className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Avatar"
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <label className="absolute bottom-0 right-0 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-all hover:scale-110">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all placeholder:text-zinc-400"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all placeholder:text-zinc-400"
                            placeholder="Tell us a bit about yourself..."
                        />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg px-4 py-2.5 cursor-not-allowed"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all placeholder:text-zinc-400"
                            placeholder="+1 234 567 8900"
                            required
                        />
                    </div>
                </div>

                {/* Success/Error Message */}
                {message && (
                    <div
                        className={`px-4 py-3 rounded-lg text-sm font-medium ${message.includes("success")
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                            }`}
                    >
                        {message}
                    </div>
                )}

                {/* Submit Button */}
                <DialogFooter>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </DialogFooter>
            </form>
        </div>
    );
}
