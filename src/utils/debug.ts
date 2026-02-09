/**
 * Debug utilities for development and troubleshooting
 */

export class DebugUtils {
  private static isEnabled = false;

  static enable() {
    this.isEnabled = true;
    console.log('🔧 Debug mode enabled');
  }

  static disable() {
    this.isEnabled = false;
    console.log('🔧 Debug mode disabled');
  }

  static toggle() {
    this.isEnabled = !this.isEnabled;
    console.log(`🔧 Debug mode ${this.isEnabled ? 'enabled' : 'disabled'}`);
  }

  static log(...args: any[]) {
    if (this.isEnabled) {
      console.log('[DEBUG]', ...args);
    }
  }

  static warn(...args: any[]) {
    if (this.isEnabled) {
      console.warn('[DEBUG]', ...args);
    }
  }

  static error(...args: any[]) {
    if (this.isEnabled) {
      console.error('[DEBUG]', ...args);
    }
  }

  static info(...args: any[]) {
    if (this.isEnabled) {
      console.info('[DEBUG]', ...args);
    }
  }

  static group(label: string, ...args: any[]) {
    if (this.isEnabled) {
      console.group(label, ...args);
    }
  }

  static groupEnd() {
    if (this.isEnabled) {
      console.groupEnd();
    }
  }

  static trace(label?: string) {
    if (this.isEnabled) {
      console.trace(label || 'Trace');
    }
  }
}

// Make debug utilities available globally in development
if (import.meta.env.DEV) {
  (window as any).debug = DebugUtils;
}