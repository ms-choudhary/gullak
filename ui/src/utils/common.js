import { useToast } from '@/components/ui/toast/use-toast'

const { toast } = useToast()

const categoryColors = {
  food: 'bg-green-500',
  transport: 'bg-purple-500',
  entertainment: 'bg-blue-500',
  shopping: 'bg-pink-500',
  bills: 'bg-red-500',
  stay: 'bg-orange-500',
  groceries: 'bg-yellow-500',
  gift: 'bg-indigo-500',
  misc: 'bg-teal-500'
}

export function getCategoryColor(category) {
  const lowerCaseCategory = category.toLowerCase()
  return categoryColors[lowerCaseCategory] || 'bg-gray-500' // default color if category is not found
}

const colorPalette = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500'
];

function hashString(str) {
  let hash = 5381; // Starting with a prime number
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // DJB2 hash algorithm - better distribution
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
  }
  // Use unsigned 32-bit integer to avoid negative numbers
  return (hash >>> 0);
}

export function getBadgeColor(str) {
  const lowerCaseStr = str.toLowerCase();
  const hash = hashString(lowerCaseStr);
  const colorIndex = hash % colorPalette.length;
  return colorPalette[colorIndex];
}

export const showToast = (title, description, isError = false) => {
  toast({
    title: title,
    description: description,
    variant: isError ? 'destructive' : 'default'  // Use 'destructive' for errors, 'default' otherwise
  });
};
