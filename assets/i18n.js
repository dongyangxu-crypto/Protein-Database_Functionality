'use strict';
/* PDF · Protein Database of Functionality —— 界面文字（中文 / English）、类别名称对照、帮助页内容。 */
window.PDF_TEXT = (() => {
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
  // 11-15 性质分四类（首页色环、性质说明页用；只用于浏览）：[键, 中文, 英文, 英文短名(色环内圈), 内圈色, 外圈色, 性质]
  const PROP_GROUPS = [
    ['func', '功能特性', 'Techno-functional', 'Functional', '#F2B84B', '#F7D58F', ['solubility', 'emulsifying', 'foaming', 'gelling', 'water_holding', 'oil_holding']],
    ['coll', '胶体与颗粒', 'Colloidal', 'Colloidal', '#6CC0EE', '#A9DBF5', ['particle_size', 'zeta_potential', 'pdi', 'turbidity']],
    ['chem', '结构与化学', 'Structure & chemistry', 'Structure', '#EC8A6A', '#F4B39C', ['sulfhydryl', 'disulfide', 'surface_hydrophobicity', 'degree_of_hydrolysis', 'free_amino']],
    ['deliv', '递送与活性', 'Delivery & bioactivity', 'Delivery', '#5FCDA6', '#9EE0C6', ['encapsulation', 'antioxidant']],
  ];
  // 色环外圈的短名 [中, 英]
  const PROP_SHORT = {
    solubility: ['溶解度', 'Solubility'], emulsifying: ['乳化性', 'Emulsifying'], foaming: ['起泡性', 'Foaming'], gelling: ['凝胶性', 'Gelling'],
    water_holding: ['持水性', 'WHC'], oil_holding: ['持油性', 'OHC'], particle_size: ['粒径', 'Size'], zeta_potential: ['ζ-电位', 'ζ-Pot.'],
    pdi: ['PDI', 'PDI'], turbidity: ['浊度', 'Turbidity'], sulfhydryl: ['巯基', 'SH'], disulfide: ['二硫键', 'S–S'],
    surface_hydrophobicity: ['表面疏水性', 'Hydrophob.'], degree_of_hydrolysis: ['水解度', 'DH'], free_amino: ['游离氨基', 'Free NH₂'],
    encapsulation: ['包埋率', 'Encaps.'], antioxidant: ['抗氧化', 'Antiox.'],
  };
  // 性质说明页「测什么」[中, 英]
  const PROP_DEF = {
    solubility: ['蛋白在给定 pH、离子强度下溶入水相的比例或浓度', 'Fraction or concentration of protein that dissolves in water at a given pH and ionic strength'],
    emulsifying: ['形成并稳定油水乳液的能力（乳化活性 EAI、乳化稳定性 ESI 等）', 'Ability to form and stabilise oil-in-water emulsions (EAI, ESI …)'],
    foaming: ['形成泡沫的能力和泡沫的稳定性', 'Ability to form foam and keep it stable'],
    gelling: ['形成凝胶的能力和凝胶强度', 'Ability to form a gel, and gel strength'],
    water_holding: ['单位蛋白能保住的水', 'Water held per unit of protein'],
    oil_holding: ['单位蛋白能吸住的油', 'Oil held per unit of protein'],
    particle_size: ['颗粒或液滴的平均大小', 'Mean size of particles or droplets'],
    zeta_potential: ['颗粒表面电荷，反映静电稳定性', 'Surface charge of particles, an indicator of electrostatic stability'],
    pdi: ['粒径分布的宽窄（多分散指数）', 'Width of the size distribution (polydispersity index)'],
    turbidity: ['体系散射或吸收光的程度，常用来看聚集', 'How much light the system scatters or absorbs, often used to follow aggregation'],
    sulfhydryl: ['游离或总巯基（–SH）的量', 'Amount of free or total sulfhydryl (–SH) groups'],
    disulfide: ['二硫键（S–S）的量', 'Amount of disulfide (S–S) bonds'],
    surface_hydrophobicity: ['蛋白表面暴露的疏水基团多少', 'Amount of hydrophobic groups exposed on the protein surface'],
    degree_of_hydrolysis: ['被水解的肽键所占比例', 'Fraction of peptide bonds that have been hydrolysed'],
    free_amino: ['游离氨基（–NH₂）的量', 'Amount of free amino (–NH₂) groups'],
    encapsulation: ['活性物被包埋或负载的比例', 'Share of an active compound that is encapsulated or loaded'],
    antioxidant: ['清除自由基或还原的能力', 'Radical-scavenging or reducing capacity'],
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
    'Hydrolysate': '水解物', 'Peptide': '肽', 'Muscle / myofibrillar protein': '肌肉/肌原纤维蛋白', 'Isolate': '分离蛋白',
    'Concentrate': '浓缩蛋白', 'Caseinate': '酪蛋白酸盐', 'Gelatin / collagen': '明胶/胶原', 'Single purified protein': '单一纯化蛋白',
    'Protein fraction': '蛋白组分', 'Flour / meal / whole seed': '粉/粕/全籽', 'Whole food / raw material': '原料/全食物',
    'Particles / aggregates / complexes': '颗粒/聚集体/复合物', 'Extract (crude)': '粗提物', 'Powder (unspecified)': '粉末（未说明）',
    'Other': '其他',
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
  const ROUTINE_TT = ['Dissolution / mixing / pH adjustment', 'Separation / purification', 'Drying', 'Extraction / isolation',
    'Cooling', 'Storage / aging', 'Other'];
  const TCAT_NAMES = ['物理法', '化学法', '生物法', '复合法', '其他', '未处理'];

  const zh = {
    skip: '跳到正文', fullname: '蛋白质功能特性数据库', title: 'PDF · 蛋白质功能特性数据库', menu: '菜单',
    nav_home: '首页', nav_search: '检索', nav_browse: '浏览', nav_props: '性质说明', nav_stats: '统计', nav_download: '下载', nav_help: '帮助',
    nav_basket: '数据篮', nav_changelog: '更新日志',
    loading: '正在加载数据…', load_fail: '数据加载失败：{e}', loading_search: '正在加载关键词索引…',
    no_stream: '这个浏览器太旧，不能解压数据。请换用新版 Chrome、Edge、Firefox 或 Safari。',
    // 页脚
    f_data_1: '数据许可 CC BY 4.0，代码 MIT', f_cite: '如何引用', f_feedback: '反馈',
    f_built: '数据更新：{d}', f_version: '版本 {v}',
    f_copy: '论文版权归原作者和出版商所有', f_lab: '开发：',
    // 分面、通用
    f_prop: '功能特性', f_src: '蛋白来源', f_pcat: '蛋白类别', f_form: '蛋白形态', f_tt: '样品处理类型', f_tcat: '样品处理类别',
    f_method: '测试方法', f_sys: '体系', f_journal: '期刊', f_unit: '单位', f_origin: '数据来源', f_paper: '论文', f_q: '关键词',
    f_batch: '批量', f_adv: '高级查询', f_sd: '有 SD', f_pure: '纯蛋白样品',
    o_author: '作者原值', o_model: '来源于模型（读图）', m_unextracted: '未提取方法', m_none: '原文未写明方法', m_amb: '方法不确定',
    not_stated: '原文未写明', no_unit: '（无单位）', unit_other: '其他（未换算）', unknown: '不明', find: '查找…', more: '更多（{n}）', less: '收起', reset: '清除全部',
    clear: '清除', min: '最小', max: '最大', all: '全部', copy: '复制', copied: '已复制',
    // 首页
    h_title: '<em>PDF</em>：蛋白质功能特性数据库', h_ver: '版本 {v}', h_built: '数据更新于 {d}', h_nprops: '{n} 项功能特性',
    h_lead: '从已发表论文中提取食品蛋白的功能特性数值，每个数值都对应到具体样品、样品处理条件和测试方法。',
    h_ph: '输入蛋白来源、处理方式、性质、测试方法或 DOI', h_go: '检索',
    fld_all: '全部字段', fld_prop: '功能特性', fld_src: '蛋白来源', fld_tt: '处理类型', fld_method: '测试方法', fld_journal: '期刊', fld_doi: 'DOI',
    h_try: '示例：', h_adv: '高级查询', h_browse: '按类别浏览', h_help: '怎么用？',
    h_papers: '论文', h_samples: '样品', h_values: '数值', h_sources: '蛋白来源', h_ttypes: '处理类型',
    h_props: '各项性质的数值数', h_props_sub: '前 10 项 · 点条形进入检索', h_props_more: '全部 17 项的统计 →',
    h_src: '常见蛋白来源', h_src_sub: '按样品数，前 10', h_src_more: '浏览全部 {n} 种来源 →',
    h_tt: '常见样品处理', h_tt_sub: '按样品数，不含溶解、离心、干燥等常规步骤', h_tt_more: '浏览全部 {n} 类处理 →',
    h_hub: '{n} 项性质', h_wheel: '17 项性质一览', h_wheel_sub: '分成四类。点色环里的一项，或下面的名字，直接看它的数值分布、常用测试方法和原始数值。', h_nvals: '{n} 个数值',
    e_search: '检索数值', e_search_d: '按性质、蛋白、处理、方法筛选，画图、对比、导出',
    e_props: '性质说明', e_props_d: '每项性质测什么、标准单位、常用测试方法',
    e_dl: '下载数据', e_dl_d: '按性质的平铺表或完整关系表，CC BY 4.0',
    e_ai: '给 AI 用', e_ai_d: '复制一段话给你的 AI，它自己下载、分析',
    h_line_model: '标记的数值是从图中读出的估计值', h_line_cite: '如何引用',
    pr_sub: '17 项性质各测什么、常用什么单位、库里最常用的测试方法和数值多少。测试方法后面的数字是库里用这种方法测出的数值个数。',
    pr_th_prop: '性质', pr_th_def: '测什么', pr_th_unit: '常见单位', pr_th_methods: '最常用的测试方法', pr_th_n: '数值', pr_dist: '分布 →',
    pr_note: '四类分法只用于浏览。单位按库里数值的多少排；换算不了的（写法认不出、基准不同）保留原单位，见下载文件的 value_std / unit_std 两列。',
    // 检索页
    s_title: '检索', s_sub: '按性质与数值、蛋白、样品处理、测试方法或文献筛选；也可以粘贴一列 DOI 批量检索，或用高级查询组合条件。筛选条件写进网址，可以收藏和分享。',
    kw_ph: '关键词；输入蛋白、处理、性质、方法或 DOI 时会出现提示', kw_go: '检索',
    kw_hint: '在题目、DOI、期刊、样品、蛋白、复配物、样品处理、测量名称、测试方法里找；空格隔开的几个词都要出现',
    panel_hide: '收起筛选', panel_show: '展开筛选',
    tab_prop: '按性质与数值', tab_protein: '按蛋白', tab_treat: '按样品处理', tab_method: '按测试方法', tab_lit: '按文献',
    tab_batch: '批量检索', tab_adv: '高级查询',
    flag_sd: '只看有 SD 的数值', flag_pure: '只看纯蛋白样品（没有复配物）',
    r_value: '数值（按标准单位）', r_value_hint: '换不成标准单位的按原单位比较；先选性质和单位再用', r_ph: '测定 pH',
    r_ph_hint: '只认写成单个数的测定 pH', r_temp: '处理温度（°C）', r_time: '处理时间（min）', r_tph: '处理 pH',
    r_pres: '处理压力（MPa）', r_pow: '处理功率（W）', r_freq: '处理频率（kHz）', r_treat_hint: '任一样品处理步骤落在范围内即可',
    prop_page: '查看「{p}」的数值分布页 →', doi_lbl: '论文 DOI', doi_ph: '例如 10.1021/jf103771x', doi_go: '只看这篇',
    b_hint: '每行一个 DOI、样品名，或「DOI~样品编号」（如 10.1021/jf103771x~2）；也可以用逗号或分号隔开。',
    b_go: '检索这些', b_report: '找到 {p} 篇论文、{s} 个样品；{x} 项没找到', b_missing: '没找到：', b_chip: '批量：{n} 项',
    a_hint: '一行一个条件；条件之间选 AND（且）、OR（或）、NOT（且不）。从上到下依次组合，再和其他页签里的筛选一起生效。',
    a_add: '添加条件', a_run: '查询', a_example: '载入示例', a_clear: '清空', a_copy: '复制查询链接', a_save: '保存查询',
    a_saved: '我的查询（保存在这个浏览器里）', a_saved_none: '还没有保存的查询', a_name: '给这个查询起个名字', a_del: '删除', a_load: '载入',
    a_preview: '查询式', a_none: '还没有条件', a_copied: '链接已复制', a_saved_ok: '已保存', a_chip: '高级查询：{q}',
    op_is: '是', op_not: '不是', op_has: '包含', op_hasnot: '不包含', op_between: '介于', op_ge: '≥', op_le: '≤',
    q_value: '数值（标准单位）', q_ph: '测定 pH', q_temp: '处理温度 °C', q_time: '处理时间 min', q_tph: '处理 pH', q_pres: '处理压力 MPa',
    q_pow: '处理功率 W', q_freq: '处理频率 kHz', q_kw: '关键词', q_doi: 'DOI',
    res_v: '数值', res_s: '样品', res_p: '论文', res_by: '按',
    count_v: '共 <b>{n}</b> 个数值，来自 <b>{s}</b> 个样品、<b>{p}</b> 篇论文',
    chart_btn: '图表', cols_btn: '显示列', page_size: '每页', basket_sel: '已选 {n} · 加入数据篮', basket_all: '结果全部加入数据篮',
    export: '导出', ex_title: '导出筛选结果', ex_fmt: '格式', ex_scope: '范围', ex_shape: '表形', ex_cols: '列', ex_cite: '文献',
    ex_all: '全部 {n}', ex_page: '当前页 {n}', ex_sel: '已选 {n}', ex_long: '长表（一行一个数值）', ex_wide: '宽表（一行一个样品）',
    ex_cols_all: '全部 {n} 列', ex_cols_pick: '自选列', ex_cols_n: '已选 {n} 列', ex_go: '下载', ex_ris: 'RIS（EndNote、Zotero）',
    ex_bib: 'BibTeX', ex_txt: '纯文本', ex_refs: '{n} 篇论文的文献列表：', ex_done: '已导出 {f}', ex_loading: '正在准备导出…',
    ex_confirm: '要导出 {n} 行，需要下载 {k} 块详细数据，可能要一会儿。继续吗？',
    badge_model: '模型', badge_model_tip: '来源于模型：从论文图中读取的估计值，不是作者原值',
    empty: '没有符合条件的数据', relax_t: '试试去掉一个条件：', relax_i: '去掉「{f}」→ {n} 条', add_filter: '加入筛选',
    filter_added: '已加入筛选：{f}', filter_already: '「{f}」已经在筛选条件里',
    sig_tip: '显著性字母（原文作者标注）：只在同一篇论文、同一张表或图里的样品之间比较，字母相同表示差异不显著',
    sig_note: '是原文作者标的显著性分组：只在同一篇论文、同一张表或图里的样品之间比较，有相同字母的两个数值差异不显著（显著性水平见原文，通常 p < 0.05）；不同论文的字母互不相关。',
    open_doi_tip: '在出版商网站打开原文：{t}',
    col_prop: '性质', col_value: '数值', col_sample: '样品', col_protein: '蛋白', col_treat: '样品处理', col_method: '测试方法',
    col_ph: '测定 pH', col_journal: '期刊', col_source: '来源', col_paper: '论文', col_values: '数值', col_props: '测了哪些性质',
    col_nsamples: '样品', col_measure: '测量名称', cols_hint: '性质和数值两列一直显示',
    sample_n: '样品 {n}', axis: '轴倍率 {m}', errbar: '误差棒 {lo} – {hi}', series: '系列 {s}', x: 'X = {x}', std: '= {v} {u}',
    cond_lbl: '测定条件：', prev: '上一页', next: '下一页', expand: '展开',
    x_summary: '方法概述', x_summary_lang: '英文', x_cond: '全部测定条件', x_steps: '样品处理步骤', x_ing: '复配物', x_detail: '数据来源',
    x_no_summary: '这篇没有提取到这个数值的测试方法', sample_page: '样品页', paper_page: '论文页', open_doi: '打开原文（DOI）',
    b_add: '加入数据篮', b_remove: '移出数据篮', b_added: '已加入数据篮（共 {n} 个样品）', b_removed: '已移出数据篮',
    b_full: '数据篮最多 {n} 个样品', b_confirm_all: '要把结果里的 {n} 个样品都加入数据篮吗？',
    // 图表
    c_hist: '分布', c_box: '分组比较', c_scatter: '散点', c_prop: '性质', c_unit: '单位', c_group: '分组', c_x: '横轴',
    c_log: '对数坐标', c_table: '表格', c_none: '当前结果里没有可以画的数值',
    c_note: '只画单位为「{u}」的 {n} 个数值（这项性质共 {m} 个）；作者原值和读图值一起画。',
    c_out: '另有 {n} 个极端值在显示范围外，没有画（最小 {a}，最大 {b}；勾「对数坐标」可以看全部）。',
    c_note_sc: '只画单位为「{u}」且有横轴取值的 {n} 个数值；点多于 {cap} 个时均匀抽取。', c_count: '数值个数', c_count_fmt: '{n} 个数值',
    c_median: '中位数', c_range: '范围', c_group_n: '组（每组至少 3 个数值，取前 12）', c_dl: '下载', c_csv: '数据 CSV',
    g_src: '蛋白来源', g_tt: '样品处理类型', g_method: '测试方法', g_pcat: '蛋白类别', g_form: '蛋白形态', g_journal: '期刊', g_sys: '体系',
    x_ph: '测定 pH', x_temp: '样品处理最高温度（°C）', group: '分组', n: 'n', median: '中位数', q1: '下四分位', q3: '上四分位',
    // 浏览
    br_title: '浏览', br_sub: '按类别查看库里有什么；点任一项进入检索。', br_tab_prop: '功能特性', br_tab_src: '蛋白来源',
    br_tab_tt: '样品处理类型', br_tab_method: '测试方法', br_tab_journal: '期刊', br_n: '{v} 个数值 · {s} 个样品 · {p} 篇论文',
    br_dist: '分布页', br_search: '检索', br_sort_n: '按数量', br_sort_az: '按名称', br_method_note: '按性质分组：每项性质用到的测试方法（按数值个数）',
    br_routine: '常规步骤', br_mod: '改性与加工', br_units: '常用单位',
    // 统计
    st_title: '统计', st_sub: '全库数据的分布；每张图都可以下载图片（PNG、SVG）和图中数据（CSV）。',
    st_props: '各项性质的数值数', st_model: '各性质中来源于模型（读图）的比例', st_pcat: '蛋白类别（样品数）', st_src: '蛋白来源前 20（样品数）',
    st_form: '蛋白形态（样品数）', st_tt: '样品处理类型前 20（样品数，不含常规步骤）', st_tcat: '样品处理类别（样品数）',
    st_mt: '测试方法前 20（数值个数，不含「其他方法」）', st_jr: '期刊（论文数）', st_sys: '体系（样品数）', st_sd: '各性质中附 SD 的比例',
    k_methods: '测试方法记录', k_mnames: '测试方法种类', k_journals: '期刊', k_model: '来源于模型', k_sd: '附 SD 的数值',
    // 性质分布页
    pp_title: '性质数值：{x}', pp_prop: '性质', pp_src: '蛋白来源', pp_tt: '样品处理', pp_any: '全部', pp_unit: '单位',
    pp_methods: '测试方法', pp_origin: '数据来源', pp_chart: '数值分布（按论文分列）', pp_median: '每篇中位数', pp_sort: '按中位数排序',
    pp_byorigin: '区分数据来源', pp_more_groups: '论文太多，只画数值最多的 {n} 篇', pp_unit_note: '图里只画单位为「{u}」的 {n} 个数值',
    pp_sum: '数值汇总', pp_msum: '测试方法概述（可照着复现）', pp_treat: '样品处理条件', pp_raw: '原始数值表（{n} 行）',
    pp_in_search: '在检索中查看', pp_basket: '全部加入数据篮', pp_copy: '复制本页链接', pp_dl: '下载这些数据', pp_none: '没有符合条件的数值',
    pp_single: '单个数值', pp_show_more: '显示全部 {n} 行', pp_shown: '显示前 {n} 行', pp_paper: '论文',
    // 下载
    dl_title: '下载', dl_sub: 'PDF 的全部数据都可以下载，UTF-8 编码的 CSV（Excel 可直接打开）。数据许可 CC BY 4.0，使用时请引用本数据库和对应的原始论文。',
    dl_flat: '按性质下载（平铺表）', dl_flat_sub: '一行一个数值，样品、配料、处理条件、测试方法和论文信息都在同一行，适合直接在 Excel 里筛选；17 项性质各一个文件。',
    dl_th_prop: '性质', dl_total: '共 {n} 个文件、{s}；每个压缩包里都附说明（README）和数据许可', dl_btn: '下载', dl_tables: '分表下载（关系表）',
    dl_tables_sub: '完整数据库，各表用 doi、sample_id、measurement_id 互相关联，适合导入数据库或用 R / Python 合并。',
    dl_th_file: '文件', dl_th_row: '一行是', dl_th_cols: '主要的列', dl_th_rows: '行数', dl_th_size: '大小',
    dl_fields: '各表每一列的含义见', dl_fields_link: '帮助 · 字段说明',
    dl_manifest_fail: '文件清单加载失败：{e}',
    tb_papers: '论文', tb_samples: '样品', tb_ingredients: '复配物', tb_treatments: '样品处理步骤', tb_treatment_params: '样品处理参数',
    tb_measurements: '数值', tb_measurement_conditions: '测定条件', tb_methods: '测试方法', tb_flat_measurements: '数值（含样品、处理、论文信息的平铺表）',
    // 更新日志
    cl_title: '更新日志', cl_sub: '每个版本的主要变化。',
    // 数据篮、对比
    bk_title: '数据篮', bk_sub: '把感兴趣的样品攒在这里（保存在这个浏览器里），再一起对比或下载。',
    bk_empty: '数据篮是空的。在检索结果里勾选后点「加入数据篮」，或在样品页点「加入数据篮」。', bk_compare: '对比所选（2–6 个）',
    bk_remove: '移出所选', bk_clear: '清空', bk_csv: '数值 · CSV', bk_xlsx: '数值 · Excel', bk_wide: '样品宽表 · Excel',
    bk_search: '在检索中查看', bk_need: '先勾选 2–6 个样品', bk_cleared: '已清空', bk_count: '{n} 个样品，共 {v} 个数值',
    bk_confirm_clear: '清空数据篮里的 {n} 个样品？',
    cmp_title: '样品对比', cmp_empty: '先在数据篮里勾选 2–6 个样品，再点「对比所选」。', cmp_remove: '移出', cmp_paper: '论文',
    cmp_values: '数值', cmp_export_csv: '导出对比 · CSV', cmp_export_xlsx: '导出对比 · Excel', cmp_back: '回到数据篮',
    // 论文页、样品页
    p_samples: '样品', p_methods: '测试方法（{n}）', p_methods_sub: '每项指标的测定方法概述（英文，由提取的方法名称、出处、参数、仪器拼成），可照着复现实验',
    p_in_search: '在检索中查看这篇的全部数值', p_n_values: '数值', p_applies: '对应图表', p_ref: '出处', p_inst: '仪器',
    p_notfound: '找不到这篇论文', s_notfound: '找不到这个样品', s_info: '样品信息', s_values: '数值（{n}）',
    s_methods: '这个样品用到的测试方法', d_desc: '说明', d_psrc: '蛋白来源', d_psrc_std: '规范名称', d_pcat: '蛋白类别',
    d_pform: '蛋白形态', d_pconc: '蛋白浓度', d_sys: '体系', d_ing: '复配物', d_steps: '样品处理步骤', d_none: '无',
    d_untreated: '未处理', d_types: '处理类型', p_download: '下载这篇的数据', s_download: '下载这个样品的数据',
    unextracted_note: '这篇论文还没有提取测试方法',
    n_values: '{n} 个数值', n_samples: '{n} 个样品', n_papers: '{n} 篇论文',
  };

  const en = {
    skip: 'Skip to content', fullname: 'Protein Database of Functionality', title: 'PDF · Protein Database of Functionality', menu: 'Menu',
    nav_home: 'Home', nav_search: 'Search', nav_browse: 'Browse', nav_props: 'Properties', nav_stats: 'Statistics', nav_download: 'Download', nav_help: 'Help',
    nav_basket: 'Basket', nav_changelog: 'Changelog',
    loading: 'Loading data…', load_fail: 'Failed to load data: {e}', loading_search: 'Loading keyword index…',
    no_stream: 'This browser is too old to decompress the data. Please use a recent Chrome, Edge, Firefox or Safari.',
    f_data_1: 'Data CC BY 4.0, code MIT', f_cite: 'How to cite', f_feedback: 'Feedback',
    f_built: 'Data updated {d}', f_version: 'Version {v}',
    f_copy: 'Article copyright remains with the authors and publishers', f_lab: 'Developed by ',
    f_prop: 'Functional property', f_src: 'Protein source', f_pcat: 'Protein category', f_form: 'Protein form',
    f_tt: 'Sample treatment type', f_tcat: 'Sample treatment category', f_method: 'Test method', f_sys: 'System', f_journal: 'Journal',
    f_unit: 'Unit', f_origin: 'Data origin', f_paper: 'Paper', f_q: 'Keyword', f_batch: 'Batch', f_adv: 'Query', f_sd: 'With SD',
    f_pure: 'Pure protein', o_author: 'Author-reported', o_model: 'Model-derived (from figure)', m_unextracted: 'Method not extracted',
    m_none: 'Not stated in the article', m_amb: 'Method unclear', not_stated: 'Not stated', no_unit: '(no unit)', unit_other: 'Other (not converted)', unknown: 'Unknown',
    find: 'Find…', more: 'More ({n})', less: 'Less', reset: 'Clear all', clear: 'Clear', min: 'Min', max: 'Max', all: 'All', copy: 'Copy', copied: 'Copied',
    h_title: '<em>PDF</em>: Protein Database of Functionality', h_ver: 'Version {v}', h_built: 'Data updated {d}', h_nprops: '{n} functional properties',
    h_lead: 'Functional-property values of food proteins extracted from published papers — every value linked to its sample, sample treatment and test method.',
    h_ph: 'Protein source, treatment, property, test method or DOI', h_go: 'Search',
    fld_all: 'All fields', fld_prop: 'Property', fld_src: 'Protein source', fld_tt: 'Treatment', fld_method: 'Test method', fld_journal: 'Journal', fld_doi: 'DOI',
    h_try: 'Try:', h_adv: 'Advanced search', h_browse: 'Browse by category', h_help: 'How to use',
    h_papers: 'Papers', h_samples: 'Samples', h_values: 'Values', h_sources: 'Protein sources', h_ttypes: 'Treatment types',
    h_props: 'Values per property', h_props_sub: 'Top 10 · click a bar to search', h_props_more: 'All 17 properties →',
    h_src: 'Common protein sources', h_src_sub: 'By samples, top 10', h_src_more: 'Browse all {n} sources →',
    h_tt: 'Common sample treatments', h_tt_sub: 'By samples, excluding routine steps (dissolving, centrifugation, drying…)', h_tt_more: 'Browse all {n} treatment types →',
    h_hub: '{n} properties', h_wheel: 'The 17 properties', h_wheel_sub: 'In four groups. Click a property in the ring, or a name below, to see its value distribution, common test methods and raw values.', h_nvals: '{n} values',
    e_search: 'Search values', e_search_d: 'Filter by property, protein, treatment and method; plot, compare, export',
    e_props: 'Property guide', e_props_d: 'What each property measures, its units and common test methods',
    e_dl: 'Download', e_dl_d: 'Flat tables per property or the full relational tables, CC BY 4.0',
    e_ai: 'For AI agents', e_ai_d: 'Copy one paragraph to your AI; it downloads and analyses the data itself',
    h_line_model: 'values were read from figures and are estimates', h_line_cite: 'How to cite',
    pr_sub: 'What each of the 17 properties measures, the units it is reported in, the test methods used most in the database, and how many values there are. The number after a method is how many values in the database were measured with it.',
    pr_th_prop: 'Property', pr_th_def: 'What it measures', pr_th_unit: 'Common units', pr_th_methods: 'Most used test methods', pr_th_n: 'Values', pr_dist: 'Distribution →',
    pr_note: 'The four groups are for browsing only. Units are ranked by number of values; values that could not be converted (unrecognised unit or a different basis) keep their original unit — see value_std / unit_std in the download files.',
    s_title: 'Search', s_sub: 'Filter by property and value, protein, sample treatment, test method or literature; paste a list of DOIs for a batch search, or combine conditions in the query builder. Filters are kept in the URL, so you can bookmark and share them.',
    kw_ph: 'Keyword — or start typing a protein, treatment, property, method or DOI', kw_go: 'Search',
    kw_hint: 'Searches title, DOI, journal, sample, protein, ingredients, sample treatment, measure name and test method; all space-separated words must match',
    panel_hide: 'Hide filters', panel_show: 'Show filters',
    tab_prop: 'Property & value', tab_protein: 'Protein', tab_treat: 'Sample treatment', tab_method: 'Test method', tab_lit: 'Literature',
    tab_batch: 'Batch search', tab_adv: 'Query builder',
    flag_sd: 'Only values with an SD', flag_pure: 'Only pure-protein samples (no added ingredients)',
    r_value: 'Value (standard unit)', r_value_hint: 'Compared in the standard unit (original unit where not convertible); pick a property and unit first',
    r_ph: 'Measurement pH', r_ph_hint: 'Only pH given as a single number', r_temp: 'Treatment temperature (°C)', r_time: 'Treatment time (min)',
    r_tph: 'Treatment pH', r_pres: 'Pressure (MPa)', r_pow: 'Power (W)', r_freq: 'Frequency (kHz)', r_treat_hint: 'Any sample treatment step within the range',
    prop_page: 'Value-distribution page for “{p}” →', doi_lbl: 'Paper DOI', doi_ph: 'e.g. 10.1021/jf103771x', doi_go: 'Only this paper',
    b_hint: 'One DOI, sample name or “DOI~sample number” (e.g. 10.1021/jf103771x~2) per line; commas and semicolons also work.',
    b_go: 'Search these', b_report: 'Found {p} papers and {s} samples; {x} not found', b_missing: 'Not found:', b_chip: 'Batch: {n} items',
    a_hint: 'One condition per row; join rows with AND, OR or NOT (and not). Rows are combined top to bottom, then together with the filters in the other tabs.',
    a_add: 'Add condition', a_run: 'Run query', a_example: 'Load example', a_clear: 'Clear', a_copy: 'Copy link', a_save: 'Save query',
    a_saved: 'Saved queries (in this browser)', a_saved_none: 'No saved queries yet', a_name: 'Name this query', a_del: 'Delete', a_load: 'Load',
    a_preview: 'Query', a_none: 'No conditions yet', a_copied: 'Link copied', a_saved_ok: 'Saved', a_chip: 'Query: {q}',
    op_is: 'is', op_not: 'is not', op_has: 'includes', op_hasnot: 'excludes', op_between: 'between', op_ge: '≥', op_le: '≤',
    q_value: 'Value (standard unit)', q_ph: 'Measurement pH', q_temp: 'Treatment °C', q_time: 'Treatment min', q_tph: 'Treatment pH', q_pres: 'Pressure MPa',
    q_pow: 'Power W', q_freq: 'Frequency kHz', q_kw: 'Keyword', q_doi: 'DOI',
    res_v: 'Values', res_s: 'Samples', res_p: 'Papers', res_by: 'Show',
    count_v: '<b>{n}</b> values from <b>{s}</b> samples in <b>{p}</b> papers',
    chart_btn: 'Charts', cols_btn: 'Columns', page_size: 'Per page', basket_sel: 'Add {n} selected to basket', basket_all: 'Add all results to basket',
    export: 'Export', ex_title: 'Export results', ex_fmt: 'Format', ex_scope: 'Rows', ex_shape: 'Layout', ex_cols: 'Columns', ex_cite: 'References',
    ex_all: 'All {n}', ex_page: 'This page {n}', ex_sel: 'Selected {n}', ex_long: 'Long (one row per value)', ex_wide: 'Wide (one row per sample)',
    ex_cols_all: 'All {n} columns', ex_cols_pick: 'Choose columns', ex_cols_n: '{n} columns', ex_go: 'Download', ex_ris: 'RIS (EndNote, Zotero)',
    ex_bib: 'BibTeX', ex_txt: 'Plain text', ex_refs: 'Reference list of {n} papers:', ex_done: 'Exported {f}', ex_loading: 'Preparing export…',
    ex_confirm: 'Exporting {n} rows needs {k} data blocks and may take a while. Continue?',
    badge_model: 'Model', badge_model_tip: 'Model-derived: estimated from a figure, not an author-reported value',
    empty: 'No data match the filters', relax_t: 'Try removing one filter:', relax_i: 'Without “{f}” → {n}', add_filter: 'Add as filter',
    filter_added: 'Filter added: {f}', filter_already: '“{f}” is already a filter',
    sig_tip: 'Significance letter (as given by the authors): compares samples only within the same table or figure of the same paper; values sharing a letter are not significantly different',
    sig_note: 'are the authors’ significance groupings: they compare samples only within the same table or figure of the same paper, and two values sharing a letter are not significantly different (significance level as stated in the article, usually p < 0.05). Letters from different papers are unrelated.',
    open_doi_tip: 'Open the article on the publisher’s site: {t}',
    col_prop: 'Property', col_value: 'Value', col_sample: 'Sample', col_protein: 'Protein', col_treat: 'Sample treatment', col_method: 'Test method',
    col_ph: 'pH', col_journal: 'Journal', col_source: 'Source', col_paper: 'Paper', col_values: 'Values', col_props: 'Properties measured',
    col_nsamples: 'Samples', col_measure: 'Measure', cols_hint: 'Property and value are always shown',
    sample_n: 'Sample {n}', axis: 'axis multiplier {m}', errbar: 'error bar {lo} – {hi}', series: 'series {s}', x: 'X = {x}', std: '= {v} {u}',
    cond_lbl: 'Conditions: ', prev: 'Previous', next: 'Next', expand: 'Expand',
    x_summary: 'Method summary', x_summary_lang: 'English', x_cond: 'All measurement conditions', x_steps: 'Sample treatment steps',
    x_ing: 'Ingredients', x_detail: 'Data source', x_no_summary: 'No test method was extracted for this value',
    sample_page: 'Sample page', paper_page: 'Paper page', open_doi: 'Open article (DOI)',
    b_add: 'Add to basket', b_remove: 'Remove from basket', b_added: 'Added to basket ({n} samples)', b_removed: 'Removed from basket',
    b_full: 'The basket holds up to {n} samples', b_confirm_all: 'Add all {n} samples in the results to the basket?',
    c_hist: 'Distribution', c_box: 'By group', c_scatter: 'Scatter', c_prop: 'Property', c_unit: 'Unit', c_group: 'Group by',
    c_x: 'X axis', c_log: 'Log scale', c_table: 'Table', c_none: 'Nothing to plot in the current results',
    c_note: 'Plots the {n} values in “{u}” ({m} values of this property in total); author-reported and model-derived values together.',
    c_out: '{n} extreme values outside the shown range are not plotted (min {a}, max {b}; tick “Log scale” to see all).',
    c_note_sc: 'Plots the {n} values in “{u}” that have an X value; sampled evenly above {cap} points.', c_count: 'Values',
    c_count_fmt: '{n} values', c_median: 'median', c_range: 'range', c_group_n: 'groups (≥ 3 values each, top 12)', c_dl: 'Download', c_csv: 'Data CSV',
    g_src: 'Protein source', g_tt: 'Sample treatment type', g_method: 'Test method', g_pcat: 'Protein category', g_form: 'Protein form',
    g_journal: 'Journal', g_sys: 'System', x_ph: 'Measurement pH', x_temp: 'Highest sample treatment temperature (°C)',
    group: 'Group', n: 'n', median: 'Median', q1: 'Q1', q3: 'Q3',
    br_title: 'Browse', br_sub: 'See what the database contains by category — click any item to search.', br_tab_prop: 'Functional properties',
    br_tab_src: 'Protein sources', br_tab_tt: 'Sample treatments', br_tab_method: 'Test methods', br_tab_journal: 'Journals',
    br_n: '{v} values · {s} samples · {p} papers', br_dist: 'Distribution', br_search: 'Search', br_sort_n: 'By count', br_sort_az: 'A–Z',
    br_method_note: 'Grouped by property: test methods used for each property (by number of values)', br_routine: 'Routine steps',
    br_mod: 'Modification & processing', br_units: 'Common units',
    st_title: 'Statistics', st_sub: 'Distributions across the whole database; every chart can be downloaded as an image (PNG, SVG) or as data (CSV).',
    st_props: 'Values per property', st_model: 'Share of model-derived values per property', st_pcat: 'Protein categories (samples)',
    st_src: 'Top 20 protein sources (samples)', st_form: 'Protein forms (samples)', st_tt: 'Top 20 sample treatments (samples, excluding routine steps)',
    st_tcat: 'Sample treatment categories (samples)', st_mt: 'Top 20 test methods (values, excluding “Other method”)', st_jr: 'Journals (papers)',
    st_sys: 'Systems (samples)', st_sd: 'Share of values with an SD per property',
    k_methods: 'Method records', k_mnames: 'Test-method types', k_journals: 'Journals', k_model: 'Model-derived', k_sd: 'Values with SD',
    pp_title: 'Property values: {x}', pp_prop: 'Property', pp_src: 'Protein source', pp_tt: 'Sample treatment', pp_any: 'Any', pp_unit: 'Unit',
    pp_methods: 'Test methods', pp_origin: 'Data origin', pp_chart: 'Value distribution by paper', pp_median: 'Median per paper',
    pp_sort: 'Sort by median', pp_byorigin: 'Mark data origin', pp_more_groups: 'Too many papers — only the {n} with most values are shown',
    pp_unit_note: 'The chart shows the {n} values in “{u}”', pp_sum: 'Summary', pp_msum: 'Test-method summaries (to reproduce the test)',
    pp_treat: 'Sample treatments', pp_raw: 'Value table ({n} rows)', pp_in_search: 'Open in Search', pp_basket: 'Add all to basket',
    pp_copy: 'Copy link', pp_dl: 'Download these data', pp_none: 'No values match', pp_single: 'Single value',
    pp_show_more: 'Show all {n} rows', pp_shown: 'First {n} rows', pp_paper: 'Paper',
    dl_title: 'Download', dl_sub: 'All PDF data can be downloaded as UTF-8 CSV files (open directly in Excel). Data are licensed CC BY 4.0 — please cite this database and the original articles.',
    dl_flat: 'By property (flat tables)', dl_flat_sub: 'One row per value, with the sample, ingredients, treatment conditions, test method and paper in the same row — ready to filter in Excel; one file for each of the 17 properties.',
    dl_th_prop: 'Property', dl_total: '{n} files, {s} in total; each archive includes the README and the data licence', dl_btn: 'Download', dl_tables: 'Relational tables',
    dl_tables_sub: 'The complete database; tables are linked by doi, sample_id and measurement_id — for importing into a database or joining in R / Python.',
    dl_th_file: 'File', dl_th_row: 'One row per', dl_th_cols: 'Key columns', dl_th_rows: 'Rows', dl_th_size: 'Size',
    dl_fields: 'What each column means:', dl_fields_link: 'Help · Fields',
    dl_manifest_fail: 'Could not load the file list: {e}',
    tb_papers: 'paper', tb_samples: 'sample', tb_ingredients: 'ingredient', tb_treatments: 'sample treatment step', tb_treatment_params: 'treatment parameter',
    tb_measurements: 'value', tb_measurement_conditions: 'measurement condition', tb_methods: 'test method', tb_flat_measurements: 'value, with all sample, treatment and paper fields',
    cl_title: 'Changelog', cl_sub: 'Main changes in each version.',
    bk_title: 'Data basket', bk_sub: 'Collect samples here (stored in this browser), then compare or download them together.',
    bk_empty: 'The basket is empty. Tick results in Search and click “Add to basket”, or use “Add to basket” on a sample page.',
    bk_compare: 'Compare selected (2–6)', bk_remove: 'Remove selected', bk_clear: 'Clear all', bk_csv: 'Values · CSV', bk_xlsx: 'Values · Excel',
    bk_wide: 'Sample wide table · Excel', bk_search: 'Show in Search', bk_need: 'Select 2–6 samples first', bk_cleared: 'Cleared',
    bk_count: '{n} samples, {v} values', bk_confirm_clear: 'Remove all {n} samples from the basket?',
    cmp_title: 'Compare samples', cmp_empty: 'Select 2–6 samples in the basket, then click “Compare selected”.', cmp_remove: 'Remove',
    cmp_paper: 'Paper', cmp_values: 'Values', cmp_export_csv: 'Export comparison · CSV', cmp_export_xlsx: 'Export comparison · Excel', cmp_back: 'Back to basket',
    p_samples: 'Samples', p_methods: 'Test methods ({n})', p_methods_sub: 'How each property was measured (assembled from the extracted method name, reference, parameters and instrument) — enough to reproduce the test',
    p_in_search: 'Show all values of this paper in Search', p_n_values: 'Values', p_applies: 'Figures / tables', p_ref: 'Reference',
    p_inst: 'Instrument', p_notfound: 'Paper not found', s_notfound: 'Sample not found', s_info: 'Sample', s_values: 'Values ({n})',
    s_methods: 'Test methods used for this sample', d_desc: 'Description', d_psrc: 'Protein source', d_psrc_std: 'Standard name',
    d_pcat: 'Protein category', d_pform: 'Protein form', d_pconc: 'Protein concentration', d_sys: 'System', d_ing: 'Ingredients',
    d_steps: 'Sample treatment steps', d_none: 'None', d_untreated: 'Untreated', d_types: 'Treatment types',
    p_download: 'Download this paper’s data', s_download: 'Download this sample’s data',
    unextracted_note: 'Test methods have not been extracted for this paper yet',
    n_values: '{n} values', n_samples: '{n} samples', n_papers: '{n} papers',
  };

  // 帮助页：每节 [id, 标题, HTML]
  const HELP = {
    zh: [
      ['quick', '快速上手', `<ol>
        <li>在首页或检索页的检索框里输入蛋白来源、处理方式、性质、测试方法或 DOI，从提示里选一项就会按它筛选；直接按回车则在全文里找关键词。</li>
        <li>在检索页用页签里的条件逐步缩小范围（性质与数值、蛋白、样品处理、测试方法、文献），结果和每个选项后面的计数会实时更新。上方的标签显示当前条件，点 × 去掉。</li>
        <li>点每行左边的 + 展开，看测试方法概述、全部测定条件、样品处理步骤和复配物；点样品名或论文进入详情页。</li>
        <li>勾选感兴趣的行加入数据篮，或用「导出」下载；「图表」按当前结果画分布、分组比较和散点。</li></ol>
        <p>按 <span class="kbd">/</span> 可以随时跳到检索框。</p>`],
      ['search', '检索与筛选', `<p>同一个筛选项里勾了几个值，满足其中任一个即可（或）；不同筛选项之间要同时满足（且）。每个选项后面的数字是加上它以后会有多少个数值。</p>
        <ul><li><b>按性质与数值</b>：17 项功能特性、单位、数据来源；数值范围按标准单位比较；测定 pH 只认写成单个数的。</li>
        <li><b>按蛋白</b>：规范化后的蛋白来源（约 100 种）、蛋白类别、蛋白形态、体系；可以只看纯蛋白样品（没有复配物）。</li>
        <li><b>按样品处理</b>：处理类型（超声、加热、酶解……）、处理类别，以及处理温度、时间、pH、压力、功率、频率的范围——任一处理步骤落在范围内即可。</li>
        <li><b>按测试方法</b>：每个数值对应的测试方法（例如 Bradford 法、动态光散射）。</li>
        <li><b>按文献</b>：期刊、单篇论文（DOI）、关键词。</li></ul>
        <p>结果可以按数值、样品或论文三种方式显示。筛选条件都写在网址里，复制网址就能分享同样的结果。</p>`],
      ['adv', '高级查询', `<p>「高级查询」页签里一行一个条件：选字段、运算（是 / 不是 / 包含 / 不包含 / 介于 / ≥ / ≤）和取值；行与行之间选 AND（且）、OR（或）、NOT（且不），从上到下依次组合。例如：</p>
        <p><code>{功能特性 = 溶解度} AND {蛋白来源 = Soybean} AND {处理类型 包含 Ultrasound} NOT {处理类型 包含 Enzymatic hydrolysis}</code></p>
        <p>高级查询和其他页签里的筛选一起生效。查询可以复制成链接，也可以保存在这个浏览器里，下次在「我的查询」里一键载入。</p>`],
      ['batch', '批量检索', `<p>在「批量检索」页签里粘贴一列 DOI、样品名，或「DOI~样品编号」（如 <code>10.1021/jf103771x~2</code>），每行一个，也可以用逗号、分号隔开。找不到的会列出来。</p>`],
      ['basket', '数据篮与导出', `<p>数据篮保存在你的浏览器里（换浏览器或清除网站数据后会清空）。在检索结果里勾选后点「加入数据篮」，或在样品页点「加入数据篮」。在数据篮里可以对比 2–6 个样品，或把篮里样品的全部数值一起导出。</p>
        <p>检索结果的「导出」可以选：格式（CSV、TSV、Excel、JSON），范围（全部结果、当前页、勾选的行），表形（长表一行一个数值、宽表一行一个样品），以及要哪些列；还能导出文献列表（RIS、BibTeX、纯文本）。每张图都可以下载 PNG、SVG 和图中数据。</p>`],
      ['fields', '字段说明', `<table class="mini"><thead><tr><th>字段</th><th>含义</th></tr></thead><tbody>
        <tr><td>sample_id</td><td>样品编号，格式 <code>DOI#N</code>，N 是这篇论文里的第几个样品</td></tr>
        <tr><td>protein_source / protein_source_std</td><td>原文写的蛋白来源 / 规范化后的标准名称（如 Soybean、Milk (bovine)）</td></tr>
        <tr><td>protein_form / protein_form_std</td><td>原文写的蛋白形态 / 规范化后的形态（Isolate、Hydrolysate…）</td></tr>
        <tr><td>ingredients_summary</td><td>复配物（多糖、多酚、油脂、盐……）及用量</td></tr>
        <tr><td>treatment_summary / treatment_types</td><td>样品处理步骤（原文用词）/ 规范化后的处理类型</td></tr>
        <tr><td>temperature_c、time_min、ph、pressure_mpa、power_w、frequency_khz</td><td>每个处理步骤的温度、时间、pH、压力、功率、频率（已换成统一单位）</td></tr>
        <tr><td>property / measure_name</td><td>功能特性（17 项之一）/ 论文里的测量名称（如 EAI、ESI、foam stability）</td></tr>
        <tr><td>value / value_text / sd / unit</td><td>数值 / 原文写法（如「&lt;0.1」）/ 标准差 / 原文单位</td></tr>
        <tr><td>value_std / unit_std</td><td>换成标准单位后的数值和单位；换不了的留空</td></tr>
        <tr><td>multiplier</td><td>读图时纵轴的倍率（如 10^3）；value 是刻度读数，没有乘倍率</td></tr>
        <tr><td>significance</td><td>原文作者标的显著性字母（a、b、ab…）：只在同一篇论文、同一张表或图里的样品之间比较，字母相同表示差异不显著；不同论文之间不可比</td></tr>
        <tr><td>conditions_all / measurement_ph</td><td>测定条件（pH、温度、浓度、时间……）/ 写成单个数的测定 pH</td></tr>
        <tr><td>test_method / method_summary</td><td>测试方法名称 / 英文方法概述（方法名称、出处、关键参数、仪器）</td></tr>
        <tr><td>data_origin / source_type</td><td>作者原值或来源于模型 / 数值出自作者表格、正文还是图</td></tr></tbody></table>`],
      ['units', '标准单位', `<p>每项性质按常用单位换算到标准单位（<code>value_std</code>、<code>unit_std</code>），单位写法认不出或基准不同（例如按干重和按湿重）的不换，留空。主要的标准单位：</p>
        <table class="mini"><tbody><tr><td>粒径</td><td>nm</td></tr><tr><td>ζ-电位</td><td>mV</td></tr><tr><td>溶解度</td><td>% 或 mg/mL</td></tr>
        <tr><td>乳化性</td><td>m²/g（乳化活性）、min（乳化稳定性）或 %</td></tr><tr><td>起泡性</td><td>% 或 mL</td></tr><tr><td>凝胶性</td><td>Pa 或 N</td></tr>
        <tr><td>持水性、持油性</td><td>g/g 或 mL/g</td></tr><tr><td>巯基、二硫键</td><td>µmol/g</td></tr></tbody></table>
        <p>样品处理参数统一为：温度 °C、时间 min、压力 MPa、功率 W、频率 kHz。</p>`],
      ['origin', '数据来源与核对', `<p>每个数值都标明出处：作者在<b>表格</b>或<b>正文</b>里给出的是「作者原值」；从论文<b>图</b>中由模型读出的标「模型」（来源于模型），是估计值，误差取决于图的清晰度和刻度。</p>
        <p>样品组成、处理条件、测试方法和数值的对应关系由自动流程完成（大模型解读 + 程序核对）。用于发表或决策前，请点 DOI 对照原文核对。库里只有数值、样品组成、处理条件和方法概述，不收录论文原文句子。</p>`],
      ['faq', '常见问题', `<h3>为什么同一个样品有好几个溶解度？</h3><p>论文常在不同条件下测同一项性质（例如 pH 3、5、7），每个条件一个数值；条件写在「测定条件」里。</p>
        <h3>「模型」的数值能直接用吗？</h3><p>可以用来比较趋势和量级，但它是从图里读出的估计值；需要精确数值时请回到原文。</p>
        <h3>为什么有的数值没有标准单位？</h3><p>原文单位写法认不出、基准不同或需要额外信息（如分子量）才能换算时，不做换算，只保留原单位。</p>
        <h3>数据会更新吗？</h3><p>会分批加入更多出版商的论文；每次更新都写在<a href="#/changelog">更新日志</a>里。</p>
        <h3>能下载全部数据吗？</h3><p>能，见<a href="#/download">下载</a>页：完整数据库按表分别下载，或按性质下载平铺表（一行一个数值，Excel 直接打开）。</p>`],
      ['ai', '给 AI 用', `<p>这一节写给替你查数据、做分析的 AI（Claude Code、ChatGPT、Cursor 等）和脚本。整个数据库都是静态文件，不用注册，也不用 API key。网页要靠 JavaScript 才能显示，AI 直接抓网页看不到内容，所以同样的说明另有一份纯文本：<a href="llms.txt" target="_blank" rel="noopener">llms.txt</a>。</p>
        <h3>把这个库交给你的 AI</h3><p>把下面这段话发给你的 AI：</p>
        <pre data-copy-pre>Use the PDF protein functionality database at {BASE} . Read {BASE}llms.txt first, then download the files listed in {BASE}data/download/manifest.json . Values whose data_origin contains "model-derived" are estimates read from figures. Give the DOI for every number you report.</pre>
        <h3>入口：manifest.json</h3><p><code>data/download/manifest.json</code> 列出全部下载文件，每个文件有 <code>path</code>、<code>rows</code>、<code>cols</code>、<code>bytes</code> 和 <code>sha256</code>（下载后核对文件是否完整）；<code>release</code> 是版本号和日期，版本号变了再重新下载。</p>
        <h3>用哪个文件</h3><ul><li>只要一项性质、每行信息齐全：<code>flat_&lt;property&gt;.csv.zip</code>，property 是 solubility、emulsifying、foaming、gelling、water_holding、oil_holding、particle_size、zeta_potential、pdi、sulfhydryl、disulfide、surface_hydrophobicity、turbidity、degree_of_hydrolysis、free_amino、encapsulation、antioxidant。</li>
          <li>整个库、自己做关联：8 张关系表，用 <code>doi</code> → <code>sample_id</code>（<code>doi#N</code>）→ <code>measurement_id</code> 关联；数值的测试方法按 <code>doi</code> + <code>method_id</code> 对到 <code>methods.csv</code>。</li></ul>
        <h3>读数规则</h3><ul>
          <li>每个 zip 里是一个 UTF-8（带 BOM）CSV，另附 README.md 和 LICENSE-DATA.md。zip 里不止一个文件，pandas 不能直接读，要用 zipfile 打开 CSV（见下面的例子）。</li>
          <li>跨论文比较用 <code>value_std</code> + <code>unit_std</code>。<code>value</code> 是原文单位下的数；<code>multiplier</code> 不为空时，<code>value</code> 是图上的刻度读数，要自己乘倍率。</li>
          <li><code>data_origin</code> 含 <code>model-derived</code> 的是模型从图里读出的估计值，含 <code>author-reported</code> 的是作者在表格或正文里给的原值。</li>
          <li><code>significance</code>（显著性字母）只在同一篇论文、同一张表或图里有意义，不能跨论文比较。</li>
          <li>分类列是中文。要英文请用 <code>property</code>、<code>protein_source_std</code>、<code>protein_form_std</code>、<code>treatment_types</code>、<code>test_method_en</code>、<code>method_summary</code>；一格里有多个值时用 <code> | </code> 隔开。</li>
          <li>库里没有论文原文句子。报告的每个数都要附 DOI（<code>https://doi.org/&lt;doi&gt;</code>），重要结论请对照原文。</li></ul>
        <h3>Python 例子</h3><pre data-copy-pre>import io, zipfile, urllib.request
import pandas as pd

BASE = '{BASE}data/download/'
raw = urllib.request.urlopen(BASE + 'flat_solubility.csv.zip').read()
z = zipfile.ZipFile(io.BytesIO(raw))
df = pd.read_csv(z.open('flat_solubility.csv'), encoding='utf-8-sig', low_memory=False)
df['is_model'] = df['data_origin'].str.contains('model-derived')
soy = df[df['protein_source_std'].str.contains('Soybean', na=False)]
print(soy.groupby('unit_std')['value_std'].describe())</pre>
        <h3>许可与引用</h3><p>数据许可 CC BY 4.0：注明本数据库（网址和版本号），并引用数据所在的原始论文。</p>`],
      ['feedback', '反馈与补充数据', `<p>发现数据错误、想补充论文或建议新功能，欢迎在本网站的 GitHub 仓库提交 Issue（网站发布在 GitHub 上时，页面右上角有 GitHub 链接），写明 DOI 和样品编号。</p>`],
      ['cite', '如何引用', `<p>PDF 的论文正在准备中。在那之前，请引用本网站网址（注明访问日期和版本号），并引用数据所在的原始论文（每条数据都附 DOI）。数据许可为 CC BY 4.0。</p>`],
    ],
    en: [
      ['quick', 'Quick start', `<ol>
        <li>Type a protein source, treatment, property, test method or DOI in the search box (home page or Search page) and pick a suggestion to filter by it; press Enter to search the text for keywords instead.</li>
        <li>On the Search page, narrow down with the tabs (property &amp; value, protein, sample treatment, test method, literature). Results and the count next to every option update as you go. Current filters are shown as chips above the results — click × to remove one.</li>
        <li>Click + at the left of a row to see the test-method summary, all measurement conditions, sample treatment steps and ingredients; click a sample or paper for its detail page.</li>
        <li>Tick rows to add them to the basket, or download them with “Export”; “Charts” plots distributions, group comparisons and scatter plots of the current results.</li></ol>
        <p>Press <span class="kbd">/</span> to jump to the search box.</p>`],
      ['search', 'Searching and filtering', `<p>Several values ticked within one filter are combined with OR; different filters are combined with AND. The number next to each option is how many values you would get with it.</p>
        <ul><li><b>Property &amp; value</b>: 17 functional properties, unit, data origin; the value range is compared in the standard unit; measurement pH only when given as a single number.</li>
        <li><b>Protein</b>: normalised protein source (about 100), protein category, protein form and system; optionally only pure-protein samples (no added ingredients).</li>
        <li><b>Sample treatment</b>: treatment type (ultrasound, heating, enzymatic hydrolysis…), category, and ranges of treatment temperature, time, pH, pressure, power and frequency — any treatment step within the range counts.</li>
        <li><b>Test method</b>: the test method behind each value (e.g. Bradford assay, dynamic light scattering).</li>
        <li><b>Literature</b>: journal, a single paper (DOI) and keywords.</li></ul>
        <p>Results can be shown per value, per sample or per paper. All filters are kept in the URL, so sharing the URL shares the same results.</p>`],
      ['adv', 'Query builder', `<p>In the “Query builder” tab, each row is one condition: a field, an operator (is / is not / includes / excludes / between / ≥ / ≤) and a value. Rows are joined with AND, OR or NOT (and not) and combined from top to bottom, e.g.</p>
        <p><code>{Property = Solubility} AND {Protein source = Soybean} AND {Treatment includes Ultrasound} NOT {Treatment includes Enzymatic hydrolysis}</code></p>
        <p>The query works together with the filters in the other tabs. Copy it as a link, or save it in this browser and reload it from “Saved queries”.</p>`],
      ['batch', 'Batch search', `<p>In the “Batch search” tab, paste DOIs, sample names or “DOI~sample number” (e.g. <code>10.1021/jf103771x~2</code>), one per line or separated by commas or semicolons. Items that are not found are listed.</p>`],
      ['basket', 'Basket and export', `<p>The basket is stored in your browser (it is emptied if you switch browsers or clear site data). Tick results in Search and click “Add to basket”, or use “Add to basket” on a sample page. In the basket you can compare 2–6 samples or export all values of the samples in it.</p>
        <p>“Export” on the Search page lets you choose the format (CSV, TSV, Excel, JSON), the rows (all results, this page, selected rows), the layout (long: one row per value; wide: one row per sample) and the columns; it also exports reference lists (RIS, BibTeX, plain text). Every chart can be downloaded as PNG, SVG and data.</p>`],
      ['fields', 'Fields', `<table class="mini"><thead><tr><th>Field</th><th>Meaning</th></tr></thead><tbody>
        <tr><td>sample_id</td><td>Sample ID, <code>DOI#N</code> where N is the sample number within the paper</td></tr>
        <tr><td>protein_source / protein_source_std</td><td>Protein source as written / standard name (e.g. Soybean, Milk (bovine))</td></tr>
        <tr><td>protein_form / protein_form_std</td><td>Protein form as written / normalised form (Isolate, Hydrolysate…)</td></tr>
        <tr><td>ingredients_summary</td><td>Added ingredients (polysaccharides, polyphenols, oils, salts…) and amounts</td></tr>
        <tr><td>treatment_summary / treatment_types</td><td>Sample treatment steps (as written) / normalised treatment types</td></tr>
        <tr><td>temperature_c, time_min, ph, pressure_mpa, power_w, frequency_khz</td><td>Temperature, time, pH, pressure, power and frequency of each treatment step (unified units)</td></tr>
        <tr><td>property / measure_name</td><td>Functional property (one of 17) / measure name in the paper (e.g. EAI, ESI, foam stability)</td></tr>
        <tr><td>value / value_text / sd / unit</td><td>Value / as written (e.g. “&lt;0.1”) / standard deviation / original unit</td></tr>
        <tr><td>value_std / unit_std</td><td>Value and unit converted to the standard unit; empty where not convertible</td></tr>
        <tr><td>multiplier</td><td>Axis multiplier when read from a figure (e.g. 10^3); value is the axis reading, not multiplied</td></tr>
        <tr><td>significance</td><td>The authors’ significance letters (a, b, ab …): they compare samples only within the same table or figure of the same paper; values sharing a letter are not significantly different. Not comparable across papers.</td></tr>
        <tr><td>conditions_all / measurement_ph</td><td>Measurement conditions (pH, temperature, concentration, time…) / measurement pH as a single number</td></tr>
        <tr><td>test_method / method_summary</td><td>Test method / English method summary (method, reference, key parameters, instrument)</td></tr>
        <tr><td>data_origin / source_type</td><td>Author-reported or model-derived / whether the value came from an author table, the text or a figure</td></tr></tbody></table>`],
      ['units', 'Standard units', `<p>Values are converted to a standard unit per property (<code>value_std</code>, <code>unit_std</code>); unrecognised units or different bases (e.g. dry vs wet weight) are not converted and left empty. Main standard units:</p>
        <table class="mini"><tbody><tr><td>Particle size</td><td>nm</td></tr><tr><td>ζ-Potential</td><td>mV</td></tr><tr><td>Solubility</td><td>% or mg/mL</td></tr>
        <tr><td>Emulsifying properties</td><td>m²/g (EAI), min (ESI) or %</td></tr><tr><td>Foaming properties</td><td>% or mL</td></tr><tr><td>Gelling properties</td><td>Pa or N</td></tr>
        <tr><td>Water / oil holding</td><td>g/g or mL/g</td></tr><tr><td>Sulfhydryl, disulfide</td><td>µmol/g</td></tr></tbody></table>
        <p>Sample treatment parameters use °C, min, MPa, W and kHz.</p>`],
      ['origin', 'Data origin and checking', `<p>Every value states its origin: values from author <b>tables</b> or the <b>text</b> are “author-reported”; values read from <b>figures</b> by a model are marked “Model” (model-derived) and are estimates whose error depends on figure quality and scale.</p>
        <p>The links between sample composition, processing conditions, test methods and values were made by an automated pipeline (LLM interpretation plus programmatic checks). Please check against the original article (DOI) before publication or decisions. The database contains values, sample composition, processing conditions and method summaries only — no text from the articles.</p>`],
      ['faq', 'FAQ', `<h3>Why does one sample have several solubility values?</h3><p>Papers often measure a property under several conditions (e.g. pH 3, 5 and 7); each condition gives one value, described under “Conditions”.</p>
        <h3>Can I use model-derived values?</h3><p>Yes for trends and orders of magnitude, but they are estimates read from figures; go back to the article when you need exact numbers.</p>
        <h3>Why do some values have no standard unit?</h3><p>When the unit is unrecognised, on a different basis or needs extra information (e.g. molecular weight), it is not converted and only the original unit is kept.</p>
        <h3>Will the data be updated?</h3><p>Yes — papers from more publishers are added in batches; every update is listed in the <a href="#/changelog">changelog</a>.</p>
        <h3>Can I download everything?</h3><p>Yes, see <a href="#/download">Download</a>: the complete database table by table, or flat tables by property (one row per value, opens in Excel).</p>`],
      ['ai', 'For AI agents', `<p>This section is for AI agents (Claude Code, ChatGPT, Cursor …) and scripts that look up or analyse data on a user’s behalf. The whole database is static files: no sign-up and no API key. This website needs JavaScript, so an agent fetching the page sees no content; the same instructions are available as plain text in <a href="llms.txt" target="_blank" rel="noopener">llms.txt</a>.</p>
        <h3>Hand the database to your AI</h3><p>Send this to your AI:</p>
        <pre data-copy-pre>Use the PDF protein functionality database at {BASE} . Read {BASE}llms.txt first, then download the files listed in {BASE}data/download/manifest.json . Values whose data_origin contains "model-derived" are estimates read from figures. Give the DOI for every number you report.</pre>
        <h3>Entry point: manifest.json</h3><p><code>data/download/manifest.json</code> lists every download file with its <code>path</code>, <code>rows</code>, <code>cols</code>, <code>bytes</code> and <code>sha256</code> (to check a download is complete); <code>release</code> gives the version and date — download again when the version changes.</p>
        <h3>Which file to use</h3><ul><li>One property, with everything in each row: <code>flat_&lt;property&gt;.csv.zip</code>, where property is one of solubility, emulsifying, foaming, gelling, water_holding, oil_holding, particle_size, zeta_potential, pdi, sulfhydryl, disulfide, surface_hydrophobicity, turbidity, degree_of_hydrolysis, free_amino, encapsulation, antioxidant.</li>
          <li>The whole database, joined yourself: the 8 relational tables, linked by <code>doi</code> → <code>sample_id</code> (<code>doi#N</code>) → <code>measurement_id</code>; a value’s test method is the row in <code>methods.csv</code> with the same <code>doi</code> and <code>method_id</code>.</li></ul>
        <h3>Rules for reading the data</h3><ul>
          <li>Each zip holds one UTF-8 CSV (with BOM) plus README.md and LICENSE-DATA.md. Because there is more than one file, pandas cannot read the zip directly; open the CSV with zipfile (see the example).</li>
          <li>Compare across papers with <code>value_std</code> + <code>unit_std</code>. <code>value</code> is in the article’s unit; when <code>multiplier</code> is not empty, <code>value</code> is the axis reading and must be multiplied.</li>
          <li><code>data_origin</code> containing <code>model-derived</code> marks estimates read from figures by a model; <code>author-reported</code> marks values from the authors’ tables or text.</li>
          <li><code>significance</code> letters are only meaningful within one table or figure of one paper; never compare them across papers.</li>
          <li>Category columns are in Chinese. For English use <code>property</code>, <code>protein_source_std</code>, <code>protein_form_std</code>, <code>treatment_types</code>, <code>test_method_en</code> and <code>method_summary</code>; multiple values in one cell are separated by <code> | </code>.</li>
          <li>No text from the articles is included. Give the DOI (<code>https://doi.org/&lt;doi&gt;</code>) for every number you report, and check important conclusions against the article.</li></ul>
        <h3>Python example</h3><pre data-copy-pre>import io, zipfile, urllib.request
import pandas as pd

BASE = '{BASE}data/download/'
raw = urllib.request.urlopen(BASE + 'flat_solubility.csv.zip').read()
z = zipfile.ZipFile(io.BytesIO(raw))
df = pd.read_csv(z.open('flat_solubility.csv'), encoding='utf-8-sig', low_memory=False)
df['is_model'] = df['data_origin'].str.contains('model-derived')
soy = df[df['protein_source_std'].str.contains('Soybean', na=False)]
print(soy.groupby('unit_std')['value_std'].describe())</pre>
        <h3>Licence and citation</h3><p>Data are licensed CC BY 4.0: credit this database (URL and version) and cite the original articles the data come from.</p>`],
      ['feedback', 'Feedback and contributions', `<p>To report an error, contribute papers or suggest a feature, please open an issue in this website’s GitHub repository (when the site is published on GitHub there is a GitHub link at the top right), giving the DOI and sample number.</p>`],
      ['cite', 'How to cite', `<p>A paper describing PDF is in preparation. Until then, please cite this website (with access date and version) and the original articles (every record has a DOI). Data are licensed CC BY 4.0.</p>`],
    ],
  };
  return { PROP_NAMES, PROP_GROUPS, PROP_SHORT, PROP_DEF, EN, ZH, ROUTINE_TT, TCAT_NAMES, I18N: { zh, en }, HELP };
})();
