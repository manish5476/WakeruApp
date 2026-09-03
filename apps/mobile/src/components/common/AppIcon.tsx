import React, { ComponentProps } from 'react';
import Lucide from '@react-native-vector-icons/lucide';
import { GoogleLogo } from '../auth/GoogleLogo';
import { AppleLogo } from '../auth/AppleLogo';

type LucideProps = ComponentProps<typeof Lucide>;

const CustomIcons: Record<string, React.FC<any>> = {
  google: GoogleLogo,
  apple: AppleLogo,
};

const LEGACY_NAME_MAP: Record<string, string> = {
  checkmark: 'check',
  'check-circle': 'circle-check',
  'check-circle-2': 'circle-check',
  'checkmark-circle': 'circle-check',
  'checkmark-circle-outline': 'circle-check',
  close: 'x',
  'close-circle': 'circle-x',
  add: 'plus',
  airplane: 'plane',
  plane: 'plane',
  person: 'user',
  'person-add': 'user-plus',
  people: 'users',
  call: 'phone',
  navigate: 'navigation',
  'arrow-forward': 'arrow-right',
  'arrow-back': 'arrow-left',
  'share-social': 'share-2',
  share: 'share-2',
  document: 'file-text',
  'document-text': 'file-text',
  'document-outline': 'file-text',
  location: 'map-pin',
  cash: 'banknote',
  card: 'credit-card',
  pricetag: 'tag',
  pricetags: 'tags',
  restaurant: 'utensils',
  bed: 'hotel',
  business: 'building',
  bag: 'shopping-bag',
  walk: 'footprints',
  time: 'clock',
  boat: 'ship',
  ticket: 'ticket',
  'swap-horizontal': 'arrow-left-right',
  'alert-circle': 'circle-alert',
  'alert-triangle': 'triangle-alert',
  'information-circle': 'info',
  checkbox: 'check-square',
  create: 'pencil',
  pencil: 'pencil',
  trash: 'trash-2',
  'trash-bin': 'trash-2',
  map: 'map',
  send: 'send',
  package: 'package',
  truck: 'truck',
  'color-palette': 'palette',
  'color-palette-outline': 'palette',
  'color-wand': 'sparkles',
  'color-wand-outline': 'sparkles',
  'phone-portrait': 'smartphone',
  'phone-portrait-outline': 'smartphone',
  sunny: 'sun',
  'sunny-outline': 'sun',
  moon: 'moon',
  'moon-outline': 'moon',
  brush: 'paint-bucket',
  'brush-outline': 'paint-bucket',
  'save-outline': 'check',
  save: 'check',
  images: 'image',
  'images-outline': 'image',
  'film-outline': 'film',
  'layers-outline': 'layers',
  'image-outline': 'image',
  'eye-outline': 'eye',
  'eye-off-outline': 'eye-off',
  'refresh-outline': 'refresh-cw',
  'settings-outline': 'settings',
  'search-outline': 'search',
  'heart-outline': 'heart',
  'star-outline': 'star',
};

export default function AppIcon({
  name,
  ...props
}: Omit<LucideProps, 'name'> & { name: string; fill?: string }) {
  const NormalizedIcon = CustomIcons[name];

  if (NormalizedIcon) {
    return <NormalizedIcon {...props} />;
  }

  const normalizedName = LEGACY_NAME_MAP[name] ?? name;

  return <Lucide name={normalizedName as LucideProps['name']} {...props} />;
}
