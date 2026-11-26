import { apiClient } from '../client';
import type { ApproveGuideApplicationPayload, GuideApplication } from '../types';

export async function approveGuideApplicationApi(
  id: number,
  payload?: ApproveGuideApplicationPayload
): Promise<GuideApplication> {
  const res = await apiClient.post(`/api/admin/guide-applications/${id}/approve`, payload ?? {});
  return res.data.data;
}
