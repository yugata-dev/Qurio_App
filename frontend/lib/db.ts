import Dexie, { type Table } from "dexie";

export type ThemePreference = "system" | "light" | "dark";

export interface PreferenceRecord {
  key: string;
  value: string;
}

class QurioDatabase extends Dexie {
  preferences!: Table<PreferenceRecord, string>;

  constructor() {
    super("qurio");
    this.version(1).stores({ preferences: "key" });
  }
}

export const db = new QurioDatabase();

export async function getThemePreference(): Promise<ThemePreference | null> {
  const preference = await db.preferences.get("theme");
  return preference?.value === "system" ||
    preference?.value === "light" ||
    preference?.value === "dark"
    ? preference.value
    : null;
}

export function saveThemePreference(theme: ThemePreference): Promise<string> {
  return db.preferences.put({ key: "theme", value: theme });
}
