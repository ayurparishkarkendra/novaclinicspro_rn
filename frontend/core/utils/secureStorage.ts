/**
 * Platform-Aware Secure Storage Abstraction
 * 
 * Uses:
 * - expo-secure-store on iOS/Android (encrypted storage)
 * - localStorage on web (standard browser storage)
 * 
 * This ensures auth tokens work across all platforms without crashes.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface SecureStorageAdapter {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

/**
 * Web implementation using localStorage
 */
class WebStorage implements SecureStorageAdapter {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
      throw error;
    }
  }
}

/**
 * Native implementation using expo-secure-store (encrypted)
 */
class NativeStorage implements SecureStorageAdapter {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting item in SecureStore:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from SecureStore:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from SecureStore:', error);
      throw error;
    }
  }
}

/**
 * Platform-aware storage instance
 * Automatically uses the correct storage implementation
 */
const createSecureStorage = (): SecureStorageAdapter => {
  if (Platform.OS === 'web') {
    return new WebStorage();
  }
  return new NativeStorage();
};

export const secureStorage = createSecureStorage();
