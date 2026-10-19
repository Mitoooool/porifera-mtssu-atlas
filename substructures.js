'use strict';
(() => {
  const figures = window.PORIFERA_SUBSTRUCTURES;
  const data = window.PORIFERA_DATA;
  const byId = id => document.getElementById(id);
  let selected = 0;
  let mode = 'types';
  let zoom = 1;
  let modalSource = '';
  let captionText = '';
  const current = () => figures[data.segments[selected]];
  function render() {
    const item = current();
    const image = byId('substructure-image');
    image.src = mode === 'types' ? item.image : item.context;
    image.alt = `${data.segments[selected]} · ${mode === 'types' ? '局部结构类型示意，原图标注' : '原截图中的结构位置'}`;
    byId('substructure-figure-label').textContent = data.segments[selected] + (mode === 'types' ? ' · 类型示意' : ' · 结构位置');
    const notes = [];
    if (item.originalLabel !== data.segments[selected]) notes.push(`截图标注 ${item.originalLabel}；统计字段 ${data.segments[selected]}。`);
    if (item.hasES) notes.push('原图 ES 对应统计中的 E。');
    if (mode === 'context') notes.push('原截图中的子结构与整体骨架位置。');
    captionText = notes.join(' ');
    byId('substructure-caption').textContent = captionText;
    byId('substructure-caption').hidden = notes.length === 0;
    document.querySelectorAll('[data-substructure-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.substructureMode === mode));
    });
    byId('substructure-open').setAttribute('aria-label', `放大${data.segments[selected]}${mode === 'types' ? '类型示意图' : '结构位置图'}`);
  }
  function updateZoom() {
    byId('substructure-modal-image').style.width = `${zoom * 100}%`;
    byId('substructure-zoom-label').textContent = `${Math.round(zoom * 100)}%`;
  }
  function openImage() {
    const item = current();
    zoom = 1;
    modalSource = mode === 'types' ? item.image : item.context;
    byId('substructure-modal-image').src = modalSource;
    byId('substructure-modal-image').alt = byId('substructure-image').alt;
    byId('substructure-modal-title').textContent = data.segments[selected] + (mode === 'types' ? ' · 类型示意' : ' · 结构位置');
    byId('substructure-modal-caption').textContent = captionText + ' 可放大、滚动查看；按 Esc 关闭。';
    updateZoom();
    byId('substructure-dialog').showModal();
    byId('substructure-zoom-viewport').scrollTo(0, 0);
  }
  byId('segment-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-segment]');
    if (!button) return;
    selected = Number(button.dataset.segment);
    render();
  });
  document.querySelectorAll('[data-substructure-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.substructureMode;
    render();
  }));
  byId('substructure-open').addEventListener('click', openImage);
  byId('substructure-zoom-in').addEventListener('click', () => { zoom = Math.min(4, zoom + .5); updateZoom(); });
  byId('substructure-zoom-out').addEventListener('click', () => { zoom = Math.max(.5, zoom - .5); updateZoom(); });
  byId('substructure-zoom-reset').addEventListener('click', () => { zoom = 1; updateZoom(); byId('substructure-zoom-viewport').scrollTo(0, 0); });
  byId('substructure-close').addEventListener('click', () => byId('substructure-dialog').close());
  byId('substructure-image').addEventListener('error', () => {
    byId('substructure-caption').textContent = '图片未能加载，请刷新页面；类型占比仍可查阅。';
  });
  render();
})();
