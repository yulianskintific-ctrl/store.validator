import type { CapturedEvidence, StoreRecord } from '../types/store';

const DB = 'store-location-validation';
const DB_VERSION = 2;
const LEGACY_STORE_ROWS = 'stores';
const LEGACY_PENDING_ROWS = 'pending';
const STORE_ROWS = 'storesBySupervisor';
const PENDING_ROWS = 'pendingBySupervisor';
const UNASSIGNED_OWNER = '__unassigned__';

interface PendingValidation {
  customer_id: string;
  evidence: CapturedEvidence;
}

interface CachedStore extends StoreRecord {
  id: string;
  cacheOwner: string;
}

interface CachedPending extends PendingValidation {
  id: string;
  cacheOwner: string;
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLocaleLowerCase();
}

function cacheId(owner: string, customerId: string): string {
  return `${owner}::${customerId}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction;
      const stores = db.objectStoreNames.contains(STORE_ROWS)
        ? tx!.objectStore(STORE_ROWS)
        : db.createObjectStore(STORE_ROWS, { keyPath: 'id' });
      const pending = db.objectStoreNames.contains(PENDING_ROWS)
        ? tx!.objectStore(PENDING_ROWS)
        : db.createObjectStore(PENDING_ROWS, { keyPath: 'id' });

      if (!stores.indexNames.contains('cacheOwner')) stores.createIndex('cacheOwner', 'cacheOwner');
      if (!pending.indexNames.contains('cacheOwner')) pending.createIndex('cacheOwner', 'cacheOwner');

      // Migrate the old global cache. Store rows carry their supervisor, so pending
      // evidence can be assigned to that same owner using its customer_id.
      if (event.oldVersion < 2 && db.objectStoreNames.contains(LEGACY_STORE_ROWS)) {
        const ownerByCustomer = new Map<string, string>();
        const legacyStores = tx!.objectStore(LEGACY_STORE_ROWS);
        const storeCursor = legacyStores.openCursor();
        storeCursor.onsuccess = () => {
          const cursor = storeCursor.result;
          if (cursor) {
            const row = cursor.value as StoreRecord;
            const owner = typeof row.supervisor === 'string' && row.supervisor.trim()
              ? normalizeOwner(row.supervisor)
              : UNASSIGNED_OWNER;
            const customerId = String(row.customer_id ?? '');
            ownerByCustomer.set(customerId, owner);
            stores.put({ ...row, id: cacheId(owner, customerId), cacheOwner: owner });
            cursor.continue();
            return;
          }

          if (!db.objectStoreNames.contains(LEGACY_PENDING_ROWS)) return;
          const legacyPending = tx!.objectStore(LEGACY_PENDING_ROWS);
          const pendingCursor = legacyPending.openCursor();
          pendingCursor.onsuccess = () => {
            const pendingCursorResult = pendingCursor.result;
            if (!pendingCursorResult) return;
            const row = pendingCursorResult.value as PendingValidation;
            const owner = ownerByCustomer.get(String(row.customer_id)) ?? UNASSIGNED_OWNER;
            pending.put({
              ...row,
              id: cacheId(owner, String(row.customer_id)),
              cacheOwner: owner,
            });
            pendingCursorResult.continue();
          };
        };
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const localCache = {
  async getStores(supervisor: string): Promise<StoreRecord[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE_ROWS, 'readonly')
        .objectStore(STORE_ROWS)
        .index('cacheOwner')
        .getAll(normalizeOwner(supervisor));
      req.onsuccess = () => resolve((req.result as CachedStore[]).map(({ id: _id, cacheOwner: _owner, ...row }) => row));
      req.onerror = () => reject(req.error);
    });
  },

  async getPending(supervisor: string): Promise<PendingValidation[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(PENDING_ROWS, 'readonly')
        .objectStore(PENDING_ROWS)
        .index('cacheOwner')
        .getAll(normalizeOwner(supervisor));
      req.onsuccess = () => resolve((req.result as CachedPending[]).map(({ id: _id, cacheOwner: _owner, ...row }) => row));
      req.onerror = () => reject(req.error);
    });
  },

  async replaceStores(supervisor: string, rows: StoreRecord[]) {
    const db = await openDb();
    const owner = normalizeOwner(supervisor);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ROWS, 'readwrite');
      const store = tx.objectStore(STORE_ROWS);
      const cursorReq = store.index('cacheOwner').openCursor(IDBKeyRange.only(owner));
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
          return;
        }
        rows.forEach((row) => {
          store.put({ ...row, id: cacheId(owner, row.customer_id), cacheOwner: owner } satisfies CachedStore);
        });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },

  async putPending(supervisor: string, customer_id: string, evidence: CapturedEvidence) {
    const db = await openDb();
    const owner = normalizeOwner(supervisor);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PENDING_ROWS, 'readwrite');
      tx.objectStore(PENDING_ROWS).put({
        id: cacheId(owner, customer_id),
        cacheOwner: owner,
        customer_id,
        evidence,
      } satisfies CachedPending);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },

  async removePending(supervisor: string, customer_id: string) {
    const db = await openDb();
    const owner = normalizeOwner(supervisor);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PENDING_ROWS, 'readwrite');
      tx.objectStore(PENDING_ROWS).delete(cacheId(owner, customer_id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },
};
