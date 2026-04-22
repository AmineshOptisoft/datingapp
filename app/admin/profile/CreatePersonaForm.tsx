"use client";

import { useState } from "react";
import { Plus, X, Upload, Image as ImageIcon, ChevronDown, Loader2, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const TAG_CATEGORIES = {
    default: ["NSFW", "Monster Girl", "Worlds-End-Challenge"],
    "Character Type": ["Female", "Male", "Non-human", "Non-binary", "Object", "Myth", "Queer"],
    Genre: [
        "Different Personalities", "Fantasy & Kinks", "Infidelity & Drama", "Nationalities & Cultures", "Relationship Stages",
        "Scenario", "Multiple", "Fictional", "RPG", "Romantic", "Magical", "Hentai", "Wholesome",
        "Anime", "Royalty", "Assistant", "Action", "Religion", "Historical", "Sci-Fi", "Horror",
        "Seinen", "Fandom", "Philosophy", "Politics", "Non-English", "Detective", "Manga"
    ],
    Origin: ["Original Character (OC)", "Game", "Movie", "Books", "VTuber", "Folklore"],
    Goal: ["Erotic Roleplay", "Breeding", "Femdom"],
    Personality: [
        "Submissive", "Dominant", "Milf", "Bully", "Switch", "Femboy", "Tsundere", "Yandere",
        "Villain", "Tomboy", "Sissy", "Hero", "Deredere", "Dandere", "Dilf", "Kuudere"
    ],
    "Physical Traits": [
        "Petite", "Futa", "Realistic", "Goth", "BBW", "Demi Human", "Monster", "Elf",
        "Shortstack", "Robot", "Maid", "Succubus", "Giant", "Pregnant", "Alien"
    ],
    Fantasy: ["Cheating", "Cuckold", "CNC", "NTR", "Chastity", "Hypno", "BDSM", "Voyeur", "Bondage"],
    Sexuality: ["Straight", "Bisexual", "Gay", "Lesbian", "Asexual"],
    Kink: ["Worship", "Feet"],
    Ethnicity: ["Arab"],
    Religion: ["Muslim"]
};

export default function CreatePersonaForm({ onSuccess, onClose, targetUserId }: { onSuccess?: () => void; onClose?: () => void; targetUserId?: string }) {
    const [name, setName] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [age, setAge] = useState("18");
    const [gender, setGender] = useState<"male" | "female" | "other">("female");
    const [language, setLanguage] = useState("English");
    const [tags, setTags] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [personality, setPersonality] = useState("");
    const [scenario, setScenario] = useState("");
    const [firstMessage, setFirstMessage] = useState("");
    const [visibility, setVisibility] = useState("private");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [tagSearch, setTagSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                toast.error("Video size must be less than 1 MB.");
                return;
            }
            setVideoFile(file);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter((t) => t !== tag));
        } else {
            if (tags.length >= 10) return; // Limit matched screenshot helper text
            setTags([...tags, tag]);
        }
    };

    const handleSubmit = async () => {
        try {
            // Validation
            if (!name.trim()) {
                toast.error("Character name is required");
                return;
            }
            
            const ageNum = parseInt(age);
            if (isNaN(ageNum) || ageNum < 18) {
                toast.error("Character must be at least 18 years old");
                return;
            }

            if (!description.trim() || !personality.trim() || !scenario.trim() || !firstMessage.trim()) {
                toast.error("All fields (description, personality, scenario, first message) are required");
                return;
            }

            // Get user ID from localStorage
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                toast.error("User not found. Please login again.");
                return;
            }

            const user = JSON.parse(storedUser);
            console.log("User from localStorage:", user); // Debug
            
            // Use targetUserId if provided (admin creating for another user), else use own ID
            const userId = targetUserId || user._id || user.id || user.userId;
            
            if (!userId) {
                console.error("No user ID found in user object:", user);
                toast.error("User ID not found. Please try logging out and logging back in.");
                return;
            }

            console.log("Using userId:", userId, targetUserId ? "(target user)" : "(self)"); // Debug

            setIsCreating(true);

            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("characterName", name.trim());
            formData.append("characterAge", ageNum.toString());
            formData.append("characterGender", gender);
            formData.append("language", language);
            formData.append("tags", JSON.stringify(tags));
            formData.append("description", description.trim());
            formData.append("personality", personality.trim());
            formData.append("scenario", scenario.trim());
            formData.append("firstMessage", firstMessage.trim());
            formData.append("visibility", visibility.toLowerCase());

            if (imageFile) {
                formData.append("characterImage", imageFile);
            }

            if (videoFile) {
                formData.append("characterVideo", videoFile);
            }

            console.log("Sending character data via FormData"); // Debug

            // Call API
            const response = await fetch("/api/characters", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                toast.error(data.message || "Failed to create character");
                setIsCreating(false);
                return;
            }

            // Success
            toast.success("Character created successfully!");
            
            // Reset form
            setName("");
            setImageFile(null);
            setImagePreview(null);
            setAge("18");
            setLanguage("English");
            setTags([]);
            setDescription("");
            setPersonality("");
            setScenario("");
            setFirstMessage("");
            setVisibility("Private");
            setVideoFile(null);

            // Call onSuccess callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Error creating character:", error);
            toast.error("An error occurred while creating the character");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[85vh]">
            {/* Custom Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-1 pr-4 -mr-3 custom-scrollbar">
                <div className="space-y-6 pb-6">

                    {/* Character Name */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                            Character Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all placeholder:text-zinc-400"
                            placeholder="e.g. Miles Morales"
                        />
                        <p className="text-xs text-zinc-500 mt-1.5">This is your character's display name.</p>
                    </div>

                    {/* Media Setup */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Previews container */}
                        <div className="flex gap-4 shrink-0 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                            <div className="shrink-0 w-32 h-44 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-zinc-400">
                                        <ImageIcon className="w-8 h-8 opacity-50" />
                                        <span className="text-xs mt-2 opacity-50">?</span>
                                    </div>
                                )}
                            </div>

                            {videoFile && (
                                <div className="shrink-0 w-32 h-44 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                    <video 
                                        src={URL.createObjectURL(videoFile)} 
                                        className="w-full h-full object-cover" 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                    />
                                    <div 
                                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center" 
                                        onClick={() => { setVideoFile(null); }}
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                        <Film className="w-3 h-3" /> Video
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                                    Character Image
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm font-medium rounded-md cursor-pointer transition-colors">
                                        <Upload className="w-4 h-4" />
                                        Choose file
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                    <span className="text-zinc-500 text-sm">{imageFile ? imageFile.name : 'No file chosen'}</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                    Upload or generate an image that represents your character. Make sure these images comply to <span className="text-blue-500 hover:underline cursor-pointer">our terms and community guidelines</span>.
                                </p>
                            </div>

                            {/* Character Video */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                                    Character Video (Backdrop)
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm font-medium rounded-md cursor-pointer transition-colors">
                                        <Film className="w-4 h-4" />
                                        Choose video
                                        <input type="file" accept="video/mp4,video/webm" onChange={handleVideoChange} className="hidden" />
                                    </label>
                                    <span className="text-zinc-500 text-sm truncate max-w-[150px]">{videoFile ? videoFile.name : 'No file chosen'}</span>
                                    {videoFile && (
                                        <button onClick={() => setVideoFile(null)} className="p-1 hover:text-red-500 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    Max size: 1 MB. This video will play in the background of chat sessions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Character Age */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                            Character Age
                        </label>
                        <input
                            type="text"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all placeholder:text-zinc-400"
                        />
                        <p className="text-xs text-zinc-500 mt-1.5">This is your character's age.</p>
                    </div>

                    {/* Character Gender */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                            Character Gender
                        </label>
                        <div className="relative">
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
                                className="w-full text-sm appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1.5">Select your character's gender. This determines where your character appears in public sections.</p>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                            Language
                        </label>
                        <div className="relative">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full text-sm appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                            >
                                <option value="English">English</option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="German">German</option>
                                <option value="Japanese">Japanese</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1.5">Select the language for your character's responses and fill the rest of the form in the same language to prevent unintended behavior.</p>
                    </div>

                    {/* Character Tags */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                            Character Tags
                        </label>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {tags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs rounded-md">
                                    {tag}
                                    <button onClick={() => toggleTag(tag)} className="hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}

                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <button className="inline-flex items-center gap-1 px-2 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-800 dark:border-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-md transition-all">
                                        Add tag <Plus className="w-3 h-3" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[500px] p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl max-h-[60vh] overflow-y-auto z-[60]" align="start">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Tags</h4>
                                        </div>
                                        {Object.entries(TAG_CATEGORIES).map(([category, categoryTags]) => (
                                            <div key={category}>
                                                <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 capitalize">{category}</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {categoryTags.map(tag => {
                                                        const isSelected = tags.includes(tag);
                                                        return (
                                                            <button
                                                                key={tag}
                                                                onClick={() => toggleTag(tag)}
                                                                className={cn(
                                                                    "px-2.5 py-1 text-xs rounded-md border transition-all flex items-center gap-1",
                                                                    isSelected
                                                                        ? "bg-pink-500/10 border-pink-500 text-pink-500"
                                                                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                                                                )}
                                                            >
                                                                {['NSFW', 'Female', 'Male', 'Non-human', 'Non-binary', 'Object', 'Myth'].some(t => tag.includes(t))}
                                                                {/* Ideally add specific icons per tag here if available */}
                                                                {tag}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <p className="text-xs text-zinc-500">Assign tags that describes your character. You can add maximum 10 tags.</p>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                Description (0 tokens)
                            </label>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all placeholder:text-zinc-500"
                            placeholder="You're pretty sure Brooklyn's local hero has a crush on you..."
                            maxLength={1000}
                        />
                        <p className="text-xs text-zinc-500 mt-1.5">Write a brief overview of your character.</p>
                    </div>

                    {/* Personality */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                Personality (0 tokens)
                            </label>
                        </div>
                        <textarea
                            value={personality}
                            onChange={(e) => setPersonality(e.target.value)}
                            rows={3}
                            className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all placeholder:text-zinc-500"
                            placeholder="Adventurous, witty, and kind-hearted..."
                            maxLength={1000}
                        />
                        <p className="text-xs text-zinc-500 mt-1.5">Describe your character's traits, behavior, and demeanor.</p>
                    </div>

                    {/* Scenario */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                Scenario (0 tokens)
                            </label>
                        </div>
                        <textarea
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            rows={6}
                            className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all placeholder:text-zinc-500"
                            placeholder="Miles has been Brooklyn's very own, Spiderman for at least 3-4 months now..."
                            maxLength={1000}
                        />
                    </div>

                    {/* First Message */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                First Message (0 tokens)
                            </label>
                        </div>
                        <textarea
                            value={firstMessage}
                            onChange={(e) => setFirstMessage(e.target.value)}
                            rows={4}
                            className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all placeholder:text-zinc-500"
                            placeholder="Why does this always keep happening to you?!..."
                            maxLength={1000}
                        />
                    </div>

                    {/* Visibility */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                            Visibility
                        </label>
                        <div className="relative">
                            <select
                                value={visibility.toLowerCase()}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="w-full text-sm appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                            >
                                <option value="private">Private</option>
                                <option value="public">Public</option>
                                <option value="unlisted">Unlisted</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1.5">Select whether you want your character's information to be publicly visible or not.</p>
                    </div>

                </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                <button 
                    className="px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50" 
                    onClick={onClose}
                    disabled={isCreating}
                >
                    Cancel
                </button>
                <button 
                    className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={handleSubmit}
                    disabled={isCreating}
                >
                    {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isCreating ? "Creating..." : "Create Character"}
                </button>
            </div>
        </div>
    );
}
