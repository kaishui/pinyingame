import './speech-shim.js';

'use strict';

/* ============================================================
 * 一、闯关内容数据（分年级 · 分类型）
 * py:显示字母  read:字母标准读音  words:[汉字/词, 带声调拼音, emoji]
 * ============================================================ */
const LEVELS = [
  { cat: '声母', name: 'b p m f', items: [
    { py: 'b', read: '玻', words: [['爸爸','bà ba','👨'], ['八','bā','8️⃣']] },
    { py: 'p', read: '坡', words: [['皮球','pí qiú','⚽'], ['苹果','píng guǒ','🍎']] },
    { py: 'm', read: '摸', words: [['妈妈','mā ma','👩'], ['木马','mù mǎ','🎠']] },
    { py: 'f', read: '佛', words: [['飞机','fēi jī','✈️'], ['发','fā','🌱']] },
  ]},
  { cat: '声母', name: 'd t n l', items: [
    { py: 'd', read: '得', words: [['大','dà','🐘'], ['的','de','🎯']] },
    { py: 't', read: '特', words: [['他','tā','👦'], ['塔','tǎ','🗼']] },
    { py: 'n', read: '讷', words: [['你','nǐ','👉'], ['拿','ná','✋']] },
    { py: 'l', read: '勒', words: [['了','le','✅'], ['来','lái','🚶']] },
  ]},
  { cat: '声母', name: 'g k h', items: [
    { py: 'g', read: '哥', words: [['哥','gē','👦'], ['瓜','guā','🍉']] },
    { py: 'k', read: '科', words: [['看','kàn','👀'], ['口','kǒu','👄']] },
    { py: 'h', read: '喝', words: [['好','hǎo','👍'], ['花','huā','🌸']] },
  ]},
  { cat: '声母', name: 'j q x', items: [
    { py: 'j', read: '基', words: [['鸡','jī','🐔'], ['家','jiā','🏠']] },
    { py: 'q', read: '欺', words: [['七','qī','7️⃣'], ['球','qiú','🏀']] },
    { py: 'x', read: '希', words: [['西','xī','🌅'], ['下','xià','⬇️']] },
  ]},
  { cat: '声母', name: 'zh ch sh r', items: [
    { py: 'zh', read: '知', words: [['知','zhī','🧠'], ['猪','zhū','🐷']] },
    { py: 'ch', read: '吃', words: [['吃','chī','🍚'], ['车','chē','🚗']] },
    { py: 'sh', read: '诗', words: [['十','shí','🔟'], ['书','shū','📖']] },
    { py: 'r', read: '日', words: [['日','rì','☀️'], ['热','rè','🔥']] },
  ]},
  { cat: '声母', name: 'z c s', items: [
    { py: 'z', read: '资', words: [['字','zì','🔤'], ['左','zuǒ','⬅️']] },
    { py: 'c', read: '雌', words: [['草','cǎo','🌿'], ['菜','cài','🥬']] },
    { py: 's', read: '思', words: [['四','sì','4️⃣'], ['三','sān','3️⃣']] },
  ]},
  { cat: '声母', name: 'y w', items: [
    { py: 'y', read: '衣', words: [['一','yī','1️⃣'], ['鸭','yā','🦆']] },
    { py: 'w', read: '乌', words: [['我','wǒ','🙋'], ['娃','wá','👶']] },
  ]},
  { cat: '韵母', name: 'a o e', items: [
    { py: 'a', read: '啊', words: [['啊','ā','😮'], ['妈','mā','👩']] },
    { py: 'o', read: '喔', words: [['哦','ō','😯'], ['波','bō','🌊']] },
    { py: 'e', read: '鹅', words: [['鹅','é','🦢'], ['车','chē','🚗']] },
  ]},
  { cat: '韵母', name: 'i u ü', items: [
    { py: 'i', read: '衣', words: [['衣','yī','👕'], ['七','qī','7️⃣']] },
    { py: 'u', read: '乌', words: [['乌','wū','🐦‍⬛'], ['猪','zhū','🐷']] },
    { py: 'ü', read: '迂', words: [['鱼','yú','🐟'], ['绿','lǜ','💚']] },
  ]},
  { cat: '韵母', name: 'ai ei ui', items: [
    { py: 'ai', read: '哀', words: [['爱','ài','❤️'], ['白','bái','⬜']] },
    { py: 'ei', read: '诶', words: [['诶','ēi','🤷'], ['妹','mèi','👧']] },
    { py: 'ui', read: '威', words: [['围','wéi','🧣'], ['水','shuǐ','💧']] },
  ]},
  { cat: '韵母', name: 'ao ou iu', items: [
    { py: 'ao', read: '熬', words: [['袄','ǎo','🧥'], ['猫','māo','🐱']] },
    { py: 'ou', read: '欧', words: [['欧','ōu','🇪🇺'], ['狗','gǒu','🐶']] },
    { py: 'iu', read: '优', words: [['优','yōu','⭐'], ['牛','niú','🐮']] },
  ]},
  { cat: '韵母', name: 'ie üe er', items: [
    { py: 'ie', read: '椰', words: [['叶','yè','🍃'], ['写','xiě','✍️']] },
    { py: 'üe', read: '约', words: [['月','yuè','🌙'], ['学','xué','📚']] },
    { py: 'er', read: '儿', words: [['耳','ěr','👂'], ['二','èr','2️⃣']] },
  ]},
  { cat: '韵母', name: 'an en in un ün', items: [
    { py: 'an', read: '安', words: [['安','ān','😌'], ['山','shān','⛰️']] },
    { py: 'en', read: '恩', words: [['恩','ēn','🙏'], ['门','mén','🚪']] },
    { py: 'in', read: '因', words: [['音','yīn','🎵'], ['林','lín','🌲']] },
    { py: 'un', read: '温', words: [['温','wēn','🌡️'], ['春','chūn','🌷']] },
    { py: 'ün', read: '晕', words: [['云','yún','☁️'], ['军','jūn','🎖️']] },
  ]},
  { cat: '韵母', name: 'ang eng ing ong', items: [
    { py: 'ang', read: '昂', words: [['昂','áng','⬆️'], ['羊','yáng','🐑']] },
    { py: 'eng', read: '鞥', words: [['鞥','ēng','😶'], ['风','fēng','🌬️']] },
    { py: 'ing', read: '英', words: [['英','yīng','🦅'], ['星','xīng','⭐']] },
    { py: 'ong', read: '翁', words: [['翁','wēng','👴'], ['红','hóng','🔴']] },
  ]},
  { cat: '整体认读', name: 'zhi chi shi ri', items: [
    { py: 'zhi', read: '知', words: [['知','zhī','🧠'], ['纸','zhǐ','📄']] },
    { py: 'chi', read: '吃', words: [['吃','chī','🍚'], ['尺','chǐ','📏']] },
    { py: 'shi', read: '诗', words: [['十','shí','🔟'], ['是','shì','✅']] },
    { py: 'ri', read: '日', words: [['日','rì','☀️'], ['日','rì','📅']] },
  ]},
  { cat: '整体认读', name: 'zi ci si', items: [
    { py: 'zi', read: '资', words: [['字','zì','🔤'], ['子','zǐ','👶']] },
    { py: 'ci', read: '雌', words: [['次','cì','🔢'], ['词','cí','📝']] },
    { py: 'si', read: '思', words: [['四','sì','4️⃣'], ['思','sī','🤔']] },
  ]},
  { cat: '整体认读', name: 'yi wu yu', items: [
    { py: 'yi', read: '衣', words: [['一','yī','1️⃣'], ['衣','yī','👕']] },
    { py: 'wu', read: '乌', words: [['五','wǔ','5️⃣'], ['无','wú','🚫']] },
    { py: 'yu', read: '迂', words: [['鱼','yú','🐟'], ['雨','yǔ','🌧️']] },
  ]},
  { cat: '整体认读', name: 'ye yue yuan yin yun ying', items: [
    { py: 'ye', read: '耶', words: [['也','yě','✅'], ['叶','yè','🍃']] },
    { py: 'yue', read: '约', words: [['月','yuè','🌙'], ['约','yuē','🤝']] },
    { py: 'yuan', read: '冤', words: [['圆','yuán','⭕'], ['远','yuǎn','🛣️']] },
    { py: 'yin', read: '因', words: [['音','yīn','🎵'], ['因','yīn','🔗']] },
    { py: 'yun', read: '晕', words: [['云','yún','☁️'], ['运','yùn','🚚']] },
    { py: 'ying', read: '英', words: [['英','yīng','🏵️'], ['鹰','yīng','🦅']] },
  ]},
];

/* 年级 / 类型 / 难度（关卡索引区间，左闭右开） */
const GRADES = [
  { id: 'g1', name: '一年级上', range: [0, 7],  emoji: '🎈', desc: '声母' },
  { id: 'g2', name: '一年级下', range: [7, 14], emoji: '🌸', desc: '韵母' },
  { id: 'g3', name: '二年级',   range: [14, 18], emoji: '🌷', desc: '整体认读音节' },
];
const TYPES = [
  { id: 'initial',  name: '声母',     range: [0, 7] },
  { id: 'final',    name: '韵母',     range: [7, 14] },
  { id: 'syllable', name: '整体认读', range: [14, 18] },
  { id: 'all',      name: '全部',     range: [0, 18] },
];
const DIFFS = [
  { id: 'easy',   name: '🌱 轻松', desc: '从第1关开始，全程有「读作」提示' },
  { id: 'medium', name: '🌼 进阶', desc: '从第1关开始，标准闯关' },
  { id: 'hard',   name: '🌟 高手', desc: '从本内容最后一关开始，隐藏「读作」提示' },
];

/* ============================================================
 * 二、音节总览表数据（声母 × 韵母 合法组合，完整音节表）
 * ============================================================ */
const COLS = [
  { group: '开口呼', items: ['a','o','e','ai','ei','ao','ou','an','en','ang','eng','ong','er'] },
  { group: '齐齿呼', items: ['i','ia','ie','iao','iu','ian','in','iang','ing','iong'] },
  { group: '合口呼', items: ['u','ua','uo','uai','ui','uan','un','uang','ueng'] },
  { group: '撮口呼', items: ['ü','üe','üan','ün'] },
];
const GROUP_CLASS = { '开口呼': 'g-open', '齐齿呼': 'g-qi', '合口呼': 'g-he', '撮口呼': 'g-cuo' };
const GROUP_COLOR = { '开口呼': '#ff9ecb', '齐齿呼': '#a78bfa', '合口呼': '#6cc8f0', '撮口呼': '#5fd4c0' };

