'use strict';
/* PFD · Protein Functionality Database —— 网页（纯静态）。
   打开时只下 data/index.json.gz + index.bin.gz（筛选、计数、画图用的列）；关键词用到时才下 search.json.gz；
   表格、样品页、论文页要显示的详细内容按文章分块（data/chunk/NNN.json.gz），用到哪块下哪块。 */
(() => {
  // ================================================================ 文字 ==
  const PROP_NAMES = {
    solubility: ['溶解度', 'Solubility'], emulsifying: ['乳化性', 'Emulsifying properties'],
    foaming: ['起泡性', 'Foaming properties'], gelling: ['凝胶性', 'Gelling properties'],
    water_holding: ['持水性', 'Water-holding capacity'], oil_holding: ['持油性', 'Oil-holding capacity'],
    particle_size: ['粒径', 'Particle size'], zeta_potential: ['ζ-电位', 'ζ-Potential'], pdi: ['PDI', 'PDI'],
    sulfhydryl: ['巯基含量', 'Sulfhydryl content'], disulfide: ['二硫键含量', 'Disulfide bond content'],
    surface_hydrophobicity: ['表面疏水性', 'Surface hydrophobicity'], turbidity: ['浊度', 'Turbidity'],
    degree_of_hydrolysis: ['水解度', 'Degree of hydrolysis'], free_amino: ['游离氨基含量', 'Free amino group content'],
    encapsulation: ['包埋率/负载率', 'Encapsulation / loading efficiency'], antioxidant: ['抗氧化活性', 'Antioxidant activity'],
  };
  // 库里固定的几种中文类别 → 英文界面
  const EN = {
    '植物蛋白': 'Plant protein', '乳蛋白': 'Dairy protein', '蛋类蛋白': 'Egg protein', '肉类或水产蛋白': 'Meat / aquatic protein',
    '其他动物蛋白': 'Other animal protein', '微生物蛋白': 'Microbial protein', '藻类蛋白': 'Algal protein', '昆虫蛋白': 'Insect protein',
    '多种来源': 'Mixed sources', '不明': 'Unknown', '溶液或分散液': 'Solution / dispersion', '乳液': 'Emulsion', '泡沫': 'Foam',
    '凝胶': 'Gel', '颗粒或纳米颗粒': 'Particles / nanoparticles', '复合物': 'Complex', '膜': 'Film', '粉末或固体': 'Powder / solid',
    '其他': 'Other', '物理法': 'Physical', '化学法': 'Chemical', '生物法': 'Biological', '复合法': 'Combined', '未处理': 'Untreated',
    '多糖': 'Polysaccharide', '多酚': 'Polyphenol', '油脂': 'Oil / lipid', '其他蛋白': 'Other protein', '肽': 'Peptide', '糖': 'Sugar',
    '盐或离子': 'Salt / ion', '表面活性剂或乳化剂': 'Surfactant / emulsifier', '交联剂': 'Cross-linker', '活性物质': 'Bioactive compound',
    '作者表格': 'Author table', '正文': 'Main text', '图反读': 'Figure', '图片表格反读': 'Table image',
  };
  // 规范化后的英文名称 → 中文界面
  const ZH = {
    // 蛋白来源
    'Milk (bovine)': '牛乳', 'Milk (goat)': '山羊乳', 'Milk (sheep)': '绵羊乳', 'Milk (camel)': '骆驼乳', 'Milk (buffalo)': '水牛乳',
    'Milk (yak)': '牦牛乳', 'Milk (donkey / mare)': '驴乳/马乳', 'Milk (human)': '人乳', 'Egg (hen)': '鸡蛋', 'Egg (duck)': '鸭蛋',
    'Egg (quail)': '鹌鹑蛋', 'Egg (goose)': '鹅蛋', 'Chickpea': '鹰嘴豆', 'Cowpea': '豇豆', 'Pigeon pea': '木豆', 'Grass pea': '山黧豆',
    'Pea': '豌豆', 'Peanut': '花生', 'Soybean': '大豆', 'Faba bean': '蚕豆', 'Mung bean': '绿豆', 'Adzuki bean': '红小豆',
    'Lentil': '小扁豆', 'Lupin': '羽扇豆', 'Common bean': '菜豆（芸豆、黑豆等）', 'Bean (other)': '其他豆类', 'Wheat': '小麦',
    'Corn': '玉米', 'Rice': '稻米', 'Barley': '大麦', 'Oat': '燕麦', 'Rye': '黑麦', 'Triticale': '小黑麦', 'Sorghum': '高粱',
    'Millet': '小米/黍类', 'Buckwheat': '荞麦', 'Quinoa': '藜麦', 'Amaranth': '苋籽', 'Rapeseed / canola': '油菜籽',
    'Mustard': '芥菜籽', 'Sunflower': '向日葵', 'Sesame': '芝麻', 'Cottonseed': '棉籽', 'Flaxseed': '亚麻籽', 'Hemp': '火麻',
    'Chia': '奇亚籽', 'Pumpkin seed': '南瓜籽', 'Watermelon / melon seed': '西瓜籽/瓜籽', 'Almond': '扁桃仁', 'Apricot kernel': '杏仁',
    'Walnut': '核桃', 'Hazelnut': '榛子', 'Cashew': '腰果', 'Pistachio': '开心果', 'Pecan': '碧根果', 'Macadamia': '澳洲坚果',
    'Pine nut': '松子', 'Chestnut': '板栗', 'Coconut': '椰子', 'Oil palm': '油棕', 'Jatropha': '麻疯树', 'Moringa': '辣木',
    'Perilla': '紫苏', 'Camellia / tea seed': '油茶籽', 'Grape seed': '葡萄籽', 'Tomato seed': '番茄籽', 'Tiger nut': '油莎豆',
    'Sweet potato': '甘薯', 'Potato': '马铃薯', 'Yam': '山药', 'Taro': '芋头', 'Cassava': '木薯', 'Grape / wine': '葡萄/葡萄酒',
    'Coffee': '咖啡', 'Cocoa': '可可', 'Tea': '茶', 'Leaf protein (RuBisCO)': '叶蛋白（RuBisCO）', 'Fruit / vegetable (other)': '其他果蔬',
    'Yeast': '酵母', 'Mushroom / fungi': '食用菌/真菌', 'Bacteria': '细菌', 'Microalgae': '微藻', 'Seaweed': '海藻',
    'Cricket': '蟋蟀', 'Mealworm': '黄粉虫', 'Black soldier fly': '黑水虻', 'Silkworm': '家蚕', 'Locust / grasshopper': '蝗虫',
    'Insect (other)': '其他昆虫', 'Krill': '磷虾', 'Shrimp / prawn': '虾', 'Crab / lobster / crayfish': '蟹/龙虾',
    'Squid / octopus / cuttlefish': '鱿鱼/章鱼/乌贼', 'Mollusc / shellfish': '贝类', 'Sea cucumber': '海参', 'Jellyfish': '海蜇',
    'Fish': '鱼', 'Chicken': '鸡肉', 'Duck': '鸭肉', 'Goose': '鹅肉', 'Turkey': '火鸡', 'Pork / porcine': '猪（肉、皮、血）',
    'Beef / bovine': '牛（肉、皮、血清）', 'Sheep / goat (meat)': '羊肉', 'Horse': '马', 'Rabbit': '兔', 'Deer': '鹿', 'Frog': '蛙',
    'Human': '人源', 'Laboratory animal': '实验动物', 'Gelatin / collagen (species not stated)': '明胶/胶原（物种未写明）',
    'Meat (species not stated)': '肉（物种未写明）', 'Blood / plasma (species not stated)': '血液/血浆（物种未写明）',
    'Plant (other)': '其他植物',
    // 蛋白形态
    'Hydrolysate': '水解物', 'Peptide': '肽', 'Muscle / myofibrillar protein': '肌肉/肌原纤维蛋白', 'Isolate': '分离蛋白',
    'Concentrate': '浓缩蛋白', 'Caseinate': '酪蛋白酸盐', 'Gelatin / collagen': '明胶/胶原', 'Single purified protein': '单一纯化蛋白',
    'Protein fraction': '蛋白组分', 'Flour / meal / whole seed': '粉/粕/全籽', 'Whole food / raw material': '原料/全食物',
    'Particles / aggregates / complexes': '颗粒/聚集体/复合物', 'Extract (crude)': '粗提物', 'Powder (unspecified)': '粉末（未说明）',
    'Other': '其他',
    // 处理类型
    'In vitro digestion': '体外消化', 'Enzymatic hydrolysis': '酶解', 'Enzymatic cross-linking': '酶交联',
    'Enzyme treatment (other)': '其他酶处理', 'Fermentation': '发酵', 'Germination / malting': '发芽/制麦',
    'Genetic modification / breeding': '基因改造/育种', 'Glycation (Maillard)': '糖基化（美拉德）', 'Acylation': '酰化',
    'Phosphorylation': '磷酸化', 'Deamidation': '脱酰胺', 'Oxidation': '氧化', 'Reduction / disulfide cleavage': '还原/二硫键断裂',
    'Chemical denaturation': '化学变性', 'Chemical cross-linking': '化学交联', 'Chemical modification (other)': '其他化学修饰',
    'Polyphenol binding': '多酚结合', 'Polysaccharide complexation': '多糖复合', 'pH shifting': 'pH 偏移',
    'High-pressure homogenization': '高压均质', 'High hydrostatic pressure': '超高压', 'Ultrasound': '超声',
    'Pulsed electric field': '脉冲电场', 'Cold plasma': '冷等离子体', 'Irradiation / UV / light': '辐照/紫外/光照', 'Ozone': '臭氧',
    'Microwave / radio frequency': '微波/射频', 'Ohmic heating': '欧姆加热', 'Extrusion': '挤压', 'Fibrillation': '纤维化',
    'Particle formation / encapsulation': '颗粒制备/包埋', 'Emulsification': '乳化', 'Gelation': '凝胶化',
    'Forming / film / fibre': '成型/成膜/纺丝', 'Salt / ion addition': '加盐/离子', 'Heating': '加热',
    'High-shear mixing / homogenization': '高速剪切/均质', 'Milling / cutting / dehulling': '粉碎/切割/脱壳',
    'Freezing / thawing': '冷冻/解冻', 'Drying': '干燥', 'Extraction / isolation': '提取/分离', 'Separation / purification': '分离纯化',
    'Peptide synthesis / expression': '肽合成/重组表达', 'Storage / aging': '储藏/陈化',
    'Dissolution / mixing / pH adjustment': '溶解/混合/调 pH', 'Cooling': '冷却',
  };
  const ROUTINE_TT = new Set(['Dissolution / mixing / pH adjustment', 'Separation / purification', 'Drying', 'Extraction / isolation',
    'Cooling', 'Storage / aging', 'Other']);
  const TCAT_NAMES = ['物理法', '化学法', '生物法', '复合法', '其他', '未处理'];
  const MODEL_SRC = new Set(['图反读', '图片表格反读']);

  const I18N = {
    zh: {
      fullname: 'Protein Functionality Database · 蛋白质功能特性数据库', nav_home: '概览', nav_search: '检索', nav_compare: '对比',
      notice: '带 <span class="badge model">模型</span> 标记的数值<b>来源于模型</b>：由模型从论文的图中读取，是估计值，不是作者给出的原值；没有标记的是作者在表格或正文中给出的原值。全部数据由自动流程从已发表论文中提取，使用前请点 DOI 对照原文核对。',
      download_all: '下载全部数据（CSV）', filters: '筛选', reset: '清除全部', keyword: '关键词',
      keyword_hint: '在题目、DOI、期刊、样品、蛋白、复配物、样品处理、测量名称、测试方法里找；空格隔开的几个词都要出现',
      value_range: '数值范围', value_hint: '按标准单位比较（换不了的按原单位）；先选性质和单位再用', ph_range: '测定 pH',
      ph_hint: '只认写成单个数的测定 pH', temp_range: '样品处理温度（°C）', temp_hint: '任一样品处理步骤的温度落在范围内',
      min: '最小', max: '最大', loading: '正在加载数据…', chart_btn: '图表', cols_btn: '显示列', page_size: '每页', export: '导出',
      footer: 'PFD 的数据来自已发表的期刊论文，只收录数值、样品组成、处理条件和测试方法概述，不含论文原文句子；论文的版权归原作者和出版商所有，使用数据请引用对应论文（DOI）。',
      built: '数据更新：{date}',
      f_prop: '功能特性', f_src: '蛋白来源', f_pcat: '蛋白类别', f_form: '蛋白形态', f_tt: '样品处理类型', f_tcat: '样品处理类别',
      f_method: '测试方法', f_sys: '体系', f_journal: '期刊', f_unit: '单位', f_origin: '数据来源', f_paper: '论文',
      o_author: '作者原值', o_model: '来源于模型（读图）', m_unextracted: '未提取方法', m_none: '原文未写明方法', m_amb: '方法不确定',
      not_stated: '原文未写明', no_unit: '（无单位）', unknown: '不明', find: '查找…', more: '更多 ({n})', less: '收起',
      count: '共 <b>{n}</b> 个数值，来自 <b>{s}</b> 个样品、<b>{p}</b> 篇论文',
      empty: '没有符合条件的数据', load_fail: '数据加载失败：{e}', loading_search: '正在加载关键词索引…',
      no_stream: '这个浏览器太旧，不能解压数据。请换用新版 Chrome、Edge、Firefox 或 Safari。',
      badge_model: '模型', badge_model_tip: '来源于模型：从论文图中读取的估计值，不是作者原值',
      sample_n: '样品 {n}', axis: '轴倍率 {m}', errbar: '误差棒 {lo} – {hi}', series: '系列 {s}', x: 'X = {x}', std: '= {v} {u}',
      col_prop: '性质', col_value: '数值', col_sample: '样品', col_protein: '蛋白', col_treat: '样品处理', col_method: '测试方法',
      col_ph: '测定 pH', col_journal: '期刊', col_source: '来源', col_measure: '测量名称', cond_lbl: '测定条件：',
      prev: '上一页', next: '下一页', expand: '展开', compare_add: '加入对比', compare_remove: '移出对比', compare_full: '最多对比 {n} 个样品',
      added: '已加入对比（{n}）', removed: '已移出对比',
      x_summary: '方法概述', x_summary_lang: '英文', x_cond: '全部测定条件', x_steps: '样品处理步骤', x_ing: '复配物', x_detail: '数据来源',
      x_no_summary: '这篇没有提取到这个数值的测试方法', sample_page: '样品页', paper_page: '论文页', open_doi: '打开原文（DOI）',
      // 首页
      h_title: '蛋白质功能特性数据库', h_lead: '从已发表论文中提取的食品蛋白质功能特性数值，附样品组成、样品处理和测试方法。',
      h_values: '个数值', h_search_ph: '搜索蛋白、处理方法、DOI…', h_go: '检索', h_papers: '论文', h_samples: '样品',
      h_methods: '测试方法记录', h_model: '来源于模型（读图）', h_model_note: '其余是作者在表格或正文中给出的原值',
      h_props: '各项功能特性的数值', h_props_sub: '点条形进入检索', h_src: '常见蛋白来源', h_src_sub: '按样品数，前 15',
      h_tt: '常见样品处理类型', h_tt_sub: '按样品数，不含溶解、离心、干燥等常规步骤', h_mt: '常见测试方法',
      h_mt_sub: '按数值个数，不含「其他方法」', h_jr: '期刊', h_jr_sub: '按论文数', n_values: '{n} 个数值', n_samples: '{n} 个样品',
      n_papers: '{n} 篇论文',
      // 图表
      c_hist: '分布', c_box: '分组比较', c_scatter: '散点', c_prop: '性质', c_unit: '单位', c_group: '分组', c_x: '横轴',
      c_log: '对数坐标', c_table: '表格', c_none: '当前结果里没有可以画的数值', c_note: '只画单位为「{u}」的 {n} 个数值（这项性质共 {m} 个）；作者原值和读图值一起画。',
      c_note_sc: '只画单位为「{u}」且有横轴取值的 {n} 个数值；点多于 {cap} 个时均匀抽取。', c_count: '数值个数', c_count_fmt: '{n} 个数值',
      c_median: '中位数', c_range: '范围', c_group_n: '组（每组至少 3 个数值，取前 12）', g_src: '蛋白来源', g_tt: '样品处理类型',
      g_method: '测试方法', g_pcat: '蛋白类别', g_form: '蛋白形态', g_journal: '期刊', g_sys: '体系', x_ph: '测定 pH',
      x_temp: '样品处理最高温度（°C）', group: '分组', n: 'n', median: '中位数', q1: '下四分位', q3: '上四分位',
      // 列
      cols_hint: '性质和数值两列一直显示',
      // 导出
      ex_csv: '数值表 · CSV', ex_xlsx: '数值表 · Excel', ex_wide_csv: '样品宽表 · CSV', ex_wide_xlsx: '样品宽表 · Excel',
      ex_cite_txt: '文献列表 · 文本', ex_cite_ris: '文献列表 · RIS（EndNote、Zotero）',
      ex_hint_rows: '一行一个数值（{n} 行）', ex_hint_wide: '一行一个样品（{n} 行），每项性质一列', ex_hint_cite: '{n} 篇论文',
      ex_confirm: '要导出 {n} 行，需要下载 {k} 块详细数据，可能要一会儿。继续吗？', ex_done: '已导出 {f}', ex_loading: '正在准备导出…',
      // 论文、样品、对比
      p_samples: '样品', p_methods: '测试方法（{n}）', p_methods_sub: '每项指标的测定方法概述（英文，由提取的方法名称、出处、参数、仪器拼成），可照着复现实验',
      p_in_search: '在检索中查看这篇的全部数值', p_n_values: '数值', p_applies: '对应图表', p_ref: '出处', p_inst: '仪器',
      p_notfound: '找不到这篇论文', s_notfound: '找不到这个样品', s_info: '样品信息', s_values: '数值（{n}）',
      s_methods: '这个样品用到的测试方法', d_desc: '说明', d_psrc: '蛋白来源', d_psrc_std: '规范名称', d_pcat: '蛋白类别',
      d_pform: '蛋白形态', d_pconc: '蛋白浓度', d_sys: '体系', d_ing: '复配物', d_steps: '样品处理步骤', d_none: '无',
      d_untreated: '未处理', d_types: '处理类型',
      cmp_title: '样品对比', cmp_empty: '还没有加入对比的样品。在检索结果里勾选左边的方框，或在样品页点「加入对比」（最多 {n} 个）。',
      cmp_clear: '清空', cmp_remove: '移出', cmp_paper: '论文', cmp_values: '数值', cmp_export_csv: '导出对比 · CSV',
      cmp_export_xlsx: '导出对比 · Excel',
      unextracted_note: '这篇论文还没有提取测试方法',
    },
    en: {
      fullname: 'Protein Functionality Database', nav_home: 'Overview', nav_search: 'Search', nav_compare: 'Compare',
      notice: 'Values marked <span class="badge model">Model</span> are <b>model-derived</b>: they were read from figures in the papers by a model and are estimates, not author-reported numbers. Unmarked values are author-reported (tables or main text). All data were extracted automatically from published papers — please check against the original article (DOI) before use.',
      download_all: 'Download all data (CSV)', filters: 'Filters', reset: 'Clear all', keyword: 'Keyword',
      keyword_hint: 'Searches title, DOI, journal, sample, protein, ingredients, sample treatment, measure name and test method; all space-separated words must match',
      value_range: 'Value range', value_hint: 'Compared in the standard unit (original unit where it could not be converted); pick a property and unit first',
      ph_range: 'Measurement pH', ph_hint: 'Only measurement pH given as a single number', temp_range: 'Sample treatment temperature (°C)',
      temp_hint: 'Any sample treatment step within the range', min: 'Min', max: 'Max', loading: 'Loading data…', chart_btn: 'Charts',
      cols_btn: 'Columns', page_size: 'Per page', export: 'Export',
      footer: 'PFD data were extracted from published journal articles. Only numerical values, sample composition, processing conditions and test-method summaries are included — no text from the articles. Copyright of the articles remains with their authors and publishers; please cite the original article (DOI) when using the data.',
      built: 'Data updated: {date}',
      f_prop: 'Functional property', f_src: 'Protein source', f_pcat: 'Protein category', f_form: 'Protein form',
      f_tt: 'Sample treatment type', f_tcat: 'Sample treatment category', f_method: 'Test method', f_sys: 'System', f_journal: 'Journal',
      f_unit: 'Unit', f_origin: 'Data origin', f_paper: 'Paper', o_author: 'Author-reported', o_model: 'Model-derived (from figure)',
      m_unextracted: 'Method not extracted', m_none: 'Not stated in the article', m_amb: 'Method unclear', not_stated: 'Not stated',
      no_unit: '(no unit)', unknown: 'Unknown', find: 'Find…', more: 'More ({n})', less: 'Less',
      count: '<b>{n}</b> values from <b>{s}</b> samples in <b>{p}</b> papers', empty: 'No data match the filters',
      load_fail: 'Failed to load data: {e}', loading_search: 'Loading keyword index…',
      no_stream: 'This browser is too old to decompress the data. Please use a recent Chrome, Edge, Firefox or Safari.',
      badge_model: 'Model', badge_model_tip: 'Model-derived: estimated from a figure, not an author-reported value',
      sample_n: 'Sample {n}', axis: 'axis multiplier {m}', errbar: 'error bar {lo} – {hi}', series: 'series {s}', x: 'X = {x}',
      std: '= {v} {u}', col_prop: 'Property', col_value: 'Value', col_sample: 'Sample', col_protein: 'Protein',
      col_treat: 'Sample treatment', col_method: 'Test method', col_ph: 'pH', col_journal: 'Journal', col_source: 'Source',
      col_measure: 'Measure', cond_lbl: 'Conditions: ', prev: 'Previous', next: 'Next', expand: 'Expand',
      compare_add: 'Add to compare', compare_remove: 'Remove from compare', compare_full: 'Compare up to {n} samples',
      added: 'Added to compare ({n})', removed: 'Removed from compare',
      x_summary: 'Method summary', x_summary_lang: 'English', x_cond: 'All measurement conditions', x_steps: 'Sample treatment steps',
      x_ing: 'Ingredients', x_detail: 'Data source', x_no_summary: 'No test method was extracted for this value',
      sample_page: 'Sample page', paper_page: 'Paper page', open_doi: 'Open article (DOI)',
      h_title: 'Protein Functionality Database', h_lead: 'Functional-property values of food proteins extracted from published papers, with sample composition, sample treatment and test methods.',
      h_values: 'values', h_search_ph: 'Search proteins, treatments, DOIs…', h_go: 'Search', h_papers: 'Papers', h_samples: 'Samples',
      h_methods: 'Test-method records', h_model: 'Model-derived (from figures)', h_model_note: 'the rest are author-reported values from tables or text',
      h_props: 'Values per functional property', h_props_sub: 'Click a bar to search', h_src: 'Common protein sources',
      h_src_sub: 'By samples, top 15', h_tt: 'Common sample treatments', h_tt_sub: 'By samples, excluding routine steps (dissolving, centrifugation, drying…)',
      h_mt: 'Common test methods', h_mt_sub: 'By values, excluding “Other method”', h_jr: 'Journals', h_jr_sub: 'By papers',
      n_values: '{n} values', n_samples: '{n} samples', n_papers: '{n} papers',
      c_hist: 'Distribution', c_box: 'By group', c_scatter: 'Scatter', c_prop: 'Property', c_unit: 'Unit', c_group: 'Group by',
      c_x: 'X axis', c_log: 'Log scale', c_table: 'Table', c_none: 'Nothing to plot in the current results',
      c_note: 'Plots the {n} values in “{u}” ({m} values of this property in total); author-reported and model-derived values together.',
      c_note_sc: 'Plots the {n} values in “{u}” that have an X value; sampled evenly above {cap} points.', c_count: 'Values',
      c_count_fmt: '{n} values', c_median: 'median', c_range: 'range', c_group_n: 'groups (≥ 3 values each, top 12)',
      g_src: 'Protein source', g_tt: 'Sample treatment type', g_method: 'Test method', g_pcat: 'Protein category', g_form: 'Protein form',
      g_journal: 'Journal', g_sys: 'System', x_ph: 'Measurement pH', x_temp: 'Highest sample treatment temperature (°C)',
      group: 'Group', n: 'n', median: 'Median', q1: 'Q1', q3: 'Q3', cols_hint: 'Property and value are always shown',
      ex_csv: 'Values · CSV', ex_xlsx: 'Values · Excel', ex_wide_csv: 'Sample wide table · CSV', ex_wide_xlsx: 'Sample wide table · Excel',
      ex_cite_txt: 'Reference list · text', ex_cite_ris: 'Reference list · RIS (EndNote, Zotero)',
      ex_hint_rows: 'One row per value ({n} rows)', ex_hint_wide: 'One row per sample ({n} rows), one column per property',
      ex_hint_cite: '{n} papers', ex_confirm: 'Exporting {n} rows needs {k} data blocks and may take a while. Continue?',
      ex_done: 'Exported {f}', ex_loading: 'Preparing export…',
      p_samples: 'Samples', p_methods: 'Test methods ({n})', p_methods_sub: 'How each property was measured (assembled from the extracted method name, reference, parameters and instrument) — enough to reproduce the test',
      p_in_search: 'Show all values of this paper in Search', p_n_values: 'Values', p_applies: 'Figures / tables', p_ref: 'Reference',
      p_inst: 'Instrument', p_notfound: 'Paper not found', s_notfound: 'Sample not found', s_info: 'Sample', s_values: 'Values ({n})',
      s_methods: 'Test methods used for this sample', d_desc: 'Description', d_psrc: 'Protein source', d_psrc_std: 'Standard name',
      d_pcat: 'Protein category', d_pform: 'Protein form', d_pconc: 'Protein concentration', d_sys: 'System', d_ing: 'Ingredients',
      d_steps: 'Sample treatment steps', d_none: 'None', d_untreated: 'Untreated', d_types: 'Treatment types',
      cmp_title: 'Compare samples', cmp_empty: 'No samples to compare yet. Tick the box at the left of a search result, or click “Add to compare” on a sample page (up to {n}).',
      cmp_clear: 'Clear', cmp_remove: 'Remove', cmp_paper: 'Paper', cmp_values: 'Values', cmp_export_csv: 'Export comparison · CSV',
      cmp_export_xlsx: 'Export comparison · Excel', unextracted_note: 'Test methods have not been extracted for this paper yet',
    },
  };

  // ================================================================ 工具 ==
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (s) => { const x = parseFloat(s); return Number.isFinite(x) ? x : null; };
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const MAX_CMP = 6;
  let LANG = (() => {
    try { const v = localStorage.getItem('lang'); if (v === 'zh' || v === 'en') return v; } catch (e) { /* 无痕模式等 */ }
    return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  })();
  const t = (k, vars) => {
    let s = I18N[LANG][k] ?? I18N.zh[k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split('{' + a + '}').join(b);
    return s;
  };
  const cat = (v) => (LANG === 'en' ? (EN[v] || v) : v);
  const zh = (v) => (LANG === 'zh' ? (ZH[v] || v) : v);
  const fmt = (n) => n.toLocaleString(LANG === 'zh' ? 'zh-CN' : 'en-US');
  const SUP = { '-': '⁻', '+': '⁺', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sci = (s) => String(s).replace(/^([-+]?\d+(?:\.\d+)?)e([-+]?\d+)$/i, (_, m, e) => m + ' × 10' + String(+e).split('').map((c) => SUP[c]).join(''));
  const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  const csvText = (rows) => '﻿' + rows.map((r) => r.map((v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n') + '\n';

  // ================================================================ 数据 ==
  const D = { chunkData: [], chunkWait: [] };
  let pending = 0;
  function progress(delta) {
    pending += delta;
    const el = $('progress');
    el.hidden = pending <= 0;
    el.style.width = pending > 0 ? '70%' : '100%';
  }
  async function gz(path, ver, asBuffer) {
    if (typeof DecompressionStream === 'undefined') throw new Error(t('no_stream'));
    progress(1);
    try {
      const res = await fetch(path + (ver ? '?v=' + ver : ''), { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + path);
      const r = new Response(res.body.pipeThrough(new DecompressionStream('gzip')));
      return asBuffer ? await r.arrayBuffer() : JSON.parse(await r.text());
    } finally { progress(-1); }
  }
  async function loadIndex() {
    const ver = document.querySelector('meta[name="data-version"]')?.content || '';
    const idx = await gz('data/index.json.gz', ver);
    Object.assign(D, idx);
    const buf = await gz('data/index.bin.gz', idx.meta.bin, true);
    const T = { u8: Uint8Array, u16: Uint16Array, u32: Uint32Array, f32: Float32Array };
    D.c = {};
    for (const [name, [kind, off, n]] of Object.entries(idx.meta.cols)) D.c[name] = new T[kind](buf, off, n);
    const C = D.c;
    D.nV = C.vs.length; D.nS = C.sp.length; D.nP = C.pj.length;
    D.veff = new Float32Array(D.nV);
    for (let i = 0; i < D.nV; i++) D.veff[i] = Number.isNaN(C.vstd[i]) ? C.vv[i] : C.vstd[i];
    D.sFirst = new Uint32Array(D.nP + 1);           // 每篇论文第一个样品的下标
    for (let s = 0; s < D.nS; s++) D.sFirst[C.sp[s] + 1]++;
    for (let p = 0; p < D.nP; p++) D.sFirst[p + 1] += D.sFirst[p];
    D.vFirst = new Uint32Array(D.nS + 1);           // 每个样品第一个数值的下标
    for (let i = 0; i < D.nV; i++) D.vFirst[C.vs[i] + 1]++;
    for (let s = 0; s < D.nS; s++) D.vFirst[s + 1] += D.vFirst[s];
    D.doiIndex = new Map(D.doi.map((d, i) => [d, i]));
    D.sMaxT = new Float32Array(D.nS).fill(NaN);
    for (let s = 0; s < D.nS; s++) for (let k = C.stemp_off[s]; k < C.stemp_off[s + 1]; k++) {
      if (!(C.stemp[k] <= D.sMaxT[s])) D.sMaxT[s] = C.stemp[k];
    }
  }
  let searchLoad = null;
  function loadSearch() {
    if (!searchLoad) searchLoad = gz('data/search.json.gz', D.meta.search).then((x) => { D.search = x; });
    return searchLoad;
  }
  const sampleNo = (s) => s - D.sFirst[D.c.sp[s]] + 1;
  const sampleKey = (s) => D.doi[D.c.sp[s]] + '~' + sampleNo(s);
  function sampleFromKey(key) {
    const k = key.lastIndexOf('~');
    const p = D.doiIndex.get(key.slice(0, k)), n = parseInt(key.slice(k + 1), 10);
    if (p === undefined || !(n >= 1) || D.sFirst[p] + n - 1 >= D.sFirst[p + 1]) return -1;
    return D.sFirst[p] + n - 1;
  }
  function chunkOf(field, x) {           // field 0 论文、2 样品、4 数值
    const ch = D.meta.chunks;
    let lo = 0, hi = ch.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ch[mid][field] <= x) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function loadChunk(k) {
    if (!D.chunkWait[k]) {
      const c = D.meta.chunks[k];
      D.chunkWait[k] = gz('data/chunk/' + String(k).padStart(3, '0') + '.json.gz', c[6]).then((x) => { D.chunkData[k] = x; return x; });
    }
    return D.chunkWait[k];
  }
  const ensure = (ks) => Promise.all([...new Set(ks)].map(loadChunk));
  // 取详细内容（块已下好）
  const VX = (i, f) => { const k = chunkOf(4, i); return D.chunkData[k].values[f][i - D.meta.chunks[k][4]]; };
  const SX = (s, f) => { const k = chunkOf(2, s); return D.chunkData[k].samples[f][s - D.meta.chunks[k][2]]; };
  const PX = (p, f) => { const k = chunkOf(0, p); return D.chunkData[k].papers[f][p - D.meta.chunks[k][0]]; };

  // ================================================================ 标签 ==
  const propName = (c) => PROP_NAMES[D.meta.props[c]][LANG === 'zh' ? 0 : 1];
  const methodName = (c) => (c === 0 ? t('m_unextracted') : c === 1 ? t('m_none') : c === 2 ? t('m_amb')
    : D.dict.method[c][LANG === 'zh' ? 1 : 0]);
  const srcOf = (s) => { const C = D.c, out = []; for (let k = C.ssrc_off[s]; k < C.ssrc_off[s + 1]; k++) out.push(C.ssrc[k]); return out; };
  const ttOf = (s) => { const C = D.c, out = []; for (let k = C.stt_off[s]; k < C.stt_off[s + 1]; k++) out.push(C.stt[k]); return out; };
  const tcatOf = (s) => { const b = D.c.stcat[s], out = []; for (let k = 0; k < 6; k++) if (b & (1 << k)) out.push(k); return out; };
  const srcLabel = (c) => zh(D.dict.src[c]);
  const formLabel = (c) => (c ? zh(D.dict.form[c]) : t('not_stated'));
  const ttLabel = (c) => zh(D.dict.tt[c]);
  const journalName = (p) => D.dict.journal[D.c.pj[p]] || '';

  // ================================================================ 分面 ==
  // level: v 数值、s 样品、p 论文；kind: one 单值、multi 多值（CSR）、bits 位
  let FACETS = [];
  function setupFacets() {
    const C = D.c, d = D.dict;
    FACETS = [
      { key: 'prop', level: 'v', n: D.meta.props.length, get: (i) => C.vp[i], label: propName, tok: (c) => D.meta.props[c], fixed: true },
      { key: 'src', level: 's', kind: 'multi', off: C.ssrc_off, ids: C.ssrc, n: d.src.length, label: srcLabel, tok: (c) => d.src[c], find: true, top: 10 },
      { key: 'pcat', level: 's', n: d.pcat.length, get: (s) => C.scat[s], label: (c) => cat(d.pcat[c]), tok: (c) => d.pcat[c] },
      { key: 'form', level: 's', n: d.form.length, get: (s) => C.sform[s], label: formLabel, tok: (c) => d.form[c] || '-', top: 10 },
      { key: 'tt', level: 's', kind: 'multi', off: C.stt_off, ids: C.stt, n: d.tt.length, label: ttLabel, tok: (c) => d.tt[c], find: true, top: 10 },
      { key: 'tcat', level: 's', kind: 'bits', n: 6, label: (c) => cat(TCAT_NAMES[c]), tok: (c) => TCAT_NAMES[c], fixed: true },
      { key: 'method', level: 'v', n: d.method.length, get: (i) => C.vm[i], label: methodName,
        tok: (c) => (c < 3 ? ['unextracted', 'notstated', 'unclear'][c] : d.method[c][0]), find: true, top: 10 },
      { key: 'sys', level: 's', n: d.sys.length, get: (s) => C.ssys[s], label: (c) => cat(d.sys[c]), tok: (c) => d.sys[c] },
      { key: 'journal', level: 'p', n: d.journal.length, get: (p) => C.pj[p], label: (c) => d.journal[c] || t('unknown'), tok: (c) => d.journal[c], find: true, top: 8 },
      { key: 'unit', level: 'v', n: d.unit.length, get: (i) => C.vu[i], label: (c) => d.unit[c] || t('no_unit'), tok: (c) => d.unit[c] || '-', find: true, top: 10 },
      { key: 'origin', level: 'v', n: 2, get: (i) => C.vo[i] & 1, label: (c) => t(c ? 'o_model' : 'o_author'), tok: (c) => (c ? 'model' : 'author'), fixed: true },
    ];
    FACETS.forEach((f, fi) => {
      f.bit = 1 << fi;
      f.fromTok = new Map();
      for (let c = 0; c < f.n; c++) f.fromTok.set(f.tok(c), c);
      f.count = new Uint32Array(f.n);
      f.mask = new Uint8Array(f.n);
    });
  }
  const facetByKey = (k) => FACETS.find((f) => f.key === k);

  // ================================================================ 检索状态 ==
  const RANGES = ['vmin', 'vmax', 'phmin', 'phmax', 'tmin', 'tmax'];
  const SORTS = ['paper', 'prop', 'vasc', 'vdesc', 'src', 'method', 'journal', 'ph'];
  const S = { q: '', paper: '', sort: 'paper', page: 0, size: 50, sel: {} };
  RANGES.forEach((k) => { S[k] = ''; });
  const UI = { open: new Set(), more: new Set(), find: {}, chart: false, chartType: 'hist', chartProp: -1, chartUnit: -1,
               chartGroup: 'src', chartX: 'ph', chartLog: false, chartTable: false };
  try { const v = JSON.parse(localStorage.getItem('pfd_ui') || '{}'); Object.assign(UI, { chart: !!v.chart, chartType: v.chartType || 'hist', chartGroup: v.chartGroup || 'src', chartX: v.chartX || 'ph' }); if (v.size) S.size = v.size; } catch (e) { /* 忽略 */ }
  const saveUI = () => { try { localStorage.setItem('pfd_ui', JSON.stringify({ chart: UI.chart, chartType: UI.chartType, chartGroup: UI.chartGroup, chartX: UI.chartX, size: S.size, cols: [...visibleCols] })); } catch (e) { /* 忽略 */ } };

  function readSearch(params) {
    S.q = params.get('q') || '';
    S.paper = params.get('paper') || '';
    for (const f of FACETS) {
      f.mask.fill(0);
      const v = params.get(f.key);
      S.sel[f.key] = new Set();
      if (v) for (const tok of v.split('|')) { const c = f.fromTok.get(tok); if (c !== undefined) { S.sel[f.key].add(c); f.mask[c] = 1; } }
    }
    RANGES.forEach((k) => { S[k] = params.get(k) || ''; });
    S.sort = SORTS.includes(params.get('sort')) ? params.get('sort') : 'paper';
    S.page = Math.max(0, (parseInt(params.get('page'), 10) || 1) - 1);
  }
  function searchParams() {
    const h = new URLSearchParams();
    if (S.q) h.set('q', S.q);
    if (S.paper) h.set('paper', S.paper);
    for (const f of FACETS) if (S.sel[f.key].size) h.set(f.key, [...S.sel[f.key]].map(f.tok).join('|'));
    RANGES.forEach((k) => { if (S[k] !== '') h.set(k, S[k]); });
    if (S.sort !== 'paper') h.set('sort', S.sort);
    if (S.page) h.set('page', S.page + 1);
    return h;
  }
  const searchHref = (h) => '#/search' + (h.toString() ? '?' + h.toString() : '');
  function writeSearchHash() { history.replaceState(null, '', searchHref(searchParams())); }
  function clearFilters() {
    S.q = ''; S.paper = '';
    for (const f of FACETS) { S.sel[f.key] = new Set(); f.mask.fill(0); }
    RANGES.forEach((k) => { S[k] = ''; });
  }

  // ================================================================ 筛选、计数 ==
  let result = new Uint32Array(0);
  async function compute() {
    const C = D.c, nV = D.nV, nS = D.nS, nP = D.nP;
    const tokens = S.q.trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 16);
    let pTok = null, sTok = null, nTok = null, full = 0;
    if (tokens.length) {
      if (!D.search) { $('count').textContent = t('loading_search'); await loadSearch(); }
      const X = D.search;
      full = (1 << tokens.length) - 1;
      const bits = (arr) => { const out = new Uint32Array(arr.length); for (let k = 0; k < arr.length; k++) { const s = arr[k]; let b = 0; for (let j = 0; j < tokens.length; j++) if (s.includes(tokens[j])) b |= 1 << j; out[k] = b; } return out; };
      pTok = bits(X.ptext); sTok = bits(X.stext); nTok = bits(X.names);
    }
    const paper = S.paper ? D.doiIndex.get(S.paper) : undefined;
    const vmin = num(S.vmin), vmax = num(S.vmax), phmin = num(S.phmin), phmax = num(S.phmax), tmin = num(S.tmin), tmax = num(S.tmax);
    const useV = vmin !== null || vmax !== null, usePH = phmin !== null || phmax !== null, useT = tmin !== null || tmax !== null;
    // 样品、论文这两层先算好「哪些分面不满足」
    const sFail = new Uint16Array(nS), pFail = new Uint16Array(nP), sHard = new Uint8Array(nS);
    for (const f of FACETS) {
      if (!S.sel[f.key].size) continue;
      if (f.level === 's') {
        for (let s = 0; s < nS; s++) {
          let ok = false;
          if (f.kind === 'multi') { for (let k = f.off[s]; k < f.off[s + 1]; k++) if (f.mask[f.ids[k]]) { ok = true; break; } }
          else if (f.kind === 'bits') { const b = C.stcat[s]; for (let k = 0; k < 6; k++) if ((b & (1 << k)) && f.mask[k]) { ok = true; break; } }
          else ok = f.mask[f.get(s)] === 1;
          if (!ok) sFail[s] |= f.bit;
        }
      } else if (f.level === 'p') {
        for (let p = 0; p < nP; p++) if (!f.mask[f.get(p)]) pFail[p] |= f.bit;
      }
    }
    if (useT) for (let s = 0; s < nS; s++) {
      let ok = false;
      for (let k = C.stemp_off[s]; k < C.stemp_off[s + 1]; k++) { const x = C.stemp[k]; if ((tmin === null || x >= tmin) && (tmax === null || x <= tmax)) { ok = true; break; } }
      if (!ok) sHard[s] = 1;
    }
    const vFacets = FACETS.filter((f) => f.level === 'v' && S.sel[f.key].size);
    for (const f of FACETS) f.count.fill(0);
    const add = (f, i, s, p) => {
      if (f.level === 'v') f.count[f.get(i)]++;
      else if (f.level === 'p') f.count[f.get(p)]++;
      else if (f.kind === 'multi') { for (let k = f.off[s]; k < f.off[s + 1]; k++) f.count[f.ids[k]]++; }
      else if (f.kind === 'bits') { const b = C.stcat[s]; for (let k = 0; k < 6; k++) if (b & (1 << k)) f.count[k]++; }
      else f.count[f.get(s)]++;
    };
    const out = new Uint32Array(nV);
    let n = 0;
    const vs = C.vs, sp = C.sp, veff = D.veff, vph = C.vph, vname = D.search?.vname;
    const lo = paper === undefined ? 0 : D.vFirst[D.sFirst[paper]], hi = paper === undefined ? nV : D.vFirst[D.sFirst[paper + 1]];
    for (let i = lo; i < hi; i++) {
      const s = vs[i];
      if (sHard[s]) continue;
      const p = sp[s];
      if (full && ((pTok[p] | sTok[s] | nTok[vname[i]]) !== full)) continue;
      if (useV) { const x = veff[i]; if (!(x === x) || (vmin !== null && x < vmin) || (vmax !== null && x > vmax)) continue; }
      if (usePH) { const x = vph[i]; if (!(x === x) || (phmin !== null && x < phmin) || (phmax !== null && x > phmax)) continue; }
      let fails = sFail[s] | pFail[p];
      for (let k = 0; k < vFacets.length; k++) { const f = vFacets[k]; if (!f.mask[f.get(i)]) fails |= f.bit; }
      if (fails === 0) { out[n++] = i; for (let k = 0; k < FACETS.length; k++) add(FACETS[k], i, s, p); }
      else if ((fails & (fails - 1)) === 0) { const f = FACETS[31 - Math.clz32(fails)]; add(f, i, s, p); }
    }
    result = out.slice(0, n);
    sortResult();
  }
  function sortResult() {
    const C = D.c, V = D.veff;
    let srcRank = null;
    if (S.sort === 'src') {                 // 每个样品第一个蛋白来源按名称排的名次（没有来源的排最后）
      const order = D.dict.src.map((_, c) => c).sort((a, b) => srcLabel(a).localeCompare(srcLabel(b)));
      const rank = new Uint32Array(D.dict.src.length);
      order.forEach((c, k) => { rank[c] = k; });
      srcRank = new Uint32Array(D.nS);
      for (let s = 0; s < D.nS; s++) srcRank[s] = C.ssrc_off[s] < C.ssrc_off[s + 1] ? rank[C.ssrc[C.ssrc_off[s]]] : 0xffffffff;
    }
    const by = {
      prop: (a, b) => C.vp[a] - C.vp[b] || a - b,
      vasc: (a, b) => { const x = V[a], y = V[b]; return (x !== x) - (y !== y) || (x - y) || a - b; },
      vdesc: (a, b) => { const x = V[a], y = V[b]; return (x !== x) - (y !== y) || (y - x) || a - b; },
      src: (a, b) => { const x = srcRank[C.vs[a]], y = srcRank[C.vs[b]]; return x - y || a - b; },
      method: (a, b) => (C.vm[a] < 3) - (C.vm[b] < 3) || (C.vm[a] !== C.vm[b] ? methodName(C.vm[a]).localeCompare(methodName(C.vm[b])) : 0) || a - b,
      journal: (a, b) => journalName(C.sp[C.vs[a]]).localeCompare(journalName(C.sp[C.vs[b]])) || a - b,
      ph: (a, b) => { const x = C.vph[a], y = C.vph[b]; return (x !== x) - (y !== y) || (x - y) || a - b; },
    }[S.sort];
    if (by) result.sort(by);
  }

  // ================================================================ 筛选栏 ==
  function facetOrder(f) {
    const codes = [];
    for (let c = 0; c < f.n; c++) if (f.count[c] || S.sel[f.key].has(c)) codes.push(c);
    if (!f.fixed) codes.sort((a, b) => f.count[b] - f.count[a] || f.label(a).localeCompare(f.label(b)));
    return codes;
  }
  function renderFacets() {
    $('facets').innerHTML = FACETS.map((f, fi) => {
      let codes = facetOrder(f);
      const find = (UI.find[f.key] || '').toLowerCase();
      if (find) codes = codes.filter((c) => f.label(c).toLowerCase().includes(find) || String(f.tok(c)).toLowerCase().includes(find));
      const total = codes.length, top = f.top || 99;
      const showAll = UI.more.has(f.key) || find;
      let shown = showAll ? codes.slice(0, 400) : codes.slice(0, top);
      for (const c of S.sel[f.key]) if (!shown.includes(c)) shown.push(c);
      return `<section class="facet"><h3><span>${esc(t('f_' + f.key))}</span>${S.sel[f.key].size ? `<button class="link" type="button" data-clear="${fi}">${esc(t('reset'))}</button>` : ''}</h3>
        ${f.find && (total > top || find) ? `<input class="facet-find" type="search" data-find="${fi}" placeholder="${esc(t('find'))}" value="${esc(UI.find[f.key] || '')}">` : ''}
        <div class="facet-opts">${shown.map((c) => `<label class="facet-opt${f.count[c] || S.sel[f.key].has(c) ? '' : ' zero'}" data-f="${fi}" data-o="${c}">
          <input type="checkbox" ${S.sel[f.key].has(c) ? 'checked' : ''}><span class="lbl">${esc(f.label(c))}</span><span class="n">${fmt(f.count[c])}</span></label>`).join('')}</div>
        ${!find && total > top ? `<button class="link facet-more" type="button" data-more="${fi}">${esc(UI.more.has(f.key) ? t('less') : t('more', { n: total }))}</button>` : ''}
      </section>`;
    }).join('');
  }
  function renderActive() {
    const chips = [];
    if (S.paper) chips.push(['paper', '', `${t('f_paper')}: ${S.paper}`]);
    if (S.q) chips.push(['q', '', `${t('keyword')}: ${S.q}`]);
    for (const f of FACETS) for (const c of S.sel[f.key]) chips.push([f.key, c, `${t('f_' + f.key)}: ${f.label(c)}`]);
    const rng = [['vmin', 'vmax', 'value_range'], ['phmin', 'phmax', 'ph_range'], ['tmin', 'tmax', 'temp_range']];
    for (const [a, b, k] of rng) if (S[a] !== '' || S[b] !== '') chips.push([a, b, `${t(k)}: ${S[a] || '…'} – ${S[b] || '…'}`]);
    $('active-filters').innerHTML = chips.map(([k, c, txt]) => `<button class="chip brand" type="button" data-k="${esc(k)}" data-c="${esc(c)}">${esc(txt)}</button>`).join('');
  }

  // ================================================================ 结果表 ==
  const COLS = [
    { key: 'prop', fixed: true, w: 12, sort: 'prop' },
    { key: 'value', fixed: true, w: 14, sort: 'value' },
    { key: 'sample', w: 12 },
    { key: 'protein', w: 13, sort: 'src' },
    { key: 'treat', w: 18 },
    { key: 'method', w: 15, sort: 'method' },
    { key: 'ph', w: 6, sort: 'ph', off: true },
    { key: 'journal', w: 11, sort: 'journal', off: true },
    { key: 'source', w: 12, sort: 'paper' },
  ];
  let visibleCols = new Set(COLS.filter((c) => !c.off).map((c) => c.key));
  try { const v = JSON.parse(localStorage.getItem('pfd_ui') || '{}').cols; if (Array.isArray(v) && v.length) visibleCols = new Set(v.concat(['prop', 'value'])); } catch (e) { /* 忽略 */ }
  const shownCols = () => COLS.filter((c) => c.fixed || visibleCols.has(c.key));

  function renderHead() {
    const cols = shownCols();
    const total = cols.reduce((a, c) => a + c.w, 0);
    const ariaSort = (c) => {
      if (c.key === 'value') return S.sort === 'vasc' ? 'ascending' : S.sort === 'vdesc' ? 'descending' : 'none';
      return c.sort && S.sort === c.sort ? 'ascending' : 'none';
    };
    $('thead').innerHTML = `<tr><th class="col-chk" scope="col"><span hidden>✓</span></th><th class="col-exp" scope="col"></th>${cols.map((c) => {
      const as = ariaSort(c), arrow = as === 'ascending' ? '▲' : as === 'descending' ? '▼' : c.sort ? '↕' : '';
      return `<th scope="col" style="width:${(c.w / total * 100).toFixed(1)}%" ${c.sort ? `class="sortable" data-sort="${c.sort}" aria-sort="${as}"` : ''}>${esc(t('col_' + c.key))}${arrow ? `<span class="arrow">${arrow}</span>` : ''}</th>`;
    }).join('')}</tr>`;
  }

  function valueHTML(i, badge) {
    let h = `<span class="num">${esc(sci(VX(i, 'vt')))}</span>`;
    const sd = VX(i, 'sd'), unit = VX(i, 'unit'), sig = VX(i, 'sig');
    if (sd) h += ` ± ${esc(sd)}`;
    if (unit) h += ` ${esc(unit)}`;
    if (sig) h += `<span class="sig">${esc(sig)}</span>`;
    if (badge && D.c.vo[i] & 1) h += `<span class="badge model" title="${esc(t('badge_model_tip'))}">${esc(t('badge_model'))}</span>`;
    const extra = [], mul = VX(i, 'mul'), lo = VX(i, 'lo'), hi = VX(i, 'hi'), vstd = VX(i, 'vstd'), ustd = VX(i, 'ustd');
    if (mul) extra.push(t('axis', { m: esc(mul) }));
    if (lo || hi) extra.push(t('errbar', { lo: esc(lo || '?'), hi: esc(hi || '?') }));
    if (vstd && ustd && !(unit === ustd && num(vstd) === num(VX(i, 'vt')))) extra.push(t('std', { v: esc(sci(vstd)), u: esc(ustd) }));
    if (extra.length) h += `<div class="extra">${extra.join(' · ')}</div>`;
    return h;
  }
  function methodHTML(i, clampIt) {
    const parts = [], m = D.c.vm[i];
    parts.push(m >= 3 ? `<div class="mtd">${esc(methodName(m))}</div>` : `<div class="dim">${esc(methodName(m))}</div>`);
    const mp = VX(i, 'mp'), cond = VX(i, 'cond');
    if (mp) parts.push(`<div class="dim${clampIt ? ' clamp c2' : ''}" title="${esc(mp)}">${esc(mp)}</div>`);
    if (cond) parts.push(`<div class="dim${clampIt ? ' clamp c2' : ''}" title="${esc(cond)}">${esc(t('cond_lbl') + cond)}</div>`);
    return parts.join('');
  }
  function sourceHTML(i, withDoi) {
    const s = D.c.vs[i], p = D.c.sp[s];
    let h = esc(cat(VX(i, 'item')));
    const panel = VX(i, 'panel');
    if (panel) h += ` <span class="dim" title="${esc(panel)}">${esc(clip(panel, 18))}</span>`;
    const more = [];
    if (MODEL_SRC.has(VX(i, 'src'))) {
      if (VX(i, 'series')) more.push(t('series', { s: esc(clip(VX(i, 'series'), 30)) }));
      if (VX(i, 'x')) more.push(t('x', { x: esc(clip(VX(i, 'x') + (VX(i, 'xu') ? ' ' + VX(i, 'xu') : ''), 30)) }));
    }
    if (more.length) h += `<div class="dim">${more.join(' · ')}</div>`;
    if (withDoi) h += `<div><a href="${paperHref(p)}" title="${esc(PX(p, 'title'))}">${esc(clip(D.doi[p], 30))}</a></div>`;
    return h;
  }
  const paperHref = (p) => '#/paper?doi=' + encodeURIComponent(D.doi[p]);
  const sampleHref = (s) => '#/sample?doi=' + encodeURIComponent(D.doi[D.c.sp[s]]) + '&n=' + sampleNo(s);
  const doiHref = (p) => 'https://doi.org/' + encodeURI(D.doi[p]);
  function proteinHTML(s) {
    const src = srcOf(s).map(srcLabel).join(' · '), raw = SX(s, 'psrc'), f = D.c.sform[s];
    return `<div class="clamp c2" title="${esc(raw)}">${esc(src || raw || '—')}</div>
      <div class="dim">${esc([f ? formLabel(f) : '', cat(D.dict.pcat[D.c.scat[s]])].filter(Boolean).join(' · '))}</div>`;
  }
  function typesHTML(s, max = 4) {
    const tts = ttOf(s);
    const shown = tts.filter((c) => !ROUTINE_TT.has(D.dict.tt[c]));
    const list = (shown.length ? shown : tts).slice(0, max);
    return list.map((c) => `<span class="chip">${esc(ttLabel(c))}</span>`).join('') + (tts.length > list.length && shown.length > max ? `<span class="dim">+${shown.length - max}</span>` : '');
  }
  function treatText(s) { const x = SX(s, 'treat'); return x === '未处理' ? t('d_untreated') : x; }
  function cellHTML(key, i) {
    const s = D.c.vs[i], p = D.c.sp[s];
    switch (key) {
      case 'prop': return `<div class="prop">${esc(propName(D.c.vp[i]))}</div><div class="mname clamp c2" title="${esc(VX(i, 'name'))}">${esc(VX(i, 'name'))}</div>`;
      case 'value': return `<div class="val">${valueHTML(i, true)}</div>`;
      case 'sample': { const name = SX(s, 'name') || t('sample_n', { n: sampleNo(s) });
        return `<a class="strong clamp c2" href="${sampleHref(s)}" title="${esc(name)}">${esc(name)}</a><div class="dim">${esc(t('sample_n', { n: sampleNo(s) }))}</div>`; }
      case 'protein': return proteinHTML(s);
      case 'treat': return `<div class="clamp c2" title="${esc(treatText(s))}">${esc(treatText(s))}</div><div>${typesHTML(s, 3)}</div>`;
      case 'method': return methodHTML(i, true);
      case 'ph': { const x = D.c.vph[i]; return x === x ? `<span class="tnum">${+x.toFixed(2)}</span>` : '<span class="dim">—</span>'; }
      case 'journal': return `<span class="clamp c2">${esc(journalName(p))}</span>`;
      case 'source': return sourceHTML(i, true);
      default: return '';
    }
  }
  function methodOf(i) {        // 这个数值对应的方法记录（论文的方法表里 id 相同的那条）
    const mid = VX(i, 'mid');
    if (!mid) return null;
    const p = D.c.sp[D.c.vs[i]];
    return (PX(p, 'methods') || []).find((m) => m[0] === mid) || null;
  }
  function summaryHTML(m) {
    return `<div class="summary">${esc(m[4] || m[3])}<span class="lang">(${esc(t('x_summary_lang'))})</span></div>`;
  }
  function expandHTML(i, ncol) {
    const s = D.c.vs[i], p = D.c.sp[s], m = methodOf(i);
    const steps = SX(s, 'steps'), ings = SX(s, 'ings');
    const cond = VX(i, 'cond');
    const inCmp = CMP.includes(sampleKey(s));
    return `<tr class="expand"><td colspan="${ncol}"><div class="exp-grid">
      <div class="span2"><h4>${esc(t('x_summary'))}${m ? ' · ' + esc(methodName(D.c.vm[i])) : ''}</h4>${m ? summaryHTML(m) : `<div class="dim">${esc(D.c.vm[i] ? methodName(D.c.vm[i]) : t('x_no_summary'))}</div>`}</div>
      <div><h4>${esc(t('x_cond'))}</h4><div>${esc(cond || '—')}</div></div>
      <div class="span2"><h4>${esc(t('x_steps'))}</h4>${steps.length ? `<ol class="steps">${steps.map(([mm, c, ty, pr]) => `<li><b>${esc(mm)}</b> <span class="dim">${esc(cat(c))}${ty ? ' · ' + esc(ty.split(' | ').map(zh).join(' · ')) : ''}</span>${pr ? `<div class="dim">${esc(pr)}</div>` : ''}</li>`).join('')}</ol>` : esc(t('d_untreated'))}</div>
      <div><h4>${esc(t('x_ing'))}</h4>${ings.length ? ings.map(([n, c, a]) => `<div>${esc(n)} <span class="dim">(${esc(cat(c))}${a ? ', ' + esc(a) : ''})</span></div>`).join('') : esc(t('d_none'))}
        <h4 style="margin-top:10px">${esc(t('x_detail'))}</h4>${sourceHTML(i, false)}<div class="dim">${esc(journalName(p))}</div></div>
    </div><div class="exp-actions">
      <a class="btn small" href="${sampleHref(s)}">${esc(t('sample_page'))}</a>
      <a class="btn ghost small" href="${paperHref(p)}">${esc(t('paper_page'))}</a>
      <button class="btn ghost small" type="button" data-cmp="${s}">${esc(t(inCmp ? 'compare_remove' : 'compare_add'))}</button>
      <a class="btn ghost small" href="${doiHref(p)}" target="_blank" rel="noopener">${esc(t('open_doi'))}</a>
    </div></td></tr>`;
  }
  let renderSeq = 0;
  async function renderRows() {
    const seq = ++renderSeq;
    const nPages = Math.max(1, Math.ceil(result.length / S.size));
    if (S.page >= nPages) S.page = nPages - 1;
    const slice = Array.from(result.subarray(S.page * S.size, S.page * S.size + S.size));
    const cols = shownCols(), ncol = cols.length + 2;
    renderPager(nPages);
    if (!slice.length) { $('rows').innerHTML = `<tr><td colspan="${ncol}" class="empty">${esc(t('empty'))}</td></tr>`; return; }
    const need = slice.map((i) => chunkOf(4, i)).filter((k) => !D.chunkData[k]);
    if (need.length) {
      $('rows').innerHTML = `<tr><td colspan="${ncol}" class="loading">${esc(t('loading'))}</td></tr>`;
      await ensure(need);
      if (seq !== renderSeq) return;
    }
    $('rows').innerHTML = slice.map((i) => {
      const s = D.c.vs[i], open = UI.open.has(i);
      return `<tr class="row${open ? ' open' : ''}" data-i="${i}">
        <td class="col-chk"><input type="checkbox" data-cmp-chk="${s}" ${CMP.includes(sampleKey(s)) ? 'checked' : ''} aria-label="${esc(t('compare_add'))}" title="${esc(t('compare_add'))}"></td>
        <td class="col-exp"><button class="exp-btn" type="button" data-exp="${i}" aria-expanded="${open}" aria-label="${esc(t('expand'))}">${open ? '−' : '+'}</button></td>
        ${cols.map((c) => `<td>${cellHTML(c.key, i)}</td>`).join('')}</tr>${open ? expandHTML(i, ncol) : ''}`;
    }).join('');
  }
  function renderPager(nPages) {
    if (nPages <= 1) { $('pager').innerHTML = ''; return; }
    const p = S.page;
    const list = [...new Set([0, nPages - 1, p - 2, p - 1, p, p + 1, p + 2].filter((x) => x >= 0 && x < nPages))].sort((a, b) => a - b);
    let h = `<button type="button" data-page="${p - 1}" ${p === 0 ? 'disabled' : ''} aria-label="${esc(t('prev'))}">‹</button>`;
    list.forEach((x, k) => {
      if (k && x - list[k - 1] > 1) h += '<span>…</span>';
      h += `<button type="button" data-page="${x}" ${x === p ? 'aria-current="page"' : ''}>${x + 1}</button>`;
    });
    $('pager').innerHTML = h + `<button type="button" data-page="${p + 1}" ${p >= nPages - 1 ? 'disabled' : ''} aria-label="${esc(t('next'))}">›</button>`;
  }
  function resultStats() {
    const ms = new Uint8Array(D.nS), mp = new Uint8Array(D.nP);
    let ns = 0, np = 0;
    for (const i of result) { const s = D.c.vs[i]; if (!ms[s]) { ms[s] = 1; ns++; const p = D.c.sp[s]; if (!mp[p]) { mp[p] = 1; np++; } } }
    return { ns, np };
  }
  function renderCount() {
    const { ns, np } = resultStats();
    if (LANG === 'en') {
      const pl = (n, w) => `<b>${fmt(n)}</b> ${w}${n === 1 ? '' : 's'}`;
      $('count').innerHTML = `${pl(result.length, 'value')} from ${pl(ns, 'sample')} in ${pl(np, 'paper')}`;
    } else $('count').innerHTML = t('count', { n: fmt(result.length), s: fmt(ns), p: fmt(np) });
  }
  let refreshSeq = 0;
  async function refresh(keepPage) {
    const seq = ++refreshSeq;
    if (!keepPage) { S.page = 0; UI.open.clear(); }
    await compute();
    if (seq !== refreshSeq) return;
    renderFacets();
    renderActive();
    renderCount();
    renderHead();
    writeSearchHash();
    renderChart();
    await renderRows();
  }
  function syncInputs() {
    $('q').value = S.q;
    RANGES.forEach((k) => { $(k).value = S[k]; });
    $('page-size').value = String(S.size);
  }

  // ================================================================ 图表 ==
  const GROUPS = {
    src: (s) => srcOf(s).map((c) => ['s' + c, srcLabel(c)]),
    tt: (s) => ttOf(s).filter((c) => !ROUTINE_TT.has(D.dict.tt[c])).map((c) => ['t' + c, ttLabel(c)]),
    method: (s, i) => (D.c.vm[i] >= 3 ? [['m' + D.c.vm[i], methodName(D.c.vm[i])]] : []),
    pcat: (s) => [['c' + D.c.scat[s], cat(D.dict.pcat[D.c.scat[s]])]],
    form: (s) => (D.c.sform[s] ? [['f' + D.c.sform[s], formLabel(D.c.sform[s])]] : []),
    journal: (s) => [['j' + D.c.pj[D.c.sp[s]], journalName(D.c.sp[s]) || t('unknown')]],
    sys: (s) => [['y' + D.c.ssys[s], cat(D.dict.sys[D.c.ssys[s]])]],
  };
  const SC_CAP = 4000;
  function renderChart() {
    const panel = $('chart-panel');
    $('chart-toggle').setAttribute('aria-expanded', UI.chart);
    panel.hidden = !UI.chart;
    if (!UI.chart) return;
    const C = D.c;
    // 当前结果里有哪些性质、各性质有哪些单位
    const pc = new Map();
    for (const i of result) pc.set(C.vp[i], (pc.get(C.vp[i]) || 0) + 1);
    const props = [...pc.entries()].sort((a, b) => b[1] - a[1]);
    if (!props.length) { panel.innerHTML = `<div class="chart-empty">${esc(t('c_none'))}</div>`; return; }
    if (!pc.has(UI.chartProp)) { UI.chartProp = props[0][0]; UI.chartUnit = -1; }
    const uc = new Map();
    for (const i of result) if (C.vp[i] === UI.chartProp && D.veff[i] === D.veff[i]) uc.set(C.vu[i], (uc.get(C.vu[i]) || 0) + 1);
    const units = [...uc.entries()].sort((a, b) => b[1] - a[1]);
    if (!uc.has(UI.chartUnit)) UI.chartUnit = units.length ? units[0][0] : -1;
    const unitLbl = UI.chartUnit >= 0 ? (D.dict.unit[UI.chartUnit] || t('no_unit')) : '';
    const rows = [];
    for (const i of result) if (C.vp[i] === UI.chartProp && C.vu[i] === UI.chartUnit && D.veff[i] === D.veff[i]) rows.push(i);
    const opt = (v, cur, label) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(label)}</option>`;
    const seg = (k, lbl) => `<button type="button" data-ctype="${k}" aria-pressed="${UI.chartType === k}">${esc(t(lbl))}</button>`;
    panel.innerHTML = `<div class="chart-controls">
        <span class="seg">${seg('hist', 'c_hist')}${seg('box', 'c_box')}${seg('scatter', 'c_scatter')}</span>
        <label class="lbl-inline">${esc(t('c_prop'))} <select id="c-prop">${props.map(([c, n]) => opt(c, UI.chartProp, `${propName(c)} (${fmt(n)})`)).join('')}</select></label>
        <label class="lbl-inline">${esc(t('c_unit'))} <select id="c-unit">${units.map(([c, n]) => opt(c, UI.chartUnit, `${D.dict.unit[c] || t('no_unit')} (${fmt(n)})`)).join('')}</select></label>
        ${UI.chartType === 'box' ? `<label class="lbl-inline">${esc(t('c_group'))} <select id="c-group">${Object.keys(GROUPS).map((g) => opt(g, UI.chartGroup, t('g_' + g))).join('')}</select></label>` : ''}
        ${UI.chartType === 'scatter' ? `<label class="lbl-inline">${esc(t('c_x'))} <select id="c-x">${opt('ph', UI.chartX, t('x_ph'))}${opt('temp', UI.chartX, t('x_temp'))}</select></label>` : ''}
        <label class="lbl-inline"><input type="checkbox" id="c-log" ${UI.chartLog ? 'checked' : ''}> ${esc(t('c_log'))}</label>
        <label class="lbl-inline"><input type="checkbox" id="c-table" ${UI.chartTable ? 'checked' : ''}> ${esc(t('c_table'))}</label>
      </div>
      ${UI.chartType === 'scatter' ? `<div class="legend" style="padding-top:10px"><span><i style="background:var(--series-1)"></i>${esc(t('o_author'))}</span><span><i style="background:var(--series-2)"></i>${esc(t('o_model'))}</span></div>` : ''}
      <div class="chart-box" id="chart-box"></div><div class="chart-note" id="chart-note"></div><div id="chart-table"></div>`;
    const box = $('chart-box'), yLbl = `${propName(UI.chartProp)}${unitLbl ? ' (' + unitLbl + ')' : ''}`;
    const total = pc.get(UI.chartProp);
    let table = null;
    if (UI.chartType === 'hist') {
      const vals = rows.map((i) => D.veff[i]);
      PFDCharts.histogram(box, vals, { log: UI.chartLog, xLabel: yLbl, yLabel: t('c_count'), empty: t('c_none'), countFmt: (n) => t('c_count_fmt', { n: fmt(n) }) });
      $('chart-note').textContent = t('c_note', { n: fmt(rows.length), u: unitLbl, m: fmt(total) });
    } else if (UI.chartType === 'box') {
      const g = new Map();
      for (const i of rows) for (const [k, label] of GROUPS[UI.chartGroup](C.vs[i], i)) {
        if (!g.has(k)) g.set(k, { key: k, label, values: [] });
        g.get(k).values.push(D.veff[i]);
      }
      const groups = [...g.values()].filter((x) => x.values.length >= 3).sort((a, b) => b.values.length - a.values.length).slice(0, 12);
      groups.forEach((x) => x.values.sort((a, b) => a - b));
      PFDCharts.boxplot(box, groups, { log: UI.chartLog, xLabel: yLbl, empty: t('c_none'), medLbl: t('c_median'), rangeLbl: t('c_range'),
        onClick: (key) => { const f = { s: 'src', t: 'tt', m: 'method', c: 'pcat', f: 'form', j: 'journal', y: 'sys' }[key[0]]; toggleFacet(f, +key.slice(1), true); } });
      $('chart-note').textContent = t('c_note', { n: fmt(rows.length), u: unitLbl, m: fmt(total) }) + ' ' + t('c_group_n');
      const q = PFDCharts.quantile;
      table = [[t('group'), t('n'), t('q1'), t('median'), t('q3')], ...groups.map((x) => [x.label, x.values.length, q(x.values, 0.25), q(x.values, 0.5), q(x.values, 0.75)])];
    } else {
      const pts = [];
      const step = Math.max(1, rows.length / SC_CAP);
      let kept = 0;
      for (let k = 0; k < rows.length; k += step) {
        const i = rows[Math.floor(k)], s = C.vs[i];
        const x = UI.chartX === 'ph' ? C.vph[i] : D.sMaxT[s];
        if (x !== x) continue;
        kept++;
        pts.push({ x, y: D.veff[i], s: C.vo[i] & 1, tip: `<b>${esc(PFDCharts.fmt(D.veff[i]))} ${esc(unitLbl)}</b><br>${esc(t(UI.chartX === 'ph' ? 'x_ph' : 'x_temp'))}: ${esc(PFDCharts.fmt(x))}<br>${esc(srcOf(s).map(srcLabel).join(' · '))}<br>${esc(D.doi[C.sp[s]])}` });
      }
      PFDCharts.scatter(box, pts, { logY: UI.chartLog, xLabel: t(UI.chartX === 'ph' ? 'x_ph' : 'x_temp'), yLabel: yLbl, empty: t('c_none') });
      $('chart-note').textContent = t('c_note_sc', { n: fmt(kept), u: unitLbl, cap: fmt(SC_CAP) });
    }
    if (UI.chartTable && table) {
      $('chart-table').innerHTML = `<div class="card-body"><div class="mini-wrap"><table class="data-table"><thead><tr>${table[0].map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${table.slice(1).map((r) => `<tr>${r.map((v, k) => `<td class="${k ? 'n' : ''}">${esc(k ? PFDCharts.fmt(v) : v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    } else if (UI.chartTable && UI.chartType === 'hist') {
      const v = rows.map((i) => D.veff[i]).sort((a, b) => a - b), q = PFDCharts.quantile;
      $('chart-table').innerHTML = `<div class="card-body"><div class="mini-wrap"><table class="data-table"><thead><tr><th>${esc(t('n'))}</th><th>min</th><th>${esc(t('q1'))}</th><th>${esc(t('median'))}</th><th>${esc(t('q3'))}</th><th>max</th></tr></thead><tbody><tr>${[v.length, v[0], q(v, 0.25), q(v, 0.5), q(v, 0.75), v[v.length - 1]].map((x) => `<td class="n">${esc(PFDCharts.fmt(x))}</td>`).join('')}</tr></tbody></table></div></div>`;
    }
  }
  function toggleFacet(key, code, on) {
    const f = facetByKey(key);
    if (!f) return;
    if (on) { S.sel[key].add(code); f.mask[code] = 1; } else { S.sel[key].delete(code); f.mask[code] = 0; }
    refresh();
  }

  // ================================================================ 导出 ==
  function methodStatus(c) { return c === 0 ? '' : c === 1 ? '原文未写明方法 (not stated)' : c === 2 ? '方法不确定 (unclear)' : '已对应 (matched)'; }
  const ingText = (s) => SX(s, 'ings').map(([n, c, a]) => `${n} (${c}${a ? ', ' + a : ''})`).join('; ');
  const VALUE_HEAD = ['doi', 'title', 'journal', 'sample_no', 'sample_name', 'description', 'protein_source', 'protein_source_std',
    'protein_category', 'protein_form', 'protein_form_std', 'protein_conc', 'ingredients', 'treatment', 'treatment_types',
    'treatment_categories', 'system', 'property', 'property_name', 'measure_name', 'value', 'value_text', 'sd', 'unit', 'value_std',
    'unit_std', 'multiplier', 'err_low', 'err_high', 'significance', 'conditions', 'measurement_ph', 'test_method', 'method_params',
    'method_summary', 'method_status', 'data_origin', 'source_type', 'source_item', 'source_panel', 'series', 'x', 'x_unit', 'x_variable'];
  function sampleCells(s) {
    const p = D.c.sp[s];
    return [D.doi[p], PX(p, 'title'), journalName(p), sampleNo(s), SX(s, 'name'), SX(s, 'desc'), SX(s, 'psrc'),
      srcOf(s).map((c) => D.dict.src[c]).join(' | '), D.dict.pcat[D.c.scat[s]], SX(s, 'pform'), D.dict.form[D.c.sform[s]],
      SX(s, 'pconc'), ingText(s), SX(s, 'treat'), ttOf(s).map((c) => D.dict.tt[c]).join(' | '),
      tcatOf(s).map((k) => TCAT_NAMES[k]).join('、'), D.dict.sys[D.c.ssys[s]]];
  }
  function valueRow(i) {
    const C = D.c, s = C.vs[i], m = methodOf(i), mc = C.vm[i], vv = C.vv[i];
    return [...sampleCells(s), D.meta.props[C.vp[i]], PROP_NAMES[D.meta.props[C.vp[i]]][1], VX(i, 'name'), vv === vv ? +vv.toPrecision(7) : '',
      VX(i, 'vt'), VX(i, 'sd'), VX(i, 'unit'), num(VX(i, 'vstd')) ?? '', VX(i, 'ustd'), VX(i, 'mul'), VX(i, 'lo'), VX(i, 'hi'), VX(i, 'sig'),
      VX(i, 'cond'), C.vph[i] === C.vph[i] ? +C.vph[i].toFixed(2) : '', mc >= 3 ? D.dict.method[mc][0] : '', VX(i, 'mp'),
      m ? m[4] : '', methodStatus(mc), C.vo[i] & 1 ? '来源于模型 (model-derived)' : '作者原值 (author-reported)',
      VX(i, 'src'), VX(i, 'item'), VX(i, 'panel'), VX(i, 'series'), VX(i, 'x'), VX(i, 'xu'), VX(i, 'xv')];
  }
  async function prepareExport(indices) {
    const ks = [...new Set(indices.map((i) => chunkOf(4, i)))].filter((k) => !D.chunkData[k]);
    if (ks.length > 8 && !confirm(t('ex_confirm', { n: fmt(indices.length), k: ks.length }))) return false;
    toast(t('ex_loading'));
    await ensure(ks);
    return true;
  }
  function widePart(sampleList, valueList) {
    const C = D.c;
    const props = [...new Set(valueList.map((i) => C.vp[i]))].sort((a, b) => a - b);
    const byS = new Map();
    for (const i of valueList) { const s = C.vs[i]; if (!byS.has(s)) byS.set(s, new Map()); const m = byS.get(s); if (!m.has(C.vp[i])) m.set(C.vp[i], []); m.get(C.vp[i]).push(i); }
    const head = [...VALUE_HEAD.slice(0, 17), 'n_values', ...props.map((c) => D.meta.props[c])];
    const rows = sampleList.map((s) => {
      const m = byS.get(s) || new Map();
      return [...sampleCells(s), [...m.values()].reduce((a, b) => a + b.length, 0), ...props.map((c) => (m.get(c) || []).map((i) => {
        const cond = VX(i, 'cond');
        return `${VX(i, 'name')} = ${VX(i, 'vt')}${C.vo[i] & 1 ? '*' : ''}${VX(i, 'sd') ? ' ± ' + VX(i, 'sd') : ''}${VX(i, 'unit') ? ' ' + VX(i, 'unit') : ''}${cond ? ' [' + cond + ']' : ''}`;
      }).join(' | '))];
    });
    return [head, ...rows];
  }
  function methodSheet(papers) {
    const rows = [['doi', 'method_id', 'property', 'test_method', 'method_raw', 'method_summary', 'reference', 'instrument', 'applies_to', 'n_values']];
    for (const p of papers) for (const m of PX(p, 'methods') || []) {
      rows.push([D.doi[p], m[0], m[1] >= 0 ? D.meta.props[m[1]] : '', m[2] >= 3 ? D.dict.method[m[2]][0] : '', m[3], m[4], m[7], m[8], m[5], num(m[6]) ?? '']);
    }
    return rows;
  }
  const ABOUT = () => [['PFD · Protein Functionality Database'], [location.href], ['exported', new Date().toISOString().slice(0, 19).replace('T', ' ')],
    ['data_origin', '来源于模型 (model-derived) = value read from a figure by a model (estimate); 作者原值 (author-reported) = value from a table or the main text'],
    ['license', 'Data CC BY 4.0 — please cite the original articles (DOI)']];
  async function doExport(kind) {
    const idx = Array.from(result);
    if (!idx.length) return;
    if (kind === 'cite_txt' || kind === 'cite_ris') {
      const papers = [...new Set(idx.map((i) => D.c.sp[D.c.vs[i]]))];
      await ensure(papers.map((p) => chunkOf(0, p)));
      const text = kind === 'cite_txt'
        ? papers.map((p, k) => `[${k + 1}] ${PX(p, 'title')}. ${journalName(p)}. https://doi.org/${D.doi[p]}`).join('\n') + '\n'
        : papers.map((p) => `TY  - JOUR\nTI  - ${PX(p, 'title')}\nJO  - ${journalName(p)}\nDO  - ${D.doi[p]}\nUR  - https://doi.org/${D.doi[p]}\nER  - \n`).join('\n');
      saveBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), kind === 'cite_txt' ? 'pfd_references.txt' : 'pfd_references.ris');
      toast(t('ex_done', { f: kind === 'cite_txt' ? 'pfd_references.txt' : 'pfd_references.ris' }));
      return;
    }
    if (!(await prepareExport(idx))) return;
    const papers = [...new Set(idx.map((i) => D.c.sp[D.c.vs[i]]))];
    let name;
    if (kind === 'csv' || kind === 'xlsx') {
      const rows = [VALUE_HEAD, ...idx.map(valueRow)];
      if (kind === 'csv') saveBlob(new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8' }), name = 'pfd_values.csv');
      else saveBlob(await PFDXlsx.makeXlsx([{ name: 'values', rows }, { name: 'methods', rows: methodSheet(papers) }, { name: 'about', rows: ABOUT() }]), name = 'pfd_values.xlsx');
    } else {
      const samples = [...new Set(idx.map((i) => D.c.vs[i]))];
      const rows = widePart(samples, idx);
      if (kind === 'wide_csv') saveBlob(new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8' }), name = 'pfd_samples_wide.csv');
      else saveBlob(await PFDXlsx.makeXlsx([{ name: 'samples', rows }, { name: 'methods', rows: methodSheet(papers) }, { name: 'about', rows: ABOUT() }]), name = 'pfd_samples_wide.xlsx');
    }
    toast(t('ex_done', { f: name }));
  }
  function renderExportMenu() {
    const { ns, np } = resultStats();
    const item = (k, lbl, hint) => `<button type="button" data-ex="${k}"><span><b>${esc(t(lbl))}</b><div class="dim">${esc(hint)}</div></span></button>`;
    $('export-pop').innerHTML = item('csv', 'ex_csv', t('ex_hint_rows', { n: fmt(result.length) })) + item('xlsx', 'ex_xlsx', t('ex_hint_rows', { n: fmt(result.length) })) +
      '<div class="sep"></div>' + item('wide_csv', 'ex_wide_csv', t('ex_hint_wide', { n: fmt(ns) })) + item('wide_xlsx', 'ex_wide_xlsx', t('ex_hint_wide', { n: fmt(ns) })) +
      '<div class="sep"></div>' + item('cite_txt', 'ex_cite_txt', t('ex_hint_cite', { n: fmt(np) })) + item('cite_ris', 'ex_cite_ris', t('ex_hint_cite', { n: fmt(np) }));
  }
  function renderColsMenu() {
    $('cols-pop').innerHTML = `<div class="hint">${esc(t('cols_hint'))}</div>` + COLS.filter((c) => !c.fixed).map((c) =>
      `<label><input type="checkbox" data-col="${c.key}" ${visibleCols.has(c.key) ? 'checked' : ''}> ${esc(t('col_' + c.key))}</label>`).join('');
  }

  // ================================================================ 对比 ==
  let CMP = [];
  try { CMP = JSON.parse(localStorage.getItem('pfd_cmp') || '[]').filter((x) => typeof x === 'string').slice(0, MAX_CMP); } catch (e) { CMP = []; }
  function saveCmp() {
    try { localStorage.setItem('pfd_cmp', JSON.stringify(CMP)); } catch (e) { /* 忽略 */ }
    $('cmp-count').textContent = CMP.length;
  }
  function toggleCmp(s, on) {
    const key = sampleKey(s), has = CMP.includes(key);
    if (on === undefined) on = !has;
    if (on && !has) {
      if (CMP.length >= MAX_CMP) { toast(t('compare_full', { n: MAX_CMP })); return false; }
      CMP.push(key); toast(t('added', { n: CMP.length }));
    } else if (!on && has) { CMP = CMP.filter((x) => x !== key); toast(t('removed')); }
    saveCmp();
    return true;
  }
  async function renderCompare(params) {
    const el = $('view-compare');
    const fromUrl = params.getAll('s');
    if (fromUrl.length) { CMP = fromUrl.slice(0, MAX_CMP); saveCmp(); }
    const ss = CMP.map(sampleFromKey).filter((s) => s >= 0);
    if (!ss.length) {
      el.innerHTML = `<div class="page-head"><h2>${esc(t('cmp_title'))}</h2></div><div class="card empty-state">${esc(t('cmp_empty', { n: MAX_CMP }))}</div>`;
      return;
    }
    await ensure(ss.map((s) => chunkOf(2, s)));
    const C = D.c;
    const vals = ss.map((s) => { const out = []; for (let i = D.vFirst[s]; i < D.vFirst[s + 1]; i++) out.push(i); return out; });
    const props = [...new Set(vals.flat().map((i) => C.vp[i]))].sort((a, b) => a - b);
    const row = (label, f) => `<tr><td>${esc(label)}</td>${ss.map((s) => `<td>${f(s)}</td>`).join('')}</tr>`;
    const valCell = (k, c) => {
      const list = vals[k].filter((i) => C.vp[i] === c);
      return list.length ? `<ul>${list.map((i) => `<li><span class="val">${valueHTML(i, true)}</span><div class="dim">${esc(VX(i, 'name'))}${VX(i, 'cond') ? ' · ' + esc(VX(i, 'cond')) : ''}</div><div class="dim">${esc(methodName(C.vm[i]))}</div></li>`).join('')}</ul>` : '<span class="dim">—</span>';
    };
    el.innerHTML = `<div class="page-head"><div><h2>${esc(t('cmp_title'))}</h2><div class="meta">${ss.length} / ${MAX_CMP}</div></div>
      <div class="exp-actions" style="margin:0"><button class="btn ghost small" type="button" id="cmp-csv">${esc(t('cmp_export_csv'))}</button>
      <button class="btn ghost small" type="button" id="cmp-xlsx">${esc(t('cmp_export_xlsx'))}</button>
      <button class="btn ghost small" type="button" id="cmp-clear">${esc(t('cmp_clear'))}</button></div></div>
      <div class="card cmp-wrap"><table class="cmp"><thead><tr><th></th>${ss.map((s) => `<th><a class="strong" href="${sampleHref(s)}">${esc(SX(s, 'name') || t('sample_n', { n: sampleNo(s) }))}</a>
        <div><button class="link" type="button" data-cmp-rm="${s}">${esc(t('cmp_remove'))}</button></div></th>`).join('')}</tr></thead><tbody>
        ${row(t('cmp_paper'), (s) => `<a href="${paperHref(C.sp[s])}">${esc(clip(PX(C.sp[s], 'title'), 90))}</a><div class="dim">${esc(journalName(C.sp[s]))}</div>`)}
        ${row(t('d_psrc'), (s) => `${esc(srcOf(s).map(srcLabel).join(' · ') || '—')}<div class="dim">${esc(SX(s, 'psrc'))}</div>`)}
        ${row(t('d_pcat'), (s) => esc(cat(D.dict.pcat[C.scat[s]])))}
        ${row(t('d_pform'), (s) => `${esc(formLabel(C.sform[s]))}<div class="dim">${esc(SX(s, 'pform'))}</div>`)}
        ${row(t('d_pconc'), (s) => esc(SX(s, 'pconc') || '—'))}
        ${row(t('d_sys'), (s) => esc(cat(D.dict.sys[C.ssys[s]])))}
        ${row(t('d_ing'), (s) => esc(ingText(s) || t('d_none')))}
        ${row(t('col_treat'), (s) => `${esc(treatText(s))}<div>${typesHTML(s, 6)}</div>`)}
        <tr class="sec"><td colspan="${ss.length + 1}">${esc(t('cmp_values'))}</td></tr>
        ${props.map((c) => `<tr><td class="prop">${esc(propName(c))}</td>${ss.map((s, k) => `<td>${valCell(k, c)}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>`;
    const table = () => {
      const head = ['', ...ss.map((s) => `${SX(s, 'name') || 'Sample ' + sampleNo(s)} (${sampleKey(s)})`)];
      const rows = [head,
        ['doi', ...ss.map((s) => D.doi[C.sp[s]])], ['title', ...ss.map((s) => PX(C.sp[s], 'title'))],
        ['protein_source_std', ...ss.map((s) => srcOf(s).map((c) => D.dict.src[c]).join(' | '))], ['protein_source', ...ss.map((s) => SX(s, 'psrc'))],
        ['protein_form', ...ss.map((s) => SX(s, 'pform'))], ['protein_conc', ...ss.map((s) => SX(s, 'pconc'))], ['ingredients', ...ss.map(ingText)],
        ['treatment', ...ss.map((s) => SX(s, 'treat'))], ['treatment_types', ...ss.map((s) => ttOf(s).map((c) => D.dict.tt[c]).join(' | '))],
        ...props.map((c) => [D.meta.props[c], ...ss.map((s, k) => vals[k].filter((i) => C.vp[i] === c).map((i) => `${VX(i, 'name')} = ${VX(i, 'vt')}${C.vo[i] & 1 ? '*' : ''}${VX(i, 'sd') ? ' ± ' + VX(i, 'sd') : ''} ${VX(i, 'unit')}${VX(i, 'cond') ? ' [' + VX(i, 'cond') + ']' : ''}`).join(' | '))])];
      return rows;
    };
    $('cmp-csv').onclick = () => saveBlob(new Blob([csvText(table())], { type: 'text/csv;charset=utf-8' }), 'pfd_compare.csv');
    $('cmp-xlsx').onclick = async () => saveBlob(await PFDXlsx.makeXlsx([{ name: 'compare', rows: table() }, { name: 'about', rows: ABOUT() }]), 'pfd_compare.xlsx');
    $('cmp-clear').onclick = () => { CMP = []; saveCmp(); location.hash = '#/compare'; renderCompare(new URLSearchParams()); };
    el.querySelectorAll('[data-cmp-rm]').forEach((b) => { b.onclick = () => { toggleCmp(+b.dataset.cmpRm, false); history.replaceState(null, '', '#/compare'); renderCompare(new URLSearchParams()); }; });
  }

  // ================================================================ 论文页、样品页 ==
  function methodsHTML(p, only) {
    const ms = (PX(p, 'methods') || []).filter((m) => !only || only.has(m[0]));
    return ms.length ? `<div class="method-list">${ms.map((m) => `<div class="method-item">
      <div class="head"><span class="id">${esc(m[0])}</span><b>${esc(m[1] >= 0 ? propName(m[1]) : '')}</b><span class="chip brand">${esc(methodName(m[2]))}</span>
        ${m[6] ? `<span class="dim">${esc(t('n_values', { n: m[6] }))}</span>` : ''}</div>
      ${summaryHTML(m)}
      ${m[5] ? `<div class="dim" style="margin-top:4px">${esc(t('p_applies'))}: ${esc(m[5])}</div>` : ''}</div>`).join('')}</div>` : `<div class="dim">${esc(t('unextracted_note'))}</div>`;
  }
  async function renderPaper(params) {
    const el = $('view-paper'), p = D.doiIndex.get(params.get('doi') || '');
    if (p === undefined) { el.innerHTML = `<div class="card empty-state">${esc(t('p_notfound'))}</div>`; return; }
    await loadChunk(chunkOf(0, p));
    const C = D.c, s0 = D.sFirst[p], s1 = D.sFirst[p + 1];
    const nVal = D.vFirst[s1] - D.vFirst[s0];
    let nModel = 0;
    for (let i = D.vFirst[s0]; i < D.vFirst[s1]; i++) nModel += C.vo[i] & 1;
    const ms = PX(p, 'methods') || [];
    const sp = new URLSearchParams(); sp.set('paper', D.doi[p]);
    const rows = [];
    for (let s = s0; s < s1; s++) rows.push(`<tr><td class="tnum">${sampleNo(s)}</td><td><a class="strong" href="${sampleHref(s)}">${esc(SX(s, 'name') || t('sample_n', { n: sampleNo(s) }))}</a><div class="dim clamp c2">${esc(SX(s, 'desc'))}</div></td>
      <td>${esc(srcOf(s).map(srcLabel).join(' · ') || SX(s, 'psrc'))}<div class="dim">${esc(formLabel(C.sform[s]))}</div></td>
      <td><div class="clamp c3">${esc(treatText(s))}</div><div>${typesHTML(s, 4)}</div></td><td class="tnum">${fmt(D.vFirst[s + 1] - D.vFirst[s])}</td></tr>`);
    el.innerHTML = `<div class="crumbs"><a href="#/">${esc(t('nav_home'))}</a> / <a href="#/search">${esc(t('nav_search'))}</a> / ${esc(t('f_paper'))}</div>
      <div class="page-head"><div><h2>${esc(PX(p, 'title'))}</h2>
        <div class="meta"><i>${esc(journalName(p))}</i> · <a href="${doiHref(p)}" target="_blank" rel="noopener">${esc(D.doi[p])}</a></div>
        <div class="meta">${esc(t('n_samples', { n: fmt(s1 - s0) }))} · ${esc(t('n_values', { n: fmt(nVal) }))}${nModel ? ` · ${esc(t('o_model'))} ${fmt(nModel)}` : ''}</div></div>
        <div class="exp-actions" style="margin:0"><a class="btn small" href="${searchHref(sp)}">${esc(t('p_in_search'))}</a>
        <a class="btn ghost small" href="${doiHref(p)}" target="_blank" rel="noopener">${esc(t('open_doi'))}</a></div></div>
      <div class="two-col">
        <section class="card"><div class="card-head"><div><h3>${esc(t('p_methods', { n: ms.length }))}</h3><div class="sub">${esc(t('p_methods_sub'))}</div></div></div>
          <div class="card-body">${methodsHTML(p)}</div></section>
        <section class="card"><div class="card-head"><h3>${esc(t('p_samples'))} (${fmt(s1 - s0)})</h3></div>
          <div class="card-body"><div class="mini-wrap"><table class="mini"><thead><tr><th>#</th><th>${esc(t('col_sample'))}</th><th>${esc(t('col_protein'))}</th><th>${esc(t('col_treat'))}</th><th>${esc(t('p_n_values'))}</th></tr></thead>
          <tbody>${rows.join('')}</tbody></table></div></div></section>
      </div>`;
  }
  async function renderSample(params) {
    const el = $('view-sample');
    const p = D.doiIndex.get(params.get('doi') || ''), n = parseInt(params.get('n'), 10);
    const s = p === undefined ? -1 : sampleFromKey(D.doi[p] + '~' + n);
    if (s < 0) { el.innerHTML = `<div class="card empty-state">${esc(t('s_notfound'))}</div>`; return; }
    await loadChunk(chunkOf(2, s));
    const C = D.c, name = SX(s, 'name') || t('sample_n', { n: sampleNo(s) });
    const vals = [];
    for (let i = D.vFirst[s]; i < D.vFirst[s + 1]; i++) vals.push(i);
    const mids = new Set(vals.map((i) => VX(i, 'mid')).filter(Boolean));
    const steps = SX(s, 'steps'), ings = SX(s, 'ings');
    const kv = (k, v) => (v ? `<dt>${esc(t(k))}</dt><dd>${v}</dd>` : '');
    const inCmp = CMP.includes(sampleKey(s));
    el.innerHTML = `<div class="crumbs"><a href="#/">${esc(t('nav_home'))}</a> / <a href="${paperHref(p)}">${esc(clip(PX(p, 'title'), 80))}</a> / ${esc(t('sample_n', { n: sampleNo(s) }))}</div>
      <div class="page-head"><div><h2>${esc(name)}</h2><div class="meta"><a href="${paperHref(p)}">${esc(PX(p, 'title'))}</a></div>
        <div class="meta"><i>${esc(journalName(p))}</i> · <a href="${doiHref(p)}" target="_blank" rel="noopener">${esc(D.doi[p])}</a></div></div>
        <div class="exp-actions" style="margin:0"><button class="btn small" type="button" id="s-cmp">${esc(t(inCmp ? 'compare_remove' : 'compare_add'))}</button>
          <a class="btn ghost small" href="${paperHref(p)}">${esc(t('paper_page'))}</a>
          <a class="btn ghost small" href="${doiHref(p)}" target="_blank" rel="noopener">${esc(t('open_doi'))}</a></div></div>
      <div class="two-col">
        <section class="card"><div class="card-head"><h3>${esc(t('s_info'))}</h3></div><div class="card-body"><dl class="kv">
          ${kv('d_desc', esc(SX(s, 'desc')))}
          ${kv('d_psrc', `${esc(SX(s, 'psrc') || '—')}${srcOf(s).length ? '<div>' + srcOf(s).map((c) => `<span class="chip brand">${esc(srcLabel(c))}</span>`).join('') + '</div>' : ''}`)}
          ${kv('d_pcat', esc(cat(D.dict.pcat[C.scat[s]])))}
          ${kv('d_pform', `${esc(SX(s, 'pform') || '—')}${C.sform[s] ? ` <span class="chip">${esc(formLabel(C.sform[s]))}</span>` : ''}`)}
          ${kv('d_pconc', esc(SX(s, 'pconc')))}
          ${kv('d_sys', esc(cat(D.dict.sys[C.ssys[s]])))}
          ${kv('d_ing', ings.length ? ings.map(([nn, c, a]) => `<div>${esc(nn)} <span class="dim">(${esc(cat(c))}${a ? ', ' + esc(a) : ''})</span></div>`).join('') : esc(t('d_none')))}
          ${kv('d_steps', steps.length ? `<ol class="steps">${steps.map(([m, c, ty, pr]) => `<li><b>${esc(m)}</b> <span class="dim">${esc(cat(c))}</span>${ty ? '<div>' + ty.split(' | ').map((x) => `<span class="chip">${esc(zh(x))}</span>`).join('') + '</div>' : ''}${pr ? `<div class="dim">${esc(pr)}</div>` : ''}</li>`).join('')}</ol>` : esc(t('d_untreated')))}
        </dl></div></section>
        <section class="card"><div class="card-head"><div><h3>${esc(t('s_methods'))}</h3><div class="sub">${esc(t('p_methods_sub'))}</div></div></div>
          <div class="card-body">${methodsHTML(C.sp[s], mids)}</div></section>
      </div>
      <section class="card" style="margin-top:18px"><div class="card-head"><h3>${esc(t('s_values', { n: fmt(vals.length) }))}</h3></div>
        <div class="card-body"><div class="mini-wrap"><table class="mini"><thead><tr><th>${esc(t('col_prop'))}</th><th>${esc(t('col_measure'))}</th><th>${esc(t('col_value'))}</th><th>${esc(t('col_method'))}</th><th>${esc(t('col_source'))}</th></tr></thead>
        <tbody>${vals.map((i) => `<tr><td class="prop">${esc(propName(C.vp[i]))}</td><td>${esc(VX(i, 'name'))}</td><td class="val">${valueHTML(i, true)}</td><td>${methodHTML(i, false)}</td><td>${sourceHTML(i, false)}</td></tr>`).join('')}</tbody></table></div></div></section>`;
    $('s-cmp').onclick = () => { if (toggleCmp(s)) $('s-cmp').textContent = t(CMP.includes(sampleKey(s)) ? 'compare_remove' : 'compare_add'); };
  }

  // ================================================================ 首页 ==
  function renderHome() {
    const el = $('view-home'), C = D.c, d = D.dict;
    let nModel = 0;
    for (let i = 0; i < D.nV; i++) nModel += C.vo[i] & 1;
    const pc = new Uint32Array(D.meta.props.length), mc = new Uint32Array(d.method.length);
    for (let i = 0; i < D.nV; i++) { pc[C.vp[i]]++; mc[C.vm[i]]++; }
    const sc = new Uint32Array(d.src.length), tc = new Uint32Array(d.tt.length), jc = new Uint32Array(d.journal.length);
    for (let k = 0; k < C.ssrc.length; k++) sc[C.ssrc[k]]++;
    for (let s = 0; s < D.nS; s++) { const seen = new Set(); for (let k = C.stt_off[s]; k < C.stt_off[s + 1]; k++) seen.add(C.stt[k]); seen.forEach((c) => tc[c]++); }
    for (let p = 0; p < D.nP; p++) jc[C.pj[p]]++;
    const top = (arr, n, keep = () => true) => [...arr.keys()].filter((c) => arr[c] && keep(c)).sort((a, b) => arr[b] - arr[a]).slice(0, n);
    el.innerHTML = `<div class="hero">
        <section class="card hero-main"><h2>${esc(t('h_title'))}</h2><p>${esc(t('h_lead'))}</p>
          <div class="hero-num">${fmt(D.nV)}<small>${esc(t('h_values'))}</small></div>
          <form class="quick" id="quick"><input type="search" id="quick-q" placeholder="${esc(t('h_search_ph'))}" aria-label="${esc(t('keyword'))}"><button class="btn" type="submit">${esc(t('h_go'))}</button></form></section>
        <div class="tiles">
          <div class="card tile"><div class="lbl">${esc(t('h_papers'))}</div><div class="val">${fmt(D.nP)}</div></div>
          <div class="card tile"><div class="lbl">${esc(t('h_samples'))}</div><div class="val">${fmt(D.nS)}</div></div>
          <div class="card tile"><div class="lbl">${esc(t('h_methods'))}</div><div class="val">${fmt(D.meta.methods)}</div></div>
          <div class="card tile"><div class="lbl">${esc(t('h_model'))}</div><div class="val">${(nModel / Math.max(1, D.nV) * 100).toFixed(0)}%</div><div class="note">${esc(t('h_model_note'))}</div></div>
        </div></div>
      <div class="dash-grid">
        <section class="card wide"><div class="card-head"><h3>${esc(t('h_props'))}</h3><span class="sub">${esc(t('h_props_sub'))}</span></div><div class="chart-box" id="d-props"></div></section>
        <section class="card"><div class="card-head"><h3>${esc(t('h_src'))}</h3><span class="sub">${esc(t('h_src_sub'))}</span></div><div class="chart-box" id="d-src"></div></section>
        <section class="card"><div class="card-head"><h3>${esc(t('h_tt'))}</h3><span class="sub">${esc(t('h_tt_sub'))}</span></div><div class="chart-box" id="d-tt"></div></section>
        <section class="card"><div class="card-head"><h3>${esc(t('h_mt'))}</h3><span class="sub">${esc(t('h_mt_sub'))}</span></div><div class="chart-box" id="d-mt"></div></section>
        <section class="card"><div class="card-head"><h3>${esc(t('h_jr'))}</h3><span class="sub">${esc(t('h_jr_sub'))}</span></div><div class="chart-box" id="d-jr"></div></section>
      </div>`;
    const go = (key, tok) => { const h = new URLSearchParams(); h.set(key, tok); location.hash = searchHref(h); };
    const draw = () => {
      PFDCharts.hbar($('d-props'), top(pc, 17).map((c) => ({ key: D.meta.props[c], label: propName(c), value: pc[c] })),
        { labelWidth: 230, onClick: (k) => go('prop', k), valueFmt: (v) => fmt(v) });
      PFDCharts.hbar($('d-src'), top(sc, 15).map((c) => ({ key: d.src[c], label: srcLabel(c), value: sc[c] })), { onClick: (k) => go('src', k), valueFmt: (v) => fmt(v) });
      PFDCharts.hbar($('d-tt'), top(tc, 15, (c) => !ROUTINE_TT.has(d.tt[c])).map((c) => ({ key: d.tt[c], label: ttLabel(c), value: tc[c] })), { onClick: (k) => go('tt', k), valueFmt: (v) => fmt(v) });
      PFDCharts.hbar($('d-mt'), top(mc, 15, (c) => c >= 3 && d.method[c][0] !== 'Other method').map((c) => ({ key: d.method[c][0], label: methodName(c), value: mc[c] })), { labelWidth: 230, onClick: (k) => go('method', k), valueFmt: (v) => fmt(v) });
      PFDCharts.hbar($('d-jr'), top(jc, 10).map((c) => ({ key: d.journal[c], label: d.journal[c] || t('unknown'), value: jc[c] })), { labelWidth: 240, onClick: (k) => go('journal', k), valueFmt: (v) => fmt(v) });
    };
    draw();
    homeRedraw = draw;
    $('quick').onsubmit = (e) => { e.preventDefault(); const h = new URLSearchParams(); const q = $('quick-q').value.trim(); if (q) h.set('q', q); location.hash = searchHref(h); };
  }
  let homeRedraw = null;

  // ================================================================ 路由 ==
  function parseRoute() {
    const h = location.hash.replace(/^#/, '');
    if (h.startsWith('/')) {
      const k = h.indexOf('?');
      return { path: (k < 0 ? h : h.slice(0, k)) || '/', params: new URLSearchParams(k < 0 ? '' : h.slice(k + 1)) };
    }
    if (h) return { path: '/search', params: new URLSearchParams(h) };     // 旧版链接（#q=…&prop=…）
    return { path: '/', params: new URLSearchParams() };
  }
  let VIEW = '';
  async function render() {
    const { path, params } = parseRoute();
    const view = { '/': 'home', '/search': 'search', '/paper': 'paper', '/sample': 'sample', '/compare': 'compare' }[path] || 'home';
    VIEW = view;
    document.querySelectorAll('main.view').forEach((m) => { m.hidden = m.id !== 'view-' + view; });
    document.querySelectorAll('.nav a').forEach((a) => { if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (view !== 'search') window.scrollTo(0, 0);
    try {
      if (view === 'home') renderHome();
      else if (view === 'search') { readSearch(params); syncInputs(); await refresh(true); }
      else if (view === 'paper') await renderPaper(params);
      else if (view === 'sample') await renderSample(params);
      else await renderCompare(params);
    } catch (e) {
      console.error(e);
      $('view-' + view).innerHTML = `<div class="card empty-state">${esc(t('load_fail', { e: e.message || e }))}</div>`;
    }
  }

  // ================================================================ 事件 ==
  function applyStatic() {
    document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $('lang-btn').textContent = LANG === 'zh' ? 'EN' : '中文';
    document.title = LANG === 'zh' ? 'PFD · 蛋白质功能特性数据库' : 'PFD · Protein Functionality Database';
    if (D.meta) $('built').textContent = t('built', { date: D.meta.built });
  }
  function closeMenus(except) {
    for (const [b, p] of [['cols-btn', 'cols-pop'], ['export-btn', 'export-pop']]) {
      if (b === except) continue;
      $(p).hidden = true; $(b).setAttribute('aria-expanded', 'false');
    }
  }
  function bind() {
    const later = debounce(() => refresh(), 250);
    $('q').addEventListener('input', (e) => { S.q = e.target.value; later(); });
    RANGES.forEach((k) => $(k).addEventListener('input', (e) => { S[k] = e.target.value.trim(); later(); }));
    $('page-size').addEventListener('change', (e) => { S.size = +e.target.value; saveUI(); S.page = 0; renderRows(); writeSearchHash(); });
    $('facets').addEventListener('change', (e) => {
      const el = e.target.closest('.facet-opt');
      if (el) toggleFacet(FACETS[+el.dataset.f].key, +el.dataset.o, e.target.checked);
    });
    $('facets').addEventListener('input', debounce((e) => {
      if (!e.target.dataset.find) return;
      const f = FACETS[+e.target.dataset.find];
      UI.find[f.key] = e.target.value;
      renderFacets();
      const inp = document.querySelector(`[data-find="${e.target.dataset.find}"]`);
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }, 200));
    $('facets').addEventListener('click', (e) => {
      const m = e.target.closest('[data-more]'), c = e.target.closest('[data-clear]');
      if (m) { const k = FACETS[+m.dataset.more].key; if (UI.more.has(k)) UI.more.delete(k); else UI.more.add(k); renderFacets(); }
      if (c) { const f = FACETS[+c.dataset.clear]; S.sel[f.key] = new Set(); f.mask.fill(0); refresh(); }
    });
    $('active-filters').addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      const k = b.dataset.k, c = b.dataset.c;
      if (k === 'paper') S.paper = '';
      else if (k === 'q') S.q = '';
      else if (RANGES.includes(k)) { S[k] = ''; S[c] = ''; }
      else { const f = facetByKey(k); S.sel[k].delete(+c); f.mask[+c] = 0; }
      syncInputs();
      refresh();
    });
    $('reset').addEventListener('click', () => { clearFilters(); syncInputs(); refresh(); });
    $('thead').addEventListener('click', (e) => {
      const th = e.target.closest('th[data-sort]');
      if (!th) return;
      const k = th.dataset.sort;
      S.sort = k === 'value' ? (S.sort === 'vdesc' ? 'vasc' : 'vdesc') : (S.sort === k ? 'paper' : k);
      sortResult(); S.page = 0; renderHead(); renderRows(); writeSearchHash();
    });
    $('rows').addEventListener('click', (e) => {
      const ex = e.target.closest('[data-exp]'), cb = e.target.closest('[data-cmp]');
      if (ex) { const i = +ex.dataset.exp; if (UI.open.has(i)) UI.open.delete(i); else UI.open.add(i); renderRows(); }
      if (cb) { toggleCmp(+cb.dataset.cmp); renderRows(); }
    });
    $('rows').addEventListener('change', (e) => {
      const cb = e.target.closest('[data-cmp-chk]');
      if (cb && !toggleCmp(+cb.dataset.cmpChk, cb.checked)) cb.checked = false;
    });
    $('pager').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-page]');
      if (!b || b.disabled) return;
      S.page = +b.dataset.page; UI.open.clear();
      renderRows(); writeSearchHash();
      $('count').scrollIntoView({ block: 'nearest' });
    });
    $('chart-toggle').addEventListener('click', () => { UI.chart = !UI.chart; saveUI(); renderChart(); });
    $('chart-panel').addEventListener('click', (e) => { const b = e.target.closest('[data-ctype]'); if (b) { UI.chartType = b.dataset.ctype; saveUI(); renderChart(); } });
    $('chart-panel').addEventListener('change', (e) => {
      const id = e.target.id;
      if (id === 'c-prop') { UI.chartProp = +e.target.value; UI.chartUnit = -1; }
      else if (id === 'c-unit') UI.chartUnit = +e.target.value;
      else if (id === 'c-group') UI.chartGroup = e.target.value;
      else if (id === 'c-x') UI.chartX = e.target.value;
      else if (id === 'c-log') UI.chartLog = e.target.checked;
      else if (id === 'c-table') UI.chartTable = e.target.checked;
      saveUI(); renderChart();
    });
    for (const [b, p, fill] of [['cols-btn', 'cols-pop', renderColsMenu], ['export-btn', 'export-pop', renderExportMenu]]) {
      $(b).addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenus(b);
        const open = $(p).hidden;
        if (open) fill();
        $(p).hidden = !open; $(b).setAttribute('aria-expanded', String(open));
      });
    }
    $('cols-pop').addEventListener('change', (e) => {
      const k = e.target.dataset.col;
      if (!k) return;
      if (e.target.checked) visibleCols.add(k); else visibleCols.delete(k);
      saveUI(); renderHead(); renderRows();
    });
    $('export-pop').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ex]');
      if (!b) return;
      closeMenus();
      doExport(b.dataset.ex).catch((err) => toast(t('load_fail', { e: err.message || err })));
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) closeMenus(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });
    $('toggle-filters').addEventListener('click', () => $('filters').classList.toggle('open'));
    $('lang-btn').addEventListener('click', () => {
      LANG = LANG === 'zh' ? 'en' : 'zh';
      try { localStorage.setItem('lang', LANG); } catch (e) { /* 存不了就只对这次有效 */ }
      applyStatic();
      if (D.meta) render();
    });
    window.addEventListener('hashchange', render);
    window.addEventListener('resize', debounce(() => {
      if (VIEW === 'home' && homeRedraw) homeRedraw();
      if (VIEW === 'search' && UI.chart) renderChart();
    }, 200));
  }
  function repoLink() {
    const host = location.hostname;
    if (!host.endsWith('.github.io')) return;
    const owner = host.split('.')[0], repo = location.pathname.split('/').filter(Boolean)[0] || host;
    $('repo-link').href = `https://github.com/${owner}/${repo}`;
    $('repo-link').hidden = false;
  }

  async function main() {
    applyStatic();
    bind();
    repoLink();
    saveCmp();
    try {
      await loadIndex();
    } catch (e) {
      document.querySelectorAll('main.view').forEach((m) => { m.hidden = m.id !== 'view-home'; });
      $('view-home').innerHTML = `<div class="card empty-state">${esc(t('load_fail', { e: e.message || e }))}</div>`;
      return;
    }
    setupFacets();
    clearFilters();
    applyStatic();
    await render();
  }
  main();
})();
