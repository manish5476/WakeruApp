// src/utils/uuid.ts

/**
 * Generates an RFC4122 version 4 compliant UUID.
 * Works consistently across React Native, Expo Web, Node.js, and background workers.
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
