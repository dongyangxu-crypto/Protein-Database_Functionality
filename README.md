# 蛋白质功能特性数据库 · Protein Functional Properties Database

可搜索的食品蛋白质功能特性数据库：从已发表论文中提取的 17 项功能特性数值，每个数值都对应到具体样品（蛋白来源、组成、复配物）、样品处理（方法、温度、时间、pH…）和测试方法（例如溶解度用 Bradford 法、粒径用动态光散射）。

A searchable database of food protein functional properties. Every value is linked to a specific sample (protein source, composition, added ingredients), its sample treatment (method, temperature, time, pH …) and the test method used to measure it (e.g. Bradford assay for solubility, dynamic light scattering for particle size), extracted from published journal articles.

**网站 / Website:** 本仓库的 GitHub Pages 页面（Settings → Pages 里显示的地址）/ the GitHub Pages site of this repository.

## 内容 / Contents

| | 数量 Count（2026-10-21） |
|---|---|
| 论文 Papers | 2,338 |
| 样品 Samples | 18,936 |
| 数值 Values | 96,952 |
| 测试方法 Test methods | 5,213 |

17 项功能特性 / 17 properties：溶解度 solubility、乳化性 emulsifying、起泡性 foaming、凝胶性 gelling、持水性 water-holding、持油性 oil-holding、粒径 particle size、ζ-电位 ζ-potential、PDI、巯基含量 sulfhydryl、二硫键含量 disulfide bonds、表面疏水性 surface hydrophobicity、浊度 turbidity、水解度 degree of hydrolysis、游离氨基含量 free amino groups、包埋率/负载率 encapsulation/loading efficiency、抗氧化活性 antioxidant activity。

目前收录的是 ACS 期刊（主要是 *Journal of Agricultural and Food Chemistry*、*ACS Food Science & Technology*）的论文，其他出版商的数据会陆续加入。/ Currently covers ACS journals (mainly *J. Agric. Food Chem.* and *ACS Food Sci. Technol.*); other publishers will be added.

## 数据来源和注意事项 / Data origin and caveats

- **来源于模型 / Model-derived：** 约 69% 的数值是由模型从论文图中读取的估计值（`data_origin = 来源于模型 (model-derived)`，网站上标「模型 / Model」）。其余是作者在表格或正文中给出的原值（`作者原值 (author-reported)`）。
  About 69% of the values were read from figures by a model and are estimates (`data_origin = 来源于模型 (model-derived)`, marked "Model" on the website). The rest are author-reported values from tables or the main text.
- **样品处理和测试方法是两回事 / Sample treatment ≠ test method：** 样品处理是样品在测定前经过的制备和改性（超声、加热、酶解…），见 `treatments`；测试方法是这项性质怎么测的，见 `methods` 和数值的 `test_method`。约 97% 的数值对应到了具体测试方法，其余标「原文未写明」或「不确定」（一项性质用了几种方法、分不清某个数用的哪种）。
  Sample treatment (sonication, heating, hydrolysis …, in `treatments`) is the processing a sample received before measurement; the test method (`methods`, `test_method`) is how the property was measured. About 97% of values are linked to a specific test method; the rest are marked "not stated" or "uncertain".
- 样品组成、处理条件、测试方法和数值的对应关系由自动流程完成（大模型解读 + 程序核对）。使用前请通过 DOI 对照原文核对。
  Sample, condition and test-method assignment was done by an automated pipeline (LLM interpretation with programmatic checks). Please verify against the original article (DOI) before use.
- 本库只包含数值、样品组成、处理条件和测试方法，不包含论文原文句子。论文版权归原作者和出版商所有；使用数据请引用对应的原始论文。
  Only numerical values, sample composition, processing conditions and test methods are included — no text from the articles. Copyright of the articles remains with their authors and publishers; please cite the original articles.

## 下载 / Download

