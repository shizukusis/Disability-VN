/* =========================================================
   最弱無才のディザビリティ - ビジュアルノベルエンジン
   ---------------------------------------------------------
   シナリオの書き方は docs/EDITING.md を参照。
   シナリオファイル(scenario/*.js)とキャラ定義(js/characters.js)を
   編集するだけで、エンジン本体を触らずに内容を変更できます。
   ========================================================= */
(function () {
  "use strict";

  // ---------- グローバル登録口(シナリオファイルから使う) ----------
  const VN = (window.VN = window.VN || {});
  VN.scenarios = VN.scenarios || {};
  VN.chars = VN.chars || {};
  VN.chapters = VN.chapters || [];
  VN.endings = VN.endings || [];
  VN.registerScenario = (id, cmds) => { VN.scenarios[id] = cmds; };
  VN.registerCharacters = (defs) => { Object.assign(VN.chars, defs); };
  VN.registerChapters = (list) => { VN.chapters = list; };
  VN.registerEndings = (list) => { VN.endings = list; };
  VN.scenes = VN.scenes || {};
  VN.registerScenes = (map) => { VN.scenes = map; };
  VN.cgs = VN.cgs || [];
  VN.registerCGs = (list) => { VN.cgs = list; };

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const dom = {
    game: $("game"),
    title: $("title-screen"), play: $("play-screen"),
    bg: $("bg-layer"), bgFront: $("bg-layer-front"),
    charaLayer: $("chara-layer"),
    fx: $("effect-layer"),
    win: $("message-window"), namePlate: $("name-plate"), nameText: $("name-text"),
    msg: $("message-text"), adv: $("advance-icon"),
    choices: $("choice-layer"),
    ctrl: $("control-bar"),
    chapterCard: $("chapter-card"), chapterNo: $("chapter-card-no"), chapterTitle: $("chapter-card-title"),
    endCard: $("ending-card"), endType: $("ending-card-type"), endTitle: $("ending-card-title"), endBack: $("ending-card-back"),
    overlay: $("overlay"), ovTitle: $("overlay-title"), ovBody: $("overlay-body"), ovClose: $("overlay-close"),
    fader: $("fader"), dimmer: $("scene-dimmer"), cg: $("cg-layer"),
  };

  // 画面サイズに応じてfont-size基準を更新
  function fitFont() {
    const w = dom.game.clientWidth;
    if (w > 0) dom.game.style.setProperty("--gw", w + "px");
  }
  window.addEventListener("resize", fitFont);
  // iOS対策: 起動直後・回転直後・全画面切替時はビューポート計測が安定しない為、
  // #gameの実サイズ変化を直接監視して --gw を常に追従させる(向きで文字サイズがブレるのを防ぐ)。
  if (window.ResizeObserver) { try { new ResizeObserver(fitFont).observe(dom.game); } catch (e) {} }
  window.addEventListener("orientationchange", () => { fitFont(); setTimeout(fitFont, 150); setTimeout(fitFont, 450); setTimeout(fitFont, 900); });
  window.addEventListener("load", () => { fitFont(); setTimeout(fitFont, 300); });

  // ---------- 永続データ ----------
  const LS_PREFIX = "disability_vn_";
  const store = {
    get(key, def) {
      try { const v = localStorage.getItem(LS_PREFIX + key); return v === null ? def : JSON.parse(v); }
      catch { return def; }
    },
    set(key, val) { try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); return true; } catch { return false; } },
  };

  const config = Object.assign({ textSpeed: 28, autoWait: 1.6, bgmVol: 0.6, seVol: 0.8, skipDelay: 8, skipUnread: false, fullscreen: true }, store.get("config", {}));
  function saveConfig() { store.set("config", config); }

  // ---------- フルスクリーン(スマホの上下バーを消す) ----------
  // ※Fullscreen APIはAndroid/PCで有効。iPhoneのSafariは未対応のため「ホーム画面に追加」で全画面化する。
  function fsSupported() {
    const el = document.documentElement;
    return !!(el.requestFullscreen || el.webkitRequestFullscreen);
  }
  function enterFs() {
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!fn) return false;
    try { const r = fn.call(el, { navigationUI: "hide" }); if (r && r.catch) r.catch(() => {}); }
    catch (e) { try { fn.call(el); } catch (_) {} }
    return true;
  }
  function exitFs() {
    const fn = document.exitFullscreen || document.webkitExitFullscreen;
    if (fn) { try { const r = fn.call(document); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
  }
  function fsOn() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function toggleFs() { fsOn() ? exitFs() : enterFs(); }
  // 全画面ボタンの表示/ラベルを端末対応状況と現在の状態に合わせる
  function syncFsUi() {
    const on = fsOn();
    const tb = document.getElementById("btn-fs-title");
    if (tb) tb.textContent = on ? "全画面を解除" : "全画面表示";
    const cb = document.querySelector('#control-bar [data-ctl=fs]');
    if (cb) { cb.classList.toggle("active", on); cb.title = on ? "全画面解除" : "全画面"; }
  }
  function applyFsButtons() {
    const tb = document.getElementById("btn-fs-title");
    const cb = document.querySelector('#control-bar [data-ctl=fs]');
    if (fsSupported()) {
      if (tb) tb.hidden = false;
      if (cb) cb.hidden = false;
      syncFsUi();
    } else if (!(window.navigator && window.navigator.standalone)) {
      // iPhone Safari等はFullscreen API非対応。ボタンを隠さず「全画面の方法」案内導線として残す。
      if (tb) { tb.hidden = false; tb.textContent = "全画面の方法"; }
    }
  }
  // 全画面ボタン共通動作: 対応端末は切替、非対応(iOS)は案内alert(挙動を統一)
  function fsButtonAction() {
    if (fsSupported()) toggleFs();
    else alert("iPhoneのSafariでは、共有メニューの「ホーム画面に追加」から起動すると全画面で遊べます。");
  }
  function onFsChange() {
    syncFsUi();
    fitFont();                 // 全画面切替で#gameの大きさが変わるのでフォント基準(--gw)を再計測
    setTimeout(fitFont, 120);  // 遷移アニメ後にレイアウトが確定してから再計測
    setTimeout(fitFont, 400);
  }
  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);

  // ゲーム終了(タブを閉じる)。スクリプトで開いていないタブは閉じられない場合があるので案内を出す。
  function quitGame() {
    if (!confirm("ゲームを終了します。よろしいですか？")) return;
    try { window.open("", "_self"); } catch (e) {}
    window.close();
    setTimeout(() => {
      alert("このブラウザではタブを自動で閉じられませんでした。お手数ですがタブ(ウィンドウ)を手動で閉じてください。");
    }, 400);
  }

  // ---------- オーディオ ----------
  // BGM: assets/audio/bgm/<id>.mp3 ループ / SE: assets/audio/se/<id>.* 単発
  // モバイルの自動再生制限対策: 最初のユーザー操作時に再生用要素を生成して
  // 無音でプライムし、以後は同じ要素を使い回す(新規Audioはブロックされるため)
  const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  const audio = {
    a: null, b: null, cur: null, sePool: [], seIdx: 0,
    bgmId: null, fadeTimer: null, unlocked: false, pendingBgm: null,
  };
  function primeEl() {
    // 無音WAVを一度再生して要素をユーザー操作で「解放」する。
    // ※ .then(pause) はしない(後で playBgm が同じ要素で本BGMを鳴らした直後に
    //   この pause が走り、タイトルBGM等を止めてしまうため)。無音なので鳴らしっぱなしで問題ない。
    const el = new Audio();
    el.preload = "auto";
    el.src = SILENT_WAV;
    try { const p = el.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
    return el;
  }
  function unlockAudio() {
    if (audio.unlocked) return;
    audio.unlocked = true;
    try {
      audio.a = primeEl();
      audio.b = primeEl();
      for (let i = 0; i < 4; i++) audio.sePool.push(primeEl());
    } catch (_) { /* Audio未対応環境では無音で続行 */ }
    if (audio.pendingBgm) { const id = audio.pendingBgm; audio.pendingBgm = null; audio.bgmId = null; playBgm(id); }
  }
  function setSrcWithFallback(el, base) {
    el.onerror = null;
    el.src = `${base}.mp3`;
  }
  // 要素ごとに自前のフェードを管理(共有タイマーだと切替時に鳴り残るため)
  function fadeOutStop(el, durMs) {
    if (!el) return;
    clearInterval(el._fade);
    clearTimeout(el._fadeStop);
    durMs = durMs || 600;
    const start = el.volume || 0;
    const dec = start / Math.max(1, durMs / 60);
    el._fade = setInterval(() => {
      el.volume = Math.max(0, el.volume - dec);
      if (el.volume <= 0.001) { el.pause(); el.volume = 0; clearInterval(el._fade); el._fade = null; }
    }, 60);
    // iOS Safari等は volume 変更が無効(音量はハード固定)でフェードが0に届かず pause されない為、
    // フェード時間後に必ず停止する保険。これが無いと旧BGMが鳴り続け新BGMと重なる。
    el._fadeStop = setTimeout(() => {
      clearInterval(el._fade); el._fade = null;
      try { el.pause(); } catch (e) {}
      el.volume = 0; el._fadeStop = null;
    }, durMs + 150);
  }
  function playBgm(id) {
    if (!audio.unlocked) { audio.pendingBgm = id; audio.bgmId = id; return; }
    if (audio.bgmId === id && audio.cur && !audio.cur.paused) return;
    audio.bgmId = id || null;
    const old = audio.cur;
    if (old) fadeOutStop(old, 600);          // 旧トラックは自前タイマーで確実に停止
    if (!id) { audio.cur = null; return; }
    const next = (old === audio.a) ? audio.b : audio.a;
    if (!next) { audio.cur = null; return; }       // 再生要素が未準備なら何もしない
    clearInterval(next._fade); next._fade = null;  // 再利用する要素のフェードは打ち切る
    clearTimeout(next._fadeStop); next._fadeStop = null;  // 保険停止タイマーも解除(新BGMを止めない為)
    next.loop = true;
    next.volume = config.bgmVol;
    try { next.currentTime = 0; } catch (_) {}
    setSrcWithFallback(next, `assets/audio/bgm/${id}`);
    next.play().catch(() => {});
    audio.cur = next;
  }
  // 全BGMを即座に停止(タイトル復帰・初期化用)
  function stopAllBgm() {
    audio.bgmId = null; audio.pendingBgm = null; audio.cur = null;
    [audio.a, audio.b].forEach((el) => {
      if (!el) return;
      clearInterval(el._fade); el._fade = null;
      clearTimeout(el._fadeStop); el._fadeStop = null;
      el.loop = false;
      try { el.pause(); } catch (e) {}
      try { el.currentTime = 0; } catch (e) {}
    });
  }
  function playSe(id) {
    if (!audio.unlocked || !id || !audio.sePool.length) return;
    const el = audio.sePool[audio.seIdx++ % audio.sePool.length];
    if (!el) return;
    clearInterval(el._fade); el._fade = null;
    el.loop = false;
    el.volume = config.seVol;
    try { el.currentTime = 0; } catch (_) {}
    setSrcWithFallback(el, `assets/audio/se/${id}`);
    el.play().catch(() => {});
  }
  function applyBgmVolume() { if (audio.cur) audio.cur.volume = config.bgmVol; }
  document.addEventListener("pointerdown", unlockAudio);
  document.addEventListener("keydown", unlockAudio);

  // ---------- ゲーム状態 ----------
  const state = {
    sid: null,          // 現在のシナリオID
    idx: 0,             // 次に実行するコマンドの添字
    flags: {},          // 分岐フラグ
    bg: null, cg: null, pov: null,
    cast: [],           // 立ち絵キャスト [{id, expr, flip}] 最大5・重複なし
    ghostIds: new Set(),// 半透明(憑依/弱体)中のキャラid。シーンを跨いで持続し、章カードで解除
    log: [],            // バックログ [{name, text}]
    waitingClick: false,
    typing: false,
    auto: false,
    skip: false,
    running: false,
    runId: 0,           // 実行世代(タイトル復帰/ロード等で+1し、古いstepループを無効化)
    seen: store.get("seen", {}),   // 既読 "sid:idx" => 1
  };
  let pageHistory = [];   // バックジャンプ用の表示ページ履歴
  let typeTimer = null;
  let autoTimer = null;
  let labelMaps = {};

  function labelMap(sid) {
    if (!labelMaps[sid]) {
      const m = {};
      (VN.scenarios[sid] || []).forEach((c, i) => { if (c.label) m[c.label] = i; });
      labelMaps[sid] = m;
    }
    return labelMaps[sid];
  }

  // ---------- 画面遷移 ----------
  function showScreen(name) {
    dom.title.classList.toggle("hidden", name !== "title");
    dom.play.classList.toggle("hidden", name !== "play");
    if (name === "play") {   // 全開放/初期化の演出帯がプレイ画面のクリックを遮らないよう消す
      const u = $("unlock-fx"), r = $("reset-fx");
      if (u) u.classList.remove("show", "hiding");
      if (r) r.classList.remove("show", "hiding");
    }
  }
  function fade(mode) { // "dark" | "white" | null (画面遷移用・全面)
    dom.fader.className = mode || "";
    return new Promise((r) => setTimeout(r, 520));
  }

  // ---------- 「解除(アンロック)」全開放演出 ----------
  // ヤマトの才能『解除(アンロック)』を模した、システム破壊風の帯テキスト演出。
  let unlockHideTimer = null;
  function ensureUnlockFx() {
    let el = $("unlock-fx");
    if (el) return el;
    el = document.createElement("div");
    el.id = "unlock-fx";
    el.innerHTML =
      '<div class="unlock-scan"></div>' +
      '<div class="unlock-band">' +
        '<div class="unlock-line unlock-line1">才能『全開放10』を強制解放しました</div>' +
        '<div class="unlock-line unlock-line2">エラー……才能データが破損しました</div>' +
      '</div>';
    dom.game.appendChild(el);
    el.addEventListener("click", hideUnlockFx);
    return el;
  }
  function showUnlockFx() {
    const el = ensureUnlockFx();
    clearTimeout(unlockHideTimer);
    el.classList.remove("show", "hiding");
    void el.offsetWidth;            // リフローでアニメーションを確実に再起動
    el.classList.add("show");
    playSe("chime");
    unlockHideTimer = setTimeout(hideUnlockFx, 5200);
  }
  function hideUnlockFx() {
    const el = $("unlock-fx");
    if (!el || !el.classList.contains("show")) return;
    clearTimeout(unlockHideTimer);
    el.classList.add("hiding");
    setTimeout(() => { el.classList.remove("show", "hiding"); }, 650);
  }
  async function runUnlockSequence() {
    // 全コンテンツ(章・エンディング・CG)を開放
    const ends = {}; for (const e of VN.endings) ends[e.id] = 1; store.set("endings", ends);
    const cgs = {}; for (const g of VN.cgs) cgs[g.id] = 1; store.set("cgs", cgs);
    const chs = {}; for (const c of VN.chapters) chs[c.id] = 1; store.set("chaptersSeen", chs);
    // 設定を閉じ、進行中ならゲームを止めてタイトルへ
    closeOverlay();
    state.running = false; state.runId++; state.auto = state.skip = false;
    clearTimeout(autoTimer); clearInterval(typeTimer);
    updateCtl();
    await fade("dark");
    showScreen("title");
    refreshTitle();
    await fade(null);
    showUnlockFx();
  }

  // ---------- 「データ初期化」グリッチ演出 ----------
  // 才能破壊(才能データ破損)を模した、全開放演出より激しいエラー風グリッチ帯。
  let resetHideTimer = null;
  function ensureResetFx() {
    let el = $("reset-fx");
    if (el) return el;
    const l1 = "致命的なエラーが発生した為……";
    const l2 = "破損箇所のある才能を破壊します『全開放0』";
    el = document.createElement("div");
    el.id = "reset-fx";
    el.innerHTML =
      '<div class="reset-scan"></div>' +
      '<div class="reset-band">' +
        `<div class="reset-line reset-line1" data-t="${l1}">${l1}</div>` +
        `<div class="reset-line reset-line2" data-t="${l2}">${l2}</div>` +
      '</div>';
    dom.game.appendChild(el);
    el.addEventListener("click", hideResetFx);
    return el;
  }
  function showResetFx() {
    const el = ensureResetFx();
    clearTimeout(resetHideTimer);
    el.classList.remove("show", "hiding");
    void el.offsetWidth;            // リフローでアニメーションを再起動
    el.classList.add("show");
    playSe("chime");
    resetHideTimer = setTimeout(hideResetFx, 5200);
  }
  function hideResetFx() {
    const el = $("reset-fx");
    if (!el || !el.classList.contains("show")) return;
    clearTimeout(resetHideTimer);
    el.classList.add("hiding");
    setTimeout(() => { el.classList.remove("show", "hiding"); }, 650);
  }
  async function runResetSequence() {
    // 全開放演出と同じ消去範囲(セーブ・既読・エンディング・CG記録)
    ["saves", "seen", "endings", "cgs"].forEach((k) => localStorage.removeItem(LS_PREFIX + k));
    state.seen = {};
    // 設定を閉じ、進行中なら止めてタイトルへ
    closeOverlay();
    state.running = false; state.runId++; state.auto = state.skip = false;
    clearTimeout(autoTimer); clearInterval(typeTimer);
    updateCtl();
    await fade("dark");
    showScreen("title");
    refreshTitle();
    await fade(null);
    showResetFx();
  }
  // シナリオの { fade } 用: メッセージウィンドウより下の暗幕。
  // 暗転中もテキストは読め、クリックで進行できる
  function sceneFade(mode) {
    dom.dimmer.style.background = mode === "white" ? "#fff" : "#000";
    dom.dimmer.style.opacity = mode === "in" ? 0 : 1;
    state.dimmer = mode === "in" ? null : mode;   // 直近のフェード状態を記録(履歴/セーブ復元用)
    return new Promise((r) => setTimeout(r, 520));
  }
  function clearSceneFade() { dom.dimmer.style.opacity = 0; state.dimmer = null; }
  // 保存/履歴からの即時復元用: 記録したフェード状態(白/暗/無し)をアニメ無しで適用
  function applyDimmer(mode) {
    if (mode === "white" || mode === "out") {
      dom.dimmer.style.background = mode === "white" ? "#fff" : "#000";
      dom.dimmer.style.opacity = 1;
      state.dimmer = mode;
    } else {
      dom.dimmer.style.opacity = 0;
      state.dimmer = null;
    }
  }
  // 画面の完全初期化(遷移時の残像防止)。暗転中に呼ぶこと
  function clearStage() {
    dom.bg.style.backgroundImage = "none";
    dom.bgFront.style.backgroundImage = "none";
    dom.bgFront.style.opacity = 0;
    dom.msg.textContent = "";
    dom.namePlate.classList.add("hidden");
    dom.adv.classList.remove("shown");
    dom.fx.innerHTML = "";
    dom.play.classList.remove("fx-shake");
    dom.chapterCard.classList.add("hidden");
    dom.endCard.classList.add("hidden");
    dom.choices.classList.add("hidden");
    state.bg = null;
    clearSceneFade();
    setCg(null);
    setPov(null);
    castClear();
    state.ghostIds.clear();   // シーン選択等の画面初期化で半透明状態もリセット
  }
  // ---------- イベントCG(スチル) ----------
  function setCg(id) {
    state.cg = id || null;
    // トークンを必ず更新してから分岐する。これでロード中の前回画像の
    // onload→apply() が後から発火しても token 不一致で破棄され、
    // クリア後にCGが再表示されて居座る不具合(特にAndroid)を防ぐ。
    const token = (dom.cg._tok = (dom.cg._tok || 0) + 1);
    if (!id) { dom.cg.classList.remove("shown"); return; }
    const url = `assets/cg/${id}.jpg`;
    // デコード完了を待ってから表示(.shownのopacityトランジションでフェードイン)。
    // 未ロードのまま表示してフェードが空振り→ぱっと出る、というちらつきを防ぐ。
    const img = new Image();
    const apply = () => {
      if (dom.cg._tok !== token) return;
      dom.cg.style.backgroundImage = `url("${url}")`;
      dom.cg.classList.add("shown");
    };
    img.onload = apply; img.onerror = apply;
    img.src = url;
    if (img.complete && img.naturalWidth) apply();
    const seen = store.get("cgs", {});
    if (!seen[id]) { seen[id] = 1; store.set("cgs", seen); }
  }

  // ---------- 視点インジケータ(Side Story) ----------
  // pov: キャラID(VN.charsの名前・色) / 任意文字列(その名前・金色) / {name,color} / null,"yamato"(=本編・非表示)
  function setPov(arg) {
    const ind = $("pov-indicator"), frame = $("pov-frame"), nameEl = $("pov-name");
    if (!ind || !frame || !nameEl) return;   // UI未配置でも本編進行は止めない
    if (arg == null || arg === false || arg === "yamato") {   // ヤマト本編 = 非表示
      state.pov = null;
      ind.classList.remove("shown", "switch");
      frame.classList.remove("shown", "flash");
      dom.game.style.removeProperty("--pov-color");
      return;
    }
    state.pov = arg;
    let name, color, id = arg;
    if (typeof arg === "object") { name = arg.name; color = arg.color; id = arg.id; }
    const def = (typeof id === "string" && VN.chars[id]) ? VN.chars[id] : null;
    name = name || (def ? def.name : String(id));
    color = color || (def ? def.color : "#c9a45c");
    dom.game.style.setProperty("--pov-color", color);
    nameEl.textContent = name;
    ind.classList.add("shown"); frame.classList.add("shown");
    ind.classList.remove("switch"); void ind.offsetWidth; ind.classList.add("switch");
    frame.classList.remove("flash"); void frame.offsetWidth; frame.classList.add("flash");
  }

  // ---------- 立ち絵 ----------
  function spritePath(id, expr) {
    const ch = VN.chars[id];
    if (!ch) return null;
    if (ch.sprites && ch.sprites[expr]) return ch.sprites[expr];
    if (ch.sprites && ch.sprites.normal) return ch.sprites.normal;
    return `assets/characters/${id}_${expr || "normal"}.png`;
  }
  // ---------- 立ち絵(キャスト管理・動的レイアウト) ----------
  // state.cast = [{id,expr,flip}] 最大5・id重複なし。人数で中央寄せ/スケール/バストアップを自動決定。
  const CAST_MAX = 5;
  const CAST_LAYOUT = {            // x=中心%(画面下端基準) / mode bust=バストアップ full=全身 / base=高さ係数
    1: { x: [50],                 mode: "bust", base: 1.55 },
    2: { x: [34, 66],             mode: "bust", base: 1.48 },
    3: { x: [23, 50, 77],         mode: "bust", base: 1.26 },
    4: { x: [17, 39, 61, 83],     mode: "full", base: 1.02 },
    5: { x: [11, 30, 50, 70, 89], mode: "full", base: 0.94 },
  };
  const BUST_HEAD = 92;            // バストアップ時に頭頂を揃える高さ(%)
  const SLOT_ORDER = { farleft: 0, left: 1, lcenter: 2, center: 3, rcenter: 4, right: 5, farright: 6 };
  function slotIdx(s) { return SLOT_ORDER[s] != null ? SLOT_ORDER[s] : 3; }
  // 同一人物の別フォーム(仮面/幼少/負傷/神様化/過去 等)。画面に二人出さない為の同一視マップ。
  // ※エルク/オセ・ラオン/黒ずくめ等の"正体隠し"系は別扱い(同時表示し得る演出を壊さない為に含めない)。
  const PERSON = {
    yamato: "yamato", yamato_robe: "yamato", yamato_young: "yamato",
    crocell: "crocell", crocell_goddess: "crocell", crocell_faint: "crocell", lutz: "crocell",
    el: "el", el_goddess: "el",
    zeno: "zeno", zeno_past: "zeno",
    nicholas: "nicholas", nicholas_damaged: "nicholas",
    tia: "tia", tia_travel: "tia",
    akatsuki: "akatsuki", akatsuki_bandage: "akatsuki",
  };
  function personOf(id) { return PERSON[id] || id; }
  function castFind(id) { return state.cast.findIndex((m) => m.id === id); }
  // 既存idは表情/スロット更新(=同一人物は重複させない)。新規は追加(=会話参加者は残す)。
  // 退場は明示的な {hide} で行う。スロットは表示順(左→右)の手掛かり。
  function castSet(id, expr, flip, slot, ghost) {
    slot = slot || "center";
    // 同一人物の別フォームが既に出ていれば除去(例: 仮面ヤマト→素顔ヤマトの差し替え)
    const p = personOf(id);
    for (let i = state.cast.length - 1; i >= 0; i--) {
      if (state.cast[i].id !== id && personOf(state.cast[i].id) === p) state.cast.splice(i, 1);
    }
    // ghost(半透明=憑依/弱体)は永続状態。明示時のみ変更し、退場や場面転換では解除しない。
    // 「日を跨ぐ/大きな時間経過」での復帰は ghost:false か章カード(ghostIds.clear)で行う。
    if (ghost === true) state.ghostIds.add(id);
    else if (ghost === false) state.ghostIds.delete(id);
    const m = state.cast.find((x) => x.id === id);
    if (m) { m.expr = expr || "normal"; if (flip !== undefined) m.flip = !!flip; m.slot = slot; }
    else {
      state.cast.push({ id, slot, expr: expr || "normal", flip: !!flip });
      while (state.cast.length > CAST_MAX) state.cast.shift();   // 超過時は古参から外す
    }
    relayoutCast();
  }
  function castRemove(id) { const i = castFind(id); if (i >= 0) { state.cast.splice(i, 1); relayoutCast(); } }
  function castRemoveSlot(slot) { const i = state.cast.findIndex((m) => m.slot === slot); if (i >= 0) { state.cast.splice(i, 1); relayoutCast(); } }
  function castClear() { state.cast = []; relayoutCast(); }
  function setFigSprite(el, id, expr, flip) {
    const token = (el._tok = (el._tok || 0) + 1);   // ロード遅延での居座り防止
    const img = new Image();
    img.style.transform = flip ? "scaleX(-1)" : "";
    return new Promise((resolve) => {
      const apply = () => { if (el._tok === token) { el.innerHTML = ""; el.appendChild(img); } resolve(); };
      img.onload = apply; img.onerror = apply; img.src = spritePath(id, expr);
      if (img.complete && img.naturalWidth) apply();
    });
  }
  function relayoutCast() {
    const layer = dom.charaLayer; if (!layer) return Promise.resolve();
    const have = {}; [...layer.children].forEach((el) => { if (el.dataset.id) have[el.dataset.id] = el; });
    const n = Math.min(state.cast.length, CAST_MAX);
    if (n === 0) { Object.values(have).forEach((el) => el.remove()); return Promise.resolve(); }
    const lay = CAST_LAYOUT[n] || CAST_LAYOUT[5];
    const ordered = state.cast.slice().sort((a, b) => slotIdx(a.slot) - slotIdx(b.slot)); // 左→右に整列
    const loads = [];   // 立ち絵スプライトの描画完了Promise(ロード復元時に待機するため)
    ordered.forEach((m, idx) => {
      const ch = VN.chars[m.id] || {}, scale = ch.scale || 1;
      let el = have[m.id]; delete have[m.id];
      const fresh = !el;
      if (fresh) { el = document.createElement("div"); el.className = "chara-fig"; el.dataset.id = m.id; layer.appendChild(el); }
      el.style.left = lay.x[idx] + "%";
      if (lay.mode === "bust") { const h = lay.base * scale * 100; el.style.height = h + "%"; el.style.bottom = (BUST_HEAD - h) + "%"; }
      else { el.style.height = (lay.base * scale * 92) + "%"; el.style.bottom = "0"; }
      if (fresh || el.dataset.expr !== m.expr || el.dataset.flip !== String(!!m.flip)) {
        el.dataset.expr = m.expr; el.dataset.flip = String(!!m.flip);
        loads.push(setFigSprite(el, m.id, m.expr, m.flip));
      }
      el.classList.toggle("ghost", state.ghostIds.has(m.id));   // 半透明(憑依/弱体)演出
      void el.offsetWidth; el.classList.add("shown");
    });
    Object.values(have).forEach((el) => el.remove());   // 退場キャラを除去
    return Promise.all(loads);   // 全スプライトの描画完了(ロード復元時に await して空表示を防ぐ)
  }
  // ---------- 立ち絵の事前デコード ----------
  // プリロード(HTTPキャッシュ)はファイル本体しか温めず、表示時に再デコードが走る。
  // 直後に出す新規立ち絵をあらかじめデコードして保持しておく(=表示時の待ちを無くす)。
  // 2x化でデコード済みビットマップが大きい為、少数だけ保持してメモリを抑える。
  const spriteKeep = [];   // 直近デコード済みImageの保持(上限つきLRU)
  // 2x立ち絵のデコード済みビットマップは大きい為、タッチ端末(モバイル)では保持枚数を減らしてメモリ圧迫を抑える
  const SPRITE_KEEP_MAX = (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches) ? 4 : 8;
  function predecodeSprite(url) {
    if (!url || spriteKeep.some((im) => im._url === url)) return Promise.resolve();
    const im = new Image(); im._url = url; im.src = url;
    spriteKeep.push(im);
    while (spriteKeep.length > SPRITE_KEEP_MAX) { const old = spriteKeep.shift(); try { old.src = ""; } catch (_) {} }   // 押し出した分はデコードキャッシュ解放を促す
    return (im.decode ? im.decode() : Promise.resolve()).catch(() => {});
  }
  // 指定位置から先のコマンドを覗いて、近々表示される立ち絵スプライトのURLを集める
  function collectUpcomingSprites(sid, fromIdx, count) {
    const cmds = VN.scenarios[sid] || [], urls = [];
    for (let i = fromIdx; i < cmds.length && urls.length < count * 2; i++) {
      const c = cmds[i]; if (!c) continue;
      if (c.chara) (Array.isArray(c.chara) ? c.chara : [c.chara]).forEach((it) => { if (it.id) urls.push(spritePath(it.id, it.expr)); });
      if (c.who && c.expr) urls.push(spritePath(c.who, c.expr));
    }
    return [...new Set(urls)].slice(0, count);
  }
  function applyCharaCmd(c) {
    const arr = Array.isArray(c) ? c : [c];
    for (const it of arr) if (it.id) castSet(it.id, it.expr, it.flip, it.slot || "center", it.ghost);
  }
  function highlightSpeaker(who) {
    // 話者が画面に居ない(声のみ・別名義)場合は誰も暗くしない。
    // (半透明の憑依/弱体キャラを別nameで喋らせても消えないように)
    const present = who && [...dom.charaLayer.children].some((el) => el.dataset.id === who);
    [...dom.charaLayer.children].forEach((el) => {
      const isSpk = present && el.dataset.id === who;
      el.classList.toggle("dimmed", present && !isSpk);
      if (isSpk) { el.classList.remove("bounce"); void el.offsetWidth; el.classList.add("bounce"); }
    });
  }
  // セリフ行の expr を、画面に出ている話者の立ち絵へ反映(表情未定義なら現状維持=安全)
  function applySpeakerExpr(who, expr) {
    if (!who || !expr) return;
    const def = VN.chars[who];
    if (!def || !def.sprites || !def.sprites[expr]) return;
    const i = castFind(who);
    if (i >= 0 && state.cast[i].expr !== expr) { state.cast[i].expr = expr; relayoutCast(); }
  }

  // ---------- 背景 ----------
  function setBg(id, instant) {
    if (!id) return Promise.resolve();   // 空IDで"null.jpg"を読んで黒背景になるのを防ぐ(現在の背景を維持)
    const url = `assets/backgrounds/${id}.jpg`;
    state.bg = id;
    const tok = (dom.bg._tok = (dom.bg._tok || 0) + 1);   // 世代トークン(フェード中のロード/ジャンプで古い背景が後勝ちするのを防ぐ)
    if (instant) { dom.bg.style.backgroundImage = `url("${url}")`; return Promise.resolve(); }
    dom.bgFront.style.backgroundImage = `url("${url}")`;
    dom.bgFront.style.opacity = 1;
    return new Promise((r) => setTimeout(() => {
      if (dom.bg._tok === tok) {                          // 自分が最新の背景指示の時だけ適用
        dom.bg.style.backgroundImage = `url("${url}")`;
        dom.bgFront.style.opacity = 0;
      }
      r();
    }, 620));
  }

  // ---------- エフェクト ----------
  function clearRed() {
    const r = dom.fx.querySelector(".fx-red");
    if (r) r.remove();
  }
  function runFx(kind) {
    if (kind === "shake") {
      dom.play.classList.remove("fx-shake"); void dom.play.offsetWidth; dom.play.classList.add("fx-shake");
    } else if (kind === "flash") {
      const d = document.createElement("div"); d.className = "fx-flash";
      dom.fx.appendChild(d); setTimeout(() => d.remove(), 400);
    } else if (kind === "red") {
      // 赤ヴィネットは自動消滅させず、clear-red / 背景変更 / 章替え / シーン遷移まで持続させる
      // (流血・街蹂躙の赤い情景が、2秒で消えて地の文の途中で晴れてしまう不具合の修正)。
      // 二重生成を防ぐため既存の赤があれば再追加しない。背景変更で別の場所へ移ると
      // 前の場面の赤を引き継がないよう、bg変更時にclearRedする(下記 run ループ参照)。
      if (!dom.fx.querySelector(".fx-red")) {
        const d = document.createElement("div"); d.className = "fx-red";
        dom.fx.appendChild(d);
      }
    } else if (kind === "clear-red") {
      clearRed();
    }
  }

  // tid を持つテキストは overrides(編集ファイル由来)があれば差し替える
  function cmdText(c) {
    if (c.tid && VN.textOverrides && VN.textOverrides[c.tid] != null) return VN.textOverrides[c.tid];
    return c.text;
  }

  // ---------- ルビ(振り仮名) ----------
  // 記法: ｜親文字《よみ》  または  漢字《よみ》(直前の漢字列に付与)
  function escHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function parseRuby(text) {
    const toks = []; let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === "｜") {
        const lb = text.indexOf("《", i), rb = text.indexOf("》", lb);
        if (lb > i && rb > lb) { toks.push({ t: "r", base: text.slice(i + 1, lb), read: text.slice(lb + 1, rb) }); i = rb + 1; continue; }
      }
      if (ch === "《") {  // ｜省略: 直前の漢字列に付与
        const rb = text.indexOf("》", i);
        if (rb > i) {
          let base = "";
          while (toks.length && toks[toks.length - 1].t === "p" && /[一-龥々〆ヶ]/.test(toks[toks.length - 1].c)) base = toks.pop().c + base;
          if (base) { toks.push({ t: "r", base, read: text.slice(i + 1, rb) }); i = rb + 1; continue; }
        }
      }
      toks.push({ t: "p", c: ch }); i++;
    }
    return toks;
  }
  function rubyHtml(toks, n) {
    let out = "", used = 0;
    for (const tk of toks) {
      if (used >= n) break;
      if (tk.t === "p") { out += escHtml(tk.c); used++; }
      else { out += `<ruby>${escHtml(tk.base)}<rt>${escHtml(tk.read)}</rt></ruby>`; used += tk.base.length; }
    }
    return out;
  }
  function rubyFull(text) { const t = parseRuby(text); return rubyHtml(t, Infinity); }
  function rubyPlain(text) { return escHtml(parseRuby(text).map((t) => (t.t === "p" ? t.c : t.base)).join("")); }

  // ネームプレートの配色。背景は常に暗いベースを保ち、話者色は暗幕越しの
  // 色相アクセント+菱形◆として乗せる。これで文字色(--gold-bright)が
  // どの話者でも読みやすさを保てる(明色キャラで文字が埋もれる不具合の対策)。
  function applyNamePlateColor(ch) {
    if (ch && ch.color) {
      dom.namePlate.style.background =
        `linear-gradient(100deg, rgba(18,11,26,.70), rgba(14,9,21,.84)), ` +
        `linear-gradient(100deg, ${ch.color} 0%, transparent 140%)`;
      dom.namePlate.style.setProperty("--spk", ch.color);
    } else {
      dom.namePlate.style.background = "";
      dom.namePlate.style.removeProperty("--spk");
    }
  }

  // ---------- テキスト表示 ----------
  function showText(name, text) {
    return new Promise((resolve) => {
      state.typing = true;
      state.waitingClick = false;
      dom.adv.classList.remove("shown");
      if (name) {
        dom.namePlate.classList.remove("hidden");
        dom.nameText.textContent = name;
        const ch = Object.values(VN.chars).find((c) => c.name === name);
        applyNamePlateColor(ch);
      } else {
        dom.namePlate.classList.add("hidden");
      }
      state.log.push({ name: name || "", text });
      if (state.log.length > 200) state.log.shift();

      const seenKey = state.sid + ":" + (state.idx - 1);
      const isSeen = !!state.seen[seenKey];
      state.seen[seenKey] = 1;
      dom.msg.classList.toggle("text-read", isSeen);   // 既読は色を変える(未読=従来色)

      const rtoks = parseRuby(text);
      const rtotal = rtoks.reduce((a, t) => a + (t.t === "p" ? 1 : t.base.length), 0);
      dom.msg.innerHTML = "";
      let i = 0;
      const speedMs = (state.skip && (isSeen || config.skipUnread)) ? 0 : Math.max(1, 110 - config.textSpeed * 3.5);
      const finish = () => {
        clearInterval(typeTimer); typeTimer = null;
        dom.msg.innerHTML = rubyHtml(rtoks, rtotal);
        state.typing = false;
        state.waitingClick = true;
        dom.adv.classList.add("shown");
        resolve();
      };
      if (speedMs === 0) { finish(); return; }
      typeTimer = setInterval(() => {
        i++;
        dom.msg.innerHTML = rubyHtml(rtoks, i);
        if (i >= rtotal) finish();
      }, speedMs);
      dom.win._finishTyping = finish;
    });
  }

  // クリック/キーで進行
  function advance() {
    if (!state.running) return;
    if (state.typing) { dom.win._finishTyping && dom.win._finishTyping(); return; }
    if (state.waitingClick) {
      state.waitingClick = false;
      dom.adv.classList.remove("shown");
      clearTimeout(autoTimer);
      step();
    }
  }

  // ---------- バックジャンプ(前のテキストへ戻る) ----------
  // テキストが表示されるたびに、その時点の表示状態を履歴へ積む
  function pushHistory(c) {
    pageHistory.push({
      sid: state.sid, resumeIdx: state.idx,      // このテキストの次から再開
      bg: state.bg, cg: state.cg, bgm: audio.bgmId, pov: state.pov, dimmer: state.dimmer || null,
      cast: JSON.parse(JSON.stringify(state.cast)), ghostIds: [...state.ghostIds],
      name: c.name || null, text: cmdText(c), who: c.who || null,
    });
    if (pageHistory.length > 200) pageHistory.shift();
  }
  // バックログからの箇所ジャンプ。指定履歴の表示状態を復元し、其処から再開する。
  // フェード(白/暗)・全面フェーダーを明示クリアし、背景/CG/BGM/立ち絵/POVを一括復元
  // することで、フェード残り・背景/BGMのズレといった不具合を防ぐ。
  function restoreHistory(i) {
    if (i < 0 || i >= pageHistory.length) return;
    state.runId++;                                // 待機中の旧stepループをstale化(ジャンプ後の二重再生/勝手な進行を防ぐ)
    clearInterval(typeTimer); typeTimer = null;
    clearTimeout(autoTimer);
    state.auto = state.skip = false; updateCtl();
    dom.choices.classList.add("hidden"); dom.choices.innerHTML = "";   // 選択肢を畳み、古いボタンのonclickも破棄
    const p = pageHistory[i];
    pageHistory.length = i + 1;                    // 以降の履歴を破棄(タイムライン整合)
    state.log = pageHistory.map((h) => ({ name: h.name || "", text: h.text }));
    // 全面フェーダー(章遷移用)はクリア。シーン暗幕は記録した状態を復元する。
    // ジャンプ先が白/黒フェード中(闇の独白・転移演出等)なら、その暗幕を復元して
    // 背景がそのまま見えてしまう不具合を防ぐ。
    dom.fader.className = "";
    setBg(p.bg, true);
    setCg(p.cg);
    setPov(p.pov || null);
    applyDimmer(p.dimmer);
    state.cast = p.cast ? JSON.parse(JSON.stringify(p.cast)) : [];
    state.ghostIds = new Set(p.ghostIds || []);   // 半透明状態も復元
    relayoutCast();
    playBgm(p.bgm || null);
    if (p.name) {
      dom.namePlate.classList.remove("hidden");
      dom.nameText.textContent = p.name;
      applyNamePlateColor(Object.values(VN.chars).find((c) => c.name === p.name));
    } else {
      dom.namePlate.classList.add("hidden");
    }
    dom.msg.innerHTML = rubyFull(p.text);
    highlightSpeaker(p.who);
    state.sid = p.sid; state.idx = p.resumeIdx;    // 次のadvanceでこのページの続きから
    state.running = true; state.typing = false; state.waitingClick = true;
    dom.win.classList.remove("window-hidden");
    dom.adv.classList.add("shown");
  }

  // ---------- 選択肢 ----------
  function showChoices(items) {
    state.waitingClick = false;
    dom.choices.innerHTML = "";
    dom.choices.classList.remove("hidden");
    for (const it of items) {
      if (it.if && !evalCond(it.if)) continue;
      const b = document.createElement("button");
      b.className = "choice-btn" + (it.kind === "if" ? " choice-if" : "");
      b.innerHTML = rubyFull(it.label);   // ルビ記法をレンダリング(生の｜《》を出さない)
      b.onclick = () => {
        dom.choices.classList.add("hidden");
        if (it.set) Object.assign(state.flags, it.set);
        if (it.jump) gotoLabel(it.jump);
        step();
      };
      dom.choices.appendChild(b);
    }
  }
  function evalCond(cond) {
    // {flag:"x", eq:値} / {flag:"x"} (truthy判定)
    if ("eq" in cond) return state.flags[cond.flag] === cond.eq;
    return !!state.flags[cond.flag];
  }

  // ---------- ジャンプ ----------
  function gotoLabel(target) {
    // "label" or "scenarioId:label" or "scenarioId:"(先頭)
    let sid = state.sid, label = target;
    if (target.includes(":")) { [sid, label] = target.split(":"); }
    if (!VN.scenarios[sid]) { console.error("シナリオがありません:", sid); return; }
    state.sid = sid;
    state.idx = label ? (labelMap(sid)[label] ?? 0) : 0;
  }

  // ---------- エンディング ----------
  function showEnding(e) {
    state.running = false;
    clearSceneFade();
    const unlocked = store.get("endings", {});
    unlocked[e.id] = 1;
    store.set("endings", unlocked);
    store.set("seen", state.seen);
    dom.endCard.classList.remove("hidden");
    dom.endCard.classList.remove("bad", "if");
    if (e.type === "BAD") dom.endCard.classList.add("bad");
    if (e.type === "IF") dom.endCard.classList.add("if");
    dom.endType.textContent = e.type === "BAD" ? "BAD END" : e.type === "IF" ? "IF END" : "TRUE END";
    dom.endTitle.textContent = e.title;
  }
  dom.endBack.onclick = async () => {
    state.runId++;
    clearInterval(typeTimer); typeTimer = null; clearTimeout(autoTimer);   // 残存タイマを掃除(復帰後の暴発防止)
    state.auto = state.skip = false;
    await fade("dark");
    dom.endCard.classList.add("hidden");
    showScreen("title");
    refreshTitle();
    fade(null);
  };

  // ---------- メインループ ----------
  async function step() {
    if (!VN.scenarios[state.sid]) return;
    state.running = true;
    const my = state.runId;                 // この実行の世代
    const stale = () => state.runId !== my;  // 文脈が変わったら中断
    // cmds はループ内で毎回 state.sid から取り直す。章をまたぐ {jump} で
    // state.sid が変わった後も旧章の配列を読み続け、新章のindex位置にある
    // 旧章のコマンド(=プロローグ等)を誤再生する不具合を防ぐ。
    while (state.idx < (VN.scenarios[state.sid] || []).length) {
      if (stale()) return;
      const cmds = VN.scenarios[state.sid];
      const c = cmds[state.idx++];

      if (c.label) continue;
      if (c.comment) continue;

      if (c.set) { Object.assign(state.flags, c.set); continue; }
      if (c.branch) { if (evalCond(c.branch)) { gotoLabel(c.branch.jump); } continue; }
      if (c.jump) { gotoLabel(c.jump); continue; }

      // 以下は「装飾」系コマンド。同一コマンドに text/choice 等が併用される事が
      // あるため continue せず、適用後に下の text 等の処理へ進める。
      // (特に第2章は chara と text を1コマンドに併用しており、従来は chara で
      //  continue して text がスキップされ、会話が飛んでいた)
      if (c.cg !== undefined) setCg(c.cg);
      if (c.pov !== undefined) setPov(c.pov);
      if (c.bgm !== undefined) playBgm(c.bgm);
      if (c.se) playSe(c.se);
      if (c.bg !== undefined) { clearRed(); await setBg(c.bg, c.instant); if (stale()) return; }
      if (c.chara) applyCharaCmd(c.chara);
      if (c.hide) {
        if (c.hide === "all") castClear();
        else if (SLOT_ORDER[c.hide] != null) castRemoveSlot(c.hide);   // スロット名で退場
        else castRemove(c.hide);                                       // キャラID指定で退場
      }
      if (c.fx) runFx(c.fx);
      if (c.wait) { await new Promise((r) => setTimeout(r, state.skip ? 50 : c.wait)); if (stale()) return; continue; }
      if (c.fade) { await sceneFade(c.fade); if (stale()) return; continue; }

      if (c.chapter) {
        markChapterSeen(state.sid);
        // 前章から持ち越した暗幕(sceneFade=白/暗)と全面フェーダーをクリアする。
        // 章末の {fade:"white"} → 次章への jump で白が残り、新章の開始が
        // 白アウトしたまま何も映らない不具合(特に第2章 謁見)の対策。
        clearSceneFade();
        dom.fader.className = "";
        setPov(null);
        // 章カードのフェードアウト時に前シーンの文字/窓が透けて重ならないよう、先に隠す
        dom.win.classList.add("window-hidden");
        dom.msg.textContent = ""; dom.namePlate.classList.add("hidden"); dom.adv.classList.remove("shown");
        clearRed();               // 章替え=赤ヴィネット持続の終端
        castClear();
        state.ghostIds.clear();   // 新章=時間経過。半透明(弱体/憑依)を解除
        dom.chapterNo.textContent = c.chapter.no || "";
        dom.chapterTitle.textContent = c.chapter.title || "";
        dom.chapterCard.classList.add("hidden");
        void dom.chapterCard.offsetWidth; // アニメーション再始動
        dom.chapterCard.classList.remove("hidden");
        collectUpcomingSprites(state.sid, state.idx, 6).forEach(predecodeSprite);  // 新章直後の立ち絵を事前デコード
        await new Promise((r) => setTimeout(r, state.skip ? 400 : 3200));
        if (stale()) { dom.chapterCard.classList.add("hidden"); return; }
        dom.chapterCard.classList.add("hidden");
        dom.win.classList.remove("window-hidden");
        continue;
      }

      if (c.choice) { state.skip = false; updateCtl(); showChoices(c.choice); return; }
      if (c.ending) { showEnding(c.ending); return; }

      if (c.text !== undefined) {
        const txt = cmdText(c);
        const wasUnseen = !state.seen[state.sid + ":" + (state.idx - 1)]; // showTextが既読化する前に判定
        if (c.who && c.expr) applySpeakerExpr(c.who, c.expr);
        highlightSpeaker(c.who || null);
        await showText(c.name || null, txt);
        if (stale()) return;
        pushHistory(c);
        prefetch(collectAssets(state.sid, state.idx, 40)); // 先のアセットを裏で先読み
        collectUpcomingSprites(state.sid, state.idx, 4).forEach(predecodeSprite); // 直後に出す立ち絵を事前デコード
        const autoAdvance = () => { autoTimer = setTimeout(() => advance(), 800 + txt.length * 55 * config.autoWait); };
        if (state.skip) {
          // 未読 かつ 未読スキップOFF の時はオートモード相当(読める速度+ポーズ)。既読は高速スキップ。
          if (wasUnseen && !config.skipUnread) autoAdvance();
          else autoTimer = setTimeout(() => advance(), config.skipDelay);   // autoTimerに保持(ロード/復帰時にclearできるように)
          return;
        }
        if (state.auto) autoAdvance();
        return; // クリック待ち
      }
      console.warn("不明なコマンド:", c);
    }
    // シナリオ末尾に到達
    state.running = false;
  }

  // ---------- セーブ/ロード ----------
  const SLOT_COUNT = 8;
  function snapshot() {
    return {
      sid: state.sid, idx: state.idx - 1, // 表示中のテキストから再開
      flags: { ...state.flags }, bg: state.bg, bgm: audio.bgmId, cg: state.cg, pov: state.pov, dimmer: state.dimmer || null,
      cast: JSON.parse(JSON.stringify(state.cast)), ghostIds: [...state.ghostIds],
      lastText: state.log.length ? state.log[state.log.length - 1] : null,
      thumb: state.cg ? `assets/cg/${state.cg}.jpg` : (state.bg ? `assets/backgrounds/${state.bg}.jpg` : null),
      date: new Date().toLocaleString("ja-JP"),
    };
  }
  function doSave(n) {
    const saves = store.get("saves", {});
    saves[n] = snapshot();
    if (!store.set("saves", saves)) {            // iOSプライベート/容量超過でセーブ失敗を検知して通知
      alert("保存に失敗しました。プライベートブラウズ中か、空き容量が不足している可能性があります。");
      return;
    }
    store.set("seen", state.seen);
  }
  async function doLoad(data) {
    closeOverlay();
    state.runId++;
    // 旧コンテキストのタイピング/オート進行を停止(ロード後に旧処理が割り込まないように)
    clearInterval(typeTimer); typeTimer = null;
    clearTimeout(autoTimer);
    state.auto = state.skip = false;
    await fade("dark");
    showScreen("play");
    state.sid = data.sid; state.idx = Math.max(0, data.idx);
    state.flags = { ...data.flags };
    state.log = []; pageHistory = [];
    // 章の全アセット先読みは画面表示をブロックしない(2x化で重い為、下で背景実行する)。
    // 画面オーバーレイ・演出を完全リセット(ロード時に白/黒画面が残る不具合の対策)。
    // 暗幕(白/黒)・フラッシュ/赤・シェイク・章カード・選択肢・メッセージ窓の状態を一掃する。
    clearSceneFade();
    dom.dimmer.style.background = "#000";
    dom.fx.innerHTML = "";
    dom.play.classList.remove("fx-shake");
    dom.win.classList.remove("window-hidden");
    dom.msg.textContent = "";
    dom.namePlate.classList.add("hidden");
    dom.adv.classList.remove("shown");
    dom.chapterCard.classList.add("hidden");
    dom.endCard.classList.add("hidden");
    dom.choices.classList.add("hidden");
    updateCtl();
    // ビジュアル復元(前シーンの残像を消してからセーブ内容で再構成)
    dom.bg.style.backgroundImage = "none";
    dom.bgFront.style.backgroundImage = "none"; dom.bgFront.style.opacity = 0;
    // 保存された背景。古いセーブや背景引き継ぎシーンで data.bg が無い場合は、
    // 保存位置より前の直近の{bg}を遡って適用し、ロード時の黒背景を防ぐ。
    const loadBg = data.bg || lastBgBefore(data.sid, data.idx);
    if (loadBg) setBg(loadBg, true);
    setCg(data.cg || null);
    setPov(data.pov || null);
    state.cast = data.cast ? JSON.parse(JSON.stringify(data.cast)) : [];
    state.ghostIds = new Set(data.ghostIds || []);   // 半透明状態も復元
    stopAllBgm();                    // BGMは立ち絵のデコードに引きずられず即再生(タイトル/前BGMを確実停止)
    playBgm(data.bgm || lastBgmBefore(data.sid, data.idx) || null);  // 保存BGM、無ければ直近{bgm}を継承(無音防止)
    // 復元キャストの立ち絵デコード描画が終わってから画面を出す(空表示の窓を防ぐ。即必要な分だけ・上限2.5s)
    await Promise.race([relayoutCast(), new Promise((r) => setTimeout(r, 2500))]);
    dom.fader.className = "";         // 全面フェーダー(章遷移用)を確実にクリア(黒/白の残り防止)
    // 保存時のシーン暗幕(白/黒フェード中=闇の独白・転移演出等)を復元。記録が無い(=
    // 通常表示)なら直前のclearSceneFadeで既にクリア済み。これで「白/黒のまま」も
    // 「フェード演出が消える」も両方回避する。
    applyDimmer(data.dimmer || null);
    collectUpcomingSprites(data.sid, data.idx, 8).forEach(predecodeSprite);   // 直後に出す新規立ち絵を事前デコード
    // ※章全体の一括先読みはしない(2x化で帯域を占有しBGM等を遅延させる為)。
    //   先のアセットはstep()内の前方プリフェッチ(collectAssets 40件)で進行に応じて読む。
    step();
  }

  // ---------- オーバーレイ ----------
  function openOverlay(title, build) {
    dom.ovTitle.textContent = title;
    dom.ovBody.innerHTML = "";
    build(dom.ovBody);
    dom.overlay.classList.remove("hidden");
  }
  function closeOverlay() { dom.overlay.classList.add("hidden"); }
  dom.ovClose.onclick = closeOverlay;
  dom.overlay.onclick = (e) => { if (e.target === dom.overlay) closeOverlay(); };

  function buildLog(body) {
    if (!pageHistory.length) { body.innerHTML = "<p>まだログがありません。</p>"; return; }
    pageHistory.forEach((e, i) => {
      const d = document.createElement("div");
      d.className = "log-entry log-jump";
      d.innerHTML = (e.name ? `<div class="log-name">${escHtml(e.name)}</div>` : "") +
        `<div class="log-text">${rubyFull(e.text)}</div>`;
      d.title = "この箇所へジャンプ";
      d.onclick = () => { closeOverlay(); restoreHistory(i); };
      body.appendChild(d);
    });
    // オーバーレイ表示後(レイアウト確定後)に最下部=最新へスクロール
    requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  }

  function buildSaveLoad(body, mode) {
    const saves = store.get("saves", {});
    for (let n = 1; n <= SLOT_COUNT; n++) {
      const s = saves[n];
      const b = document.createElement("button");
      b.className = "save-slot" + (s ? "" : " empty");
      const thumb = s && s.thumb
        ? `<span class="slot-thumb"><img src="${s.thumb}" alt=""></span>`
        : `<span class="slot-thumb empty-thumb">❖</span>`;
      b.innerHTML = `${thumb}<span class="slot-no">No.${n}</span>
        <span class="slot-info">
          <div class="slot-date">${s ? s.date : "----/--/--"}</div>
          <div class="slot-text">${s && s.lastText ? (s.lastText.name ? "【" + escHtml(s.lastText.name) + "】" : "") + rubyPlain(s.lastText.text) : "NO DATA"}</div>
        </span>`;
      b.onclick = () => {
        if (mode === "save") {
          if (!state.running && !state.waitingClick) return;
          doSave(n); closeOverlay();
        } else if (s) { doLoad(s); }
      };
      body.appendChild(b);
    }
  }

  function buildConfig(body) {
    body.innerHTML = `
      <div class="config-row">
        <label>テキスト速度</label>
        <input type="range" id="cfg-speed" min="1" max="30" value="${config.textSpeed}">
        <span class="config-val" id="cfg-speed-val">${config.textSpeed}</span>
      </div>
      <div class="config-row">
        <label>オート待ち時間</label>
        <input type="range" id="cfg-auto" min="0.5" max="3" step="0.1" value="${config.autoWait}">
        <span class="config-val" id="cfg-auto-val">${config.autoWait}</span>
      </div>
      <div class="config-row">
        <label>スキップ速度</label>
        <input type="range" id="cfg-skip" min="0" max="40" step="2" value="${40 - config.skipDelay}">
        <span class="config-val" id="cfg-skip-val">${40 - config.skipDelay}</span>
      </div>
      <div class="config-row">
        <label>未読もスキップ</label>
        <input type="checkbox" id="cfg-skipunread" ${config.skipUnread ? "checked" : ""} style="width:1.4em;height:1.4em;accent-color:var(--ui-accent2);">
        <span class="config-val" style="flex:1;font-size:.8em;color:#9a8cb8;">OFFで未読は通常速度で表示</span>
      </div>
      <div class="config-row">
        <label>BGM音量</label>
        <input type="range" id="cfg-bgm" min="0" max="1" step="0.05" value="${config.bgmVol}">
        <span class="config-val" id="cfg-bgm-val">${Math.round(config.bgmVol * 100)}</span>
      </div>
      <div class="config-row">
        <label>SE音量</label>
        <input type="range" id="cfg-se" min="0" max="1" step="0.05" value="${config.seVol}">
        <span class="config-val" id="cfg-se-val">${Math.round(config.seVol * 100)}</span>
      </div>
      <div class="config-row">
        <label>フルスクリーン</label>
        <button class="config-btn" id="cfg-fs">${fsSupported() ? "全画面表示を切り替える" : "ホーム画面に追加で全画面"}</button>
      </div>
      <div class="config-row">
        <label>起動時に全画面</label>
        <input type="checkbox" id="cfg-fsauto" ${config.fullscreen ? "checked" : ""} style="width:1.4em;height:1.4em;accent-color:var(--ui-accent2);">
        <span class="config-val" style="flex:1;font-size:.8em;color:#9a8cb8;">${fsSupported() ? "最初のタップで自動で全画面に" : "iPhoneは「ホーム画面に追加」で全画面"}</span>
      </div>
      <div class="config-row">
        <label>全開放</label>
        <button class="config-btn" id="cfg-unlock">解除（アンロック）</button>
      </div>
      <div class="config-row">
        <label>データ初期化</label>
        <button class="config-btn" id="cfg-reset">セーブ・既読・エンディングを全消去</button>
      </div>`;
    $("cfg-speed").oninput = (e) => { config.textSpeed = +e.target.value; $("cfg-speed-val").textContent = config.textSpeed; saveConfig(); };
    $("cfg-auto").oninput = (e) => { config.autoWait = +e.target.value; $("cfg-auto-val").textContent = config.autoWait; saveConfig(); };
    $("cfg-skip").oninput = (e) => { config.skipDelay = 40 - +e.target.value; $("cfg-skip-val").textContent = e.target.value; saveConfig(); };
    $("cfg-skipunread").onchange = (e) => { config.skipUnread = e.target.checked; saveConfig(); };
    $("cfg-bgm").oninput = (e) => { config.bgmVol = +e.target.value; $("cfg-bgm-val").textContent = Math.round(config.bgmVol * 100); applyBgmVolume(); saveConfig(); };
    $("cfg-se").oninput = (e) => { config.seVol = +e.target.value; $("cfg-se-val").textContent = Math.round(config.seVol * 100); saveConfig(); };
    $("cfg-fs").onclick = () => { if (fsSupported()) toggleFs(); else alert("iPhoneのSafariでは、共有メニューの「ホーム画面に追加」から起動すると全画面で遊べます。"); };
    $("cfg-fsauto").onchange = (e) => { config.fullscreen = e.target.checked; saveConfig(); if (config.fullscreen && fsSupported()) enterFs(); };
    $("cfg-unlock").onclick = () => { runUnlockSequence(); };
    $("cfg-reset").onclick = () => {
      if (confirm("全てのセーブデータ・既読・エンディング記録を削除します。よろしいですか?")) {
        runResetSequence();
      }
    };
  }

  function markChapterSeen(sid) {
    const seen = store.get("chaptersSeen", {});
    if (!seen[sid]) { seen[sid] = 1; store.set("chaptersSeen", seen); }
  }
  function chapterUnlocked(ch, idx) {
    if (idx === 0) return true;                 // 第1章は常に解放
    return !!store.get("chaptersSeen", {})[ch.id];
  }
  function buildChapterList(body) {
    body.innerHTML = "";
    const note = document.createElement("p");
    note.className = "list-sub";
    note.textContent = "物語を読み進めると、その章が解放されます。";
    body.appendChild(note);
    VN.chapters.forEach((ch, i) => {
      const b = document.createElement("button");
      const unlocked = ch.entry && chapterUnlocked(ch, i);
      b.className = "list-item" + (unlocked ? "" : " locked");
      const scenes = (VN.scenes || {})[ch.id];
      if (!ch.entry) {
        b.innerHTML = `<span class="item-tag">${ch.no}</span>${ch.title} (制作中)`;
        b.disabled = true;
      } else if (!unlocked) {
        b.innerHTML = `<span class="item-tag">${ch.no}</span>？？？　<span style="float:right;color:#6e6048;font-size:.82em;">🔒 未到達</span>`;
        b.disabled = true;
      } else {
        const hint = scenes && scenes.length ? `<span style="float:right;color:#9c8e6e;font-size:.82em;">シーン選択 ▸</span>` : "";
        b.innerHTML = `<span class="item-tag">${ch.no}</span>${ch.title}${hint}`;
        b.onclick = () => {
          if (scenes && scenes.length) buildSceneList(body, ch, scenes);
          else { closeOverlay(); startFrom(ch.entry); }
        };
      }
      body.appendChild(b);
    });
  }
  function buildSceneList(body, ch, scenes) {
    body.innerHTML = "";
    const back = document.createElement("button");
    back.className = "list-item scene-back";
    back.innerHTML = `<span class="item-tag">◂</span>チャプター選択へ戻る`;
    back.onclick = () => buildChapterList(body);
    body.appendChild(back);
    const head = document.createElement("div");
    head.className = "list-sub";
    head.textContent = `${ch.no}  ${ch.title} ― シーンを選んで再生`;
    body.appendChild(head);
    for (const sc of scenes) {
      const b = document.createElement("button");
      b.className = "list-item";
      b.innerHTML = `<span class="item-tag">▶</span>${sc.t}`;
      b.onclick = () => { closeOverlay(); startFrom(ch.id + ":" + sc.l); };
      body.appendChild(b);
    }
    body.scrollTop = 0;
  }

  function buildGallery(body) {
    const seen = store.get("cgs", {});
    if (!VN.cgs.length) { body.innerHTML = "<p>CGは登録されていません。</p>"; return; }
    const grid = document.createElement("div");
    grid.className = "cg-grid";
    for (const cg of VN.cgs) {
      const cell = document.createElement("button");
      cell.className = "cg-cell";
      if (seen[cg.id]) {
        cell.innerHTML = `<img src="assets/cg/${cg.id}.jpg" alt="${cg.title}"><span class="cg-title">${cg.title}</span>`;
        cell.onclick = () => {
          const v = document.createElement("div");
          v.id = "cg-viewer";
          v.innerHTML = `<img src="assets/cg/${cg.id}.jpg">`;
          v.onclick = () => v.remove();
          dom.game.appendChild(v);
        };
      } else {
        cell.textContent = "？？？";
        cell.disabled = true;
      }
      grid.appendChild(cell);
    }
    body.appendChild(grid);
  }

  function buildEndingList(body) {
    const unlocked = store.get("endings", {});
    if (!VN.endings.length) { body.innerHTML = "<p>エンディングは登録されていません。</p>"; return; }
    const note = document.createElement("p");
    note.style.cssText = "color:#9a8cb8;font-size:.85em;margin-bottom:1em;";
    note.textContent = "解放済みのエンディングをクリックすると、その結末を再生できます。";
    body.appendChild(note);
    for (const e of VN.endings) {
      const got = unlocked[e.id];
      const d = document.createElement("button");
      d.className = "list-item" + (e.type === "BAD" ? " bad" : "") + (got ? "" : " locked");
      d.innerHTML = `<span class="item-tag">${e.type} END</span>${got ? e.title : "？？？？？？"}` +
        (got ? `<span style="float:right;color:#cbb7e8;">▶ 再生</span>` : "");
      if (got) {
        d.onclick = () => { closeOverlay(); startFrom("ending:" + e.id); };
      } else {
        d.disabled = true;
      }
      body.appendChild(d);
    }
  }

  // ---------- 操作バー ----------
  function updateCtl() {
    dom.ctrl.querySelector('[data-ctl=auto]').classList.toggle("active", state.auto);
    dom.ctrl.querySelector('[data-ctl=skip]').classList.toggle("active", state.skip);
  }
  dom.ctrl.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    e.stopPropagation();
    const k = b.dataset.ctl;
    if (k === "auto") { state.auto = !state.auto; state.skip = false; updateCtl(); if (state.auto && state.waitingClick) advance(); }
    else if (k === "skip") { state.skip = !state.skip; state.auto = false; updateCtl(); if (state.skip && state.waitingClick) advance(); }
    else if (k === "log") openOverlay("バックログ", buildLog);
    else if (k === "save") openOverlay("セーブ", (b2) => buildSaveLoad(b2, "save"));
    else if (k === "load") openOverlay("ロード", (b2) => buildSaveLoad(b2, "load"));
    else if (k === "config") openOverlay("設定", buildConfig);
    else if (k === "fs") fsButtonAction();
    else if (k === "hide") dom.win.classList.toggle("window-hidden");
    else if (k === "title") {
      if (confirm("タイトルへ戻ります。セーブしていない進行は失われます。")) {
        state.running = false; state.runId++; state.auto = state.skip = false; updateCtl();
        clearTimeout(autoTimer); clearInterval(typeTimer);
        fade("dark").then(() => { showScreen("title"); refreshTitle(); fade(null); });
      }
    }
  });

  // ---------- 入力 ----------
  dom.play.addEventListener("click", (e) => {
    if (!dom.overlay.classList.contains("hidden")) return;
    if (e.target.closest("#control-bar") || e.target.closest("#choice-layer") || e.target.closest("#ending-card")) return;
    if (dom.win.classList.contains("window-hidden")) { dom.win.classList.remove("window-hidden"); return; }
    state.auto = false; updateCtl();
    advance();
  });
  document.addEventListener("keydown", (e) => {
    if (dom.play.classList.contains("hidden")) return;
    if (!dom.overlay.classList.contains("hidden")) { if (e.key === "Escape") closeOverlay(); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.auto = false; updateCtl(); advance(); }
    if (e.key === "Control") { state.skip = true; updateCtl(); if (state.waitingClick) advance(); }
    if (e.key === "Escape") dom.win.classList.toggle("window-hidden");
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Control") { state.skip = false; updateCtl(); }
  });

  // ---------- リソースのプリロード ----------
  const preloaded = new Set();
  function prefetch(urls, awaitImages) {
    const waits = [];
    for (const u of urls) {
      if (!u || preloaded.has(u)) continue;
      preloaded.add(u);
      if (/\.(jpg|jpeg|png|webp|svg)$/i.test(u)) {
        const im = new Image();
        if (awaitImages) waits.push(new Promise((r) => { im.onload = im.onerror = r; }));
        im.src = u;
      } else { // 音声はメタデータだけ先読み(本体はストリーミング)
        const a = new Audio(); a.preload = "auto"; a.src = u;
      }
    }
    return Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 2500))]);
  }
  // シナリオの先(fromIdx以降count件)で使うアセットURLを集める
  function collectAssets(sid, fromIdx, count) {
    const urls = [];
    const cmds = VN.scenarios[sid] || [];
    const end = Math.min(cmds.length, fromIdx + count);
    for (let i = fromIdx; i < end; i++) {
      const c = cmds[i]; if (!c) continue;
      if (c.bg) urls.push(`assets/backgrounds/${c.bg}.jpg`);
      if (c.cg) urls.push(`assets/cg/${c.cg}.jpg`);
      if (c.chara) (Array.isArray(c.chara) ? c.chara : [c.chara]).forEach((it) => { if (it.id) urls.push(spritePath(it.id, it.expr)); });
      if (c.who && c.expr) urls.push(spritePath(c.who, c.expr));   // セリフ行の表情差分も先読み対象に
      if (c.bgm) urls.push(`assets/audio/bgm/${c.bgm}.mp3`);
      if (c.se) urls.push(`assets/audio/se/${c.se}.mp3`);
    }
    return urls;
  }

  // ---------- 章単位プリロード ----------
  // 章で使う全アセット(背景/CG/立ち絵=chara指定＆セリフのwho+expr差分/BGM/SE)を集める
  function collectChapterAssets(sid) {
    return collectAssets(sid, 0, (VN.scenarios[sid] || []).length);
  }
  // 黒画面/章カード上に出す簡易ローディング表示(章プリロード待ち用)
  let preloadInd = null;
  function setPreloadIndicator(on, ratio) {
    if (on) {
      if (!preloadInd) {
        preloadInd = document.createElement("div");
        preloadInd.id = "preload-ind";
        preloadInd.style.cssText = "position:absolute;inset:0;z-index:58;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#000;color:#cbb7e8;font-size:14px;letter-spacing:.12em;opacity:0;transition:opacity .25s;pointer-events:none;";
        preloadInd.innerHTML = '<div>読み込み中…</div><div style="width:180px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden;"><div class="pl-fill" style="height:100%;width:0;background:#9a8cb8;transition:width .15s;"></div></div>';
        dom.game.appendChild(preloadInd);
      }
      preloadInd.style.opacity = "1";
      const f = preloadInd.querySelector(".pl-fill");
      if (f) f.style.width = Math.min(100, Math.round((ratio || 0) * 100)) + "%";
    } else if (preloadInd) {
      preloadInd.style.opacity = "0";
    }
  }
  // 章の全アセットを先読みして待つ。ロード/チャプター選択/章切り替え時に使う
  // (このタイミングは待ちが発生してOK)。固まり防止に画像個別・全体の上限を設ける。
  async function preloadChapter(sid, opts) {
    opts = opts || {};
    const urls = collectChapterAssets(sid).filter((u) => u && !preloaded.has(u));
    if (!urls.length) return;
    urls.forEach((u) => preloaded.add(u));
    let done = 0; const total = urls.length;
    if (opts.indicator) setPreloadIndicator(true, 0);
    const waits = urls.map((u) => new Promise((res) => {
      const isImg = /\.(jpg|jpeg|png|webp|svg)$/i.test(u);
      const el = isImg ? new Image() : new Audio();
      if (!isImg) el.preload = "auto";
      let fired = false;
      const fin = () => { if (fired) return; fired = true; done++; if (opts.indicator) setPreloadIndicator(true, done / total); res(); };
      el.onload = fin; el.onerror = fin;
      if (!isImg) { el.oncanplaythrough = fin; el.onloadeddata = fin; setTimeout(fin, 3000); }
      else setTimeout(fin, 10000); // 画像個別の保険(読めなくても進める)
      el.src = u;
    }));
    await Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 30000))]); // 全体30s上限
    if (opts.indicator) setPreloadIndicator(false);
  }

  // 指定位置より前に最後に設定された背景IDを遡って探す。
  // シーン選択で「自前の{bg}を持たず前シーンの背景を引き継ぐシーン」(例:クロセル覚醒)から
  // 直接開始した時に、背景が無く黒画面になるのを防ぐ。
  function lastBgBefore(sid, idx) {
    const cmds = VN.scenarios[sid] || [];
    for (let i = Math.min(idx, cmds.length) - 1; i >= 0; i--) {
      const c = cmds[i];
      if (c && c.bg !== undefined && c.bg) return c.bg;
    }
    return null;
  }
  // 直近の {bgm} 指定を遡る。BGM未設定シーンからロード/シーン選択した時の無音を防ぐ。
  // 戻り値: BGM id(継承) / null(直近で意図的に停止) / undefined(指定が一つも無い)
  function lastBgmBefore(sid, idx) {
    const cmds = VN.scenarios[sid] || [];
    for (let i = Math.min(idx, cmds.length) - 1; i >= 0; i--) {
      const c = cmds[i];
      if (c && c.bgm !== undefined) return c.bgm;
    }
    return undefined;
  }

  // ---------- 開始処理 ----------
  async function startFrom(entry) {
    state.runId++;
    await fade("dark");
    clearStage();
    showScreen("play");
    state.flags = {}; state.log = []; pageHistory = [];
    stopAllBgm();                    // 新規開始時はタイトルBGMを即時に確実停止(iOSのフェード不成立対策)
    state.auto = state.skip = false; updateCtl();
    gotoLabel(entry);
    // シーン選択で途中シーンから開始した際、そのシーンが背景を引き継ぐ前提で{bg}を
    // 持たない事がある。直前の背景を遡って適用し、黒画面を防ぐ(その後シーン側{bg}が上書き)。
    const inhBg = lastBgBefore(state.sid, state.idx);
    if (inhBg) setBg(inhBg, true);
    // BGMも同様に継承(未設定シーンから開始した時の無音を防ぐ)。直近{bgm}がidなら再生、停止/無指定は無音のまま。
    const inhBgm = lastBgmBefore(state.sid, state.idx);
    if (inhBgm) playBgm(inhBgm);
    // 開幕直後に出る立ち絵だけ軽く先読みデコードしてから明ける(2x化で重い全章awaitはしない)。
    // BGMは上の継承再生＋step()内のシーン{bgm}で鳴るので、先読みには引きずられない。
    const head = collectUpcomingSprites(state.sid, state.idx, 6);
    await Promise.race([Promise.all(head.map(predecodeSprite)), new Promise((r) => setTimeout(r, 2000))]);
    fade(null);
    step();
    // ※章全体の一括先読みはしない(帯域占有でBGM等が遅延する為)。先はstep()の前方プリフェッチで読む。
  }

  function latestAutosave() {
    const saves = store.get("saves", {});
    return Object.values(saves).length ? true : false;
  }
  function refreshTitle() {
    $("btn-continue").disabled = !latestAutosave();
    playBgm("title");
  }

  $("btn-newgame").onclick = () => startFrom(VN.chapters.length ? VN.chapters[0].entry : "ch01:");
  $("btn-continue").onclick = () => openOverlay("ロード", (b) => buildSaveLoad(b, "load"));
  $("btn-chapter").onclick = () => openOverlay("チャプター選択", buildChapterList);
  $("btn-endings").onclick = () => openOverlay("エンディングリスト", buildEndingList);
  $("btn-gallery").onclick = () => openOverlay("ギャラリー", buildGallery);
  $("btn-config-title").onclick = () => openOverlay("設定", buildConfig);
  $("btn-fs-title").onclick = () => fsButtonAction();
  $("btn-quit").onclick = () => quitGame();
  $("btn-original").onclick = () => window.open("https://ncode.syosetu.com/n1181ew/", "_blank", "noopener");
  applyFsButtons();   // 全画面対応端末(PC/Android)でのみ全画面ボタンを表示

  // ---------- 起動ゲート(初回タップで音声解放 + 初期プリロード) ----------
  let bootReady = false;   // 初期プリロード完了までは「タップして開始」を無効化する
  function bootPreload() {
    // タイトル画像と第1章序盤・各エンディングで使う代表アセットを先読み
    const urls = ["assets/ui/title.jpg"];
    const firstCh = VN.chapters.length ? VN.chapters[0].id : "ch01";
    urls.push(...collectAssets(firstCh, 0, 60));
    const bar = document.querySelector(".boot-load-bar");
    const txt = document.querySelector(".boot-load-text");
    let done = 0, finished = false;
    const total = urls.length || 1;
    function render() { if (bar) bar.style.width = Math.min(100, Math.round(done / total * 100)) + "%"; }
    function finish() {
      if (finished) return; finished = true;
      if (bar) bar.style.width = "100%"; if (txt) txt.textContent = "準備完了";
      bootReady = true;                         // ここで初めて「タップして開始」を許可
      const g = document.getElementById("boot-gate"); if (g) g.classList.add("ready");
    }
    function tick() { done++; render(); if (done >= total) finish(); }
    urls.forEach((u) => {
      if (preloaded.has(u)) { tick(); return; }
      preloaded.add(u);
      const isImg = /\.(jpg|jpeg|png|webp|svg)$/i.test(u);
      const el = isImg ? new Image() : new Audio();
      if (!isImg) el.preload = "auto";
      let counted = false;
      const once = () => { if (counted) return; counted = true; tick(); };
      el.onload = once; el.onerror = once;
      // iOSは音声のcanplaythroughがユーザー操作前に発火しない事があるので、早めのイベント＋タイマーで保険
      if (!isImg) { el.oncanplaythrough = once; el.onloadeddata = once; setTimeout(once, 2500); }
      else { setTimeout(once, 5000); } // 画像も読めない時にバーを止めない為の保険
      el.src = u;
    });
    render();
    setTimeout(finish, 6000); // 全体の最終保険: 何があっても6秒で「準備完了」にする(読み込み中で固まらない)
  }
  function openGate() {
    const gate = $("boot-gate");
    if (!gate || gate.classList.contains("gone")) return;
    if (!bootReady) return;   // プリロード未完了なら開始しない(読み込み完了まで待つ)
    unlockAudio();        // 音声解放(以後BGM/SEが鳴る)
    if (config.fullscreen) enterFs();   // 初回タップ(ユーザー操作)内で全画面化
    refreshTitle();       // タイトルBGMを再生
    gate.classList.add("gone");
    setTimeout(() => gate.classList.add("hidden"), 600);
  }
  const gateEl = $("boot-gate");
  // pointerdownでは音声を先に解放(ジェスチャ内での解放が確実)。ゲートはまだ閉じない。
  gateEl.addEventListener("pointerdown", () => unlockAudio());
  // 実際の開始(ゲートを閉じる)はタップ完了=clickで行い、同じタップが下のタイトルUIへ
  // 貫通しないよう preventDefault + stopPropagation で確実に消費する。
  gateEl.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openGate(); });

  // ---------- 初期化 ----------
  window.addEventListener("beforeunload", () => store.set("seen", state.seen));
  // iOS等で着信/スリープ/他アプリ復帰後にループBGMが止まったまま戻らない対策＋離脱時の既読保存
  // (iOSはbeforeunloadが発火しない事があるため visibilitychange/pagehide でも保存する)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (audio.cur && audio.cur.paused && audio.bgmId) audio.cur.play().catch(() => {});
    } else {
      store.set("seen", state.seen);
    }
  });
  window.addEventListener("pagehide", () => store.set("seen", state.seen));
  fitFont();
  refreshTitle();       // pendingBgmにtitleを積む(解放は起動ゲートのタップ後)
  bootPreload();
})();
