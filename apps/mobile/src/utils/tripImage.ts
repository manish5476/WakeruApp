// src/utils/tripImage.ts

/**
 * Curated collection of 32 ultra-high-resolution travel photos from Unsplash
 * categorized by travel theme for stunning, vibrant card covers.
 */
export const CURATED_TRAVEL_COVERS: Record<string, string[]> = {
  beach: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Tropical white sand
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', // Goa palm beach
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', // Turquoise ocean cove
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', // Coastal cliffs & sea
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', // Golden hour beach
  ],
  mountain: [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', // Alpine peaks
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80', // Snowcapped mountains
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', // Mountain lake reflection
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80', // Summit view
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80', // Starry night mountains
  ],
  city: [
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80', // Singapore Marina Bay
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80', // New York skyline
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80', // London bridge
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', // Tokyo neon night
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80', // Paris Eiffel Tower
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80', // Dubai skyline
  ],
  roadtrip: [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', // Open desert highway
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', // Coastal drive
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', // Foggy valley winding road
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80', // Route 66 open highway
  ],
  nature: [
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80', // Serene rolling green hills
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', // Sunlit forest
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80', // Sunlit trees & lake
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80', // Misty valley
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Emerald water
  ],
  heritage: [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80', // Taj Mahal sunrise
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80', // India Gate & culture
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80', // Ancient palace Rajasthan
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80', // Golden Temple
  ],
};

// Flattened master list for hash rotation
export const ALL_TRAVEL_COVERS: string[] = Object.values(
  CURATED_TRAVEL_COVERS,
).flat();
export const GUARANTEED_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';

// The old Pinterest cloud images that were previously hardcoded as backend defaults
const LEGACY_DEFAULT_CLOUDS = [
  '3b3c86d3cef87a6797c96c07f3dc0124',
  '68116be5b8fcd754b7f811625bd51223',
  'pinimg.com',
];

function isLegacyCloudImage(url?: string): boolean {
  if (!url) return false;
  return LEGACY_DEFAULT_CLOUDS.some(hash => url.includes(hash));
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolves a stunning, relevant, and visually varied cover image for any trip.
 * Automatically replaces the old generic cloud placeholder with vibrant travel photography.
 */
export function getTripCoverImage(trip?: {
  _id?: string;
  id?: string;
  title?: string;
  coverImage?: string;
  stops?: any[];
}): string {
  const customCover = trip?.coverImage?.trim();

  // If a user uploaded a legitimate custom image, respect it (unless it's the old hardcoded cloud placeholder)
  if (customCover && !isLegacyCloudImage(customCover)) {
    return customCover;
  }

  const title = (trip?.title || '').toLowerCase();
  const stopNames = (trip?.stops || [])
    .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.title || ''))
    .join(' ')
    .toLowerCase();

  const combinedText = `${title} ${stopNames}`;

  // Theme keyword detector
  if (
    /goa|beach|island|sea|ocean|coastal|bali|phuket|maldives|pondicherry|alibaug|gokarna/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.beach;
    return list[simpleHash(trip?._id || title) % list.length];
  }

  if (
    /mountain|hill|trek|hike|camp|peak|alps|himalaya|manali|shimla|ladakh|kasol|rishikesh|leh|spiti|kashmir/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.mountain;
    return list[simpleHash(trip?._id || title) % list.length];
  }

  if (
    /mumbai|delhi|bangalore|bengaluru|surat|pune|hyderabad|tokyo|york|london|dubai|singapore|paris|city/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.city;
    return list[simpleHash(trip?._id || title) % list.length];
  }

  if (
    /heritage|rajasthan|jaipur|udaipur|jodhpur|agra|temple|palace|fort|varanasi|dandi/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.heritage;
    return list[simpleHash(trip?._id || title) % list.length];
  }

  if (/road|drive|highway|desert|dune|safari|bike|ride/.test(combinedText)) {
    const list = CURATED_TRAVEL_COVERS.roadtrip;
    return list[simpleHash(trip?._id || title) % list.length];
  }

  if (
    /nature|forest|green|lake|waterfall|river|kerala|munnar|wayanad|ooty|coorg/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.nature;
    return list[simpleHash(trip?._id || title) % list.length];
  }

  // Fallback to deterministic hash over the full collection so every trip has a distinct, beautiful cover
  const seed = trip?._id || trip?.id || trip?.title || 'trip';
  return ALL_TRAVEL_COVERS[simpleHash(seed) % ALL_TRAVEL_COVERS.length];
}

/**
 * Resolves a stunning, destination-matched cover image for any trip stop.
 * Automatically replaces the old generic dark cloud placeholder with vibrant location photography.
 */
export function getStopCoverImage(
  stop?: {
    _id?: string;
    id?: string;
    name?: string;
    title?: string;
    coverImage?: string;
  },
  tripTitle?: string,
): string {
  const customCover = stop?.coverImage?.trim();

  // If a user uploaded a legitimate custom image, respect it (unless it's the old hardcoded cloud placeholder)
  if (customCover && !isLegacyCloudImage(customCover)) {
    return customCover;
  }

  const stopName = (stop?.name || stop?.title || '').toLowerCase();
  const combinedText = `${stopName} ${tripTitle || ''}`.toLowerCase();

  // Match destination theme by stop location name
  if (
    /goa|beach|island|sea|ocean|coastal|bali|phuket|maldives|pondicherry|alibaug|gokarna/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.beach;
    return list[simpleHash(stop?._id || stopName) % list.length];
  }

  if (
    /mumbai|delhi|bangalore|bengaluru|surat|pune|hyderabad|tokyo|york|london|dubai|singapore|paris|city/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.city;
    return list[simpleHash(stop?._id || stopName) % list.length];
  }

  if (
    /mountain|hill|trek|hike|camp|peak|alps|himalaya|manali|shimla|ladakh|kasol|rishikesh|leh|spiti|kashmir/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.mountain;
    return list[simpleHash(stop?._id || stopName) % list.length];
  }

  if (
    /heritage|rajasthan|jaipur|udaipur|jodhpur|agra|temple|palace|fort|varanasi|dandi/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.heritage;
    return list[simpleHash(stop?._id || stopName) % list.length];
  }

  if (
    /nature|forest|green|lake|waterfall|river|kerala|munnar|wayanad|ooty|coorg/.test(
      combinedText,
    )
  ) {
    const list = CURATED_TRAVEL_COVERS.nature;
    return list[simpleHash(stop?._id || stopName) % list.length];
  }

  if (/road|drive|highway|desert|dune|safari|bike|ride/.test(combinedText)) {
    const list = CURATED_TRAVEL_COVERS.roadtrip;
    return list[simpleHash(stop?._id || stopName) % list.length];
  }

  // Fallback to deterministic hash so each stop within a trip gets a distinct photo
  const seed = stop?._id || stop?.id || stopName || 'stop';
  return ALL_TRAVEL_COVERS[simpleHash(seed) % ALL_TRAVEL_COVERS.length];
}
