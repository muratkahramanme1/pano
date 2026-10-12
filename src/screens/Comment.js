import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../ctx';
import { useTheme } from '../theme';
import { POST_RE, shortLink } from '../links';
import { useBatch } from '../batch';
import { Btn, Card, DelayFields, H3, Input, Note, Results, Screen, Seg } from '../ui';

const fmt = (ms) =>
  new Date(ms).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const STATUS = { pending: 'bekliyor', running: 'çalışıyor', done: 'tamamlandı', error: 'hata' };

export default function Comment() {
  const { api, accounts, loadingAccounts, selected, setSelected, delays, setDelays, drafts, setDraft, note, refreshAccounts } = useApp();
  const t = useTheme();
  const batch = useBatch();
  const [mode, setMode] = useState('now');
  const [texts, setTexts] = useState(() => {
    try { return JSON.parse(drafts.commentTexts || '{}'); } catch { return {}; }
  });
  const [times, setTimes] = useState({});     // {kullanıcı: epoch ms}
  const [picker, setPicker] = useState(null); // hangi hesap için tarih seçiliyor
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState(false);
  const url = drafts.commentUrl || '';

  const setText = (u, v) => {
    const n = { ...texts, [u]: v };
    setTexts(n);
    setDraft('commentTexts', JSON.stringify(n));
  };

  const users = useMemo(() => accounts.map((a) => a.username).filter((u) => selected.has(u)), [accounts, selected]);

  const loadJobs = async () => {
    try {
      const r = await api('/api/schedule');
      setJobs(r.jobs || []);
    } catch {}
  };
  useEffect(() => {
    loadJobs();
    const id = setInterval(loadJobs, 15000);
    return () => clearInterval(id);
  }, []);

  const defaultTime = () => Date.now() + 10 * 60 * 1000;
  const timeOf = (u) => times[u] || defaultTime();

  const runNow = async () => {
    if (!POST_RE.test(url)) return note('Geçerli bir gönderi/reel bağlantısı girin.', 'warn');
    const ready = users.filter((u) => (texts[u] || '').trim());
    if (!ready.length) return note('Seçili hesaplardan en az birinin yanına yorum yazın.', 'warn');
    const tasks = users.map((u) => {
      const text = (texts[u] || '').trim();
      return { label: `@${u}`, skip: text ? null : 'atlandı (yorum boş)', call: () => api('/api/comment', { post_url: url, username: u, text }) };
    });
    const r = await batch.start(tasks, delays.comment || delays.like, 'Yorum');
    if (r) note(r.summary, r.err ? 'warn' : 'ok');
  };

  const schedule = async () => {
    if (!POST_RE.test(url)) return note('Geçerli bir gönderi/reel bağlantısı girin.', 'warn');
    const items = users
      .filter((u) => (texts[u] || '').trim())
      .map((u) => ({ username: u, text: texts[u].trim(), run_at: timeOf(u) / 1000 }));
    if (!items.length) return note('Seçili hesaplardan en az birinin yanına yorum yazın.', 'warn');
    setBusy(true);
    try {
      const r = await api('/api/schedule/comment', { post_url: url, items });
      note(`${r.count} yorum planlandı.`, 'ok');
      await loadJobs();
    } catch (e) {
      note(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const cancel = (j) =>
    Alert.alert('İşi sil', `@${j.username} için bu kayıt silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { try { await api('/api/schedule/' + j.id, undefined, 'DELETE'); await loadJobs(); } catch (e) { note(e.message, 'err'); } } },
    ]);

  const color = { pending: t.muted, running: t.warn, done: t.ok, error: t.err };

  return (
    <Screen title="Yorum" sub="Her hesabın yanına yorumunu yaz; hemen ya da seçtiğin saatte gönder." onRefresh={() => { refreshAccounts(); loadJobs(); }}>
      <Card>
        <Input label="Gönderi / reel bağlantısı" value={url} onChangeText={(v) => setDraft('commentUrl', v)} placeholder="https://www.instagram.com/p/XXXXXXXXXXX/" />
        <Seg options={[{ value: 'now', label: 'Hemen' }, { value: 'plan', label: 'Planla' }]} value={mode} onChange={setMode} />
        {mode === 'now' ? <DelayFields value={delays.comment || delays.like} onChange={(v) => setDelays({ ...delays, comment: v })} /> : <Note>Her hesap için tarih ve saat seçin. Sunucu zamanı gelince yorumu kendisi gönderir; telefonun açık olması gerekmez ama bilgisayar/sunucu açık ve panel çalışıyor olmalı.</Note>}
      </Card>

      <H3>Hesaplar</H3>
      {accounts.length === 0 ? <Card><Note>{loadingAccounts ? 'Yükleniyor…' : 'Önce Hesaplar sekmesinden hesap ekleyin.'}</Note></Card> : null}
      {accounts.map((a) => {
        const on = selected.has(a.username);
        const u = a.username;
        return (
          <Card key={u}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: on ? 12 : 0 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>@{u}</Text>
              <Btn kind={on ? undefined : 'ghost'} title={on ? 'Seçili' : 'Seç'} style={{ paddingVertical: 7, paddingHorizontal: 14 }}
                onPress={() => { const n = new Set(selected); on ? n.delete(u) : n.add(u); setSelected(n); }} />
            </View>
            {on ? (
              <>
                <Input value={texts[u] || ''} onChangeText={(v) => setText(u, v)} multiline placeholder="Bu hesabın yorumu" style={{ minHeight: 70 }} />
                {mode === 'plan' ? (
                  <View>
                    <Text style={{ fontSize: 13, color: t.muted, marginBottom: 6 }}>Gönderim zamanı: <Text style={{ color: t.text, fontWeight: '600' }}>{fmt(timeOf(u))}</Text></Text>
                    {picker === u ? (
                      <DateTimePicker
                        value={new Date(timeOf(u))}
                        mode="datetime"
                        display={Platform.OS === 'ios' ? 'compact' : 'default'}
                        minimumDate={new Date()}
                        onChange={(_, d) => { if (d) setTimes((s) => ({ ...s, [u]: d.getTime() })); }}
                      />
                    ) : (
                      <Btn kind="ghost" title="Tarih / saat seç" onPress={() => { setTimes((s) => ({ ...s, [u]: timeOf(u) })); setPicker(u); }} style={{ alignSelf: 'flex-start', paddingVertical: 8 }} />
                    )}
                  </View>
                ) : null}
              </>
            ) : null}
          </Card>
        );
      })}

      <Card>
        {mode === 'now'
          ? <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn style={{ flex: 1 }} title="Yorum yap" onPress={runNow} disabled={batch.running} />
              {batch.running ? <Btn kind="ghost" title="Durdur" onPress={batch.stop} /> : null}
            </View>
          : <Btn title="Planla" onPress={schedule} loading={busy} />}
      </Card>

      {mode === 'now' ? (<><H3>Sonuçlar</H3><Results rows={batch.rows} waiting={batch.waiting} /></>) : null}

      <H3>Planlanan yorumlar</H3>
      <Card style={{ paddingVertical: 6 }}>
        {jobs.length === 0 ? <Note style={{ paddingVertical: 10 }}>Planlanmış yorum yok.</Note> : null}
        {jobs.map((j, i) => (
          <View key={j.id} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>@{j.username} · {fmt(j.run_at * 1000)}</Text>
              <Text style={{ fontSize: 12, color: color[j.status] || t.muted }}>{STATUS[j.status] || j.status}</Text>
            </View>
            <Text numberOfLines={2} style={{ fontSize: 13, color: t.muted, marginTop: 2 }}>{j.text}</Text>
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{shortLink(j.post_url)}{j.message ? ' · ' + j.message : ''}</Text>
            {j.status !== 'running' ? <Text onPress={() => cancel(j)} style={{ fontSize: 13, color: t.err, marginTop: 6 }}>{j.status === 'pending' ? 'İptal et' : 'Listeden sil'}</Text> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
