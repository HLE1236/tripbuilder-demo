import { useMutation } from '@tanstack/react-query';
import {
  lookupGuideApplicationApi,
  submitGuideApplicationApi,
} from '@/api/guide-application';
import type {
  CreateGuideApplicationPayload,
  LookupGuideApplicationPayload,
} from '@/api/types';

export function useSubmitGuideApplicationMutation() {
  return useMutation({
    mutationFn: (payload: CreateGuideApplicationPayload) =>
      submitGuideApplicationApi(payload),
  });
}

export function useLookupGuideApplicationMutation() {
  return useMutation({
    mutationFn: (payload: LookupGuideApplicationPayload) =>
      lookupGuideApplicationApi(payload),
  });
}
