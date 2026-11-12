# PDF · Protein Database of Functionality（蛋白质功能特性数据库）

可搜索的食品蛋白质功能特性数据库：从已发表论文中提取的 17 项功能特性数值，每个数值都对应到具体样品（蛋白来源、组成、复配物）、样品处理（方法、温度、时间、pH…）和测试方法（例如溶解度用 Bradford 法、粒径用动态光散射）。

A searchable database of food protein functional properties. Every value is linked to a specific sample (protein source, composition, added ingredients), its sample treatment (method, temperature, time, pH …) and the test method used to measure it (e.g. Bradford assay for solubility, dynamic light scattering for particle size), extracted from published journal articles.

**网站 / Website:** 本仓库的 GitHub Pages 页面（Settings → Pages 里显示的地址）/ the GitHub Pages site of this repository.

## 内容 / Contents

| | 数量 Count（版本 1.2，数据 2026-11-12） |
|---|---|
| 论文 Papers | 49,978 |
| 期刊 Journals | 149 |
| 样品 Samples | 390,530 |
| 数值 Values | 1,929,357 |
| 测试方法 Test methods | 133,542 |

17 项功能特性 / 17 properties：溶解度 solubility、乳化性 emulsifying、起泡性 foaming、凝胶性 gelling、持水性 water-holding、持油性 oil-holding、粒径 particle size、ζ-电位 ζ-potential、PDI、巯基含量 sulfhydryl、二硫键含量 disulfide bonds、表面疏水性 surface hydrophobicity、浊度 turbidity、水解度 degree of hydrolysis、游离氨基含量 free amino groups、包埋率/负载率 encapsulation/loading efficiency、抗氧化活性 antioxidant activity。

收录八家出版商的论文。/ Covers eight publishers.

| 出版商 Publisher | 期刊 Journals | 论文 Papers | 样品 Samples | 数值 Values |
|---|---:|---:|---:|---:|
| Elsevier | 54 | 32,135 | 250,753 | 1,268,981 |
| Wiley | 39 | 5,788 | 45,474 | 210,368 |
| Springer Nature | 26 | 3,782 | 29,972 | 138,602 |
| MDPI | 5 | 2,970 | 23,492 | 114,063 |
| ACS | 6 | 2,382 | 19,199 | 98,050 |
| Oxford University Press | 5 | 1,444 | 10,948 | 51,323 |
| Taylor & Francis | 12 | 1,210 | 9,070 | 40,123 |
| Royal Society of Chemistry | 3 | 267 | 1,622 | 7,847 |

## 网站功能 / Features

- **检索 / Search**：一个检索框认蛋白来源、处理方式、性质、测试方法、期刊和 DOI，边输边提示；分页签筛选（性质与数值、蛋白、样品处理、测试方法、文献），每个选项带计数；处理温度、时间、pH、压力、功率、频率范围；只看有 SD 的数值、只看纯蛋白样品；批量检索（粘贴一列 DOI 或样品名）；高级查询（条件之间 AND / OR / NOT，可复制链接、保存）；结果按数值、样品或论文显示；没有结果时提示去掉哪个条件。/ One search box with suggestions for protein sources, treatments, properties, test methods, journals and DOIs; tabbed filters with counts; treatment-parameter ranges; SD-only and pure-protein filters; batch search; query builder (AND / OR / NOT); results per value, sample or paper; suggestions when nothing matches.
- **浏览、统计、性质分布页 / Browse, statistics, property pages**：按性质、蛋白来源、处理类型、测试方法、期刊浏览；全库分布图；某性质 × 某蛋白 × 某处理的数值按论文分列画图，附方法概述、处理条件和数值表。
- **下载 / Download**：完整数据库按表分别下载，或按 17 项性质下载平铺表（一行一个数值，Excel 直接打开），附行数、大小和 SHA-256；检索结果导出 CSV / TSV / Excel / JSON（全部结果、当前页或勾选的行，长表或宽表，可自选列）；文献列表导出 RIS / BibTeX / 纯文本；每张图可下载 PNG / SVG / 数据 CSV。
- **数据篮 / Basket**：跨多次检索收集样品（存在浏览器里），对比 2–6 个样品，或一起导出。
- 中英双语、深色模式、手机可用；筛选条件写进网址，可以收藏和分享。/ Chinese / English, dark mode, mobile layout; filters are kept in the URL.

