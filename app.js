/* ============ WireframeStudio — local wireframe builder ============ */
'use strict';
(() => {

/* ---------------- helpers ---------------- */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
let idSeq = 1;
const uid = () => 'e' + (idSeq++);
function mulberry(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

const PH_SVG = `<svg class="wf-ph" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><rect x="22" y="27" width="56" height="46" rx="6" fill="none" stroke="#99a0a8" stroke-width="3"/><path d="M28 68 L43 47 L53 59 L61 52 L72 68 Z" fill="#99a0a8"/><circle cx="41" cy="43" r="5" fill="#99a0a8"/></svg>`;
const AV_SVG = `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="#d7dade" stroke="#aeb4bb" stroke-width="2"/><circle cx="30" cy="23" r="9" fill="#9aa1a9"/><path d="M11 52 C16 38 44 38 49 52 A27 27 0 0 1 11 52 Z" fill="#9aa1a9"/></svg>`;
const PLAY = `<div class="play"></div>`;

function qrCells(){
  const r = mulberry(Math.floor(Math.random()*1e9));
  const n = 13, c = [];
  const isFinder = (x,y)=> (x<5&&y<5)||(x>7&&y<5)||(x<5&&y>7);
  for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(!isFinder(x,y) && r()<0.45) c.push([x,y]);
  return c;
}
function qrSVG(el){
  const n=13, u=100/n;
  const f=(x,y,w,h)=>`<rect x="${x*u}" y="${y*u}" width="${w*u}" height="${h*u}" fill="#2e333a"/>`;
  const finder=(ox,oy)=> f(ox,oy,5,5)+`<rect x="${(ox+1)*u}" y="${(oy+1)*u}" width="${3*u}" height="${3*u}" fill="#fff"/>`+f(ox+2,oy+2,1,1);
  let s = `<svg viewBox="0 0 100 100">` + finder(0,0)+finder(8,0)+finder(0,8);
  for(const [x,y] of (el.cells||[])) s+=f(x,y,1,1);
  return s+`</svg>`;
}

/* ---------------- element registry ---------------- */
const TYPES = {};
const CATS  = ['Elements','Forms','Media','Components','Mobile'];
function def(cat, type, o){ o.cat = cat; o.type = type; TYPES[type] = o; }
function T(name) { return TYPES[name]; }

/* ---- Elements ---- */
def('Elements','box',      { name:'Box', w:200, h:120, kw:'rectangle placeholder div container', html:'' });
def('Elements','line',     { name:'Line', w:200, h:6, kw:'divider rule hr separator', fill:'#9aa1a9', stroke:'transparent', sw:0, html:'' });
def('Elements','circle',   { name:'Circle', w:120, h:120, aspect:true, kw:'oval round', html:'' });
def('Elements','text',     { name:'Text', w:200, h:26, fs:16, fill:'transparent', stroke:'transparent', sw:0,
    parts:{ t:'Text label' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Elements','headline', { name:'Headline', w:340, h:44, fs:28, fill:'transparent', stroke:'transparent', sw:0,
    parts:{ t:'Big headline' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Elements','para',     { name:'Block text', w:300, h:110, fs:15, fill:'transparent', stroke:'transparent', sw:0,
    kw:'paragraph lorem ipsum body copy text block',
    parts:{ t:'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' },
    html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Elements','bars',     { name:'Grey bars', w:300, h:110, fs:15, fill:'transparent', stroke:'transparent', sw:0,
    kw:'placeholder skeleton lines grey bars', html:`<div class="bars"></div>` });
def('Elements','quote',    { name:'Blockquote', w:300, h:74, fs:16, fill:'transparent', stroke:'transparent', sw:0,
    kw:'pullquote citation', parts:{ t:'Quoted text goes here' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Elements','list',     { name:'List', w:230, h:104, fs:15, tag:'ul', fill:'transparent', stroke:'transparent', sw:0,
    kw:'bullet points ul', parts:{ i1:'List item one', i2:'List item two', i3:'List item three' },
    html:`<li><span class="li-txt" data-t="i1">{i1}</span></li><li><span class="li-txt" data-t="i2">{i2}</span></li><li><span class="li-txt" data-t="i3">{i3}</span></li>` });
def('Elements','olist',    { name:'Numbered list', w:230, h:104, fs:15, tag:'ul', fill:'transparent', stroke:'transparent', sw:0,
    kw:'ol ordered numbered steps', parts:{ i1:'First step', i2:'Second step', i3:'Third step' },
    html:`<li><span class="li-txt" data-t="i1">{i1}</span></li><li><span class="li-txt" data-t="i2">{i2}</span></li><li><span class="li-txt" data-t="i3">{i3}</span></li>` });
def('Elements','button',   { name:'Button (solid)', w:130, h:40, fs:15, kw:'cta submit action solid filled',
    parts:{ t:'Button' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Elements','buttono',  { name:'Button (outline)', w:130, h:40, fs:15, kw:'cta secondary ghost outline',
    parts:{ t:'Button' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Elements','link',     { name:'Text link', w:120, h:26, fs:15, fill:'transparent', stroke:'transparent', sw:0,
    kw:'hyperlink anchor href underlined', parts:{ t:'Link text' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Elements','badge',    { name:'Badge / tag', w:90, h:26, fs:12,
    kw:'chip pill label tag status', parts:{ t:'Tag' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Elements','slider',   { name:'Slider', w:220, h:28, fs:14, fill:'transparent', stroke:'transparent', sw:0,
    kw:'range control volume adjust', parts:{}, html:`<div class="sl-track"><div class="sl-fill"></div><div class="sl-knob"></div></div>` });
def('Elements','toggle',   { name:'Toggle', w:170, h:30, fs:15, kw:'switch on off',
    parts:{ t:'Setting' }, html:`<div class="trk"><div class="knob"></div></div><span class="el-txt" data-t="t">{t}</span>` });
def('Elements','progress', { name:'Progress bar', w:240, h:20, fs:13, kw:'loading meter stepper',
    parts:{ t:'55%' }, html:`<div class="bar-fill"></div><span class="el-txt" data-t="t">{t}</span>` });

/* ---- Forms ---- */
def('Forms','input',    { name:'Text input', w:240, h:38, fs:15, kw:'field textbox form entry',
    parts:{ t:'Placeholder text' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Forms','search',   { name:'Search box', w:240, h:38, fs:15, kw:'find magnifier query search bar',
    parts:{ t:'Search…' }, html:`<svg class="mag" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6" fill="none" stroke="#9aa1a9" stroke-width="2.5"/><path d="M15 15 21 21" stroke="#9aa1a9" stroke-width="2.5" stroke-linecap="round"/></svg><span class="el-txt" data-t="t">{t}</span>` });
def('Forms','textarea', { name:'Textarea', w:240, h:110, fs:14, kw:'multiline message comment field',
    parts:{ t:'Placeholder text' }, html:`<span class="el-txt" data-t="t">{t}</span>` });
def('Forms','select',   { name:'Dropdown', w:200, h:38, fs:15, kw:'select combo picker',
    parts:{ t:'Choose an option' }, html:`<span class="el-txt" data-t="t">{t}</span><span class="chev"></span>` });
def('Forms','check',    { name:'Checkbox', w:170, h:26, fs:15, kw:'tick option form',
    parts:{ t:'Checkbox label' }, html:`<span class="box"></span><span class="el-txt" data-t="t">{t}</span>` });
def('Forms','radio',    { name:'Radio', w:170, h:26, fs:15, kw:'option choice select one',
    parts:{ t:'Radio label' }, html:`<span class="dot"></span><span class="el-txt" data-t="t">{t}</span>` });
def('Forms','form',     { name:'Contact form', w:300, h:260, fs:15, kw:'form contact signup login register fields',
    parts:{ l1:'Name', p1:'Your name', l2:'Email', p2:'you@example.com', l3:'Message', p3:'Type your message…', btn:'Send message' },
    html:`
      <div class="ff" style="left:0;top:0;height:23%"><div class="fl" data-t="l1">{l1}</div><div class="fi"><span class="el-txt" data-t="p1">{p1}</span></div></div>
      <div class="ff" style="left:0;top:27%;height:23%"><div class="fl" data-t="l2">{l2}</div><div class="fi"><span class="el-txt" data-t="p2">{p2}</span></div></div>
      <div class="ff" style="left:0;top:54%;height:29%"><div class="fl" data-t="l3">{l3}</div><div class="fi"><span class="el-txt" data-t="p3">{p3}</span></div></div>
      <div class="fbtn" style="left:0;right:0;top:87%;height:13%"><span class="el-txt" data-t="btn">{btn}</span></div>` });

/* ---- Media ---- */
function imgHTML(el){
  const s = el.imgStyle || 'icon';
  if (s === 'plain') return '';
  if (s === 'cross') return `<svg class="wf-ph" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M2 2 L98 98 M98 2 L2 98" fill="none" stroke="#99a0a8" stroke-width="2"/></svg>`;
  return PH_SVG;
}
def('Media','image',   { name:'Image', w:220, h:150, aspect:true, kw:'photo picture banner media',
    html: imgHTML });
def('Media','video',   { name:'Video', w:320, h:180, fs:26, aspect:true, kw:'youtube embed film media',
    html:PLAY });
def('Media','icon',    { name:'Icon', w:40, h:40, aspect:true, kw:'symbol glyph',
    html:`<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="#5d646d" stroke-width="2.5"/><path d="M12 12 L28 28 M28 12 L12 28" stroke="#5d646d" stroke-width="2.5" stroke-linecap="round"/></svg>` });
def('Media','avatar',  { name:'Avatar', w:56, h:56, aspect:true, kw:'user profile person face',
    html:AV_SVG });
def('Media','qr',      { name:'QR code', w:96, h:96, aspect:true, kw:'scan link', html:qrSVG });
def('Media','social',  { name:'Social icons', w:170, h:40, fs:13, kw:'facebook twitter instagram share',
    parts:{ s1:'f', s2:'x', s3:'in' },
    html:`<span class="soc" data-t="s1">{s1}</span><span class="soc" data-t="s2">{s2}</span><span class="soc" data-t="s3">{s3}</span>` });

/* ---- Components ---- */
const NAV_LINKS = () =>
  [1,2,3,4].map(i=>`<span class="nb-link"><span class="el-txt" data-t="n${i}">{n${i}}</span></span>`).join('');
def('Components','navbar', { name:'Navigation bar', w:1440, h:60, fs:14, full:true, kw:'nav menu header site links',
    parts:{ n1:'Home', n2:'About', n3:'Pricing', n4:'Blog', cta:'Sign up' },
    html:`<div class="nb-logo"></div><div class="nb-links">${NAV_LINKS()}</div><span class="nb-cta" data-t="cta">{cta}</span>` });
def('Components','hero', { name:'Hero', w:600, h:420, fs:15, kw:'banner jumbo intro feature header',
    parts:{ h:'Craft a clear value proposition', b:'Get started', q:'image' },
    html:`<div class="hero-media">${PH_SVG}</div><div class="hero-h"><span class="el-txt" data-t="h">{h}</span></div><div class="hero-p bars"></div><div class="hero-b"><span class="el-txt" data-t="b">{b}</span></div>` });
def('Components','card', { name:'Card', w:240, h:300, fs:14, kw:'panel box feature',
    parts:{ t:'Card title', b:'Learn more' },
    html:`<div class="cd-media">${PH_SVG}</div><div class="cd-t"><span class="el-txt" data-t="t">{t}</span></div><div class="cd-p bars"></div><div class="cd-b"><span class="el-txt" data-t="b">{b}</span></div>` });
def('Components','product', { name:'Product card', w:240, h:300, fs:14, kw:'shop ecommerce item price buy sku',
    parts:{ t:'Product name', price:'$29.00', b:'Add to cart' },
    html:`<div class="pd-media">${PH_SVG}</div><div class="pd-t"><span class="el-txt" data-t="t">{t}</span></div><div class="pd-price"><span class="el-txt" data-t="price">{price}</span></div><div class="pd-b"><span class="el-txt" data-t="b">{b}</span></div>` });
const CG_COL = i => `<div class="cg-col" style="left:${i*34}%;width:32%"><div class="cd-media">${PH_SVG}</div><div class="cd-t"><span class="el-txt" data-t="t${i+1}">{t${i+1}}</span></div><div class="cd-p bars"></div><div class="cd-b"><span class="el-txt" data-t="b${i+1}">{b${i+1}}</span></div></div>`;
def('Components','cardgrid', { name:'Card row (3)', w:760, h:300, fs:13, kw:'grid features columns cards trio',
    parts:{ t1:'Feature one', b1:'More', t2:'Feature two', b2:'More', t3:'Feature three', b3:'More' },
    html:CG_COL(0)+CG_COL(1)+CG_COL(2) });
const PR_COL = (i,hi) => `<div class="pr-col${hi?' hi':''}" style="left:${i*34}%;width:32%">
    <div class="pr-name"><span class="el-txt" data-t="n${i+1}">{n${i+1}}</span></div>
    <div class="pr-price"><span class="el-txt" data-t="p${i+1}">{p${i+1}}</span></div>
    <div class="pr-item" style="top:32%"></div><div class="pr-item" style="top:40%"></div><div class="pr-item" style="top:48%"></div>
    <div class="pr-btn"><span class="el-txt" data-t="b${i+1}">{b${i+1}}</span></div></div>`;
def('Components','pricing', { name:'Pricing table', w:720, h:320, fs:14, kw:'plans tiers subscription tiers compare',
    parts:{ n1:'Starter', p1:'$9', b1:'Choose', n2:'Pro', p2:'$29', b2:'Choose', n3:'Team', p3:'$99', b3:'Choose' },
    html:PR_COL(0,false)+PR_COL(1,true)+PR_COL(2,false) });
def('Components','testimonial', { name:'Testimonial', w:560, h:150, fs:16, kw:'quote review customer social proof',
    parts:{ q:'“This product completely changed how our team works. I recommend it to everyone.”', n:'Jane Doe, Acme Inc.' },
    html:`<div class="tm-quote"><span class="el-txt" data-t="q">{q}</span></div><div class="tm-av">${AV_SVG}</div><div class="tm-name"><span class="el-txt" data-t="n">{n}</span></div>` });
const FT_COL = i => `<div class="ft-col" style="left:${i*25}%;top:10%;width:18%;height:48%"><div class="ft-head"><span class="el-txt" data-t="h${i+1}">{h${i+1}}</span></div><div class="ft-line"></div><div class="ft-line"></div><div class="ft-line"></div></div>`;
def('Components','footer', { name:'Footer', w:1440, h:190, fs:13, full:true, kw:'bottom site links copyright',
    parts:{ h1:'Product', h2:'Company', h3:'Resources', h4:'Legal', c:'© 2026 Your Company. All rights reserved.' },
    html:FT_COL(0)+FT_COL(1)+FT_COL(2)+FT_COL(3)+`<div class="ft-copy"><span class="el-txt" data-t="c">{c}</span></div>` });
def('Components','browser', { name:'Browser frame', w:1000, h:560, fs:14, kw:'window mockup chrome screenshot',
    html:`<div class="bw-bar"><span class="bw-dot"></span><span class="bw-dot"></span><span class="bw-dot"></span><div class="bw-url"></div></div><div class="bw-body"></div>` });
def('Components','tabs', { name:'Tabs', w:420, h:40, fs:14, kw:'tab nav sections switch',
    parts:{ t1:'Overview', t2:'Features', t3:'Pricing', t4:'FAQ' },
    html:`<span class="tab on"><span class="el-txt" data-t="t1">{t1}</span></span><span class="tab"><span class="el-txt" data-t="t2">{t2}</span></span><span class="tab"><span class="el-txt" data-t="t3">{t3}</span></span><span class="tab"><span class="el-txt" data-t="t4">{t4}</span></span>` });
def('Components','pagination', { name:'Pagination', w:210, h:44, fs:14, kw:'pages pager next numbering',
    parts:{ t1:'1', t2:'2', t3:'3', t4:'4', t5:'›' },
    html:`<span class="pg on"><span class="el-txt" data-t="t1">{t1}</span></span><span class="pg"><span class="el-txt" data-t="t2">{t2}</span></span><span class="pg"><span class="el-txt" data-t="t3">{t3}</span></span><span class="pg"><span class="el-txt" data-t="t4">{t4}</span></span><span class="pg"><span class="el-txt" data-t="t5">{t5}</span></span>` });
def('Components','breadcrumb', { name:'Breadcrumb', w:380, h:26, fs:13, kw:'nav path crumbs trail',
    parts:{ b1:'Home', b2:'Category', b3:'Subcategory', b4:'Current page' },
    html:`<span class="bc"><span class="el-txt" data-t="b1">{b1}</span></span><span class="bc-sep">/</span><span class="bc"><span class="el-txt" data-t="b2">{b2}</span></span><span class="bc-sep">/</span><span class="bc"><span class="el-txt" data-t="b3">{b3}</span></span><span class="bc-sep">/</span><span class="bc"><span class="el-txt" data-t="b4">{b4}</span></span>` });

def('Components','herosplit', { name:'Split hero', w:700, h:320, fs:15, kw:'two column banner intro image left',
    parts:{ h:'Say it simply, say it big', b:'Learn more' },
    html:`<div class="hs-media">${PH_SVG}</div><div class="hs-h"><span class="el-txt" data-t="h">{h}</span></div><div class="hs-p bars"></div><div class="hs-b"><span class="el-txt" data-t="b">{b}</span></div>` });
def('Components','cardwide', { name:'Wide card', w:460, h:220, fs:14, kw:'horizontal card media row',
    parts:{ t:'Card title', b:'Details' },
    html:`<div class="cw-media">${PH_SVG}</div><div class="cw-t"><span class="el-txt" data-t="t">{t}</span></div><div class="cw-p bars"></div><div class="cw-b"><span class="el-txt" data-t="b">{b}</span></div>` });
def('Components','gallery', { name:'Image gallery (4)', w:460, h:320, fs:14, kw:'photos grid images portfolio gallery',
    parts:{}, html:[0,1,2,3].map(i=>`<div class="gl-cell" style="left:${i%2*51.5}%;top:${Math.floor(i/2)*51.5}%">${PH_SVG}</div>`).join('') });
def('Components','stats', { name:'Stats row', w:600, h:150, fs:14, kw:'numbers metrics counters kpi trust',
    parts:{ n1:'10k+', n2:'99.9%', n3:'4.8/5' },
    html:[0,1,2].map(i=>`<div class="st-col" style="left:${i*35}%"><div class="st-num"><span class="el-txt" data-t="n${i+1}">{n${i+1}}</span></div><div class="st-lab bars"></div></div>`).join('') });
def('Components','faq', { name:'FAQ list', w:600, h:240, fs:14, kw:'questions accordion help q a',
    parts:{ q1:'Question one — what is this?', q2:'Question two — how does it work?', q3:'Question three — is it free?' },
    html:[0,1,2].map(i=>`<div class="fq-row" style="top:${i*33}%"><span class="fq-q"><span class="el-txt" data-t="q${i+1}">{q${i+1}}</span></span><span class="fq-plus"><span>+</span></span></div>`).join('') });
def('Components','chat', { name:'Chat bubble', w:260, h:80, fs:14, kw:'message comment speech testimonial',
    parts:{ t:'A short message…' }, html:`<span class="el-txt" data-t="t">{t}</span>` });

/* ---- Mobile ---- */
def('Mobile','hambarnav', { name:'Mobile nav (hamburger)', w:390, h:56, fs:14, full:true, kw:'mobile nav bar hamburger menu phone header burger',
    parts:{}, html:`<div class="nb-logo"></div><div class="mob-ham"><i></i><i></i><i></i></div>` });
def('Mobile','mobilemenu', { name:'Mobile menu (open)', w:390, h:260, fs:15, full:true, kw:'mobile hamburger menu open drawer nav expanded',
    parts:{ m1:'Home', m2:'About', m3:'Pricing', m4:'Contact' },
    html:`<div class="mm-bar"><div class="nb-logo"></div><div class="mob-ham"><i></i><i></i><i></i></div></div><div class="mm-list">`+
      [1,2,3,4].map(i=>`<span class="mm-link"><span class="el-txt" data-t="m${i}">{m${i}}</span></span>`).join('')+`</div>` });
def('Mobile','bottomnav', { name:'Bottom tab bar', w:390, h:58, fs:11, full:true, kw:'mobile tab bar bottom nav app icons home',
    parts:{ l1:'Home', l2:'Search', l3:'Posts', l4:'Cart', l5:'Me' },
    html:[1,2,3,4,5].map(i=>`<div class="bn-item${i===1?' on':''}"><span class="bn-ic"></span><span class="bn-lb"><span class="el-txt" data-t="l${i}">{l${i}}</span></span></div>`).join('') });
def('Mobile','mobhero', { name:'Mobile hero', w:360, h:440, fs:15, kw:'mobile banner hero stacked phone intro',
    parts:{ h:'Big idea, small screen', b:'Get started' },
    html:`<div class="mh-media">${PH_SVG}</div><div class="mh-h"><span class="el-txt" data-t="h">{h}</span></div><div class="mh-p bars"></div><div class="mh-b"><span class="el-txt" data-t="b">{b}</span></div>` });
def('Mobile','listrows', { name:'List rows', w:360, h:230, fs:14, kw:'mobile list view rows app settings feed cells',
    parts:{}, html:[0,1,2,3].map(i=>`<div class="lr-row" style="top:${i*25}%"><span class="lr-av"></span><span class="lr-bars"><i class="lr-t"></i><i class="lr-s"></i></span><span class="lr-chev">›</span></div>`).join('') });
def('Mobile','fab', { name:'Floating action button', w:56, h:56, fs:20, aspect:true, kw:'fab plus add mobile action button round',
    parts:{}, html:`<span class="fab-plus">+</span>` });
def('Mobile','phoneframe', { name:'Phone frame', w:390, h:800, fs:14, kw:'phone mockup mobile device frame screen iphone',
    parts:{}, html:`<div class="pn-notch"></div><div class="pn-screen"></div>` });

/* ---------------- palette icons ---------------- */
const PAL_ICONS = {
  box:'<rect x="3" y="4" width="11" height="9" rx="1"/>', line:'<path d="M2.5 8.5h11"/>',
  circle:'<circle cx="8" cy="8" r="5.5"/>', text:'<path d="M3.5 4.5h9M8 4.5v7.5"/>',
  headline:'<path d="M2.5 4h11M2.5 7.5h11M2.5 11h6"/>', para:'<path d="M3 3.5h10M3 6h10M3 8.5h10M3 11h6"/>',
  quote:'<path d="M5.5 4.5 3 8.5h2.5L4 11.5M11.5 4.5 9 8.5h2.5L10 11.5"/>',
  list:'<path d="M4 4h.01M4 8h.01M4 12h.01M7 4h7M7 8h7M7 12h7"/>',
  olist:'<path d="M3 3.5v3M2.6 7.5h1v2.8H2.6M7 4h7M7 8h7M7 12h7"/>',
  button:'<rect x="2.5" y="5" width="11" height="6" rx="2"/>',
  buttono:'<rect x="2.5" y="5" width="11" height="6" rx="2"/><path d="M5 8h6" stroke-dasharray="1.5 1.5"/>',
  link:'<path d="M6.5 9.5a2.8 2.8 0 0 1 0-3.4h2.2M9.5 6.5a2.8 2.8 0 0 1 0 3.4H7.3M6.2 8h3.6"/>',
  badge:'<rect x="3" y="5.5" width="10" height="5" rx="2.5"/><path d="M5.5 8h5"/>',
  slider:'<path d="M2.5 8h11"/><circle cx="10" cy="8" r="2"/>',
  search:'<rect x="2.5" y="5.5" width="11" height="5" rx="1"/><circle cx="5.5" cy="8" r="1.4"/><path d="M6.6 9.1 8 10.4"/>',
  toggle:'<rect x="2.5" y="5.5" width="11" height="5" rx="2.5"/><circle cx="10.5" cy="8" r="1.8"/>',
  progress:'<rect x="2.5" y="6.5" width="11" height="3" rx="1.5"/><path d="M2.5 8h6"/>',
  input:'<rect x="2.5" y="5.5" width="11" height="5" rx="1"/><path d="M4.5 8h.01"/>',
  textarea:'<rect x="2.5" y="3.5" width="11" height="9" rx="1"/><path d="M4.5 5.5h7M4.5 8h7M4.5 10.5h4"/>',
  select:'<rect x="2.5" y="5.5" width="11" height="5" rx="1"/><path d="M9.5 7l1.5 2 1.5-2" transform="translate(-2)"/>',
  check:'<rect x="3" y="5" width="5.5" height="5.5" rx="1"/><path d="M4.3 7.8 5.6 9 8 6.3M10.5 7.7h3"/>',
  radio:'<circle cx="5.8" cy="7.8" r="2.8"/><circle cx="5.8" cy="7.8" r="1"/><path d="M10.5 7.8h3"/>',
  form:'<rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M5 5.5h6M5 8h6M5 10.5h3.5"/>',
  image:'<rect x="2.5" y="3.5" width="11" height="9" rx="1"/><circle cx="6" cy="6.5" r="1.2"/><path d="M3.5 11.5 7 8l2 2 2-1.8 2.5 3.3"/>',
  video:'<rect x="2.5" y="4" width="11" height="8" rx="1"/><path d="M7 6.3l3 1.7-3 1.7z"/>',
  icon:'<circle cx="8" cy="8" r="5.5"/><path d="M5.5 5.5 10.5 10.5M10.5 5.5 5.5 10.5"/>',
  avatar:'<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="6.5" r="1.8"/><path d="M4.3 11.3c1-2 6.4-2 7.4 0"/>',
  qr:'<rect x="2.5" y="2.5" width="4.5" height="4.5"/><rect x="11" y="2.5" width="4.5" height="4.5"/><rect x="2.5" y="11" width="4.5" height="4.5"/><path d="M10 10.5h1.5M12.5 10h.01M10 13h.01M13 12.5h.01"/>',
  social:'<circle cx="4.5" cy="8" r="2.2"/><circle cx="11.5" cy="4.5" r="2.2"/><circle cx="11.5" cy="11.5" r="2.2"/><path d="M6.6 7 9.4 5.3M6.6 9l2.8 1.7"/>',
  navbar:'<rect x="2" y="5" width="12" height="6" rx="1"/><path d="M3.5 8h2M8 8h1.5M11 8h1.5"/>',
  hero:'<rect x="2.5" y="2.5" width="11" height="5"/><path d="M3.5 9.5h6M3.5 11.5h3M10.5 10.5h2.5"/>',
  card:'<rect x="3.5" y="2.5" width="9" height="11" rx="1"/><path d="M5 5.5h6M5 8h6M5 10.5h3"/>',
  product:'<rect x="3.5" y="2.5" width="9" height="11" rx="1"/><path d="M5 4.5h6v3H5zM5 9.5h3M5 11.5h4"/>',
  cardgrid:'<rect x="2" y="4" width="3.5" height="8"/><rect x="6.5" y="4" width="3.5" height="8"/><rect x="11" y="4" width="3.5" height="8"/>',
  herosplit:'<rect x="2" y="3.5" width="5" height="9"/><path d="M9 5h5M9 7.5h5M9 10h2.5M9 11.5h3.5" />',
  cardwide:'<rect x="2" y="4" width="12" height="8" rx="1"/><rect x="3.2" y="5.2" width="4" height="5.6"/><path d="M9 6h3.5M9 8.5h3.5"/>',
  gallery:'<rect x="2.5" y="2.5" width="5" height="5"/><rect x="8.5" y="2.5" width="5" height="5"/><rect x="2.5" y="8.5" width="5" height="5"/><rect x="8.5" y="8.5" width="5" height="5"/>',
  stats:'<path d="M3 9.5V4M8 9.5V2.5M13 9.5V5.5M2 12.5h12"/>',
  faq:'<circle cx="11.5" cy="4.5" r="2"/><path d="M11.5 3.5v2M10.5 4.5h2M2.5 4.5h5.5M2.5 8h11M2.5 11.5h8"/>',
  chat:'<path d="M2.5 3.5h11v7h-7l-2.5 2.5v-2.5h-1.5z"/>',
  hambarnav:'<rect x="2.5" y="3.5" width="11" height="9" rx="1.5"/><path d="M8.5 5.8h3.5M8.5 8h3.5M8.5 10.2h3.5"/>',
  mobilemenu:'<path d="M2.5 2.8h11M2.5 5.3h11"/><rect x="2.5" y="7.3" width="11" height="6.2" rx="1"/><path d="M4.5 9.4h7M4.5 11.4h5"/>',
  bottomnav:'<rect x="2.5" y="9" width="11" height="4.5" rx="1"/><path d="M5 11.2h.01M8 11.2h.01M11 11.2h.01"/><path d="M4.5 6.5h7M6.5 4h3"/>',
  mobhero:'<rect x="4.5" y="2.5" width="7" height="11" rx="1.5"/><path d="M6 5.8h4M6 8.2h4M6 10.6h2.5"/>',
  listrows:'<path d="M6 4h7.5M6 8h7.5M6 11.5h7.5"/><circle cx="3.6" cy="4" r="1.1"/><circle cx="3.6" cy="8" r="1.1"/><circle cx="3.6" cy="11.5" r="1.1"/>',
  fab:'<circle cx="8" cy="8" r="5"/><path d="M8 5.5v5M5.5 8h5"/>',
  phoneframe:'<rect x="4.5" y="2" width="7" height="12" rx="1.5"/><path d="M6.5 3.8h3M6.5 12.4h3"/>',
  pricing:'<rect x="2" y="5" width="3" height="7"/><rect x="6.5" y="3" width="3" height="9"/><rect x="11" y="5" width="3" height="7"/>',
  testimonial:'<path d="M5.5 4.5 3.5 7.5H6L5 10M11.5 4.5 9.5 7.5H12L11 10"/><circle cx="8" cy="12" r="1.3"/>',
  footer:'<rect x="2" y="6" width="12" height="6" rx="1"/><path d="M4 8h1.5M8 8h2M4.5 10h7"/>',
  browser:'<rect x="2" y="3.5" width="12" height="9" rx="1"/><path d="M2 5.8h12M3.5 4.7h.01M5.2 4.7h.01"/>',
  tabs:'<path d="M2.5 6h3.5M6.8 6h2.6M10.2 6h3.3M2.5 12h11"/><path d="M2.5 6v2M13.5 6v2"/>',
  pagination:'<rect x="2" y="5.5" width="4.5" height="4.5" rx="1"/><rect x="7.5" y="5.5" width="4.5" height="4.5" rx="1"/><path d="M13 5.5v4.5"/>',
  breadcrumb:'<path d="M2.5 8h3.5M8 8h3.5M13 8h1.5M6.5 5.8 7.5 8l-1 2.2"/>'
};
const svgIcon = (inner) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

/* ---------------- app state ---------------- */
const S = { els: [], page:{ w:1440, h:1200 }, zoom:1, grid:false, snap:false, sel:new Set(), tool:null, clip:null };
const FONTMAP = {
  sans:  '"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif',
  serif: 'Georgia,"Times New Roman",serif',
  mono:  '"Consolas","Cascadia Mono","Courier New",monospace',
  round: '"Comic Sans MS","Segoe Print",cursive',
};
const KEY = 'wireframestudio.v1';
const elLayer = $('#elLayer'), fxLayer = $('#fxLayer'), pageEl = $('#page'), pageContent = $('#pageContent'),
      workspace = $('#workspace'), spacer = $('#spacer');
const nodes = new Map();
const HISTORY_MAX = 150;
let hist = [], hi = -1;

const elById = id => S.els.find(e => e.id === id);
const snapJSON = () => JSON.stringify({ els:S.els, page:S.page });

function pushHistory(){
  hist = hist.slice(0, hi+1);
  hist.push(snapJSON());
  if (hist.length > HISTORY_MAX) hist.shift();
  hi = hist.length-1;
  syncHistBtns(); saveSoon();
}
function undo(){ if(hi<=0) return; hi--; applyHist(); }
function redo(){ if(hi>=hist.length-1) return; hi++; applyHist(); }
function applyHist(){
  const d = JSON.parse(hist[hi]);
  S.els = d.els; S.page = d.page;
  S.sel = new Set([...S.sel].filter(id => elById(id)));
  rebuild(); syncDims(); saveSoon(); syncHistBtns();
}
function syncHistBtns(){
  $('#btnUndo').disabled = hi <= 0;
  $('#btnRedo').disabled = hi >= hist.length-1;
}

/* ---------------- persistence ---------------- */
let saveTimer = null;
function saveSoon(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ v:1, els:S.els, page:S.page, zoom:S.zoom, grid:S.grid, snap:S.snap })); } catch(e){}
    const st = $('#saveStatus'); st.textContent = 'Saved'; st.classList.add('flash');
    setTimeout(() => st.classList.remove('flash'), 900);
  }, 400);
}
function loadSaved(){
  try {
    const raw = localStorage.getItem(KEY); if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.els)) return false;
    S.els = d.els.filter(e => TYPES[e.type]);
    if (d.page) S.page = { w:clamp(d.page.w||1440,200,4000), h:clamp(d.page.h||1200,300,8000) };
    S.zoom = clamp(d.zoom||1, .2, 3); S.grid = !!d.grid; S.snap = !!d.snap;
    for (const e of S.els){ const n = parseInt(String(e.id).slice(1)); if (n >= idSeq) idSeq = n+1; }
    return true;
  } catch(e){ return false; }
}

/* ---------------- toast ---------------- */
let toastTimer = null;
function toast(msg){
  const t = $('#toast'); t.hidden = false; t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.hidden = true, 2200);
}

/* ---------------- rendering ---------------- */
function fillTemplate(el, tpl){
  return tpl.replace(/\{(\w+)\}/g, (_,k) => esc(el.parts && el.parts[k] != null ? el.parts[k] : (TYPES[el.type].parts?.[k] ?? '')));
}
function makeNode(el){
  const T0 = TYPES[el.type];
  const node = document.createElement(T0.tag || 'div');
  node.className = 'el wf wf-' + el.type + (el.locked ? ' locked' : '');
  node.dataset.id = el.id;
  sizeNode(node, el);
  if (el.fs) node.style.setProperty('--fs', el.fs + 'px');
  else if (T0.fs) node.style.setProperty('--fs', T0.fs + 'px');
  if (el.font && FONTMAP[el.font]) node.style.fontFamily = FONTMAP[el.font];
  if (el.fill   != null) node.style.setProperty('--elFill',   el.fill);
  if (el.stroke != null) node.style.setProperty('--elStroke', el.stroke);
  if (el.sw     != null) node.style.setProperty('--elStrokeW', el.sw + 'px');
  if (el.op != null && el.op < 1) node.style.opacity = el.op;
  node.innerHTML = typeof T0.html === 'function' ? fillTemplate(el, T0.html(el)) : fillTemplate(el, T0.html);
  return node;
}
function sizeNode(node, el){
  node.style.left = el.x + 'px'; node.style.top = el.y + 'px';
  node.style.width = el.w + 'px'; node.style.height = el.h + 'px';
}
function renderLayer(){
  nodes.clear(); elLayer.textContent = '';
  for (const el of S.els){ const n = makeNode(el); nodes.set(el.id, n); elLayer.appendChild(n); }
}
function rebuild(){ renderLayer(); refreshSel(); positionCtx(); }

/* ---------------- selection & handles ---------------- */
const HANDLE_DIRS = ['n','s','e','w','nw','ne','sw','se'];
function refreshSel(){
  for (const [id,node] of nodes){
    const on = S.sel.has(id);
    node.classList.toggle('selected', on);
    node.querySelectorAll('.eh').forEach(h => h.remove());
    if (on && !elById(id).locked)
      for (const d of HANDLE_DIRS){ const h = document.createElement('div'); h.className = 'eh ' + d; h.dataset.dir = d; node.appendChild(h); }
  }
  updateCtx();
}
function select(id, additive){
  if (!additive) S.sel.clear();
  if (S.sel.has(id) && additive) S.sel.delete(id); else S.sel.add(id);
  refreshSel();
}
function deleteSel(){
  if (!S.sel.size) return;
  S.els = S.els.filter(e => !S.sel.has(e.id) || e.locked);
  S.sel = new Set([...S.sel].filter(id => elById(id)?.locked));
  rebuild(); pushHistory();
}
function duplicateSel(){
  if (!S.sel.size) return;
  const clones = S.els.filter(e => S.sel.has(e.id)).map(e => ({ ...e, id:uid(), x:e.x+16, y:e.y+16, parts:{...(e.parts||{})} }));
  S.els.push(...clones);
  S.sel = new Set(clones.map(c => c.id));
  rebuild(); pushHistory(); fitPageGrow();
}
function zOrder(front){
  const moved = S.els.filter(e => S.sel.has(e.id));
  S.els = S.els.filter(e => !S.sel.has(e.id));
  if (front) S.els.push(...moved); else S.els.unshift(...moved);
  rebuild(); pushHistory();
}

/* ---------------- placement ---------------- */
function createEl(type, x, y){
  const T0 = TYPES[type];
  const w = T0.full ? S.page.w : T0.w, h = T0.h;
  const el = { id:uid(), type, x:Math.round(x), y:Math.round(y), w, h,
               fs:T0.fs, parts:{...(T0.parts||{})} };
  if (type === 'qr') el.cells = qrCells();
  return el;
}
function placeAt(type, cx, cy){
  const T0 = TYPES[type];
  const w = T0.full ? S.page.w : T0.w, h = T0.h;
  const x = T0.full ? 0 : clamp(cx - w/2, 0, S.page.w - w);
  const y = clamp(cy - h/2, 0, S.page.h - h);
  const el = createEl(type, T0.full ? 0 : x, y);
  S.els.push(el);
  S.sel = new Set([el.id]);
  rebuild(); pushHistory(); fitPageGrow();
}
function fitPageGrow(){
  let maxB = 400;
  for (const e of S.els) maxB = Math.max(maxB, e.y + e.h);
  const need = maxB + 80;
  if (S.page.h < need){ S.page.h = Math.min(8000, need); syncDims(); applyZoom(); }
}

/* tool arming */
function armTool(type){
  S.tool = type;
  document.body.classList.add('placing');
  $$('.pal-tile').forEach(t => t.classList.toggle('armed', t.dataset.type === type));
  const g = $('#placeGhost');
  const T0 = TYPES[type];
  g.style.width  = (T0.full ? S.page.w : T0.w) * S.zoom + 'px';
  g.style.height = T0.h * S.zoom + 'px';
  g.textContent = T0.name;
}
function disarmTool(){
  S.tool = null;
  document.body.classList.remove('placing');
  $$('.pal-tile').forEach(t => t.classList.remove('armed'));
  $('#placeGhost').hidden = true;
}

/* ---------------- palette ---------------- */
function renderPalette(filter){
  const pal = $('#palette'); pal.textContent = '';
  const q = (filter||'').trim().toLowerCase();
  let shown = 0;
  for (const cat of CATS){
    const items = Object.values(TYPES).filter(t => t.cat === cat &&
      (!q || (t.name + ' ' + (t.kw||'') + ' ' + t.type).toLowerCase().includes(q)));
    if (!items.length) continue;
    const h = document.createElement('div'); h.className = 'pal-head'; h.textContent = cat; pal.appendChild(h);
    for (const t of items){
      const row = document.createElement('div');
      row.className = 'pal-tile'; row.draggable = true; row.dataset.type = t.type; row.title = 'Drag onto the page, or click then click the page';
      row.innerHTML = svgIcon(PAL_ICONS[t.type] || PAL_ICONS.box) + `<span>${esc(t.name)}</span>`;
      pal.appendChild(row); shown++;
    }
  }
  if (!shown){ const e = document.createElement('div'); e.className='pal-empty'; e.textContent='No matches.'; pal.appendChild(e); }
}

/* ---------------- pointer interactions ---------------- */
let drag = null;   // {mode:'move'|'resize', ...}
let marq = null;

elLayer.addEventListener('pointerdown', e => {
  if (S.tool) return; // handled by pageContent click
  const editing = e.target.closest('[contenteditable="true"]');
  if (editing) return;
  // committing focus first means click-away from an inline edit always saves
  if (document.activeElement?.isContentEditable) document.activeElement.blur();

  const handle = e.target.closest('.eh');
  const node = e.target.closest('.el');
  if (!node) return;
  const el = elById(node.dataset.id);
  if (!el) return;

  if (handle && !el.locked){
    const dirs = handle.dataset.dir;
    drag = { mode:'resize', id:el.id, dirs, sx:e.clientX, sy:e.clientY,
             orig:{ x:el.x, y:el.y, w:el.w, h:el.h }, moved:false, aspect:!!TYPES[el.type].aspect };
    e.preventDefault();
    return;
  }
  if (el.locked){ select(el.id, e.shiftKey); return; }

  // prepare move of the whole selection
  if (!S.sel.has(el.id)) select(el.id, e.shiftKey);
  const moving = S.els.filter(x => S.sel.has(x.id) && !x.locked);
  let dupMap = null;
  if (e.altKey){
    const clones = moving.map(x => ({ ...x, id:uid(), parts:{...(x.parts||{})}, cells:x.cells && x.cells.slice() }));
    S.els.push(...clones);
    S.sel = new Set(clones.map(c => c.id));
    renderLayer();
    dupMap = clones.map(c => ({ id:c.id }));
    moving.length = 0;
    for (const c of clones) moving.push(c);
  }
  drag = { mode:'move', sx:e.clientX, sy:e.clientY, moved:false, shift:e.shiftKey,
           items: moving.map(x => ({ id:x.id, x:x.x, y:x.y })), ids:new Set(moving.map(x=>x.id)) };
  e.preventDefault();
});

window.addEventListener('pointermove', e => {
  if (S.tool && !marq && !drag){
    const g = $('#placeGhost'); g.hidden = false;
    g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px';
  }
  if (!drag) return;
  const dx = (e.clientX - drag.sx) / S.zoom, dy = (e.clientY - drag.sy) / S.zoom;
  if (!drag.moved && Math.hypot(dx,dy) * S.zoom < 3) return;
  drag.moved = true;
  $('#ctxToolbar').hidden = true;
  fxLayer.textContent = '';

  if (drag.mode === 'move'){
    let ox = dx, oy = dy;
    if (S.snap){
      const first = drag.items[0];
      const base = elById(first.id);
      ox = first.x + dx; oy = first.y + dy;
      const r = snapRect(ox, oy, base.w, base.h, drag.ids);
      ox = r.x - first.x; oy = r.y - first.y;
      drawGuides(r.gx, r.gy);
    }
    for (const it of drag.items){
      const el = elById(it.id); if (!el) continue;
      el.x = Math.round(it.x + ox); el.y = Math.round(it.y + oy);
      sizeNode(nodes.get(it.id), el);
    }
  } else {
    const el = elById(drag.id); const o = drag.orig;
    let { x,y,w,h } = o;
    const d = drag.dirs;
    if (d.includes('e')) w = o.w + dx;
    if (d.includes('s')) h = o.h + dy;
    if (d.includes('w')) { w = o.w - dx; x = o.x + dx; }
    if (d.includes('n')) { h = o.h - dy; y = o.y + dy; }
    if (drag.aspect){
      const ratio = o.w / o.h;
      if (Math.abs(w - o.w) >= Math.abs(h - o.h)){ h = w / ratio; } else { w = h * ratio; }
      if (d.includes('w')) x = o.x + o.w - w;
      if (d.includes('n')) y = o.y + o.h - h;
    }
    if (w < 10){ if (d.includes('w')) x = o.x + o.w - 10; w = 10; }
    if (h < 10){ if (d.includes('n')) y = o.y + o.h - 10; h = 10; }
    el.x = Math.round(x); el.y = Math.round(y); el.w = Math.round(w); el.h = Math.round(h);
    sizeNode(nodes.get(el.id), el);
  }
});

window.addEventListener('pointerup', e => {
  if (!drag) return;
  const d = drag; drag = null;
  fxLayer.textContent = '';
  if (!d.moved){
    if (d.mode === 'move'){ if (d.shift !== undefined && e.altKey === false) { /* selection already set on down */ } }
    positionCtx();
    return;
  }
  rebuild();
  fitPageGrow();
  pushHistory();
});

/* guides */
function snapRect(x, y, w, h, ids){
  const G = 5 / S.zoom;
  let gx = null, gy = null, bestX = G, bestY = G;
  const targetsX = [S.page.w/2], targetsY = [];
  for (const el of S.els){
    if (ids.has(el.id) || el.locked) continue;
    targetsX.push(el.x, el.x + el.w/2, el.x + el.w);
    targetsY.push(el.y, el.y + el.h/2, el.y + el.h);
  }
  const edgesX = [[x,0],[x+w/2,1],[x+w,2]];
  for (const [v,k] of edgesX) for (const t of targetsX){
    if (Math.abs(v-t) < bestX){ bestX = Math.abs(v-t); gx = { t, k }; }
  }
  const edgesY = [[y,0],[y+h/2,1],[y+h,2]];
  for (const [v,k] of edgesY) for (const t of targetsY){
    if (Math.abs(v-t) < bestY){ bestY = Math.abs(v-t); gy = { t, k }; }
  }
  const offX = k => k === 0 ? 0 : k === 1 ? -w/2 : -w;
  const offY = k => k === 0 ? 0 : k === 1 ? -h/2 : -h;
  const rx = gx ? gx.t + offX(gx.k) : x;
  const ry = gy ? gy.t + offY(gy.k) : y;
  return { x:rx, y:ry, gx:gx?.t, gy:gy?.t };
}
function drawGuides(gx, gy){
  if (gx != null){
    const g = document.createElement('div'); g.className = 'guide v';
    g.style.left = gx + 'px'; g.style.top = 0; g.style.height = S.page.h + 'px';
    fxLayer.appendChild(g);
  }
  if (gy != null){
    const g = document.createElement('div'); g.className = 'guide h';
    g.style.top = gy + 'px'; g.style.left = 0; g.style.width = S.page.w + 'px';
    fxLayer.appendChild(g);
  }
}

/* page-level: placement clicks + marquee */
pageContent.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const onEl = e.target.closest('.el');
  if (S.tool && !onEl){
    const pr = pageContent.getBoundingClientRect();
    placeAt(S.tool, (e.clientX - pr.left)/S.zoom, (e.clientY - pr.top)/S.zoom);
    if (!e.shiftKey) disarmTool();
    return;
  }
  if (!onEl && !e.target.closest('[contenteditable="true"]') && !S.tool){
    if (!e.shiftKey){ S.sel.clear(); refreshSel(); }
    marq = { sx:e.clientX, sy:e.clientY, x:e.clientX, y:e.clientY, shift:e.shiftKey };
    const m = $('#marquee'); m.hidden = false;
    Object.assign(m.style, { left:e.clientX+'px', top:e.clientY+'px', width:'0px', height:'0px' });
  }
});
window.addEventListener('pointermove', e => {
  if (!marq) return;
  marq.x = e.clientX; marq.y = e.clientY;
  const m = $('#marquee');
  Object.assign(m.style, {
    left: Math.min(marq.sx, marq.x)+'px', top: Math.min(marq.sy, marq.y)+'px',
    width: Math.abs(marq.x-marq.sx)+'px', height: Math.abs(marq.y-marq.sy)+'px'
  });
});
window.addEventListener('pointerup', e => {
  if (!marq) return;
  const m = $('#marquee'); m.hidden = true;
  const pr = pageContent.getBoundingClientRect();
  const x1 = (Math.min(marq.sx, marq.x) - pr.left)/S.zoom, x2 = (Math.max(marq.sx, marq.x) - pr.left)/S.zoom;
  const y1 = (Math.min(marq.sy, marq.y) - pr.top)/S.zoom,  y2 = (Math.max(marq.sy, marq.y) - pr.top)/S.zoom;
  if (Math.abs(marq.x-marq.sx) > 4 || Math.abs(marq.y-marq.sy) > 4){
    if (!marq.shift) S.sel.clear();
    for (const el of S.els)
      if (el.x < x2 && el.x + el.w > x1 && el.y < y2 && el.y + el.h > y1) S.sel.add(el.id);
    refreshSel();
  }
  marq = null;
});

