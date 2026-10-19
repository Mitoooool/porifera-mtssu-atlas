/* Public aggregate counters. Never send searches, sequences, accessions or filters.
 * Views are page loads (not unique people); downloads are clicks (not completed files).
 * API semantics verified against donaldzou/hits-counter /server/api/{hit,history}.ts.
 */
(() => {
  "use strict";
  const START="2026-10-19";
  const CANONICAL="https://mitoooool.github.io/porifera-mtssu-atlas/";
  const SERVICE="https://hitscounter.dev/api/";
  const test=window.PORIFERA_STATS_TEST;
  const testMode=!!test && ["localhost","127.0.0.1"].includes(location.hostname);
  const endpoint=testMode?test.endpoint:SERVICE;
  const production=location.hostname==="mitoooool.github.io" &&
    location.pathname.startsWith("/porifera-mtssu-atlas/");
  const privacy=navigator.doNotTrack==="1" || navigator.globalPrivacyControl===true;
  const optedOut=(()=>{try{return localStorage.getItem("porifera-statistics-optout")==="1";}catch(_){return false;}})();
  const active=(production && !navigator.webdriver || testMode) && !privacy && !optedOut;
  const readNodes=new Map(),countedClicks=new WeakMap(),linkCounters=new WeakMap();
  const keyFor=(kind,path="")=>CANONICAL+"?statistics-since="+START+"#"+kind+(path?":"+path:"");
  const visitsKey=keyFor("page-views");
  let pending=0,queue=[];
  function schedule(work){queue.push(work);pump();}
  function pump(){
    while(pending<3&&queue.length){
      const work=queue.shift();pending++;
      Promise.resolve().then(work).catch(()=>{}).finally(()=>{pending--;pump();});
    }
  }
  async function request(kind,key){
    const url=new URL(kind,endpoint);
    url.searchParams.set("url",key);
    if(kind==="hit"){url.searchParams.set("output","json");url.searchParams.set("tz","America/Los_Angeles");}
    const response=await fetch(url.href,{mode:"cors",credentials:"omit",referrerPolicy:"no-referrer",
      cache:"no-store",keepalive:kind==="hit",signal:kind==="history"?AbortSignal.timeout(8000):undefined});
    if(!response.ok)throw Error("Counter service unavailable");
    const data=await response.json();
    if(!Number.isSafeInteger(data.total_hits)||data.total_hits<0)throw Error("Invalid counter response");
    return data.total_hits;
  }
  function paint(node,count){
    node.textContent=Number.isSafeInteger(count)?count.toLocaleString("en-US"):"Unavailable / 暂不可用";
    node.dataset.counterState=Number.isSafeInteger(count)?"ready":"unavailable";
  }
  function counterElement(key,label){
    const container=document.createElement("span");
    container.className="usage-counter";
    container.innerHTML='<span>'+label+'</span> <strong aria-live="polite">—</strong>';
    const number=container.querySelector("strong");
    number.dataset.counterState="loading";
    if(!readNodes.has(key))readNodes.set(key,[]);
    readNodes.get(key).push(number);
    container.dataset.counterKey=key;
    return container;
  }
  function downloadPath(link){
    const url=new URL(link.getAttribute("href"),location.href);
    if(!/\.(xlsx|tsv|fasta|str|dbn|svg|png|pdf|zip|json|md|bib)$/i.test(url.pathname))return null;
    if(production && (url.origin!==location.origin || !url.pathname.startsWith("/porifera-mtssu-atlas/")))return null;
    const pathname=production?url.pathname.slice("/porifera-mtssu-atlas/".length):
      (location.pathname.includes("/pair-atlas/")?"pair-atlas/":"")+link.getAttribute("href").split("?")[0];
    return pathname.replace(/^\.\//,"");
  }
  const footer=document.querySelector("footer");
  if(footer){
    const block=document.createElement("div");
    block.className="site-usage";
    block.append(counterElement(visitsKey,"Page views / 累计访问量"));
    const start=document.createElement("span");
    start.textContent="Counting since / 统计起始：2026-10-19";
    const note=document.createElement("small");
    note.textContent="Page loads, not unique visitors. Download counts are button/link clicks, not completed transfers. / 访问量为页面载入次数，非独立人数；下载量为按钮或链接点击次数，非下载完成次数。";
    const details=document.createElement("details");
    details.innerHTML='<summary>Statistics & privacy / 统计与隐私</summary><p>Aggregate public counters are provided by Hits Counter. Only fixed page/file identifiers are sent, never search terms, sequences or selected records. The third-party service may receive normal request information, including IP addresses. Counts are approximate and may include repeated clicks; direct file requests are not counted. Offline previews, automated checks and Do Not Track / Global Privacy Control are excluded. / 使用 Hits Counter 的公开汇总计数，只发送固定页面或文件标识，不发送搜索词、序列或所选记录。第三方可接收 IP 等常规请求信息。计数为近似值，可能包含重复点击，不涵盖直接请求文件；离线预览、自动核验及启用浏览器隐私信号的访问不计数。</p><button type="button" id="statistics-optout"></button>';
    const opt=details.querySelector("button");
    opt.textContent=optedOut?"Enable counting / 开启统计":"Disable counting for this browser / 此浏览器退出统计";
    opt.addEventListener("click",()=>{
      try{localStorage.setItem("porifera-statistics-optout",optedOut?"0":"1");}catch(_){}
      location.reload();
    });
    block.append(start,note,details);footer.append(block);
  }
  const observed=[];
  document.querySelectorAll(".download-card,.download-grid a,a[download]").forEach(link=>{
    if(link.closest("svg") || link.dataset.counterKey)return;
    const path=downloadPath(link);if(!path)return;
    const key=keyFor("download-clicks",path);
    link.dataset.statDownload=key;
    const counter=counterElement(key,"Download clicks / 下载点击量");
    if(link.matches(".download-card"))link.append(counter);
    else if(link.parentElement.matches(".download-grid")){
      const item=document.createElement("div");item.className="download-item";
      link.replaceWith(item);item.append(link,counter);
    }else{
      const item=document.createElement("span");item.className="download-link-with-count";
      link.replaceWith(item);item.append(link,counter);
    }
    linkCounters.set(link,{key,counter});
    observed.push(counter);
  });
  // Dynamic table exports have stable public event keys; no selected data are sent.
  const exportButtons={
    "export-filtered":"data/filtered-records.tsv",
    "exportPairs":"pair-atlas/filtered-pair-table.tsv",
    "exportSamples":"pair-atlas/filtered-observations.tsv"
  };
  for(const [id,path]of Object.entries(exportButtons)){
    const button=document.getElementById(id);if(!button)continue;
    const key=keyFor("download-clicks",path);
    button.dataset.statDownload=key;
    const counter=counterElement(key,"Export clicks / 导出点击量");
    button.after(counter);observed.push(counter);
  }
  function broadcast(key,value){for(const node of readNodes.get(key)||[])paint(node,value);}
  function read(key){schedule(async()=>{try{broadcast(key,await request("history",key));}catch(_){broadcast(key,null);}});}
  // Gallery download targets change when the user selects a different figure.
  // Rebind both the displayed counter and click key to the actual current file.
  new MutationObserver(changes=>{
    for(const change of changes){
      const link=change.target,saved=linkCounters.get(link);
      if(!saved)continue;
      const path=downloadPath(link);if(!path)continue;
      const key=keyFor("download-clicks",path);if(saved.key===key)continue;
      const number=saved.counter.querySelector("strong");
      readNodes.set(saved.key,(readNodes.get(saved.key)||[]).filter(n=>n!==number));
      if(!readNodes.has(key))readNodes.set(key,[]);
      readNodes.get(key).push(number);
      saved.key=key;saved.counter.dataset.counterKey=key;link.dataset.statDownload=key;
      if(active)read(key);
    }
  }).observe(document.body,{subtree:true,attributes:true,attributeFilter:["href"]});
  if(active){
    schedule(async()=>{try{broadcast(visitsKey,await request("hit",visitsKey));}catch(_){broadcast(visitsKey,null);}});
    const seen=new Set();
    const io=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        io.unobserve(entry.target);
        const key=entry.target.dataset.counterKey;
        if(seen.has(key))continue;seen.add(key);read(key);
      }
    },{rootMargin:"200px"});
    observed.forEach(el=>io.observe(el));
    document.addEventListener("click",event=>{
      const link=event.target.closest("[data-stat-download]");
      if(!link || (!event.isTrusted&&!testMode))return;
      const now=Date.now(),last=countedClicks.get(link)||0;
      if(now-last<750)return;countedClicks.set(link,now);
      const key=link.dataset.statDownload;
      // Do not wait or preventDefault: counting must never block the download.
      request("hit",key).then(value=>broadcast(key,value)).catch(()=>broadcast(key,null));
    },true);
  }else{
    for(const nodes of readNodes.values())for(const node of nodes){
      node.textContent=(privacy||optedOut)?"Not tracked / 已退出统计":"Preview / 预览不计数";
      node.dataset.counterState="disabled";
    }
  }
  window.PORIFERA_STATISTICS={startDate:START,active,metricDefinitions:{
    visits:"page loads, not unique people",downloads:"download clicks, not completed transfers"},
    endpoint:production?SERVICE:"preview",counterKeys:[...readNodes.keys()],
    productionOnly:true,honorsBrowserPrivacySignals:true,localQADoesNotIncrementProduction:true};
})();
