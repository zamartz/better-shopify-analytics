import { json } from "@remix-run/node";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Parse the analytics data from the request
    const analyticsData = await request.json();
    
    // In a real app, you would process and store this data
    console.log("Received analytics data:", analyticsData);
    
    // You might send this to your analytics system or database
    
    return json({ success: true });
  } catch (error) {
    console.error("Error processing analytics data:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function loader() {
  // This endpoint doesn't support GET requests
  return json({ error: "Method not allowed" }, { status: 405 });
} 