/* 每个声母行能拼出的韵母（列） */
const ROWS = [
  { k: 'b', finals: ['a','o','ai','ei','ao','an','en','ang','eng','i','ie','iao','ian','in','ing','u'] },
  { k: 'p', finals: ['a','o','ai','ei','ao','ou','an','en','ang','eng','i','ie','iao','ian','in','ing','u'] },
  { k: 'm', finals: ['a','o','e','ai','ei','ao','ou','an','en','ang','eng','i','ie','iao','iu','ian','in','ing','u'] },
  { k: 'f', finals: ['a','o','ei','ou','an','en','ang','eng','u'] },
  { k: 'd', finals: ['a','e','ai','ei','ao','ou','an','en','ang','eng','ong','i','ie','iao','iu','ian','ing','u','uo','ui','uan','un'] },
  { k: 't', finals: ['a','e','ai','ao','ou','an','ang','eng','i','ie','iao','ian','ing','u','uo','ui','uan','un','ong'] },
  { k: 'n', finals: ['a','e','ai','ei','ao','ou','an','en','ang','eng','ong','i','ie','iao','iu','ian','in','iang','ing','u','uo','uan','un','ü','üe'] },
  { k: 'l', finals: ['a','e','ai','ei','ao','ou','an','ang','eng','ong','i','ia','ie','iao','iu','ian','in','iang','ing','u','uo','uan','un','ü','üe'] },
  { k: 'g', finals: ['a','e','ai','ei','ao','ou','an','en','ang','eng','ong','u','ua','uo','uai','ui','uan','un','uang'] },
  { k: 'k', finals: ['a','e','ai','ei','ao','ou','an','en','ang','eng','ong','u','ua','uo','uai','ui','uan','un','uang'] },
  { k: 'h', finals: ['a','e','ai','ei','ao','ou','an','en','ang','eng','ong','u','ua','uo','uai','ui','uan','un','uang'] },
  { k: 'j', finals: ['i','ia','ie','iao','iu','ian','in','iang','ing','iong','ü','üe','üan','ün'] },
  { k: 'q', finals: ['i','ia','ie','iao','iu','ian','in','iang','ing','iong','ü','üe','üan','ün'] },
  { k: 'x', finals: ['i','ia','ie','iao','iu','ian','in','iang','ing','iong','ü','üe','üan','ün'] },
  { k: 'zh', finals: ['a','e','i','ai','ei','ao','ou','an','en','ang','eng','ong','u','ua','uo','uai','ui','uan','un','uang'] },
  { k: 'ch', finals: ['a','e','i','ai','ao','ou','an','en','ang','eng','ong','u','ua','uo','uai','ui','uan','un','uang'] },
  { k: 'sh', finals: ['a','e','i','ai','ei','ao','ou','an','en','ang','eng','u','ua','uo','uai','ui','uan','un','uang'] },
  { k: 'r', finals: ['e','i','ao','ou','an','en','ang','eng','ong','u','ua','uo','ui','uan','un'] },
  { k: 'z', finals: ['a','e','i','ai','ei','ao','ou','an','en','ang','eng','ong','u','uo','ui','uan','un'] },
  { k: 'c', finals: ['a','e','i','ai','ao','ou','an','en','ang','eng','ong','u','uo','ui','uan','un'] },
  { k: 's', finals: ['a','e','i','ai','ao','ou','an','en','ang','eng','ong','u','uo','ui','uan','un'] },
  { k: 'y', finals: ['i','ia','ie','iao','iu','ian','in','iang','ing','iong','ü','üe','üan','ün'] },
  { k: 'w', finals: ['u','ua','uo','uai','ui','uan','un','uang','ueng'] },
  { k: '∅', finals: ['a','o','e','ai','ei','ao','ou','an','en','ang','eng','er'] },
];

const INITIAL_READS = { b:'玻',p:'坡',m:'摸',f:'佛',d:'得',t:'特',n:'讷',l:'勒',g:'哥',k:'科',h:'喝',j:'基',q:'欺',x:'希',zh:'知',ch:'吃',sh:'诗',r:'日',z:'资',c:'雌',s:'思',y:'衣',w:'乌','∅':'零声母' };
const FINAL_READS = {
  a:'啊',o:'喔',e:'鹅',ai:'哀',ei:'诶',ao:'熬',ou:'欧',an:'安',en:'恩',ang:'昂',eng:'鞥',ong:'翁',er:'儿',
  i:'衣',ia:'呀',ie:'椰',iao:'腰',iu:'优',ian:'烟',in:'因',iang:'央',ing:'英',iong:'拥',
  u:'乌',ua:'蛙',uo:'窝',uai:'歪',ui:'威',uan:'弯',un:'温',uang:'汪',ueng:'翁',
  'ü':'迂','üe':'约','üan':'冤','ün':'晕',
};
const Y_SPELL = { i:'yi',ia:'ya',ie:'ye',iao:'yao',iu:'you',ian:'yan',in:'yin',iang:'yang',ing:'ying',iong:'yong','ü':'yu','üe':'yue','üan':'yuan','ün':'yun' };
const W_SPELL = { u:'wu',ua:'wa',uo:'wo',uai:'wai',ui:'wei',uan:'wan',un:'wen',uang:'wang',ueng:'weng' };

/* 每个音节对应的同音汉字（点击格子时读汉字，而非直接读拼音字母，确保发音正确） */
const SYL_CHAR = {
  // b
  'ba':'八','bo':'波','bai':'白','bei':'杯','bao':'包','ban':'班','ben':'本','bang':'帮','beng':'崩','bi':'比','bie':'别','biao':'标','bian':'边','bin':'宾','bing':'冰','bu':'不',
  // p
  'pa':'爬','po':'坡','pai':'拍','pei':'配','pao':'跑','pou':'剖','pan':'盘','pen':'盆','pang':'旁','peng':'朋','pi':'皮','pie':'撇','piao':'票','pian':'片','pin':'品','ping':'平','pu':'普',
  // m
  'ma':'妈','mo':'摸','me':'么','mai':'买','mei':'妹','mao':'猫','mou':'某','man':'慢','men':'门','mang':'忙','meng':'梦','mi':'米','mie':'灭','miao':'苗','miu':'谬','mian':'面','min':'民','ming':'明','mu':'木',
  // f
  'fa':'发','fo':'佛','fei':'飞','fou':'否','fan':'饭','fen':'分','fang':'方','feng':'风','fu':'福',
  // d
  'da':'大','de':'得','dai':'带','dei':'得','dao':'到','dou':'都','dan':'但','den':'扽','dang':'当','deng':'等','dong':'东','di':'地','die':'爹','diao':'掉','diu':'丢','dian':'点','ding':'定','du':'读','duo':'多','dui':'对','duan':'段','dun':'顿',
  // t
  'ta':'他','te':'特','tai':'太','tao':'桃','tou':'头','tan':'谈','tang':'糖','teng':'疼','ti':'提','tie':'贴','tiao':'跳','tian':'天','ting':'听','tu':'图','tuo':'拖','tui':'推','tuan':'团','tun':'吞','tong':'同',
  // n
  'na':'拿','ne':'呢','nai':'奶','nei':'内','nao':'闹','nou':'耨','nan':'难','nen':'嫩','nang':'囊','neng':'能','nong':'农','ni':'你','nie':'捏','niao':'鸟','niu':'牛','nian':'年','nin':'您','niang':'娘','ning':'宁','nu':'努','nuo':'诺','nuan':'暖','nun':'黁','nü':'女','nüe':'虐',
  // l
  'la':'拉','le':'了','lai':'来','lei':'类','lao':'老','lou':'楼','lan':'蓝','lang':'狼','leng':'冷','long':'龙','li':'里','lia':'俩','lie':'列','liao':'料','liu':'六','lian':'连','lin':'林','liang':'两','ling':'零','lu':'路','luo':'罗','luan':'乱','lun':'论','lü':'绿','lüe':'略',
  // g
  'ga':'嘎','ge':'哥','gai':'该','gei':'给','gao':'高','gou':'狗','gan':'干','gen':'根','gang':'刚','geng':'更','gong':'工','gu':'古','gua':'瓜','guo':'国','guai':'怪','gui':'贵','guan':'关','gun':'滚','guang':'光',
  // k
  'ka':'卡','ke':'可','kai':'开','kei':'尅','kao':'考','kou':'口','kan':'看','ken':'肯','kang':'康','keng':'坑','kong':'空','ku':'哭','kua':'夸','kuo':'阔','kuai':'快','kui':'亏','kuan':'宽','kun':'困','kuang':'狂',
  // h
  'ha':'哈','he':'喝','hai':'海','hei':'黑','hao':'好','hou':'后','han':'汉','hen':'很','hang':'航','heng':'横','hong':'红','hu':'湖','hua':'花','huo':'火','huai':'坏','hui':'会','huan':'换','hun':'婚','huang':'黄',
  // j
  'ji':'鸡','jia':'家','jie':'姐','jiao':'叫','jiu':'九','jian':'见','jin':'金','jiang':'江','jing':'京','jiong':'窘','ju':'居','jue':'决','juan':'卷','jun':'军',
  // q
  'qi':'七','qia':'恰','qie':'切','qiao':'桥','qiu':'秋','qian':'千','qin':'亲','qiang':'强','qing':'清','qiong':'穷','qu':'去','que':'却','quan':'全','qun':'群',
  // x
  'xi':'西','xia':'下','xie':'写','xiao':'小','xiu':'休','xian':'先','xin':'心','xiang':'想','xing':'星','xiong':'兄','xu':'需','xue':'学','xuan':'选','xun':'寻',
  // zh
  'zha':'扎','zhe':'这','zhi':'知','zhai':'摘','zhei':'这','zhao':'找','zhou':'周','zhan':'站','zhen':'真','zhang':'张','zheng':'正','zhong':'中','zhu':'猪','zhua':'抓','zhuo':'桌','zhuai':'拽','zhui':'追','zhuan':'转','zhun':'准','zhuang':'装',
  // ch
  'cha':'茶','che':'车','chi':'吃','chai':'拆','chao':'超','chou':'丑','chan':'产','chen':'陈','chang':'常','cheng':'成','chong':'虫','chu':'出','chua':'欻','chuo':'戳','chuai':'揣','chui':'吹','chuan':'穿','chun':'春','chuang':'窗',
  // sh
  'sha':'沙','she':'蛇','shi':'十','shai':'晒','shei':'谁','shao':'少','shou':'手','shan':'山','shen':'深','shang':'上','sheng':'生','shu':'书','shua':'刷','shuo':'说','shuai':'帅','shui':'水','shuan':'栓','shun':'顺','shuang':'双',
  // r
  're':'热','ri':'日','rao':'绕','rou':'肉','ran':'然','ren':'人','rang':'让','reng':'扔','rong':'容','ru':'如','rua':'挼','ruo':'若','rui':'瑞','ruan':'软','run':'润',
  // z
  'za':'杂','ze':'则','zi':'字','zai':'在','zei':'贼','zao':'早','zou':'走','zan':'赞','zen':'怎','zang':'脏','zeng':'增','zong':'总','zu':'组','zuo':'坐','zui':'最','zuan':'钻','zun':'尊',
  // c
  'ca':'擦','ce':'测','ci':'词','cai':'菜','cao':'草','cou':'凑','can':'参','cen':'岑','cang':'藏','ceng':'层','cong':'从','cu':'粗','cuo':'错','cui':'催','cuan':'窜','cun':'村',
  // s
  'sa':'撒','se':'色','si':'四','sai':'赛','sao':'扫','sou':'搜','san':'三','sen':'森','sang':'桑','seng':'僧','song':'送','su':'苏','suo':'所','sui':'岁','suan':'算','sun':'孙',
  // y
  'yi':'一','ya':'鸭','ye':'也','yao':'要','you':'有','yan':'烟','yin':'音','yang':'羊','ying':'英','yong':'用','yu':'鱼','yue':'月','yuan':'圆','yun':'云',
  // w
  'wu':'五','wa':'蛙','wo':'我','wai':'外','wei':'为','wan':'万','wen':'文','wang':'王','weng':'翁',
  // 零声母
  'a':'啊','o':'哦','e':'鹅','ai':'爱','ei':'诶','ao':'袄','ou':'欧','an':'安','en':'恩','ang':'昂','eng':'鞥','er':'儿',
};

