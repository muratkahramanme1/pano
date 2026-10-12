import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { Btn, Card, Input, Note } from '../ui';

export default function Login({ initialServer, onLogin }) {
  const t = useTheme();
  const [server, setServer] = useState(initialServer || '');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const go = async () => {
    setErr('');
    setBusy(true);
    try {
      await onLogin(server, user.trim(), pass);
    } catch (e) {
      setErr(e.message || 'Giriş başarısız.');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
          <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: t.text }} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.text }}>Pano</Text>
        </View>
        <Card style={{ padding: 22 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: t.text, marginBottom: 6 }}>Giriş yap</Text>
          <Note style={{ marginBottom: 18 }}>Panelin çalıştığı adresi ve yönetici bilgilerini girin. Yönetici hesabı bilgisayarda panel ilk açılışında oluşturulur.</Note>
          {err ? <Text style={{ color: t.err, fontSize: 13, marginBottom: 12, lineHeight: 19 }}>{err}</Text> : null}
          <Input label="Sunucu adresi" value={server} onChangeText={setServer} placeholder="http://192.168.1.20:8000" keyboardType="url" />
          <Input label="Kullanıcı adı" value={user} onChangeText={setUser} textContentType="username" />
          <Input label="Şifre" value={pass} onChangeText={setPass} secureTextEntry textContentType="password" onSubmitEditing={go} />
          <Btn title="Giriş yap" onPress={go} loading={busy} disabled={!server.trim() || !user.trim() || !pass} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
