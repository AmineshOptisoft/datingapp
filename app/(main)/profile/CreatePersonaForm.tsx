"use client";

import { useState } from "react";
import { Plus, X, Upload, Image as ImageIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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

export default function CreatePersonaForm({ onSuccess, onClose }: { onSuccess?: () => void; onClose?: () => void }) {
    const [name, setName] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [age, setAge] = useState("18");
    const [language, setLanguage] = useState("English");
    const [tags, setTags] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [personality, setPersonality] = useState("");
    const [scenario, setScenario] = useState("");
    const [firstMessage, setFirstMessage] = useState("");
    const [visibility, setVisibility] = useState("Private");
    const [tagSearch, setTagSearch] = useState("");

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
            if (tags.length >= 10) return; // Limit matched screenshot helper text
            setTags([...tags, tag]);
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

                    {/* Character Image */}
                    <div className="flex gap-6">
                        <div className="shrink-0 w-32 h-44 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                            {image ? (
                                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-zinc-400">
                                    <ImageIcon className="w-8 h-8 opacity-50" />
                                    <span className="text-xs mt-2 opacity-50">?</span>
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
                                    <span className="text-zinc-500 text-sm">{image ? 'File chosen' : 'No file chosen'}</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                    Upload or generate an image that represents your character. Make sure these images comply to <span className="text-blue-500 hover:underline cursor-pointer">our terms and community guidelines</span>.
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
                        />
                    </div>

                    {/* Visibility */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                            Visibility
                        </label>
                        <div className="relative">
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="w-full text-sm appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                            >
                                <option value="Private">Private</option>
                                <option value="Public">Public</option>
                                <option value="Unlisted">Unlisted</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1.5">Select whether you want your character's information to be publicly visible or not.</p>
                    </div>

                </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                <button className="px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={onClose}>
                    Cancel
                </button>
                <button className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-full hover:opacity-90 transition-opacity">
                    Create Character
                </button>
            </div>
        </div>
    );
}
