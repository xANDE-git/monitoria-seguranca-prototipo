'use strict';
/* Telas e interação. Cada "aparelho" (celular e painel) tem sessão própria e lê o mesmo estado S (dados.js). */

const dfmt = d => d.split('-').reverse().slice(0, 2).join('/');
const dev = {
  phone: { id: 'phone', el: null, s: { view: 'login', role: 'mon' }, toast: null },
  desk: { id: 'desk', el: null, s: { view: 'login', role: 'resp' }, toast: null }
};
const $ = (s, r = document) => r.querySelector(s);

/* ---------- renderização geral ---------- */
function render() {
  Object.values(dev).forEach(d => {
    const el = d.el, ae = document.activeElement;
    const keep = {};
    let fname = null, fpos = null, scrolls = [];
    if (el.contains(ae) && ae.name) { fname = ae.name; fpos = ae.selectionStart; }
    const sg = d.s, sig = [sg.user, sg.view, sg.tab, sg.cfgTab, sg.screen, sg.sheet, sg.modal && sg.modal.kind + sg.modal.id, sg.chk].join('|'), same = sig === d.sig; d.sig = sig;
    if (same) el.querySelectorAll('[name]').forEach(i => { if (i.type === 'radio') { if (i.checked) keep[i.name] = i.value; } else keep[i.name] = i.value; });
    if (!same) fname = null;
    el.querySelectorAll('.scroll,.rbody,.mbody,.auth,.auth-form,.mfull,.modal').forEach((n, i) => scrolls.push([n.className, n.scrollTop]));
    el.innerHTML = d.s.user ? (d.s.user === 'resp' ? respApp(d) : monApp(d)) : authView(d);
    el.querySelectorAll('[name]').forEach(i => {
      if (!(i.name in keep)) return;
      if (i.type === 'radio') i.checked = i.value === keep[i.name]; else if (i.type !== 'checkbox') i.value = keep[i.name];
    });
    const used = {};
    el.querySelectorAll('.scroll,.rbody,.mbody,.auth,.auth-form,.mfull,.modal').forEach(n => {
      const f = scrolls.find(([c]) => c === n.className && !used[c]); if (f) { used[f[0]] = 1; n.scrollTop = f[1]; }
    });
    if (fname) { const f = el.querySelector(`[name="${fname}"]`); if (f) { f.focus(); try { f.setSelectionRange(fpos, fpos); } catch (e) { } } }
    el.classList.toggle('enter', !same);
    if (d.toast) { el.insertAdjacentHTML('beforeend', `<div class="toast ${d.toast.kind} ${d.toast.shown ? '' : 'in'}" role="status">${ic(d.toast.kind === 'terra' ? 'warn' : 'bell')}<span>${esc(d.toast.msg)}</span></div>`); d.toast.shown = true; }
  });
  updateBar();
}
function updateBar() {
  document.querySelectorAll('[data-clock]').forEach(n => n.textContent = fmt(S.min));
  $('#btnPlay').innerHTML = S.play ? ic('pause') + ' Pausar o tempo' : ic('play') + ' Rodar o tempo';
  $('#btnPlay').classList.toggle('on', S.play);
  $('#btnSound').innerHTML = S.sound ? ic('vol') + ' Som ligado' : ic('volx') + ' Som desligado';
  const p = dev.phone.s.user === 'mon' && monPend().length, d = dev.desk.s.user === 'resp' && openAlerts().length;
  $('#dotPhone').classList.toggle('show', !!p); $('#dotDesk').classList.toggle('show', !!d);
  $('#urlBar').innerHTML = ic('lock') + ' monitoria.app/' + (dev.desk.s.user === 'resp' ? ({ status: 'painel', verificar: 'verificar', historico: 'historico', relatorio: 'relatorio-semanal', config: 'configuracoes' }[dev.desk.s.tab] || 'painel') : 'entrar');
}
hooks.changed = render;
hooks.toast = (role, msg, kind) => {
  if (role === 'mon') return;
  Object.values(dev).filter(d => d.s.user === role).forEach(d => {
    d.toast = { msg, kind }; clearTimeout(d.tt);
    d.tt = setTimeout(() => { d.toast = null; render(); }, 5200);
  });
};
function say(d, msg, kind = 'sage') { d.toast = { msg, kind }; clearTimeout(d.tt); d.tt = setTimeout(() => { d.toast = null; render(); }, 3600); }

