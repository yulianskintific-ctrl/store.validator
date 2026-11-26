import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react';
import type { SessionInfo, StatusFilter, StoreRecord } from '../types/store';
import {
  filterStores,
  isStoreValidated,
  summarizeValidationStats,
} from '../utils/validation';

interface StoreListViewProps {
  session: SessionInfo;
  stores: StoreRecord[];
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onSelectStore: (store: StoreRecord) => void;
  onLogout: () => void;
  pendingCount: number;
  onSendPending: () => void;
  isSending: boolean;
}

export function StoreListView({
  session,
  stores,
  isLoading,
  errorMessage,
  onRefresh,
  onSelectStore,
  onLogout,
  pendingCount,
  onSendPending,
  isSending,
}: StoreListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const stats = useMemo(() => summarizeValidationStats(stores), [stores]);
  const filteredStores = useMemo(
    () => filterStores(stores, searchQuery, statusFilter),
    [stores, searchQuery, statusFilter]
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
      {/* Sticky Top App Bar */}
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 text-[#1E293B] shadow-sm backdrop-blur">
        <div className="max-w-6xl mx-auto min-h-16 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#60A5FA] text-white flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="block text-base sm:text-lg font-bold tracking-tight text-[#1E293B] truncate">
                Store Location Validation
              </span>
              <span className="block text-xs text-slate-500 truncate">
                Supervisor: {session.supervisor}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-[#1E293B] truncate">{session.supervisor}</span>
              <span className="text-xs text-slate-500">Supervisor Area</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Keluar dari akun"
              className="min-h-[42px] px-3 sm:px-3.5 rounded-xl text-sm font-semibold text-[#1E293B] bg-[#F0F8FF] hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* SFA Dashboard KPI Cards Banner */}
        <section className="grid grid-cols-3 gap-3 sm:gap-5" aria-label="Ringkasan Status Validasi">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Total Toko</span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                {stats.total}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Sudah Di Validasi</span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-700 tabular-nums">
                {stats.validated}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Belum Di Validasi</span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-amber-700 tabular-nums">
                {stats.pending}
              </span>
            </div>
          </div>
        </section>

        {/* Kontrol Pencarian, Filter & Tombol Muat Ulang */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <label htmlFor="store-search" className="sr-only">
                Cari nama toko atau customer ID
              </label>
              <Search
                className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="store-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama toko atau Customer ID..."
                className="w-full h-11 pl-11 pr-11 rounded-xl border border-slate-300 bg-slate-50/50 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isLoading || pendingCount > 0}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800 inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-xs"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-blue-600 ${isLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Tarik Data</span>
                </button>
                <button type="button" onClick={onSendPending} disabled={isSending || pendingCount === 0} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-sm font-semibold text-white disabled:opacity-50 whitespace-nowrap">
                  {isSending ? 'Mengirim...' : `Kirim Data${pendingCount ? ` (${pendingCount})` : ''}`}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div
              role="group"
              aria-label="Filter status validasi"
              className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto"
            >
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                aria-pressed={statusFilter === 'all'}
                className={`min-h-[38px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                aria-pressed={statusFilter === 'pending'}
                className={`min-h-[38px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  statusFilter === 'pending'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum ({stats.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('validated')}
                aria-pressed={statusFilter === 'validated'}
                className={`min-h-[38px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  statusFilter === 'validated'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sudah ({stats.validated})
              </button>
            </div>

            <span className="text-sm text-slate-500 font-medium">
              Menampilkan {filteredStores.length} dari {stores.length} toko
            </span>
          </div>
        </section>

        {/* Pesan Error */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 border border-red-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-900">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Daftar Toko SFA */}
        {isLoading && stores.length === 0 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            aria-label="Memuat daftar toko"
          >
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-16 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {stores.length === 0
                ? 'Belum ada toko dalam cakupan supervisor Anda'
                : 'Toko tidak ditemukan'}
            </h2>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              {stores.length === 0
                ? 'Periksa kembali nilai kolom supervisor pada sheet Validasi Long Lad.'
                : 'Ubah kata kunci pencarian atau pilih filter status lainnya.'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800 transition-colors shadow-xs"
                >
                  Tampilkan Semua Toko
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-testid="store-list"
          >
            {filteredStores.map((store) => {
              const validated = isStoreValidated(store);
              return (
                <li key={store.customer_id}>
                  <button
                    type="button"
                    onClick={() => onSelectStore(store)}
                    className="w-full text-left bg-white hover:bg-slate-50/90 active:scale-[0.995] rounded-2xl border border-slate-200 hover:border-blue-400 p-5 flex items-center justify-between gap-4 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 group"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                          {store.customer_name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                        <span className="font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {store.customer_id}
                        </span>
                        <span aria-hidden="true" className="text-slate-400 font-bold">
                          ·
                        </span>
                        <span className="truncate font-medium">{store.distributor_branch}</span>
                      </div>

                      <div className="space-y-0.5 text-sm text-slate-600">
                        <p className="line-clamp-2"><span className="font-semibold text-slate-700">Alamat:</span> {store.address || '-'}</p>
                        <p><span className="font-semibold text-slate-700">Kota:</span> {store.city || '-'}</p>
                      </div>

                      <div className="pt-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          {store.syncStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Pending · belum dikirim</span>
                          ) : validated ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Sudah Divalidasi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Belum Divalidasi</span>
                            </span>
                          )}
                        </div>

                        {store.keterangan && (
                          <span className="text-xs font-medium text-slate-500 truncate max-w-[140px]">
                            {store.keterangan}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-500 flex items-center justify-center shrink-0 transition-colors shadow-xs">
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
