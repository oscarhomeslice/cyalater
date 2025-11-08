export interface ParsedQuery {
  location: string;
  group_size: string;
  budget_per_person: string;
  currency: string;
  activity_type: string[];
  vibe: string;
  duration?: string;
}

export interface Activity {
  id?: string;
  name: string;
  experience: string;
  bestFor: string;
  cost: string;
  duration: string;
  locationType: 'indoor' | 'outdoor' | 'hybrid';
  activityLevel: 'low' | 'moderate' | 'high';
  specialElement: string;
  preparation: string;
  tripAdvisorUrl?: string;
  tripAdvisorId?: string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
}

export interface ActivityRecommendation {
  activities: Activity[];
  backupOptions: {
    weatherAlternative: string;
    timeSaver: string;
    budgetFriendly: string;
  };
  refinementPrompts: string[];
  proTips: string[];
}

export interface Shortlist {
  id: string;
  unique_link_id: string;
  event_title?: string;
  organizer_email?: string;
  organizer_name?: string;
  activities: string[];
  status: string;
  created_at: string;
  expires_at: string;
}

export interface Vote {
  id: string;
  shortlist_id: string;
  activity_id: string;
  voter_name?: string;
  voter_identifier: string;
  created_at: string;
}