/* drag & drop from palette */
document.addEventListener('dragstart', e => {
  const tile = e.target.closest('.pal-tile'); if (!tile) return;
  e.dataTransfer.setData('text/plain', tile.dataset.type);
  e.dataTransfer.effectAllowed = 'copy';
});
pageContent.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; pageEl.classList.add('drop-target'); });
pageEl.addEventListener('dragleave', () => pageEl.classList.remove('drop-target'));
pageContent.addEventListener('drop', e => {
  e.preventDefault(); pageEl.classList.remove('drop-target');
  const type = e.dataTransfer.getData('text/plain');
  if (!TYPES[type]) return;
  const pr = pageContent.getBoundingClientRect();
  placeAt(type, (e.clientX - pr.left)/S.zoom, (e.clientY - pr.top)/S.zoom);
});

/* palette interactions */
$('#palette').addEventListener('click', e => {
  const tile = e.target.closest('.pal-tile'); if (!tile) return;
  const type = tile.dataset.type;
  if (S.tool === type) disarmTool(); else armTool(type);
});
$('#paletteSearch').addEventListener('input', e => renderPalette(e.target.value));
$('#paletteSearch').addEventListener('keydown', e => { if (e.key === 'Escape'){ e.target.value=''; renderPalette(''); e.target.blur(); } });

