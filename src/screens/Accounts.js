import React, { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { useApp } from '../ctx';
import { useTheme } from '../theme';
import { Btn, Card, H3, Input, Note, Screen, Seg } from '../ui';

function Profile({ p }) {
  const t = useTheme();
  if (!p) return null;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.soft, borderWidth: 1, borderColor: t.line, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {p.profile_pic ? (
            <Image source={{ uri: p.profile_pic }} style={{ width: 56, height: 56 }} />
          ) : (
            <Text style={{ fontSize: 20, fontWeight: '600', color: t.muted }}>{(p.username || '?')[0].toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '650', color: t.text }}>@{p.username}</Text>
          <Text style={{ fontSize: 13, color: t.muted, marginTop: 2 }}>
            {p.full_name ? p.full_name + ' · ' : ''}{Number(p.follower_count || 0).toLocaleString('tr-TR')} takipçi
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function Accounts() {
  const { api, accounts, loadingAccounts, refreshAccounts, note } = useApp();
  const t = useTheme();
  const [me, setMe] = useState(null);
  const [mode, setMode] = useState('cookie');
  const [sid, setSid] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [proxy, setProxy] = useState('');
  const [busy, setBusy] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);

  const loadMe = async () => {
    try {
      const r = await api('/api/account/me');
      setMe(r.profile);
    } catch {
      setMe(null);
    }
  };
  useEffect(() => {
    loadMe();
  }, [accounts.length]);

  const refresh = async () => {
    await refreshAccounts();
    await loadMe();
  };

  const add = async () => {
    setBusy(true);
    try {
      const r =
        mode === 'cookie'
          ? await api('/api/login/cookie', { sessionid: sid.trim(), proxy: proxy.trim() || null })
          : await api('/api/login/password', { username: user.trim(), password: pass, verification_code: code.trim() || null, proxy: proxy.trim() || null });
      note(`Giriş başarılı: @${r.profile.username}`, 'ok');
      setSid(''); setPass(''); setCode(''); setProxy(''); setNeed2fa(false);
      await refresh();
    } catch (e) {
      if (e.code === '2fa_required') setNeed2fa(true);
      note(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const switchTo = async (u) => {
    try {
      await api('/api/accounts/switch', { username: u });
      note(`@${u} aktif.`, 'ok');
      await refresh();
    } catch (e) {
      note(e.message, 'err');
    }
  };

  const remove = (u) =>
    Alert.alert('Hesabı sil', `@${u} oturumu sunucudan silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await api('/api/accounts/' + encodeURIComponent(u), undefined, 'DELETE');
            await refresh();
          } catch (e) {
            note(e.message, 'err');
          }
        },
      },
    ]);

  const setAccProxy = (u) =>
    Alert.prompt
      ? Alert.prompt(`@${u} proxy`, 'http://kullanici:sifre@ip:port (boş bırakırsanız kaldırılır)', async (v) => {
          try {
            await api('/api/proxies', { username: u, proxy: (v || '').trim() });
            note('Proxy kaydedildi.', 'ok');
            await refresh();
          } catch (e) {
            note(e.message, 'err');
          }
        })
      : null;

  const canAdd = mode === 'cookie' ? sid.trim().length >= 10 : user.trim() && pass;

  return (
    <Screen title="Hesaplar" sub="Instagram hesaplarını ekle, aktif hesabı seç." onRefresh={refresh} refreshing={loadingAccounts}>
      <Profile p={me} />
      <H3>Kayıtlı hesaplar</H3>
      <Card style={{ paddingVertical: 6 }}>
        {accounts.length === 0 ? <Note style={{ paddingVertical: 10 }}>Henüz hesap yok.</Note> : null}
        {accounts.map((a, i) => (
          <View key={a.username} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: '550' }}>@{a.username}</Text>
              {a.active ? <Text style={{ fontSize: 12, color: t.ok }}>aktif</Text> : null}
            </View>
            {a.proxy ? <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>proxy: {a.proxy}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              {!a.active ? <Text onPress={() => switchTo(a.username)} style={{ fontSize: 13.5, color: t.text, fontWeight: '600' }}>Aktif yap</Text> : null}
              {Alert.prompt ? <Text onPress={() => setAccProxy(a.username)} style={{ fontSize: 13.5, color: t.muted }}>Proxy</Text> : null}
              <Text onPress={() => remove(a.username)} style={{ fontSize: 13.5, color: t.err }}>Sil</Text>
            </View>
          </View>
        ))}
      </Card>

      <H3>Hesap ekle</H3>
      <Card>
        <Seg options={[{ value: 'cookie', label: 'Cookie (sessionid)' }, { value: 'password', label: 'Şifre' }]} value={mode} onChange={setMode} />
        {mode === 'cookie' ? (
          <Input label="sessionid" hint="(tarayıcıdan kopyaladığınız çerez)" value={sid} onChangeText={setSid} placeholder="sessionid değeri" secureTextEntry />
        ) : (
          <>
            <Input label="Kullanıcı adı" value={user} onChangeText={setUser} placeholder="instagram kullanıcı adı" />
            <Input label="Şifre" value={pass} onChangeText={setPass} secureTextEntry />
            {need2fa ? <Input label="Doğrulama kodu" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="6 haneli kod" /> : null}
          </>
        )}
        <Input label="Proxy" hint="(isteğe bağlı)" value={proxy} onChangeText={setProxy} placeholder="http://kullanici:sifre@ip:port" />
        <Btn title="Hesabı ekle" onPress={add} loading={busy} disabled={!canAdd} />
        <Note style={{ marginTop: 12 }}>
          Instagram ek doğrulama isterse Instagram uygulamasında “Bendim” diyerek onaylayın ya da Cookie ile girin. Bilgiler sunucudaki sessions klasöründe saklanır; telefonda şifre tutulmaz.
        </Note>
      </Card>
    </Screen>
  );
}
