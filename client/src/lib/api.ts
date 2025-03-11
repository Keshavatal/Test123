
import { toast } from "../components/ui/use-toast";

interface ApiOptions {
  includeCredentials?: boolean;
  contentType?: string;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options: ApiOptions = {}
) {
  const {
    includeCredentials = true,
    contentType = "application/json"
  } = options;

  try {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: includeCredentials ? "include" : undefined
    };

    if (data && method !== "GET") {
      fetchOptions.body = contentType === "application/json" ? JSON.stringify(data) : data;
    }

    const response = await fetch(url, fetchOptions);

    // Handle non-JSON responses
    const contentTypeHeader = response.headers.get("content-type");
    if (contentTypeHeader && contentTypeHeader.includes("application/json")) {
      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json.message || "Something went wrong");
      }
      
      return json;
    } else {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Something went wrong");
      }
      
      return await response.text();
    }
  } catch (error) {
    console.error("API request error:", error);
    
    if (error instanceof Error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
    
    throw error;
  }
}
