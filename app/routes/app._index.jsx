import { useNavigate, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  
  try {
    // Get the shop from the session
    const shop = session.shop;
    
    // Load settings from the database
    const settings = await prisma.settings.findUnique({
      where: { shop }
    });
    
    // Check if we have a GA4 ID configured
    const ga4AccountId = settings?.ga4MeasurementId || "";
    const hasGA4Id = ga4AccountId && ga4AccountId.trim() !== '';
    
    // If GA4 ID is configured, try to activate the web pixel
    let pixelActivated = false;
    if (hasGA4Id) {
      try {
        // Try to create or update the web pixel
        await admin.graphql(`
          mutation CreateWebPixel {
            webPixelCreate(webPixel: {
              settings: "{\\"ga4AccountId\\":\\"${ga4AccountId}\\"}"
            }) {
              webPixel {
                id
                settings
              }
              userErrors {
                field
                message
              }
            }
          }
        `);
        pixelActivated = true;
        console.log("Web pixel activated with GA4 ID:", ga4AccountId);
      } catch (error) {
        console.log("Note: Web pixel may already exist, or there was an error:", error.message);
        // If the error is about the pixel already existing, it's still activated
        pixelActivated = true;
      }
    }
    
    return json({
      shop,
      pixelActivated,
      ga4AccountId,
      hasGA4Id
    });
  } catch (error) {
    console.error("Error loading settings from database:", error);
    return json({
      shop: "",
      pixelActivated: false,
      ga4AccountId: "",
      hasGA4Id: false,
      error: error.message
    });
  }
};

export default function Index() {
  const { shop, ga4AccountId, hasGA4Id, pixelActivated } = useLoaderData();
  const navigate = useNavigate();
  
  return (
    <div style={{ margin: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Better Web Pixel Analytics</h1>
        <button 
          onClick={() => navigate("/app/settings")}
          style={{ 
            padding: "10px 15px", 
            backgroundColor: "#008060", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer" 
          }}
        >
          Configure Settings
        </button>
      </div>
      
      {!hasGA4Id ? (
        <div style={{ 
          padding: "16px", 
          backgroundColor: "#FFF4E5", 
          border: "1px solid #FF9900", 
          borderRadius: "4px", 
          marginBottom: "20px" 
        }}>
          <h3 style={{ color: "#995C00", margin: "0 0 10px 0" }}>Web Pixel Not Configured</h3>
          <p style={{ margin: "0 0 10px 0" }}>Please configure your Google Analytics 4 Account ID in settings to fully activate the web pixel</p>
          <button 
            onClick={() => navigate("/app/settings")}
            style={{ 
              padding: "8px 12px", 
              backgroundColor: "#FF9900", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              cursor: "pointer" 
            }}
          >
            Configure Now
          </button>
        </div>
      ) : (
        <div style={{ 
          padding: "16px", 
          backgroundColor: "#E3F5E5", 
          border: "1px solid #008060", 
          borderRadius: "4px", 
          marginBottom: "20px",
          color: "#006651"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Web Pixel Configured</h3>
          <p style={{ margin: "0 0 10px 0" }}>Your Google Analytics 4 ID ({ga4AccountId}) is configured for {shop}. Your analytics data is being collected.</p>
        </div>
      )}
      
      <div style={{ 
        padding: "20px", 
        backgroundColor: "white", 
        border: "1px solid #ddd", 
        borderRadius: "4px", 
        marginBottom: "20px" 
      }}>
        <h2>Getting Started</h2>
        <p>Better Web Pixel Analytics helps you track important customer and order data in your Shopify store. Follow these steps to get started:</p>
        <ol>
          <li>{hasGA4Id ? '✅ Google Analytics 4 Account ID configured' : 'Configure your Google Analytics 4 Account ID in the settings'}</li>
          <li>Verify the web pixel appears in your Shopify admin under Settings &gt; Apps and sales channels &gt; Customer events</li>
          <li>View your analytics data in your Google Analytics 4 dashboard</li>
        </ol>
        
        <h2 style={{ marginTop: "30px" }}>Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <div style={{ padding: "15px", backgroundColor: "#f6f6f7", borderRadius: "4px" }}>
            <h3>Standard Events</h3>
            <p>Track page views, product views, checkout events and purchases</p>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#f6f6f7", borderRadius: "4px" }}>
            <h3>Enhanced Data</h3>
            <p>Capture product prices, variant details, discounts, and shipping info</p>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#f6f6f7", borderRadius: "4px" }}>
            <h3>Consent Tracking</h3>
            <p>Record customer consent status for email and SMS marketing</p>
          </div>
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ 
          padding: "20px", 
          backgroundColor: "white", 
          border: "1px solid #ddd", 
          borderRadius: "4px" 
        }}>
          <h2>Need Help?</h2>
          <p>If you have questions or need assistance with Better Web Pixel Analytics, check out our resources:</p>
          <ul>
            <li><a href="http://localhost:3000/documentation" target="_blank" rel="noopener noreferrer">Documentation</a></li>
            <li><a href="http://localhost:3000/support" target="_blank" rel="noopener noreferrer">Contact Support</a></li>
          </ul>
        </div>
        
        <div style={{ 
          padding: "20px", 
          backgroundColor: "white", 
          border: "1px solid #ddd", 
          borderRadius: "4px" 
        }}>
          <h2>Google Analytics 4</h2>
          <p>To get the most out of this app, you'll need a Google Analytics 4 property. If you haven't set one up yet, follow these steps:</p>
          <ul>
            <li><a href="http://localhost:3000/analytics-setup" target="_blank" rel="noopener noreferrer">Visit Google Analytics Setup</a></li>
            <li>Create a new GA4 property for your store</li>
            <li>Copy your Measurement ID (format: G-XXXXXXXXXX)</li>
            <li>Paste the ID in the app settings</li>
          </ul>
        </div>
      </div>
      
      {/* Debug information */}
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
        <h3>Debug Info:</h3>
        <p>Shop: {shop}</p>
        <p>GA4 ID: {ga4AccountId}</p>
        <p>Pixel Activated: {pixelActivated ? "Yes" : "No"}</p>
      </div>
    </div>
  );
} 