## 数据来源和注意事项 / Data origin and caveats

- **来源于模型 / Model-derived：** 约 64% 的数值是由模型从论文图中读取的估计值（`data_origin = 来源于模型 (model-derived)`，网站上标「模型 / Model」）。其余是作者在表格或正文中给出的原值（`作者原值 (author-reported)`）。
  About 64% of the values were read from figures by a model and are estimates (`data_origin = 来源于模型 (model-derived)`, marked "Model" on the website). The rest are author-reported values from tables or the main text.
- **样品处理和测试方法是两回事 / Sample treatment ≠ test method：** 样品处理是样品在测定前经过的制备和改性（超声、加热、酶解…），见 `treatments`；测试方法是这项性质怎么测的，见 `methods` 和数值的 `test_method`。约 98% 的数值对应到了具体测试方法，其余标「原文未写明」或「不确定」（一项性质用了几种方法、分不清某个数用的哪种）。
  Sample treatment (sonication, heating, hydrolysis …, in `treatments`) is the processing a sample received before measurement; the test method (`methods`, `test_method`) is how the property was measured. About 98% of values are linked to a specific test method; the rest are marked "not stated" or "uncertain".
- 样品组成、处理条件、测试方法和数值的对应关系由自动流程完成（大模型解读 + 程序核对）。使用前请通过 DOI 对照原文核对。
  Sample, condition and test-method assignment was done by an automated pipeline (LLM interpretation with programmatic checks). Please verify against the original article (DOI) before use.
- 本库只包含数值、样品组成、处理条件和测试方法，不包含论文原文句子。论文版权归原作者和出版商所有；使用数据请引用对应的原始论文。
  Only numerical values, sample composition, processing conditions and test methods are included — no text from the articles. Copyright of the articles remains with their authors and publishers; please cite the original articles.

## 下载 / Download

全部是 UTF-8 CSV（Excel 可直接打开），每个压缩包里都附本说明和数据许可；行数、大小和 SHA-256 见 [`data/download/manifest.json`](data/download/manifest.json)。/ All files are UTF-8 CSV (open directly in Excel); each archive includes this README and the data licence; row counts, sizes and SHA-256 checksums are in `manifest.json`.

- **关系表 / Relational tables**：`data/download/<表名>.csv.zip`，下表前八张，各表用 `doi`、`sample_id`、`measurement_id` 互相关联。/ The first eight tables below, one archive each, linked by `doi`, `sample_id` and `measurement_id`.
- **平铺表 / Flat tables**：`data/download/flat_<性质>.csv.zip`，按 17 项性质各一个文件（如 `flat_solubility.csv.zip`），一行一个数值，样品、配料、处理、测试方法和论文信息都在同一行。整张平铺表太大（约 2 GB），不单独提供。/ One archive per property (e.g. `flat_solubility.csv.zip`), one row per value with all sample, ingredient, treatment, method and paper fields; the full flat table (~2 GB) is not provided as one file.

| 文件 File | 一行是 One row per | 主要的列 Key columns |
|---|---|---|
| `papers.csv` | 论文 paper | `doi`, `title`, `journal` |
| `samples.csv` | 样品 sample | `sample_id`（`doi#N`）, `sample_name`, `protein_source`, `protein_source_std`, `protein_category`, `protein_form`, `protein_form_std`, `protein_conc`, `ingredients_summary`, `treatment_summary`, `treatment_types`, `system` |
| `ingredients.csv` | 复配物 ingredient | `sample_id`, `name`, `category`, `amount` |
| `treatments.csv` | 样品处理步骤 sample treatment step | `sample_id`, `step_no`, `treatment_method`, `category`, `treatment_type`, `params`, `temperature_c`, `time_min`, `ph`, `pressure_mpa`, `power_w`, `frequency_khz` |
| `treatment_params.csv` | 样品处理参数 treatment parameter | `sample_id`, `step_no`, `name`, `value`, `unit` |
| `measurements.csv` | 数值 value | `measurement_id`, `sample_id`, `property`, `measure_name`, `value`, `sd`, `unit`, `value_std`, `unit_std`, `conditions_all`, `test_method`, `test_method_en`, `method_params`, `method_status`, `source_type`, `data_origin`, `source_item` |
| `measurement_conditions.csv` | 测定条件 measurement condition | `measurement_id`, `name`, `value`, `unit` |
| `methods.csv` | 测试方法 test method | `doi`, `method_id`, `property`, `test_method`, `test_method_en`, `method_raw`, `reference`, `instrument`, `method_params`, `method_summary`, `applies_to` |
| `flat_<property>.csv` | 某项性质的数值（含样品、处理、论文信息）value of one property, with all sample/paper info | 以上全部 all of the above |

