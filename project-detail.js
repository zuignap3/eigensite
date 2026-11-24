// Veilige, statische detailpagina: projecten blijven beheerd via Pages CMS.
const query = new URLSearchParams(location.search);
const allowed = ['portfolio', 'projecten', 'playground', 'archief'];
const collection = allowed.includes(query.get('collectie')) ? query.get('collectie') : 'portfolio';
const wanted = query.get('project') || '';
const content = document.querySelector('#detail-article');
const back = document.querySelector('#back-link');
back.href = collection + '.html';
document.querySelector('#year').textContent = new Date().getFullYear();

function node(tag, className, value) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (value !== undefined) el.textContent = value;
  return el;
}
function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function link(label, url) {
  const href = safeUrl(url);
  if (!href) return null;
  const a = node('a', 'text-link', label);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function imageBlock(source, caption) {
  const src = safeUrl(source);
  if (!src) return null;
  const figure = node('figure', 'detail-figure');
  const img = document.createElement('img');
  img.src = src;
  img.alt = caption || 'Afbeelding van het project';
  img.loading = 'lazy';
  figure.append(img);
  if (caption) figure.append(node('figcaption', '', caption));
  return figure;
}
function videoEmbed(source) {
  const href = safeUrl(source);
  if (!href) return null;
  const url = new URL(href);
  let embed = '';
  if (url.hostname === 'youtu.be') {
    const id = url.pathname.slice(1);
    if (/^[a-zA-Z0-9_-]{11}$/.test(id)) embed = 'https://www.youtube-nocookie.com/embed/' + id;
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
    const parts = url.pathname.split('/').filter(Boolean);
    const id = parts[0] === 'shorts' || parts[0] === 'embed' ? parts[1] : url.searchParams.get('v');
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) embed = 'https://www.youtube-nocookie.com/embed/' + id;
  } else if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(url.hostname)) {
    const id = url.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part));
    if (id) embed = 'https://player.vimeo.com/video/' + id;
  }
  if (!embed) return link('Bekijk de video ↗', href);
  const wrap = node('div', 'detail-video');
  const frame = document.createElement('iframe');
  frame.src = embed;
  frame.title = 'Projectvideo';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  wrap.append(frame);
  return wrap;
}
function showError(message) {
  content.replaceChildren(node('p', 'portfolio-state', message));
}
function render(project) {
  content.replaceChildren();
  document.title = (project.titel || 'Project') + ' — Jeri Hougee';
  const hero = node('header', 'detail-hero');
  hero.append(node('div', 'eyebrow', [project.categorie || 'Overig', project.jaar].filter(Boolean).join(' / ')));
  hero.append(node('h1', '', project.titel || 'Zonder titel'));
  if (project.samenvatting) hero.append(node('p', 'portfolio-lead', project.samenvatting));
  content.append(hero);
  if (project.afbeelding) {
    const cover = imageBlock(project.afbeelding, '');
    if (cover) content.append(cover);
  }
  if (project.beschrijving) content.append(node('p', 'detail-introduction', project.beschrijving));
  const blocks = Array.isArray(project.blokken) ? project.blokken : [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const section = node('section', 'detail-section');
    if (block.kop) section.append(node('h2', '', block.kop));
    if (block.soort === 'Tekst' && block.tekst) section.append(node('p', 'detail-text', block.tekst));
    if (block.soort === 'Afbeelding') {
      const photo = imageBlock(block.afbeelding, block.bijschrift);
      if (photo) section.append(photo);
    }
    if (block.soort === 'Video') {
      const video = videoEmbed(block.video);
      if (video) section.append(video);
    }
    if (section.childElementCount) content.append(section);
  }
  const links = node('div', 'detail-outbound');
  if (project.video && !blocks.some(block => block && block.soort === 'Video' && block.video === project.video)) {
    const video = videoEmbed(project.video);
    if (video) links.append(video);
  }
  const external = link('Bekijk het project ↗', project.link);
  if (external) links.append(external);
  if (links.childElementCount) content.append(links);
}
fetch('data/' + collection + '.json', {cache:'no-cache'})
  .then(response => { if (!response.ok) throw Error('Laden mislukt'); return response.json(); })
  .then(items => {
    if (!Array.isArray(items)) throw Error('Ongeldige gegevens');
    const found = items.find(item => item && (item.slug || item.titel) === wanted);
    if (!found) return showError('Dit project kon ik niet vinden.');
    render(found);
  })
  .catch(() => showError('Dit project kon niet geladen worden.'));
