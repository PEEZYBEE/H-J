const STORAGE_KEY = 'offline_errand_queue_v1';

export const getOfflineErrandQueue = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveQueue = (queue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const addOfflineErrandDraft = (draft) => {
  const queue = getOfflineErrandQueue();
  queue.push(draft);
  saveQueue(queue);
  return queue;
};

export const updateOfflineErrandDraft = (draftId, updatedDraft) => {
  const queue = getOfflineErrandQueue();
  const index = queue.findIndex((d) => d.id === draftId);
  if (index !== -1) {
    queue[index] = updatedDraft;
    saveQueue(queue);
  }
  return queue;
};

export const removeOfflineErrandDraft = (draftId) => {
  const queue = getOfflineErrandQueue().filter((d) => d.id !== draftId);
  saveQueue(queue);
  return queue;
};

export const clearOfflineErrandQueue = () => {
  saveQueue([]);
  return [];
};
