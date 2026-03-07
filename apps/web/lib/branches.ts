import { apiFetch } from './api';
import type { BranchListResponse, BranchDetail } from './types';

export interface ListBranchesParams {
  city?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  capacity?: number;
}

export async function listBranches(
  params: ListBranchesParams = {},
): Promise<BranchListResponse> {
  return apiFetch<BranchListResponse>('/branches', {
    params: {
      city: params.city,
      type: params.type,
      search: params.search,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      capacity: params.capacity,
    },
    next: { revalidate: 60 },
  });
}

export async function getBranch(id: string): Promise<BranchDetail> {
  return apiFetch<BranchDetail>(`/branches/${id}`, {
    next: { revalidate: 60 },
  });
}