/* ---------------- text editing ---------------- */
elLayer.addEventListener('dblclick', e => {
  let t = e.target.closest('[data-t]');
  if (!t){
    // double-clicking a placeholder bar (nav links, breadcrumbs) edits its label
    const bar = e.target.closest('.bar');
    if (bar) t = bar.parentElement.querySelector('[data-t]');
  }
  if (!t) return;
  const node = t.closest('.el'); const el = elById(node.dataset.id); if (!el || el.locked) return;
  t.setAttribute('contenteditable', 'true');
  t.classList.add('editing');
  t.focus();
  const r = document.createRange(); r.selectNodeContents(t);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
});
elLayer.addEventListener('keydown', e => {
  const t = e.target;
  if (!t.isContentEditable) return;
  if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); t.blur(); }
  if (e.key === 'Escape'){ t.blur(); }
  e.stopPropagation();
});
elLayer.addEventListener('focusout', e => {
  const t = e.target;
  if (!t.isContentEditable) return;
  t.removeAttribute('contenteditable');
  t.classList.remove('editing');
  const node = t.closest('.el'); const el = elById(node.dataset.id);
  if (el && t.dataset.t){
    if (!el.parts) el.parts = {};
    el.parts[t.dataset.t] = t.innerText.replace(/\n{2,}/g, '\n');
    renderElement(el);
    refreshSel();
    pushHistory();
  }
});
function renderElement(el){
  const old = nodes.get(el.id); if (!old) return;
  const fresh = makeNode(el);
  nodes.set(el.id, fresh);
  elLayer.replaceChild(fresh, old);
}

