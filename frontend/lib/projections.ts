export interface ProjectionResults {
  audienceSize: number;
  expectedEngagementRate: number;
  expectedConversionRate: number;
  averageOrderValue: number;
  engagedUsers: number;
  purchasers: number;
  expectedRevenue: number;
}

export function calculateProjections(
  audienceSize: number,
  expectedEngagementRate: number, // in percentage, e.g. 10 for 10%
  expectedConversionRate: number, // in percentage, e.g. 7 for 7%
  averageOrderValue: number
): ProjectionResults {
  const engagedUsers = Math.round(audienceSize * (expectedEngagementRate / 100));
  const purchasers = Math.round(engagedUsers * (expectedConversionRate / 100));
  const expectedRevenue = Math.round(purchasers * averageOrderValue);

  return {
    audienceSize,
    expectedEngagementRate,
    expectedConversionRate,
    averageOrderValue,
    engagedUsers,
    purchasers,
    expectedRevenue,
  };
}
