"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    setName(userData.name || "");
    setBio(userData.bio || "");
    setEmail(userData.email || "");
    setPhone(userData.phone || "");
    setPreview(userData.avatar || null);
  }, [router]);

  // Convert image file to base64 string
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
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setAvatarBase64(null);
      } else {
        setMessage(data.message || "Update failed");
      }
    } catch {
      setMessage("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-300 bg-zinc-950/90">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 md:px-8 py-6">
      <div className="max-w-3xl mx-auto bg-zinc-900/70 border border-white/10 shadow-2xl rounded-3xl p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Edit Profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Avatar
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center border-4 border-pink-500/40">
                {preview ? (
                  <img
                    src={preview}
                    alt="Avatar Preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="cursor-pointer text-sm text-pink-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Other inputs */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-white/15 bg-zinc-900/70 text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none placeholder-zinc-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full border border-white/15 bg-zinc-900/70 text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none resize-none placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-white/15 bg-zinc-900/70 text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none placeholder-zinc-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-white/15 bg-zinc-900/70 text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none placeholder-zinc-500"
              placeholder="+1234567890"
              required
            />
          </div>

          {/* Message */}
          {message && (
            <p
              className={`text-center ${
                message.includes("success") ? "text-green-400" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition shadow-lg"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