/* ---------- autenticação ---------- */
function authView(d) {
  const s = d.s, side = `<aside class="auth-side"><div><div class="row" style="gap:10px;margin-bottom:34px"><span class="logo-mark" style="width:46px;height:46px;border-radius:14px">${logo()}</span><b style="font-family:var(--serif);font-size:20px">Monitoria e Segurança</b></div><h2>Tranquilidade para quem cuida e para quem é cuidado.</h2><p>Check-ins automáticos, medicações, sinais vitais e alertas em um só lugar.</p></div><ul><li>${ic('bell')}<span>Alertas na hora quando alguém não responde</span></li><li>${ic('pill')}<span>Controle de remédios e exames</span></li><li>${ic('lock')}<span>Cada pessoa vê só o que o seu perfil permite</span></li></ul></aside>`;
  const err = s.err ? `<div class="err" role="alert">${esc(s.err)}</div>` : '', ok = s.ok ? `<div class="okmsg" role="status">${esc(s.ok)}</div>` : '';
  const brand = `<div class="row" style="gap:10px"><span class="logo-mark" style="width:44px;height:44px;border-radius:13px">${logo()}</span><b style="font-family:var(--serif);font-size:19px">Monitoria e Segurança</b></div>`;
  let body = '';
  if (s.view === 'login') {
    body = `${brand}<h2>Entrar</h2><p class="lead">Escolha o seu perfil e acesse com CPF ou e-mail.</p>
    <div class="seg" role="tablist" style="margin-bottom:16px"><button type="button" class="${s.role === 'resp' ? 'on' : ''}" data-act="role" data-role="resp">Sou o responsável</button><button type="button" class="${s.role === 'mon' ? 'on' : ''}" data-act="role" data-role="mon">Sou o monitorado</button></div>
    ${ok}${err}
    <form data-form="login" autocomplete="off"><div class="field"><label for="${d.id}-id">CPF ou e-mail</label><input id="${d.id}-id" name="id" inputmode="email" autocomplete="off" required></div>
    <div class="field"><label for="${d.id}-pw">Senha</label><div class="pwwrap"><input id="${d.id}-pw" name="senha" type="${s.showpw ? 'text' : 'password'}" autocomplete="off" required><button type="button" data-act="togglepw">${s.showpw ? 'Ocultar' : 'Mostrar'}</button></div></div>
    <button class="btn primary block" style="min-height:50px;font-size:16px">Entrar</button></form>
    <div class="links"><button class="link" data-act="nav" data-v="esqueci">Esqueci minha senha</button>${s.role === 'resp' ? '<button class="link" data-act="nav" data-v="cad1">Criar cadastro</button>' : '<span class="sub">O cadastro é feito pelo seu responsável.</span>'}</div>
    <div class="demo-fill"><div class="row between wrap"><span>Protótipo: preencher com dados de demonstração.</span><button class="btn sm" data-act="demofill">Preencher</button></div></div>`;
  } else if (s.view === 'cad1' || s.view === 'cad2') {
    const one = s.view === 'cad1', dr = s.draft || {};
    body = `${brand}<div class="steps" aria-hidden="true"><i class="on"></i><i class="${one ? '' : 'on'}"></i></div><h2>${one ? 'Seus dados' : 'Dados do monitorado'}</h2>
    <p class="lead">${one ? 'Você é o responsável e vai acompanhar a rotina de quem você cuida.' : 'Defina também a senha inicial de acesso do monitorado.'}</p>${err}
    <form data-form="${s.view}"><div class="field"><label>Nome completo</label><input name="nome" required value="${esc((one ? dr.resp : dr.mon)?.nome || '')}"></div>
    <div class="field"><label>E-mail</label><input name="email" type="email" required value="${esc((one ? dr.resp : dr.mon)?.email || '')}"></div>
    <div class="grid2"><div class="field"><label>CPF</label><input name="cpf" data-mask="cpf" inputmode="numeric" placeholder="000.000.000-00" required value="${esc((one ? dr.resp : dr.mon)?.cpf || '')}"></div>
    <div class="field"><label>Telefone</label><input name="tel" data-mask="tel" inputmode="tel" placeholder="(00) 00000-0000" required value="${esc((one ? dr.resp : dr.mon)?.tel || '')}"></div></div>
    <div class="${one ? 'grid2' : ''}"><div class="field"><label>${one ? 'Senha' : 'Senha inicial'}</label><input name="senha" type="password" minlength="6" required autocomplete="new-password"><span class="hint">Mínimo de 6 caracteres.</span></div>
    ${one ? '<div class="field"><label>Repetir a senha</label><input name="senha2" type="password" required autocomplete="new-password"></div>' : ''}</div>
    <div class="row" style="gap:8px">${one ? '' : '<button type="button" class="btn" data-act="nav" data-v="cad1">Voltar</button>'}<button class="btn primary grow" style="min-height:50px">${one ? 'Continuar' : 'Concluir cadastro'}</button></div></form>
    <div class="links"><button class="link" data-act="nav" data-v="login">Já tenho cadastro</button></div>
    <p class="sub" style="margin-top:14px">Rotinas, medicações, exames e contatos de emergência são configurados depois do primeiro acesso, em “Configurações”.</p>`;
  } else if (s.view === 'esqueci') {
    body = `${brand}<h2>Esqueci a senha</h2><p class="lead">Informe seu CPF ou e-mail. Enviaremos um código para redefinir.</p>${err}
    <form data-form="esqueci"><div class="field"><label>CPF ou e-mail</label><input name="id" required></div><button class="btn primary block" style="min-height:50px">Enviar código</button></form>
    <div class="links"><button class="link" data-act="nav" data-v="login">Voltar ao login</button></div>`;
  } else if (s.view === 'codigo') {
    body = `${brand}<h2>Confira o código</h2><p class="lead">Mandamos um código de 6 dígitos para <b>${esc(s.target || '')}</b>.</p><div class="demo-fill" style="margin:0 0 14px">Protótipo: nenhum e-mail é enviado. Use o código <b>123456</b>.</div>${err}
    <form data-form="codigo"><div class="field"><label>Código</label><input name="codigo" inputmode="numeric" maxlength="6" required></div><button class="btn primary block" style="min-height:50px">Confirmar</button></form>
    <div class="links"><button class="link" data-act="nav" data-v="login">Cancelar</button></div>`;
  } else if (s.view === 'redefinir') {
    body = `${brand}<h2>Nova senha</h2><p class="lead">Escolha uma senha nova com pelo menos 6 caracteres.</p>${err}
    <form data-form="redefinir"><div class="field"><label>Nova senha</label><input name="senha" type="password" minlength="6" required autocomplete="new-password"></div><div class="field"><label>Repetir a nova senha</label><input name="senha2" type="password" required autocomplete="new-password"></div><button class="btn primary block" style="min-height:50px">Redefinir senha</button></form>`;
  }
  return `<div class="auth">${side}<div class="auth-form"><div class="auth-in">${body}</div></div></div>`;
}

/* ---------- peças de interface ---------- */
function pillFor(r) {
  const P = (t, c = '') => `<span class="pill ${c}">${t}</span>`;
  if (r.tipo === 'rotina') return { bem: P(ic('check') + ' Estou bem'), mal: P('Não estou bem', 'amber'), ajuda: P('Pediu ajuda', 'terra'), sem: P('Sem resposta', 'terra'), aberto: P('Aguardando', 'amber'), agendado: P('Agendado', 'grey'), perdido: P('—', 'grey') }[r.estado];
  if (r.tipo === 'med') { const t = r.t; return { tomada: t && t.atraso ? P('Tomada com atraso', 'amber') : P(ic('check') + ' Tomada às ' + (t ? fmt(t.em) : '')), aguardando: P('Aguardando', 'amber'), atrasada: P('Atrasada', 'terra'), agendado: P('Agendado', 'grey'), pendente: P('Não confirmada', 'terra') }[r.estado]; }
  return { realizado: P(ic('check') + ' Realizado'), aguardando: P('Aguardando', 'amber'), pendente: P('Não confirmado', 'terra'), agendado: P('Agendado', 'grey') }[r.estado];
}
const rowIc = { rotina: ['sun', ''], med: ['pill', 'blue'], exame: ['flask', 'amber'] };
function modalHtml(d) {
  const m = d.s.modal; if (!m) return '';
  let inner = '';
  if (m.kind === 'resolver') {
    const a = S.alerts.find(x => x.id === m.id); if (!a) return '';
    const sos = a.tipo === 'sos';
    inner = `<h3>${sos ? 'Encerrar emergência' : 'Registrar verificação'}</h3><p class="sub" style="margin:0 0 12px"><b>${esc(a.titulo)}</b> · ${a.hora}<br>${esc(a.detalhe)}</p>
    <form data-form="resolver" data-id="${a.id}"><div class="field"><label>O que você verificou? (opcional)</label><textarea name="nota" placeholder="Ex.: Liguei e está tudo bem."></textarea></div>
    <div class="acts"><button type="button" class="btn" data-act="closem">Cancelar</button><button class="btn primary">${sos ? 'Encerrar emergência' : 'Encerrar alerta'}</button></div></form>`;
  } else if (m.kind === 'apagar') {
    inner = `<h3>Apagar este item?</h3><p class="sub">O monitorado deixa de receber lembretes sobre ele. Esta ação fica registrada.</p><div class="acts"><button class="btn" data-act="closem">Cancelar</button><button class="btn danger" data-act="confirmdel" data-k="${m.k}" data-id="${m.id}">Apagar</button></div>`;
  } else {
    const F = FORMS[m.kind], it = m.id ? S.cfg[F.list].find(x => x.id === m.id) : {};
    inner = `<h3>${m.id ? 'Editar' : 'Novo'} · ${F.titulo}</h3><form data-form="item" data-kind="${m.kind}" data-id="${m.id || ''}">
    ${F.campos.map(([n, l, t]) => `<div class="field"><label>${l}</label>${t === 'textarea' ? `<textarea name="${n}">${esc(it[n] || '')}</textarea>` : `<input name="${n}" type="${t || 'text'}" value="${esc(it[n] || (n === 'data' ? TODAY : ''))}" ${n === 'nome' || n === 'hora' || n === 'tel' ? 'required' : ''}>`}</div>`).join('')}
    <div class="acts"><button type="button" class="btn" data-act="closem">Cancelar</button><button class="btn primary">Salvar</button></div></form>`;
  }
  return `<div class="modal-bg" data-act="bg"><div class="modal" role="dialog" aria-modal="true">${inner}</div></div>`;
}
const FORMS = {
  contato: { list: 'contatos', titulo: 'Contato de emergência', campos: [['nome', 'Nome'], ['tel', 'Telefone', 'tel']] },
  rotina: { list: 'rotina', titulo: 'Rotina diária', campos: [['nome', 'Nome do evento (ex.: Almoço)'], ['hora', 'Horário', 'time']] },
  med: { list: 'meds', titulo: 'Medicação', campos: [['nome', 'Nome do medicamento'], ['hora', 'Horário', 'time'], ['orient', 'Orientações', 'textarea']] },
  exame: { list: 'exames', titulo: 'Exame', campos: [['nome', 'Nome do exame'], ['data', 'Data', 'date'], ['hora', 'Horário', 'time'], ['local', 'Local'], ['orient', 'Orientações', 'textarea']] }
};

