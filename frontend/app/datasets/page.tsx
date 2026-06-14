"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDatasets, uploadDataset, getCustomers, DatasetInfo } from "@/lib/api";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Database, 
  Upload, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  BarChart, 
  HelpCircle,
  FileText,
  Percent,
  Search,
  Filter,
  MapPin,
  Calendar,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORY_PREFERENCES = ["Apparel", "Electronics", "Home", "Beauty"];
const AGE_GROUPS = ["18-24", "25-34", "35-44", "45+"];
const PERSONAS = ["VIP", "Regular", "Dormant", "TechEnthusiast", "FashionForward"];

export default function DatasetsPage() {
  const [datasetName, setDatasetName] = useState("Uploaded Dataset");
  const [customersFile, setCustomersFile] = useState<File | null>(null);
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);

  // Customer Directory states
  const [custSearch, setCustSearch] = useState("");
  const [custCategory, setCustCategory] = useState("");
  const [custAge, setCustAge] = useState("");
  const [custPersona, setCustPersona] = useState("");

  // Queries
  const { data: datasets, isLoading: datasetsLoading, refetch: refetchDatasets } = useQuery({
    queryKey: ["datasets"],
    queryFn: getDatasets,
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["customers-directory", custSearch, custCategory, custAge, custPersona, selectedDatasetId],
    queryFn: () => getCustomers({
      search: custSearch || undefined,
      category_preference: custCategory || undefined,
      age_group: custAge || undefined,
      persona: custPersona || undefined,
    }),
    enabled: true, // always enabled so they can browse the active database records
  });

  // Active dataset
  const activeDataset = datasets?.find(d => d.id === selectedDatasetId) || datasets?.[0];

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: uploadDataset,
    onSuccess: (data) => {
      toast.success(data.message);
      setCustomersFile(null);
      setOrdersFile(null);
      setProductsFile(null);
      refetchDatasets().then((res) => {
        if (res.data?.length) {
          setSelectedDatasetId(res.data[0].id);
        }
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Upload failed.");
    }
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customersFile && !ordersFile && !productsFile) {
      toast.error("Please select at least one CSV file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("name", datasetName);
    formData.append("preloaded", "false");
    if (customersFile) formData.append("customers", customersFile);
    if (ordersFile) formData.append("orders", ordersFile);
    if (productsFile) formData.append("products", productsFile);
    
    uploadMutation.mutate(formData);
  };

  const handleLoadDemoDataset = () => {
    const formData = new FormData();
    formData.append("name", "Beauty Brand Preloaded");
    formData.append("preloaded", "true");
    uploadMutation.mutate(formData);
  };

  return (
    <LayoutWrapper>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Database className="h-7 w-7 text-sky-500" />
          Datasets Management
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Upload custom customer databases or load the Consumer Brand demo dataset to automatically discover intelligence mapping rules.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Upload Panel & Selection */}
        <div className="md:col-span-1 flex flex-col gap-6">
          {/* Action 1: Upload Panel */}
          <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-base font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-sky-500" />
                Ingest Dataset
              </CardTitle>
              <CardDescription>Upload CSV lists of customers, orders, and products.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-500">Dataset Name</label>
                  <Input 
                    value={datasetName} 
                    onChange={(e) => setDatasetName(e.target.value)} 
                    placeholder="Beauty Brand Launch..."
                    className="border-zinc-200 focus:border-sky-500 dark:border-zinc-800 text-base"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-500 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" /> customers.csv (Optional)
                  </label>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => setCustomersFile(e.target.files?.[0] || null)}
                    className="cursor-pointer text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-500 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-purple-500" /> orders.csv (Optional)
                  </label>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => setOrdersFile(e.target.files?.[0] || null)}
                    className="cursor-pointer text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-500 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-sky-500" /> products.csv (Optional)
                  </label>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => setProductsFile(e.target.files?.[0] || null)}
                    className="cursor-pointer text-sm"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={uploadMutation.isPending} 
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white mt-2 font-bold"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingesting files...
                    </>
                  ) : "Upload & Analyze Schema"}
                </Button>
              </form>

              {/* Demo Seeding Button */}
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-xs text-zinc-400 font-semibold uppercase">Or</span>
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>

              <Button 
                onClick={handleLoadDemoDataset}
                variant="outline"
                disabled={uploadMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 border-zinc-200 text-zinc-800 dark:border-zinc-800 dark:text-zinc-300 font-bold"
              >
                <Play className="h-4 w-4 fill-current" /> Load Seeded Consumer Dataset
              </Button>
            </CardContent>
          </Card>

          {/* Action 2: Loaded List */}
          <Card className="border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/50">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Ingested Datasets</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pb-4">
              {datasetsLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-sky-500" /></div>
              ) : !datasets || datasets.length === 0 ? (
                <p className="text-sm text-zinc-400 italic text-center py-2">No datasets loaded yet.</p>
              ) : (
                datasets.map((d) => {
                  const isSelected = activeDataset?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDatasetId(d.id)}
                      className={`w-full text-left rounded-lg p-3 border transition-all text-sm flex flex-col gap-1.5 ${
                        isSelected 
                          ? "bg-sky-50 border-sky-500 text-sky-600 dark:bg-sky-950/20 dark:border-sky-500 dark:text-sky-400 font-medium"
                          : "bg-white border-zinc-100 hover:border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      <div className="flex justify-between w-full">
                        <span className="font-bold">{d.name}</span>
                        <CheckCircle className={`h-4 w-4 ${isSelected ? "text-sky-500" : "text-zinc-300 dark:text-zinc-700"}`} />
                      </div>
                      <span className="text-xs text-zinc-400">
                        Customers: {d.row_counts.customers.toLocaleString()} | Products: {d.row_counts.products.toLocaleString()}
                      </span>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right columns: Statistics & Intelligence reports */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {!activeDataset ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/10 text-center p-8">
              <Database className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No Dataset Active</h3>
              <p className="text-sm text-zinc-400 max-w-sm mt-1">
                Upload your skincare data tables or load the seeded dataset to compute customer intelligence segments.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Row Counts Widgets */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <div className="rounded-lg bg-sky-50 p-2 dark:bg-sky-950/20">
                      <Users className="h-5 w-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Customers</p>
                      <p className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
                        {activeDataset.row_counts.customers.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950/20">
                      <ShoppingBag className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Products</p>
                      <p className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
                        {activeDataset.row_counts.products.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-950/20">
                      <BarChart className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Orders Ingested</p>
                      <p className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
                        {activeDataset.row_counts.orders.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Intelligence Summary Panel */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Stats Report Card */}
                <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                      Intelligence Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* VIPs */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-900">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {activeDataset.intelligence_summary?.vip_percentage || "12"}% VIP Customers
                        </span>
                        <span className="text-xs text-zinc-400">High spending top tier loyalty</span>
                      </div>
                      <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950/25 dark:text-green-400">
                        Conf: {activeDataset.intelligence_summary?.confidence_scores?.vip * 100 || "95"}%
                      </span>
                    </div>

                    {/* Dormants */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-900">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {activeDataset.intelligence_summary?.dormant_percentage || "18"}% Dormant Customers
                        </span>
                        <span className="text-xs text-zinc-400">No order recorded in 90+ days</span>
                      </div>
                      <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950/25 dark:text-green-400">
                        Conf: {activeDataset.intelligence_summary?.confidence_scores?.dormant * 100 || "94"}%
                      </span>
                    </div>

                    {/* Refill Candidates */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-900">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {activeDataset.intelligence_summary?.refill_candidates_count || "154"} Refill Candidates
                        </span>
                        <span className="text-xs text-zinc-400">Accessory order scheduled 25-40 days ago</span>
                      </div>
                      <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950/25 dark:text-green-400">
                        Conf: {activeDataset.intelligence_summary?.confidence_scores?.refills * 100 || "91"}%
                      </span>
                    </div>

                    {/* demographics */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Top Hub City</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {activeDataset.intelligence_summary?.top_city || "Chennai"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Highest Spend Age Group</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {activeDataset.intelligence_summary?.highest_spending_age_group || "25-34"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Affinity & Mappings Card */}
                <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                      Product Affinity & Schema mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Affinity rules */}
                    <div>
                      <span className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-wide">
                        Product Affinity Rules
                      </span>
                      <div className="space-y-2">
                        {activeDataset.intelligence_summary?.affinity_rules?.map((rule: any, i: number) => (
                          <div key={i} className="rounded-lg bg-sky-50/20 border border-sky-100/30 p-2.5 flex items-center justify-between text-xs dark:bg-sky-950/10 dark:border-sky-950/20">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {rule.from} $\to$ {rule.to}
                            </span>
                            <span className="text-sky-600 font-bold dark:text-sky-400">
                              {Math.round(rule.confidence * 100)}% Conf
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Schemas */}
                    <div>
                      <span className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-wide">
                        Schema Relationships Mapped
                      </span>
                    <div className="text-xs font-mono text-zinc-500 space-y-1">
                        <div>• Customer $\to$ Orders (mapped on customer_id)</div>
                        <div>• Orders $\to$ Products (mapped on product_id)</div>
                        <div>• Orders $\to$ OrderItems (mapped on order_id)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customers Directory Sub-Section */}
              <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Active Customers Directory</CardTitle>
                  <CardDescription>Review the database entries loaded under the current dataset.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 flex flex-col gap-1 w-full">
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 uppercase">
                        <Search className="h-3 w-3" /> Search Name/Email/City
                      </span>
                      <Input
                        value={custSearch}
                        onChange={(e) => setCustSearch(e.target.value)}
                        placeholder="Search..."
                        className="h-9 text-sm border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    
                    <div className="w-full sm:w-32 flex flex-col gap-1">
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 uppercase">
                        Category Pref
                      </span>
                      <select
                        value={custCategory}
                        onChange={(e) => setCustCategory(e.target.value)}
                        className="h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                      >
                        <option value="">All</option>
                        {CATEGORY_PREFERENCES.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-28 flex flex-col gap-1">
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 uppercase">
                        Age
                      </span>
                      <select
                        value={custAge}
                        onChange={(e) => setCustAge(e.target.value)}
                        className="h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                      >
                        <option value="">All</option>
                        {AGE_GROUPS.map(ag => (
                          <option key={ag} value={ag}>{ag}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-32 flex flex-col gap-1">
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 uppercase">
                        Persona
                      </span>
                      <select
                        value={custPersona}
                        onChange={(e) => setCustPersona(e.target.value)}
                        className="h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                      >
                        <option value="">All</option>
                        {PERSONAS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customers Table */}
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:border-zinc-900">
                          <th className="pb-3 text-xs">Name</th>
                          <th className="pb-3 text-xs">Email</th>
                          <th className="pb-3 text-xs">Demographics</th>
                          <th className="pb-3 text-xs">Persona</th>
                          <th className="pb-3 text-right text-xs">Spend</th>
                          <th className="pb-3 text-right text-xs">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-sm">
                        {customersLoading ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-sky-500 mx-auto" /></td>
                          </tr>
                        ) : !customers || customers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-zinc-400 italic">No customer records match search rules.</td>
                          </tr>
                        ) : (
                          customers.slice(0, 100).map((c) => (
                            <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                              <td className="py-2.5">
                                <div className="font-bold text-zinc-900 dark:text-white">{c.name}</div>
                                <div className="text-xs text-zinc-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</div>
                              </td>
                              <td className="py-2.5 text-zinc-500">{c.email}</td>
                              <td className="py-2.5 text-zinc-600 dark:text-zinc-400">
                                <span className="font-semibold">{c.category_preference}</span> ({c.age_group})
                              </td>
                              <td className="py-2.5">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                  c.persona === "VIP"
                                    ? "bg-sky-100 text-sky-850 dark:bg-sky-950/20 dark:text-sky-400"
                                    : c.persona === "Dormant"
                                    ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                    : "bg-indigo-50 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400"
                                }`}>
                                  {c.persona}
                                </span>
                              </td>
                              <td className="py-2.5 text-right font-bold text-zinc-950 dark:text-zinc-50">₹{c.total_spend.toLocaleString()}</td>
                              <td className="py-2.5 text-right text-zinc-400 font-mono text-xs">
                                {new Date(c.signup_date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
