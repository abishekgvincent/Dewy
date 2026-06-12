import axios from "axios";

// Read API URL from environment variable, fallback to localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  skin_type: string;
  age_group: string;
  persona: string;
  total_spend: number;
  signup_date: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  refill_cycle_days: number | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Order {
  id: number;
  customer_id: number;
  order_amount: number;
  order_date: string;
  created_at: string;
  items: OrderItem[];
}

export interface Campaign {
  id: number;
  name: string;
  channel: string;
  message: string;
  status: string;
  created_at: string;
  audience_size?: number;
  segment_name?: string;
  stats?: {
    total: number;
    delivered: number;
    opened: number;
    purchased: number;
  };
}

export interface CampaignDetail extends Campaign {
  segment: {
    id: number | null;
    name: string;
    description: string;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    purchased: number;
    revenue: number;
  };
  communications: {
    id: number;
    customer_name: string;
    customer_email: string;
    channel: string;
    status: string;
    sent_at: string;
  }[];
  insight: {
    summary: string;
    recommendations: string;
  } | null;
}

export interface Segment {
  id: number;
  name: string;
  description: string;
  filters: Record<string, any>;
  audience_size: number;
  created_at: string;
}

export interface Stats {
  total_customers: number;
  total_orders: number;
  revenue: number;
  campaign_count: number;
  funnel: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    purchased: number;
  };
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

// Stats API
export const getStats = async (): Promise<Stats> => {
  const { data } = await apiClient.get<Stats>("/stats");
  return data;
};

// Customers API
export const getCustomers = async (params?: {
  search?: string;
  skin_type?: string;
  age_group?: string;
  persona?: string;
}): Promise<Customer[]> => {
  const { data } = await apiClient.get<Customer[]>("/customers/", { params });
  return data;
};

// Products API
export const getProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>("/products/");
  return data;
};

// Orders API
export const getOrders = async (): Promise<Order[]> => {
  const { data } = await apiClient.get<Order[]>("/orders/");
  return data;
};

// Campaigns API
export const getCampaigns = async (): Promise<Campaign[]> => {
  const { data } = await apiClient.get<Campaign[]>("/campaigns/");
  return data;
};

export const getCampaign = async (id: number): Promise<CampaignDetail> => {
  const { data } = await apiClient.get<CampaignDetail>(`/campaigns/${id}`);
  return data;
};

export const createCampaign = async (payload: {
  name: string;
  channel: string;
  message: string;
  segment_id?: number;
  segment_name?: string;
  filters?: Record<string, any>;
  description?: string;
}): Promise<Campaign> => {
  const { data } = await apiClient.post<Campaign>("/campaigns/", payload);
  return data;
};

export const sendCampaign = async (campaignId: number): Promise<{ status: string; campaign_id: number }> => {
  const { data } = await apiClient.post<{ status: string; campaign_id: number }>("/campaigns/send", {
    campaign_id: campaignId,
  });
  return data;
};

// AI Copilot API
export interface AISegmentResponse {
  segment_name: string;
  filters: Record<string, any>;
  audience_size: number;
  average_spend: number;
  customers: Customer[];
}

export const aiSegment = async (prompt: string): Promise<AISegmentResponse> => {
  const { data } = await apiClient.post<AISegmentResponse>("/ai/segment", { prompt });
  return data;
};

export interface AIMessageResponse {
  variant_a: string;
  variant_b: string;
  variant_c: string;
}

export const aiMessage = async (segmentName: string, channel: string): Promise<AIMessageResponse> => {
  const { data } = await apiClient.post<AIMessageResponse>("/ai/message", {
    segment_name: segmentName,
    channel,
  });
  return data;
};

export interface AIRecommendChannelResponse {
  recommended_channel: string;
  reasoning: string;
}

export const aiRecommendChannel = async (payload: {
  segment_name: string;
  description?: string;
  filters: Record<string, any>;
}): Promise<AIRecommendChannelResponse> => {
  const { data } = await apiClient.post<AIRecommendChannelResponse>("/ai/recommend-channel", payload);
  return data;
};

export default apiClient;
