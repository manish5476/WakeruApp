// src/utils/insertAdsIntoList.ts

export interface AdListItem {
  isAd: true;
  adId: string;
}

export type ListItemWithAds<T> = T | AdListItem;

export function isAdItem<T>(item: ListItemWithAds<T>): item is AdListItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'isAd' in item &&
    item.isAd === true
  );
}

/**
 * Inserts native ad placeholders into an item array at regular intervals.
 * Automatically bypassed for Ad-Free / Premium users.
 *
 * @param items Original array of data items
 * @param interval How many real items appear before each ad slot (default: 5)
 * @param isAdFree Whether the user has an ad-free subscription
 */
export function insertAdsIntoList<T>(
  items: T[],
  interval: number = 5,
  isAdFree: boolean = false,
): ListItemWithAds<T>[] {
  if (isAdFree || !Array.isArray(items) || items.length < interval) {
    return items;
  }

  const result: ListItemWithAds<T>[] = [];

  items.forEach((item, index) => {
    result.push(item);
    // Insert an ad item after every `interval` real items, but not after the last item
    if ((index + 1) % interval === 0 && index + 1 < items.length) {
      result.push({
        isAd: true,
        adId: `native-ad-${Math.floor(index / interval)}`,
      });
    }
  });

  return result;
}
