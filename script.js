// 言語切り替え（EN / JP）
// 仕組み: 翻訳対象の要素に data-lang="en" / data-lang="ja" を付け、
// <html lang> の値に応じて CSS で片方を非表示にする。
// 画像の alt は data-alt-en / data-alt-ja から JS で差し替える。
(function () {
    var STORAGE_KEY = 'lang';
    var SUPPORTED = ['en', 'ja'];

    // 保存済みの言語を取得（失敗時・未保存時は英語）
    function getSavedLang() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (SUPPORTED.indexOf(saved) !== -1) {
                return saved;
            }
        } catch (e) {
            // localStorage が使えない環境では無視する
        }
        return 'en';
    }

    // 言語を保存
    function saveLang(lang) {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            // 保存できなくても表示の切り替えは行う
        }
    }

    // 画像の alt とボタンの選択状態を更新
    function updateDom(lang) {
        var imgs = document.querySelectorAll('[data-alt-' + lang + ']');
        for (var i = 0; i < imgs.length; i++) {
            imgs[i].setAttribute('alt', imgs[i].getAttribute('data-alt-' + lang));
        }
        var buttons = document.querySelectorAll('.lang-btn');
        for (var j = 0; j < buttons.length; j++) {
            var active = buttons[j].getAttribute('data-set-lang') === lang;
            buttons[j].classList.toggle('active', active);
            buttons[j].setAttribute('aria-pressed', active ? 'true' : 'false');
        }
    }

    // 言語を適用
    function applyLang(lang) {
        document.documentElement.setAttribute('lang', lang);
        if (document.body) {
            updateDom(lang);
        }
    }

    // 描画前に <html lang> を設定してちらつきを防ぐ
    applyLang(getSavedLang());

    document.addEventListener('DOMContentLoaded', function () {
        updateDom(document.documentElement.getAttribute('lang'));
        var buttons = document.querySelectorAll('.lang-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                var lang = this.getAttribute('data-set-lang');
                applyLang(lang);
                saveLang(lang);
            });
        }
    });
})();

// セクションの折りたたみ（アコーディオン）
// - JS 有効時のみ <html> に js クラスを付けて折りたたむ（無効時は全展開のまま）
// - マウス環境: 見出しに少し留まると開き、セクションからマウスが離れると閉じる
// - タップ / キーボード（Enter / Space）では開閉を切り替える
// - ヘッダーのナビから移動したときは該当セクションを開いてからスクロールする
(function () {
    var HOVER_DELAY = 140;        // ホバーで開くまでの待ち時間（素通りでは開かない）
    var SCROLL_GUARD = 200;       // スクロール直後はホバーで開かない

    document.documentElement.classList.add('js');

    var canHover = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
    var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var lastScroll = 0;

    function setOpen(fold, open) {
        fold.classList.toggle('is-open', open);
        var btn = fold.querySelector('.fold-btn');
        if (btn) {
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
    }

    function isOpen(fold) {
        return fold.classList.contains('is-open');
    }

    // id からセクションを取得（折りたたみ対象でなければ null）
    function getFold(id) {
        if (!id) {
            return null;
        }
        var el = document.getElementById(id);
        return el && el.classList.contains('fold') ? el : null;
    }

    // アニメーションなしで開く（直後にスクロール位置を計算するため）
    function openInstantly(fold) {
        fold.classList.add('is-instant');
        setOpen(fold, true);
        void fold.offsetHeight; // レイアウトを確定させる
        requestAnimationFrame(function () {
            fold.classList.remove('is-instant');
        });
    }

    function scrollToEl(el) {
        el.scrollIntoView({
            behavior: reduceMotion && reduceMotion.matches ? 'auto' : 'smooth',
            block: 'start'
        });
    }

    // マウスでホバー操作できる環境か
    function isMouse(e) {
        return e.pointerType === 'mouse' && canHover && canHover.matches;
    }

    function setupFold(fold) {
        var btn = fold.querySelector('.fold-btn');
        var timer = null;

        setOpen(fold, false);

        btn.addEventListener('click', function () {
            // マウスで乗っている間はホバーで開閉するため、クリックは「開く」だけにする
            if (canHover && canHover.matches && fold.matches(':hover')) {
                setOpen(fold, true);
                return;
            }
            setOpen(fold, !isOpen(fold));
        });

        // 実際にマウスを動かしたときだけホバー判定を始める
        btn.addEventListener('pointermove', function (e) {
            if (!isMouse(e) || isOpen(fold) || timer || Date.now() - lastScroll < SCROLL_GUARD) {
                return;
            }
            timer = setTimeout(function () {
                timer = null;
                setOpen(fold, true);
            }, HOVER_DELAY);
        });

        btn.addEventListener('pointerleave', function () {
            clearTimeout(timer);
            timer = null;
        });

        // セクション（見出し + 詳細）からマウスが出たら閉じる
        fold.addEventListener('pointerleave', function (e) {
            if (isMouse(e)) {
                setOpen(fold, false);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var folds = document.querySelectorAll('.fold');
        for (var i = 0; i < folds.length; i++) {
            setupFold(folds[i]);
        }

        window.addEventListener('scroll', function () {
            lastScroll = Date.now();
        }, { passive: true });

        // ページ内リンク: 対象セクションを開いてからスクロール
        var links = document.querySelectorAll('a[href^="#"]');
        for (var j = 0; j < links.length; j++) {
            links[j].addEventListener('click', function (e) {
                var fold = getFold(this.getAttribute('href').slice(1));
                if (!fold) {
                    return;
                }
                e.preventDefault();
                openInstantly(fold);
                if (location.hash !== '#' + fold.id) {
                    history.pushState(null, '', '#' + fold.id);
                }
                scrollToEl(fold);
            });
        }

        // 戻る / 進むでハッシュが変わったときも開く
        window.addEventListener('hashchange', function () {
            var fold = getFold(location.hash.slice(1));
            if (fold) {
                openInstantly(fold);
            }
        });

        // URL にハッシュ付きで開かれた場合はそのセクションを開いておく
        var initial = getFold(location.hash.slice(1));
        if (initial) {
            openInstantly(initial);
            initial.scrollIntoView({ block: 'start' });
        }
    });
})();