/* ---------------- context toolbar ---------------- */
const FILLS = [
  { c:'#d7dade', label:'Light grey' },
  { c:'#ffffff', label:'White' },
  { c:'#3a3f47', label:'Dark' },
  { none:true,    label:'No fill' },
];
let ctxBuilt = false;
function buildCtx(){
  const bar = $('#ctxToolbar');
  bar.innerHTML = '';
  const mk = (html, cls, title) => { const b = document.createElement('button'); b.className = 'ct-btn ' + (cls||''); b.innerHTML = html; if (title) b.title = title; return b; };
  for (const f of FILLS){
    const sw = document.createElement('div');
    sw.className = 'sw' + (f.none ? ' sw-none' : ''); sw.title = f.label;
    if (!f.none) sw.style.background = f.c;
    sw.addEventListener('click', () => {
      for (const id of S.sel){ const el = elById(id); if (!el) continue;
        if (f.none){ el.fill = 'transparent'; el.stroke = 'transparent'; el.sw = 0; }
        else { el.fill = f.c; el.stroke = f.none ? 'transparent' : '#b4babf'; el.sw = 1.5;
               if (f.c === '#3a3f47') el.stroke = 'transparent'; }
        renderElement(el);
      }
      refreshSel(); pushHistory();
    });
    bar.appendChild(sw);
  }
  bar.appendChild(Object.assign(document.createElement('span'), { className:'ct-sep' }));

  const opLbl = document.createElement('label'); opLbl.innerHTML = `<span>Fade</span>`;
  const op = document.createElement('input'); op.type = 'range'; op.min = 10; op.max = 100; op.value = 100; op.title = 'Opacity';
  let opTimer = null;
  op.addEventListener('input', () => {
    for (const id of S.sel){ const el = elById(id); if (!el) continue; el.op = op.value/100;
      const n = nodes.get(id); if (n) n.style.opacity = el.op; }
    clearTimeout(opTimer); opTimer = setTimeout(pushHistory, 300);
  });
  opLbl.appendChild(op); bar.appendChild(opLbl);

  const selEls = [...S.sel].map(id => elById(id)).filter(Boolean);
  const hasText = selEls.some(e => TYPES[e.type]?.parts);
  const hasImage = selEls.some(e => e.type === 'image');

  if (hasText){
    const fLbl = document.createElement('label'); fLbl.title = 'Font';
    const fSel = document.createElement('select'); fSel.className = 'ct-sel';
    fSel.innerHTML = '<option value="">Font</option><option value="sans">Sans</option><option value="serif">Serif</option><option value="mono">Mono</option><option value="round">Playful</option>';
    fSel.value = selEls[0].font || '';
    fSel.addEventListener('change', () => {
      for (const el of selEls){ el.font = fSel.value;
        const n = nodes.get(el.id); if (n) n.style.fontFamily = fSel.value ? FONTMAP[fSel.value] : ''; }
      pushHistory();
    });
    fLbl.appendChild(fSel); bar.appendChild(fLbl);

    const fsLbl = document.createElement('label'); fsLbl.innerHTML = `<span>Size</span>`;
    const fs = document.createElement('input'); fs.type = 'range'; fs.min = 9; fs.max = 64; fs.value = 15; fs.title = 'Text size';
    let fsTimer = null;
    fs.addEventListener('input', () => {
      for (const el of selEls){ el.fs = +fs.value;
        const n = nodes.get(el.id); if (n) n.style.setProperty('--fs', el.fs+'px'); }
      clearTimeout(fsTimer); fsTimer = setTimeout(() => { rebuild(); pushHistory(); }, 250);
    });
    fsLbl.appendChild(fs); bar.appendChild(fsLbl);
  }

  if (hasImage){
    bar.appendChild(Object.assign(document.createElement('span'), { className:'ct-sep' }));
    const styles = [
      { v:'cross', title:'Image style: X cross', svg:'<rect x="2.5" y="3.5" width="11" height="9" rx="1"/><path d="M3 4l10 8M13 4 3 12"/>' },
      { v:'icon',  title:'Image style: photo icon', svg:'<rect x="2.5" y="3.5" width="11" height="9" rx="1"/><circle cx="6" cy="6.5" r="1.2"/><path d="M3.5 11.5 7 8l2 2 2-1.8 2.5 3.3"/>' },
      { v:'plain', title:'Image style: plain fill', svg:'<rect x="2.5" y="3.5" width="11" height="9" rx="1" fill="currentColor" stroke="none"/>' },
    ];
    for (const st of styles){
      const b = mk(svgIcon(st.svg), '', st.title);
      b.addEventListener('click', () => {
        for (const el of selEls) if (el.type === 'image'){ el.imgStyle = st.v; renderElement(el); }
        refreshSel(); pushHistory();
      });
      bar.appendChild(b);
    }
  }

  bar.appendChild(Object.assign(document.createElement('span'), { className:'ct-sep' }));
  const count = document.createElement('span'); count.className = 'ct-count'; count.id = 'ctxCount'; bar.appendChild(count);

  bar.appendChild(mk(svgIcon('<path d="M3 11.5h10M6 3.5 3 6.5l3 3"/>'), '', 'Send to back ( [ )')).addEventListener('click', () => zOrder(false));
  bar.appendChild(mk(svgIcon('<path d="M3 4.5h10M10 12.5l3-3-3-3"/>'), '', 'Bring to front ( ] )')).addEventListener('click', () => zOrder(true));
  bar.appendChild(mk(svgIcon('<rect x="5.5" y="2.5" width="8" height="8" rx="1"/><path d="M2.5 5.5v7a1 1 0 0 0 1 1h7"/>'), '', 'Duplicate (Ctrl+D)')).addEventListener('click', duplicateSel);
  bar.appendChild(mk(svgIcon('<rect x="4.5" y="7" width="7" height="6" rx="1"/><path d="M6 7V5a2 2 0 0 1 4 0v2"/>'), '', 'Lock / unlock')).addEventListener('click', () => {
    for (const id of S.sel){ const el = elById(id); if (el) el.locked = !el.locked; }
    rebuild(); pushHistory();
  });
  bar.appendChild(mk(svgIcon('<path d="M3.5 4.5h9M6.5 2.5h3M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"/>'), 'danger', 'Delete (Del)')).addEventListener('click', deleteSel);
  ctxBuilt = true;
}
function updateCtx(){
  if (!S.sel.size){ $('#ctxToolbar').hidden = true; return; }
  buildCtx();
  const c = $('#ctxCount'); c.textContent = S.sel.size > 1 ? S.sel.size + ' selected' : '';
  // sync sliders
  const first = elById([...S.sel][0]);
  const ranges = $$('#ctxToolbar input[type=range]');
  if (ranges[0]) ranges[0].value = Math.round((first?.op ?? 1)*100);
  if (ranges[1]) ranges[1].value = first?.fs || TYPES[first?.type]?.fs || 15;
  const fSel = $('#ctxToolbar .ct-sel'); if (fSel) fSel.value = first?.font || '';
  positionCtx();
}
function positionCtx(){
  const bar = $('#ctxToolbar');
  if (!S.sel.size || drag || marq){ bar.hidden = true; return; }
  // make measurable first (hidden => zero size)
  bar.hidden = false; bar.style.left = '-9999px'; bar.style.top = '-9999px';
  const bw = bar.offsetWidth, bh = bar.offsetHeight;
  const pr = pageContent.getBoundingClientRect();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of S.sel){
    const el = elById(id); if (!el) continue;
    minX = Math.min(minX, el.x); minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.w); maxY = Math.max(maxY, el.y + el.h);
  }
  if (!isFinite(minX)){ bar.hidden = true; return; }
  const cx = (minX + maxX)/2 * S.zoom + pr.left;
  let top = minY * S.zoom + pr.top - bh - 10;
  if (top < 52) top = maxY * S.zoom + pr.top + 12;
  bar.style.left = clamp(cx - bw/2, 6, innerWidth - bw - 6) + 'px';
  bar.style.top  = clamp(top, 52, innerHeight - bh - 6) + 'px';
}
window.addEventListener('scroll', () => { positionCtx(); }, true);
window.addEventListener('resize', () => { applyZoom(); positionCtx(); });

