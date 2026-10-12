import { useRef, useState } from 'react';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let seq = 0;

// Toplu işlem: görevler sırayla çalışır, aralarda rastgele bekleme olur (web paneldeki runBatch ile aynı mantık).
// task = { label, skip?: 'neden', call: async () => ({ message }) }
export function useBatch() {
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [waiting, setWaiting] = useState(0);
  const stopRef = useRef(false);

  const patch = (id, status, msg) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status, msg } : r)));

  async function start(tasks, { min, max }, verb = 'İşlem') {
    if (running) return null;
    stopRef.current = false;
    setRunning(true);
    const lo = Math.max(1, parseInt(min, 10) || 10);
    const hi = Math.max(lo, parseInt(max, 10) || lo);
    const list = tasks.map((t) => ({ ...t, id: ++seq }));
    setRows(list.map((t) => ({ id: t.id, label: t.label, status: 'run', msg: 'sırada' })));
    let ok = 0;
    let err = 0;
    let skip = 0;
    for (let i = 0; i < list.length; i++) {
      if (stopRef.current) break;
      const t = list[i];
      if (t.skip) {
        skip++;
        patch(t.id, 'warn', t.skip);
        continue;
      }
      patch(t.id, 'run', 'çalışıyor…');
      try {
        const r = await t.call();
        ok++;
        patch(t.id, 'ok', (r && r.message) || 'tamam');
      } catch (e) {
        err++;
        patch(t.id, 'err', e.message || String(e));
      }
      const next = list[i + 1];
      if (next && !next.skip && !stopRef.current) {
        let w = Math.round(lo + Math.random() * (hi - lo));
        while (w > 0 && !stopRef.current) {
          setWaiting(w);
          await sleep(1000);
          w--;
        }
        setWaiting(0);
      }
    }
    setRunning(false);
    setWaiting(0);
    return { summary: `${verb} bitti: ${ok} başarılı, ${err} hatalı` + (skip ? `, ${skip} atlandı.` : '.'), ok, err };
  }

  return { rows, running, waiting, start, stop: () => { stopRef.current = true; } };
}
