// Portfolio: content komt uit data/portfolio.json en kan via Pages CMS worden bewerkt.
const grid = document.querySelector('#project-grid');
const count = document.querySelector('#project-count');
const dialog = document.querySelector('#project-dialog');
const dialogContent = document.querySelector('#dialog-content');
const filterContainer = document.querySelector('#portfolio-filters');
let projects = [];
let activeFilter = 'Alles';

document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, window.location.href);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    return url.href;
  } catch { return ''; }
}
function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function imageOrPlaceholder(project, large = false) {
  const imageUrl = safeUrl(project.afbeelding);
  const wrap = node('div', large ? 'project-image project-image-large' : 'project-image');
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = project.titel ? 'Afbeelding bij ' + project.titel : 'Projectafbeelding';
    img.loading = large ? 'eager' : 'lazy';
    img.addEventListener('error', () => {
      img.remove();
      wrap.append(node('span', 'project-image-fallback', 'Geen afbeelding'));
    }, {once: true});
    wrap.append(img);
  } else {
    wrap.append(node('span', 'project-image-fallback', 'GEEN AFBEELDING'));
  }
  return wrap;
}
function openProject(project) {
  dialogContent.replaceChildren();
  dialogContent.append(imageOrPlaceholder(project, true));
  dialogContent.append(node('div', 'project-kicker', [project.categorie, project.jaar].filter(Boolean).join(' · ')));
  const heading = node('h2', 'dialog-title', project.titel || 'Zonder titel');
  heading.id = 'dialog-title';
  dialogContent.append(heading);
  if (project.beschrijving) dialogContent.append(node('p', 'dialog-description', project.beschrijving));
  const links = node('div', 'dialog-links');
  const video = safeUrl(project.video);
  const link = safeUrl(project.link);
  if (video) {
    const a = node('a', 'text-link', 'Bekijk de video ↗');
    a.href = video; a.target = '_blank'; a.rel = 'noopener noreferrer'; links.append(a);
  }
  if (link) {
    const a = node('a', 'text-link', 'Bekijk het project ↗');
    a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; links.append(a);
  }
  dialogContent.append(links);
  dialog.showModal();
}
function renderFilters() {
  const categories = [...new Set(projects.map(project => String(project.categorie || 'Overig').trim() || 'Overig'))].sort((a, b) => a.localeCompare(b, 'nl'));
  if (activeFilter !== 'Alles' && !categories.includes(activeFilter)) activeFilter = 'Alles';
  filterContainer.replaceChildren();
  for (const category of ['Alles', ...categories]) {
    const button = node('button', 'filter-chip' + (category === activeFilter ? ' is-active' : ''), category);
    button.type = 'button';
    button.dataset.filter = category;
    button.setAttribute('aria-pressed', String(category === activeFilter));
    button.addEventListener('click', () => { activeFilter = category; renderFilters(); render(); });
    filterContainer.append(button);
  }
}
function render() {
  const shown = projects.filter(project => activeFilter === 'Alles' || (String(project.categorie || 'Overig').trim() || 'Overig') === activeFilter);
  count.textContent = shown.length + (shown.length === 1 ? ' PROJECT' : ' PROJECTEN');
  grid.replaceChildren();
  if (!shown.length) {
    grid.append(node('p', 'portfolio-state', projects.length ? 'Hier staat nog niks. Misschien later.' : 'Hier komen mijn projecten te staan. Binnenkort, waarschijnlijk.'));
    return;
  }
  for (const project of shown) {
    const card = node('button', 'project-card');
    card.type = 'button';
    card.setAttribute('aria-label', 'Bekijk project: ' + (project.titel || 'Zonder titel'));
    card.append(imageOrPlaceholder(project));
    const metadata = node('div', 'project-meta');
    metadata.append(node('span', '', project.categorie || 'Overig'));
    metadata.append(node('span', '', project.jaar ? String(project.jaar) : ''));
    card.append(metadata);
    const title = node('div', 'project-card-title');
    title.append(node('h3', '', project.titel || 'Zonder titel'));
    title.append(node('span', '', '↗'));
    card.append(title);
    if (project.samenvatting) card.append(node('p', 'project-summary', project.samenvatting));
    card.addEventListener('click', () => openProject(project));
    grid.append(card);
  }
}
fetch('data/portfolio.json', {cache: 'no-cache'})
  .then(response => { if (!response.ok) throw new Error('Portfolio kon niet geladen worden'); return response.json(); })
  .then(data => { if (!Array.isArray(data)) throw new Error('Portfolio heeft niet het verwachte formaat'); projects = data; renderFilters(); render(); })
  .catch(() => {
    count.textContent = 'NIET BESCHIKBAAR';
    grid.replaceChildren(node('p', 'portfolio-state', 'Projecten konden niet worden geladen. Probeer de pagina later opnieuw.'));
  });
