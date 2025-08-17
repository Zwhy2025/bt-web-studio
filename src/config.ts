
// Global configuration for the application

/**
 * The WebSocket URL for connecting to the debugger proxy.
 * It can be overridden by the VITE_DEBUGGER_URL environment variable.
 */
export const DEBUGGER_URL = (import.meta as any).env?.VITE_DEBUGGER_URL || '/ws';

// Add other global configurations here in the future.