/* ---------------- zoom & page size ---------------- */
function applyZoom(){
  const z = S.zoom;
  pageEl.style.width  = S.page.w * z + 'px';
  pageEl.style.height = S.page.h * z + 'px';
  pageContent.style.width  = S.page.w + 'px';
  pageContent.style.height = S.page.h + 'px';
  pageContent.style.transform = `scale(${z})`;
  spacer.style.width  = S.page.w * z + 140 + 'px';
  spacer.style.height = S.page.h * z + 80 + 'px';
  $('#zoomLabel').textContent = Math.round(z*100) + '%';
  if (S.tool) armTool(S.tool);
}
function setZoom(z, cx, cy){
  const old = S.zoom; z = clamp(z, .2, 3);
  if (z === old) return;
  const rect = workspace.getBoundingClientRect();
  const ax = cx != null ? cx - rect.left : workspace.clientWidth/2;
  const ay = cy != null ? cy - rect.top  : workspace.clientHeight/2;
  const wx = (workspace.scrollLeft + ax) / old, wy = (workspace.scrollTop + ay) / old;
  S.zoom = z; applyZoom();
  workspace.scrollLeft = wx*z - ax;
  workspace.scrollTop  = wy*z - ay;
  positionCtx(); saveSoon();
}
workspace.addEventListener('wheel', e => {
  if (!e.ctrlKey && !e.metaKey) return;
  e.preventDefault();
  const f = e.deltaY < 0 ? 1.12 : 1/1.12;
  setZoom(S.zoom * f, e.clientX, e.clientY);
}, { passive:false });

