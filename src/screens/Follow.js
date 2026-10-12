import React from 'react';
import { View } from 'react-native';
import { useApp } from '../ctx';
import { USER_RE } from '../links';
import { useBatch } from '../batch';
import { AccountPicker, Btn, Card, DelayFields, H3, Input, Results, Screen } from '../ui';

export default function Follow() {
  const { api, accounts, loadingAccounts, selected, setSelected, delays, setDelays, drafts, setDraft, note, refreshAccounts } = useApp();
  const batch = useBatch();

  const run = async (unfollow) => {
    const target = (drafts.followTarget || '').trim().replace(/^@/, '');
    if (!USER_RE.test(target)) return note('Geçerli bir kullanıcı adı girin.', 'warn');
    const users = accounts.map((a) => a.username).filter((u) => selected.has(u));
    if (!users.length) return note('En az bir hesap seçin.', 'warn');
    const tasks = users.map((u) => ({
      label: `@${u}`,
      skip: u.toLowerCase() === target.toLowerCase() ? 'atlandı (hesap kendisi)' : null,
      call: () => api('/api/follow', { target, username: u, unfollow }),
    }));
    const r = await batch.start(tasks, delays.like, unfollow ? 'Takibi bırakma' : 'Takip');
    if (r) note(r.summary, r.err ? 'warn' : 'ok');
  };

  return (
    <Screen title="Takip" sub="Seçili hesaplarla bir kullanıcıyı takip et ya da takibi bırak." onRefresh={refreshAccounts}>
      <Card>
        <Input label="Kullanıcı adı" value={drafts.followTarget || ''} onChangeText={(v) => setDraft('followTarget', v)} placeholder="@kullanici" />
      </Card>
      <AccountPicker accounts={accounts} selected={selected} setSelected={setSelected} loading={loadingAccounts} />
      <Card>
        <DelayFields value={delays.like} onChange={(v) => setDelays({ ...delays, like: v })} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn style={{ flex: 1 }} title="Takip et" onPress={() => run(false)} disabled={batch.running} />
          <Btn style={{ flex: 1 }} kind="ghost" title="Takibi bırak" onPress={() => run(true)} disabled={batch.running} />
        </View>
        {batch.running ? <Btn style={{ marginTop: 10 }} kind="ghost" title="Durdur" onPress={batch.stop} /> : null}
      </Card>
      <H3>Sonuçlar</H3>
      <Results rows={batch.rows} waiting={batch.waiting} />
    </Screen>
  );
}
