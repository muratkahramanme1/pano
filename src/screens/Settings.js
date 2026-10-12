import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useApp } from '../ctx';
import { useTheme } from '../theme';
import { Btn, Card, H3, Input, Note, Screen } from '../ui';

export default function Settings() {
  const { api, server, username, defaultProxy, refreshAccounts, signOut, changeServer, note } = useApp();
  const t = useTheme();
  const [proxy, setProxy] = useState('');
  const [cur, setCur] = useState('');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [busy, setBusy] = useState('');

  const run = async (key, fn) => {
    setBusy(key);
    try { await fn(); } catch (e) { note(e.message, 'err'); } finally { setBusy(''); }
  };

  const saveProxy = () => run('save', async () => {
    await api('/api/proxies', { proxy: proxy.trim() });
    note(proxy.trim() ? 'Varsayılan proxy kaydedildi.' : 'Varsayılan proxy kaldırıldı.', 'ok');
    setProxy('');
    await refreshAccounts();
  });
  const testProxy = () => run('test', async () => {
    const r = await api('/api/proxies/test', { proxy: proxy.trim() || null }, 'POST', 60000);
    note(r.ip ? `Çıkış IP: ${r.ip}` : 'Test tamamlandı.', 'ok');
  });
  const changePw = () => run('pw', async () => {
    if (!cur || !n1) return note('Mevcut ve yeni şifreyi girin.', 'warn');
    if (n1.length < 8) return note('Yeni şifre en az 8 karakter olmalı.', 'warn');
    if (n1 !== n2) return note('Yeni şifreler aynı değil.', 'warn');
    await api('/api/auth/password', { current: cur, new: n1 });
    setCur(''); setN1(''); setN2('');
    note('Şifre değiştirildi.', 'ok');
  });
  const out = () => Alert.alert('Çıkış', 'Bu telefondan çıkış yapılsın mı?', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Çıkış yap', style: 'destructive', onPress: signOut },
  ]);

  return (
    <Screen title="Ayarlar" sub="Sunucu, proxy ve güvenlik.">
      <H3>Sunucu</H3>
      <Card>
        <Text style={{ fontSize: 14, color: t.text, fontWeight: '600' }}>{server}</Text>
        <Note style={{ marginTop: 4, marginBottom: 14 }}>Yönetici: {username || '—'}</Note>
        <Btn kind="ghost" title="Sunucu adresini değiştir" onPress={changeServer} />
      </Card>

      <H3>Proxy (isteğe bağlı)</H3>
      <Card>
        <Note style={{ marginBottom: 12 }}>Varsayılan proxy tüm hesaplar için geçerlidir; hesaba özel proxy girilmişse o önceliklidir. Hiçbiri yoksa doğrudan bağlantı kullanılır.{defaultProxy ? `\nKayıtlı: ${defaultProxy}` : ''}</Note>
        <Input label="Varsayılan proxy" value={proxy} onChangeText={setProxy} placeholder="http://kullanici:sifre@ip:port" />
        <Btn title="Kaydet" onPress={saveProxy} loading={busy === 'save'} style={{ marginBottom: 10 }} />
        <Btn kind="ghost" title="Çıkış IP’sini test et" onPress={testProxy} loading={busy === 'test'} style={{ marginBottom: 10 }} />
        {defaultProxy ? <Btn kind="ghost" title="Kaldır" onPress={() => run('rm', async () => { await api('/api/proxies', { proxy: '' }); await refreshAccounts(); note('Proxy kaldırıldı.', 'ok'); })} /> : null}
      </Card>

      <H3>Güvenlik</H3>
      <Card>
        <Input label="Mevcut şifre" value={cur} onChangeText={setCur} secureTextEntry />
        <Input label="Yeni şifre" hint="(en az 8 karakter)" value={n1} onChangeText={setN1} secureTextEntry />
        <Input label="Yeni şifre (tekrar)" value={n2} onChangeText={setN2} secureTextEntry />
        <Btn title="Şifreyi değiştir" onPress={changePw} loading={busy === 'pw'} />
      </Card>

      <Btn kind="danger" title="Çıkış yap" onPress={out} />
    </Screen>
  );
}
