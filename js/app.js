(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ================= STEP TEXT (edit freely) ================= */
const STEPS = [
 { title: 'VPC', sub: 'Fence your own plot',
   plain: "Nagothi Kavya Sree buys a plot inside a big city (AWS) and builds a fence around it. Only she decides who may enter. The fenced plot is her VPC.",
   tech: 'Amazon VPC (Virtual Private Cloud): your own private network inside an AWS Region, with an IP range such as 10.0.0.0/16.',
   watch: 'The teal fence appears inside the blue city box.' },
 { title: 'Availability Zones', sub: 'Two buildings',
   plain: 'She builds two buildings far apart. If one loses power or floods, the other keeps the shop open.',
   tech: 'Availability Zones (AZ A and AZ B): separate data centres inside one Region.',
   watch: 'Two blue buildings, Zone A and Zone B, appear inside the fence.' },
 { title: 'Subnets', sub: 'Lobby and flats',
   plain: 'Each building has a front lobby where guests may walk in (gold) and private flats at the back where only staff go (purple).',
   tech: 'Public subnet (has a route to the internet) and private subnet (no direct route in).',
   watch: 'Gold lobbies at the top, purple flats below, in both buildings.' },
 { title: 'Internet Gateway', sub: 'The main gate',
   plain: 'A main gate is added to the fence. A signboard (route table) says: to reach the outside world, use the main gate.',
   tech: 'Internet Gateway (IGW) plus a route table entry 0.0.0.0/0 pointing to the IGW.',
   watch: 'A visitor request (envelope) travels from Visitors, through The Internet, to the gate.' },
 { title: 'Load Balancer', sub: 'The receptionist',
   plain: 'A receptionist greets every visitor and sends each one to a free shop counter (web server), sharing the crowd between both buildings.',
   tech: 'Application Load Balancer spreading requests across web servers in two AZs.',
   watch: 'Envelopes slide under the receptionist bar and split to Zone A and Zone B.' },
 { title: 'Servers and Database', sub: 'Staff and ledger',
   plain: 'Counter staff pass the order to back-office staff (app server), who write it in the ledger (database). A live copy of the ledger is kept in the other building.',
   tech: 'Web tier, app tier and database in private subnets, with a Multi-AZ replica kept in sync.',
   watch: 'Disks move web, app, database. Repeat arrows copy the data between zones.' },
 { title: 'NAT Gateway', sub: 'Delivery counter',
   plain: 'Staff in the private flats can order parcels (updates) through a delivery counter, but outsiders cannot use it to walk in.',
   tech: 'NAT Gateway in a public subnet: private servers go out, nothing from the internet comes in.',
   watch: 'A package leaves the app server, passes the counter, and exits by the main gate.' },
 { title: 'Security', sub: 'Door and gate guards',
   plain: 'Every flat door has a guard (Security Group) and each lobby area has a gate guard (NACL). An intruder is turned away.',
   tech: 'Security Groups (per server, stateful) and Network ACLs (per subnet, stateless).',
   watch: 'Red tags appear. The devil heads for the private flats and is stopped: Blocked!' },
 { title: 'VPN and Peering', sub: 'Tunnel and road',
   plain: "Her office reaches the private flats through a secret tunnel (VPN). A partner's plot is linked by a private road (peering).",
   tech: 'Site-to-Site VPN with a virtual private gateway, and VPC peering to another VPC.',
   watch: 'A lock travels the tunnel from the office. A handshake crosses the road to the Partner VPC.' }
];

/* ================= SVG helpers ================= */
const svg = document.getElementById('diagram');
const mk = (tag, attrs, parent, txt) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (txt != null) e.textContent = txt;
  if (parent) parent.appendChild(e);
  return e;
};
const L = { wires: mk('g', {}, svg), boxes: mk('g', {}, svg), packets: mk('g', {}, svg) }; // wires first, then boxes, then packets
const items = [];
const reg = (layer, from, to) => {
  const g = mk('g', { class: 'part' }, layer);
  items.push({ g, from, to: to || 99 });
  return g;
};
const label = (g, x, y, t, cls, anchor) => mk('text', { x, y, class: cls, 'text-anchor': anchor || 'start' }, g, t);

function box(step, x, y, w, h, cls, l1, l2, o) {
  o = o || {};
  const g = reg(L.boxes, step, o.to);
  mk('rect', { x, y, width: w, height: h, rx: o.rx || 10, class: 'bx ' + cls }, g);
  if (o.top) {
    label(g, x + 12, y + (o.dy || 20), l1, o.cls || 'cl', 'start');
    if (l2) label(g, x + 12, y + (o.dy || 20) + 15, l2, 'sb', 'start');
  } else if (l1) {
    const cy = y + h / 2;
    label(g, x + w / 2, l2 ? cy - 2 : cy + 4, l1, 'lb', 'middle');
    if (l2) label(g, x + w / 2, cy + 12, l2, 'sb', 'middle');
  }
  return g;
}
function tag(step, x, y, w, t) {
  const g = reg(L.boxes, step);
  mk('rect', { x, y, width: w, height: 16, rx: 8, class: 'tg' }, g);
  label(g, x + w / 2, y + 11.5, t, 'tgt', 'middle');
}
function note(step, x, y, t) { label(reg(L.boxes, step), x, y, t, 'note', 'start'); }
function wire(step, d, cls, to) { mk('path', { d, class: 'wire ' + cls }, reg(L.wires, step, to)); }

