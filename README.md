# PDF · Protein Database of Functionality

A searchable database of food protein functional properties. Values for 17 functional properties were extracted from published journal articles, and every value is linked to a specific sample (protein source, composition, added ingredients), its sample treatment (method, temperature, time, pH …) and the test method used to measure it (e.g. Bradford assay for solubility, dynamic light scattering for particle size).

**Website:** https://dzjxzyd.github.io/Protein-Database_Functionality/

Chinese version: [see below](#中文说明).

## Contents

| | Count (version 1.2, data 2026-11-12) |
|---|---|
| Papers | 49,978 |
| Journals | 149 |
| Samples | 390,530 |
| Values | 1,929,357 |
| Test methods | 133,542 |

17 properties: solubility, emulsifying properties, foaming properties, gelling properties, water-holding capacity, oil-holding capacity, particle size, ζ-potential, PDI, sulfhydryl content, disulfide bond content, surface hydrophobicity, turbidity, degree of hydrolysis, free amino groups, encapsulation/loading efficiency, antioxidant activity.

Papers from eight publishers:

| Publisher | Journals | Papers | Samples | Values |
|---|---:|---:|---:|---:|
| Elsevier | 54 | 32,135 | 250,753 | 1,268,981 |
| Wiley | 39 | 5,788 | 45,474 | 210,368 |
| Springer Nature | 26 | 3,782 | 29,972 | 138,602 |
| MDPI | 5 | 2,970 | 23,492 | 114,063 |
| ACS | 6 | 2,382 | 19,199 | 98,050 |
| Oxford University Press | 5 | 1,444 | 10,948 | 51,323 |
| Taylor & Francis | 12 | 1,210 | 9,070 | 40,123 |
| Royal Society of Chemistry | 3 | 267 | 1,622 | 7,847 |

## Website features

- **Search:** one search box with suggestions for protein sources, treatments, properties, test methods, journals and DOIs; tabbed filters (property and value, protein, sample treatment, test method, literature) with a count next to every option; ranges for treatment temperature, time, pH, pressure, power and frequency; filters for values with an SD and for pure-protein samples; batch search (paste a list of DOIs or sample names); a query builder (AND / OR / NOT between conditions, with a link you can copy and save); results per value, per sample or per paper; suggestions for which filter to drop when nothing matches.
- **Browse, statistics and property pages:** browse by property, protein source, treatment type, test method or journal; distribution charts for the whole database; for a property × protein × treatment, the values plotted paper by paper, with method summaries, treatment conditions and a table of values.
- **Download:** the complete database table by table, or one flat table per property (one row per value, opens directly in Excel), with row counts and file sizes; search results export to CSV / TSV / Excel / JSON (all results, the current page or selected rows; long or wide layout; columns of your choice); reference lists export to RIS / BibTeX / plain text; every chart downloads as PNG / SVG / data CSV.
- **Basket:** collect samples across searches (kept in your browser), compare 2–6 samples, or export them together.
- Chinese / English, dark mode and a mobile layout; filters are kept in the URL, so a search can be bookmarked and shared.

## Data origin and caveats

- **Model-derived values:** about 64% of the values were read from figures by a model and are estimates (`data_origin` contains `model-derived`; marked "Model" on the website). The rest are author-reported values from tables or the main text (`data_origin` contains `author-reported`).
- **Sample treatment is not the test method:** the sample treatment (sonication, heating, hydrolysis …; in `treatments`) is the processing a sample received before measurement; the test method (`methods`, `test_method`) is how the property was measured. About 98% of values are linked to a specific test method; the rest are marked "not stated" or "uncertain" (several methods were used for one property and it is unclear which one gave a value).
- **Significance letters** (`significance`, e.g. a, b, ab) are copied from the article. They compare samples only within the same table or figure of the same paper — values sharing a letter are not significantly different — and cannot be compared across papers.
- Samples, conditions and test methods were matched to values by an automated pipeline (LLM interpretation plus programmatic checks). Please check against the original article (DOI) before use.
- Only numerical values, sample composition, processing conditions and test methods are included — no text from the articles. Copyright of the articles remains with their authors and publishers; please cite the original articles.

## Download

All files are UTF-8 CSV (open directly in Excel); each archive also contains this README and the data licence. Every file, with its row count and size, is listed in [`data/download/manifest.json`](data/download/manifest.json).

- **Relational tables:** `data/download/<table>.csv.zip`, the first eight tables below, one archive each, linked by `doi`, `sample_id` and `measurement_id`.
- **Flat tables:** `data/download/flat_<property>.csv.zip`, one archive per property (e.g. `flat_solubility.csv.zip`), one row per value with all sample, ingredient, treatment, method and paper fields. The full flat table (about 2 GB) is not provided as a single file.

| File | One row per | Key columns |
|---|---|---|
| `papers.csv` | paper | `doi`, `title`, `journal` |
| `samples.csv` | sample | `sample_id` (`doi#N`), `sample_name`, `protein_source`, `protein_source_std`, `protein_category`, `protein_form`, `protein_form_std`, `protein_conc`, `ingredients_summary`, `treatment_summary`, `treatment_types`, `system` |
| `ingredients.csv` | ingredient | `sample_id`, `name`, `category`, `amount` |
| `treatments.csv` | sample treatment step | `sample_id`, `step_no`, `treatment_method`, `category`, `treatment_type`, `params`, `temperature_c`, `time_min`, `ph`, `pressure_mpa`, `power_w`, `frequency_khz` |
| `treatment_params.csv` | treatment parameter | `sample_id`, `step_no`, `name`, `value`, `unit` |
| `measurements.csv` | value | `measurement_id`, `sample_id`, `property`, `measure_name`, `value`, `sd`, `unit`, `significance`, `value_std`, `unit_std`, `conditions_all`, `test_method`, `test_method_en`, `method_params`, `method_status`, `source_type`, `data_origin`, `source_item` |
| `measurement_conditions.csv` | measurement condition | `measurement_id`, `name`, `value`, `unit` |
| `methods.csv` | test method | `doi`, `method_id`, `property`, `test_method`, `test_method_en`, `method_raw`, `reference`, `instrument`, `method_params`, `method_summary`, `applies_to` |
| `flat_<property>.csv` | value of one property, with all sample and paper information | all of the above |

Conventions:
- `value` is numeric; entries that are not a single number (e.g. "<0.1") are kept in `value_text`.
- For figure values with an axis multiplier (`multiplier`, e.g. 10^3), `value` is the axis reading and has not been multiplied.
- `value_std` / `unit_std`: values converted to a standard unit per property (particle size nm, ζ-potential mV, solubility % or mg/mL, emulsifying activity m²/g, emulsion stability min or %, gel strength Pa or N, water/oil holding g/g or mL/g, sulfhydryl/disulfide µmol/g …); left empty where the unit could not be recognised or the basis differs. Treatment temperature °C, time min, pressure MPa, power W, frequency kHz.
- Normalised columns, derived by rules from the original columns (which are kept): `protein_source_std` (standard protein source, e.g. Soybean, Milk (bovine)), `protein_form_std` (Isolate, Hydrolysate …), `treatment_types` / `treatment_type` (Heating, Ultrasound, Enzymatic hydrolysis …), `test_method_en` (English test-method name) and `method_summary` (English method summary for reproducing the test). Several values in one cell are separated by ` | `.
- A value's `method_id` (e.g. M2) points to the row with the same `doi` in `methods.csv`.
- Other category values are in Chinese (the website shows English translations).

## For AI agents

The website needs JavaScript, so an AI agent fetching it sees no content. Agents should start from [`llms.txt`](llms.txt) (plain-text instructions: which file to use, how to read the columns, a Python example) and [`data/download/manifest.json`](data/download/manifest.json) (every download file with its URL, row count, size and SHA-256). No sign-up or API key is needed. To hand the database to your AI, send it:

```
Use the PDF protein functionality database at https://dzjxzyd.github.io/Protein-Database_Functionality/ . Read https://dzjxzyd.github.io/Protein-Database_Functionality/llms.txt first, then download the files listed in https://dzjxzyd.github.io/Protein-Database_Functionality/data/download/manifest.json . Values whose data_origin contains "model-derived" are estimates read from figures. Give the DOI for every number you report.
```

## Updating

The database is produced by the project's extraction pipeline; `scripts/build_site_data.py` turns it into the website data (article text removed, figure-read values labelled model-derived). For a new release, add an entry to `RELEASES` in the script (version, date, Chinese and English notes); it appears on the home page, the changelog and the download page.

```
python scripts/build_site_data.py --db <database folder>
git add -A && git commit -m "Update data" && git push
```

The website is fully static (`index.html` + `assets/`: `i18n.js` text, `core.js` data and filters, `search.js` search page, `pages.js` other pages, `main.js` routing, `charts.js` charts, `xlsx.js` Excel export). Data are loaded on demand (`data/index.*` on opening, `data/chunk/` as needed) and filtered, plotted and exported in the browser; no server is needed. Local preview: `python scripts/serve.py`, then open http://localhost:8765.

## License

- Data (`data/`): [CC BY 4.0](LICENSE-DATA.md) — free to use and redistribute with attribution; please also cite the original articles.
- Code (website and scripts): [MIT](LICENSE).

Developed by the [AI4FH Lab](https://dzjxzyd.github.io/ai4fh-lab/) (Artificial Intelligence for Food & Health), University College Dublin.

---

## 中文说明

**PDF · Protein Database of Functionality（蛋白质功能特性数据库）**：可搜索的食品蛋白质功能特性数据库。从已发表论文中提取 17 项功能特性的数值，每个数值都对应到具体样品（蛋白来源、组成、复配物）、样品处理（方法、温度、时间、pH…）和测试方法（例如溶解度用 Bradford 法、粒径用动态光散射）。

**网站：** https://dzjxzyd.github.io/Protein-Database_Functionality/

### 内容

| | 数量（版本 1.2，数据 2026-11-12） |
|---|---|
| 论文 | 49,978 |
| 期刊 | 149 |
| 样品 | 390,530 |
| 数值 | 1,929,357 |
| 测试方法 | 133,542 |

17 项功能特性：溶解度、乳化性、起泡性、凝胶性、持水性、持油性、粒径、ζ-电位、PDI、巯基含量、二硫键含量、表面疏水性、浊度、水解度、游离氨基含量、包埋率/负载率、抗氧化活性。

收录八家出版商的论文：

| 出版商 | 期刊 | 论文 | 样品 | 数值 |
|---|---:|---:|---:|---:|
| Elsevier | 54 | 32,135 | 250,753 | 1,268,981 |
| Wiley | 39 | 5,788 | 45,474 | 210,368 |
| Springer Nature | 26 | 3,782 | 29,972 | 138,602 |
| MDPI | 5 | 2,970 | 23,492 | 114,063 |
| ACS | 6 | 2,382 | 19,199 | 98,050 |
| Oxford University Press | 5 | 1,444 | 10,948 | 51,323 |
| Taylor & Francis | 12 | 1,210 | 9,070 | 40,123 |
| Royal Society of Chemistry | 3 | 267 | 1,622 | 7,847 |

### 网站功能

- **检索**：一个检索框认蛋白来源、处理方式、性质、测试方法、期刊和 DOI，边输边提示；分页签筛选（性质与数值、蛋白、样品处理、测试方法、文献），每个选项带计数；处理温度、时间、pH、压力、功率、频率范围；只看有 SD 的数值、只看纯蛋白样品；批量检索（粘贴一列 DOI 或样品名）；高级查询（条件之间 AND / OR / NOT，可复制链接、保存）；结果按数值、样品或论文显示；没有结果时提示去掉哪个条件。
- **浏览、统计、性质分布页**：按性质、蛋白来源、处理类型、测试方法、期刊浏览；全库分布图；某性质 × 某蛋白 × 某处理的数值按论文分列画图，附方法概述、处理条件和数值表。
- **下载**：完整数据库按表分别下载，或按 17 项性质下载平铺表（一行一个数值，Excel 直接打开），附行数和大小；检索结果导出 CSV / TSV / Excel / JSON（全部结果、当前页或勾选的行，长表或宽表，可自选列）；文献列表导出 RIS / BibTeX / 纯文本；每张图可下载 PNG / SVG / 数据 CSV。
- **数据篮**：跨多次检索收集样品（存在浏览器里），对比 2–6 个样品，或一起导出。
- 中英双语、深色模式、手机可用；筛选条件写进网址，可以收藏和分享。

### 数据来源和注意事项

- **来源于模型**：约 64% 的数值是由模型从论文图中读取的估计值（`data_origin` 含 `model-derived`，网站上标「模型」）。其余是作者在表格或正文中给出的原值（`data_origin` 含 `author-reported`）。
- **样品处理和测试方法是两回事**：样品处理是样品在测定前经过的制备和改性（超声、加热、酶解…），见 `treatments`；测试方法是这项性质怎么测的，见 `methods` 和数值的 `test_method`。约 98% 的数值对应到了具体测试方法，其余标「原文未写明」或「不确定」（一项性质用了几种方法、分不清某个数用的哪种）。
- **显著性字母**（`significance`，如 a、b、ab）照抄原文：只在同一篇论文、同一张表或图里的样品之间比较，字母相同表示差异不显著；不同论文之间不可比。
- 样品组成、处理条件、测试方法和数值的对应关系由自动流程完成（大模型解读 + 程序核对）。使用前请通过 DOI 对照原文核对。
- 本库只包含数值、样品组成、处理条件和测试方法，不包含论文原文句子。论文版权归原作者和出版商所有；使用数据请引用对应的原始论文。

### 下载

全部是 UTF-8 CSV（Excel 可直接打开），每个压缩包里都附本说明和数据许可；全部文件及行数、大小列在 [`data/download/manifest.json`](data/download/manifest.json)。

- **关系表**：`data/download/<表名>.csv.zip`，即下表前八张，各表用 `doi`、`sample_id`、`measurement_id` 互相关联。
- **平铺表**：`data/download/flat_<性质>.csv.zip`，按 17 项性质各一个文件（如 `flat_solubility.csv.zip`），一行一个数值，样品、配料、处理、测试方法和论文信息都在同一行。整张平铺表太大（约 2 GB），不单独提供。

| 文件 | 一行是 |
|---|---|
| `papers.csv` | 论文 |
| `samples.csv` | 样品（`sample_id` 格式为 `doi#N`） |
| `ingredients.csv` | 复配物 |
| `treatments.csv` | 样品处理步骤 |
| `treatment_params.csv` | 样品处理参数 |
| `measurements.csv` | 数值 |
| `measurement_conditions.csv` | 测定条件 |
| `methods.csv` | 测试方法 |
| `flat_<性质>.csv` | 某项性质的数值（含样品、处理、论文信息） |

各表的主要列见英文部分的文件表。约定：
- `value` 是纯数字；原文不是单个数（如「<0.1」）时留空，原样在 `value_text`。
- 读图数值有纵轴倍率（`multiplier`，如 10^3）时，`value` 是刻度读数，没有乘倍率。
- `value_std` / `unit_std`：按性质换成标准单位（粒径 nm、ζ-电位 mV、溶解度 % 或 mg/mL、乳化活性 m²/g、乳化稳定性 min 或 %、凝胶强度 Pa 或 N、持水持油 g/g 或 mL/g、巯基二硫键 µmol/g…），单位写法认不出或基准不同的留空；处理温度 °C、时间 min、压力 MPa、功率 W、频率 kHz。
- 规范化的列（程序按规则从原文列推出，原文列照留）：`protein_source_std`（蛋白来源标准名称，如 Soybean、Milk (bovine)）、`protein_form_std`（Isolate、Hydrolysate…）、`treatment_types` / `treatment_type`（Heating、Ultrasound、Enzymatic hydrolysis…）、`test_method_en`（测试方法英文名）、`method_summary`（英文方法概述，可照着复现）。一格里有多个值时用 ` | ` 隔开。
- 一个数值的 `method_id`（如 M2）指向 `methods.csv` 里同一 `doi` 的那一行。
- 其余类别值是中文（网站上可切换英文）。

### 给 AI 用

网站要靠 JavaScript 才能显示，AI 直接抓网页看不到内容。AI 请从 [`llms.txt`](llms.txt)（纯文本说明：用哪个文件、各列怎么读、Python 例子）和 [`data/download/manifest.json`](data/download/manifest.json)（全部下载文件的地址、行数、大小和 SHA-256）开始，不用注册，也不用 API key。想让你的 AI 用这个库，把英文部分「For AI agents」里那段话发给它即可。

### 更新数据

数据库由项目内部的提取流程生成；网站数据由 `scripts/build_site_data.py` 从数据库生成（去掉原文句子，读图值标注为来源于模型），然后提交推送。发新版时在脚本里的 `RELEASES` 加一条（版本号、日期、中英文说明），首页、更新日志和下载页都会显示。命令见英文部分。

网站是纯静态页面（`index.html` + `assets/`），数据按需加载，在浏览器里筛选、画图、导出，不需要服务器。本地预览：`python scripts/serve.py`，然后打开 http://localhost:8765。

### 许可

- 数据（`data/`）：[CC BY 4.0](LICENSE-DATA.md)——可以使用和再发布，须注明出处，并引用对应的原始论文。
- 代码（网站和脚本）：[MIT](LICENSE)。

由都柏林大学 [AI4FH 实验室](https://dzjxzyd.github.io/ai4fh-lab/)（Artificial Intelligence for Food & Health）开发。
