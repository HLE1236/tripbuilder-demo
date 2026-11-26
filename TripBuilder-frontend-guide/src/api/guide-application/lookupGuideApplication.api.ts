import { apiClient } from '@/api/client';
import type {
  GuideApplicationStatusInfo,
  LookupGuideApplicationPayload,
} from '@/api/types';

export async function lookupGuideApplicationApi(
  payload: LookupGuideApplicationPayload
): Promise<GuideApplicationStatusInfo> {
  const res = await apiClient.post('/api/guide-applications/lookup', payload);
  return res.data.data;
}
