import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useSubmit, useLoaderData, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Load settings from the database
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Get the shop from the session
    const shop = session.shop;
    
    // Load settings from the database
    let settings = await prisma.settings.findUnique({
      where: { shop }
    });
    
    // If no settings exist yet, create a default record
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          shop,
          enhancedOrderTracking: true,
          ga4SessionTracking: true,
          emailSmsTracking: true,
          ga4MeasurementId: "", // Empty by default
        }
      });
    }
    
    // Map the database model to our form fields
    return json({
      settings: {
        ga4AccountId: settings.ga4MeasurementId || "", 
        trackProductPrices: settings.enhancedOrderTracking,
        trackDiscounts: settings.ga4SessionTracking,
        trackCustomerConsent: settings.emailSmsTracking
      },
      shop
    });
  } catch (error) {
    console.error("Error fetching settings from database:", error);
    return json({
      settings: {
        ga4AccountId: "",
        trackProductPrices: true,
        trackDiscounts: true,
        trackCustomerConsent: true
      },
      error: "Failed to load settings from database"
    });
  }
};

// Save settings to the database
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  // Get the shop from the session
  const shop = session.shop;
  
  // Parse the settings from the form data
  const formSettings = {
    ga4AccountId: formData.get("ga4AccountId"),
    trackProductPrices: formData.get("trackProductPrices") === "true",
    trackDiscounts: formData.get("trackDiscounts") === "true",
    trackCustomerConsent: formData.get("trackCustomerConsent") === "true"
  };
  
  try {
    // Map form fields to database model
    // Either update existing settings or create new ones
    await prisma.settings.upsert({
      where: { shop },
      update: {
        ga4MeasurementId: formSettings.ga4AccountId,
        enhancedOrderTracking: formSettings.trackProductPrices,
        ga4SessionTracking: formSettings.trackDiscounts,
        emailSmsTracking: formSettings.trackCustomerConsent,
      },
      create: {
        shop,
        ga4MeasurementId: formSettings.ga4AccountId,
        enhancedOrderTracking: formSettings.trackProductPrices,
        ga4SessionTracking: formSettings.trackDiscounts,
        emailSmsTracking: formSettings.trackCustomerConsent,
      }
    });
    
    console.log(`Saved settings to database for shop ${shop}`);
    
    // If successfully saved to the database, activate the web pixel if there's a GA4 ID
    if (formSettings.ga4AccountId && formSettings.ga4AccountId.trim() !== '') {
      try {
        const { admin } = await authenticate.admin(request);
        await admin.graphql(`
          mutation CreateWebPixel {
            webPixelCreate(webPixel: {
              settings: "{\\"ga4AccountId\\":\\"${formSettings.ga4AccountId}\\"}"
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
        console.log("Web pixel activated with GA4 ID:", formSettings.ga4AccountId);
      } catch (error) {
        console.log("Note: Web pixel may already exist:", error.message);
      }
    }
    
    // Return the settings with a saved flag and the shop
    return json({ settings: formSettings, saved: true, shop });
  } catch (error) {
    console.error("Error saving settings to database:", error);
    return json({ error: "Failed to save settings to database" }, { status: 500 });
  }
};

export default function SettingsPage() {
  const { settings: initialSettings, shop } = useLoaderData();
  const actionData = useActionData();
  const [formState, setFormState] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [savingError, setSavingError] = useState(null);
  const submit = useSubmit();

  // Update saved state when action data changes
  useEffect(() => {
    if (actionData?.saved) {
      setSaved(true);
      
      // Auto-hide the saved message after 3 seconds
      const timer = setTimeout(() => {
        setSaved(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else if (actionData?.error) {
      setSavingError(actionData.error);
      
      // Auto-hide the error message after 5 seconds
      const timer = setTimeout(() => {
        setSavingError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [actionData]);
  
  const handleSubmit = () => {
    // Convert form state to FormData
    const data = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      data.append(key, value.toString());
    });
    
    submit(data, { method: "post" });
  };

  return (
    <div style={{ margin: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Web Pixel Analytics Settings</h1>
        <button 
          onClick={handleSubmit}
          style={{ 
            padding: "10px 15px", 
            backgroundColor: "#008060", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer" 
          }}
        >
          Save
        </button>
      </div>
      
      {saved && (
        <div style={{ 
          padding: "16px", 
          backgroundColor: "#E3F5E5", 
          border: "1px solid #008060", 
          borderRadius: "4px", 
          marginBottom: "20px",
          color: "#006651"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Settings saved</h3>
          <p style={{ margin: "0" }}>Your Google Analytics ID ({formState.ga4AccountId}) has been saved successfully for {shop}.</p>
        </div>
      )}
      
      {savingError && (
        <div style={{ 
          padding: "16px", 
          backgroundColor: "#FBE9E7", 
          border: "1px solid #D84315", 
          borderRadius: "4px", 
          marginBottom: "20px",
          color: "#D84315"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Error saving settings</h3>
          <p style={{ margin: "0" }}>{savingError}</p>
        </div>
      )}
      
      <div style={{ 
        padding: "20px", 
        backgroundColor: "white", 
        border: "1px solid #ddd", 
        borderRadius: "4px"
      }}>
        <h2>Analytics Configuration for {shop}</h2>
        <p>Configure your analytics settings to customize what data is collected.</p>
        
        <div style={{ marginTop: "20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Google Analytics 4 Account ID
            </label>
            <input 
              type="text" 
              value={formState.ga4AccountId}
              onChange={(e) => setFormState({...formState, ga4AccountId: e.target.value})}
              placeholder="G-XXXXXXXXXX"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "16px"
              }}
            />
            <p style={{ margin: "5px 0 0 0", color: "#637381", fontSize: "14px" }}>
              Enter your GA4 Measurement ID (format: G-XXXXXXXXXX)
            </p>
          </div>
          
          <div style={{ marginTop: "30px" }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={formState.trackProductPrices}
                  onChange={(e) => setFormState({...formState, trackProductPrices: e.target.checked})}
                  style={{ marginRight: "10px" }}
                />
                <span style={{ fontWeight: "bold" }}>Track product prices and variants</span>
              </label>
              <p style={{ margin: "5px 0 0 25px", color: "#637381", fontSize: "14px" }}>
                Send detailed product price information to analytics
              </p>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={formState.trackDiscounts}
                  onChange={(e) => setFormState({...formState, trackDiscounts: e.target.checked})}
                  style={{ marginRight: "10px" }}
                />
                <span style={{ fontWeight: "bold" }}>Track discount codes and amounts</span>
              </label>
              <p style={{ margin: "5px 0 0 25px", color: "#637381", fontSize: "14px" }}>
                Capture discount details on orders for marketing analysis
              </p>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={formState.trackCustomerConsent}
                  onChange={(e) => setFormState({...formState, trackCustomerConsent: e.target.checked})}
                  style={{ marginRight: "10px" }}
                />
                <span style={{ fontWeight: "bold" }}>Track customer consent status</span>
              </label>
              <p style={{ margin: "5px 0 0 25px", color: "#637381", fontSize: "14px" }}>
                Capture email marketing and SMS consent information
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug information - can be removed in production */}
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
        <h3>Current Settings (Debug):</h3>
        <pre>{JSON.stringify({...formState, shop}, null, 2)}</pre>
      </div>
    </div>
  );
} 