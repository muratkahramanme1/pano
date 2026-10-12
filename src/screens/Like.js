import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useApp } from '../ctx';
import { parseLinks, shortLink } from '../links';
import { useBatch } from '../batch';
import { AccountPicker, Btn, Card, DelayFields, H3, Input, Note, Results, Screen } from '../ui';

export default function Like() {
  const { api, accounts, loadingAccounts, selected, setSelected, delays, setDelays, drafts, setDraft, note, refreshAccounts } = useApp();
  const batch = useBatch();
  const text = drafts.likeLinks || '';
  const { ok: links, bad } = useMemo(() => parseLinks(text), [text]);

  const run = async () => {
    const users = accounts.map((a) => a.username).filter((u) => selected.has(u));
    if (!links.length) return note('En az bir geçerli gönderi/reel bağlantısı girin.', 'warn');
    if (!users.length) return note('En az bir hesap seçin.', 'warn');
    // hesap başına tüm bağlantılar, sonra sıradaki hesap
    const tasks = users.flatMap((u) =>
      links.map((url) => ({ label: `@${u} · ${shortLink(url)}`, call: () => api('/api/like', { post_url: url, username: u }) }))
    );
    const r = await batch.start(tasks, delays.like, 'Beğeni');
    if (r) note(r.summary, r.err ? 'warn' : 'ok');
  };

  return (
    <Screen title="Beğeni" sub="Seçili hesaplarla bir ya da birden çok gönderiyi beğen." onRefresh={refreshAccounts}>
      <Card>
        <Input label="Gönderi / reel bağlantıları" hint="(her satıra bir tane)" multiline value={text} onChangeText={(v) => setDraft('likeLinks', v)} placeholder={'https://www.instagram.com/p/XXXXXXXXXXX/\nhttps://www.instagram.com/reel/YYYYYYYYYYY/'} />
        <Note>{links.length ? `${links.length} geçerli bağlantı` + (bad.length ? ` · ${bad.length} geçersiz` : '') : bad.length ? `${bad.length} geçersiz` : ' '}</Note>
      </Card>
      <AccountPicker accounts={accounts} selected={selected} setSelected={setSelected} loading={loadingAccounts} />
      <Card>
        <DelayFields value={delays.like} onChange={(v) => setDelays({ ...delays, like: v })} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn style={{ flex: 1 }} title="Beğen" onPress={run} disabled={batch.running} />
          {batch.running ? <Btn kind="ghost" title="Durdur" onPress={batch.stop} /> : null}
        </View>
      </Card>
      <H3>Sonuçlar</H3>
      <Results rows={batch.rows} waiting={batch.waiting} />
    </Screen>
  );
}