约定 / Conventions：
- `value` 是纯数字；原文不是单个数（如「<0.1」）时留空，原样在 `value_text`。/ `value` is numeric; non-numeric entries (e.g. "<0.1") are kept in `value_text`.
- 读图数值有纵轴倍率（`multiplier`，如 10^3）时，`value` 是刻度读数，没有乘倍率。/ For figure values with an axis multiplier, `value` is the axis reading (not multiplied).
- `value_std` / `unit_std`：按性质换成标准单位（粒径 nm、ζ-电位 mV、溶解度 % 或 mg/mL、乳化性 m²/g、min 或 %、凝胶性 Pa 或 N、持水持油 g/g 或 mL/g、巯基二硫键 µmol/g…），单位写法认不出或基准不同的留空；处理温度 °C、时间 min、压力 MPa、功率 W、频率 kHz。/ Values converted to a standard unit per property (particle size nm, ζ-potential mV, solubility % or mg/mL, EAI m²/g, gel strength Pa or N, WHC/OHC g/g or mL/g, SH/SS µmol/g …); left empty where the unit could not be recognised or the basis differs. Treatment temperature °C, time min, pressure MPa, power W, frequency kHz.
- 规范化的列 / Normalised columns（程序按规则从原文列推出，原文列照留 / derived by rules from the original columns, which are kept）：`protein_source_std`（蛋白来源标准名称 / standard protein source, e.g. Soybean, Milk (bovine)）、`protein_form_std`（Isolate、Hydrolysate…）、`treatment_types` / `treatment_type`（Heating、Ultrasound、Enzymatic hydrolysis…）、`test_method_en`（测试方法英文名 / English test-method name）、`method_summary`（英文方法概述，可照着复现 / English method summary for reproducing the test）。
- 一个数值的 `method_id`（如 M2）指向 `methods.csv` 里同一 `doi` 的那一行。/ A value's `method_id` points to the row with the same `doi` in `methods.csv`.
- 类别值是中文（网站上可切换英文）。/ Category values are in Chinese (the website shows English translations).

## 更新数据 / Updating

数据库由项目内部的提取流程生成；网站数据由 `scripts/build_site_data.py` 从数据库生成（去掉原文句子，读图值标注为来源于模型），然后提交推送。发新版时在脚本里的 `RELEASES` 加一条（版本号、日期、中英文说明），首页、更新日志和下载页都会显示。
The database is produced by the project's extraction pipeline; `scripts/build_site_data.py` turns it into the website data (article text removed, figure-read values labelled model-derived). For a new release, add an entry to `RELEASES` in the script.

```
python scripts/build_site_data.py --db <数据库目录 database folder>
git add -A && git commit -m "Update data" && git push
```

网站是纯静态页面（`index.html` + `assets/`：`i18n.js` 文字、`core.js` 数据与筛选、`search.js` 检索页、`pages.js` 其余页面、`main.js` 路由、`charts.js` 图、`xlsx.js` Excel 导出），数据按需加载（`data/index.*` 打开时下载，`data/chunk/` 按需下载），在浏览器里筛选、画图、导出，不需要服务器。本地预览：`python scripts/serve.py`，然后打开 http://localhost:8765。
The website is fully static (`index.html` + `assets/`); data are loaded on demand (`data/index.*` on open, `data/chunk/` as needed) and filtered, plotted and exported in the browser. Local preview: `python scripts/serve.py`, then open http://localhost:8765.

## 许可 / License

- 数据（`data/`）：[CC BY 4.0](LICENSE-DATA.md)——可以使用和再发布，须注明出处，并引用对应的原始论文。/ Data: CC BY 4.0 — attribution required; please also cite the original articles.
- 代码（网站和脚本）：[MIT](LICENSE)。/ Code (website and scripts): MIT.
