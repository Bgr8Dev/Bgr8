/**
 * Emulator utility functions for Firebase development
 * Contains connection helpers for Firebase emulators
 */

// Emulator connection logging helper
export const logEmulatorConnection = (
  emulator: string,
  host: string,
  port: number,
  success: boolean,
  error?: unknown
) => {
  if (success) {
    console.log(`✅ Connected to ${emulator} emulator on ${host}:${port}`);
  } else {
    const errorMessage = error instanceof Error ? error.message : 'No error message';
    console.log(`⚠️ ${emulator} emulator connection failed (${host}:${port}): ${errorMessage}`);
  }
};
