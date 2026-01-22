"use client";

import { useState, useEffect } from "react";
import { Plus, X, Upload, Image as ImageIcon, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const TAG_CATEGORIES = {
    default: ["NSFW", "Monster Girl", "Worlds-End-Challenge"],
    "Character Type": ["Female", "Male", "Non-human", "Non-binary", "Object", "Myth", "Queer"],
    Genre: [
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

interface Character {
    _id: string;
    characterName: string;
    characterImage?: string;
    characterAge: number;
    language: string;
    tags: string[];
    description: string;
    personality: string;
    scenario: string;
    firstMessage: string;
    visibility: string;
}

export default function EditCharacterDialog({ 
    character, 
    onSuccess, 
    onClose 
}: { 
    character: Character; 
    onSuccess?: () => void; 
    onClose?: () => void;
}) {
    const [name, setName] = useState(character.characterName || "");
    const [image, setImage] = useState<string | null>(character.characterImage || null);
    const [age, setAge] = useState(character.characterAge?.toString() || "18");
    const [language, setLanguage] = useState(character.language || "English");
    const [tags, setTags] = useState<string[]>(character.tags || []);
    const [description, setDescription] = useState(character.description || "");
    const [personality, setPersonality] = useState(character.personality || "");
    const [scenario, setScenario] = useState(character.scenario || "");
    const [firstMessage, setFirstMessage] = useState(character.firstMessage || "");
    const [visibility, setVisibility] = useState(character.visibility || "Private");
    const [tagSearch, setTagSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter((t) => t !== tag));
        } else {
            if (tags.length >= 10) return;
            setTags([...tags, tag]);
        }
    };

    const handleSave = async () => {
        try {
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
                toast.error("All fields are required");
                return;
            }

            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                toast.error("User not found. Please login again.");
                return;
            }

            const user = JSON.parse(storedUser);
            const userId = user._id || user.id || user.userId;
            
            if (!userId) {
                toast.error("User ID not found");
                return;
            }

            setIsSaving(true);

            const characterData = {
                userId,
                characterName: name.trim(),
                characterImage: image,
                characterAge: ageNum,
                language,
                tags,
                description: description.trim(),
                personality: personality.trim(),
                scenario: scenario.trim(),
                firstMessage: firstMessage.trim(),
                visibility: visibility.toLowerCase(),
            };

            const response = await fetch(`/api/characters/${character._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(characterData),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                toast.error(data.message || "Failed to update character");
                return;
            }

            toast.success("Character updated successfully!");
            
            if (onSuccess) {
                onSuccess();
            }
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error("Error updating character:", error);
            toast.error("An error occurred while updating the character");
        } finally {
            setIsSaving(false);
        }
    };

    const allTags = Object.entries(TAG_CATEGORIES).flatMap(([category, categoryTags]) =>
        categoryTags.map(tag => ({ tag, category }))
    );

    const filteredTags = tagSearch
        ? allTags.filter(({ tag }) => tag.toLowerCase().includes(tagSearch.toLowerCase()))
        : allTags;

    const handleGenerateImage = () => {
        toast.info("AI image generation coming soon!");
    };

    return (
        <div className="flex flex-col h-full max-h-[85vh]">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <DialogTitle className="text-2xl font-bold text-zinc-900 dark:text-white">Edit Character</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Character Name */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Character Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={20}
                        placeholder="e.g. Miles Morales"
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">This is your character's display name.</p>
                </div>

                {/* Character Image */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Character Image</label>
                    <div className="flex items-center gap-4">
                        {image && (
                            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 shrink-0">
                                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex gap-2">
                            <label className="cursor-pointer px-4 py-2.5 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Choose file
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                            <button
                                onClick={handleGenerateImage}
                                type="button"
                                className="px-4 py-2.5 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Upload or generate an image that represents your character.</p>
                </div>

                {/* Character Age */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Character Age</label>
                    <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min="18"
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">This is your character's age.</p>
                </div>

                {/* Language */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Language</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors"
                    >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Japanese</option>
                        <option>Korean</option>
                        <option>Chinese</option>
                    </select>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Select the language for your character's responses.</p>
                </div>

                {/* Character Tags */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Character Tags</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-left text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between">
                                <span className="text-sm">Add tag +</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700" align="start">
                            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                                <input
                                    type="text"
                                    placeholder="Search tags..."
                                    value={tagSearch}
                                    onChange={(e) => setTagSearch(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm border-0 focus:outline-none"
                                />
                            </div>
                            <div className="max-h-64 overflow-y-auto p-2">
                                {filteredTags.map(({ tag }) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                            tags.includes(tag)
                                                ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"
                                                : "hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Assign tags that describes your character. You can add maximum 10 tags.</p>
                    
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {tags.map((tag) => (
                                <div key={tag} className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-sm flex items-center gap-2 border border-pink-200 dark:border-pink-800">
                                    {tag}
                                    <button type="button" onClick={() => toggleTag(tag)} className="hover:text-pink-900 dark:hover:text-pink-200">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Description (0 tokens)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        maxLength={500}
                        placeholder="You're pretty sure Brooklyn's local hero has a crush on you..."
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Write a brief overview of your character.</p>
                </div>

                {/* Personality */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Personality (0 tokens)</label>
                    <textarea
                        value={personality}
                        onChange={(e) => setPersonality(e.target.value)}
                        rows={4}
                        maxLength={750}
                        placeholder="Adventurous, witty, and kind-hearted..."
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Describe your character's traits, behavior, and demeanor.</p>
                </div>

                {/* Scenario */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Scenario (0 tokens)</label>
                    <textarea
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        rows={4}
                        maxLength={3000}
                        placeholder="Miles has been Brooklyn's very own, Spiderman for at least 3-4 months now..."
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Describe the setting and circumstances that your character is currently in.</p>
                </div>

                {/* First Message */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">First Message (0 tokens)</label>
                    <textarea
                        value={firstMessage}
                        onChange={(e) => setFirstMessage(e.target.value)}
                        rows={4}
                        maxLength={750}
                        placeholder="Why does this always keep happening to you?!..."
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">The first message your character will send to start the conversation.</p>
                </div>

                {/* Visibility */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">Visibility</label>
                    <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors"
                    >
                        <option>Private</option>
                        <option>Public</option>
                    </select>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Select whether you want your character's information to be publicly visible or not.</p>
                </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button 
                    type="button"
                    className="px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50" 
                    onClick={onClose}
                    disabled={isSaving}
                >
                    Cancel
                </button>
                <button 
                    type="button"
                    className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </DialogFooter>
        </div>
    );
}
