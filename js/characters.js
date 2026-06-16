/* =========================================================
   キャラクター・章・エンディング定義
   ---------------------------------------------------------
   ここを編集すればエンジンに触れずにキャラ/章/エンディングを
   追加・変更できます。詳細: docs/EDITING.md
   立ち絵: assets/characters/<id>_<表情>.png (透過PNG)
   デザイン出典: docs/characters.md
   ========================================================= */
(function () {
  // 表情リストから sprites マップを作る補助関数
  const sp = (id, exprs) => {
    const m = {};
    for (const e of exprs) m[e] = `assets/characters/${id}_${e}.png`;
    return m;
  };

  // どの読み込み順でも動くよう、登録関数のシムを先に用意する
  const VN = (window.VN = window.VN || {});
  VN.scenarios = VN.scenarios || {};
  VN.registerScenario = VN.registerScenario || ((id, cmds) => { VN.scenarios[id] = cmds; });

  (window.VN.registerCharacters || ((d) => Object.assign((window.VN.chars = window.VN.chars || {}), d)))({

    // ===== 主要キャラ =====
    yamato:   { name: "ヤマト",   color: "#BDC3C7", scale: 1.00,
                sprites: sp("yamato", ["normal", "smirk", "angry", "sad", "surprised", "smile", "serious"]) },
    crocell:  { name: "クロセル", color: "#D7263D", scale: 0.82,
                sprites: sp("crocell", ["normal", "laugh", "angry", "sad", "blush", "dizzy", "surprised", "serious"]) },
    akatsuki: { name: "アカツキ", color: "#7E57C2", scale: 0.98,
                sprites: sp("akatsuki", ["normal", "smile", "jito", "blush", "surprised", "serious", "sad", "angry", "laugh"]) },
    tia:      { name: "ティア",   color: "#F4B400", scale: 0.72,
                sprites: sp("tia", ["normal", "laugh", "angry", "sad", "surprised"]) },
    el:       { name: "エル",     color: "#5FA8D3", scale: 0.92,
                sprites: sp("el", ["normal", "smile", "sad", "blush", "blank", "cold_smile", "surprised", "troubled"]) },
    nicholas: { name: "ニコラス", color: "#FFB300", scale: 1.02,
                sprites: sp("nicholas", ["normal", "laugh", "depressed", "serious", "surprised"]) },
    zeno:     { name: "瀬野",     color: "#90A4AE", scale: 0.90,
                sprites: sp("zeno", ["normal", "smile", "sad", "scared", "serious"]) },
    laplace:  { name: "ラプラス", color: "#38B6FF", scale: 0.80,
                sprites: sp("laplace", ["normal", "laugh", "mad", "sulk", "blank", "surprised"]) },
    elk:      { name: "エルク",   color: "#6A1B9A", scale: 1.00,
                sprites: sp("elk", ["normal", "laugh", "angry", "shock", "blank"]) },
    eve_end:  { name: "イヴ・エンド", color: "#BFA76F", scale: 1.00,
                sprites: sp("eve_end", ["normal", "cold", "serious", "surprised", "pain"]) },
    stella:   { name: "ステラ",   color: "#FFB74D", scale: 0.85,
                sprites: sp("stella", ["normal", "sleepy", "sad", "serious", "surprised"]) },
    shellmi:  { name: "シェル公爵", color: "#66BB6A", scale: 0.78,
                sprites: sp("shellmi", ["normal", "smug", "angry", "love", "surprised", "sad"]) },

    // ===== 別ボディ・形態差分 =====
    yamato_young:    { name: "ヤマト",   color: "#BDC3C7", scale: 0.70,
                       sprites: sp("yamato_young", ["normal", "smile", "angry", "serious", "surprised", "sad", "jito"]) },
    crocell_goddess: { name: "クロセル", color: "#D7263D", scale: 0.82,
                       sprites: sp("crocell_goddess", ["normal", "smile", "sad", "blush", "serious", "surprised"]) },
    lutz:            { name: "ルツ",     color: "#D7263D", scale: 0.82,
                       sprites: sp("lutz", ["normal", "sad", "smile", "blush", "surprised"]) },
    el_goddess:      { name: "神",       color: "#6FBF9E", scale: 0.92,
                       sprites: sp("el_goddess", ["normal", "blank", "smile", "sad"]) },
    ose:             { name: "魔王オセ", color: "#A6263E", scale: 1.05,
                       sprites: sp("ose", ["normal", "laugh", "shock", "blank", "angry"]) },
    raon_black:      { name: "黒ずくめ", color: "#444444", scale: 1.04,
                       sprites: sp("raon_black", ["normal", "serious", "sad"]) },
    zeno_past:       { name: "瀬野",     color: "#90A4AE", scale: 0.90,
                       sprites: sp("zeno_past", ["normal", "sad", "smile", "scared", "serious"]) },
    yamato_robe:     { name: "ヤマト",   color: "#BDC3C7", scale: 1.00,
                       sprites: sp("yamato_robe", ["normal", "masked", "serious"]) },
    crocell_faint:   { name: "クロセル", color: "#D7263D", scale: 0.82,
                       sprites: sp("crocell_faint", ["normal", "sad"]) },
    nicholas_damaged:{ name: "ニコラス", color: "#FFB300", scale: 1.02,
                       sprites: sp("nicholas_damaged", ["normal", "serious", "pain", "smile"]) },
    tia_travel:      { name: "ティア",   color: "#F4B400", scale: 0.72,
                       sprites: sp("tia_travel", ["normal", "laugh", "angry", "sad", "surprised"]) },
    akatsuki_bandage:{ name: "アカツキ", color: "#7E57C2", scale: 0.98,
                       sprites: sp("akatsuki_bandage", ["normal", "serious", "sad"]) },

    // ===== 準主要キャラ =====
    esk:     { name: "エスク",   color: "#F3A6B5", scale: 0.75,
               sprites: sp("esk", ["normal", "smile", "serious", "surprised"]) },
    gremory: { name: "グレモリー", color: "#B71C1C", scale: 1.02,
               sprites: sp("gremory", ["normal", "smirk", "angry", "sad", "serious"]) },
    bolt:    { name: "V",        color: "#E0C068", scale: 0.85,
               sprites: sp("bolt", ["normal", "smile", "sad", "surprised"]) },
    fai:     { name: "ファイ",   color: "#E57373", scale: 0.80,
               sprites: sp("fai", ["normal", "scared", "smile", "surprised"]) },
    kanade:  { name: "カナデ",   color: "#607D8B", scale: 0.88,
               sprites: sp("kanade", ["normal", "smile", "serious", "sad"]) },
    goethe:  { name: "ゲーテ",   color: "#E64A19", scale: 1.04,
               sprites: sp("goethe", ["normal", "angry", "smirk", "surprised"]) },
    raon:    { name: "ラオン",   color: "#C9A227", scale: 1.04,
               sprites: sp("raon", ["normal", "angry", "smile", "sad"]) },
    hagenti: { name: "ハーゲンティ", color: "#7B1FA2", scale: 1.03,
               sprites: sp("hagenti", ["normal", "sad", "cold", "serious"]) },
    sen:     { name: "セン公爵", color: "#B03060", scale: 1.02,
               sprites: sp("sen", ["normal", "smug", "angry", "serious"]) },
    terra:   { name: "テラ",     color: "#8D6E63", scale: 1.02,
               sprites: sp("terra", ["normal", "smirk", "angry", "sad"]) },
    klaus:   { name: "クラウス", color: "#4FC3F7", scale: 1.00,
               sprites: sp("klaus", ["normal", "cold", "angry", "shock"]) },
    adan:    { name: "アダン",   color: "#A1887F", scale: 1.00,
               sprites: sp("adan", ["normal", "cold", "angry", "shock"]) },
    aishi:   { name: "アイシィ", color: "#D4A017", scale: 0.95,
               sprites: sp("aishi", ["normal", "smile", "serious", "sad", "surprised"]) },
    baal:    { name: "バアル",   color: "#8C1C1C", scale: 1.08,
               sprites: sp("baal", ["normal", "angry", "serious"]) },
  });

  // ===== 章 (チャプター選択) =====
  (window.VN.registerChapters || ((l) => { window.VN.chapters = l; }))([
    { id: "ch01", no: "第一章", title: "転生編",       entry: "ch01:prologue_death" },
    { id: "ch02", no: "第二章", title: "救出編",       entry: "ch02:audience_plea" },
    { id: "ch03", no: "第三章", title: "魔王編 前編",  entry: "ch03:royal_report" },
    { id: "ch04", no: "第四章", title: "教国編",       entry: "ch04:arcadia_arrival" },
    { id: "ch05", no: "第五章", title: "魔王編 後編",  entry: "ch05:morning_peace" },
    { id: "ch06", no: "第六章", title: "神魔編",       entry: "ch06:el_taken" },
    { id: "ch07", no: "終章",   title: "偽神墜堕編",   entry: "ch07:stardust_return" },
    { id: "ch08", no: "外伝",   title: "エピローグ",   entry: "ch08:moonlit_warehouse" },
  ]);

  // ===== イベントCG (ギャラリー掲載順) =====
  (window.VN.registerCGs || ((l) => { window.VN.cgs = l; }))([
    { id: "cg_prologue",       title: "深夜の港湾倉庫" },
    { id: "cg_crocell_awaken", title: "魔杖クロセルの解放" },
    { id: "cg_bahamut",        title: "神竜召喚" },
    { id: "cg_yamato_awaken",  title: "俺は……俺だ！" },
    { id: "cg_emperor_duel",   title: "終わりだ、皇帝" },
    { id: "cg_tower_rescue",   title: "もう何処にも行かせない" },
    { id: "cg_starlit_vow",    title: "絶対に、二度と、俺の側から離れるな" },
    { id: "cg_sword_break",    title: "剣術のディザビリティ" },
    { id: "cg_hero_shield",    title: "正義は不滅だ" },
    { id: "cg_ose_birth",      title: "57代魔王オセ誕生" },
    { id: "cg_bathhouse",      title: "公衆浴場、開店" },
    { id: "cg_v_plea",         title: "僕の妹を助けて欲しいんだ" },
    { id: "cg_scream_gambit",  title: "やっちまえ、勇者" },
    { id: "cg_tia_death",      title: "遊びたかった……な" },
    { id: "cg_lutz_love",      title: "――愛している、ルツ" },
    { id: "cg_el_betrayal",    title: "月夜の裏切り" },
    { id: "cg_zeno_revive",    title: "蘇生（リザレクション）" },
    { id: "cg_recontract",     title: "――再契約だ、クロセル!" },
    { id: "cg_title_call",     title: "――最弱無才のディザビリティだ" },
    { id: "cg_wedding",        title: "夜に駆ける二人" },
    { id: "cg_crocell_kiss",   title: "記憶の奇跡" },
    { id: "cg_dragon_clash",   title: "赤き竜とバハムート" },
  ]);

  // ===== エンディング =====
  (window.VN.registerEndings || ((l) => { window.VN.endings = l; }))([
    { id: "true_end",       type: "TRUE", title: "最弱無才の二人の物語" },
    { id: "bad_lakebottom", type: "BAD",  title: "水底の無才" },
    { id: "if_stardust",    type: "BAD",  title: "星屑の味方" },
    { id: "bad_tower",      type: "BAD",  title: "絶望の塔" },
    { id: "if_tablet",      type: "IF",   title: "本物の石版" },
    { id: "bad_deicide",    type: "BAD",  title: "神殺しの夜" },
    { id: "bad_repeat",     type: "BAD",  title: "二度目の喪失" },
    { id: "bad_green",      type: "BAD",  title: "緑の祈り" },
    { id: "bad_puppets",    type: "BAD",  title: "操り人形" },
    { id: "bad_paradox",    type: "BAD",  title: "救えなかった世界" },
    { id: "if_revenge",     type: "IF",   title: "復讐の果てに" },
    { id: "if_maou",        type: "IF",   title: "魔王様のままで" },
  ]);
})();
