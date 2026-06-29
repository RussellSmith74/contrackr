export type UserRole = "customer" | "contractor";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  location?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractorProfile {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  bio?: string;
  logo_url?: string;
  categories: string[];
  service_areas: string[];
  years_experience?: number;
  website?: string;
  license_number?: string;
  is_insured: boolean;
  avg_rating: number;
  total_reviews: number;
  total_jobs_completed: number;
  profile_completeness: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface JobPost {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_range?: string;
  timeline?: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  photos: string[];
  bid_count: number;
  created_at: string;
  updated_at: string;
  customer?: Profile;
}

export interface Bid {
  id: string;
  job_id: string;
  contractor_id: string;
  amount: number;
  message: string;
  timeline?: string;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  created_at: string;
  updated_at: string;
  contractor?: ContractorProfile;
  job?: JobPost;
}

export interface FeedPost {
  id: string;
  author_id: string;
  author_role: UserRole;
  content: string;
  photos: string[];
  post_type: "job_request" | "work_showcase" | "promotion" | "update";
  category?: string;
  location?: string;
  job_id?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: Profile;
  contractor_profile?: ContractorProfile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
  sender?: Profile;
}

export interface Conversation {
  id: string;
  customer_id: string;
  contractor_id: string;
  job_id?: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  customer?: Profile;
  contractor?: ContractorProfile;
}

export interface Review {
  id: string;
  job_id: string;
  reviewer_id: string;
  contractor_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: Profile;
}

export interface ContractorPhoto {
  id: string;
  contractor_id: string;
  url: string;
  caption?: string;
  category?: string;
  created_at: string;
}
