# 海绵EU237490 · 341配对联动展示

入口：index.html；请保持本目录全部文件在同一位置。网上可从海绵mtSSU项目主页的“配对联动”进入。
完整离线包解压后同样打开index.html。

## 固定范围
- 原手工比对：197条、5390列，原列和gap不变；与项目主页216条论文数据属于不同数据范围，不能混用分母。
- 中心完整模型：EU237490，1310 nt和341个原配对。341对全部映射到原矩阵的682列，合计67177条样本×配对观测。
- 主频率分母始终197；明确ACGU条件频率列出各对的实际分母。筛选只控制显示。
- 38个中心bpRNA分段及左右臂显示在比对窗口内，并非给197条序列统一赋予各自分段。

## 交互与数据
点击中心结构中的碱基或配对线→原矩阵双端窗口；从配对表或比对可回到结构图。
可检索来源号/物种、筛选类群/组合、显示逐条原模型SS，下载逐样本及逐配对TSV。
主图针对EU237490重新转移CRW几何布局，不重新折叠；该样本原序列与341条边不变。
青绿高光为197/197完全一致的62个位点；金黄为188–196/197一致的166个位点，两级合计228个≥95%位点。
原矩阵1678、1792列中心实际为C而多数为A，实际C保留并加紫圈。单列一致性与配对兼容频率是不同指标。

## 精修结构与CRW名称
保留CRW主干方向，统一同一Seg内的茎轴；25个发夹使用圆弧，其他环区采用圆弧或圆润鼓包曲线，
按弧长均匀放置碱基。相邻helix整体平移、沿茎轴拉开距离，为loop腾出空间，不逐个扰动loop碱基。
38个茎环名逐项读取现有Helix occupancy.xlsx / Sheet1的C列（CRW 2001）及Q列（Spongia SEG38），
并非由原几何配准推断。09号TSV给出名称、Seg及单元格；原对应表不被修改。
图中蓝色H名为24px，源位置数字为20px，均以独立引线在结构外侧避让放置。
10_layout_quality.json记录独立复核的环几何、主干/配对线交叉与文字框避让结果。
点击图上CRW名称可跳转该分段的原比对双窗口；名称、数字和保守位点高光均可分别显示/隐藏。

## 大肠杆菌部分
CRW参考原图仍保留。此前的大肠杆菌高光仅保留ecoli_highlights_static.png图片，
不发布其候选映射表、投影坐标、统计模块或高光交互。

## 边界与核验
两列的WC/GU兼容组合不是经独立验证的真实配对比例，未做协变或实验验证。
CRW几何转移不是结构同源性验证。原矩阵与旧模型均不覆盖。
validation.json为独立全量复算结果；browser_validation.json为本发布模块的浏览器检查。
input_hashes.json仅给出输入文件名及SHA-256，不含本地路径。


## Bilingual interface / 中英文互照
The homepage, figures, record dialogs, substructure explorer, paired-column module,
methods and download controls use a shared presentation-only bilingual dictionary.
The default is English + Chinese; compact buttons and options prioritize English.
Language controls can switch to English-only or Chinese-only. Scientific records,
sequences, original alignments, pair tables and highlight classifications are not translated or rewritten.
主页、图版、记录详情、子结构、配对联动、方法及下载均采用同一套双语界面；默认中英互照，
空间有限的控件优先英文，可切换英文或中文。原始科研数据不因翻译而改写。

## Local corrections / 局部更正 · 2026-10-19
- H1113+H1118 / S33: rigidly rotated to a horizontal stem; only its two adjacent linkers follow.
- H1303 / S35: the basal connector at source positions 1067–1071 curves outward;
  its two endpoints remain fixed. All other nucleotide coordinates are frozen.
- User-corrected labels: S15 = H500; S31 = H1047; S32 = H1068; S33 = H1113+H1118.
  The source occupancy workbook is NOT edited. Table 09 retains its original names
  and records corrected display-name provenance; table 12 lists explicit user corrections.
- 名称更正不改变S分段编号、源区间、配对或统计。源对应表未修改，旧名称与用户更正分别留痕。

## Usage counters / 使用量统计
Counting starts on 2026-10-19. Footer views are aggregate page loads, not unique visitors.
Counts next to downloads are download LINK/BUTTON CLICKS, not verified completed transfers.
Only browser clicks through this website are included, not direct file requests.
Hits Counter provides public aggregate counters; only fixed site/file identifiers are sent.
No search terms, sequence content or selected sample identifiers are sent by this integration.
The third party can receive ordinary request metadata, including IP addresses.
Counters are approximate, unaudited, and may include repeated clicks. They are not fraud-resistant.
Offline previews, automated browser QA and browser privacy signals are excluded.
The page supports opting out; failures show “Unavailable”, not a fabricated zero.
统计自2026-10-19起，访问量为页面载入次数，下载量为链接/按钮点击次数，非独立人数或下载完成次数；
只计经本站触发的点击。第三方可收到IP等常规请求信息，不发送搜索词、序列或所选样本。
离线、自动核验及隐私退出不计数；服务失败明确显示暂不可用。
