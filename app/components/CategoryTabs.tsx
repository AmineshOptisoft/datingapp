'use client';

const categories = [
  'All',
  'Different Personalities',
  'Fantasy & Kinks',
  'Infidelity & Drama',
  'Nationalities & Cultures',
  'Relationship Stages',
  'Anime',
];

interface CategoryTabsProps {
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export default function CategoryTabs({ activeCategory = 'All', onCategoryChange }: CategoryTabsProps) {
  const handleCategoryClick = (category: string) => {
    onCategoryChange?.(category);
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => handleCategoryClick(category)}
          className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            activeCategory === category
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
