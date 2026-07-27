export type Role = 'user' | 'admin';
export type TripType = 'oneway' | 'roundtrip' | 'multicity';
export type FlightClass = 'economy' | 'business' | 'first';
export type BookingType = 'flight' | 'hotel' | 'tour' | 'visa';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type BookingStatus = 'confirmed' | 'cancelled' | 'pending';
export type InquiryStatus = 'new' | 'contacted' | 'closed';

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  display_name?: string;
  photo_url?: string;
  gender?: string;
  present_address?: string;
  permanent_address?: string;
  marital_status?: string;
  date_of_birth?: string;
  passport_country?: string;
  passport_number?: string;
  passport_expiry?: string;
  national_id?: string;
  nationality?: string;
  emergency_contact?: string;
  religion?: string;
  language_preference?: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface FlightSegment {
  from: string;
  to: string;
  departure_date: string;
  return_date?: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
}

export interface Flight {
  id: string;
  trip_type: TripType;
  segments: FlightSegment[];
  airline: string;
  flight_number: string;
  price: number;
  currency: string;
  class: FlightClass;
  available_seats: number;
  max_travelers: number;
  logo_url?: string;
  stops?: number;
  show_on_homepage?: boolean;
  is_starred?: boolean;
  rank_priority?: number;
  admin_created?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HotelFacilityCategory {
  category: string;
  items: string[];
}

export interface HotelPolicy {
  check_in_time: string;
  check_out_time: string;
  special_instructions?: string;
  child_policy?: string;
  pet_policy?: string;
  house_rules?: string[];
}

export interface NearbyPlace {
  name: string;
  type: string;
  distance: string;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  area?: string;
  address: string;
  images: string[];
  star_rating: number;
  description: string;
  facilities: Record<string, string[]>;
  policies: HotelPolicy;
  discount: number;
  latitude: number;
  longitude: number;
  nearby: NearbyPlace[];
  rooms_count?: number;
  min_price?: number;
  show_on_homepage?: boolean;
  is_starred?: boolean;
  rank_priority?: number;
  admin_created?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type: string;
  price_per_night: number;
  available_count: number;
  max_adults: number;
  max_children: number;
  features: string[];
  images: string[];
  created_at?: string;
  updated_at?: string;
}

export interface HotelReview {
  id: string;
  hotel_id: string;
  user_id: string;
  rating: number;
  comment: string;
  user_name?: string;
  created_at: string;
}

export interface TourItineraryDay {
  day: number;
  title: string;
  description: string;
  highlights?: string[];
}

export interface TourAvailability {
  start_date: string;
  end_date: string;
}

export interface Tour {
  id: string;
  title: string;
  location: string;
  duration_days: number;
  price_per_person: number;
  currency: string;
  overview: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  travel_tips: string[];
  itinerary: TourItineraryDay[];
  images: string[];
  attractions: string[];
  activities: string[];
  pickup_locations: string[];
  availability_dates: TourAvailability[];
  max_group_size: number;
  min_age: number;
  cancellation_policy: string;
  refund_policy: string;
  latitude: number;
  longitude: number;
  category?: 'Domestic' | 'International' | 'Umrah' | 'Honeymoon' | 'Adventure';
  discount?: number;
  rating?: number;
  reviews_count?: number;
  show_on_homepage?: boolean;
  is_starred?: boolean;
  rank_priority?: number;
  admin_created?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentsRequired {
  job_holders: string[];
  business_owners: string[];
  students: string[];
  others: string[];
}

export interface ContactInfo {
  address_line1: string;
  address_line2?: string;
  hotline: string;
  map_link?: string;
  email?: string;
}

export interface Visa {
  id: string;
  country: string;
  country_code?: string;
  flag_url?: string;
  visa_type: string;
  processing_time: string;
  fee: number;
  currency: string;
  add_on_services: string[];
  important_notes: string;
  documents_required: DocumentsRequired;
  contact_info: ContactInfo;
  show_on_homepage?: boolean;
  is_starred?: boolean;
  rank_priority?: number;
  admin_created?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  booking_type: BookingType;
  reference_id?: string;
  details: Record<string, any>;
  total_price: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_details: Record<string, any>;
  booking_status: BookingStatus;
  show_on_homepage?: boolean;
  is_starred?: boolean;
  rank_priority?: number;
  created_at: string;
  updated_at: string;
}

export interface VisaInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferred_date?: string;
  additional_requirements?: string;
  status: InquiryStatus;
  created_at: string;
}

export interface TourInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  journey_date?: string;
  additional_requirements?: string;
  status: InquiryStatus;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  entity_type: 'hotel' | 'tour' | 'flight';
  entity_id: string;
  created_at: string;
}