[`data/protein_db_csv.zip`](data/protein_db_csv.zip)：全部数据，UTF-8 CSV（Excel 可直接打开）/ all data as UTF-8 CSV files.

| 文件 File | 一行是 One row per | 主要的列 Key columns |
|---|---|---|
| `papers.csv` | 论文 paper | `doi`, `title`, `journal` |
| `samples.csv` | 样品 sample | `sample_id`（`doi#N`）, `sample_name`, `protein_source`, `protein_category`, `protein_form`, `protein_conc`, `ingredients_summary`, `treatment_summary`, `system` |
| `ingredients.csv` | 复配物 ingredient | `sample_id`, `name`, `category`, `amount` |
| `treatments.csv` | 样品处理步骤 sample treatment step | `sample_id`, `step_no`, `treatment_method`, `category`, `params`, `temperature_c`, `time_min`, `ph`, `pressure_mpa`, `power_w`, `frequency_khz` |
| `treatment_params.csv` | 样品处理参数 treatment parameter | `sample_id`, `step_no`, `name`, `value`, `unit` |
| `measurements.csv` | 数值 value | `measurement_id`, `sample_id`, `property`, `measure_name`, `value`, `sd`, `unit`, `conditions_all`, `test_method`, `method_params`, `method_status`, `source_type`, `data_origin`, `source_item` |
| `measurement_conditions.csv` | 测定条件 measurement condition | `measurement_id`, `name`, `value`, `unit` |
| `methods.csv` | 测试方法 test method | `doi`, `method_id`, `property`, `test_method`, `method_raw`, `reference`, `instrument`, `method_params`, `applies_to` |
| `flat_measurements.csv` | 数值（含样品、处理、论文信息）value with all sample/paper info | 以上全部 all of the above |

约定 / Conventions：
- `value` 是纯数字；原文不是单个数（如「<0.1」）时留空，原样在 `value_text`。/ `value` is numeric; non-numeric entries (e.g. "<0.1") are kept in `value_text`.
- 读图数值有纵轴倍率（`multiplier`，如 10^3）时，`value` 是刻度读数，没有乘倍率。/ For figure values with an axis multiplier, `value` is the axis reading (not multiplied).
- `value_std` / `unit_std`：粒径换算成 nm、ζ-电位换算成 mV；处理温度 °C、时间 min、压力 MPa、功率 W、频率 kHz。其余保持原单位。/ Particle size in nm and ζ-potential in mV; treatment temperature °C, time min, pressure MPa, power W, frequency kHz. Other properties keep their original units.
- 一个数值的 `method_id`（如 M2）指向 `methods.csv` 里同一 `doi` 的那一行。/ A value's `method_id` points to the row with the same `doi` in `methods.csv`.
- 类别值是中文（网站上可切换英文）。/ Category values are in Chinese (the website shows English translations).

## 更新数据 / Updating

数据库由项目内部的提取流程生成；网站数据由 `scripts/build_site_data.py` 从数据库生成（去掉原文句子，读图值标注为来源于模型），然后提交推送：
The database is produced by the project's extraction pipeline; `scripts/build_site_data.py` turns it into the website data (article text removed, figure-read values labelled model-derived):

```
python scripts/build_site_data.py --db <数据库目录 database folder>
git add -A && git commit -m "Update data" && git push
```

网站是纯静态页面（`index.html` + `assets/`），数据在浏览器里解压和筛选，不需要服务器。本地预览：`python scripts/serve.py`，然后打开 http://localhost:8765。
The website is fully static (`index.html` + `assets/`); data are decompressed and filtered in the browser. Local preview: `python scripts/serve.py`, then open http://localhost:8765.

## 许可 / License

- 数据（`data/`）：[CC BY 4.0](LICENSE-DATA.md)——可以使用和再发布，须注明出处，并引用对应的原始论文。/ Data: CC BY 4.0 — attribution required; please also cite the original articles.
- 代码（网站和脚本）：[MIT](LICENSE)。/ Code (website and scripts): MIT.
