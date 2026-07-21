import { revalidateTag, unstable_cache } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase-server';

const FINANCIAL_STATS_TAG = 'financial-stats';

export const getCachedFinancialStats = unstable_cache(
  async (unitId: string, monthStart: string, today: string) => {
    const { data, error } = await createServerSupabase(unitId).rpc('get_financial_stats', {
      p_unit_id: unitId,
      p_month_start: monthStart,
      p_today: today,
    });

    if (error) {
      throw new Error(`financial_stats:${error.code}`, { cause: error });
    }

    return data;
  },
  ['financial-stats-v1'],
  { revalidate: 30, tags: [FINANCIAL_STATS_TAG] },
);

export function invalidateFinancialStats(): void {
  // Route Handlers do not support updateTag. Immediate expiration prevents a
  // successful financial mutation from serving a stale dashboard summary.
  revalidateTag(FINANCIAL_STATS_TAG, { expire: 0 });
}
