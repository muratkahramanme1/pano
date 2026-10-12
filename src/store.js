import * as SecureStore from 'expo-secure-store';

// Küçük anahtar-değer deposu. Erişim hata verirse uygulama yine çalışır (değerler kalıcı olmaz).
export async function getItem(key, fallback = '') {
  try {
    const v = await SecureStore.getItemAsync(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}
export async function setItem(key, value) {
  try {
    if (value == null || value === '') await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, String(value));
  } catch {}
}
