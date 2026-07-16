import { Client } from "@gradio/client";

async function run() {
  const client = await Client.connect("Shlok0829/vortex-siem-backend");
  console.log("Connected!");
  try {
    const result = await client.predict("/get_users", []);
    console.log("Users Result type:", typeof result.data, "Value:", JSON.stringify(result.data).slice(0, 500));
    
    const result2 = await client.predict("/get_endpoints", []);
    console.log("Endpoints Result type:", typeof result2.data, "Value:", JSON.stringify(result2.data).slice(0, 500));
    
    const result3 = await client.predict("/get_graph", []);
    console.log("Graph Result type:", typeof result3.data, "Value:", JSON.stringify(result3.data).slice(0, 500));
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
