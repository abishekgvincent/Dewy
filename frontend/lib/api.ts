import axios from "axios";

// Read API URL from environment variable, fallback to localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface RevenueExplanationData {
  audience_size: number;
  expected_engagement_rate?: number;
  expected_conversion_rate?: number;
  average_order_value: number;
  projected_revenue: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  category_preference: string;
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

export interface CampaignDetail extends Omit<Campaign, "stats"> {
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
  total_customers_growth: string;
  total_orders: number;
  total_orders_growth: string;
  revenue: number;
  revenue_growth: string;
  campaign_count: number;
  active_campaign_count: number;
  top_opportunity: string;
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
  category_preference?: string;
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

// Dataset interfaces
export interface DatasetInfo {
  id: number;
  name: string;
  status: string;
  row_counts: {
    customers: number;
    products: number;
    orders: number;
    order_items?: number;
  };
  schema_info: Record<string, any>;
  intelligence_summary: Record<string, any>;
  created_at: string;
}

// Dataset APIs
export const uploadDataset = async (formData: FormData): Promise<{ message: string; dataset: DatasetInfo }> => {
  const { data } = await apiClient.post<{ message: string; dataset: DatasetInfo }>("/datasets/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
};

export const getDatasets = async (): Promise<DatasetInfo[]> => {
  const { data } = await apiClient.get<DatasetInfo[]>("/datasets/");
  return data;
};

export const getDatasetDetail = async (id: number): Promise<DatasetInfo> => {
  const { data } = await apiClient.get<DatasetInfo>(`/datasets/${id}`);
  return data;
};

// Refactored AI Copilot APIs
export interface AIRecommendationSegment {
  name: string;
  confidence: number;
  reason: string;
  filters: Record<string, any>;
  audience_size: number;
  average_spend: number;
  audience_share: number;
  rank: number;
  reasoning_steps: string[];
}

export interface AIRecommendationChannel {
  channel: string;
  score: number;
  confidence: number;
  reason: string;
  reasoning_steps: string[];
}

export interface AIMessageVariant {
  variant: string;
  message: string;
  predicted_ctr: number;
  confidence: number;
  reasoning: string;
  reasoning_steps: string[];
}

export const getDatasetIntelligence = async (): Promise<Record<string, any>> => {
  const { data } = await apiClient.post<Record<string, any>>("/ai/intelligence");
  return data;
};

export const getMarketingOpportunities = async (): Promise<Record<string, any>[]> => {
  const { data } = await apiClient.post<Record<string, any>[]>("/ai/opportunities");
  return data;
};

export const aiRecommendSegments = async (prompt: string): Promise<AIRecommendationSegment[]> => {
  const { data } = await apiClient.post<AIRecommendationSegment[]>("/ai/segments", { prompt });
  return data;
};

export const aiRecommendChannels = async (payload: {
  segment_name: string;
  filters: Record<string, any>;
}): Promise<AIRecommendationChannel[]> => {
  const { data } = await apiClient.post<AIRecommendationChannel[]>("/ai/channels", payload);
  return data;
};

export const aiMessageVariants = async (payload: {
  segment_name: string;
  channel: string;
}): Promise<AIMessageVariant[]> => {
  const { data } = await apiClient.post<AIMessageVariant[]>("/ai/messages", payload);
  return data;
};

export interface CampaignAnalytics {
  id: number;
  name: string;
  status: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    purchased: number;
    revenue: number;
  };
  rates: {
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
  };
}

export const getCampaignAnalytics = async (id: number): Promise<CampaignAnalytics> => {
  const { data } = await apiClient.get<CampaignAnalytics>(`/campaigns/${id}/analytics`);
  return data;
};

export default apiClient;