/* 每个音节四个声调的同音汉字（依次：一声/二声/三声/四声，'.' 表示该声调无常用字） */
const TONE_CHAR = {
  // b
  'ba':'八拔把爸','bo':'波脖跛薄','bai':'掰白百拜','bei':'杯.北被','bao':'包雹宝报','ban':'班.板半','ben':'奔.本笨','bang':'帮.榜棒','beng':'崩甭绷蹦','bi':'逼鼻比必','bie':'憋别瘪别','biao':'标..表','bian':'边.扁变','bin':'宾..鬓','bing':'冰.饼病','bu':'..补不',
  // p
  'pa':'趴爬.怕','po':'坡婆叵破','pai':'拍排.派','pei':'胚陪.配','pao':'抛袍跑泡','pou':'剖...','pan':'攀盘.盼','pen':'喷盆.喷','pang':'乓旁耪胖','peng':'烹朋捧碰','pi':'批皮匹屁','pie':'撇.撇.','piao':'飘瓢瞟票','pian':'偏便.片','pin':'拼贫品聘','ping':'乒平..','pu':'铺葡普瀑',
  // m
  'ma':'妈麻马骂','mo':'摸馍抹墨','me':'....','mei':'.梅美妹','mai':'.埋买卖','mao':'猫毛卯帽','mou':'哞谋某.','man':'.蛮满慢','men':'闷门.闷','mang':'.忙莽.','meng':'蒙萌猛梦','mi':'眯迷米密','mie':'咩..灭','miao':'喵苗秒妙','miu':'...谬','mian':'.棉免面','min':'.民敏.','ming':'.明.命','mu':'..母木',
  // f
  'fa':'发罚法发','fo':'.佛..','fei':'飞肥匪费','fou':'..否.','fan':'翻烦反饭','fen':'分坟粉份','fang':'方房仿放','feng':'风逢讽凤','fu':'夫扶斧父',
  // d
  'da':'搭答打大','de':'.得..','dai':'呆.歹带','dei':'得.得.','dao':'刀.倒到','dou':'都.抖豆','dan':'单.胆蛋','den':'...扽','dang':'当.党当','deng':'灯.等凳','dong':'东.懂动','di':'低敌底地','die':'跌叠..','diao':'刁..掉','diu':'丢...','dian':'颠.点电','ding':'丁.顶定','du':'都毒赌度','duo':'多夺朵舵','dui':'堆..队','duan':'端.短段','dun':'蹲.盹顿',
  // t
  'ta':'他.塔踏','te':'...特','tai':'胎抬.太','tao':'掏桃讨套','tou':'偷头.透','tan':'摊谈毯叹','tang':'汤糖躺烫','teng':'.疼..','ti':'踢提体替','tie':'贴.铁.','tiao':'挑条挑跳','tian':'天田舔.','ting':'听停挺.','tu':'秃图土兔','tuo':'拖驼妥唾','tui':'推颓腿退','tuan':'湍团..','tun':'吞屯.褪','tong':'通同桶痛',
  // n
  'na':'那拿哪那','ne':'....','nai':'..奶耐','nei':'..馁内','nao':'.挠脑闹','nou':'...耨','nan':'囡男.难','nen':'...嫩','nang':'囊囊攮.','neng':'.能..','nong':'.农.弄','ni':'妮泥你腻','nie':'捏..聂','niao':'..鸟尿','niu':'妞牛扭拗','nian':'拈年捻念','nin':'.您..','niang':'.娘.酿','ning':'.宁拧宁','nu':'.奴努怒','nuo':'.挪.诺','nuan':'..暖.','nun':'.黁..','nü':'..女.','nüe':'...虐',
  // l
  'la':'拉旯喇辣','le':'...乐','lai':'.来.赖','lei':'勒雷垒类','lao':'捞劳老涝','lou':'搂楼搂漏','lan':'.兰懒烂','lang':'啷狼朗浪','leng':'..冷愣','long':'.龙垄弄','li':'哩梨里力','lia':'..俩.','lie':'咧.咧列','liao':'撩聊了料','liu':'溜流柳六','lian':'.连脸练','lin':'拎林凛吝','liang':'.凉两亮','ling':'.零领令','lu':'噜炉鲁路','luo':'啰罗裸落','luan':'.峦卵乱','lun':'抡轮.论','lü':'.驴吕绿','lüe':'...略',
  // g
  'ga':'嘎尜.尬','ge':'哥格葛个','gai':'该.改盖','gei':'..给.','gao':'高.搞告','gou':'沟.狗够','gan':'干.敢干','gen':'根..艮','gang':'刚.港杠','geng':'耕.耿更','gong':'工.巩共','gu':'姑.骨故','gua':'瓜.寡挂','guo':'锅国果过','guai':'乖.拐怪','gui':'归.鬼贵','guan':'关.管惯','gun':'..滚棍','guang':'光.广逛',
  // k
  'ka':'咖.卡.','ke':'科咳渴课','kai':'开.凯.','kei':'尅...','kao':'..考靠','kou':'抠.口扣','kan':'刊.砍看','ken':'..肯.','kang':'康..抗','keng':'坑...','kong':'空.孔控','ku':'哭.苦库','kua':'夸.垮跨','kuo':'...阔','kuai':'...快','kui':'亏葵.愧','kuan':'宽.款.','kun':'昆.捆困','kuang':'筐狂.矿',
  // h
  'ha':'哈蛤哈.','he':'喝河.贺','hai':'嗨孩海害','hei':'黑...','hao':'蒿豪好号','hou':'齁猴吼后','han':'酣寒喊汗','hen':'.痕很恨','hang':'夯航.巷','heng':'哼横.横','hong':'轰红哄哄','hu':'呼胡虎户','hua':'花华.话','huo':'豁活火货','huai':'.怀.坏','hui':'灰回毁会','huan':'欢还缓换','hun':'婚浑.混','huang':'慌黄谎晃',
  // j
  'ji':'鸡急几记','jia':'家夹假架','jie':'接节解借','jiao':'交嚼脚叫','jiu':'揪.九旧','jian':'尖.减见','jin':'金.紧进','jiang':'江.讲酱','jing':'京.井净','jiong':'..窘.','ju':'居菊举句','jue':'撅决.倔','juan':'捐.卷倦','jun':'军..俊',
  // q
  'qi':'七齐起气','qia':'掐.卡恰','qie':'切茄且怯','qiao':'敲桥巧翘','qiu':'秋球..','qian':'千前浅欠','qin':'亲琴寝.','qiang':'枪墙抢呛','qing':'清情请庆','qiong':'.穷..','qu':'区渠取去','que':'缺瘸.却','quan':'圈全犬劝','qun':'.群..',
  // x
  'xi':'西习洗戏','xia':'虾霞.下','xie':'些鞋写谢','xiao':'消.小笑','xiu':'休.朽秀','xian':'先咸险线','xin':'新..信','xiang':'香详想向','xing':'星行醒性','xiong':'兄熊..','xu':'需徐许续','xue':'靴学雪血','xuan':'宣旋选炫','xun':'熏寻.训',
  // zh
  'zha':'扎炸眨炸','zhe':'遮折者这','zhi':'知直纸志','zhai':'摘宅窄债','zhei':'...这','zhao':'招着找照','zhou':'周轴.皱','zhan':'沾.展站','zhen':'真.枕阵','zhang':'张.掌丈','zheng':'争.整正','zhong':'中.种重','zhu':'猪竹主住','zhua':'抓...','zhuo':'桌浊..','zhuai':'拽.拽.','zhui':'追..坠','zhuan':'专.转赚','zhun':'..准.','zhuang':'装..壮',
  // ch
  'cha':'叉茶.差','che':'车.扯彻','chi':'吃迟尺翅','chai':'拆柴.虿','chao':'抄朝吵.','chou':'抽愁丑臭','chan':'搀缠产颤','chen':'抻陈.趁','chang':'昌长厂唱','cheng':'称成逞秤','chong':'冲虫宠.','chu':'出除楚处','chua':'欻...','chuo':'戳...','chuai':'揣.揣踹','chui':'吹垂..','chuan':'穿船喘串','chun':'春纯蠢.','chuang':'窗床闯创',
  // sh
  'sha':'沙啥傻厦','she':'奢蛇舍社','shi':'诗十使是','shai':'筛.色晒','shei':'.谁..','shao':'烧勺少绍','shou':'收熟手受','shan':'山.闪扇','shen':'深神沈甚','shang':'伤.赏上','sheng':'生绳省胜','shu':'书熟鼠树','shua':'刷.耍.','shuo':'说..烁','shuai':'摔.甩帅','shui':'.谁水睡','shuan':'拴..涮','shun':'..吮顺','shuang':'双.爽.',
  // r
  're':'..惹热','ri':'...日','rao':'.饶扰绕','rou':'.柔.肉','ran':'.然染.','ren':'.人忍认','rang':'嚷壤嚷让','reng':'扔仍..','rong':'.容冗.','ru':'.如乳入','rua':'.挼..','ruo':'...若','rui':'..蕊锐','ruan':'..软.','run':'...润',
  // z
  'za':'扎杂..','ze':'.则.仄','zi':'资.子字','zai':'灾.宰在','zei':'.贼..','zao':'糟凿早造','zou':'邹.走奏','zan':'簪咱攒赞','zen':'..怎.','zang':'脏..葬','zeng':'增..赠','zong':'宗.总纵','zu':'租足祖.','zuo':'作昨左坐','zui':'..嘴最','zuan':'钻.纂钻','zun':'尊.撙.',
  // c
  'ca':'擦...','ce':'...测','ci':'刺词此次','cai':'猜才采菜','cao':'操曹草.','cou':'...凑','can':'参残惨灿','cen':'.岑..','cang':'仓藏..','ceng':'噌层.蹭','cong':'聪从..','cu':'粗..促','cuo':'搓..错','cui':'催..翠','cuan':'蹿..窜','cun':'村存.寸',
  // s
  'sa':'撒.洒萨','se':'...色','si':'思.死四','sai':'塞..赛','sao':'骚.扫臊','sou':'搜.叟.','san':'三.伞散','sen':'森...','sang':'桑.嗓丧','seng':'僧...','song':'松.耸送','su':'苏俗.素','suo':'缩.所.','sui':'虽随髓岁','suan':'酸..算','sun':'孙.损.',
  // y
  'yi':'一姨椅亿','ya':'鸭牙哑亚','ye':'椰爷也夜','yao':'腰摇咬要','you':'优油有又','yan':'烟盐眼燕','yin':'音银引印','yang':'央羊养样','ying':'英蝇影硬','yong':'拥.泳用','yu':'迂鱼雨玉','yue':'约..月','yuan':'冤圆远愿','yun':'晕云允运',
  // w
  'wu':'屋无五物','wa':'蛙娃瓦袜','wo':'窝.我握','wai':'歪..外','wei':'微围伟为','wan':'弯完碗万','wen':'温文稳问','wang':'汪王网忘','weng':'翁..瓮',
  // 零声母
  'a':'啊..啊','o':'哦哦.哦','e':'.鹅.饿','ai':'哀挨矮爱','ei':'诶...','ao':'.熬袄奥','ou':'欧.藕.','an':'安..岸','en':'恩..摁','ang':'.昂.盎','eng':'鞥...','er':'.儿耳二',
};

