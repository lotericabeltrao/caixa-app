
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { ENV } from "./env";

const QUEUE_KEY = "syncQueue:v2";

export type QueueItem = {
  target: "main" | "control" | "commissions";
  body: any;
  createdAt: string;
};

export async function queueItem(item: QueueItem) {
  const raw = (await AsyncStorage.getItem(QUEUE_KEY)) || "[]";
  const arr = JSON.parse(raw) as QueueItem[];
  arr.push({ ...item, createdAt: new Date().toISOString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
}

export async function queueMany(items: QueueItem[]) {
  const raw = (await AsyncStorage.getItem(QUEUE_KEY)) || "[]";
  const arr = JSON.parse(raw) as QueueItem[];
  items.forEach(it => arr.push({ ...it, createdAt: new Date().toISOString() }));
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
}

function urlFor(target: QueueItem["target"]) {
  switch (target) {
    case "main": return ENV.ENDPOINT_MAIN;
    case "control": return ENV.ENDPOINT_CONTROL;
    case "commissions": return ENV.ENDPOINT_COMMISSIONS;
  }
}

export async function trySyncNow() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { ok: false, reason: "offline" };

  const raw = (await AsyncStorage.getItem(QUEUE_KEY)) || "[]";
  const arr = JSON.parse(raw) as QueueItem[];
  if (!arr.length) return { ok: true, sent: 0, remaining: 0 };

  const remaining: QueueItem[] = [];
  let sent = 0;

  for (const item of arr) {
    try {
      const res = await fetch(urlFor(item.target)!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item.body, token: ENV.TOKEN }),
      });
      if (res.ok) sent += 1;
      else remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { ok: true, sent, remaining: remaining.length };
}

export function startAutoSync() {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      trySyncNow();
    }
  });
  return unsubscribe;
}
