
// Global configuration for the application

/**
 * The WebSocket URL for connecting to the debugger proxy.
 * It can be overridden by the VITE_DEBUGGER_URL environment variable.
 */
export const DEBUGGER_URL = import.meta.env.VITE_DEBUGGER_URL || 'ws://localhost:8080';

// Add other global configurations here in the future.