/* ============================================================
 * 二点五、流利说刷单词（词语 + 经典造句）
 * 每项：[词语, 拼音(带声调), emoji, 经典造句]
 * ============================================================ */
const WORD_DECK = [
  ['爸爸','bà ba','👨','爸爸开车带我去公园。'],
  ['妈妈','mā ma','👩','妈妈做的饭真好吃。'],
  ['哥哥','gē ge','👦','哥哥比我高一头。'],
  ['弟弟','dì di','👶','弟弟笑得很开心。'],
  ['姐姐','jiě jie','👧','姐姐教我写作业。'],
  ['妹妹','mèi mei','🎀','妹妹抱着布娃娃。'],
  ['爷爷','yé ye','👴','爷爷喜欢下象棋。'],
  ['奶奶','nǎi nai','👵','奶奶给我讲故事。'],
  ['老师','lǎo shī','🧑‍🏫','老师教我们学拼音。'],
  ['同学','tóng xué','🎒','同学们排队做早操。'],
  ['朋友','péng you','🤝','我们是好朋友。'],
  ['学校','xué xiào','🏫','我们的学校真漂亮。'],
  ['书包','shū bāo','🎒','书包里装满了书。'],
  ['铅笔','qiān bǐ','✏️','我用铅笔写字。'],
  ['橡皮','xiàng pí','🧽','橡皮擦掉了错字。'],
  ['学习','xué xí','📚','我们要认真学习。'],
  ['读书','dú shū','📖','我爱读书。'],
  ['写字','xiě zì','✍️','认真写字，一笔一画。'],
  ['画画','huà huà','🎨','我爱画画。'],
  ['唱歌','chàng gē','🎤','她唱歌真好听。'],
  ['跳舞','tiào wǔ','💃','我们在台上跳舞。'],
  ['跑步','pǎo bù','🏃','早晨去操场跑步。'],
  ['游泳','yóu yǒng','🏊','夏天我们去游泳。'],
  ['苹果','píng guǒ','🍎','苹果又大又红。'],
  ['香蕉','xiāng jiāo','🍌','香蕉弯弯像小船。'],
  ['西瓜','xī guā','🍉','夏天吃西瓜真凉快。'],
  ['草莓','cǎo méi','🍓','草莓红红的，真甜。'],
  ['水果','shuǐ guǒ','🍇','多吃水果身体好。'],
  ['米饭','mǐ fàn','🍚','米饭香喷喷的。'],
  ['面条','miàn tiáo','🍜','我喜欢吃面条。'],
  ['鸡蛋','jī dàn','🥚','早餐吃一个鸡蛋。'],
  ['牛奶','niú nǎi','🥛','每天喝一杯牛奶。'],
  ['面包','miàn bāo','🍞','面包软软的。'],
  ['蛋糕','dàn gāo','🎂','生日蛋糕真甜。'],
  ['喝水','hē shuǐ','🥤','天热了要多喝水。'],
  ['小猫','xiǎo māo','🐱','小猫喵喵叫。'],
  ['小狗','xiǎo gǒu','🐶','小狗摇着尾巴。'],
  ['小鸡','xiǎo jī','🐔','小鸡在院子里找米吃。'],
  ['小鸭','xiǎo yā','🦆','小鸭在水里游。'],
  ['小牛','xiǎo niú','🐮','小牛在吃草。'],
  ['小马','xiǎo mǎ','🐴','小马跑得真快。'],
  ['小羊','xiǎo yáng','🐑','小羊咩咩叫。'],
  ['小鸟','xiǎo niǎo','🐦','小鸟在树上唱歌。'],
  ['小鱼','xiǎo yú','🐟','小鱼在水里游来游去。'],
  ['蝴蝶','hú dié','🦋','蝴蝶在花丛中飞舞。'],
  ['蜜蜂','mì fēng','🐝','蜜蜂忙着采花蜜。'],
  ['青蛙','qīng wā','🐸','青蛙在荷叶上跳。'],
  ['熊猫','xióng māo','🐼','熊猫最爱吃竹子。'],
  ['大象','dà xiàng','🐘','大象的鼻子很长。'],
  ['老虎','lǎo hǔ','🐯','老虎是森林之王。'],
  ['兔子','tù zi','🐰','小兔子蹦蹦跳跳。'],
  ['猴子','hóu zi','🐵','猴子会爬树。'],
  ['飞机','fēi jī','✈️','飞机在蓝天上飞。'],
  ['火车','huǒ chē','🚂','火车呜呜地开。'],
  ['汽车','qì chē','🚗','汽车在马路上跑。'],
  ['轮船','lún chuán','🚢','轮船在大海上航行。'],
  ['太阳','tài yáng','☀️','太阳从东方升起来。'],
  ['月亮','yuè liang','🌙','月亮圆圆的，像玉盘。'],
  ['白云','bái yún','☁️','天上飘着朵朵白云。'],
  ['星星','xīng xing','⭐','夜空中星星眨眼睛。'],
  ['彩虹','cǎi hóng','🌈','雨过天晴现彩虹。'],
  ['春天','chūn tiān','🌷','春天来了，花儿开了。'],
  ['夏天','xià tiān','☀️','夏天可以吃冰淇淋。'],
  ['秋天','qiū tiān','🍂','秋天是丰收的季节。'],
  ['冬天','dōng tiān','⛄','冬天会下雪。'],
  ['下雨','xià yǔ','🌧️','下雨了，我们撑起小伞。'],
  ['花朵','huā duǒ','🌸','花园里开满花朵。'],
  ['大树','dà shù','🌳','大树像一把绿伞。'],
  ['小草','xiǎo cǎo','🌱','春天小草发芽了。'],
  ['高山','gāo shān','⛰️','高山直插云霄。'],
  ['大海','dà hǎi','🌊','大海蓝蓝的，一望无边。'],
  ['公园','gōng yuán','🏞️','周末去公园玩。'],
  ['马路','mǎ lù','🛣️','过马路要走斑马线。'],
  ['回家','huí jiā','🏠','放学后我们回家。'],
  ['衣服','yī fu','👕','妈妈给我买了新衣服。'],
  ['鞋子','xié zi','👟','我的鞋子真漂亮。'],
  ['帽子','mào zi','🧢','我戴上一顶新帽子。'],
  ['雨伞','yǔ sǎn','☂️','下雨天别忘了带雨伞。'],
  ['快乐','kuài lè','😄','祝你天天快乐。'],
  ['高兴','gāo xìng','😊','见到你真高兴。'],
  ['帮助','bāng zhù','🤲','同学之间要互相帮助。'],
  ['谢谢','xiè xie','🙏','别人帮助你，要说谢谢。'],
  ['你好','nǐ hǎo','👋','见面说声你好。'],
  ['再见','zài jiàn','👋','放学时和老师说再见。'],
  ['早安','zǎo ān','🌅','早安，新的一天开始了。'],
  ['晚安','wǎn ān','🌙','睡觉前说晚安。'],
  ['数学','shù xué','🔢','数学真有趣。'],
  ['语文','yǔ wén','📕','语文课上学拼音。'],
  ['音乐','yīn yuè','🎵','音乐让我心情好。'],
  ['体育','tǐ yù','⚽','体育课我们做游戏。'],
  ['生日','shēng rì','🎂','今天是我的生日。'],
  ['新年','xīn nián','🧧','新年到，放鞭炮。'],
  ['春节','chūn jié','🏮','春节全家团圆。'],
  ['中秋','zhōng qiū','🥮','中秋节吃月饼。'],
  ['灯笼','dēng long','🏮','大红灯笼高高挂。'],
  ['烟花','yān huā','🎆','烟花在夜空绽放。'],
  ['医院','yī yuàn','🏥','生病了要去医院。'],
  ['银行','yín háng','🏦','银行里存着钱。'],
  ['商店','shāng diàn','🏪','商店里商品真多。'],
];

