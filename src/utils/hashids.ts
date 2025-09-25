// src/utils/hashids.ts
import Hashids from "hashids";

// Pick a strong secret — store in env (e.g., VITE_HASH_SECRET)
const HASH_SECRET = import.meta.env.VITE_HASH_SECRET;
const hashids = new Hashids(HASH_SECRET, 18); // 18 = min length of hash

export function encodeId(id: number) {
  const hashId =  hashids.encode(id);
  // Insert "-6" after every 5 characters
  return hashId.replace(/(.{5})(?=.)/g, "$1-6");
}

// Decode and automatically remove "-6" formatting
export function decodeId(hash: string) {
  const cleanedHash = hash.replace(/-6/g, ""); // remove all '-6'
  const decoded = hashids.decode(cleanedHash);
  return decoded.length > 0 ? (decoded[0] as number) : null;
}