/* ---------- gráficos ---------- */
function vitalChart(from, keys, label) {
  const vs = S.vitals.filter(v => v.d >= from);
  if (!vs.length) return '<div class="empty">Sem medições no período.</div>';
  const W = 640, H = 214, pl = 34, pr = 10, pt = 12, pb = 26, days = []; for (let i = from; i <= TD; i++) days.push(i);
  const vals = vs.flatMap(v => keys.map(k => v[k.k]));
  let lo = Math.floor((Math.min(...vals, ...keys.map(k => k.min)) - 8) / 10) * 10, hi = Math.ceil((Math.max(...vals, ...keys.map(k => k.max)) + 8) / 10) * 10;
  const cw = (W - pl - pr) / days.length, X = v => pl + (v.d - from) * cw + cw * .14 + cw * .72 * (toMin(v.hora) / 1440), Y = y => pt + (H - pt - pb) * (1 - (y - lo) / (hi - lo));
  let g = '';
  for (let t = lo; t <= hi; t += (hi - lo) > 80 ? 20 : 10) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(t)}" y2="${Y(t)}" stroke="#E7DFCF"/><text x="${pl - 6}" y="${Y(t) + 4}" text-anchor="end">${t}</text>`;
  keys.forEach(k => { g += `<rect x="${pl}" y="${Y(k.max)}" width="${W - pl - pr}" height="${Y(k.min) - Y(k.max)}" fill="${k.color}" opacity=".09"/><line x1="${pl}" x2="${W - pr}" y1="${Y(k.max)}" y2="${Y(k.max)}" stroke="${k.color}" stroke-dasharray="4 4" opacity=".55"/><line x1="${pl}" x2="${W - pr}" y1="${Y(k.min)}" y2="${Y(k.min)}" stroke="${k.color}" stroke-dasharray="4 4" opacity=".55"/>`; });
  days.forEach((d, i) => g += `<text x="${pl + i * cw + cw / 2}" y="${H - 8}" text-anchor="middle">${WD[d]} ${8 + d}</text>`);
  keys.forEach(k => {
    g += `<polyline fill="none" stroke="${k.color}" stroke-width="2.2" stroke-linejoin="round" points="${vs.map(v => X(v) + ',' + Y(v[k.k])).join(' ')}"/>`;
    vs.forEach(v => { const out = v[k.k] > k.max || v[k.k] < k.min; g += `<circle cx="${X(v)}" cy="${Y(v[k.k])}" r="${out ? 6 : 4}" fill="${out ? '#B4432C' : k.color}" stroke="#fff" stroke-width="2"><title>${dayLabel(v.d)} ${v.hora}: ${v[k.k]}${out ? ' (fora do limite)' : ''}</title></circle>${out ? `<text x="${X(v)}" y="${Y(v[k.k]) - 10}" text-anchor="middle" style="fill:#8F3220;font-weight:700">${v[k.k]}</text>` : ''}`; });
  });
  return `<div class="legend">${keys.map(k => `<span><i style="background:${k.color}"></i>${k.name} · faixa ${k.min}–${k.max}</span>`).join('')}<span><i style="background:#B4432C"></i>fora do limite</span></div><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${g}</svg>`;
}
function wakeChart(from) {
  const W = 640, H = 150, pl = 40, pr = 10, pt = 18, pb = 24, days = []; for (let i = from; i <= TD; i++) days.push(i);
  const lo = 6 * 60, hi = 9 * 60, cw = (W - pl - pr) / days.length, Y = m => pt + (H - pt - pb) * ((Math.min(Math.max(m, lo), hi) - lo) / (hi - lo));
  const exp = S.cfg.rotina.find(r => r.id === 1); let g = '';
  [6, 7, 8, 9].forEach(h => g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(h * 60)}" y2="${Y(h * 60)}" stroke="#E7DFCF"/><text x="${pl - 6}" y="${Y(h * 60) + 4}" text-anchor="end">${h}h</text>`);
  if (exp) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(toMin(exp.hora))}" y2="${Y(toMin(exp.hora))}" stroke="#47735D" stroke-dasharray="4 4"/>`;
  days.forEach((d, i) => {
    const c = S.checkins.find(x => x.d === d && x.rotinaId === 1 && x.respondidoEm != null), cx = pl + i * cw + cw / 2;
    g += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${WD[d]} ${8 + d}</text>`;
    if (c) g += `<line x1="${cx}" x2="${cx}" y1="${Y(lo)}" y2="${Y(c.respondidoEm)}" stroke="#bcd2c3" stroke-width="3"/><circle cx="${cx}" cy="${Y(c.respondidoEm)}" r="5" fill="#47735D" stroke="#fff" stroke-width="2"/><text x="${cx}" y="${Y(c.respondidoEm) - 9}" text-anchor="middle" style="fill:#335644;font-weight:700">${fmt(c.respondidoEm)}</text>`;
    else g += `<text x="${cx}" y="${Y(lo) + 14}" text-anchor="middle">—</text>`;
  });
  return `<div class="legend"><span><i style="background:#47735D"></i>horário em que respondeu “Acordar” · linha tracejada = horário da rotina</span></div><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Horários em que o monitorado acordou">${g}</svg>`;
}
function medGrid(from) {
  let h = `<div class="mgrid"><span></span>${S.cfg.meds.map(m => `<span class="sub" style="font-weight:700;font-size:12px">${esc(m.nome.split(' ')[0])}<br>${m.hora}</span>`).join('')}`;
  for (let d = TD; d >= from; d--) {
    h += `<span class="d">${dayLabel(d)}</span>`;
    S.cfg.meds.forEach(m => {
      const t = S.medTakes.find(x => x.d === d && x.medId === m.id);
      if (!t || t.status === 'aguardando') h += `<span class="mdot wait">${d === TD ? 'a vir' : '—'}</span>`;
      else if (t.status === 'tomada') h += `<span class="mdot ${t.atraso ? 'late' : ''}">${fmt(t.em)}${t.atraso ? ' ⏱' : ''}</span>`;
      else h += `<span class="mdot miss">${t.status === 'atrasada' ? 'atrasada' : 'não confirmou'}</span>`;
    });
  }
  return h + '</div><div class="legend" style="margin-top:10px"><span><i style="background:#DDE9E0"></i>tomada no prazo</span><span><i style="background:#F7E8C8"></i>tomada com atraso</span><span><i style="background:#F5DAD2"></i>não confirmada</span></div>';
}

/* ---------- painel do responsável ---------- */
function respApp(d) {
  const s = d.s, tab = s.tab || 'status', st = statusOf(), n = openAlerts().length, mon = S.users.mon;
  const nav = [['status', 'home', 'Status'], ['verificar', 'send', 'Verificar'], ['historico', 'chart', 'Histórico'], ['relatorio', 'file', 'Relatório'], ['config', 'sliders', 'Configurar']];
  const titles = { status: ['Status de ' + first(mon.nome), 'Situação atual, alertas abertos e o dia de hoje.'], verificar: ['Verificar agora', 'Peça uma resposta ao monitorado com uma mensagem pronta.'], historico: ['Histórico', 'Últimos dias: sono, pressão, batimentos, remédios e alertas.'], relatorio: ['Relatório semanal', 'Resumo de 8 a 14 de novembro.'], config: ['Configurações de cadastro', 'O que você muda aqui aparece na hora no celular do monitorado.'] };
  const sos = openAlerts().find(a => a.tipo === 'sos');
  const emerg = sos ? `<div class="emerg" role="alert">${ic('warn')}<span>SOS acionado às ${sos.hora}: ${esc(mon.nome)} precisa de ajuda.</span><button class="btn sm" data-act="ligar">Ligar agora</button><button class="btn sm" data-act="resolver" data-id="${sos.id}">Encerrar</button></div>` : '';
  return `<div class="rapp"><aside class="rnav"><div class="who"><b>${esc(S.users.resp.nome)}</b><span class="sub">Responsável por ${esc(first(mon.nome))}</span></div>
  ${nav.map(([k, i, l]) => `<button class="ni ${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${ic(i)}<span>${l}</span>${k === 'status' && n ? `<span class="n">${n}</span>` : ''}</button>`).join('')}
  <div class="foot"><button class="ni" data-act="logout" style="width:100%">${ic('out')}<span>Sair</span></button></div></aside>
  <main class="rmain">${emerg}<div class="rtitle"><h2>${titles[tab][0]}</h2><p class="sub" style="margin:4px 0 0">${titles[tab][1]}</p></div><div class="rbody">${rPage(d, tab, st)}</div></main></div>${modalHtml(d)}`;
}
function rPage(d, tab, st) {
  const mon = S.users.mon;
  if (tab === 'status') {
    const lc = lastContact(), al = openAlerts(), lv = [...S.vitals].reverse()[0], rows = agendaHoje(), nx = proximoItem();
    return `<div class="hero ${stClass[st]}"><div class="big">${ic(st === 'ok' ? 'checkc' : 'warn')}</div><div><span class="sub" style="font-weight:700">${esc(mon.nome)}</span><h3>${stLabel[st]}</h3><div class="sub" style="color:inherit;opacity:.85;margin-top:4px">${stText[st]}</div></div>
    <div class="row wrap" style="justify-content:flex-end"><button class="btn" data-act="tab" data-t="verificar">${ic('send')} Verificar</button><button class="btn" data-act="ligar">${ic('phone')} Ligar</button></div></div>
    <div class="tiles" style="margin-top:14px"><div class="tile"><small>Último contato</small><b style="font-size:24px">${lc ? fmt(lc.c.respondidoEm) : '—'}</b><span>${lc ? lc.txt + ' · ' + esc(lc.c.evento) : 'Nenhuma resposta hoje ainda'}</span></div>
    <div class="tile"><small>Próximo da agenda</small><b style="font-size:24px">${nx ? nx.hora : '—'}</b><span>${nx ? esc(nx.nome) : 'Nada mais por hoje'}</span></div>
    <div class="tile"><small>Última medição</small><b style="font-size:24px">${lv ? lv.sis + '/' + lv.dia : '—'}</b><span>${lv ? `${lv.fc} bpm · ${dayLabel(lv.d)} ${lv.hora}` : 'Sem medições'}</span></div></div>
    <div class="two" style="margin-top:14px"><div class="card"><h3>Alertas abertos</h3><p class="sub" style="margin:0 0 10px">Registre a verificação para encerrar o alerta.</p>
    ${al.length ? al.map(a => `<div class="alert-i ${a.prio === 'critica' ? 'crit' : a.prio === 'alta' ? 'alta' : ''}"><span class="badge ${a.prio === 'media' ? 'amber' : 'terra'}">${ic(ALERT_ICON[a.tipo])}</span><div class="grow"><b>${esc(a.titulo)}</b> <span class="sub">· ${a.hora}</span><div class="sub" style="color:#4b483f">${esc(a.detalhe)}</div><div class="row wrap" style="margin-top:8px;gap:6px"><button class="btn sm primary" data-act="resolver" data-id="${a.id}">${a.tipo === 'sos' ? 'Encerrar emergência' : 'Registrar verificação'}</button><button class="btn sm" data-act="ligar">${ic('phone')} Ligar</button></div></div></div>`).join('') : `<div class="empty">${ic('checkc')}<br>Nenhum alerta aberto.</div>`}</div>
    <div class="card"><h3>Hoje</h3><p class="sub" style="margin:0 0 6px">Rotina, remédios e exames.</p>${rows.map(r => `<div class="lrow"><span class="time">${r.hora}</span><span class="badge ${rowIc[r.tipo][1]}">${ic(rowIc[r.tipo][0])}</span><div class="grow t">${esc(r.nome)}</div>${pillFor(r)}</div>`).join('')}</div></div>`;
  }
  if (tab === 'verificar') {
    const vs = today(S.checkins).filter(c => c.tipo === 'verificacao').reverse(), sel = d.s.preset ?? 0;
    return `<div class="two"><div class="card"><h3>Mensagem</h3><p class="sub" style="margin:0 0 12px">${esc(first(mon.nome))} recebe uma notificação com som no celular.</p>
    <form data-form="verificar">${PRESETS.map((p, i) => `<label class="radio"><input type="radio" name="preset" value="${i}" ${i === sel ? 'checked' : ''}>${esc(p)}</label>`).join('')}
    <button class="btn primary block" style="margin-top:6px;min-height:48px">${ic('send')} Enviar verificação</button></form>
    <p class="sub" style="margin-top:12px">Sem resposta em ${S.cfg.timeout} minutos, o status muda para <b>Pendente</b> e você é avisado.</p></div>
    <div class="card"><h3>Verificações de hoje</h3>${vs.length ? vs.map(c => `<div class="lrow"><span class="time">${c.hora}</span><div class="grow"><div class="t">${esc(c.texto)}</div><div class="sub">${c.estado === 'aberto' ? 'Aguardando resposta' : c.estado === 'sem' ? 'Sem resposta no prazo' : 'Respondeu às ' + fmt(c.respondidoEm)}</div></div>${{ aberto: '<span class="pill amber">Aguardando</span>', sem: '<span class="pill terra">Sem resposta</span>', bem: '<span class="pill">Estou bem</span>', mal: '<span class="pill amber">Não estou bem</span>', ajuda: '<span class="pill terra">Preciso de ajuda</span>' }[c.estado]}</div>`).join('') : '<div class="empty">Nenhuma verificação enviada hoje.</div>'}</div></div>`;
  }
  if (tab === 'historico') {
    const per = d.s.per || 7, from = TD - per + 1, L = S.cfg.lim, al = S.alerts.filter(a => a.d >= from);
    return `<div class="chips" role="group"><button class="${per === 3 ? 'on' : ''}" data-act="per" data-p="3">Últimos 3 dias</button><button class="${per === 7 ? 'on' : ''}" data-act="per" data-p="7">Últimos 7 dias</button></div>
    <div class="card"><h3>Pressão arterial (mmHg)</h3>${vitalChart(from, [{ k: 'sis', name: 'Sistólica', color: '#3F6D8C', min: L.sisMin, max: L.sisMax }, { k: 'dia', name: 'Diastólica', color: '#47735D', min: L.diaMin, max: L.diaMax }], 'Pressão arterial no período')}</div>
    <div class="card"><h3>Frequência cardíaca (bpm)</h3>${vitalChart(from, [{ k: 'fc', name: 'Batimentos', color: '#B8780F', min: L.fcMin, max: L.fcMax }], 'Frequência cardíaca no período')}</div>
    <div class="two"><div class="card"><h3>Horário em que acordou</h3>${wakeChart(from)}</div><div class="card"><h3>Medicações</h3>${medGrid(from)}</div></div>
    <div class="card"><h3>Alertas do período</h3><p class="sub" style="margin:0 0 8px">${al.length} no total.</p>${al.length ? [...al].sort((a, b) => b.d - a.d || toMin(b.hora) - toMin(a.hora)).map(a => `<div class="lrow"><span class="badge ${a.prio === 'media' ? 'amber' : 'terra'}">${ic(ALERT_ICON[a.tipo])}</span><div class="grow"><div class="t">${esc(a.titulo)}</div><div class="sub">${dayLabel(a.d)} · ${a.hora} · ${esc(a.detalhe)}${a.nota ? '<br><i>Nota: ' + esc(a.nota) + '</i>' : ''}</div></div>${a.aberto ? '<span class="pill terra">Aberto</span>' : '<span class="pill grey">Resolvido ' + a.resolvidoEm + '</span>'}</div>`).join('') : '<div class="empty">Sem alertas.</div>'}</div>`;
  }
  if (tab === 'relatorio') {
    const r = relatorio(0), mx = Math.max(1, ...Object.values(r.porTipo));
    return `<div class="tiles"><div class="tile"><small>Check-ins respondidos</small><b>${r.feitos}<span style="font-size:15px"> de ${r.total}</span></b><span>${r.sem} sem resposta</span></div>
    <div class="tile"><small>Adesão aos check-ins</small><b>${r.adesao}%</b><span>respondidos no prazo</span></div>
    <div class="tile"><small>Alertas gerados</small><b>${r.alertas.length}</b><span>${r.alertas.filter(a => a.aberto).length} aberto(s)</span></div>
    <div class="tile"><small>Emergências (SOS)</small><b>${r.sos}</b><span>acionamentos na semana</span></div></div>
    <div class="two" style="margin-top:14px"><div class="card"><h3>Alertas por tipo</h3><div class="bars" style="margin-top:12px">${Object.keys(ALERT_T).filter(k => r.porTipo[k]).map(k => `<div class="bar-r"><span>${ALERT_T[k]}</span><i><u style="width:${r.porTipo[k] / mx * 100}%;background:${k === 'sos' ? '#B4432C' : k === 'vital' ? '#B8780F' : '#47735D'}"></u></i><b>${r.porTipo[k]}</b></div>`).join('') || '<div class="empty">Sem alertas.</div>'}</div></div>
    <div class="card"><h3>Medicações e exames</h3><div class="bars" style="margin-top:12px"><div class="bar-r"><span>Medicações confirmadas</span><i><u style="width:${r.medTotal ? r.medOk / r.medTotal * 100 : 0}%"></u></i><b>${r.medOk}</b></div><div class="bar-r"><span>Medicações pendentes</span><i><u style="width:${r.medTotal ? r.medPend / r.medTotal * 100 : 0}%;background:#B4432C"></u></i><b>${r.medPend}</b></div><div class="bar-r"><span>Exames realizados</span><i><u style="width:${(r.exOk + r.exPend) ? r.exOk / (r.exOk + r.exPend) * 100 : 0}%"></u></i><b>${r.exOk}</b></div><div class="bar-r"><span>Exames pendentes</span><i><u style="width:${(r.exOk + r.exPend) ? r.exPend / (r.exOk + r.exPend) * 100 : 0}%;background:#B4432C"></u></i><b>${r.exPend}</b></div></div></div></div>
    <div class="two" style="margin-top:14px"><div class="card"><h3>Sinais vitais</h3><div class="tiles" style="margin-top:10px"><div class="tile"><small>Pressão média</small><b style="font-size:24px">${r.sis ? r.sis + '/' + r.dia : '—'}</b><span>${r.vs.length} medições</span></div><div class="tile"><small>Frequência média</small><b style="font-size:24px">${r.fc ?? '—'}</b><span>bpm · ${r.vForaDoLimite} fora do limite</span></div></div></div>
    <div class="card"><h3>Ocorrências</h3><p class="sub" style="margin:0 0 6px">Situações em que você precisou intervir.</p>${r.ocorr.length ? [...r.ocorr].sort((a, b) => b.d - a.d).slice(0, 5).map(a => `<div class="lrow"><div class="grow"><div class="t">${esc(a.titulo)} <span class="sub">· ${dayLabel(a.d)} ${a.hora}</span></div><div class="sub">${esc(a.nota)}</div></div></div>`).join('') : '<div class="empty">Nenhuma ocorrência.</div>'}</div></div>`;
  }
  /* config */
  const ct = d.s.cfgTab || 'contatos', L = S.cfg.lim;
  const tabs = [['contatos', 'Contatos'], ['rotina', 'Rotina'], ['meds', 'Medicações'], ['exames', 'Exames'], ['limites', 'Limites e prazos'], ['conta', 'Conta e segurança']];
  const def = {
    contatos: { k: 'contato', ico: 'phone', t: 'Contatos de emergência', row: c => [c.nome, c.tel, ''] },
    rotina: { k: 'rotina', ico: 'sun', t: 'Rotina diária', row: r => [r.nome, 'Check-in automático', r.hora] },
    meds: { k: 'med', ico: 'pill', t: 'Medicações', row: m => [m.nome, m.orient, m.hora] },
    exames: { k: 'exame', ico: 'flask', t: 'Exames', row: e => [e.nome, `${dfmt(e.data)} · ${e.local}${e.orient ? ' · ' + e.orient : ''}`, e.hora] }
  };
  let body = '';
  if (def[ct]) {
    const D = def[ct], list = [...S.cfg[ct]]; if (ct !== 'contatos') list.sort((a, b) => toMin(a.hora) - toMin(b.hora));
    body = `<div class="card"><div class="row between wrap"><h3>${D.t}</h3><button class="btn primary sm" data-act="modal" data-k="${D.k}">${ic('plus')} Adicionar</button></div>
    ${list.length ? list.map(it => { const [t, sb, tm] = D.row(it); return `<div class="lrow">${tm ? `<span class="time">${tm}</span>` : ''}<span class="badge ${ct === 'meds' ? 'blue' : ct === 'exames' ? 'amber' : ''}">${ic(D.ico)}</span><div class="grow"><div class="t">${esc(t)}</div><div class="sub">${esc(sb)}</div></div><button class="btn icon sm" aria-label="Editar ${esc(t)}" data-act="modal" data-k="${D.k}" data-id="${it.id}">${ic('edit')}</button><button class="btn icon sm" aria-label="Apagar ${esc(t)}" data-act="apagar" data-k="${D.k}" data-id="${it.id}">${ic('trash')}</button></div>`; }).join('') : '<div class="empty">Nada cadastrado ainda.</div>'}</div>`;
  } else if (ct === 'limites') {
    body = `<div class="card"><h3>Limites de sinais vitais</h3><p class="sub" style="margin:0 0 12px">Medições fora dessas faixas geram alerta imediato.</p><form data-form="limites"><div class="limits">
    ${[['sisMin', 'Sistólica mínima'], ['sisMax', 'Sistólica máxima'], ['diaMin', 'Diastólica mínima'], ['diaMax', 'Diastólica máxima'], ['fcMin', 'Batimentos mínimo'], ['fcMax', 'Batimentos máximo']].map(([k, l]) => `<div class="field"><label>${l}</label><input name="${k}" type="number" value="${L[k]}" required></div>`).join('')}</div>
    <div class="field" style="max-width:260px"><label>Tempo para responder ao check-in</label><select name="timeout">${[3, 5, 10, 15].map(m => `<option value="${m}" ${S.cfg.timeout === m ? 'selected' : ''}>${m} minutos</option>`).join('')}</select><span class="hint">Depois disso o status vira Pendente.</span></div>
    <button class="btn primary">Salvar limites</button></form></div>`;
  } else {
    const u = S.users;
    body = `<div class="two"><div class="card"><h3>Dados do cadastro</h3>${[['Responsável', u.resp], ['Monitorado', u.mon]].map(([l, x]) => `<div style="margin-top:12px"><span class="pill grey">${l}</span><div class="t" style="margin-top:6px;font-weight:600">${esc(x.nome)}</div><div class="sub">${esc(x.email)} · CPF ${esc(x.cpf)}<br>${esc(x.tel)}</div></div>`).join('')}</div>
    <div class="card"><h3>Segurança e privacidade</h3><div class="lrow"><span class="badge">${ic('lock')}</span><div class="grow sub">Senhas armazenadas com proteção (criptografia) na versão real.</div></div><div class="lrow"><span class="badge">${ic('user')}</span><div class="grow sub">Cada perfil vê só o que pode: o monitorado não acessa cadastro, histórico nem relatórios.</div></div><div class="lrow"><span class="badge">${ic('shield')}</span><div class="grow sub">Dados do monitorado visíveis só a usuários autorizados.</div></div></div></div>
    <div class="card" style="margin-top:14px"><h3>Registro de ações</h3><p class="sub" style="margin:0 0 6px">Quem mudou o quê, e quando.</p>${S.log.slice(0, 8).map(l => `<div class="lrow"><div class="grow"><div class="t" style="font-weight:600">${esc(l.txt)}</div><div class="sub">${esc(l.quem)} · ${l.t}</div></div></div>`).join('')}</div>`;
  }
  return `<div class="chips" role="tablist">${tabs.map(([k, l]) => `<button class="${ct === k ? 'on' : ''}" data-act="cfgtab" data-t="${k}">${l}</button>`).join('')}</div>${body}`;
}

/* ---------- celular do monitorado ---------- */
function monApp(d) {
  const s = d.s, tab = s.tab || 'inicio', u = S.users.mon, pend = monPend(), h = Math.floor(S.min / 60);
  const greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const banner = pend.find(p => p.k === 'checkin') || pend[0];
  let page = '';
  if (tab === 'inicio') {
    const nx = proximoItem(), tot = agendaHoje().filter(r => r.tipo !== 'rotina'), done = tot.filter(r => ['tomada', 'realizado'].includes(r.estado)).length;
    page = `<div class="mcard"><div class="sub" style="font-weight:700">Agora</div><div class="bigclock" data-clock>${fmt(S.min)}</div><div class="sub" style="margin-top:6px">Sábado, 14 de novembro</div></div>
    ${pend.length ? pend.map(p => `<div class="mcard" style="border:2px solid #e0c183;background:#FFF7E3"><div class="row"><span class="badge amber">${ic(p.k === 'checkin' ? 'bell' : p.k === 'med' ? 'pill' : 'flask')}</span><div class="grow"><h3>${esc(p.titulo)}</h3><div class="sub">${esc(p.sub)}</div></div></div><button class="mbtn ok" style="margin-top:12px" data-act="${p.k === 'checkin' ? 'openchk' : 'mtab'}" data-id="${p.id}" data-t="lembretes">${p.k === 'checkin' ? 'Responder agora' : p.k === 'med' ? 'Confirmar remédio' : 'Confirmar exame'}</button></div>`).join('') : `<div class="mcard"><div class="row"><span class="badge">${ic('checkc')}</span><div class="grow"><h3>Tudo certo por agora</h3><div class="sub">Nenhuma resposta pendente.</div></div></div></div>`}
    <div class="mcard"><div class="sub" style="font-weight:700">Próximo da sua rotina</div><h3 style="margin-top:4px">${nx ? esc(nx.nome) : 'Nada mais por hoje'}</h3><div class="sub">${nx ? 'às ' + nx.hora : 'Bom descanso.'}</div></div>
    <div class="mcard"><div class="row between"><div><h3>Lembretes de hoje</h3><div class="sub">${done} de ${tot.length} confirmados</div></div><button class="btn" data-act="mtab" data-t="lembretes">Ver</button></div></div>`;
  } else if (tab === 'lembretes') {
    const rows = agendaHoje();
    const box = r => {
      const due = toMin(r.hora) <= S.min, can = (r.tipo === 'med' && ['aguardando', 'atrasada'].includes(r.estado)) || (r.tipo === 'exame' && r.estado === 'aguardando');
      return `<div class="mcard"><div class="row"><span class="badge ${rowIc[r.tipo][1]}">${ic(rowIc[r.tipo][0])}</span><div class="grow"><h3>${esc(r.nome)}</h3><div class="sub">${r.hora}${r.local ? ' · ' + esc(r.local) : ''}</div></div>${pillFor(r)}</div>${r.orient ? `<p style="margin:10px 0 0;font-size:16px;color:#3d3a33">${esc(r.orient)}</p>` : ''}${can ? `<button class="mbtn ok" style="margin-top:12px" data-act="${r.tipo === 'med' ? 'confmed' : 'confex'}" data-id="${r.t.id}">${ic('check')} ${r.tipo === 'med' ? 'Já tomei' : 'Já fiz o exame'}</button>` : ''}${!can && !due && r.tipo !== 'rotina' ? `<div class="sub" style="margin-top:8px">O botão aparece na hora marcada.</div>` : ''}</div>`;
    };
    page = `<h3 style="margin:6px 4px 10px">Remédios e exames</h3>${rows.filter(r => r.tipo !== 'rotina').map(box).join('') || '<div class="mcard">Nada para hoje.</div>'}
    <h3 style="margin:18px 4px 10px">Rotina de hoje</h3><div class="mcard">${rows.filter(r => r.tipo === 'rotina').map(r => `<div class="lrow"><span class="time">${r.hora}</span><div class="grow t">${esc(r.nome)}</div></div>`).join('')}</div>`;
  } else {
    const vt = today(S.vitals).reverse();
    page = `<div class="mcard"><h3>Registrar sinais vitais</h3><p class="sub" style="margin:4px 0 14px">Meça e digite os números.</p><form data-form="vital"><div class="stepper">
    <div class="field"><label>Pressão alta</label><input name="sis" type="number" inputmode="numeric" min="50" max="260" value="120" required></div>
    <div class="field"><label>Pressão baixa</label><input name="dia" type="number" inputmode="numeric" min="30" max="160" value="80" required></div>
    <div class="field"><label>Batimentos</label><input name="fc" type="number" inputmode="numeric" min="30" max="220" value="72" required></div></div>
    <button class="mbtn ok" style="margin-top:14px">${ic('activity')} Registrar</button></form></div>
    ${s.vitalMsg ? `<div class="mcard" style="background:${s.vitalMsg.fora ? '#FFF7E3' : '#EEF4EF'}"><b>${s.vitalMsg.fora ? 'Registrado. Avisamos sua família para acompanhar.' : 'Registrado. Está dentro do esperado.'}</b></div>` : ''}
    <div class="mcard"><h3>Hoje</h3>${vt.length ? vt.map(v => `<div class="lrow"><span class="time">${v.hora}</span><div class="grow t">${v.sis}/${v.dia} · ${v.fc} bpm</div></div>`).join('') : '<div class="sub" style="margin-top:6px">Nenhuma medição hoje.</div>'}</div>`;
  }
  const titles = { inicio: [greet + ',', first(u.nome)], lembretes: ['Lembretes', 'do dia'], sinais: ['Sinais', 'vitais'] };
  const t = titles[tab] || titles.inicio;
  let over = '';
  if (s.screen === 'checkin') over = checkinScreen(d);
  if (s.sheet === 'sos') over += sosSheet();
  if (s.screen === 'sosdone') over += `<div class="mfull"><div class="center"><span class="badge terra" style="width:64px;height:64px">${ic('shield', '')}</span><h2>Sua família foi avisada.</h2><p style="font-size:19px;margin:0 0 6px">${esc(first(S.users.resp.nome))} recebeu o alerta às ${s.sosAt}. Fique calmo e, se puder, fique onde está.</p></div><button class="mbtn soft" data-act="home">Voltar ao início</button></div>`;
  if (s.call) over += `<div class="call"><span class="avatar">${ic('phone')}</span><h2 style="color:#fff;font-size:30px">Chamando ${esc(s.call)}…</h2><p style="opacity:.8;max-width:260px">Simulação do protótipo: nenhuma ligação real é feita.</p><button class="mbtn bad" style="margin-top:20px;max-width:280px" data-act="endcall">Encerrar chamada</button></div>`;
  return `<div class="mapp">${banner && s.screen !== 'checkin' && tab !== 'inicio' ? `<button class="notif ${banner.k === 'checkin' ? '' : 'med'}" data-act="${banner.k === 'checkin' ? 'openchk' : 'mtab'}" data-id="${banner.id}" data-t="lembretes"><span class="badge">${ic('bell')}</span><span class="grow"><b>${esc(banner.titulo)}</b><span>${esc(banner.sub)}</span></span>${ic('chev')}</button>` : ''}
  <div class="mtop"><small>${t[0]}</small><h2>${esc(t[1])}</h2></div><div class="mbody">${page}</div>
  <nav class="mnav" aria-label="Menu">${[['inicio', 'home', 'Início'], ['lembretes', 'list', 'Lembretes'], ['sinais', 'activity', 'Sinais']].map(([k, i, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="mtab" data-t="${k}">${ic(i)}${l}${k === 'lembretes' && pend.filter(p => p.k !== 'checkin').length ? `<span class="n">${pend.filter(p => p.k !== 'checkin').length}</span>` : ''}</button>`).join('')}<button class="sos" data-act="sos">${ic('warn')}SOS</button></nav>${over}</div>`;
}
function checkinScreen(d) {
  const c = S.checkins.find(x => x.id === d.s.chk), done = d.s.chkDone;
  if (!c) return '';
  if (done) {
    const w = { bem: ['Que bom!', 'Resposta registrada. Obrigado.'], mal: ['Obrigado por avisar.', 'Sua família foi avisada para falar com você.'], ajuda: ['Ajuda a caminho.', 'Sua família foi avisada com urgência.'] }[done];
    return `<div class="mfull"><div class="center"><span class="badge ${done === 'bem' ? '' : done === 'mal' ? 'amber' : 'terra'}" style="width:64px;height:64px">${ic(done === 'bem' ? 'checkc' : 'heart')}</span><h2>${w[0]}</h2><p style="font-size:19px;margin:0">${w[1]}</p><p class="sub" style="margin-top:10px">Registrado às ${fmt(c.respondidoEm)}.</p></div><button class="mbtn soft" data-act="home">Voltar ao início</button></div>`;
  }
  if (c.estado === 'sem') return `<div class="mfull"><div class="center"><span class="badge amber" style="width:64px;height:64px">${ic('clock')}</span><h2>O tempo acabou.</h2><p style="font-size:19px;margin:0">Seu responsável foi avisado. Se estiver tudo bem, ligue ou fale com ele.</p></div><button class="mbtn soft" data-act="home">Voltar ao início</button></div>`;
  const left = Math.max(0, c.prazo - S.min);
  return `<div class="mfull"><div class="row between"><span class="countdown">${ic('clock')} Responda em até ${left} min</span><button class="btn icon" aria-label="Fechar" data-act="home">${ic('x')}</button></div>
  <div class="center"><span class="sub" style="font-weight:700;font-size:15px">${c.tipo === 'verificacao' ? 'Mensagem da sua família' : 'Check-in · ' + esc(c.evento)}</span><h2>${c.tipo === 'verificacao' ? esc(c.texto) : 'Como você está agora?'}</h2></div>
  <button class="mbtn ok" data-act="resp" data-e="bem" data-id="${c.id}">${ic('checkc')} Estou bem</button><button class="mbtn mid" data-act="resp" data-e="mal" data-id="${c.id}">${ic('heart')} Não estou bem</button><button class="mbtn bad" data-act="resp" data-e="ajuda" data-id="${c.id}">${ic('warn')} Preciso de ajuda</button></div>`;
}
function sosSheet() {
  return `<div class="sheet-bg" data-act="bg"><div class="sheet" role="dialog" aria-modal="true"><div class="row between"><h2 style="font-size:28px">Precisa de ajuda?</h2><button class="btn icon" aria-label="Fechar" data-act="closesos">${ic('x')}</button></div><p class="sub" style="font-size:15px;margin:6px 0 14px">Use só em emergência. Escolha quem chamar:</p>
  <button class="mbtn bad" data-act="sosopt" data-o="Responsável">${ic('bell')} Avisar ${esc(first(S.users.resp.nome))}</button><button class="mbtn soft" data-act="sosopt" data-o="Polícia (190)" data-call="Polícia (190)">${ic('phone')} Ligar 190 · Polícia</button><button class="mbtn soft" data-act="sosopt" data-o="SAMU (192)" data-call="SAMU (192)">${ic('phone')} Ligar 192 · SAMU</button></div></div>`;
}

/* ---------- eventos ---------- */
function devOf(t) { const sc = t.closest('.screen'); return sc ? dev[sc.id.replace('dev-', '')] : null; }
function loginAs(d, role) { d.s = { view: 'login', role, user: role, tab: role === 'resp' ? 'status' : 'inicio' }; }

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, d = devOf(t), D = t.dataset;
  if (a === 'bg') { if (e.target !== t) return; if (d.s.modal) d.s.modal = null; if (d.s.sheet) d.s.sheet = null; return render(); }
  switch (a) {
    /* barra */
    case 'demo': { const p=$('#demo'); p.hidden=!p.hidden; t.setAttribute('aria-expanded',String(!p.hidden)); return; }
    case 'play': S.play = !S.play; return render();
    case 'adv': advance(+D.m); return;
    case 'next': if (!nextEvent()) say(dev.desk, 'Sem mais eventos hoje.', 'amber'); return render();
    case 'sound': S.sound = !S.sound; if (S.sound) beep('checkin'); return render();
    case 'reset': S = seed(); dev.phone.s = { view: 'login', role: 'mon' }; dev.desk.s = { view: 'login', role: 'resp' }; dev.phone.toast = dev.desk.toast = null; return render();
    case 'skiplogin': loginAs(dev.phone, 'mon'); loginAs(dev.desk, 'resp'); return render();
    case 'view': $('#stage').dataset.view = D.v; document.querySelectorAll('.switch button').forEach(b => b.classList.toggle('on', b.dataset.v === D.v)); return;
    /* auth */
    case 'role': d.s.role = D.role; d.s.err = null; return render();
    case 'nav': d.s.view = D.v; d.s.err = null; d.s.ok = null; return render();
    case 'togglepw': d.s.showpw = !d.s.showpw; return render();
    case 'demofill': { const u = S.users[d.s.role], f = d.el; f.querySelector('[name=id]').value = u.email; f.querySelector('[name=senha]').value = u.senha; return; }
    case 'logout': d.s = { view: 'login', role: d.id === 'phone' ? 'mon' : 'resp' }; return render();
    /* responsável */
    case 'tab': d.s.tab = D.t; return render();
    case 'cfgtab': d.s.cfgTab = D.t; return render();
    case 'per': d.s.per = +D.p; return render();
    case 'ligar': say(d, 'Ligando para ' + S.users.mon.nome + '… (simulação)', 'sage'); return render();
    case 'resolver': d.s.modal = { kind: 'resolver', id: +D.id }; return render();
    case 'modal': d.s.modal = { kind: D.k, id: D.id ? +D.id : null }; return render();
    case 'apagar': d.s.modal = { kind: 'apagar', k: D.k, id: +D.id }; return render();
    case 'closem': d.s.modal = null; return render();
    case 'confirmdel': { const F = FORMS[D.k], it = S.cfg[F.list].find(x => x.id === +D.id); S.cfg[F.list] = S.cfg[F.list].filter(x => x.id !== +D.id); addLog(first(S.users.resp.nome), `Apagou ${F.titulo.toLowerCase()}: ${it ? it.nome : ''}.`); d.s.modal = null; say(d, 'Item apagado. O celular já foi atualizado.'); return render(); }
    /* monitorado */
    case 'mtab': d.s.tab = D.t; d.s.screen = null; d.s.vitalMsg = null; return render();
    case 'home': d.s.screen = null; d.s.chkDone = null; d.s.tab = 'inicio'; return render();
    case 'openchk': d.s.screen = 'checkin'; d.s.chk = +D.id; d.s.chkDone = null; return render();
    case 'resp': respondCheckin(+D.id, D.e); d.s.chkDone = D.e; return render();
    case 'confmed': confirmMed(+D.id); return;
    case 'confex': confirmExame(+D.id); return;
    case 'sos': d.s.sheet = 'sos'; return render();
    case 'closesos': d.s.sheet = null; return render();
    case 'sosopt': d.s.sheet = null; triggerSOS(D.o); if (D.call) d.s.call = D.call; else { d.s.screen = 'sosdone'; d.s.sosAt = fmt(S.min); } d.s.callOpt = D.call; return render();
    case 'endcall': d.s.call = null; d.s.screen = 'sosdone'; d.s.sosAt = fmt(S.min); return render();
  }
});

document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const d = devOf(f), fd = Object.fromEntries(new FormData(f)), s = d.s, k = f.dataset.form;
  const bad = (m) => { s.err = m; render(); };
  const emailOk = v => /^\S+@\S+\.\S+$/.test(v);
  if (k === 'login') {
    const u = S.users[s.role], id = (fd.id || '').trim().toLowerCase();
    const ok = u && (id === u.email.toLowerCase() || (digits(id).length === 11 && digits(id) === digits(u.cpf))) && fd.senha === u.senha;
    if (!ok) return bad('CPF/e-mail ou senha incorretos. Confira e tente de novo.');
    if (s.role === 'resp') addLog(first(u.nome), 'Entrou no painel.');
    return loginAs(d, s.role), render();
  }
  if (k === 'cad1' || k === 'cad2') {
    const one = k === 'cad1';
    if (fd.nome.trim().length < 3) return bad('Digite o nome completo.');
    if (!emailOk(fd.email)) return bad('Digite um e-mail válido.');
    if (digits(fd.cpf).length !== 11) return bad('O CPF precisa ter 11 números.');
    if (digits(fd.tel).length < 10) return bad('Digite o telefone com DDD.');
    if ((fd.senha || '').length < 6) return bad('A senha precisa de pelo menos 6 caracteres.');
    if (one && fd.senha !== fd.senha2) return bad('As senhas não conferem.');
    s.draft = s.draft || {}; s.draft[one ? 'resp' : 'mon'] = { nome: fd.nome.trim(), email: fd.email.trim(), cpf: fd.cpf, tel: fd.tel, senha: fd.senha };
    s.err = null;
    if (one) { s.view = 'cad2'; return render(); }
    S.users.resp = s.draft.resp; S.users.mon = s.draft.mon; s.draft = null; s.view = 'login'; s.role = 'resp';
    s.ok = 'Cadastro concluído. Entre para configurar rotinas, medicações, exames e contatos.'; return render();
  }
  if (k === 'esqueci') { s.target = fd.id.trim(); s.view = 'codigo'; s.err = null; return render(); }
  if (k === 'codigo') { if (fd.codigo.trim() !== '123456') return bad('Código incorreto. No protótipo, use 123456.'); s.view = 'redefinir'; s.err = null; return render(); }
  if (k === 'redefinir') {
    if (fd.senha.length < 6) return bad('A senha precisa de pelo menos 6 caracteres.');
    if (fd.senha !== fd.senha2) return bad('As senhas não conferem.');
    const t = (s.target || '').toLowerCase(), who = ['resp', 'mon'].find(r => S.users[r].email.toLowerCase() === t || (digits(t).length === 11 && digits(t) === digits(S.users[r].cpf))) || s.role;
    S.users[who].senha = fd.senha; s.view = 'login'; s.role = who; s.err = null; s.ok = 'Senha redefinida. Entre com a nova senha.'; return render();
  }
  if (k === 'resolver') { resolveAlert(+f.dataset.id, fd.nota.trim()); s.modal = null; say(d, 'Verificação registrada. Alerta encerrado.'); return render(); }
  if (k === 'verificar') { const i = +fd.preset; s.preset = i; sendVerif(PRESETS[i]); say(d, 'Verificação enviada ao celular de ' + first(S.users.mon.nome) + '.'); return render(); }
  if (k === 'limites') {
    const L = S.cfg.lim; ['sisMin', 'sisMax', 'diaMin', 'diaMax', 'fcMin', 'fcMax'].forEach(x => L[x] = +fd[x]); S.cfg.timeout = +fd.timeout;
    addLog(first(S.users.resp.nome), 'Alterou limites de sinais vitais e o tempo de resposta do check-in.'); say(d, 'Limites salvos.'); return render();
  }
  if (k === 'item') {
    const kind = f.dataset.kind, F = FORMS[kind], id = f.dataset.id ? +f.dataset.id : null, list = S.cfg[F.list];
    if (!fd.nome.trim()) return;
    if (id) { Object.assign(list.find(x => x.id === id), fd); addLog(first(S.users.resp.nome), `Editou ${F.titulo.toLowerCase()}: ${fd.nome}.`); }
    else { list.push({ id: S.nid++, ...fd }); addLog(first(S.users.resp.nome), `Acrescentou ${F.titulo.toLowerCase()}: ${fd.nome}.`); }
    d.s.modal = null; say(d, 'Salvo. O celular já usa a nova configuração.'); return render();
  }
  if (k === 'vital') {
    const fora = registerVital(+fd.sis, +fd.dia, +fd.fc); s.vitalMsg = { fora }; return render();
  }
});

document.addEventListener('input', e => {
  const m = e.target.dataset && e.target.dataset.mask; if (!m) return;
  let v = digits(e.target.value);
  if (m === 'cpf') { v = v.slice(0, 11); v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); }
  else { v = v.slice(0, 11); v = v.length > 10 ? v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : v.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, a, b, c) => `(${a})${b ? ' ' + b : ''}${c ? '-' + c : ''}`); }
  e.target.value = v;
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  Object.values(dev).forEach(d => { d.s.modal = null; d.s.sheet = null; }); render();
});

/* ---------- início ---------- */
dev.phone.el = $('#dev-phone'); dev.desk.el = $('#dev-desk');
$('#logoMark').innerHTML = logo(); $('#demoToggle').innerHTML = ic('chev') + ' Demonstração';
document.querySelector('link[rel=icon]').href = LOGO; $('#barClockIc').innerHTML = ic('clock'); $('#sigIc').innerHTML = ic('signal');
setInterval(() => { if (S.play) advance(1); }, 2000);
render();