function syncDims(){
  $('#pageW').value = S.page.w; $('#pageH').value = S.page.h;
  $$('.devices .dev').forEach(b => b.classList.toggle('on', +b.dataset.w === S.page.w));
}
$('#pageW').addEventListener('change', e => { S.page.w = clamp(+e.target.value || 1440, 200, 4000); syncDims(); applyZoom(); positionCtx(); pushHistory(); });
$('#pageH').addEventListener('change', e => { S.page.h = clamp(+e.target.value || 1200, 300, 8000); syncDims(); applyZoom(); positionCtx(); pushHistory(); });
$$('.devices .dev').forEach(b => b.addEventListener('click', () => { S.page.w = +b.dataset.w; syncDims(); applyZoom(); positionCtx(); pushHistory(); }));

/* ---------------- topbar buttons ---------------- */
$('#btnUndo').innerHTML = svgIcon('<path d="M5.5 4.5 2.5 7.5l3 3M3 7.5h7a3.5 3.5 0 0 1 0 7H6.5"/>');
$('#btnRedo').innerHTML = svgIcon('<path d="M10.5 4.5l3 3-3 3M13 7.5H6a3.5 3.5 0 0 0 0 7h3.5"/>');
$('#btnZoomIn').innerHTML  = svgIcon('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14M5 7h4M7 5v4"/>');
$('#btnZoomOut').innerHTML = svgIcon('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14M5 7h4"/>');
$('#btnGrid').innerHTML = svgIcon('<path d="M2.5 2.5h11v11h-11zM6.2 2.5v11M9.8 2.5v11M2.5 6.2h11M2.5 9.8h11"/>');
$('#btnSnap').innerHTML = svgIcon('<path d="M4 2.5v6a3.5 3.5 0 0 0 7 0v-2"/><circle cx="4" cy="12.5" r="1.5"/>');
$('#btnHelp').innerHTML = svgIcon('<circle cx="8" cy="8" r="5.8"/><path d="M6.3 6.2a1.8 1.8 0 0 1 3.4.6c0 1.2-1.7 1.4-1.7 2.6M8 11.6h.01"/>');
$('#btnClear').innerHTML = svgIcon('<path d="M3.5 4.5h9M6.5 2.5h3M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"/>');
$('#btnUndo').addEventListener('click', undo);
$('#btnRedo').addEventListener('click', redo);
$('#btnZoomIn').addEventListener('click', () => setZoom(S.zoom * 1.2, innerWidth/2, innerHeight/2));
$('#btnZoomOut').addEventListener('click', () => setZoom(S.zoom / 1.2, innerWidth/2, innerHeight/2));
$('#btnGrid').addEventListener('click', () => { S.grid = !S.grid; pageEl.classList.toggle('grid', S.grid); $('#btnGrid').classList.toggle('on', S.grid); saveSoon(); });
$('#btnSnap').addEventListener('click', () => { S.snap = !S.snap; $('#btnSnap').classList.toggle('on', S.snap); toast(S.snap ? 'Snap to grid: on' : 'Snap to grid: off'); saveSoon(); });
$('#btnClear').addEventListener('click', () => {
  if (!S.els.length) return;
  if (confirm('Remove every element from the page?')){ S.els = []; S.sel.clear(); rebuild(); pushHistory(); }
});
$('#btnHelp').addEventListener('click', () => $('#helpModal').hidden = false);
$('#helpClose').addEventListener('click', () => $('#helpModal').hidden = true);
$('#helpModal').addEventListener('pointerdown', e => { if (e.target.id === 'helpModal') $('#helpModal').hidden = true; });

/* file menu + templates */
$('#btnNew').addEventListener('click', e => { e.stopPropagation(); $('#fileMenu').hidden = !$('#fileMenu').hidden; });
document.addEventListener('click', e => { if (!e.target.closest('#fileMenuWrap')) $('#fileMenu').hidden = true; });
$('#fileMenu').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('#fileMenu').hidden = true;
  const tpl = b.dataset.tpl;
  if (!S.els.length || confirm('Start a new page? The current one will be replaced (undo still works).')){
    loadTemplate(tpl);
  }
});

