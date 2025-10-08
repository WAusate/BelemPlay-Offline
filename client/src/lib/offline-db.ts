import { organs as organDefinitions } from '@/lib/organs';
import { initialHymnData } from '@/data/hymns';

const DB_NAME = 'belemplay-offline';
const DB_VERSION = 1;
const ORGANS_STORE = 'organs';
const HYMNS_STORE = 'hymns';

export type HymnSource = 'asset' | 'local';

export interface StoredHymn {
  id?: number;
  organKey: string;
  titulo: string;
  order: number;
  source: HymnSource;
  audioPath?: string;
  audioBlob?: Blob | null;
  fileName?: string;
  createdAt: number;
}

export interface OfflineHymn extends StoredHymn {
  id: number;
  url: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) {
    throw new Error('IndexedDB não suportado neste navegador.');
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const oldVersion = event.oldVersion;
        const transaction = request.transaction;
        if (!transaction) {
          return;
        }

        let organStore: IDBObjectStore;
        if (!db.objectStoreNames.contains(ORGANS_STORE)) {
          organStore = db.createObjectStore(ORGANS_STORE, { keyPath: 'key' });
        } else {
          organStore = transaction.objectStore(ORGANS_STORE);
        }

        let hymnStore: IDBObjectStore;
        if (!db.objectStoreNames.contains(HYMNS_STORE)) {
          hymnStore = db.createObjectStore(HYMNS_STORE, { keyPath: 'id', autoIncrement: true });
        } else {
          hymnStore = transaction.objectStore(HYMNS_STORE);
        }

        if (!hymnStore.indexNames.contains('organKey')) {
          hymnStore.createIndex('organKey', 'organKey', { unique: false });
        }

        if (!hymnStore.indexNames.contains('organOrder')) {
          hymnStore.createIndex('organOrder', ['organKey', 'order'], { unique: false });
        }

        if (oldVersion < 1) {
          for (const organ of organDefinitions) {
            organStore.put(organ);
          }

          Object.entries(initialHymnData).forEach(([organKey, hymns]) => {
            hymns.forEach((hymn, index) => {
              const record: StoredHymn = {
                organKey,
                titulo: hymn.titulo,
                order: index,
                source: 'asset',
                audioPath: hymn.url,
                createdAt: Date.now(),
              };
              hymnStore.add(record);
            });
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Falha ao abrir banco offline.'));
    });
  }

  return dbPromise;
}

export async function initializeOfflineDatabase() {
  await openDatabase();
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Operação IndexedDB falhou.'));
  });
}

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Transação abortada.'));
    tx.onerror = () => reject(tx.error ?? new Error('Erro na transação.'));
  });
}

export async function getHymnsByOrgan(organKey: string): Promise<OfflineHymn[]> {
  const db = await openDatabase();
  const tx = db.transaction(HYMNS_STORE, 'readonly');
  const store = tx.objectStore(HYMNS_STORE);
  const index = store.index('organKey');
  const request = index.getAll(IDBKeyRange.only(organKey));
  const result = await requestToPromise<StoredHymn[]>(request);

  await waitForTransaction(tx);

  const sorted = result.sort((a, b) => a.order - b.order);

  return sorted.map((item) => ({
    ...item,
    id: item.id ?? 0,
    url: item.source === 'asset' ? item.audioPath ?? '' : `local://${item.id}`,
  }));
}

export async function addHymn(organKey: string, params: { titulo: string; file: File }) {
  const db = await openDatabase();
  const tx = db.transaction(HYMNS_STORE, 'readwrite');
  const store = tx.objectStore(HYMNS_STORE);
  const index = store.index('organKey');

  const countRequest = index.getAllKeys(IDBKeyRange.only(organKey));
  const existingKeys = await requestToPromise<IDBValidKey[]>(countRequest);

  const audioBuffer = await params.file.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: params.file.type || 'audio/mpeg' });

  const record: StoredHymn = {
    organKey,
    titulo: params.titulo,
    order: existingKeys.length,
    source: 'local',
    audioBlob,
    fileName: params.file.name,
    createdAt: Date.now(),
  };

  store.add(record);
  await waitForTransaction(tx);

  window.dispatchEvent(new CustomEvent('hymn-db-changed', { detail: { organKey } }));
}

export async function deleteHymn(id: number) {
  const db = await openDatabase();
  const tx = db.transaction(HYMNS_STORE, 'readwrite');
  const store = tx.objectStore(HYMNS_STORE);
  store.delete(id);
  await waitForTransaction(tx);
  window.dispatchEvent(new CustomEvent('hymn-db-changed'));
}

export async function updateHymnOrder(organKey: string, orderedIds: number[]) {
  const db = await openDatabase();
  const tx = db.transaction(HYMNS_STORE, 'readwrite');
  const store = tx.objectStore(HYMNS_STORE);

  const updatePromises = orderedIds.map((id, index) => {
    const request = store.get(id);
    return requestToPromise<StoredHymn | undefined>(request).then((record) => {
      if (!record) return;
      record.order = index;
      store.put(record);
    });
  });

  await Promise.all(updatePromises);
  await waitForTransaction(tx);
  window.dispatchEvent(new CustomEvent('hymn-db-changed', { detail: { organKey } }));
}

export async function getAllHymns(): Promise<OfflineHymn[]> {
  const db = await openDatabase();
  const tx = db.transaction(HYMNS_STORE, 'readonly');
  const store = tx.objectStore(HYMNS_STORE);
  const request = store.getAll();
  const result = await requestToPromise<StoredHymn[]>(request);
  await waitForTransaction(tx);
  return result.sort((a, b) => a.organKey.localeCompare(b.organKey) || a.order - b.order).map((item) => ({
    ...item,
    id: item.id ?? 0,
    url: item.source === 'asset' ? item.audioPath ?? '' : `local://${item.id}`,
  }));
}
