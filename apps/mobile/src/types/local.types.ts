export type BusinessCategory =
  'STAY' | 'DINING' | 'TRANSPORT' | 'RENTAL' | 'ACTIVITY';
export type VerificationStatus =
  'PENDING' | 'VERIFIED' | 'REJECTED' | 'REVOKED';
export type MediaModerationStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type BookingStatus =
  'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
export type ReservationStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type LeadStatus =
  'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'CLOSED';

export interface BusinessLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface BusinessMedia {
  id: string;
  businessId: string;
  url: string;
  provider?: string;
  mediaType: 'image' | 'video' | 'logo' | 'cover';
  altText?: string;
  sortOrder: number;
  moderationStatus: MediaModerationStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessOffer {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'SPECIAL';
  discountValue?: number;
  currency?: string;
  status: 'active' | 'inactive' | 'expired';
  terms?: string;
  startAt?: string;
  endAt?: string;
  createdAt: string;
}

export interface BusinessService {
  id: string;
  businessId: string;
  name: string;
  serviceType?: string;
  description?: string;
  priceMinor: number;
  currency: string;
  capacity?: number;
  unit?: string;
  createdAt?: string;
}

export interface BusinessReview {
  id: string;
  businessId: string;
  travelerHash: string;
  rating: number;
  comment?: string;
  provenance:
    'VERIFIED_BOOKING' | 'VERIFIED_SERVICE' | 'VERIFIED_STAY' | 'DIRECT';
  createdAt: string;
  vendorReply?: string;
  vendorRepliedAt?: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  cleanlinessRating?: number;
  serviceRating?: number;
  valueRating?: number;
}

export interface Business {
  id: string;
  vendorId: string;
  businessName: string;
  category: BusinessCategory;
  description?: string;
  location?: BusinessLocation;
  address: string;
  city: string;
  country: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  status: 'active' | 'suspended' | 'closed';
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  media?: BusinessMedia[];
  offers?: BusinessOffer[];
  services?: BusinessService[];
  reviews?: BusinessReview[];
  rating?: number;
  reviewCount?: number;
  isSponsored?: boolean;
  campaignId?: string;
  servingToken?: string;
  distanceKm?: number;
  priceMinor?: number;
  currency?: string;
}

export interface BookingRequest {
  id: string;
  bookingReference: string;
  businessId: string;
  businessName?: string;
  businessCategory?: BusinessCategory;
  travelerHash: string;
  travelerName?: string;
  travelerPhone?: string;
  travelerEmail?: string;
  status: BookingStatus;
  priceSnapshotMinor: number;
  currency: string;
  serviceId?: string;
  serviceName?: string;
  bookingDate: string;
  guestCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Reservation {
  id: string;
  bookingRequestId: string;
  bookingReference?: string;
  businessId: string;
  businessName?: string;
  status: ReservationStatus;
  vendorConfirmedAt: string;
  completedAt?: string;
  priceSnapshotMinor: number;
  currency: string;
  serviceName?: string;
  bookingDate: string;
  createdAt: string;
}

export interface BusinessLead {
  id: string;
  businessId: string;
  travelerHash?: string;
  travelerPhone?: string;
  travelerEmail?: string;
  interactionType: 'call' | 'whatsapp' | 'directions' | 'enquiry';
  status: LeadStatus;
  notes?: string;
  createdAt: string;
}

export interface MasterCategory {
  slug: string;
  name: string;
  icon?: string;
  description?: string;
  order?: number;
}

export interface MasterItem {
  id: string;
  categorySlug: string;
  name: string;
  slug: string;
  icon?: string;
  type?: 'AMENITY' | 'FEATURE' | 'RULE';
}

export interface MasterDestination {
  city: string;
  state?: string;
  country: string;
  coverImage?: string;
  businessCount?: number;
}

export interface VendorProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface Campaign {
  id: string;
  businessId: string;
  businessName?: string;
  title: string;
  status: 'active' | 'paused' | 'completed' | 'pending_approval' | 'rejected';
  budgetMinor: number;
  spentMinor?: number;
  currency: string;
  startDate: string;
  endDate?: string;
  targetCategory?: string;
  targetCity?: string;
  createdAt: string;
}

export interface DemandInsight {
  city: string;
  category: string;
  searchCount: number;
  bookingRequestCount: number;
  conversionRate: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  createdAt: string;
}
