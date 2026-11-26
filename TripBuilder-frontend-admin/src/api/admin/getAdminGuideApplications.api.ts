import { apiClient } from '../client';
import type { GuideApplication, GuideApplicationStatus } from '../types';

export async function getAdminGuideApplicationsApi(
  status?: GuideApplicationStatus | 'ALL'
): Promise<GuideApplication[]> {
  const params = status && status !== 'ALL' ? { status } : undefined;
  const res = await apiClient.get('/api/admin/guide-applications', { params });
  return res.data.data;
}
