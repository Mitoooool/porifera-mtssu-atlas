"use strict";
(() => {
const D=window.PORIFERA_PAIR_DATA, $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pct=(n,d=197)=>d?(100*n/d).toFixed(2)+"%":"—";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pos=new Map(D.positions.map(r=>[r.pos,r])), colPos=new Map(D.positions.filter(r=>r.col).map(r=>[r.col,r.pos]));
const atPair=new Map(), colours={WC:"#008877",GU:"#66a8b8",other:"#bc7340",one_gap:"#8c98a2",two_gap:"#d2dce2",ambiguous:"#8b70ae"};
const segmentNames=new Map(D.segments.map(s=>[s.id,s.crw]));
D.pairs.forEach(r=>{atPair.set(r.source_left,r);atPair.set(r.source_right,r);});
const sourceSegment=p=>{const r=pos.get(p);return r?.segment?`Seg${String(r.segment[0]).padStart(2,"0")}-${r.segment[1]} · ${segmentNames.get(r.segment[0])}`:"连接/环区（未归Seg）";};
const pairName=r=>r?`P${String(r.id).padStart(3,"0")}`:"无模板配对";
const centre=D.rows.find(r=>r.accession==="EU237490");
const sortedRows=[centre,...D.rows.filter(r=>r!==centre)];
let selectedSource=3,selectedCol=pos.get(3).col,currentPair=atPair.get(3),leftAt=currentPair.col_left,rightAt=currentPair.col_right;
let filteredSamples=[],shownPairs=[],previousPairId=null;

function tab(){
  const valid=["structure","alignment","pairs","methods"], hash=location.hash.slice(1);
  const id=valid.includes(hash)?hash:"structure";
  document.querySelectorAll(".tab").forEach(el=>el.hidden=el.id!==id);
  document.querySelectorAll("nav a").forEach(el=>el.classList.toggle("active",el.hash==="#"+id));
  if(id==="structure")applyZoom();
}
window.addEventListener("hashchange",tab);
function error(text){$("alignmentDetail").textContent=text;$("alignmentDetail").setAttribute("role","alert");}
function download(name,text){
  const a=document.createElement("a"),url=URL.createObjectURL(new Blob(["\uFEFF"+text],{type:"text/tab-separated-values;charset=utf-8"}));
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function segmentOptions(){
  D.segments.forEach(s=>{
    const label=`${s.crw} / ${s.label} · ${s.pair_count}对 · ${s.left_start}–${s.left_end} / ${s.right_start}–${s.right_end}`;
    for(const id of ["figureSegment","pairSegment"]){const o=new Option(label,String(s.id));$(id).appendChild(o);}
    $("segmentJump").appendChild(new Option(s.crw+" / "+s.label+" · 左臂 "+s.left_start+"–"+s.left_end,s.id+"L"));
    $("segmentJump").appendChild(new Option(s.crw+" / "+s.label+" · 右臂 "+s.right_start+"–"+s.right_end,s.id+"R"));
  });
  [...new Set(D.rows.map(r=>r.group))].sort().forEach(g=>$("groupFilter").appendChild(new Option(g,g)));
}
function highlight(scroll=false){
  const NS="http://www.w3.org/2000/svg",g=$("selectionHighlight");
  g.innerHTML="";
  if(!selectedSource)return;
  const r=pos.get(selectedSource),indexes=[selectedSource,...(r.partner?[r.partner]:[])];
  indexes.forEach((p,i)=>{
    const c=pos.get(p),el=document.createElementNS(NS,"circle");
    for(const [k,v]of Object.entries({cx:c.x,cy:c.y,r:i?9:11,fill:"none",stroke:i?"#2781ae":"#d42c54","stroke-width":2.8}))el.setAttribute(k,v);
    g.appendChild(el);
  });
  if(scroll){
    const host=$("figureScroll"),rect=$("centreSvg").getBoundingClientRect(),scale=rect.width/D.figure.width;
    host.scrollTo({left:Math.max(0,r.x*scale-host.clientWidth/2),top:Math.max(0,r.y*scale-host.clientHeight/2),behavior:"instant"});
  }
}
function highlightSegment(){
  const segment=+$("figureSegment").value, g=$("segmentHighlight"),NS="http://www.w3.org/2000/svg";
  g.innerHTML="";
  if(!segment)return;
  D.positions.filter(p=>p.segment?.[0]===segment).forEach(p=>{
    const el=document.createElementNS(NS,"circle");
    for(const[k,v]of Object.entries({cx:p.x,cy:p.y,r:7.5,fill:"#ecce54","fill-opacity":.45,stroke:"#927315","stroke-width":.7}))el.setAttribute(k,v);
    g.appendChild(el);
  });
}
function applyZoom(){
  const mode=$("figureMode").value,compare=mode==="compare",centerVisible=mode==="center"||compare;
  $("centrePane").hidden=!centerVisible;$("referencePane").hidden=!(compare||mode==="reference");$("oldReferencePane").hidden=mode!=="oldref";
  $("figureGrid").classList.toggle("compare",compare);
  const zoom=$("zoom").value;
  $("figureInner").style.width=zoom==="fit"?"100%":Math.round(D.figure.width*+zoom)+"px";
}
function conservationLayer(){
  const layer=$("highlightLayer").value;
  document.querySelectorAll("#centreSvg .nt").forEach(nt=>{
    const tier=nt.dataset.highlight,circle=nt.querySelector(".conservation-dot");
    const visible=layer==="all"||tier===layer;
    circle.setAttribute("fill",visible?circle.dataset.fill:"white");
    circle.setAttribute("stroke",visible&&nt.dataset.variant==="true"?"#8546b5":"none");
  });
}
function annotationLayer(){
  const mode=$("annotationLayer").value;
  $("helixLabels").style.display=mode==="all"||mode==="helix"?"":"none";
  $("positionLabels").style.display=mode==="all"||mode==="number"?"":"none";
}
function details(){
  $("alignmentDetail").removeAttribute("role");
  const r=selectedSource?pos.get(selectedSource):null;
  const info=r?`源位置 <b>${r.pos} ${r.base}</b> · ${sourceSegment(r.pos)} · bpRNA类别 ${r.kind} · ${r.col?`原矩阵列 <b>${r.col}</b>`:"未进入原矩阵"}`:
    `原矩阵列 <b>${selectedCol}</b> · 中心样本为gap · ${segmentAtColumn(selectedCol).full}`;
  const pairInfo=currentPair?`<br>${pairName(currentPair)} · ${segmentNames.get(currentPair.segment)} / Seg${String(currentPair.segment).padStart(2,"0")} · 源位置 ${currentPair.source_left} ↔ ${currentPair.source_right} · 原矩阵列 ${currentPair.col_left} ↔ ${currentPair.col_right} · 模板 ${currentPair.template} · WC+GU ${currentPair.wc_gu}/197（${pct(currentPair.wc_gu)}）`:"<br>当前中心位点不属于341个模板配对；单列窗口仍显示原矩阵。";
  const conservation=r?.highlight?`<br>${r.highlight==="strict"?"青绿 · 全197条完全一致":"金黄 · ≥95%且不足100%一致"} · 多数 ${r.majority} ${r.majority_count}/197（${pct(r.majority_count)}）${r.variant?` · <b>中心实际为${r.base}，是少数碱基；紫圈标记，原序列不变</b>`:""}`:"";
  const text=info+pairInfo+conservation;
  $("figureDetail").innerHTML=text;
  $("alignmentDetail").innerHTML=text+'<div class="secondary">红框：当前列；蓝框：中心模板伙伴列。全局组合频率仍使用全部197条；样本筛选只影响下方显示。</div>';
  $("partner").disabled=!r?.partner;
  $("toFigure").disabled=!r;
  $("figureToMsa").disabled=!r?.col;
  $("previousPair").disabled=!currentPair||currentPair.id===1;
  $("nextPair").disabled=!currentPair||currentPair.id===341;
  $("position").value=$("coordinate").value==="pair"?(currentPair?.id??""):$("coordinate").value==="source"?(selectedSource??""):(selectedCol??"");
  if(r)$("figurePosition").value=r.pos;
  $("segmentJump").value=r?.segment?r.segment[0]+r.segment[1]:"";
}
function updateCombinationOptions(){
  const saved=$("combinationFilter").value;
  $("combinationFilter").innerHTML='<option value="">全部组合</option>';
  if(currentPair)Object.entries(currentPair.counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).forEach(([k,n])=>{
    $("combinationFilter").appendChild(new Option(`${k} · ${n}/197`,k));
  });
  if(previousPairId===currentPair?.id&&[...$("combinationFilter").options].some(o=>o.value===saved))$("combinationFilter").value=saved;
  previousPairId=currentPair?.id??null;
}
function selectSource(p,recenter=true){
  if(!Number.isInteger(p)||!pos.has(p)){error("中心完整源位置范围为1–1310。");return false;}
  selectedSource=p;selectedCol=pos.get(p).col;currentPair=atPair.get(p)||null;
  if(recenter){leftAt=currentPair?currentPair.col_left:selectedCol??1;rightAt=currentPair?currentPair.col_right:null;}
  updateCombinationOptions();details();highlight();frequency();alignment();
  return true;
}
function selectColumn(c){
  if(!Number.isInteger(c)||c<1||c>5390){error("原矩阵列范围为1–5390。");return false;}
  const p=colPos.get(c);
  if(p)return selectSource(p);
  selectedSource=null;selectedCol=c;currentPair=null;leftAt=c;rightAt=null;
  updateCombinationOptions();details();highlight();frequency();alignment();return true;
}
function selectPair(id){
  const r=D.pairs.find(r=>r.id===id);
  if(!r){error("模板配对编号范围为P001–P341。");return false;}
  return selectSource(r.source_left);
}
const nearestLeft=[],nearestRight=[];
let last=null;
for(let c=1;c<=5390;c++){if(colPos.has(c))last=colPos.get(c);nearestLeft[c]=last;}
last=null;
for(let c=5390;c>=1;c--){if(colPos.has(c))last=colPos.get(c);nearestRight[c]=last;}
function segmentAtColumn(c){
  const p=colPos.get(c);
  if(p){const r=pos.get(p);return {short:r.segment?`S${r.segment[0]}${r.segment[1]}`:"环/连",full:sourceSegment(p),id:r.segment?.[0]||0,gap:false};}
  const a=pos.get(nearestLeft[c]),b=pos.get(nearestRight[c]);
  if(a?.segment&&b?.segment&&a.segment.join()===b.segment.join())
    return {short:`S${a.segment[0]}${a.segment[1]}·`,full:sourceSegment(a.pos)+"（中心gap插入列）",id:a.segment[0],gap:true};
  return {short:"间隔",full:`中心gap间隔（${a?sourceSegment(a.pos):"5′端"} → ${b?sourceSegment(b.pos):"3′端"}）`,id:0,gap:true};
}
function windowCols(at,width){
  const a=clamp(Math.round(at)-Math.floor(width/2),1,5390-width+1);
  return Array.from({length:width},(_,i)=>a+i);
}
function filteredRows(){
  const group=$("groupFilter").value,q=$("sampleSearch").value.toLowerCase().trim(),combo=$("combinationFilter").value;
  return sortedRows.filter(r=>(!group||r.group===group)&&(!q||[r.id,r.accession,r.label,r.order].join(" ").toLowerCase().includes(q))&&
    (!combo||currentPair&&r.seq[currentPair.col_left-1]+r.seq[currentPair.col_right-1]===combo));
}
function alignment(){
  const width=+$("windowSize").value,left=windowCols(leftAt,width),right=rightAt?windowCols(rightAt,width):[];
  const lanes=[left,...(right.length?[right]:[])],all=right.length?[...left,null,...right]:left;
  filteredSamples=filteredRows();
  const laneHeader=lanes.map((cols,i)=>`${i?'<th class="sep"></th>':""}<th class="lane-title" colspan="${width}">${currentPair?(i?"右端":"左端"):"单列"}窗口 · 列 ${cols[0]}–${cols.at(-1)}${currentPair?` · 模板 ${i?currentPair.source_right:currentPair.source_left}`:""}</th>`).join("");
  function track(label,renderer){return `<tr><th class="sample-name">${label}</th>${all.map(c=>c?`<th class="track cell" data-col="${c}">${renderer(c)}</th>`:'<th class="sep"></th>').join("")}</tr>`;}
  const segments=lanes.map((cols,i)=>{
    let runs=[],key=null,run=null;
    for(const c of cols){
      const s=segmentAtColumn(c),k=s.full;
      if(k!==key){run={...s,cols:[]};runs.push(run);key=k;}
      run.cols.push(c);
    }
    return `${i?'<th class="sep"></th>':""}`+runs.map(s=>`<th class="track-long" colspan="${s.cols.length}" title="${esc(s.full)}；原矩阵列${s.cols[0]}–${s.cols.at(-1)}">${s.cols.length>3?esc(s.full):esc(s.short)}</th>`).join("");
  }).join("");
  const sparse=(c,val)=>`<span class="track-value sparse">${val??""}</span>`;
  let head=`<thead><tr><th class="sample-name">原矩阵未改动 · 左/右列</th>${laneHeader}</tr>`;
  head+=`<tr><th class="sample-name">中心分段 / 左L或右R臂</th>${segments}</tr>`;
  head+=track("原比对列（1–5390）",c=>sparse(c,c%10===0?c:"·"));
  head+=track("中心完整源位置（1–1310）",c=>{const p=colPos.get(c);return `<span class="track-value sparse" title="原列${c}；中心${p??"gap"}">${p?(p%10===0?p:"·"):"–"}</span>`;});
  head+=track("中心bpRNA类别 / 配对SS",c=>{const p=colPos.get(c);return `<span class="track-value" title="${p?sourceSegment(p):segmentAtColumn(c).full}">${p?pos.get(p).kind:"–"}</span>`;});
  head+=track("中心原模型SS（非共识）",c=>`<span class="track-value">${centre.ss[c-1]}</span>`);
  head+=`</thead>`;
  const showSS=$("showSS").checked,partnerCol=selectedSource&&pos.get(selectedSource).partner?pos.get(pos.get(selectedSource).partner).col:null;
  function cells(r,ss=false){
    return all.map(c=>{
      if(!c)return '<td class="sep"></td>';
      const centerPosition=colPos.get(c),tier=centerPosition?pos.get(centerPosition).highlight:"";
      const b=(ss?r.ss:r.seq)[c-1],classes=["cell",b==="-"?"gap":(!ss&&"ACGU".includes(b)?b:""),c===selectedCol?"selected":c===partnerCol?"partner-col":"",tier==="strict"?"cons100":tier==="95_only"?"cons95":""].filter(Boolean).join(" ");
      const p=colPos.get(c),title=`${r.accession||r.label} · 原列${c} · 中心${p??"gap"} · ${segmentAtColumn(c).full}`;
      return `<td class="${classes}" data-col="${c}" title="${esc(title)}">${b}</td>`;
    }).join("");
  }
  const body=filteredSamples.map((r,i)=>`<tr class="${r===centre?"centre-row":""}" id="sample-${i}"><td class="sample-name" title="${esc(r.id)}">${esc(r.accession||r.label)}${r===centre?" ★中心":""}<span class="name-label">${esc(r.group)} · ${esc(r.label)}</span></td>${cells(r)}</tr>${showSS?`<tr class="ss-row"><td class="sample-name">↳ 原模型SS</td>${cells(r,true)}</tr>`:""}`).join("");
  const oldScroll=$("msa").scrollTop;
  $("msa").innerHTML=`<table class="msa-table">${head}<tbody>${body||`<tr><td class="sample-name">无匹配样本</td><td colspan="${all.length}">请调整筛选；全局频率仍为197条。</td></tr>`}</tbody></table>`;
  $("msa").scrollTop=oldScroll;
  $("windowLabel").textContent=`显示 ${filteredSamples.length} / 197 条（全部列保持原坐标）；左窗 ${left[0]}–${left.at(-1)}${right.length?`；右窗 ${right[0]}–${right.at(-1)}`:""}；中心Seg轨道来自38段原注释；统计主分母197。`;
  $("rowJump").innerHTML='<option value="">选择样本（全部筛选结果）</option>'+filteredSamples.map((r,i)=>`<option value="${i}">${esc(r.accession||r.label)}${r===centre?" ★中心":""}</option>`).join("");
  $("previousWindow").disabled=left[0]===1;$("nextWindow").disabled=left.at(-1)===5390;
}
function frequency(){
  const r=currentPair;
  if(!r){$("currentFrequency").innerHTML='<p class="small">当前列没有中心模板伙伴。请选择P001–P341中的配对查看联合组合。</p>';return;}
  const order=["WC","GU","other","one_gap","two_gap","ambiguous"];
  const bar=`<div class="frequency-bar" aria-label="197条序列的互斥组合类别">${order.map(k=>`<span style="width:${100*r.classes[k]/197}%;background:${colours[k]}" title="${esc(D.categoryLabels[k])} ${r.classes[k]}/197"></span>`).join("")}</div>`;
  const cats=`<div class="legend">${order.map(k=>`<span><i style="height:9px;background:${colours[k]}"></i>${esc(D.categoryLabels[k])} ${r.classes[k]}（${pct(r.classes[k])}）</span>`).join("")}</div>`;
  const states=Object.entries(r.counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  $("currentFrequency").innerHTML=bar+cats+`<div class="table-scroll"><table class="freq-table"><thead><tr><th>组合：左列→右列</th><th>计数 / 全197</th><th>频率 / 197</th><th>仅明确ACGU分母 ${r.definite}</th><th>筛选观测样本</th></tr></thead><tbody>`+
    states.map(([k,n])=>`<tr class="${$("combinationFilter").value===k?"active":""}"><td>${esc(k)}${k===r.template?" · 中心模板":""}</td><td>${n} / 197</td><td>${pct(n)}</td><td>${/^[ACGU]{2}$/.test(k)&&r.definite?`${n}/${r.definite}（${pct(n,r.definite)}）`:"不纳入明确分母"}</td><td><button data-combo="${esc(k)}">显示 ${n} 条</button></td></tr>`).join("")+
    `</tbody></table></div><p class="freq-note">${pairName(r)} · 比对列 ${r.col_left}、${r.col_right}；明确两端ACGU=${r.definite}，WC+GU=${r.wc_gu}。当前样本筛选不重算该表；可用组合按钮查看相应样本。</p>`;
}
function renderPairs(){
  const seg=+$("pairSegment").value,q=$("pairSearch").value.toLowerCase().trim(),sort=$("pairSort").value;
  shownPairs=D.pairs.filter(r=>(!seg||r.segment===seg)&&(!q||[pairName(r),r.id,r.source_left,r.source_right,r.col_left,r.col_right,r.template,r.major,...Object.keys(r.counts)].join(" ").toLowerCase().includes(q)));
  shownPairs.sort((a,b)=>sort==="low"?a.wc_gu-b.wc_gu||a.id-b.id:sort==="high"?b.wc_gu-a.wc_gu||a.id-b.id:sort==="gap"?(b.classes.one_gap+b.classes.two_gap)-(a.classes.one_gap+a.classes.two_gap)||a.id-b.id:a.id-b.id);
  $("pairCount").textContent=`${shownPairs.length} / 341个模板配对；每对197条观测；所有配对共67,177条观测。`;
  $("pairTable").querySelector("tbody").innerHTML=shownPairs.map(r=>`<tr><td><button data-pair-jump="${r.id}">${pairName(r)}</button></td><td>${segmentNames.get(r.segment)} / Seg${String(r.segment).padStart(2,"0")}</td><td>${r.source_left} ↔ ${r.source_right}</td><td>${r.col_left} ↔ ${r.col_right}</td><td>${r.template}</td><td>${r.major} · ${r.major_count}/197</td><td>${r.classes.WC}</td><td>${r.classes.GU}</td><td>${r.classes.other}</td><td>${r.classes.one_gap} / ${r.classes.two_gap}</td><td>${r.classes.ambiguous}</td><td>${r.wc_gu}/197 · ${pct(r.wc_gu)}</td><td><button data-pair-figure="${r.id}">图</button></td></tr>`).join("");
}
function locateFromControl(){
  const n=+$("position").value,kind=$("coordinate").value;
  if(kind==="source")selectSource(n);
  else if(kind==="column")selectColumn(n);
  else selectPair(n);
}
$("jump").onclick=locateFromControl;
$("position").onkeydown=e=>{if(e.key==="Enter")locateFromControl();};
$("coordinate").onchange=details;
$("partner").onclick=()=>{const p=pos.get(selectedSource)?.partner;if(p)selectSource(p);};
$("figureLocate").onclick=()=>{if(selectSource(+$("figurePosition").value)){location.hash="structure";tab();applyZoom();highlight(true);}};
$("figureToMsa").onclick=()=>{if(selectSource(+$("figurePosition").value)&&selectedCol){location.hash="alignment";$("msa").scrollTop=0;}};
$("toFigure").onclick=()=>{location.hash="structure";tab();$("figureMode").value="center";applyZoom();highlight(true);};
$("centreSvg").onclick=e=>{
  const node=e.target.closest("[data-pos]"),line=e.target.closest("[data-pair]"),stem=e.target.closest("[data-segment-jump]");
  if(node){selectSource(+node.dataset.pos);if(selectedCol){location.hash="alignment";$("msa").scrollTop=0;}}
  else if(line){selectPair(+line.dataset.pair);location.hash="alignment";$("msa").scrollTop=0;}
  else if(stem){
    const s=D.segments.find(s=>s.id===+stem.dataset.segmentJump);
    $("figureSegment").value=String(s.id);highlightSegment();selectSource(s.left_start);
    location.hash="alignment";$("msa").scrollTop=0;
  }
};
$("centreSvg").onkeydown=e=>{if((e.key==="Enter"||e.key===" ")&&e.target.closest("[data-segment-jump]")){e.preventDefault();e.target.closest("[data-segment-jump]").dispatchEvent(new MouseEvent("click",{bubbles:true}));}};
$("figureSegment").onchange=highlightSegment;
$("highlightLayer").onchange=conservationLayer;
$("annotationLayer").onchange=annotationLayer;
$("highlightSite").onchange=()=>{
  const p=+$("highlightSite").value;
  if(p&&selectSource(p)){location.hash="structure";tab();$("figureMode").value="center";applyZoom();highlight(true);}
};
$("figureMode").onchange=applyZoom;$("zoom").onchange=()=>{applyZoom();highlight(true);};
$("msa").onclick=e=>{const node=e.target.closest("[data-col]");if(node&&node.dataset.col)selectColumn(+node.dataset.col);};
$("windowSize").onchange=alignment;
for(const id of ["sampleSearch","groupFilter","combinationFilter"])$(id).addEventListener("input",()=>{$("msa").scrollTop=0;alignment();frequency();});
$("showSS").onchange=alignment;
$("resetFilters").onclick=()=>{$("sampleSearch").value="";$("groupFilter").value="";$("combinationFilter").value="";alignment();frequency();};
$("rowJump").onchange=()=>{const tr=$("sample-"+$("rowJump").value);if(tr)$("msa").scrollTop=Math.max(0,tr.offsetTop-$("msa").querySelector("thead").offsetHeight);};
$("currentFrequency").onclick=e=>{const b=e.target.closest("[data-combo]");if(b){$("sampleSearch").value="";$("groupFilter").value="";$("combinationFilter").value=b.dataset.combo;$("msa").scrollTop=0;alignment();frequency();}};
$("segmentJump").onchange=()=>{
  const m=$("segmentJump").value.match(/^(\d+)([LR])$/);if(!m)return;
  const s=D.segments.find(s=>s.id===+m[1]);selectSource(m[2]==="L"?s.left_start:s.right_start);
};
$("previousPair").onclick=()=>currentPair&&selectPair(currentPair.id-1);
$("nextPair").onclick=()=>currentPair&&selectPair(currentPair.id+1);
$("previousWindow").onclick=()=>{leftAt=clamp(leftAt-+$("windowSize").value,1,5390);alignment();};
$("nextWindow").onclick=()=>{leftAt=clamp(leftAt+ +$("windowSize").value,1,5390);alignment();};
$("recenter").onclick=()=>{leftAt=currentPair?currentPair.col_left:selectedCol??1;rightAt=currentPair?.col_right??null;alignment();};
for(const id of ["pairSegment","pairSearch","pairSort"])$(id).addEventListener("input",renderPairs);
$("pairTable").onclick=e=>{
  const a=e.target.closest("[data-pair-jump]"),b=e.target.closest("[data-pair-figure]");
  if(a){selectPair(+a.dataset.pairJump);location.hash="alignment";$("msa").scrollTop=0;}
  if(b){selectPair(+b.dataset.pairFigure);location.hash="structure";tab();$("figureMode").value="center";applyZoom();highlight(true);}
};
$("exportPairs").onclick=()=>{
  const keys=["pair_id","segment","source_left","source_right","alignment_left","alignment_right","template","WC","GU","other","one_gap","two_gap","ambiguous","wc_gu_count","denominator","wc_gu_frequency_all197"];
  const text=keys.join("\t")+"\n"+shownPairs.map(r=>[pairName(r),"Seg"+r.segment,r.source_left,r.source_right,r.col_left,r.col_right,r.template,...["WC","GU","other","one_gap","two_gap","ambiguous"].map(k=>r.classes[k]),r.wc_gu,197,r.wc_gu/197].join("\t")).join("\n");
  download("EU237490_filtered_pairs.tsv",text);
};
$("exportSamples").onclick=()=>{
  if(!currentPair){error("请先选择模板配对，再导出筛选观测。");return;}
  const r=currentPair,keys=["pair_id","sample_id","source_left","source_right","alignment_left","alignment_right","base_left","base_right","combination"];
  download(`${pairName(r)}_filtered_sample_observations.tsv`,keys.join("\t")+"\n"+filteredSamples.map(s=>[pairName(r),s.id,r.source_left,r.source_right,r.col_left,r.col_right,s.seq[r.col_left-1],s.seq[r.col_right-1],s.seq[r.col_left-1]+s.seq[r.col_right-1]].join("\t")).join("\n"));
};
$("globalSummary").innerHTML=`已映射 <b>341 / 341</b> 个模板配对；38个Seg合计341对；总观测 <b>67,177</b>。WC+GU / 197 ≥95%的配对 <b>${D.summary.all197_wc_gu_ge95}</b> 个，≥75%的配对 <b>${D.summary.all197_wc_gu_ge75}</b> 个（前者包含在后者中）。`;
const cs=D.summary.conservation;
$("conservationCounts").textContent=`原197条×5390列逐列统计：100%一致${cs.strict_columns}列；额外≥95%且<100%一致${cs.additional_95_columns}列；合计≥95%为${cs.total_ge95_columns}列（至少188/197）。228列均在EU237490中有实际碱基；其中2处中心为少数碱基，以紫圈标出。`;
D.conservationSites.forEach(s=>{
  if(s.source_position)$("highlightSite").appendChild(new Option(`列${s.alignment_column} → 中心${s.source_position} ${s.center_base} · ${s.majority_count}/197${s.center_matches_majority?"":" · 中心少数"}`,String(s.source_position)));
});
segmentOptions();renderPairs();selectSource(3);tab();applyZoom();conservationLayer();annotationLayer();
window.analysisReady=true;
// Read-only QA surface, matching the saved data rather than hidden recalculations.
window.PAIR_ATLAS={data:D,getState:()=>({selectedSource,selectedCol,pair:currentPair?.id,filteredCount:filteredSamples.length})};
})();
