import { GmailHistoryEntry } from "types";
import { KeyValue } from "../model/kv";
import { EMAIL_HISTORY_ID_MAP_KEY } from "const";

export async function setValue<TVal>(key: string, value: TVal, ttl?: Date) {
  await KeyValue.findOneAndUpdate(
    { key },
    { value, ttl },
    { upsert: true, new: true }
  );
}

export async function getValue<TVal>(key: string): Promise<TVal | null> {
  const doc = await KeyValue.findOne({ key });
  if (doc && doc.ttl && doc.ttl < new Date()) {
    await KeyValue.deleteOne({
      key,
    });
    return null;
  }
  return doc ? (doc.value as TVal) : null;
}

export async function isValueSet(key: string): Promise<boolean> {
  const doc = await KeyValue.findOne({ key });
  return doc !== null;
}

export const addGmailUserWithHistoryId = async (
  email: string,
  historyId: number
): Promise<boolean> => {
  const entries: GmailHistoryEntry[] =
    (await getValue(EMAIL_HISTORY_ID_MAP_KEY)) || [];
  const current = `${email}${historyId}`;

  if (entries.some((entry) => `${entry.email}${entry.historyId}` === current)) {
    return false;
  }

  entries.push({ email, historyId, timestamp: Date.now() });
  const updatedEntries = entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);
  await setValue(EMAIL_HISTORY_ID_MAP_KEY, updatedEntries);
  return true;
};

export const cleanGmailHistoryIdMap = async (): Promise<void> => {
  const entries = await getValue<GmailHistoryEntry[]>(EMAIL_HISTORY_ID_MAP_KEY);
  if (entries && entries.length > 100) {
    const updatedEntries = entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
    await setValue(EMAIL_HISTORY_ID_MAP_KEY, updatedEntries);
  }
};
