import { AsyncLocalStorage } from 'async_hooks';

export interface RequestStore {
  requestId: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  userId?: string;
  organizationId?: string;
}

export const requestStoreStorage = new AsyncLocalStorage<RequestStore>();

export function runWithRequestStore(store: RequestStore, fn: () => void): void {
  requestStoreStorage.run(store, fn);
}

export function getRequestStore(): RequestStore {
  return requestStoreStorage.getStore() ?? ({} as RequestStore);
}

export function updateRequestStore(patch: Partial<RequestStore>): void {
  const current = getRequestStore();
  const next: RequestStore = { ...current, ...patch };
  const store = requestStoreStorage.getStore();
  if (store) {
    requestStoreStorage.enterWith(next);
  }
}