/* 小学课文 & 古诗经典句（短语 + 拼音 + emoji + 课文原句） */
const TEXTBOOK_DECK = [
  ['秋天','qiū tiān','🍂','天气凉了，树叶黄了，一片片叶子从树上落下来。'],
  ['天气凉了','tiān qì liáng le','🍃','天气凉了，树叶黄了。'],
  ['草芽','cǎo yá','🌱','草芽尖尖，他对小鸟说：「我是春天。」'],
  ['荷叶','hé yè','🪷','荷叶圆圆，他对青蛙说：「我是夏天。」'],
  ['谷穗','gǔ suì','🌾','谷穗弯弯，他鞠着躬说：「我是秋天。」'],
  ['雪人','xuě rén','⛄','雪人大肚子一挺，他顽皮地说：「我就是冬天。」'],
  ['小画家','xiǎo huà jiā','🎨','雪地里来了一群小画家。'],
  ['小鸡画竹叶','xiǎo jī huà zhú yè','🐔','小鸡画竹叶，小狗画梅花。'],
  ['小狗画梅花','xiǎo gǒu huà méi huā','🐶','小鸡画竹叶，小狗画梅花。'],
  ['小小的船','xiǎo xiǎo de chuán','🚢','弯弯的月儿小小的船，小小的船儿两头尖。'],
  ['弯弯的月儿','wān wān de yuè er','🌙','弯弯的月儿小小的船。'],
  ['咏鹅','yǒng é','🦢','鹅鹅鹅，曲项向天歌。'],
  ['白毛浮绿水','bái máo fú lǜ shuǐ','🦢','白毛浮绿水，红掌拨清波。'],
  ['静夜思','jìng yè sī','🌙','床前明月光，疑是地上霜。'],
  ['床前明月光','chuáng qián míng yuè guāng','🌙','床前明月光，疑是地上霜。'],
  ['春晓','chūn xiǎo','🌸','春眠不觉晓，处处闻啼鸟。'],
  ['春眠不觉晓','chūn mián bù jué xiǎo','🐦','春眠不觉晓，处处闻啼鸟。'],
  ['悯农','mǐn nóng','🌾','锄禾日当午，汗滴禾下土。'],
  ['锄禾','chú hé','🌾','锄禾日当午，汗滴禾下土。'],
  ['江南','jiāng nán','🪷','江南可采莲，莲叶何田田。'],
  ['采莲','cǎi lián','🪷','江南可采莲，莲叶何田田。'],
  ['画','huà','🖼️','远看山有色，近听水无声。'],
  ['远看山有色','yuǎn kàn shān yǒu sè','⛰️','远看山有色，近听水无声。'],
  ['上学歌','shàng xué gē','🏫','太阳当空照，花儿对我笑。'],
  ['太阳当空照','tài yáng dāng kōng zhào','☀️','太阳当空照，花儿对我笑。'],
  ['姓氏歌','xìng shì gē','📖','你姓什么？我姓李。'],
  ['你姓什么','nǐ xìng shén me','🙋','你姓什么？我姓李。'],
  ['古对今','gǔ duì jīn','📜','古对今，圆对方。'],
  ['对韵','duì yùn','📜','古对今，圆对方，严寒对酷暑。'],
  ['春夏秋冬','chūn xià qiū dōng','🌸','春风吹，夏雨落，秋霜降，冬雪飘。'],
  ['春风吹','chūn fēng chuī','🌬️','春风吹，夏雨落。'],
  ['小青蛙','xiǎo qīng wā','🐸','河水清清天气晴，小小青蛙大眼睛。'],
  ['河水清清','hé shuǐ qīng qīng','🌊','河水清清天气晴。'],
  ['影子','yǐng zi','🧍','影子在前，影子在后，影子常常跟着我。'],
  ['前后左右','qián hòu zuǒ yòu','🧭','影子在前，影子在后。'],
  ['升国旗','shēng guó qí','🇨🇳','五星红旗，我们的国旗。'],
  ['五星红旗','wǔ xīng hóng qí','🇨🇳','五星红旗，我们的国旗。'],
  ['日月明','rì yuè míng','☀️','日月明，田力男。'],
  ['大小多少','dà xiǎo duō shǎo','⚖️','一个大，一个小，一头黄牛一只猫。'],
  ['比尾巴','bǐ wěi ba','🐒','谁的尾巴长？谁的尾巴短？'],
  ['过桥','guò qiáo','🌉','小竹桥，摇摇摇，有只小熊来过桥。'],
  ['小熊','xiǎo xióng','🧸','有只小熊来过桥。'],
];

function spellSyllable(rowK, final) {
  if (rowK === '∅') return final;
  if (rowK === 'y') return Y_SPELL[final] || ('y' + final);
  if (rowK === 'w') return W_SPELL[final] || ('w' + final);
  const f = (rowK === 'j' || rowK === 'q' || rowK === 'x') ? final.replace('ü', 'u') : final;
  return rowK + f;
}

/* 给无调音节标上声调（1-4），例如 markTone('ba',1)='bā' */
function markTone(syl, tone) {
  if (!tone || tone < 1 || tone > 4) return String(syl);
  const map = {
    a: ['ā','á','ǎ','à'], o: ['ō','ó','ǒ','ò'], e: ['ē','é','ě','è'],
    i: ['ī','í','ǐ','ì'], u: ['ū','ú','ǔ','ù'], 'ü': ['ǖ','ǘ','ǚ','ǜ']
  };
  const s = String(syl);
  let idx = -1;
  if (s.indexOf('a') !== -1) idx = s.indexOf('a');
  else if (s.indexOf('o') !== -1) idx = s.indexOf('o');
  else if (s.indexOf('e') !== -1) idx = s.indexOf('e');
  else if (s.indexOf('iu') !== -1) idx = s.indexOf('u');   // iu 标在 u 上
  else if (s.indexOf('ui') !== -1) idx = s.indexOf('i');   // ui 标在 i 上
  else {
    const vs = ['i', 'u', 'ü'];
    for (const v of vs) { if (s.indexOf(v) !== -1) { idx = s.indexOf(v); break; } }
  }
  if (idx === -1) return s;
  const m = (map[s[idx]] || [])[tone - 1];
  if (!m) return s;
  return s.slice(0, idx) + m + s.slice(idx + 1);
}

/* 取某音节指定声调的同音汉字，'.' 表示该声调无常用字，回退到 SYL_CHAR */
function toneCharOf(syl, tone) {
  const s = TONE_CHAR[syl];
  if (s && tone >= 1 && tone <= 4) {
    const c = s.charAt(tone - 1);
    if (c && c !== '.') return c;
  }
  return SYL_CHAR[syl] || syl;
}

/* ============================================================
 * 三、判定容错字典
 * ============================================================ */
const HOMO = {
  b: '玻波播博伯脖剥卜泊渤驳拨钵膊勃帛舶簸跛',
  p: '坡泼颇婆破迫魄粕珀朴',
  m: '摸摩磨魔膜末沫陌默莫模漠',
  f: '佛拂弗沸费',
  d: '得德的地弟',
  t: '特忒',
  n: '讷呢',
  l: '勒乐了',
  g: '哥歌格革隔个各鸽割搁',
  k: '科棵颗苛课克刻客壳',
  h: '喝呵荷河合盒禾和何贺',
  j: '基机鸡积几及级极集急即记纪技计寄季',
  q: '欺七期妻气汽其起器奇齐棋',
  x: '希西息习喜细系戏洗',
  zh: '知织支枝之只指直值质纸志治智制',
  ch: '吃尺迟池持翅赤斥齿',
  sh: '诗师湿十石时识实是事世市室视史使始式',
  r: '日',
  z: '资姿字自子紫滋兹渍',
  c: '雌词瓷磁此次辞刺茨',
  s: '思丝私四司死寺似斯肆',
  y: '衣一依医以已义意易亿椅',
  w: '乌屋无五务物误武舞雾',
  a: '啊阿',
  o: '喔哦噢',
  e: '鹅额俄饿恶鄂愕厄',
  i: '衣一依医以已义意易亿椅',
  u: '乌屋无五务物误武舞雾',
  'ü': '迂鱼雨与语玉遇欲于余娱育域',
  ai: '哀挨爱矮碍癌埃蔼',
  ei: '诶欸',
  ui: '威围微为位味未委伟尾维危',
  ao: '熬袄凹奥澳傲敖',
  ou: '欧鸥偶呕藕沤',
  iu: '优忧邮由有又右油游尤友',
  ie: '椰耶也叶业夜页',
  'üe': '约月越乐阅跃悦岳',
  er: '儿耳二而尔',
  an: '安鞍按案岸暗',
  en: '恩摁',
  in: '因音阴引银印饮隐',
  un: '温文闻问稳吻瘟',
  'ün': '晕云运允匀韵孕',
  ang: '昂肮',
  eng: '鞥嗯',
  ing: '英鹰应影硬营映',
  ong: '翁嗡瓮',
  zhi: '知织支枝之只指直值质纸志治智制',
  chi: '吃尺迟池持翅赤斥齿',
  shi: '诗师湿十石时识实是事世市室视史使始式',
  ri: '日',
  zi: '资姿字自子紫滋兹渍',
  ci: '雌词瓷磁此次辞刺茨',
  si: '思丝私四司死寺似斯肆',
  yi: '衣一依医以已义意易亿椅',
  wu: '乌屋无五务物误武舞雾',
  yu: '迂鱼雨与语玉遇欲于余娱育域',
  ye: '耶椰也叶业夜页',
  yue: '约月越乐阅跃悦岳',
  yuan: '圆远元原员院愿源冤',
  yin: '因音阴引银印饮隐',
  yun: '云运晕允匀韵孕',
  ying: '英鹰应影硬营映',
};
const LATIN = {
  b: ['b','bo'], p: ['p','po'], m: ['m','mo'], f: ['f','fo'],
  d: ['d','de'], t: ['t','te'], n: ['n','ne'], l: ['l','le'],
  g: ['g','ge'], k: ['k','ke'], h: ['h','he'],
  j: ['j','ji'], q: ['q','qi'], x: ['x','xi'],
  zh: ['zh','zhi'], ch: ['ch','chi'], sh: ['sh','shi'], r: ['r','ri'],
  z: ['z','zi'], c: ['c','ci'], s: ['s','si'], y: ['y','yi'], w: ['w','wu'],
  a: ['a'], o: ['o'], e: ['e'],
  i: ['i','yi'], u: ['u','wu'], 'ü': ['v','yu'],
  ai: ['ai'], ei: ['ei'], ui: ['ui','wei'], ao: ['ao'], ou: ['ou'], iu: ['iu','you'],
  ie: ['ie','ye'], 'üe': ['ve','ue','yue'], er: ['er'],
  an: ['an'], en: ['en'], in: ['in','yin'], un: ['un','wen'], 'ün': ['vn','un','yun'],
  ang: ['ang'], eng: ['eng'], ing: ['ing','ying'], ong: ['ong','weng'],
  zhi: ['zhi'], chi: ['chi'], shi: ['shi'], ri: ['ri'],
  zi: ['zi'], ci: ['ci'], si: ['si'],
  yi: ['yi'], wu: ['wu'], yu: ['yu','yv'],
  ye: ['ye'], yue: ['yue'], yuan: ['yuan'], yin: ['yin'], yun: ['yun'], ying: ['ying'],
};

/* ============================================================
 * 四、全局状态
 * ============================================================ */
const STORE_KEY = 'pinyinWarrior.v2';
const STICKERS = ['🦄','🌈','🎀','🧁','🍓','🌸','🦋','💖','⭐','🏰','🐰','👑','🍭','🧸','✨','🌷','🍬','💜'];
let state = loadState();
let currentLevel = -1;
let currentItem = 0;
let streak = 0;
let heard = false;
let scope = { lo: 0, hi: 0, start: 0 }; // 当前闯关范围
let tableTone = 0;            // 总览表当前声调（0=原音）
let wordDeck = [];            // 刷单词卡组
let wordIndex = 0;
let wordScore = 0;
let wordStreak = 0;
let wordHeard = false;
let wordMode = 'word';        // word | text | random
let wordInfinite = false;
let currentEntry = null;      // 当前展示的词语卡

