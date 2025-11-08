// Simple analytics tracking
export function trackEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Add your analytics service here (PostHog, Mixpanel, etc.)
      console.log('Track Event:', eventName, properties);
      
      // Example with PostHog:
      // window.posthog?.capture(eventName, properties);
    }
  }
  
  export const AnalyticsEvents = {
    SEARCH_SUBMITTED: 'search_submitted',
    RESULTS_DISPLAYED: 'results_displayed',
    ACTIVITY_ADDED_TO_SHORTLIST: 'activity_added_to_shortlist',
    VOTING_LINK_CREATED: 'voting_link_created',
    REFINEMENT_USED: 'refinement_used',
    ERROR_OCCURRED: 'error_occurred',
  };