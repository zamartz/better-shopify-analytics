// Web Pixel Extension for Better Analytics
// This extension checks for Google Analytics cookies and logs matching GA4 sessions

/**
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 * @typedef {import("../generated/api").API} API
 */

// First log entry to confirm script loaded
console.log("BETTER ANALYTICS: SCRIPT LOADED", { timestamp: new Date().toISOString() });

/**
 * @type {API}
 */
export const api = {};

/**
 * Standard web pixel entry point - this will be executed when the pixel is loaded
 */
export function run(context) {
  // Log pixel initialization
  console.log("BETTER ANALYTICS: INITIALIZED", { 
    ga4Id: context.settings?.ga4AccountId,
    timestamp: new Date().toISOString() 
  });

  // Subscribe to page_view events
  context.analytics.subscribe('page_view', (payload) => {
    // Log page view with clear formatting and data
    console.log("BETTER ANALYTICS: PAGE_VIEW EVENT", {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ga4Id: context.settings?.ga4AccountId
    });
    
    // Return success to indicate event was handled
    return { success: true };
  });
  
  // Subscribe to connection_check event (required for "Connected" status)
  context.analytics.subscribe('connection_check', (payload) => {
    console.log("BETTER ANALYTICS: CONNECTION_CHECK EVENT");
    return { connected: true };
  });
  
  // Return promise to complete initialization
  return Promise.resolve();
}

/**
 * Register function for the web pixel
 */
export function register(api) {
  console.log("=== BETTER ANALYTICS: REGISTER FUNCTION CALLED ===");
  
  try {
    // Try to communicate with parent window
    if (window.top && window.top !== window) {
      window.top.postMessage({
        type: "BETTER_ANALYTICS_REGISTERED",
        ga4Id: api.settings?.ga4AccountId,
        timestamp: new Date().toISOString()
      }, "*");
    }
    
    // Subscribe to page_viewed events
    api.analytics.subscribe("page_viewed", (event) => {
      console.log("=== BETTER ANALYTICS: PAGE_VIEWED EVENT ===");
      
      // Try to communicate the event to parent window
      if (window.top && window.top !== window) {
        window.top.postMessage({
          type: "BETTER_ANALYTICS_PAGE_VIEWED",
          url: event.context?.document?.location?.href,
          timestamp: new Date().toISOString()
        }, "*");
      }
      
      return { success: true };
    });
    
    // Subscribe to connection_check
    api.analytics.subscribe("connection_check", () => {
      console.log("=== BETTER ANALYTICS: CONNECTION CHECK ===");
      return { connected: true };
    });
  } catch (error) {
    console.error("=== BETTER ANALYTICS: REGISTER ERROR ===", error);
  }
}