function defaultState() {
  return {
    name: '', unlocked: 0, done: {}, stars: {}, partial: null,
    stickers: [], settings: { grade: 'g1', type: 'all', difficulty: 'easy' }
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = Object.assign(defaultState(), JSON.parse(raw));
    s.settings = Object.assign(defaultState().settings, s.settings);
    return s;
  } catch (e) { return defaultState(); }
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ============================================================
 * 五、工具
 * ============================================================ */
const $ = (id) => document.getElementById(id);
const totalStars = () => Object.values(state.stars).reduce((a, b) => a + (b || 0), 0);
const doneCount = () => Object.keys(state.done).length;
const allDone = () => LEVELS.every((_, i) => state.done[i]);
const gradeOf = (i) => GRADES.find(g => i >= g.range[0] && i < g.range[1]);

function toast(msg, ms) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), ms || 2200);
}
function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}
function stripTones(s) {
  return s
    .replace(/[āáǎà]/g, 'a').replace(/[ēéěè]/g, 'e').replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o').replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜü]/g, 'v')
    .replace(/ń/g, 'n').replace(/ň/g, 'n').replace(/ǹ/g, 'n')
    .replace(/ḿ/g, 'm');
}
function burstConfetti() {
  const emojis = ['🎉','⭐','🌟','✨','🎊','💛','💖','🧁','🎀','🌸'];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('div');
    s.className = 'confetti';
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.animationDuration = (1.4 + Math.random() * 1.6) + 's';
    s.style.fontSize = (18 + Math.random() * 22) + 'px';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3200);
  }
}
const PRAISES = ['太棒了！','真厉害！','读得真标准！','你是小天才！','好棒好棒！','真了不起！','棒极了！','继续加油哦！'];
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* 根据运行环境更新语音提示（iOS 不支持网页语音识别 / 手机需 https） */
function updateSupportTips() {
  $('support-warning').hidden = !!getSR();
  const tip = $('support-tip');
  if (!getSR()) {
    tip.hidden = true;
    return;
  }
  tip.hidden = false;
  const insecure = location.protocol === 'http:' && ['localhost', '127.0.0.1'].indexOf(location.hostname) === -1;
  if (insecure) {
    tip.innerHTML = '📱 手机访问需使用 <b>HTTPS</b>（或用 localhost）。当前是 http 明文，浏览器会禁用麦克风，请改用 https 部署。';
  } else {
    tip.innerHTML = '🔊 请使用 <b>Chrome / Edge</b>，并<b>允许麦克风权限</b>。iOS 网页暂不支持语音识别，可用安卓或电脑体验。';
  }
}

/* ============================================================
 * 六、语音合成（优先女声）
 * ============================================================ */
let voices = [];
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices();
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
function pickVoice() {
  const zh = voices.filter(v => /^zh/i.test(v.lang) || /chinese/i.test(v.name));
  if (!zh.length) return null;
  // 优先挑选女声（常见中文女声引擎名）
  const female = /huihui|yaoyao|xiaoxiao|meijia|tingting|sinji|shanshan|lili|female|girl|女/i;
  return zh.find(v => female.test(v.name)) ||
         zh.find(v => /zh[-_]CN/i.test(v.lang)) ||
         zh[0] || null;
}
let speakQueue = [];
let isSpeaking = false;
function speak(text) {
  if (!text) return;
  speakQueue.push(text);
  drainSpeak();
}
function drainSpeak() {
  if (isSpeaking || speakQueue.length === 0) return;
  isSpeaking = true;
  const text = speakQueue.shift();
  let done = false;
  const finish = () => { if (done) return; done = true; isSpeaking = false; drainSpeak(); };

  // 原生 App（安卓/iOS）：用 TTS 插件（安卓 WebView 不支持 speechSynthesis）
  if (window.__TTS_NATIVE__ && window.__ttsSpeak) {
    let safety = setTimeout(() => finish(), Math.max(3000, text.length * 400 + 2500));
    try {
      window.__ttsSpeak(text, () => { clearTimeout(safety); finish(); });
    } catch (e) { clearTimeout(safety); finish(); }
    return;
  }

  // 网页：用 Web Speech API
  if (!('speechSynthesis' in window)) { finish(); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = 0.7;
  u.pitch = 1.15;   // 稍高音调，更贴近女生/儿童嗓音
  u.volume = 1;
  u.onend = finish;
  u.onerror = finish;
  const watchdog = setTimeout(() => { speechSynthesis.resume(); setTimeout(finish, 600); }, 6000);
  u.addEventListener('end', () => clearTimeout(watchdog));
  u.addEventListener('error', () => clearTimeout(watchdog));
  speechSynthesis.speak(u);
}
function stopSpeak() {
  if (window.__TTS_NATIVE__ && window.__ttsStop) { try { window.__ttsStop(); } catch (e) {} }
  else if ('speechSynthesis' in window) speechSynthesis.cancel();
  speakQueue = [];
  isSpeaking = false;
}
function currentItemObj() { return LEVELS[currentLevel].items[currentItem]; }
function playRead() { const it = currentItemObj(); stopSpeak(); speak(it.read); }
function playWord(w) { stopSpeak(); speak(w[0]); }
function playDemo() {
  heard = true;
  updateMicHint();
  const it = currentItemObj();
  stopSpeak();
  speak(it.read);
  it.words.forEach(w => speak(w[0]));
}

/* ============================================================
 * 七、音效（Web Audio）
 * ============================================================ */
let audioCtx = null;
function ensureAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}
function tone(freq, when, dur, type, vol) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.2, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(when); o.stop(when + dur);
}
function playSuccessSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.12, 0.22, 'sine', 0.22));
}
function playFailSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(220, t, 0.22, 'sine', 0.12);
  tone(174.6, t + 0.18, 0.3, 'sine', 0.12);
}

/* ============================================================
 * 八、语音识别与判定
 * ============================================================ */
function getSR() { return window.SpeechRecognition || window.webkitSpeechRecognition; }
let recognition = null;
let recognizing = false;

function initRecognition() {
  const SR = getSR();
  if (!SR) return null;
  const r = new SR();
  r.lang = 'zh-CN';
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 5;
  r.onresult = (e) => {
    const texts = [];
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      for (let j = 0; j < res.length; j++) texts.push(res[j].transcript);
    }
    handleResult(texts);
  };
  r.onerror = (e) => {
    recognizing = false;
    setRecording(false);
    let msg = '识别出错了，请再试一次';
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') msg = '麦克风权限被拒绝，请在地址栏允许麦克风后重试';
    else if (e.error === 'no-speech') msg = '没有听清哦，请大声一点再试一次';
    else if (e.error === 'audio-capture') msg = '没有检测到麦克风设备';
    else if (e.error === 'network') msg = '网络错误，语音识别不可用';
    else if (e.error === 'not-available') msg = '设备缺少语音识别服务（请确认已安装 Google 或系统语音服务）';
    else if (e.error === 'aborted') return;
    showFeedback('fail', '🎤 ' + msg);
  };
  r.onend = () => { recognizing = false; setRecording(false); };
  return r;
}

function judge(item, raw) {
  let t = String(raw || '').toLowerCase();
  t = t.replace(/[\s\u3000，。！？、,.!?~～\-—_"'“”‘’()（）\[\]【】《》<>:：;；]/g, '');
  if (!t) return false;
  const tLatin = stripTones(t);
  const chars = new Set();
  (HOMO[item.py] || '').split('').forEach(c => chars.add(c));
  if (item.read) item.read.split('').forEach(c => chars.add(c));
  (item.words || []).forEach(([h]) => { h.split('').forEach(c => chars.add(c)); chars.add(h); });
  for (const c of chars) { if (c && t.indexOf(c) !== -1) return true; }
  if (/^[a-zv]+$/.test(tLatin)) {
    const targets = (LATIN[item.py] || [item.py]).map(x => x.toLowerCase());
    for (const tg of targets) { if (tLatin === tg) return true; }
  }
  return false;
}
function handleResult(texts) {
  const it = currentItemObj();
  const ok = texts.some(t => judge(it, t));
  const shown = (texts[0] || '').trim();
  if (ok) onCorrect(shown); else onWrong(shown);
}
async function onMicClick() {
  if (!heard) { toast('👂 先听一听示范，再跟读哦！'); playDemo(); return; }
  if (!getSR()) { showFeedback('fail', '⚠️ 当前浏览器不支持语音识别，请使用 Chrome / Edge'); return; }
  // 非安全上下文（http 局域网 IP）下浏览器禁用麦克风；不再用 getUserMedia 抢占麦克风（会与识别器抢音频导致“收不到声音”）
  if (!window.__SPEECH_NATIVE__ && !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    showFeedback('fail', '🔒 当前非安全环境（需 HTTPS 或 localhost），浏览器禁用了麦克风');
    return;
  }
  startRecognition();
}
function startRecognition() {
  stopSpeak();
  if (!recognition) recognition = initRecognition();
  if (!recognition) return;
  try {
    recognizing = true;
    setRecording(true);
    $('mic-hint').textContent = '👂 正在聆听，请大声读…';
    recognition.start();
  } catch (e) {
    recognizing = false; setRecording(false);
    showFeedback('fail', '🎤 启动识别失败，请重试');
  }
}
function setRecording(on) {
  document.body.classList.toggle('recording', on);
  $('mic-btn').disabled = on;
}

/* ============================================================
 * 九、关卡流程
 * ============================================================ */
function onCorrect(shown) {
  streak++;
  updateStreak();
  playSuccessSound();
  speak(rnd(PRAISES));
  const label = shown ? ('你读的是「' + shown + '」') : '';
  showFeedback('success', '✅ 读对了！⭐ 获得一颗星 ' + label);
  burstConfetti();
  const completed = currentItem + 1;
  state.partial = { level: currentLevel, item: completed };
  saveState();
  setTimeout(() => {
    if (completed >= LEVELS[currentLevel].items.length) levelComplete();
    else { currentItem = completed; renderLevel(); autoDemo(); }
  }, 1500);
}
function onWrong(shown) {
  streak = 0;
  updateStreak();
  playFailSound();
  speak('再试一次哦');
  const label = shown ? ('听到：「' + shown + '」') : '';
  showFeedback('fail', '❌ 再试一次吧 ' + label);
}
function levelComplete() {
  state.done[currentLevel] = true;
  state.stars[currentLevel] = LEVELS[currentLevel].items.length;
  state.unlocked = Math.max(state.unlocked, currentLevel + 1);
  state.partial = null;
  // 每过一关得一张贴纸
  if (!state.stickers.length || state.stickers.length < doneCount()) {
    const have = new Set(state.stickers);
    const pool = STICKERS.filter(s => !have.has(s));
    const pick = pool.length ? rnd(pool) : rnd(STICKERS);
    if (!have.has(pick)) state.stickers.push(pick);
  }
  saveState();
  playSuccessSound();
  speak('太棒了，过关啦！你得到了一张贴纸！');
  showFeedback('success', '🎉 过关啦！得 ' + LEVELS[currentLevel].items.length + ' 颗星 + 贴纸一张！');
  burstConfetti();
  setTimeout(() => { renderHome(); renderMap(); }, 2200);
}
function enterLevel(i) {
  if (i < scope.lo || i >= scope.hi) return;
  if (!isUnlocked(i)) { toast('🔒 先完成前面的关卡哦'); return; }
  currentLevel = i;
  const items = LEVELS[i].items;
  currentItem = (state.partial && state.partial.level === i)
    ? Math.min(state.partial.item, items.length - 1) : 0;
  streak = 0;
  renderLevel();
  switchScreen('level-screen');
  autoDemo();
}
function isUnlocked(i) {
  if (state.settings.difficulty === 'hard') return true;
  const g = gradeOf(i);
  if (i === g.range[0]) return true;
  return !!state.done[i - 1];
}

/* ============================================================
 * 十、范围（年级 ∩ 类型）与难度起点
 * ============================================================ */
function computeScope() {
  const g = GRADES.find(x => x.id === state.settings.grade);
  const t = TYPES.find(x => x.id === state.settings.type);
  const lo = Math.max(g.range[0], t.range[0]);
  const hi = Math.min(g.range[1], t.range[1]);
  const empty = lo >= hi;
  let start = empty ? 0 : lo;
  if (!empty && state.settings.difficulty === 'hard') start = hi - 1;
  scope = { lo, hi, start, empty };
  return scope;
}

/* ============================================================
 * 十一、界面渲染
 * ============================================================ */
function renderHome() {
  switchScreen('home-screen');
  $('total-stars').textContent = totalStars();
  $('done-count').textContent = doneCount();
  $('total-count').textContent = LEVELS.length;
  $('sticker-count').textContent = state.stickers.length;
  updateSupportTips();

  // 贴纸
  const sr = $('sticker-row');
  sr.innerHTML = '';
  if (state.stickers.length) {
    state.stickers.forEach(s => { const sp = document.createElement('span'); sp.textContent = s; sr.appendChild(sp); });
  } else {
    sr.innerHTML = '<span style="font-size:13px;color:#c4a9c8;font-weight:700;">还没有贴纸，快去闯关吧～</span>';
  }

  // 年级 chips
  const gc = $('grade-chips');
  gc.innerHTML = '';
  GRADES.forEach(g => {
    const b = document.createElement('button');
    b.className = 'chip grade' + (state.settings.grade === g.id ? ' on' : '');
    b.textContent = g.emoji + ' ' + g.name + '（' + g.desc + '）';
    b.onclick = () => { state.settings.grade = g.id; saveState(); renderHome(); };
    gc.appendChild(b);
  });
  // 类型 chips
  const tc = $('type-chips');
  tc.innerHTML = '';
  TYPES.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.settings.type === t.id ? ' on' : '');
    b.textContent = t.name;
    b.onclick = () => { state.settings.type = t.id; saveState(); renderHome(); };
    tc.appendChild(b);
  });
  // 难度 chips
  const dc = $('diff-chips');
  dc.innerHTML = '';
  DIFFS.forEach(d => {
    const b = document.createElement('button');
    b.className = 'chip diff' + (state.settings.difficulty === d.id ? ' on' : '');
    b.textContent = d.name;
    b.onclick = () => { state.settings.difficulty = d.id; saveState(); renderHome(); };
    dc.appendChild(b);
  });
  $('diff-hint').textContent = '💡 ' + DIFFS.find(d => d.id === state.settings.difficulty).desc;
}

