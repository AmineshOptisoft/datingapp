// app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col space-y-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-8">Menu</h2>

        <button
          onClick={() => router.push("/profile")}
          className="py-3 px-6 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
        >
          Profile
        </button>

        <button
          onClick={() => router.push("/messages")}
          className="py-3 px-6 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
        >
          Messages
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 mb-4">
          Welcome to your dashboard!
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl">
          Here you can access your profile or start chatting with our AI-powered
          assistant via the Messages section.
        </p>
      </main>
    </div>
  );
}
