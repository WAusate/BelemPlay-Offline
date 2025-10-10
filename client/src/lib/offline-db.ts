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

function hashOrganKey(organKey: string): number {
  let hash = 0;
  for (let index = 0; index < organKey.length; index += 1) {
    hash = (hash * 31 + organKey.charCodeAt(index)) & 0xffff;
  }
  return hash;
}

function createSineWaveBlob(options: {
  frequency: number;
  durationSeconds?: number;
  sampleRate?: number;
  amplitude?: number;
}): Blob {
  const sampleRate = options.sampleRate ?? 44100;
  const durationSeconds = options.durationSeconds ?? 2.5;
  const amplitude = Math.max(0, Math.min(1, options.amplitude ?? 0.3));
  const totalSamples = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  const writeUint16 = (offset: number, value: number) => {
    view.setUint16(offset, value, true);
  };

  const writeUint32 = (offset: number, value: number) => {
    view.setUint32(offset, value, true);
  };

  writeString(0, 'RIFF');
  writeUint32(4, 36 + dataSize);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, 1);
  writeUint16(22, 1);
  writeUint32(24, sampleRate);
  writeUint32(28, byteRate);
  writeUint16(32, blockAlign);
  writeUint16(34, 16);
  writeString(36, 'data');
  writeUint32(40, dataSize);

  const audioData = new Int16Array(buffer, 44, totalSamples);
  const fadeSamples = Math.min(1024, Math.floor(totalSamples * 0.02));

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    let sample = Math.sin(2 * Math.PI * options.frequency * time);

    if (fadeSamples > 0) {
      const fadeIn = Math.min(1, index / fadeSamples);
      const fadeOut = Math.min(1, (totalSamples - index - 1) / fadeSamples);
      sample *= Math.min(fadeIn, fadeOut);
    }

    const scaled = Math.max(-1, Math.min(1, sample * amplitude));
    audioData[index] = Math.round(scaled * 0x7fff);
  }

  return new Blob([new Uint8Array(buffer)], { type: 'audio/wav' });
}

function generateInitialHymnAudio(organKey: string, order: number): Blob {
  const seed = hashOrganKey(organKey);
  const baseFrequency = 220 + (seed % 120);
  const frequencyStep = 12 + (seed % 7);
  const frequency = baseFrequency + frequencyStep * order;
  return createSineWaveBlob({
    frequency,
    durationSeconds: 3,
    amplitude: 0.32,
  });
}

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
              const generatedAudio = generateInitialHymnAudio(organKey, index);
              const record: StoredHymn = {
                organKey,
                titulo: hymn.titulo,
                order: index,
                source: 'asset',
                audioPath: hymn.url,
                audioBlob: generatedAudio,
                fileName: `${organKey}-${String(index + 1).padStart(2, '0')}.wav`,
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

  return sorted.map((item) => {
    const resolvedUrl = item.audioBlob
      ? ''
      : item.source === 'asset'
        ? item.audioPath ?? ''
        : `local://${item.id}`;

    return {
      ...item,
      id: item.id ?? 0,
      url: resolvedUrl,
    };
  });
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
  return result
    .sort((a, b) => a.organKey.localeCompare(b.organKey) || a.order - b.order)
    .map((item) => {
      const resolvedUrl = item.audioBlob
        ? ''
        : item.source === 'asset'
          ? item.audioPath ?? ''
          : `local://${item.id}`;

      return {
        ...item,
        id: item.id ?? 0,
        url: resolvedUrl,
      };
    });
}
