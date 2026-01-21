"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Share, Grid, Heart, User, Mic, FileText, MessageSquare, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EditProfileForm from "./EditProfileForm";
import CreatePersonaForm from "./CreatePersonaForm";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("characters");
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/");
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400 bg-white dark:bg-zinc-950">
        <div className="text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  // Generate a handle from email or use name if available, for display
  const handle = user.username || user.email?.split('@')[0] || "User";

  const tabs = [
    { id: "characters", label: "Characters", icon: Grid },
    { id: "liked", label: "Liked", icon: Heart },
    { id: "personas", label: "Personas", icon: User },
    { id: "voices", label: "Voices", icon: Mic },
    { id: "scenes", label: "Scenes", icon: FileText },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white pt-20 pb-10 px-4 flex flex-col items-center transition-colors">

      {/* Profile Header */}
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-6">

        {/* Avatar */}
        <div className="relative group">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-gradient-to-br from-lime-400 to-yellow-400 p-[2px] shadow-2xl shadow-lime-500/20">
            <div className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden transition-colors">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white uppercase transition-colors">
                  {user.name?.[0] || handle[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 transition-all">
            {user.name || handle}
          </h1>
          {/* <p className="text-zinc-500 text-sm">@{handle}</p> */}
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-6 text-sm text-zinc-500 font-medium">
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">
            <span className="font-bold text-zinc-900 dark:text-white">0</span> Followers
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">
            <span className="font-bold text-zinc-900 dark:text-white">0</span> Following
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>0 Interactions</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {/* Settings Modal Trigger */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-full text-sm font-medium transition-all group">
                <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white transition-transform duration-500 group-hover:rotate-180" />
                <span className="text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">Settings</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <EditProfileForm user={user} onSuccess={() => {
                // Refresh user data from local storage
                const updated = localStorage.getItem("user");
                if (updated) setUser(JSON.parse(updated));
              }} />
            </DialogContent>
          </Dialog>

          <button className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-full transition-all text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
            <Share className="w-4 h-4" />
          </button>
        </div>


        {/* Tabs Navigation */}
        <div className="w-full mt-8 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-center gap-6 md:gap-10 overflow-x-auto pb-px scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative pb-3 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white rounded-full transition-all layout-id-underline" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Placeholder */}
        <div className="w-full py-12 text-center">
          {activeTab === 'characters' && (
            <div className="text-zinc-500">
              You haven't made any Characters yet.
            </div>
          )}

          {activeTab === 'personas' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-zinc-900 dark:text-zinc-100 font-medium">Create a persona</p>
              <Dialog open={isPersonaDialogOpen} onOpenChange={setIsPersonaDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-full font-medium transition-all shadow-sm">
                    <Plus className="w-4 h-4" />
                    New
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] h-[90vh] flex flex-col p-3">
                  <div className="flex-none">
                    <h2 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">Create Your Character</h2>
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <CreatePersonaForm onSuccess={() => setIsPersonaDialogOpen(false)} onClose={() => setIsPersonaDialogOpen(false)} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeTab !== 'characters' && activeTab !== 'personas' && (
            <div className="text-zinc-500">
              No {activeTab} found.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
