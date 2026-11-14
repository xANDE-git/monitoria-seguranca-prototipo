'use strict';
/* Dados fictícios, regras de negócio e simulação. Nada aqui é enviado para fora do navegador. */

const TODAY = '2026-11-14', TD = 6;          // hoje = sábado 14/11; d = 0..6 (dom 8/11 a sáb 14/11)
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const dayLabel = d => `${WD[d]} ${8 + d}/11`;
const toMin = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const fmt = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const first = n => String(n || '').trim().split(/\s+/)[0] || '';
const digits = s => String(s || '').replace(/\D/g, '');

const ICONS = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7z"/><path d="M8.5 8.5l7 7"/>',
  flask: '<path d="M9 2h6M10 2v6L4 19a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 19l-6-11V2"/><path d="M7 15h10"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  heart: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  sliders: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  eye: '<path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  warn: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  pause: '<path d="M8 4v16M16 4v16"/>',
  vol: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  volx: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  out: '<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  signal: '<path d="M4 20v-3M9 20v-7M14 20V9M19 20V5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  skip: '<path d="M5 4l10 8-10 8z"/><path d="M19 5v14"/>',
  book: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h12"/>',
  chev: '<path d="M9 18l6-6-6-6"/>',
  pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'
};
const logo = () => `<img class="cap" src="${LOGO}" alt="Capivara, logo do Monitoria e Segurança">`;
const ic = (n, extra = '') => `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const ALERT_T = {
  semresposta: 'Sem resposta', naoestoubem: 'Disse que não está bem', ajuda: 'Pediu ajuda',
  medatrasada: 'Medicação atrasada', vital: 'Sinal vital fora do limite', sos: 'SOS acionado'
};
const ALERT_ICON = { semresposta: 'clock', naoestoubem: 'heart', ajuda: 'warn', medatrasada: 'pill', vital: 'activity', sos: 'warn' };
const PRESETS = [
  'Oi! Está tudo bem por aí?',
  'Já tomou seus remédios?',
  'Pode me ligar quando puder?',
  'Estou passando aí: você está em casa?',
  'Só responda para eu saber que está bem.'
];

/* ---------- estado ---------- */
let S = seed();

function seed() {
  let rs = 11;
  const rnd = () => { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; };
  const ri = (a, b) => Math.round(a + rnd() * (b - a));
  const st = {
    min: 6 * 60 + 55, play: false, sound: true, nid: 200,
    users: {
      resp: { nome: 'Mariana Duarte', email: 'mariana.duarte@email.com', cpf: '123.456.789-09', tel: '(31) 99876-5432', senha: 'demo123' },
      mon: { nome: 'Antônio Duarte', email: 'antonio.duarte@email.com', cpf: '987.654.321-00', tel: '(31) 98765-4321', senha: 'antonio1' }
    },
    cfg: {
      timeout: 5,
      contatos: [
        { id: 1, nome: 'Mariana Duarte (filha)', tel: '(31) 99876-5432' },
        { id: 2, nome: 'Dr. Paulo Mendes', tel: '(31) 3322-1100' },
        { id: 3, nome: 'Dona Célia (vizinha)', tel: '(31) 99123-4567' }
      ],
      rotina: [
        { id: 1, nome: 'Acordar', hora: '07:00' }, { id: 2, nome: 'Café da manhã', hora: '08:00' },
        { id: 3, nome: 'Almoço', hora: '12:00' }, { id: 4, nome: 'Lanche da tarde', hora: '16:00' },
        { id: 5, nome: 'Jantar', hora: '19:00' }, { id: 6, nome: 'Dormir', hora: '22:00' }
      ],
      meds: [
        { id: 1, nome: 'Losartana 50 mg', hora: '08:10', orient: '1 comprimido depois do café.' },
        { id: 2, nome: 'Metformina 850 mg', hora: '12:30', orient: '1 comprimido durante o almoço.' },
        { id: 3, nome: 'Sinvastatina 20 mg', hora: '21:00', orient: '1 comprimido antes de dormir.' }
      ],
      exames: [
        { id: 1, nome: 'Hemograma completo', data: TODAY, hora: '14:30', local: 'Laboratório Vida, Centro', orient: 'Levar o pedido médico e um documento com foto.' },
        { id: 2, nome: 'Ecocardiograma', data: '2026-11-20', hora: '09:00', local: 'Clínica CardioVida', orient: 'Sem preparo especial.' }
      ],
      lim: { sisMax: 140, sisMin: 90, diaMax: 90, diaMin: 60, fcMax: 100, fcMin: 50 }
    },
    checkins: [], medTakes: [], examEntries: [], alerts: [], vitals: [], log: []
  };
  const wake = [6 * 60 + 48, 7 * 60 + 5, 6 * 60 + 55, 7 * 60 + 20, 7 * 60 + 2, 6 * 60 + 50];
  for (let d = 0; d < TD; d++) {
    st.cfg.rotina.forEach(r => {
      const hh = toMin(r.hora);
      let estado = 'bem', resp = hh + ri(1, 3);
      if (r.id === 1) resp = wake[d];
      if (d === 3 && r.id === 3) { estado = 'sem'; resp = null; }
      if (d === 1 && r.id === 5) estado = 'mal';
      st.checkins.push({ id: st.nid++, d, rotinaId: r.id, evento: r.nome, tipo: 'rotina', hora: r.hora, estado, respondidoEm: resp });
    });
    st.cfg.meds.forEach(m => {
      let status = 'tomada', em = toMin(m.hora) + ri(1, 6), atraso = false;
      if (d === 5 && m.id === 2) { em = toMin(m.hora) + 22; atraso = true; }
      if (d === 2 && m.id === 3) { status = 'pendente'; em = null; }
      st.medTakes.push({ id: st.nid++, d, medId: m.id, nome: m.nome, hora: m.hora, status, em, atraso });
    });
    [['08:15', 0], ['19:30', 1]].forEach(([h, k]) => {
      if (d === 3 && k === 1) return;
      st.vitals.push({ id: st.nid++, d, hora: h, sis: ri(116, 132), dia: ri(74, 84), fc: ri(64, 78) });
    });
  }
  st.vitals = st.vitals.filter(v => !(v.d === 4 && v.hora === '08:15') && !(v.d === 2 && v.hora === '19:30'));
  st.vitals.push({ id: st.nid++, d: 4, hora: '08:20', sis: 152, dia: 96, fc: 82 });
  st.vitals.push({ id: st.nid++, d: 2, hora: '18:05', sis: 126, dia: 80, fc: 108 });
  st.vitals.sort((a, b) => a.d - b.d || toMin(a.hora) - toMin(b.hora));
  st.examEntries.push(
    { id: st.nid++, d: 1, exameId: 90, nome: 'Eletrocardiograma', hora: '10:00', status: 'realizado', em: 10 * 60 + 12 },
    { id: st.nid++, d: 4, exameId: 91, nome: 'Exame de urina', hora: '09:30', status: 'realizado', em: 9 * 60 + 41 },
    { id: st.nid++, d: 5, exameId: 92, nome: 'Glicemia em jejum', hora: '07:30', status: 'pendente', em: null }
  );
  const al = (d, hora, tipo, detalhe, prio, nota, res) => st.alerts.push({ id: st.nid++, d, hora, tipo, titulo: ALERT_T[tipo], detalhe, prio, aberto: false, resolvidoEm: res, nota });
  al(0, '19:41', 'sos', 'Acionado pela opção “Responsável”.', 'critica', 'Acionou sem querer ao guardar o celular.', '19:46');
  al(1, '19:06', 'naoestoubem', 'Check-in do Jantar: “Não estou bem”.', 'media', 'Conversamos por telefone: dor de cabeça leve, já passou.', '19:20');
  al(2, '18:05', 'vital', 'Frequência cardíaca 108 bpm (limite 100).', 'media', 'Tinha acabado de subir a escada. Mediu de novo: 84.', '18:30');
  al(2, '21:05', 'medatrasada', 'Sinvastatina 20 mg não confirmada.', 'media', 'Esqueceu. Tomou depois do aviso.', '21:30');
  al(3, '12:05', 'semresposta', 'Check-in do Almoço sem resposta em 5 min.', 'media', 'Liguei: estava no quintal sem o celular.', '12:14');
  al(4, '08:20', 'vital', 'Pressão 152/96 mmHg (limite 140/90).', 'alta', 'Pedi para repousar. A segunda medição normalizou.', '09:05');
  al(5, '12:52', 'medatrasada', 'Metformina 850 mg atrasada.', 'media', 'Tomou depois do almoço.', '13:00');
  st.log.push(
    { t: 'Sex 13/11 · 18:02', quem: 'Mariana', txt: 'Alterou o horário do remédio Losartana (08:00 → 08:10).' },
    { t: 'Qui 12/11 · 20:15', quem: 'Mariana', txt: 'Acrescentou o contato “Dona Célia (vizinha)”.' },
    { t: 'Qua 11/11 · 09:40', quem: 'Mariana', txt: 'Cadastrou o exame “Ecocardiograma”.' }
  );
  return st;
}

/* ---------- consultas ---------- */
const today = (arr) => arr.filter(x => x.d === TD);
const openAlerts = () => S.alerts.filter(a => a.aberto);
function statusOf() {
  const o = openAlerts();
  if (o.some(a => a.tipo === 'sos')) return 'sos';
  if (o.length) return 'pend';
  return 'ok';
}
const stClass = { ok: 'st-ok', pend: 'st-pend', sos: 'st-sos' };
const stLabel = { ok: 'Estável', pend: 'Pendente', sos: 'Emergência' };
const stText = {
  ok: 'Check-ins em dia, sem alertas nem emergências abertas.',
  pend: 'Há um alerta aguardando ação. O status volta a Estável quando o responsável registrar a verificação.',
  sos: 'O botão SOS foi acionado. Entre em contato agora.'
};
function lastContact() {
  const c = today(S.checkins).filter(x => x.respondidoEm != null).sort((a, b) => b.respondidoEm - a.respondidoEm)[0];
  if (!c) return null;
  return { c, txt: { bem: 'Estou bem', mal: 'Não estou bem', ajuda: 'Preciso de ajuda' }[c.estado] };
}
function monPend() {
  const p = [];
  S.checkins.filter(c => c.estado === 'aberto').forEach(c => p.push({
    k: 'checkin', id: c.id, titulo: c.tipo === 'verificacao' ? 'Sua família quer saber de você' : 'Check-in: ' + c.evento,
    sub: c.tipo === 'verificacao' ? '“' + c.texto + '”' : 'Toque para responder', prazo: c.prazo
  }));
  today(S.medTakes).filter(t => t.status === 'aguardando' || t.status === 'atrasada').forEach(t => p.push({ k: 'med', id: t.id, titulo: 'Hora do remédio', sub: t.nome + ' · ' + t.hora }));
  today(S.examEntries).filter(t => t.status === 'aguardando').forEach(t => p.push({ k: 'exame', id: t.id, titulo: 'Hora do exame', sub: t.nome + ' · ' + t.hora }));
  return p;
}
function agendaHoje() {
  const rows = [];
  S.cfg.rotina.forEach(r => {
    const c = S.checkins.find(x => x.d === TD && x.rotinaId === r.id);
    rows.push({ hora: r.hora, tipo: 'rotina', nome: r.nome, estado: c ? c.estado : (toMin(r.hora) > S.min ? 'agendado' : 'perdido'), c });
  });
  S.cfg.meds.forEach(m => {
    const t = S.medTakes.find(x => x.d === TD && x.medId === m.id);
    rows.push({ hora: m.hora, tipo: 'med', nome: m.nome, orient: m.orient, estado: t ? t.status : 'agendado', t, id: m.id });
  });
  S.cfg.exames.filter(e => e.data === TODAY).forEach(e => {
    const t = S.examEntries.find(x => x.d === TD && x.exameId === e.id);
    rows.push({ hora: e.hora, tipo: 'exame', nome: e.nome, local: e.local, orient: e.orient, estado: t ? t.status : 'agendado', t, id: e.id });
  });
  return rows.sort((a, b) => toMin(a.hora) - toMin(b.hora));
}
function proximoItem() {
  return agendaHoje().find(r => toMin(r.hora) > S.min && r.estado === 'agendado') || null;
}
function outOfLimit(v) {
  const l = S.cfg.lim, r = [];
  if (v.sis > l.sisMax || v.sis < l.sisMin || v.dia > l.diaMax || v.dia < l.diaMin) r.push('pa');
  if (v.fc > l.fcMax || v.fc < l.fcMin) r.push('fc');
  return r;
}

/* ---------- relatório ---------- */
function relatorio(dFrom = 0) {
  const ck = S.checkins.filter(c => c.d >= dFrom && c.estado !== 'aberto');
  const feitos = ck.filter(c => c.estado !== 'sem').length, sem = ck.filter(c => c.estado === 'sem').length;
  const al = S.alerts.filter(a => a.d >= dFrom);
  const porTipo = {}; al.forEach(a => porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1);
  const mt = S.medTakes.filter(t => t.d >= dFrom && !(t.d === TD && t.status === 'aguardando'));
  const medOk = mt.filter(t => t.status === 'tomada').length;
  const ex = S.examEntries.filter(e => e.d >= dFrom);
  const vs = S.vitals.filter(v => v.d >= dFrom);
  const avg = k => vs.length ? Math.round(vs.reduce((s, v) => s + v[k], 0) / vs.length) : null;
  return {
    feitos, sem, total: feitos + sem, adesao: feitos + sem ? Math.round(feitos * 100 / (feitos + sem)) : 100,
    alertas: al, porTipo, medOk, medPend: mt.length - medOk, medTotal: mt.length,
    exOk: ex.filter(e => e.status === 'realizado').length, exPend: ex.filter(e => e.status !== 'realizado' && e.status !== 'aguardando').length,
    vs, sis: avg('sis'), dia: avg('dia'), fc: avg('fc'), vForaDoLimite: vs.filter(v => outOfLimit(v).length).length,
    sos: al.filter(a => a.tipo === 'sos').length, ocorr: al.filter(a => !a.aberto && a.nota)
  };
}

/* ---------- ações do sistema ---------- */
let ac = null;
const SND = { checkin: [[660, .18], [880, .26]], alerta: [[520, .14], [520, .14], [780, .3]], sos: [[880, .2, .13], [640, .2, .13], [880, .2, .13], [640, .2, .13], [880, .32, .13]] };
function beep(kind) {
  if (!S.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    let t = ac.currentTime;
    SND[kind].forEach(([f, d, g = .08]) => {
      const o = ac.createOscillator(), n = ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      n.gain.setValueAtTime(0, t); n.gain.linearRampToValueAtTime(g, t + .02); n.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(n); n.connect(ac.destination); o.start(t); o.stop(t + d + .05); t += d + .05;
    });
  } catch (e) { /* sem áudio: segue sem som */ }
}
const nowTxt = () => `${WD[TD]} ${8 + TD}/11 · ${fmt(S.min)}`;
function addLog(quem, txt) { S.log.unshift({ t: nowTxt(), quem, txt }); }

let hooks = { toast: () => {}, changed: () => {} };

function addAlert(tipo, detalhe, prio) {
  const a = { id: S.nid++, d: TD, hora: fmt(S.min), tipo, titulo: ALERT_T[tipo], detalhe, prio, aberto: true, resolvidoEm: null, nota: '' };
  S.alerts.unshift(a);
  beep(tipo === 'sos' ? 'sos' : 'alerta');
  hooks.toast('resp', ALERT_T[tipo] + ': ' + detalhe, prio === 'critica' ? 'terra' : 'amber');
  return a;
}
function openCheckin({ evento, tipo, texto, rotinaId }) {
  const c = { id: S.nid++, d: TD, tipo, evento, texto: texto || 'Está tudo bem? Toque para responder.', rotinaId, hora: fmt(S.min), estado: 'aberto', prazo: S.min + S.cfg.timeout, respondidoEm: null };
  S.checkins.push(c);
  beep('checkin');
  hooks.toast('mon', tipo === 'verificacao' ? 'Mensagem do seu responsável' : 'Check-in: ' + evento, 'sage');
  return c;
}
function tick() {
  const m = S.min, T = S.cfg.timeout;
  S.cfg.rotina.forEach(r => { if (toMin(r.hora) === m) openCheckin({ evento: r.nome, tipo: 'rotina', rotinaId: r.id }); });
  S.cfg.meds.forEach(md => {
    if (toMin(md.hora) === m && !S.medTakes.some(t => t.d === TD && t.medId === md.id)) {
      S.medTakes.push({ id: S.nid++, d: TD, medId: md.id, nome: md.nome, hora: md.hora, status: 'aguardando', em: null, atraso: false });
      beep('checkin'); hooks.toast('mon', 'Hora do remédio: ' + md.nome, 'sage');
    }
  });
  S.cfg.exames.filter(e => e.data === TODAY).forEach(e => {
    if (toMin(e.hora) === m && !S.examEntries.some(t => t.d === TD && t.exameId === e.id)) {
      S.examEntries.push({ id: S.nid++, d: TD, exameId: e.id, nome: e.nome, hora: e.hora, status: 'aguardando', em: null });
      beep('checkin'); hooks.toast('mon', 'Hora do exame: ' + e.nome, 'sage');
    }
  });
  S.checkins.filter(c => c.estado === 'aberto' && c.prazo <= m).forEach(c => {
    c.estado = 'sem';
    addAlert('semresposta', c.tipo === 'verificacao' ? `Sem resposta à verificação enviada às ${c.hora}.` : `Check-in “${c.evento}” sem resposta em ${T} min.`, 'media');
  });
  today(S.medTakes).filter(t => t.status === 'aguardando' && toMin(t.hora) + T <= m).forEach(t => {
    t.status = 'atrasada'; addAlert('medatrasada', `${t.nome} não foi confirmada (previsto às ${t.hora}).`, 'media');
  });
  today(S.examEntries).filter(t => t.status === 'aguardando' && toMin(t.hora) + 60 <= m).forEach(t => { t.status = 'pendente'; });
}
function advance(mins) {
  for (let i = 0; i < mins; i++) {
    if (S.min >= 23 * 60 + 59) { S.play = false; break; }
    S.min++; tick();
  }
  hooks.changed();
}
function nextEvent() {
  const marks = [];
  S.cfg.rotina.forEach(r => marks.push(toMin(r.hora)));
  S.cfg.meds.forEach(r => marks.push(toMin(r.hora)));
  S.cfg.exames.filter(e => e.data === TODAY).forEach(r => marks.push(toMin(r.hora)));
  S.checkins.filter(c => c.estado === 'aberto').forEach(c => marks.push(c.prazo));
  const n = marks.filter(x => x > S.min).sort((a, b) => a - b)[0];
  if (n == null) return false;
  advance(n - S.min); return true;
}

function respondCheckin(id, estado) {
  const c = S.checkins.find(x => x.id === id);
  if (!c || c.estado !== 'aberto') return;
  c.estado = estado; c.respondidoEm = S.min;
  if (estado === 'mal') addAlert('naoestoubem', c.tipo === 'verificacao' ? 'Respondeu à verificação: “Não estou bem”.' : `Check-in “${c.evento}”: “Não estou bem”.`, 'media');
  if (estado === 'ajuda') addAlert('ajuda', c.tipo === 'verificacao' ? 'Respondeu à verificação: “Preciso de ajuda”.' : `Check-in “${c.evento}”: “Preciso de ajuda”.`, 'alta');
  hooks.changed();
}
function confirmMed(id) {
  const t = S.medTakes.find(x => x.id === id); if (!t) return;
  t.atraso = t.status === 'atrasada' || (S.min - toMin(t.hora) > S.cfg.timeout);
  t.status = 'tomada'; t.em = S.min; hooks.changed();
}
function confirmExame(id) {
  const t = S.examEntries.find(x => x.id === id); if (!t) return;
  t.status = 'realizado'; t.em = S.min; hooks.changed();
}
function registerVital(sis, dia, fc) {
  const v = { id: S.nid++, d: TD, hora: fmt(S.min), sis, dia, fc };
  S.vitals.push(v);
  const o = outOfLimit(v);
  if (o.length) {
    const p = [];
    if (o.includes('pa')) p.push(`pressão ${sis}/${dia} mmHg (limite ${S.cfg.lim.sisMax}/${S.cfg.lim.diaMax})`);
    if (o.includes('fc')) p.push(`frequência cardíaca ${fc} bpm (limite ${S.cfg.lim.fcMax})`);
    addAlert('vital', p.join(' e ') + '.', 'alta');
  }
  hooks.changed(); return o.length > 0;
}
function triggerSOS(opcao) {
  addAlert('sos', 'Acionado pela opção “' + opcao + '” às ' + fmt(S.min) + '.', 'critica');
  hooks.changed();
}
function resolveAlert(id, nota) {
  const a = S.alerts.find(x => x.id === id); if (!a) return;
  a.aberto = false; a.resolvidoEm = fmt(S.min); a.nota = nota || 'Verificado pelo responsável.';
  addLog(first(S.users.resp.nome), `Registrou verificação: ${a.titulo.toLowerCase()} (${a.hora}).`);
  hooks.changed();
}
function sendVerif(texto) {
  openCheckin({ evento: 'Verificação do responsável', tipo: 'verificacao', texto });
  addLog(first(S.users.resp.nome), `Solicitou verificação: “${texto}”.`);
  hooks.changed();
}