function renderMap() {
  computeScope();
  switchScreen('map-screen');
  const g = GRADES.find(x => x.id === state.settings.grade);
  const t = TYPES.find(x => x.id === state.settings.type);
  $('map-title').textContent = '闯关地图';
  $('map-sub').textContent = g.name + ' · ' + t.name;
  $('map-stars').textContent = totalStars();

  const path = $('map-path');
  path.innerHTML = '';
  $('map-empty').hidden = !scope.empty;

  if (scope.empty) return;

  let firstInScope = null;
  for (let i = scope.lo; i < scope.hi; i++) {
    const lv = LEVELS[i];
    if (i > scope.lo) {
      const link = document.createElement('div');
      link.className = 'link';
      path.appendChild(link);
    }
    const done = !!state.done[i];
    const unlocked = isUnlocked(i);
    let cls = 'node ';
    if (done) cls += 'done';
    else if (unlocked) { cls += 'current clickable'; if (i === scope.start) cls += ' start'; }
    else cls += 'locked';
    let circle = done ? '⭐' : (unlocked ? String(i + 1) : '🔒');
    const node = document.createElement('div');
    node.className = cls;
    node.innerHTML =
      '<div class="node-circle">' + circle + '</div>' +
      '<div class="node-label">第' + (i + 1) + '关</div>' +
      '<div class="node-sub">' + lv.cat + '</div>';
    if (unlocked) node.addEventListener('click', () => enterLevel(i));
    path.appendChild(node);
    if (i === scope.start) firstInScope = node;
  }

  // 自动滚动到起点并高亮
  $('map-start-btn').textContent = '🚀 从第 ' + (scope.start + 1) + ' 关开始';
  if (firstInScope) {
    setTimeout(() => {
      firstInScope.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 80);
  }
}

function renderLevel() {
  const lv = LEVELS[currentLevel];
  const items = lv.items;
  const it = items[currentItem];
  const hard = state.settings.difficulty === 'hard';

  $('level-cat').textContent = '第' + (currentLevel + 1) + '关 · ' + gradeOf(currentLevel).name + ' · ' + lv.cat;
  $('level-title').textContent = lv.name;
  $('level-stars').textContent = currentItem + ' / ' + items.length;
  $('progress-fill').style.width = (currentItem / items.length * 100) + '%';
  $('q-label').textContent = '第 ' + (currentItem + 1) + ' 个拼音 · 先听再读';

  const dots = $('progress-dots');
  dots.innerHTML = '';
  items.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'pdot ' + (i < currentItem ? 'done' : (i === currentItem ? 'current' : ''));
    dots.appendChild(d);
  });

  $('pinyin-big').textContent = it.py;
  const readEl = $('pinyin-read');
  if (hard) { readEl.textContent = '🔍 高手模式：自己先想一想怎么读'; }
  else { readEl.textContent = '读作：' + it.read; }
  $('pinyin-card').onclick = playRead;

  const wr = $('words-row');
  wr.innerHTML = '';
  it.words.forEach(w => {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.innerHTML =
      '<div class="word-emoji">' + w[2] + '</div>' +
      '<div class="word-hanzi">' + w[0] + '</div>' +
      '<div class="word-pinyin">' + w[1] + '</div>';
    card.addEventListener('click', () => playWord(w));
    wr.appendChild(card);
  });

  $('demo-btn').onclick = playDemo;
  $('mic-btn').onclick = onMicClick;
  $('mic-btn').disabled = false;
  heard = false;
  updateMicHint();
  updateStreak();
  $('feedback').className = 'feedback';
  $('feedback').textContent = '';
  setRecording(false);
}
function updateMicHint() {
  $('mic-hint').textContent = heard ? '点击麦克风，大声跟读' : '先听示范，再跟读哦';
}
function updateStreak() {
  const bar = $('streak-bar');
  if (streak >= 2) {
    bar.innerHTML = streak >= 3
      ? '<span class="trophy">🏆</span> 连续答对 ' + streak + ' 次！获得小奖杯！'
      : '🔥 连续答对 ' + streak + ' 次！';
  } else { bar.innerHTML = ''; }
}
function showFeedback(kind, text) {
  const f = $('feedback');
  f.className = 'feedback show ' + kind;
  f.textContent = text;
}

/* ============================================================
 * 十二、音节总览表
 * ============================================================ */