function midPoint(d) {
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number), p = [];
  for (let i = 0; i < n.length; i += 2) p.push([n[i], n[i + 1]]);
  const seg = []; let total = 0;
  for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); seg.push(l); total += l; }
  let t = total / 2;
  for (let i = 0; i < seg.length; i++) {
    if (t <= seg[i]) { const f = seg[i] ? t / seg[i] : 0; return [p[i][0] + (p[i + 1][0] - p[i][0]) * f, p[i][1] + (p[i + 1][1] - p[i][1]) * f]; }
    t -= seg[i];
  }
  return p[0];
}
function packet(step, emoji, d, dur, begin, to) {
  const g = reg(L.packets, step, to);
  if (reduce) { const m = midPoint(d); mk('text', { x: m[0], y: m[1], class: 'pk', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g, emoji); return; }
  const t = mk('text', { class: 'pk', opacity: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g, emoji);
  mk('animateMotion', { path: d, dur: dur + 's', begin: (begin || 0) + 's', repeatCount: 'indefinite' }, t);
  mk('animate', { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;0.08;0.9;1', dur: dur + 's', begin: (begin || 0) + 's', repeatCount: 'indefinite' }, t);
}

/* ================= The picture ================= */
const ZONES = [{ k: 'A', x: 232 }, { k: 'B', x: 548 }];
function build() {
  // 1 - Region + VPC
  box(1, 150, 8, 754, 600, 'b-blue', 'AWS Cloud (a big city)', null, { top: true, dy: 20, rx: 16, cls: 'lb' });
  box(1, 206, 40, 658, 556, 'b-teal', 'VPC 10.0.0.0/16  (the fenced plot)', null, { top: true, dy: 20, rx: 14, cls: 'lb' });

  // 2 / 3 - Zones and subnets
  ZONES.forEach(z => {
    box(2, z.x, 140, 304, 444, 'b-blue', 'Zone ' + z.k + '  (Building ' + z.k + ')', null, { top: true, dy: 16, rx: 12 });
    box(3, z.x + 12, 162, 280, 130, 'b-gold', 'Public subnet', null, { top: true, dy: 18 });
    box(3, z.x + 12, 322, 280, 252, 'b-purple', 'Private subnet', null, { top: true, dy: 18 });
  });

  // 4 - Gate, Internet, Visitors, route table, first envelope
  box(4, 16, 60, 120, 90, 'b-ext', 'The Internet', 'the outside world', { top: true, dy: 22 });
  box(4, 16, 200, 120, 44, 'b-ext', 'Visitors', '(your customers)');
  box(4, 16, 268, 130, 44, 'b-ext', 'Route table', 'outside -> main gate');
  box(4, 194, 100, 24, 40, 'b-gold', '', '', { rx: 4 });
  box(4, 172, 146, 56, 32, 'b-pill', 'Internet', 'Gateway', { rx: 8 });
  wire(4, 'M76,200 L76,120 L300,120', 'w-in', 4);
  packet(4, '\u2709\uFE0F', 'M76,200 L76,120 L300,120', 4, 0, 4);

  // 5 - Load balancer + web servers
  box(5, 240, 76, 612, 24, 'b-lb', 'Load balancer (the receptionist)', null, { rx: 12 });
  ZONES.forEach((z, i) => {
    const x = z.x + 126;
    box(5, z.x + 30, 214, 110, 44, 'b-srv', 'Web server', 'shop counter');
    wire(5, 'M76,200 L76,120 L' + x + ',120 L' + x + ',214', 'w-in');
    packet(5, '\u2709\uFE0F', 'M76,200 L76,120 L' + x + ',120 L' + x + ',214', 4.5, i * 2.25);
  });

  // 6 - App servers + databases + replication
  ZONES.forEach((z, i) => {
    const x = z.x + 126;
    box(6, z.x + 30, 350, 110, 44, 'b-srv', 'App server', 'back office');
    box(6, z.x + 30, 470, 110, 44, 'b-srv', i ? 'Live-copy DB' : 'Database', i ? 'zone B copy' : 'main ledger');
    wire(6, 'M' + x + ',258 L' + x + ',350', 'w-data');
    wire(6, 'M' + x + ',394 L' + x + ',470', 'w-data');
    packet(6, '\uD83D\uDCBE', 'M' + x + ',258 L' + x + ',350', 3, i * 0.8);
    packet(6, '\uD83D\uDCBE', 'M' + x + ',394 L' + x + ',470', 3, 1.5 + i * 0.8);
  });
  wire(6, 'M372,492 L578,492', 'w-data');
  note(6, 392, 476, 'Replication');
  packet(6, '\uD83D\uDD01', 'M372,492 L578,492', 3, 0);

  // 7 - NAT
  box(7, 398, 214, 120, 44, 'b-lb', 'NAT Gateway', 'delivery counter');
  wire(7, 'M372,372 L510,372 L510,120 L194,120 L76,120', 'w-nat');
  packet(7, '\uD83D\uDCE6', 'M372,372 L510,372 L510,120 L194,120 L76,120', 6, 0);

  // 8 - Security
  ZONES.forEach(z => {
    [[262, 'SG guard'], [398, 'SG guard'], [518, 'SG guard']].forEach(r => tag(8, z.x + 30, r[0], 70, r[1]));
    tag(8, z.x + 173, 166, 50, 'NACL');
    tag(8, z.x + 173, 326, 50, 'NACL');
  });
  wire(8, 'M76,200 L76,120 L386,120 L386,292', 'w-bad');
  const bad = 'M76,200 L76,120 L386,120 L386,292';
  const gi = reg(L.packets, 8);
  if (reduce) {
    const m = midPoint(bad);
    mk('text', { x: m[0], y: m[1], class: 'pk', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, gi, '\uD83D\uDE08');
  } else {
    const t = mk('text', { class: 'pk', opacity: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, gi, '\uD83D\uDE08');
    mk('animateMotion', { path: bad, dur: '5s', keyTimes: '0;0.7;1', keyPoints: '0;1;1', calcMode: 'linear', repeatCount: 'indefinite' }, t);
    mk('animate', { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;0.05;0.9;1', dur: '5s', repeatCount: 'indefinite' }, t);
  }
  const bl = mk('g', { opacity: reduce ? 1 : 0 }, gi);
  mk('line', { x1: 379, y1: 301, x2: 393, y2: 315, class: 'cross' }, bl);
  mk('line', { x1: 393, y1: 301, x2: 379, y2: 315, class: 'cross' }, bl);
  mk('text', { x: 402, y: 313, class: 'blk' }, bl, 'Blocked!');
  if (!reduce) mk('animate', { attributeName: 'opacity', values: '0;0;1;1;0', keyTimes: '0;0.68;0.72;0.95;1', dur: '5s', repeatCount: 'indefinite' }, bl);

  // 9 - Office VPN + Partner peering
  box(9, 940, 380, 144, 116, 'b-green', "Nagothi Kavya Sree's office", 'secret tunnel (VPN)', { top: true, dy: 24 });
  box(9, 850, 420, 28, 36, 'b-green', '', '', { rx: 4 });
  box(9, 872, 456, 56, 32, 'b-pillg', 'VPN', 'gateway', { rx: 8 });
  wire(9, 'M940,438 L864,438 L744,438', 'w-vpn');
  packet(9, '\uD83D\uDD12', 'M940,438 L864,438 L744,438', 4, 0);
  box(9, 940, 170, 144, 120, 'b-green', 'Partner VPC', '10.1.0.0/16 (their plot)', { top: true, dy: 24 });
  wire(9, 'M864,230 L940,230', 'w-peer');
  note(9, 888, 256, 'Peering');
  packet(9, '\uD83E\uDD1D', 'M864,230 L940,230', 3, 0);
}

/* ================= UI ================= */
let current = 0, timer = null;
const stepsEl = document.getElementById('steps');
const autoBtn = document.getElementById('auto');
const buttons = STEPS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'step';
  b.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="t"></span><span class="s"></span>';
  b.querySelector('.t').textContent = s.title;
  b.querySelector('.s').textContent = s.sub;
  b.addEventListener('click', () => { stopAuto(); show(i + 1); });
  stepsEl.appendChild(b);
  return b;
});

function show(n) {
  current = n;
  items.forEach(it => {
    const vis = it.from <= n && n <= it.to;
    it.g.style.display = vis ? '' : 'none';
    it.g.classList.remove('new');
    if (vis && it.from === n) { void it.g.getBoundingClientRect(); it.g.classList.add('new'); }
  });
  buttons.forEach((b, i) => { if (i + 1 === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  const s = STEPS[n - 1];
  document.getElementById('cTitle').textContent = 'Step ' + n + ': ' + s.title + ' - ' + s.sub;
  document.getElementById('cPlain').textContent = s.plain;
  document.getElementById('cTech').textContent = s.tech;
  document.getElementById('cWatch').textContent = s.watch;
}
function stopAuto() {
  if (timer) { clearInterval(timer); timer = null; }
  autoBtn.setAttribute('aria-pressed', 'false'); autoBtn.textContent = 'Auto-play';
}
function startAuto() {
  autoBtn.setAttribute('aria-pressed', 'true'); autoBtn.textContent = 'Pause';
  timer = setInterval(() => { if (current >= STEPS.length) stopAuto(); else show(current + 1); }, 5000);
}
autoBtn.addEventListener('click', () => { if (timer) stopAuto(); else { if (current >= STEPS.length) show(1); startAuto(); } });
document.getElementById('reset').addEventListener('click', () => { stopAuto(); show(1); });

build();
show(1);
})();
