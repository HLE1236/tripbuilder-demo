import { apiClient } from '../client';
import type { GuideApplication, RejectGuideApplicationPayload } from '../types';

export async function rejectGuideApplicationApi(
  id: number,
  payload: RejectGuideApplicationPayload
): Promise<GuideApplication> {
  const res = await apiClient.post(`/api/admin/guide-applications/${id}/reject`, payload);
  return res.data.data;
}
