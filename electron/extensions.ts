import { app, BrowserWindow, dialog, session } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import extract from "extract-zip";

export type ExtensionInfo = {
  id: string;
  name: string;
  version: string;
  path: string;
  source: "unpacked" | "webstore";
  enabled: boolean;
};

type StoredExtension = Pick<ExtensionInfo, "id" | "path" | "source" | "enabled">;

const EXTENSIONS_STORE = () => path.join(app.getPath("userData"), "extensions.json");
const EXTENSIONS_DIR = () => path.join(app.getPath("userData"), "extensions");

let cache: ExtensionInfo[] = [];
let hasLoaded = false;

const readStore = async (): Promise<StoredExtension[]> => {
  try {
    const raw = await fs.readFile(EXTENSIONS_STORE(), "utf-8");
    return JSON.parse(raw) as StoredExtension[];
  } catch {
    return [];
  }
};

const writeStore = async (entries: StoredExtension[]) => {
  await fs.writeFile(EXTENSIONS_STORE(), JSON.stringify(entries, null, 2));
};

const updateStoreFromCache = async () => {
  const entries: StoredExtension[] = cache.map((ext) => ({
    id: ext.id,
    path: ext.path,
    source: ext.source,
    enabled: ext.enabled,
  }));
  await writeStore(entries);
};

const ensureExtensionsDir = async () => {
  await fs.mkdir(EXTENSIONS_DIR(), { recursive: true });
};

const extractCrxPayload = (buffer: Buffer) => {
  if (buffer.subarray(0, 4).toString("utf8") !== "Cr24") {
    throw new Error("Invalid CRX header");
  }
  const version = buffer.readUInt32LE(4);
  if (version === 2) {
    const pubKeyLength = buffer.readUInt32LE(8);
    const sigLength = buffer.readUInt32LE(12);
    const zipStart = 16 + pubKeyLength + sigLength;
    return buffer.subarray(zipStart);
  }
  if (version === 3) {
    const headerSize = buffer.readUInt32LE(8);
    const zipStart = 12 + headerSize;
    return buffer.subarray(zipStart);
  }
  throw new Error("Unsupported CRX version");
};

const loadExtensionFromPath = async (extPath: string, source: ExtensionInfo["source"]) => {
  const extension = await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
  const existingIndex = cache.findIndex((item) => item.id === extension.id);
  const entry: ExtensionInfo = {
    id: extension.id,
    name: extension.name,
    version: extension.version,
    path: extension.path,
    source,
    enabled: true,
  };
  if (existingIndex >= 0) {
    cache[existingIndex] = entry;
  } else {
    cache.push(entry);
  }
  await updateStoreFromCache();
  return entry;
};

export const loadPersistedExtensions = async () => {
  if (hasLoaded) return;
  const stored = await readStore();
  cache = [];
  for (const entry of stored) {
    if (!entry.enabled) {
      continue;
    }
    try {
      const extension = await session.defaultSession.loadExtension(entry.path, { allowFileAccess: true });
      cache.push({
        id: extension.id,
        name: extension.name,
        version: extension.version,
        path: extension.path,
        source: entry.source,
        enabled: true,
      });
    } catch {
      // Ignore extensions that fail to load.
    }
  }
  await updateStoreFromCache();
  hasLoaded = true;
};

export const listExtensions = () => cache.slice();

export const loadUnpackedExtension = async (window: BrowserWindow) => {
  const result = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"],
    title: "Load Unpacked Extension",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return loadExtensionFromPath(result.filePaths[0], "unpacked");
};

export const installFromWebStore = async (extensionId: string) => {
  const trimmed = extensionId.trim();
  if (!/^[a-p]{32}$/i.test(trimmed)) {
    throw new Error("Please provide a valid Chrome Web Store extension ID.");
  }
  const alreadyInstalled = cache.find((ext) => ext.id === trimmed);
  if (alreadyInstalled) {
    return alreadyInstalled;
  }
  await ensureExtensionsDir();
  const destDir = path.join(EXTENSIONS_DIR(), trimmed);
  await fs.rm(destDir, { recursive: true, force: true });
  await fs.mkdir(destDir, { recursive: true });

  const chromeVersion = process.versions.chrome;
  const url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${chromeVersion}&acceptformat=crx2,crx3&x=id%3D${trimmed}%26installsource%3Dondemand%26uc`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to download extension from the Chrome Web Store.");
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < 16 || buffer.subarray(0, 4).toString("utf8") !== "Cr24") {
    throw new Error("Chrome Web Store did not return a valid extension package.");
  }
  const zipPayload = extractCrxPayload(buffer);

  const zipPath = path.join(destDir, `${trimmed}.zip`);
  await fs.writeFile(zipPath, zipPayload);

  await extract(zipPath, { dir: destDir });
  await fs.rm(zipPath, { force: true });

  return loadExtensionFromPath(destDir, "webstore");
};

export const removeExtension = async (extensionId: string) => {
  session.defaultSession.removeExtension(extensionId);
  cache = cache.filter((ext) => ext.id !== extensionId);
  await updateStoreFromCache();
};
