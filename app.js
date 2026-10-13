'use strict';
(() => {
  const data = window.PORIFERA_DATA;
  const byId = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  if (!data) { byId('result-count').textContent = '数据未能载入，请刷新或使用下方完整补充表。'; return; }
  const state = { className:'', order:'', query:'', sort:'default', page:0, pageSize:8, segment:0, gallery:1, zoom:1 };
  const names = Object.fromEntries(data.classes.map(c => [c.class,c.name]));
  const headers=['Accession','Class','Subclass','Order','Family','Genus','Species','Length_nt','Reference_template',...data.segments,'Composite_type'];
  const tsvRows = records => [headers, ...records.map(r => [r.accession,r.class,r.subclass,r.order,r.family,r.genus,r.species,r.length,r.template,...r.types,r.composite])].map(row => row.map(value => String(value ?? '').replace(/[\t\r\n]/g,' ')).join('\t')).join('\n')+'\n';
  function saveText(filename, text, mime='text/plain;charset=utf-8') {
    const url=URL.createObjectURL(new Blob([text],{type:mime}));
    const link=document.createElement('a'); link.href=url; link.download=filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  function selectedRecords() {
    const query=state.query.toLocaleLowerCase().trim();
    let selected=data.records.filter(r => (!state.className || r.class===state.className) && (!state.order || r.order===state.order) && (!query || [r.accession,r.species,r.family,r.genus,r.order,r.class,r.composite].join(' ').toLocaleLowerCase().includes(query)));
    if(state.sort==='length-up') selected.sort((a,b)=>a.length-b.length);
    if(state.sort==='length-down') selected.sort((a,b)=>b.length-a.length);
    if(state.sort==='species') selected.sort((a,b)=>a.species.localeCompare(b.species));
    return selected;
  }
  function populateOrders() {
    const selected=data.records.filter(r=>!state.className||r.class===state.className);
    const orders=[...new Set(selected.map(r=>r.order))].sort();
    if(!orders.includes(state.order)) state.order='';
    byId('order').innerHTML='<option value="">全部目</option>'+orders.map(order=>`<option value="${escape(order)}">${escape(order)}</option>`).join('');
    byId('order').value=state.order;
  }
  function renderRecords() {
    const selected=selectedRecords();
    const pages=Math.max(1,Math.ceil(selected.length/state.pageSize));
    state.page=Math.min(state.page,pages-1);
    const start=state.page*state.pageSize;
    const visible=selected.slice(start,start+state.pageSize);
    byId('result-count').textContent=`显示 ${selected.length} / ${data.records.length} 条记录${state.className ? ' · '+names[state.className]:''}`;
    byId('record-rows').innerHTML=visible.map(r=>`<tr><td><span class="accession">${escape(r.accession)}</span>${r.sequenceMatch ? '':'<small class="qc-flag">来源待核对</small>'}</td><td class="species">${escape(r.species)}</td><td>${escape(r.order)}<small>${escape(names[r.class])}</small></td><td class="numeric">${r.length.toLocaleString('en-US')}</td><td class="composite">${escape(r.composite)}</td><td><button type="button" class="record-button" data-record="${escape(r.accession)}" aria-label="查看${escape(r.species)}记录详情">详情 ↗</button></td></tr>`).join('') || '<tr><td colspan="6">没有匹配记录。请调整检索词或清除筛选。</td></tr>';
    byId('page-info').textContent=selected.length ? `${start+1}–${Math.min(start+state.pageSize,selected.length)} / ${selected.length} · 第 ${state.page+1} / ${pages} 页` : '0 条记录';
    byId('previous').disabled=state.page===0;
    byId('next').disabled=state.page>=pages-1;
    byId('export-filtered').disabled=selected.length===0;
    document.querySelectorAll('[data-class]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.class===state.className)));
  }
  byId('class-grid').innerHTML=data.classes.map(c=>`<button type="button" class="class-card" data-class="${escape(c.class)}" aria-pressed="false" aria-label="筛选${escape(c.name)}，${c.records}条记录；再次点击取消筛选"><span class="class-name">${escape(c.name)}</span><span class="class-count">${c.records}</span><span class="class-en" lang="en">${escape(c.class)}</span><span class="class-range">${c.min.toLocaleString()}${c.min===c.max?'':'–'+c.max.toLocaleString()} nt · ${c.composites}种组合类型</span></button>`).join('');
  byId('class-grid').addEventListener('click',event=>{
    const button=event.target.closest('[data-class]'); if(!button)return;
    state.className=state.className===button.dataset.class ? '' : button.dataset.class;
    state.order=''; state.page=0; populateOrders(); renderRecords();
  });
  byId('search').addEventListener('input',()=>{state.query=byId('search').value;state.page=0;renderRecords();});
  byId('order').addEventListener('change',()=>{state.order=byId('order').value;state.page=0;renderRecords();});
  byId('sort').addEventListener('change',()=>{state.sort=byId('sort').value;state.page=0;renderRecords();});
  byId('filters').addEventListener('submit',event=>event.preventDefault());
  byId('filters').addEventListener('reset',()=>{state.className='';state.order='';state.query='';state.sort='default';state.page=0;populateOrders();renderRecords();});
  byId('previous').addEventListener('click',()=>{state.page--;renderRecords();});
  byId('next').addEventListener('click',()=>{state.page++;renderRecords();});
  byId('export-filtered').addEventListener('click',()=>saveText('porifera-filtered-records.tsv',tsvRows(selectedRecords()),'text/tab-separated-values;charset=utf-8'));

  const figures={
    1:{title:'九个保守结构锚点',description:'H9、H367、H500、H769、H885、H921、H944、H1506及H673-loop，将高度分化的分子放入共同的比较框架。',source:'图1 · 序列logo及结构锚点示意。分类群拓扑用于组织展示，枝长不代表时间或演化距离。',alt:'图1：四个海绵纲的保守结构锚点和序列logo'},
    2:{title:'局部结构类型及类群分布',description:'以结构骨架定位高变子结构，展示局部类型、分类群分布与结构元素长度。放大后可滚动查看(a)、(b)、(c)各面板。',source:'图2 · 分类群排列用于展示，非本研究重新推断的系统树。图中文字保留作者原图，网页类型名称统一以S2c为准。',alt:'图2：海绵mtSSU局部结构模式、分类群分布和长度分布'}
  };
  function selectGallery(number) {
    state.gallery=number;
    const f=figures[number];
    byId('gallery-image').src=`assets/figure-${number}.webp`;
    byId('gallery-image').alt=f.alt;
    byId('gallery-title').textContent=f.title;
    byId('gallery-description').textContent=f.description;
    byId('gallery-source').textContent=f.source;
    byId('gallery-download').href=`assets/figure-${number}.png`;
    document.querySelectorAll('[data-gallery]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.gallery)===number)));
  }
  function updateZoom() { byId('modal-figure').style.width=state.zoom*100+'%';byId('zoom-label').textContent=Math.round(state.zoom*100)+'%'; }
  function openFigure(number) {
    const f=figures[number];state.zoom=1;
    byId('figure-modal-title').textContent=`图${number} · ${f.title}`;
    byId('modal-figure').src=`assets/figure-${number}.png`;
    byId('modal-figure').alt=f.alt;
    updateZoom();byId('figure-dialog').showModal();
    byId('zoom-viewport').scrollTo(0,0);
  }
  document.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',()=>selectGallery(Number(button.dataset.gallery))));
  document.querySelectorAll('[data-figure]').forEach(button=>button.addEventListener('click',()=>openFigure(Number(button.dataset.figure))));
  byId('gallery-open').addEventListener('click',()=>openFigure(state.gallery));
  byId('zoom-in').addEventListener('click',()=>{state.zoom=Math.min(4,state.zoom+.5);updateZoom();});
  byId('zoom-out').addEventListener('click',()=>{state.zoom=Math.max(1,state.zoom-.5);updateZoom();});
  byId('zoom-reset').addEventListener('click',()=>{state.zoom=1;updateZoom();byId('zoom-viewport').scrollTo(0,0);});
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>byId(button.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}}));

  function renderSegment(index) {
    state.segment=index;
    const segment=data.segmentSummary[index];
    const counts=Object.entries(segment.types).sort((a,b)=>a[0].localeCompare(b[0]));
    byId('segment-title').textContent=segment.segment;
    byId('segment-count').textContent=`${counts.length}种类型 · n = 216`;
    byId('type-bars').innerHTML=counts.map(([type,count])=>`<div class="type-bar"><span>类型 ${escape(type)}</span><div class="type-track" role="img" aria-label="${escape(type)}型${count}条，${(count/216*100).toFixed(1)}%"><span style="width:${count/216*100}%"></span></div><span class="type-value">${count} / ${(count/216*100).toFixed(1)}%</span></div>`).join('');
    document.querySelectorAll('[data-segment]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.segment)===index)));
  }
  byId('segment-grid').innerHTML=data.segments.map((segment,index)=>`<button type="button" data-segment="${index}" aria-pressed="${index===0}">${escape(segment)}</button>`).join('');
  byId('segment-grid').addEventListener('click',event=>{const button=event.target.closest('[data-segment]');if(button)renderSegment(Number(button.dataset.segment));});

  function pairingMap(record) {
    const container=byId('pair-map-container');if(!container)return;
    const width=Math.max(260,container.clientWidth),height=210,baseline=178;
    const n=record.structure.length;
    const stack=[],pairs=[];
    for(let i=0;i<n;i++){if(record.structure[i]==='(')stack.push(i);else if(record.structure[i]===')')pairs.push([stack.pop(),i]);}
    const x=position=>24+position/(n-1)*(width-48);
    const maxSpan=Math.max(1,...pairs.map(([i,j])=>j-i));
    const paths=pairs.map(([i,j])=>`<path d="M${x(i).toFixed(2)},${baseline} Q${((x(i)+x(j))/2).toFixed(2)},${(baseline-2*(j-i)/maxSpan*148).toFixed(2)} ${x(j).toFixed(2)},${baseline}"/>`).join('');
    container.innerHTML=`<svg class="pair-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(record.accession)}的${pairs.length}个碱基配对位置，横轴为核苷酸序号；非空间结构图"><g fill="none" stroke="#538980" stroke-width=".65" opacity=".7">${paths}</g><line x1="24" x2="${width-24}" y1="178" y2="178" stroke="#bbcfc7"/><g fill="#60757a" font-family="system-ui" font-size="11"><text x="24" y="200">1</text><text x="${width/2}" y="200" text-anchor="middle">核苷酸序号</text><text x="${width-24}" y="200" text-anchor="end">${n}</text></g></svg>`;
  }
  function openRecord(accession) {
    const r=data.records.find(record=>record.accession===accession);if(!r)return;
    byId('record-accession').textContent=r.accession;
    byId('record-title').textContent=r.species;
    const metadata=[['纲',names[r.class]+' / '+r.class],['目',r.order],['科',r.family],['序列长度',r.length.toLocaleString()+' nt'],['参考模板',r.template || '来源未列'],['组合类型',r.composite]];
    byId('record-content').innerHTML=`<dl class="record-meta">${metadata.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><h3>12个子结构的类型</h3><div class="record-type-grid">${r.types.map((type,i)=>`<div><span>${escape(data.segments[i])}</span><strong>${escape(type)}</strong></div>`).join('')}</div><h3>RNA序列 · 补充表S2b</h3><pre>${escape(r.sequence)}</pre>${r.sequenceMatch?'<h3>配对位置示意 · S6</h3><div id="pair-map-container"></div><p class="quiet">横轴对应序列位置，连线表示S6模型中的配对。该图不是RNA空间构象或二级结构布局。</p><details><summary class="quiet">查看dot-bracket结构</summary><pre>'+escape(r.structure)+'</pre></details>':'<p class="record-warning">来源待核对：S2b序列为'+r.length+' nt，S6对应序列为'+r.structureSequence.length+' nt。暂不显示配对图或提供单条结构导出。</p>'}<div class="record-action-row"><button type="button" id="download-record-sequence">下载该条FASTA</button>${r.sequenceMatch?'<button type="button" id="download-record-structure">下载该条STR</button>':''}</div><p class="quiet" style="margin-top:17px">分类与类型：S2b / S2c；预测结构：S6。此处展示模型，并非实验解析结构。</p>`;
    byId('record-dialog').showModal();
    byId('record-content').scrollTop=0;
    pairingMap(r);
    byId('download-record-sequence').addEventListener('click',()=>saveText(r.accession+'.fasta',`>${r.accession} ${r.species}\n${r.sequence}\n`));
    if(r.sequenceMatch)byId('download-record-structure').addEventListener('click',()=>saveText(r.accession+'.str',`>${r.accession}\n${r.structureSequence}\n${r.structure}\n`));
  }
  byId('record-rows').addEventListener('click',event=>{const button=event.target.closest('[data-record]');if(button)openRecord(button.dataset.record);});
  populateOrders();renderRecords();renderSegment(0);
})();
