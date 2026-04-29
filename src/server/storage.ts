import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");

export type StoreName =
  | "artifacts"
  | "knowledge"
  | "settings"
  | "skills"
  | "telegram-messages";

export async function readStore<T>(name: StoreName, fallback: T): Promise<T> {
  try {
    const file = path.join(DATA_DIR, `${name}.json`);
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeStore<T>(name: StoreName, value: T) {
  await mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, `${name}.json`);
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
