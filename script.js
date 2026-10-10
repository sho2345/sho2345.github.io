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
