import React from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './theme';

export function Screen({ title, sub, children, onRefresh, refreshing }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.muted} /> : undefined}
    >
      <Text style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: t.text }}>{title}</Text>
      {sub ? <Text style={{ fontSize: 14, color: t.muted, marginTop: 4, marginBottom: 20, lineHeight: 20 }}>{sub}</Text> : <View style={{ height: 20 }} />}
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 14, padding: 18, marginBottom: 14 }, style]}>
      {children}
    </View>
  );
}

export function H3({ children }) {
  const t = useTheme();
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: t.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

export function Note({ children, style }) {
  const t = useTheme();
  return <Text style={[{ fontSize: 12.5, color: t.muted, lineHeight: 18 }, style]}>{children}</Text>;
}

export function Input({ label, hint, multiline, style, ...props }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: t.text, marginBottom: 6 }}>
          {label} {hint ? <Text style={{ color: t.muted, fontWeight: '400' }}>{hint}</Text> : null}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={t.muted}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        style={[
          {
            fontSize: 15, color: t.text, backgroundColor: t.bg, borderColor: t.line, borderWidth: 1,
            borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
          },
          multiline ? { minHeight: 110, textAlignVertical: 'top', lineHeight: 22 } : null,
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function Btn({ title, onPress, kind, loading, disabled, style }) {
  const t = useTheme();
  const ghost = kind === 'ghost';
  const danger = kind === 'danger';
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: ghost || danger ? 'transparent' : t.accent,
          borderColor: danger ? t.err : t.line,
          borderWidth: ghost || danger ? 1 : 0,
          borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18,
          alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
          opacity: off ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={ghost || danger ? t.text : t.accentText} /> : null}
      <Text style={{ fontSize: 15, fontWeight: '600', color: danger ? t.err : ghost ? t.text : t.accentText }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1,
        borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accent : t.surface,
      }}
    >
      <Text style={{ fontSize: 13.5, fontWeight: '550', color: on ? t.accentText : t.text }}>{label}</Text>
    </Pressable>
  );
}

export function Seg({ options, value, onChange }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.soft, borderRadius: 10, padding: 3, marginBottom: 16 }}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={{
            flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
            backgroundColor: value === o.value ? t.surface : 'transparent',
          }}
        >
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: value === o.value ? t.text : t.muted }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Hesap seçici: onay kutulu satırlar + "Tümü" / "Hiçbiri".
export function AccountPicker({ accounts, selected, setSelected, loading }) {
  const t = useTheme();
  const toggle = (u) => {
    const n = new Set(selected);
    n.has(u) ? n.delete(u) : n.add(u);
    setSelected(n);
  };
  if (!accounts.length) {
    return (
      <Card>
        <Note>{loading ? 'Hesaplar yükleniyor…' : 'Henüz kayıtlı hesap yok. Önce “Hesaplar” sekmesinden bir hesap ekleyin.'}</Note>
      </Card>
    );
  }
  return (
    <Card style={{ paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>Hesaplar ({selected.size}/{accounts.length})</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text onPress={() => setSelected(new Set(accounts.map((a) => a.username)))} style={{ fontSize: 13, color: t.muted }}>Tümü</Text>
          <Text onPress={() => setSelected(new Set())} style={{ fontSize: 13, color: t.muted }}>Hiçbiri</Text>
        </View>
      </View>
      {accounts.map((a) => {
        const on = selected.has(a.username);
        return (
          <Pressable key={a.username} onPress={() => toggle(a.username)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.line }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: on ? t.accent : t.muted, backgroundColor: on ? t.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {on ? <Text style={{ color: t.accentText, fontSize: 13, fontWeight: '700' }}>✓</Text> : null}
            </View>
            <Text style={{ fontSize: 15, color: t.text, flex: 1 }}>@{a.username}</Text>
            {a.active ? <Text style={{ fontSize: 11, color: t.ok }}>aktif</Text> : null}
          </Pressable>
        );
      })}
    </Card>
  );
}

// Toplu işlem sonuç listesi (hesap bazında durum satırları).
export function Results({ rows, waiting }) {
  const t = useTheme();
  if (!rows.length) return <Note>Henüz işlem yok.</Note>;
  const color = { ok: t.ok, err: t.err, warn: t.warn, run: t.muted };
  return (
    <Card style={{ paddingVertical: 6 }}>
      {rows.map((r, i) => (
        <View key={r.id} style={{ paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
          <Text style={{ fontSize: 14, color: t.text, fontWeight: '550' }}>{r.label}</Text>
          <Text style={{ fontSize: 13, color: color[r.status] || t.muted, marginTop: 2 }}>{r.msg}</Text>
        </View>
      ))}
      {waiting > 0 ? <Text style={{ fontSize: 13, color: t.muted, paddingVertical: 9 }}>⏳ {waiting} sn bekleniyor…</Text> : null}
    </Card>
  );
}

// İki küçük sayı alanı: bekleme aralığı (sn).
export function DelayFields({ value, onChange, label = 'Hesaplar arası bekleme (sn)' }) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: t.text }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Input value={String(value.min)} keyboardType="number-pad" onChangeText={(v) => onChange({ ...value, min: v.replace(/\D/g, '') })} placeholder="en az" />
        </View>
        <View style={{ flex: 1 }}>
          <Input value={String(value.max)} keyboardType="number-pad" onChangeText={(v) => onChange({ ...value, max: v.replace(/\D/g, '') })} placeholder="en çok" />
        </View>
      </View>
    </View>
  );
}
