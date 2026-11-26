import { useCallback, useState } from 'react';
import { LoginView } from './components/LoginView';
import { StoreDetailView } from './components/StoreDetailView';
import { StoreListView } from './components/StoreListView';
import { ApiError, fetchSupervisorStores, logoutSession, saveStoreValidation } from './services/api';
import { localCache } from './services/localCache';
import type { CapturedEvidence, SessionInfo, StoreRecord } from './types/store';

export default function App() {
  // Token sesi disimpan hanya di memori React (tidak pernah di localStorage/sessionStorage)
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleSessionExpired = useCallback((message: string) => {
    setSession(null);
    setStores([]);
    setSelectedCustomerId(null);
    setStoresError(null);
    setSessionNotice(message);
  }, []);

  const loadStores = useCallback(
    async (activeSession: SessionInfo) => {
      setIsLoadingStores(true);
      setStoresError(null);
      try {
        const result = await fetchSupervisorStores(activeSession.token);
        const pending = await localCache.getPending(activeSession.supervisor);
        const merged = (result.stores ?? []).map((store) => {
          const item = pending.find((row) => row.customer_id === store.customer_id);
          return item ? { ...store, picture: item.evidence.imageDataUrl, longitude: String(item.evidence.longitude), latitude: String(item.evidence.latitude), syncStatus: 'pending' as const } : store;
        });
        await localCache.replaceStores(activeSession.supervisor, merged);
        setStores(merged);
        setPendingIds(pending.map((item) => item.customer_id));
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === 'UNAUTHORIZED') {
            handleSessionExpired(err.message);
            return;
          }
          setStoresError(err.message);
        } else {
          setStoresError('Gagal memuat daftar toko. Periksa koneksi internet Anda.');
        }
      } finally {
        setIsLoadingStores(false);
      }
    },
    [handleSessionExpired]
  );

  async function handleLoginSuccess(newSession: SessionInfo) {
    setSessionNotice(null);
    setStoresError(null);
    setSelectedCustomerId(null);
    setStores([]);
    setPendingIds([]);
    setSession(newSession);
    const [cached, pending] = await Promise.all([
      localCache.getStores(newSession.supervisor),
      localCache.getPending(newSession.supervisor),
    ]);
    setStores(cached);
    setPendingIds(pending.map((row) => row.customer_id));
  }

  async function handleLogout() {
    const token = session?.token;
    setSession(null);
    setStores([]);
    setSelectedCustomerId(null);
    setStoresError(null);
    setSessionNotice(null);
    if (token) {
      await logoutSession(token);
    }
  }

  async function queueValidation(store: StoreRecord, evidence: CapturedEvidence) {
    if (!session) return;
    await localCache.putPending(session.supervisor, store.customer_id, evidence);
    const pendingStore = { ...store, picture: evidence.imageDataUrl, longitude: String(evidence.longitude), latitude: String(evidence.latitude), syncStatus: 'pending' as const };
    const updatedRows = stores.map((row) => row.customer_id === store.customer_id ? pendingStore : row);
    await localCache.replaceStores(session.supervisor, updatedRows);
    setStores(updatedRows);
    setPendingIds((ids) => ids.includes(store.customer_id) ? ids : [...ids, store.customer_id]);
    setSelectedCustomerId(null);
  }

  async function sendPending() {
    if (!session || isSending) return;
    setIsSending(true);
    setStoresError(null);
    try {
      const pending = await localCache.getPending(session.supervisor);
      for (const item of pending) {
        const result = await saveStoreValidation(session.token, { customer_id: item.customer_id, imageBase64: item.evidence.imageDataUrl, mimeType: item.evidence.mimeType, longitude: item.evidence.longitude, latitude: item.evidence.latitude });
        if (!result.store) throw new Error('Server tidak mengonfirmasi penyimpanan data.');
        await localCache.removePending(session.supervisor, item.customer_id);
        const synced = { ...result.store, syncStatus: 'synced' as const };
        setStores((rows) => rows.map((row) => row.customer_id === item.customer_id ? synced : row));
        const cached = await localCache.getStores(session.supervisor);
        await localCache.replaceStores(session.supervisor, cached.map((row) => row.customer_id === item.customer_id ? synced : row));
        setPendingIds((ids) => ids.filter((id) => id !== item.customer_id));
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'UNAUTHORIZED') handleSessionExpired(err.message);
      else setStoresError(err instanceof Error ? err.message : 'Gagal mengirim data pending.');
    } finally { setIsSending(false); }
  }

  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} sessionNotice={sessionNotice} />;
  }

  const selectedStore = selectedCustomerId
    ? stores.find((item) => item.customer_id === selectedCustomerId) ?? null
    : null;

  if (selectedStore) {
    return (
      <StoreDetailView
        store={selectedStore}
        onBack={() => setSelectedCustomerId(null)}
        onQueueValidation={queueValidation}
      />
    );
  }

  return (
    <StoreListView
      session={session}
      stores={stores}
      isLoading={isLoadingStores}
      errorMessage={storesError}
      onRefresh={() => void loadStores(session)}
      onSelectStore={(store) => setSelectedCustomerId(store.customer_id)}
      onLogout={() => void handleLogout()}
      pendingCount={pendingIds.length}
      onSendPending={() => void sendPending()}
      isSending={isSending}
    />
  );
}
