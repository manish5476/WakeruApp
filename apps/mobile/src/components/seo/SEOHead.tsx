import React from 'react';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  noindex?: boolean;
  nofollow?: boolean;
  image?: string;
  url?: string;
}

export function SEOHead(_props: SEOHeadProps) {
  return null;
}

export default SEOHead;
