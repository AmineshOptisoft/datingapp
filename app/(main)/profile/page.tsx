"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Share, Grid, Heart, User, Mic, FileText, MessageSquare, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EditProfileForm from "./EditProfileForm";
import CreatePersonaForm from "./CreatePersonaForm";
import CreatePersonaDialog from "./CreatePersonaDialog";
import EditPersonaDialog from "./EditPersonaDialog";
import EditCharacterDialog from "./EditCharacterDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("characters");
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);
  const [isCreatePersonaDialogOpen, setIsCreatePersonaDialogOpen] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [openPersonaMenuId, setOpenPersonaMenuId] = useState<string | null>(null);
  const [isEditPersonaDialogOpen, setIsEditPersonaDialogOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditCharacterDialogOpen, setIsEditCharacterDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [openCharacterMenuId, setOpenCharacterMenuId] = useState<string | null>(null);

  const fetchCharacters = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
 
      const userData = JSON.parse(storedUser);
      console.log("Fetching characters for user:", userData); // Debug
      
      // Try different possible user ID fields
      const userId = userData._id || userData.id || userData.userId;
      
      if (!userId) {
        console.error("No user ID found in user object:", userData);
        return;
      }

      console.log("Fetching with userId:", userId); // Debug
      setLoadingCharacters(true);

      const response = await fetch(`/api/characters?userId=${userId}`, {
        signal: controller.signal,
      });
      const data = await response.json();

      console.log("Fetched characters:", data); // Debug

      if (data.success) {
        setCharacters(data.data || []);
      }
    } catch (error) {
      if ((error as any)?.name === "AbortError") {
        console.error("Fetch characters timed out");
      } else {
        console.error("Error fetching characters:", error);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoadingCharacters(false);
    }
  };

  const fetchPersonas = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const userData = JSON.parse(storedUser);
      const userId = userData._id || userData.id || userData.userId;

      if (!userId) {
        console.error("User ID not found");
        return;
      }

      setLoadingPersonas(true);
      const response = await fetch(`/api/personas?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch personas");
      }

      const data = await response.json();
      setPersonas(data.personas || []);
    } catch (error) {
      console.error("Error fetching personas:", error);
      setPersonas([]);
    } finally {
      setLoadingPersonas(false);
    }
  };

  const handleDeletePersona = async () => {
    if (!personaToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/personas/${personaToDelete._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete persona");
        return;
      }

      toast.success("Persona deleted successfully!");
      fetchPersonas(); // Refresh list
    } catch (error) {
      console.error("Error deleting persona:", error);
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
      setPersonaToDelete(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchCharacters();
    fetchPersonas();
  }, [router]);

  if (!user) {
    return <LoadingSpinner icon={User} title="Loading Profile" subtitle="Getting your information..." />;
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
        <div className="w-full py-6 text-center">
          {activeTab === 'characters' && (
            <div>
              {/* Character Grid First */}
              {loadingCharacters ? (
                <div className="text-zinc-500 animate-pulse">Loading characters...</div>
              ) : characters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {characters.map((character: any) => (
                    <div
                      key={character._id}
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                    >
                      {/* Character Image */}
                      <div className="relative h-48 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        {character.characterImage ? (
                          <img
                            src={character.characterImage}
                            alt={character.characterName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <User className="w-12 h-12" />
                          </div>
                        )}
                        
                        {/* Action Menu Button (Three Dots) */}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCharacterMenuId(openCharacterMenuId === character._id ? null : character._id);
                            }}
                            className="p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                          >
                            <svg className="w-5 h-5 text-zinc-700 dark:text-zinc-300" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {openCharacterMenuId === character._id && (
                            <>
                              {/* Backdrop */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenCharacterMenuId(null)}
                              />
                              
                              {/* Menu */}
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden z-20">
                                <button
                                  onClick={() => {
                                    setSelectedCharacter(character);
                                    setIsEditCharacterDialogOpen(true);
                                    setOpenCharacterMenuId(null);
                                  }}
                                  className="w-full px-4 py-3 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Character Info */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">
                          {character.characterName}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          Age: {character.characterAge} • {character.language}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {character.description}
                        </p>
                        
                        {/* Tags */}
                        {character.tags && character.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {character.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-pink-500/10 text-pink-500 text-xs rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                            {character.tags.length > 3 && (
                              <span className="px-2 py-0.5 text-zinc-500 text-xs">
                                +{character.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Character Creation Section Below */}
              <div className="flex flex-col items-center gap-4 mt-8">
                {!loadingCharacters && characters.length === 0 && (
                  <p className="text-zinc-500 mb-4">
                    No characters yet. Create your first character!
                  </p>
                )}
                
                {characters.length >= 5 ? (
                  <div className="text-center space-y-2">
                    <p className="text-amber-600 dark:text-amber-500 font-medium">
                      Character limit reached (5/5)
                    </p>
                    <p className="text-sm text-zinc-500">
                      Delete a character to create a new one
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-zinc-500">
                      {characters.length}/5 characters created
                    </p>
                    <Dialog open={isPersonaDialogOpen} onOpenChange={setIsPersonaDialogOpen}>
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-full font-medium transition-all shadow-sm">
                          <Plus className="w-4 h-4" />
                          New Character
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] h-[90vh] flex flex-col p-3">
                        <div className="flex-none">
                          <h2 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">Create Your Character</h2>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0">
                          <CreatePersonaForm 
                            onSuccess={() => {
                              setIsPersonaDialogOpen(false);
                              fetchCharacters(); // Refresh the character list
                            }} 
                            onClose={() => setIsPersonaDialogOpen(false)} 
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'personas' && (
            <div className="flex flex-col gap-6">
              {/* Personas List */}
              {loadingPersonas ? (
                <div className="text-zinc-500">Loading personas...</div>
              ) : personas.length > 0 ? (
                <div className="space-y-3">
                  {personas.map((persona: any) => (
                    <div
                      key={persona._id}
                      className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {persona.avatar ? (
                            <img src={persona.avatar} alt={persona.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-white">
                              {persona.displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0 text-left">
                          <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                            {persona.displayName}
                          </h3>
                          {persona.background && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                              {persona.background}
                            </p>
                          )}
                        </div>

                        {/* Options Menu */}
                        <div className="relative">
                          <button 
                            onClick={() => setOpenPersonaMenuId(openPersonaMenuId === persona._id ? null : persona._id)}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="5" r="1.5"/>
                              <circle cx="10" cy="10" r="1.5"/>
                              <circle cx="10" cy="15" r="1.5"/>
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {openPersonaMenuId === persona._id && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10 min-w-[180px]">
                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setSelectedPersona(persona);
                                  setIsEditPersonaDialogOpen(true);
                                  setOpenPersonaMenuId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
                              >
                                <span>Edit</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>

                              {/* Make default */}
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/personas/${persona._id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ makeDefault: true }),
                                    });

                                    if (!response.ok) {
                                      const data = await response.json();
                                      toast.error(data.error || "Failed to set as default");
                                      return;
                                    }

                                    toast.success("Set as default persona!");
                                    fetchPersonas(); // Refresh list
                                  } catch (error) {
                                    console.error("Error setting default:", error);
                                    alert("An error occurred");
                                  }
                                  setOpenPersonaMenuId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
                              >
                                <span>Make default</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>

                              {/* Remove */}
                              <button
                                onClick={() => {
                                  setPersonaToDelete(persona);
                                  setIsDeleteConfirmOpen(true);
                                  setOpenPersonaMenuId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
                              >
                                <span>Remove</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Default Badge */}
                      {persona.makeDefault && (
                        <div className="absolute top-2 right-2">
                          <span className="inline-block px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                            Default
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-zinc-500 py-8">
                  No personas created yet
                </div>
              )}

              {/* Create Persona Button */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-zinc-900 dark:text-zinc-100 font-medium">Create a persona</p>
                <Dialog open={isCreatePersonaDialogOpen} onOpenChange={setIsCreatePersonaDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-full font-medium transition-all shadow-sm">
                      <Plus className="w-4 h-4" />
                      New
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[75vh] h-auto p-0 bg-transparent border-0">
                    <CreatePersonaDialog 
                      onSuccess={() => {
                        setIsCreatePersonaDialogOpen(false);
                        fetchPersonas(); // Refresh personas list
                      }} 
                      onClose={() => setIsCreatePersonaDialogOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {activeTab !== 'characters' && activeTab !== 'personas' && (
            <div className="text-zinc-500">
              No {activeTab} found.
            </div>
          )}
        </div>

      </div>

      {/* Edit Persona Dialog */}
      <Dialog open={isEditPersonaDialogOpen} onOpenChange={setIsEditPersonaDialogOpen}>
        <DialogContent className="max-w-md max-h-[75vh] h-auto p-0 bg-transparent border-0">
          {selectedPersona && (
            <EditPersonaDialog 
              persona={selectedPersona}
              onSuccess={() => {
                setIsEditPersonaDialogOpen(false);
                setSelectedPersona(null);
                fetchPersonas(); // Refresh personas list
              }} 
              onClose={() => {
                setIsEditPersonaDialogOpen(false);
                setSelectedPersona(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Delete Persona</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-white">{personaToDelete?.displayName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setPersonaToDelete(null);
                }}
                disabled={isDeleting}
                className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePersona}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Character Dialog */}
      <Dialog open={isEditCharacterDialogOpen} onOpenChange={setIsEditCharacterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] h-[90vh] flex flex-col p-3 bg-white dark:bg-zinc-900">
          {selectedCharacter && (
            <EditCharacterDialog 
              character={selectedCharacter}
              onSuccess={() => {
                setIsEditCharacterDialogOpen(false);
                setSelectedCharacter(null);
                fetchCharacters(); // Refresh characters list
              }} 
              onClose={() => {
                setIsEditCharacterDialogOpen(false);
                setSelectedCharacter(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}