import { RevenueExplanationData } from "@/lib/api";

interface RevenueExplanationProps {
  data: RevenueExplanationData;
}

export default function RevenueExplanation({ data }: RevenueExplanationProps) {
  const hasValidData =
    data.audience_size > 0 &&
    data.average_order_value > 0;

  if (!hasValidData) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="font-semibold text-zinc-700 dark:text-zinc-200">
        Based On
      </div>

      <div className="mt-2 flex flex-col gap-1 text-zinc-500 dark:text-zinc-400">
        <span>{data.audience_size} customers</span>

        {typeof data.expected_engagement_rate === "number" && (
          <span>
            × {data.expected_engagement_rate}% engagement rate
          </span>
        )}

        {typeof data.expected_conversion_rate === "number" && (
          <span>
            × {data.expected_conversion_rate}% conversion rate
          </span>
        )}

        <span>
          × ₹{Math.round(data.average_order_value).toLocaleString()} average
          order value
        </span>
      </div>
    </div>
  );
}