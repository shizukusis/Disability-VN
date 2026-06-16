/* シーン選択用の細分化データ(チャプター内の主要シーンへのジャンプ点)。
   形式: VN.registerScenes({ "ch01": [{ t:"表示名", l:"ラベル" }, ...], ... })
   l はそのシナリオ内の既存ラベル。t は日本語の見出し。 */
(function () {
  var reg = (window.VN && window.VN.registerScenes) || function (m) { (window.VN = window.VN || {}).scenes = m; };
  reg({
    "ch01": [
      { t: "プロローグ・銃声の夜", l: "prologue_death" },
      { t: "湖畔での異世界転生", l: "lake_rebirth" },
      { t: "猪に襲われる森", l: "boar_attack" },
      { t: "アランの聖域と魔杖", l: "sanctuary_staff" },
      { t: "魔杖クロセルの覚醒", l: "crocell_awakening" },
      { t: "森を抜けてタルフへ", l: "tarf_arrival" },
      { t: "宿屋と神竜バハムート", l: "inn_bahamut" },
      { t: "五芒星の密議", l: "pentagram_council" },
      { t: "星屑屋の少女ステラ", l: "stardust_stella" },
      { t: "広場の襲撃事件", l: "plaza_raid" },
      { t: "路地裏の初戦闘", l: "alley_first_fight" },
      { t: "王都への旅立ち", l: "departure_omen" }
    ],
    "ch02": [
      { t: "謁見の間での嘆願", l: "audience_plea" },
      { t: "王女ティアとの出会い", l: "tia_meeting" },
      { t: "王城での日々", l: "castle_days" },
      { t: "風迅空歩と勇者目撃", l: "skywalk_date" },
      { t: "部隊編成と出立", l: "party_assemble" },
      { t: "ステラへの疑惑", l: "stella_suspicion" },
      { t: "風車小屋の破綻", l: "betrayal_windmill" },
      { t: "魔王領・魔の塔へ", l: "demon_tower_ascent" },
      { t: "皇帝エルクとの決戦", l: "emperor_duel" },
      { t: "落下と水球の救出", l: "fall_and_rescue" },
      { t: "王都への帰還", l: "return_to_capital" }
    ],
    "ch03": [
      { t: "王への報告", l: "royal_report" },
      { t: "過去の告白", l: "past_confession" },
      { t: "エルの特訓", l: "training_el" },
      { t: "魔王封印の任務説明", l: "mission_briefing" },
      { t: "帝都への潜入", l: "imperial_city" },
      { t: "ヴァルハラ要塞強襲", l: "fortress_raid" },
      { t: "負傷したエル", l: "el_wounded" },
      { t: "ロイトン魔窟の踏破", l: "makutsu_descent" },
      { t: "未来視との対決", l: "future_sight_duel" },
      { t: "ラプラスの裏切り", l: "laplace_betrayal" },
      { t: "魔王オセの宣戦布告", l: "ose_broadcast" },
      { t: "アステカス公国の陥落", l: "astekas_fall" }
    ],
    "ch04": [
      { t: "聖都アルカディア到着", l: "arcadia_arrival" },
      { t: "銭湯計画", l: "bathhouse_project" },
      { t: "奴隷オークション", l: "slave_auction" },
      { t: "Vの依頼", l: "v_request" },
      { t: "教会と奴隷商アダン", l: "church_adan" },
      { t: "飛空艇の襲撃", l: "airship_raid" },
      { t: "教皇イヴとの戦い", l: "pope_battle" },
      { t: "上層での救出", l: "upper_rescue" },
      { t: "聖域の防衛戦", l: "sanctuary_defense" },
      { t: "拠点への奇襲", l: "hideout_raid" },
      { t: "アダンとの土壇場", l: "scream_gambit" }
    ],
    "ch05": [
      { t: "束の間の平穏な朝", l: "morning_peace" },
      { t: "クロセルの過去・一", l: "crocell_past_1" },
      { t: "勇者の決意", l: "hero_resolution" },
      { t: "聖剣をめぐって", l: "holy_sword" },
      { t: "決戦・進軍開始", l: "army_assembly" },
      { t: "魔王オセの玉座", l: "ose_throne" },
      { t: "魔王城突入", l: "castle_assault" },
      { t: "テラとの戦闘", l: "tera_battle" },
      { t: "魔王と人質ゼノ", l: "zeno_hostage" },
      { t: "魔王オセの封印", l: "sealing_ose" },
      { t: "祝福の奇跡", l: "blessing_miracle" }
    ],
    "ch06": [
      { t: "エルが連れ去られる", l: "el_taken" },
      { t: "行方不明・捜索会議", l: "search_underground" },
      { t: "クラウスとの決闘", l: "klaus_duel" },
      { t: "Vが語る真実", l: "v_truth" },
      { t: "国境を越える逃避行", l: "border_breakout" },
      { t: "ヤマトの本名と過去", l: "yamato_origin" },
      { t: "クロセルの魔王時代", l: "crocell_maou_past" },
      { t: "エルの裏切り", l: "el_betrayal" },
      { t: "エル=唯一神の判明", l: "god_identity" },
      { t: "瀬野の蘇生", l: "resurrection" },
      { t: "シェル公爵との面会", l: "shell_meeting" },
      { t: "偽りの神の真実", l: "false_god_truth" }
    ],
    "ch07": [
      { t: "魔王城・玉座の回想", l: "stardust_return" },
      { t: "ハゲンティの正体", l: "hagenti_reveal" },
      { t: "グレモリーの契約", l: "gremory_pact" },
      { t: "上層への強襲", l: "assault_upper" },
      { t: "エリクサーの選択", l: "tia_bomb" },
      { t: "教皇との最終決戦", l: "pope_final" },
      { t: "バアル召喚", l: "baal_summon" },
      { t: "神エルの告白", l: "el_confession" },
      { t: "月のシンシア", l: "moon_cynthia" },
      { t: "神となったヤマト", l: "god_yamato" },
      { t: "最後の決闘", l: "final_duel" }
    ],
    "ch08": [
      { t: "月の綺麗な夜・前世", l: "moonlit_warehouse" },
      { t: "組事務所のヤマト", l: "hero_office" },
      { t: "神の事業計画", l: "god_project" },
      { t: "女神の帰還", l: "goddess_return" },
      { t: "贖罪の夜", l: "night_of_absolution" },
      { t: "式典当日・神竜の儀", l: "ceremony_dragon" },
      { t: "ニコラス最後の戦い", l: "nicholas_last_stand" },
      { t: "神竜バハムート決着", l: "bahamut_finale" },
      { t: "カナデの正体", l: "kanade_reveal" },
      { t: "エピローグ・二人", l: "epilogue_two" }
    ]
  });
})();
