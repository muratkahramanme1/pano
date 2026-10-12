import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useApp } from '../ctx';
import { POST_RE } from '../links';
import { useBatch } from '../batch';
import { useTheme } from '../theme';
import { AccountPicker, Btn, Card, DelayFields, H3, Input, Note, Results, Screen } from '../ui';

function Toggle({ label, value, onValueChange }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
      <Text style={{ flex: 1, fontSize: 14, color: t.text }}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export default function Story() {
  const { api, accounts, loadingAccounts, selected, setSelected, delays, setDelays, drafts, setDraft, note, refreshAccounts } = useApp();
  const batch = useBatch();
  const [asImage, setAsImage] = useState(true);
  const [tagOwner, setTagOwner] = useState(true);
  const [addLink, setAddLink] = useState(true);

  const run = async () => {
    const url = (drafts.storyUrl || '').trim();
    if (!POST_RE.test(url)) return note('Geçerli bir gönderi/reel URL’si girin.', 'warn');
    const users = accounts.map((a) => a.username).filter((u) => selected.has(u));
    if (!users.length) return note('En az bir hesap seçin.', 'warn');
    const tasks = users.map((u) => ({
      label: `@${u}`,
      call: () => api('/api/share-to-story', { post_url: url, username: u, as_image: asImage, tag_owner: tagOwner, add_link: addLink }),
    }));
    const r = await batch.start(tasks, delays.like, 'Hikaye');
    if (r) note(r.summary, r.err ? 'warn' : 'ok');
  };

  return (
    <Screen title="Hikaye" sub="Bir gönderiyi seçili hesapların hikayesinde paylaş." onRefresh={refreshAccounts}>
      <Card>
        <Input label="Gönderi / reel bağlantısı" value={drafts.storyUrl || ''} onChangeText={(v) => setDraft('storyUrl', v)} placeholder="https://www.instagram.com/p/XXXXXXXXXXX/" />
        <Toggle label="Gönderi görselini hikayeye göm" value={asImage} onValueChange={setAsImage} />
        <Toggle label="Gönderi sahibini etiketle" value={tagOwner} onValueChange={setTagOwner} />
        <Toggle label="Gönderi bağlantısını ekle" value={addLink} onValueChange={setAddLink} />
        <Note style={{ marginTop: 8 }}>Etiket ve bağlantı Instagram tarafından her hesapta gösterilmeyebilir.</Note>
      </Card>
      <AccountPicker accounts={accounts} selected={selected} setSelected={setSelected} loading={loadingAccounts} />
      <Card>
        <DelayFields value={delays.like} onChange={(v) => setDelays({ ...delays, like: v })} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn style={{ flex: 1 }} title="Hikayeye paylaş" onPress={run} disabled={batch.running} />
          {batch.running ? <Btn kind="ghost" title="Durdur" onPress={batch.stop} /> : null}
        </View>
      </Card>
      <H3>Sonuçlar</H3>
      <Results rows={batch.rows} waiting={batch.waiting} />
    </Screen>
  );
}
