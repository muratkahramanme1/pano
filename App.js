import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppCtx } from './src/ctx';
import { makeApi, loginForToken, normalizeServer } from './src/api';
import { getItem, setItem } from './src/store';
import { useTheme } from './src/theme';
import Login from './src/screens/Login';
import Accounts from './src/screens/Accounts';
import Like from './src/screens/Like';
import Follow from './src/screens/Follow';
import Comment from './src/screens/Comment';
import Story from './src/screens/Story';
import Settings from './src/screens/Settings';

const TABS = [
  { key: 'accounts', label: 'Hesaplar', icon: 'person-circle-outline', C: Accounts },
  { key: 'like', label: 'Beğeni', icon: 'heart-outline', C: Like },
  { key: 'follow', label: 'Takip', icon: 'person-add-outline', C: Follow },
  { key: 'comment', label: 'Yorum', icon: 'chatbubble-outline', C: Comment },
  { key: 'story', label: 'Hikaye', icon: 'add-circle-outline', C: Story },
  { key: 'settings', label: 'Ayarlar', icon: 'options-outline', C: Settings },
];

function Toast({ toast }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const c = toast.lvl === 'err' ? t.err : toast.lvl === 'ok' ? t.ok : t.warn;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 8 }}>
      <View style={{ backgroundColor: t.surface, borderColor: c, borderWidth: 1, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }}>
        <Text style={{ color: t.text, fontSize: 13.5, lineHeight: 19 }}>{toast.msg}</Text>
      </View>
    </View>
  );
}

function TabBar({ tab, setTab }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.line, paddingBottom: insets.bottom, paddingTop: 6 }}>
      {TABS.map((x) => {
        const on = tab === x.key;
        return (
          <Pressable key={x.key} onPress={() => setTab(x.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
            <Ionicons name={x.icon} size={22} color={on ? t.text : t.muted} />
            <Text style={{ fontSize: 10.5, marginTop: 2, color: on ? t.text : t.muted, fontWeight: on ? '650' : '500' }}>{x.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Root() {
  const t = useTheme();
  const [ready, setReady] = useState(false);
  const [server, setServer] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [defaultProxy, setDefaultProxy] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [delays, setDelays] = useState({ like: { min: '10', max: '30' }, comment: { min: '30', max: '90' } });
  const [drafts, setDrafts] = useState({});
  const [tab, setTab] = useState('accounts');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      setServer(await getItem('server'));
      setToken(await getItem('token'));
      setUsername(await getItem('admin'));
      setReady(true);
    })();
  }, []);

  const note = useCallback((msg, lvl = 'ok') => {
    setToast({ msg, lvl });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const signOut = useCallback(async (silent) => {
    if (!silent && server && token) {
      try { await makeApi({ server, token })('/api/auth/logout', {}, 'POST', 8000); } catch {}
    }
    await setItem('token', '');
    setToken('');
    setAccounts([]);
    setSelected(new Set());
  }, [server, token]);

  const api = useMemo(
    () => makeApi({ server, token, onAuthLost: () => { signOut(true); note('Oturum sona erdi, tekrar giriş yapın.', 'warn'); } }),
    [server, token, signOut, note]
  );

  const refreshAccounts = useCallback(async () => {
    if (!token) return;
    setLoadingAccounts(true);
    try {
      const r = await api('/api/accounts');
      setAccounts(r.accounts || []);
      setDefaultProxy(r.default_proxy || '');
      setSelected((s) => {
        const names = new Set((r.accounts || []).map((a) => a.username));
        return new Set([...s].filter((u) => names.has(u)));
      });
    } catch (e) {
      note(e.message, 'err');
    } finally {
      setLoadingAccounts(false);
    }
  }, [api, token, note]);

  useEffect(() => { refreshAccounts(); }, [token]);

  const onLogin = async (rawServer, user, pass) => {
    const s = normalizeServer(rawServer);
    const r = await loginForToken(s, user, pass);
    await setItem('server', s);
    await setItem('token', r.token);
    await setItem('admin', r.username);
    setServer(s);
    setUsername(r.username);
    setToken(r.token);
  };

  const ctx = {
    api, server, username, accounts, defaultProxy, loadingAccounts, refreshAccounts, selected, setSelected,
    delays, setDelays, drafts, setDraft: (k, v) => setDrafts((d) => ({ ...d, [k]: v })), note,
    signOut: () => signOut(false), changeServer: async () => { await signOut(false); },
  };

  if (!ready) return <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.muted} /></View>;

  return (
    <AppCtx.Provider value={ctx}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {!token ? (
        <Login initialServer={server} onLogin={onLogin} />
      ) : (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
          <View style={{ flex: 1 }}>
            {/* Tüm sekmeler bağlı kalır: çalışan toplu işlemler sekme değişince kaybolmaz */}
            {TABS.map(({ key, C }) => (
              <View key={key} style={{ flex: 1, display: tab === key ? 'flex' : 'none' }}><C /></View>
            ))}
          </View>
          <TabBar tab={tab} setTab={setTab} />
        </View>
      )}
      <Toast toast={toast} />
    </AppCtx.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
