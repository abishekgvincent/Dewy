"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/lib/api";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Search, 
  Filter, 
  Loader2, 
  UserCheck, 
  AlertCircle,
  TrendingUp,
  Mail,
  MapPin,
  Calendar
} from "lucide-react";

const SKIN_TYPES = ["Dry", "Oily", "Combination", "Sensitive"];
const AGE_GROUPS = ["18-24", "25-34", "35-44", "45+"];
const PERSONAS = ["VIP", "Regular", "Dormant", "SunCare", "AcneCare"];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [skinType, setSkinType] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [persona, setPersona] = useState("");

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ["customers", search, skinType, ageGroup, persona],
    queryFn: () => getCustomers({
      search: search || undefined,
      skin_type: skinType || undefined,
      age_group: ageGroup || undefined,
      persona: persona || undefined,
    }),
    refetchInterval: 10000, // Sync spend live if they purchase during simulator runs!
  });

  const handleReset = () => {
    setSearch("");
    setSkinType("");
    setAgeGroup("");
    setPersona("");
  };

  // Quick stats calculations based on retrieved customers
  const totalCount = customers?.length || 0;
  const vipCount = customers?.filter(c => c.persona === "VIP").length || 0;
  const dormantCount = customers?.filter(c => c.persona === "Dormant").length || 0;
  const totalSpendSum = customers?.reduce((acc, c) => acc + c.total_spend, 0) || 0;
  const avgSpend = totalCount ? totalSpendSum / totalCount : 0;

  return (
    <LayoutWrapper>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Users className="h-7 w-7 text-pink-500" />
          Customers Directory
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your skincare brand clients, review profiles, skin characteristics, and lifetime values.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-lg bg-pink-50 p-2 dark:bg-pink-950/20">
              <Users className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Filtered Matches</p>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{totalCount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-950/20">
              <UserCheck className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">VIPs In View</p>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{vipCount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900">
              <AlertCircle className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Dormants In View</p>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{dormantCount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/20">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Avg Spend In View</p>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">${avgSpend.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 shadow-sm">
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-end">
          {/* Search box */}
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <Search className="h-3 w-3" /> Search Customer
            </label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or city..."
              className="border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* Skin Type dropdown */}
          <div className="flex flex-col gap-1.5 w-full md:w-48">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Skin Type
            </label>
            <select
              value={skinType}
              onChange={(e) => setSkinType(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            >
              <option value="">All Skin Types</option>
              {SKIN_TYPES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Age Group dropdown */}
          <div className="flex flex-col gap-1.5 w-full md:w-40">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Age Group
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            >
              <option value="">All Ages</option>
              {AGE_GROUPS.map(ag => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>

          {/* Persona dropdown */}
          <div className="flex flex-col gap-1.5 w-full md:w-44">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Persona
            </label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pink-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            >
              <option value="">All Personas</option>
              {PERSONAS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <Button onClick={handleReset} variant="outline" className="w-full md:w-auto h-9">
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Grid Table */}
      <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 shadow-sm">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                <span className="text-xs text-zinc-400 font-medium">Filtering database...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-sm">
              Failed to load customers from backend.
            </div>
          ) : !customers || customers.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              No customers match your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:border-zinc-900">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Demographics</th>
                    <th className="pb-3">Persona</th>
                    <th className="pb-3 text-right">Lifetime Spend</th>
                    <th className="pb-3 text-right">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{c.name}</div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3 w-3" /> {c.city || "Unknown"}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                          <Mail className="h-3.5 w-3.5" />
                          {c.email}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{c.phone || "No phone"}</div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1.5">
                            <span className="text-[10px] font-medium text-zinc-400">Skin:</span>
                            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{c.skin_type || "Combination"}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="text-[10px] font-medium text-zinc-400">Age:</span>
                            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{c.age_group || "25-34"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          c.persona === "VIP"
                            ? "bg-pink-100 text-pink-800 dark:bg-pink-950/20 dark:text-pink-400 animate-pulse"
                            : c.persona === "Dormant"
                            ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                            : c.persona === "SunCare"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            : c.persona === "AcneCare"
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400"
                            : "bg-indigo-50 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400"
                        }`}>
                          {c.persona}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold text-zinc-950 dark:text-zinc-50">${c.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right text-zinc-400 font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(c.signup_date).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </LayoutWrapper>
  );
}