/* import / export */
$('#btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ v:1, page:S.page, els:S.els }, null, 1)], { type:'application/json' });
  downloadURL(URL.createObjectURL(blob), 'wireframe.json');
  toast('JSON exported');
});
$('#btnImport').addEventListener('click', () => $('#fileInput').click());
$('#fileInput').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!Array.isArray(d.els)) throw 0;
    S.els = d.els.filter(el => TYPES[el.type]);
    if (d.page) S.page = { w:clamp(d.page.w||1440,200,4000), h:clamp(d.page.h||1200,300,8000) };
    for (const el of S.els){ const n = parseInt(String(el.id).slice(1)); if (n >= idSeq) idSeq = n+1; }
    S.sel.clear(); rebuild(); syncDims(); applyZoom(); pushHistory();
    toast('Wireframe imported');
  } catch(err){ toast('Could not read that file'); }
  e.target.value = '';
});
function downloadURL(url, name){
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}
$('#btnPng').addEventListener('click', exportPNG);

/* ---------------- keyboard ---------------- */
window.addEventListener('keydown', e => {
  if (document.activeElement?.isContentEditable) return;
  const inInput = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');
  const mod = e.ctrlKey || e.metaKey;

  if (e.key === 'Escape'){ disarmTool(); S.sel.clear(); refreshSel(); $('#helpModal').hidden = true; $('#fileMenu').hidden = true; return; }
  if (inInput) return;
  if (e.key === '?'){ $('#helpModal').hidden = false; return; }

  if (mod && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y'){ e.preventDefault(); redo(); return; }
  if (mod && e.key.toLowerCase() === 'd'){ e.preventDefault(); duplicateSel(); return; }
  if (mod && e.key.toLowerCase() === 'a'){ e.preventDefault(); S.sel = new Set(S.els.map(x=>x.id)); refreshSel(); return; }
  if (mod && e.key.toLowerCase() === 'c'){ S.clip = S.els.filter(x=>S.sel.has(x.id)).map(x=>JSON.parse(JSON.stringify(x))); toast('Copied'); return; }
  if (mod && e.key.toLowerCase() === 'v'){
    if (!S.clip?.length) return;
    const clones = S.clip.map(x => { const c = JSON.parse(JSON.stringify(x)); c.id = uid(); c.x += 16; c.y += 16; return c; });
    S.els.push(...clones); S.sel = new Set(clones.map(c=>c.id));
    rebuild(); pushHistory(); fitPageGrow(); return;
  }
  if (mod && e.key.toLowerCase() === 's'){ e.preventDefault(); toast('Saved automatically'); return; }
  if (mod && (e.key === '=' || e.key === '+')){ e.preventDefault(); setZoom(S.zoom*1.2, innerWidth/2, innerHeight/2); return; }
  if (mod && e.key === '-'){ e.preventDefault(); setZoom(S.zoom/1.2, innerWidth/2, innerHeight/2); return; }
  if (mod && e.key === '0'){ e.preventDefault(); setZoom(1, innerWidth/2, innerHeight/2); return; }

  if (e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); deleteSel(); return; }
  if (e.key === '['){ zOrder(false); return; }
  if (e.key === ']'){ zOrder(true); return; }
  if (e.key.toLowerCase() === 'g'){ $('#btnGrid').click(); return; }
  if (e.key.toLowerCase() === 's'){ $('#btnSnap').click(); return; }

  if (e.key.startsWith('Arrow') && S.sel.size){
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    const dx = (e.key === 'ArrowRight') - (e.key === 'ArrowLeft');
    const dy = (e.key === 'ArrowDown') - (e.key === 'ArrowUp');
    for (const id of S.sel){ const el = elById(id); if (!el || el.locked) continue;
      el.x += dx*step; el.y += dy*step; sizeNode(nodes.get(id), el); }
    positionCtx(); pushHistory();
  }
});

/* ---------------- templates ---------------- */
function A(type, x, y, w, h, parts){
  const t = TYPES[type];
  return { id:uid(), type, x, y, w: w ?? t.w, h: h ?? t.h, fs:t.fs, parts:{ ...(t.parts||{}), ...(parts||{}) } };
}
function loadTemplate(name){
  const P = { w:1440, h:1200 };
  let els = [];
  const M = 60; // margin
  if (name === 'blank'){ els = []; P.h = 1000; }
  if (name === 'landing'){
    els = [
      A('navbar', 0, 0, P.w, 64),
      A('hero', M, 120, 700, 460),
      A('headline', 820, 140, 520, 90, { t:'A clean canvas for planning any website' }),
      A('para', 820, 250, 500, 150),
      A('button', 820, 430, 160, 44, { t:'Start planning' }),
      A('cardgrid', M, 640, P.w - M*2, 320),
      A('footer', 0, 1020, P.w, 200),
    ];
    P.h = 1360;
  }
  if (name === 'shop'){
    els = [
      A('navbar', 0, 0, P.w, 64),
      A('breadcrumb', M, 96, 420, 28),
      A('image', M, 150, 560, 420),
      A('headline', 700, 160, 640, 60, { t:'Product name goes here' }),
      A('text', 700, 236, 200, 40, { t:'$89.00' }),
      A('para', 700, 300, 620, 160),
      A('select', 700, 490, 220, 40),
      A('button', 700, 550, 190, 46, { t:'Add to cart' }),
      A('check', 910, 560, 200, 28, { t:'Gift wrapping' }),
      A('headline', M, 660, 400, 46, { t:'You may also like' }),
      A('product', M, 730, 300, 330),
      A('product', M+330, 730, 300, 330),
      A('product', M+660, 730, 300, 330),
      A('product', M+990, 730, 300, 330),
      A('footer', 0, 1120, P.w, 200),
    ];
    P.h = 1460;
  }
  if (name === 'blog'){
    els = [
      A('navbar', 0, 0, P.w, 64),
      A('headline', M, 110, 900, 80, { t:'An honest headline that earns the click' }),
      A('text', M, 210, 500, 26, { t:'By Alex Planner · 6 min read' }),
      A('image', M, 270, P.w - M*2, 420),
      A('para', M, 740, P.w - M*2, 220),
      A('quote', 300, 1010, P.w - 600, 110),
      A('para', M, 1170, P.w - M*2, 220),
      A('tabs', M, 1440, 480, 44),
      A('footer', 0, 1540, P.w, 200),
    ];
    P.h = 1880;
  }
  if (name === 'contact'){
    els = [
      A('navbar', 0, 0, P.w, 64),
      A('headline', 470, 140, 500, 60, { t:'Get in touch' }),
      A('para', 540, 220, 360, 100),
      A('form', 470, 360, 500, 420, {}),
      A('social', 660, 830, 170, 40),
      A('footer', 0, 940, P.w, 200),
    ];
    P.h = 1280;
  }
  if (name === 'mobile'){
    const M2 = 15;
    P.w = 390; P.h = 1500;
    els = [
      A('hambarnav', 0, 0, 390, 56),
      A('mobhero', M2, 86, 360, 420),
      A('headline', M2, 540, 340, 44, { t:'What we offer' }),
      A('card', M2, 600, 360, 300),
      A('listrows', M2, 930, 360, 230),
      A('fab', 305, 1190, 56, 56),
      A('bottomnav', 0, 1390, 390, 58),
    ];
  }
  S.els = els; S.page = P; S.sel.clear();
  rebuild(); syncDims(); applyZoom(); pushHistory();
}