function renderTable() {
  switchScreen('table-screen');

  // 图例
  const lg = $('table-legend');
  lg.innerHTML = '';
  COLS.forEach(c => {
    const span = document.createElement('span');
    span.className = 'lg';
    span.innerHTML = '<span class="dot" style="background:' + GROUP_COLOR[c.group] + '"></span>' + c.group + '呼';
    lg.appendChild(span);
  });

  // 声调切换（点击后可听/看不同声调）
  const tones = [
    { id: 0, name: '🔊 原音' },
    { id: 1, name: '一声 ā' },
    { id: 2, name: '二声 á' },
    { id: 3, name: '三声 ǎ' },
    { id: 4, name: '四声 à' }
  ];
  const tr = $('tone-row');
  tr.innerHTML = '';
  tones.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (tableTone === t.id ? ' on' : '');
    b.textContent = t.name;
    b.onclick = () => { tableTone = t.id; renderTable(); };
    tr.appendChild(b);
  });

  // 构建表格
  const allFinals = COLS.reduce((a, c) => a.concat(c.items), []);
  const colClass = {};
  COLS.forEach(c => c.items.forEach(f => { colClass[f] = GROUP_CLASS[c.group]; }));

  const scroll = $('table-scroll');
  scroll.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'syl';

  // 表头行
  const thead = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'corner';
  corner.textContent = '🌸';
  corner.title = '声母 ↓ / 韵母 →';
  thead.appendChild(corner);
  allFinals.forEach(f => {
    const th = document.createElement('th');
    th.className = 'col-head ' + colClass[f];
    th.textContent = f;
    th.title = '韵母 ' + f + '，读作 ' + (FINAL_READS[f] || f);
    th.addEventListener('click', () => { stopSpeak(); speak(FINAL_READS[f] || f); });
    thead.appendChild(th);
  });
  table.appendChild(thead);

  // 数据行
  ROWS.forEach(row => {
    const tr = document.createElement('tr');
    const rh = document.createElement('th');
    rh.className = 'row-head' + (row.k === '∅' ? ' zero' : '');
    rh.textContent = row.k;
    rh.title = (row.k === '∅' ? '零声母（没有声母的音节）' : '声母 ' + row.k);
    rh.addEventListener('click', () => { stopSpeak(); speak(INITIAL_READS[row.k]); });
    tr.appendChild(rh);

    allFinals.forEach(f => {
      const td = document.createElement('td');
      if (row.finals.indexOf(f) !== -1) {
        const syl = spellSyllable(row.k, f);
        const display = tableTone ? markTone(syl, tableTone) : syl;
        const ch = tableTone ? toneCharOf(syl, tableTone) : (SYL_CHAR[syl] || syl);
        td.className = 'cell';
        td.textContent = display;
        td.title = '拼音 ' + syl + ' · ' + display + ' · 例字「' + ch + '」';
        td.addEventListener('click', () => { stopSpeak(); speak(ch); });
      } else {
        td.className = 'void';
        td.textContent = '';
      }
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  scroll.appendChild(table);
}

/* ============================================================
 * 十二点五、流利说 · 刷单词模式
 * ============================================================ */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function cleanText(raw) {
  return String(raw || '').toLowerCase().replace(/[\s\u3000，。！？、,.!?~～\-—_"'“”‘’()（）\[\]【】《》<>:：;；]/g, '');
}
function judgeWord(entry, text) {
  const t = cleanText(text);
  if (!t) return false;
  const w = entry[0];
  if (t.indexOf(w) !== -1) return true;
  const chars = w.split('').filter(c => c.trim());
  if (chars.length >= 2 && chars.every(c => t.indexOf(c) !== -1)) return true;
  return false;
}
let wordRecognition = null;
function initWordRecognition() {
  const SR = getSR();
  if (!SR) return null;
  const r = new SR();
  r.lang = 'zh-CN';
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 5;
  r.onresult = (e) => {
    const texts = [];
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      for (let j = 0; j < res.length; j++) texts.push(res[j].transcript);
    }
    handleWordResult(texts);
  };
  r.onerror = (e) => {
    setWordRecording(false);
    let msg = '识别出错了，请再试一次';
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') msg = '麦克风权限被拒绝，请在地址栏允许麦克风';
    else if (e.error === 'no-speech') msg = '没有听清哦，请大声一点再试一次';
    else if (e.error === 'audio-capture') msg = '没有检测到麦克风设备';
    else if (e.error === 'network') msg = '网络错误，语音识别不可用';
    else if (e.error === 'not-available') msg = '设备缺少语音识别服务（请确认已安装 Google 或系统语音服务）';
    else if (e.error === 'aborted') return;
    showWordFeedback('fail', '🎤 ' + msg);
  };
  r.onend = () => setWordRecording(false);
  return r;
}
const WORD_CATS = [
  { id: 'random', ico: '🎲', tt: '随机词库', ds: '词语+课文随机 · 无限挑战', inf: true },
  { id: 'text', ico: '📚', tt: '课文朗读', ds: '小学课文 & 古诗 · 经典句子', inf: false },
  { id: 'word', ico: '🍎', tt: '词语闯关', ds: '常用词语 · 经典造句', inf: false },
];
function showWordMenu() {
  stopSpeak();
  switchScreen('word-screen');
  $('word-menu').hidden = false;
  $('word-play').hidden = true;
  const cats = $('word-cats');
  cats.innerHTML = '';
  WORD_CATS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'word-cat';
    b.innerHTML = '<div class="ico">' + c.ico + '</div><div class="tt">' + c.tt + '</div><div class="ds">' + c.ds + '</div>';
    b.onclick = () => chooseWordMode(c.id);
    cats.appendChild(b);
  });
}
function chooseWordMode(mode) {
  wordMode = mode;
  wordInfinite = (mode === 'random');
  wordScore = 0; wordStreak = 0; wordIndex = 0;
  wordDeck = wordInfinite
    ? WORD_DECK.concat(TEXTBOOK_DECK)
    : shuffle(mode === 'text' ? TEXTBOOK_DECK : WORD_DECK);
  $('word-menu').hidden = true;
  $('word-play').hidden = false;
  $('word-mode-label').textContent = '🗣️ ' + WORD_CATS.find(c => c.id === mode).tt;
  renderWord();
  wordDemo();
}
function renderWord() {
  currentEntry = wordInfinite
    ? wordDeck[Math.floor(Math.random() * wordDeck.length)]
    : wordDeck[wordIndex];
  const e = currentEntry;
  $('word-q-label').textContent = wordInfinite
    ? '🎲 随机词 · 已读对 ' + wordScore + ' 词 · 无限继续'
    : '第 ' + (wordIndex + 1) + ' / ' + wordDeck.length + ' 个';
  $('word-big-emoji').textContent = e[2];
  $('word-big').textContent = e[0];
  $('word-big-pinyin').textContent = e[1];
  $('word-sentence-text').textContent = e[3];
  $('word-score').textContent = wordScore;
  $('word-progress-wrap').hidden = wordInfinite;
  $('word-progress-dots').hidden = wordInfinite;
  if (!wordInfinite) {
    $('word-progress-fill').style.width = (wordIndex / wordDeck.length * 100) + '%';
    const dots = $('word-progress-dots');
    dots.innerHTML = '';
    wordDeck.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'pdot ' + (i < wordIndex ? 'done' : (i === wordIndex ? 'current' : ''));
      dots.appendChild(d);
    });
  }
  wordHeard = false;
  $('word-mic-hint').textContent = '先听示范，再跟读哦';
  $('word-feedback').className = 'feedback';
  $('word-feedback').textContent = '';
  updateWordStreak();
  setWordRecording(false);
}
function wordDemo() {
  wordHeard = true;
  $('word-mic-hint').textContent = '点击麦克风，大声读';
  const e = currentEntry;
  stopSpeak();
  speak(e[0]);
  speak(e[3]);
}
function updateWordStreak() {
  const bar = $('word-streak-bar');
  if (wordStreak >= 2) {
    bar.innerHTML = wordStreak >= 3
      ? '<span class="trophy">🏆</span> 连续答对 ' + wordStreak + ' 次！获得小奖杯！'
      : '🔥 连续答对 ' + wordStreak + ' 次！';
  } else { bar.innerHTML = ''; }
}
function setWordRecording(on) {
  document.body.classList.toggle('recording', on);
  $('word-mic-btn').disabled = on;
}
async function onWordMicClick() {
  if (!wordHeard) { toast('👂 先听一听示范，再跟读哦！'); wordDemo(); return; }
  if (!getSR()) { showWordFeedback('fail', '⚠️ 当前浏览器不支持语音识别，请使用 Chrome / Edge'); return; }
  if (!window.__SPEECH_NATIVE__ && !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    showWordFeedback('fail', '🔒 当前非安全环境（需 HTTPS 或 localhost），浏览器禁用了麦克风');
    return;
  }
  startWordRecognition();
}
function startWordRecognition() {
  stopSpeak();
  if (!wordRecognition) wordRecognition = initWordRecognition();
  if (!wordRecognition) return;
  try {
    setWordRecording(true);
    $('word-mic-hint').textContent = '👂 正在聆听，请大声读…';
    wordRecognition.start();
  } catch (e) {
    setWordRecording(false);
    showWordFeedback('fail', '🎤 启动识别失败，请重试');
  }
}
function handleWordResult(texts) {
  const entry = currentEntry;
  const ok = texts.some(t => judgeWord(entry, t));
  const shown = (texts[0] || '').trim();
  if (ok) wordCorrect(shown); else wordWrong(shown);
}
function wordCorrect(shown) {
  wordScore++; wordStreak++;
  updateWordStreak();
  playSuccessSound();
  speak(rnd(PRAISES));
  const label = shown ? ('你读的是「' + shown + '」') : '';
  showWordFeedback('success', '✅ 读对了！' + label);
  burstConfetti();
  setTimeout(() => {
    if (!wordInfinite && wordIndex + 1 >= wordDeck.length) wordRoundComplete();
    else { wordIndex++; renderWord(); wordDemo(); }
  }, 1500);
}
function wordWrong(shown) {
  wordStreak = 0;
  updateWordStreak();
  playFailSound();
  speak('再试一次哦');
  const label = shown ? ('听到：「' + shown + '」') : '';
  showWordFeedback('fail', '❌ 再试一次吧 ' + label);
}
function wordRoundComplete() {
  playSuccessSound();
  speak('太棒了，你读完了这一轮！');
  showWordFeedback('success', '🎉 本轮读完！累计读对 ' + wordScore + ' 词，再来一轮！');
  burstConfetti();
  setTimeout(() => { wordIndex = 0; wordDeck = shuffle(wordDeck); renderWord(); wordDemo(); }, 2400);
}
function showWordFeedback(kind, text) {
  const f = $('word-feedback');
  f.className = 'feedback show ' + kind;
  f.textContent = text;
}

/* ============================================================
 * 十三、证书
 * ============================================================ */
function showCert() {
  $('name-input').value = state.name || '';
  $('cert-stars').textContent = totalStars();
  $('cert-total').textContent = LEVELS.length;
  $('cert-date').textContent = '颁发日期：' + new Date().toLocaleDateString('zh-CN');
  updateCertText();
  const holder = $('cert-stickers');
  holder.innerHTML = '';
  (state.stickers.length ? state.stickers : ['🎀']).forEach(s => {
    const sp = document.createElement('span'); sp.textContent = s; holder.appendChild(sp);
  });
  switchScreen('cert-screen');
}
function updateCertText() {
  const name = state.name ? state.name : '小勇士';
  $('cert-text').textContent = '恭喜「' + name + '」完成全部 ' + LEVELS.length +
    ' 关拼音闯关，成为真正的拼音小勇士！';
}

/* ============================================================
 * 十四、事件绑定与初始化
 * ============================================================ */
function bindEvents() {
  $('go-level').addEventListener('click', () => { computeScope(); if (scope.empty) { toast('这个组合里没有关卡，换个年级或类型试试～'); return; } enterLevel(scope.start); });
  $('go-table').addEventListener('click', renderTable);
  $('go-cert').addEventListener('click', () => { if (allDone()) showCert(); else toast('🏆 还没全部通关哦，继续加油！'); });
  $('go-words').addEventListener('click', showWordMenu);
  $('word-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('word-play-back-btn').addEventListener('click', showWordMenu);
  $('word-demo-btn').addEventListener('click', wordDemo);
  $('word-mic-btn').addEventListener('click', onWordMicClick);
  $('back-btn').addEventListener('click', () => { stopSpeak(); renderMap(); });
  $('map-home-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('map-start-btn').addEventListener('click', () => { computeScope(); if (!scope.empty) enterLevel(scope.start); });
  $('table-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('cert-back-btn').addEventListener('click', () => { stopSpeak(); renderHome(); });
  $('reset-btn').addEventListener('click', () => {
    if (confirm('确定要清空所有进度，重新开始吗？')) {
      stopSpeak();
      state = defaultState();
      saveState();
      currentLevel = -1; currentItem = 0; streak = 0;
      renderHome();
    }
  });
  $('name-input').addEventListener('input', (e) => { state.name = e.target.value.trim(); saveState(); updateCertText(); });
  $('print-btn').addEventListener('click', () => window.print());
}

function initSparkles() {
  const box = $('sparkles');
  const icons = ['✨','💖','🌸','🦋','⭐','🎀'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.textContent = icons[i % icons.length];
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.fontSize = (14 + Math.random() * 18) + 'px';
    s.style.animationDuration = (9 + Math.random() * 9) + 's';
    s.style.animationDelay = (Math.random() * 9) + 's';
    box.appendChild(s);
  }
}

(function init() {
  if (!('speechSynthesis' in window)) toast('⚠️ 当前浏览器不支持语音合成，将无法听到示范发音');
  initSparkles();
  bindEvents();
  renderHome();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
