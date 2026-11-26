import { apiClient } from '@/api/client';
import type {
  CreateGuideApplicationPayload,
  GuideApplicationStatusInfo,
} from '@/api/types';

export async function submitGuideApplicationApi(
  payload: CreateGuideApplicationPayload
): Promise<GuideApplicationStatusInfo> {
  const res = await apiClient.post('/api/guide-applications', payload);
  return res.data.data;
}