/* ---------------- PNG export (walks the live DOM) ---------------- */
function parseRGBA(str){
  const m = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[\s,/]+([\d.]+))?\)/.exec(str || '');
  if (!m) return null;
  return { r:+m[1], g:+m[2], b:+m[3], a: m[4] != null ? +m[4] : 1 };
}
function rrPath(ctx, x, y, w, h, r){
  r = Math.min(r, w/2, h/2); if (r < 0) r = 0;
  if (ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}
function modelRect(r, pr){
  return { x:(r.left-pr.left)/S.zoom, y:(r.top-pr.top)/S.zoom, w:r.width/S.zoom, h:r.height/S.zoom };
}
function exportPNG(){
  const hadSel = new Set(S.sel);
  $('#ctxToolbar').hidden = true;
  S.sel.clear(); refreshSel();           // removes .selected + .eh handles
  const s = 2, W = S.page.w, H = S.page.h;
  const canvas = document.createElement('canvas'); canvas.width = W*s; canvas.height = H*s;
  const ctx = canvas.getContext('2d');
  ctx.scale(s, s);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  const pr = pageContent.getBoundingClientRect();
  for (const el of S.els){
    const node = nodes.get(el.id);
    if (node) drawSubtree(ctx, node, pr, 1, node);
  }
  S.sel = hadSel; refreshSel();
  canvas.toBlob(b => { downloadURL(URL.createObjectURL(b), 'wireframe.png'); toast('PNG exported'); });
}
function modelRectOf(r, pr){
  return { x:(r.left-pr.left)/S.zoom, y:(r.top-pr.top)/S.zoom, w:r.width/S.zoom, h:r.height/S.zoom };
}
function drawSubtree(ctx, node, pr, alpha, rootEl){
  const cs = getComputedStyle(node);
  if (cs.display === 'none') return;
  const r = modelRectOf(node.getBoundingClientRect(), pr);
  const a = alpha * (+cs.opacity || 1);

  // fake paragraph text bars
  if (node.classList.contains('bars')){
    const fs = parseFloat(getComputedStyle(rootEl).getPropertyValue('--fs')) || 15;
    const bh = fs*.58, lh = fs*1.45;
    const n = Math.max(1, Math.floor((r.h - bh)/lh) + 1);
    ctx.globalAlpha = a; ctx.fillStyle = '#b8bec6';
    for (let i = 0; i < n; i++)
      ctx.fillRect(r.x, r.y + i*lh, i === n-1 ? r.w*.62 : r.w, bh);
    ctx.globalAlpha = 1;
    return;
  }

  // fill rectangle / circle
  const bg = parseRGBA(cs.backgroundColor);
  if (bg && bg.a > 0 && r.w > 0 && r.h > 0){
    const rad = parseFloat(cs.borderTopLeftRadius) || 0;
    ctx.globalAlpha = a; ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
    if (node.classList.contains('wf-circle') || rad >= Math.min(r.w, r.h)/2 - .5){
      ctx.beginPath(); ctx.ellipse(r.x + r.w/2, r.y + r.h/2, r.w/2, r.h/2, 0, 0, Math.PI*2); ctx.fill();
    } else { rrPath(ctx, r.x, r.y, r.w, r.h, rad); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  // uniform border
  const bw = parseFloat(cs.borderTopWidth) || 0;
  const bc = parseRGBA(cs.borderTopColor);
  if (bw > 0 && bc && bc.a > 0 && !node.classList.contains('wf-circle')){
    const rad = parseFloat(cs.borderTopLeftRadius) || 0;
    ctx.globalAlpha = a; ctx.strokeStyle = `rgb(${bc.r},${bc.g},${bc.b})`; ctx.lineWidth = bw;
    rrPath(ctx, r.x + bw/2, r.y + bw/2, r.w - bw, r.h - bw, rad); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (node.tagName === 'svg'){ drawSVG(ctx, node, r, a); return; }

  if (node.classList.contains('play')){
    ctx.globalAlpha = a; ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + r.h*1.5, r.y + r.h/2); ctx.lineTo(r.x, r.y + r.h);
    ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    return;
  }

  // li markers: bullet dot, or number for ordered lists
  if (node.tagName === 'LI'){
    if (rootEl.classList.contains('wf-olist')){
      const idx = Array.from(node.parentElement.children).indexOf(node) + 1;
      const cs2 = getComputedStyle(node);
      ctx.globalAlpha = a; ctx.fillStyle = '#5d646d';
      ctx.font = `700 ${parseFloat(cs2.fontSize)}px ${cs2.fontFamily}`;
      const rect2 = node.getBoundingClientRect();
      const m2 = modelRectOf(rect2, pr);
      ctx.fillText(idx + '.', m2.x, m2.y + parseFloat(cs2.fontSize)*.85);
      ctx.globalAlpha = 1;
    } else {
      const pb = getComputedStyle(node, '::before');
      const d = parseFloat(pb.width) || 0;
      const col = parseRGBA(pb.backgroundColor);
      if (d > 0 && col){
        ctx.globalAlpha = a; ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
        ctx.beginPath(); ctx.arc(r.x + d/2, r.y + r.h/2, d/2, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  // text held directly by textish nodes
  if (/(el-txt|li-txt|fl|nb-cta|bc-sep|ft-copy|soc|lr-chev|fab-plus)/.test(node.className) && node.textContent.trim()){
    drawNodeText(ctx, node, a, pr);
  }

  for (const child of node.children) drawSubtree(ctx, child, pr, a, rootEl);
}
/* mini SVG renderer: handles rect / circle / path (M L H V C A Z), honor preserveAspectRatio */
function drawSVG(ctx, svg, r, a){
  const vb = (svg.getAttribute('viewBox') || '0 0 100 100').trim().split(/[\s,]+/).map(Number);
  const par = svg.getAttribute('preserveAspectRatio') || 'xMidYMid meet';
  let sx = r.w/vb[2], sy = r.h/vb[3], ox = r.x - vb[0]*sx, oy = r.y - vb[1]*sy;
  if (par.includes('meet')){
    const s = Math.min(sx, sy);
    ox = r.x + (r.w - vb[2]*s)/2 - vb[0]*s;
    oy = r.y + (r.h - vb[3]*s)/2 - vb[1]*s;
    sx = sy = s;
  }
  const X = v => ox + v*sx, Y = v => oy + v*sy, ss = Math.min(sx, sy);
  ctx.globalAlpha = a; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const sh of svg.children){
    const tag = sh.tagName.toLowerCase();
    const fill = sh.getAttribute('fill'), stroke = sh.getAttribute('stroke'), swd = +sh.getAttribute('stroke-width') || 0;
    ctx.fillStyle = fill && fill !== 'none' ? fill : 'rgba(0,0,0,0)';
    ctx.strokeStyle = stroke && stroke !== 'none' ? stroke : 'rgba(0,0,0,0)';
    ctx.lineWidth = swd*ss;
    if (tag === 'rect'){
      const x = X(+sh.getAttribute('x')||0), y = Y(+sh.getAttribute('y')||0);
      const w = (+sh.getAttribute('width')||0)*sx, h = (+sh.getAttribute('height')||0)*sy;
      const rx = (+sh.getAttribute('rx')||0)*ss;
      rrPath(ctx, x, y, w, h, rx);
      if (fill && fill !== 'none') ctx.fill();
      if (stroke && stroke !== 'none' && swd) ctx.stroke();
    } else if (tag === 'circle'){
      ctx.beginPath();
      ctx.arc(X(+sh.getAttribute('cx')||0), Y(+sh.getAttribute('cy')||0), (+sh.getAttribute('r')||0)*ss, 0, Math.PI*2);
      if (fill && fill !== 'none') ctx.fill();
      if (stroke && stroke !== 'none' && swd) ctx.stroke();
    } else if (tag === 'path'){
      runPath(ctx, sh.getAttribute('d') || '', X, Y, sx, sy);
      if (fill && fill !== 'none') ctx.fill();
      if (stroke && stroke !== 'none' && swd) ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
function runPath(ctx, d, X, Y, sx, sy){
  ctx.beginPath();
  const cmds = d.match(/[MLHVCQAZ][^MLHVCQAZ]*/gi) || [];
  let cx = 0, cy = 0, sx0 = 0, sy0 = 0;
  const nums = str => (str.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number);
  for (const cmd of cmds){
    const k = cmd[0], v = nums(cmd.slice(1));
    if (k === 'M'){ cx = X(v[0]); cy = Y(v[1]); sx0 = cx; sy0 = cy; ctx.moveTo(cx, cy);
      for (let i = 2; i+1 < v.length; i += 2){ cx = X(v[i]); cy = Y(v[i+1]); ctx.lineTo(cx, cy); } }
    else if (k === 'L') for (let i = 0; i+1 < v.length; i += 2){ cx = X(v[i]); cy = Y(v[i+1]); ctx.lineTo(cx, cy); }
    else if (k === 'H') for (const n of v){ cx = X(n); ctx.lineTo(cx, cy); }
    else if (k === 'V') for (const n of v){ cy = Y(n); ctx.lineTo(cx, cy); }
    else if (k === 'C') for (let i = 0; i+5 < v.length; i += 6)
      { ctx.bezierCurveTo(X(v[i]), Y(v[i+1]), X(v[i+2]), Y(v[i+3]), X(v[i+4]), Y(v[i+5])); cx = X(v[i+4]); cy = Y(v[i+5]); }
    else if (k === 'Q') for (let i = 0; i+3 < v.length; i += 4)
      { ctx.quadraticCurveTo(X(v[i]), Y(v[i+1]), X(v[i+2]), Y(v[i+3])); cx = X(v[i+2]); cy = Y(v[i+3]); }
    else if (k === 'A') for (let i = 0; i+6 < v.length; i += 7){
      const rx = v[i]*sx, ry = v[i+1]*sy, rot = v[i+2], laf = v[i+3], sf = v[i+4];
      const x2 = X(v[i+5]), y2 = Y(v[i+6]);
      arcApprox(ctx, cx, cy, x2, y2, rx, ry, rot, laf, sf);
      cx = x2; cy = y2;
    }
    else if (k === 'Z' || k === 'z'){ ctx.closePath(); cx = sx0; cy = sy0; }
  }
}
function arcApprox(ctx, x1, y1, x2, y2, rx, ry, rotDeg, laf, sf){
  if (!rx || !ry){ ctx.lineTo(x2, y2); return; }
  // endpoint -> center parameterization (SVG spec F.6)
  const phi = rotDeg*Math.PI/180, cph = Math.cos(phi), sph = Math.sin(phi);
  const x1p =  cph*(x1-x2)/2 + sph*(y1-y2)/2;
  const y1p = -sph*(x1-x2)/2 + cph*(y1-y2)/2;
  rx = Math.abs(rx); ry = Math.abs(ry);
  let lam = (x1p*x1p)/(rx*rx) + (y1p*y1p)/(ry*ry);
  if (lam > 1){ rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const sign = laf === sf ? -1 : 1;
  const num = rx*rx*ry*ry - rx*rx*y1p*y1p - ry*ry*x1p*x1p;
  const den = rx*rx*y1p*y1p + ry*ry*x1p*x1p;
  const co = sign * Math.sqrt(Math.max(0, num/den));
  const cxp =  co * (rx*y1p)/ry, cyp = -co * (ry*x1p)/rx;
  const ccx = cph*cxp - sph*cyp + (x1+x2)/2;
  const ccy = sph*cxp + cph*cyp + (y1+y2)/2;
  const ang = (ux,uy,vx,vy) => {
    const dot = ux*vx + uy*vy, len = Math.hypot(ux,uy)*Math.hypot(vx,vy);
    let a = Math.acos(clamp(dot/len, -1, 1));
    if (ux*vy - uy*vx < 0) a = -a;
    return a;
  };
  const th1 = ang(1, 0, (x1p-cxp)/rx, (y1p-cyp)/ry);
  let d = ang((x1p-cxp)/rx, (y1p-cyp)/ry, (-x1p-cxp)/rx, (-y1p-cyp)/ry);
  if (!sf && d > 0) d -= 2*Math.PI;
  if (sf && d < 0) d += 2*Math.PI;
  const steps = Math.max(2, Math.ceil(Math.abs(d)/(Math.PI/24)));
  for (let i = 1; i <= steps; i++){
    const t = th1 + d*i/steps;
    const px = cph*(rx*Math.cos(t)) - sph*(ry*Math.sin(t)) + ccx;
    const py = sph*(rx*Math.cos(t)) + cph*(ry*Math.sin(t)) + ccy;
    ctx.lineTo(px, py);
  }
}
function drawNodeText(ctx, node, a, pr){
  const cs = getComputedStyle(node);
  const tn = node.firstChild;
  if (!tn || tn.nodeType !== 3 || !tn.nodeValue.trim()) return;
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)}px ${cs.fontFamily}`;
  ctx.fillStyle = cs.color; ctx.globalAlpha = a;
  const range = document.createRange();
  const lines = [];
  let cur = null, prevTop = -1e9;
  for (let i = 0; i < tn.nodeValue.length; i++){
    range.setStart(tn, i); range.setEnd(tn, i+1);
    const rects = range.getClientRects();
    if (!rects.length) continue;
    const rc = rects[0], top = Math.round(rc.top);
    if (!cur || Math.abs(top - prevTop) > 4){ cur = { top: rc.top, left: rc.left, chars: '' }; lines.push(cur); }
    cur.chars += tn.nodeValue[i];
    prevTop = top;
  }
  for (const ln of lines){
    const m = modelRectOf({ left:ln.left, top:ln.top, width:1, height:1 }, pr);
    const ascent = ctx.measureText(ln.chars || 'x').actualBoundingBoxAscent || parseFloat(cs.fontSize)*.8;
    ctx.fillText(ln.chars, m.x, m.y + ascent + 1);
  }
  ctx.globalAlpha = 1;
}

/* ---------------- demo seed ---------------- */
function seed(){
  loadTemplate('landing');
  hist = []; hi = -1;
}

/* ---------------- boot ---------------- */
function boot(){
  renderPalette('');
  if (!loadSaved()) seed();
  pageEl.classList.toggle('grid', S.grid);
  $('#btnGrid').classList.toggle('on', S.grid);
  $('#btnSnap').classList.toggle('on', S.snap);
  rebuild(); syncDims(); applyZoom();
  hist = [snapJSON()]; hi = 0; syncHistBtns();
}
boot();

})();
