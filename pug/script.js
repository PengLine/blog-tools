const inputEl = document.getElementById('pug-input');
const outputEl = document.getElementById('pug-output');
const outputLines = document.getElementById('output-lines');
const inputLines = document.getElementById('input-lines');
const errorList = document.getElementById('error-list');
const errorPanel = document.getElementById('error-panel');
const errorCount = document.getElementById('error-count');

function showStatus(ok, msg) {
    const badge = document.getElementById('status-badge');
    badge.textContent = msg;
    badge.style.background = ok ? '#ecfdf5' : '#fef2f2';
    badge.style.color = ok ? '#059669' : '#dc2626';
}

function clearError() {
    errorList.innerHTML = '';
    errorPanel.style.display = 'none';
}

function clearOutput() {
    outputEl.textContent = '';
    outputLines.innerHTML = '';
    clearError();
    showStatus(true, '等待输入');
}

function updateLineNumbers(text) {
    const lines = text.split('\n');
    outputLines.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
}

function updateInputLines() {
    const lines = inputEl.value.split('\n');
    inputLines.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
}

inputEl.addEventListener('input', updateInputLines);
inputEl.addEventListener('scroll', () => {
    inputLines.scrollTop = inputEl.scrollTop;
});

function formatPug() {
    const input = inputEl.value.trimEnd();
    if (!input.trim()) {
        clearOutput();
        return;
    }

    try {
        pug.compile(input);
        const formatted = pugBeautify(input, { fill_tab: false, tab_size: 2 });
        outputEl.textContent = formatted;
        updateLineNumbers(formatted);
        clearError();
        showStatus(true, 'Pug 格式正确');
    } catch (e) {
        outputEl.textContent = '';
        updateLineNumbers('');
        showError(e, input);
        showStatus(false, 'Pug 格式错误');
    }
}

function showError(e, input) {
    const lines = input.split('\n');

    const line = e.line || 1;
    const col = e.column || 1;
    const lineIdx = line - 1;
    const colIdx = col - 1;
    const startLine = Math.max(0, lineIdx - 2);
    const endLine = Math.min(lines.length, lineIdx + 3);

    const msg = e.message || String(e);

    let html = `<div class="error-item">
        <span class="error-icon">✕</span>
        <div class="error-detail">
            <div><span class="error-line">第 ${line} 行，第 ${col} 列</span></div>
            <div style="margin: 6px 0;">${escapeHtml(msg.split('\n\n')[0])}</div>
            <div style="background:#f8fafc;border-radius:6px;padding:8px 12px;margin-top:6px;font-family:monospace;font-size:12px;">`;

    for (let i = startLine; i < endLine; i++) {
        const bg = i === lineIdx ? '#fef2f2' : 'transparent';
        const prefix = i === lineIdx ? '→ ' : '  ';
        html += `<div style="background:${bg};padding:1px 0;">${prefix}${String(i + 1).padStart(2)}: ${escapeHtml(lines[i] || '')}</div>`;
        if (i === lineIdx && colIdx > 0) {
            html += `<div style="color:#ef4444;padding-left:48px;">${' '.repeat(colIdx)}^</div>`;
        }
    }

    html += `</div></div></div>`;
    errorList.innerHTML = html;
    errorPanel.style.display = 'block';
    errorCount.textContent = '1 个错误';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function validatePug() {
    const input = inputEl.value.trimEnd();
    if (!input.trim()) {
        clearOutput();
        return;
    }

    try {
        pug.compile(input);
        clearError();
        showStatus(true, 'Pug 语法正确，无错误');
    } catch (e) {
        outputEl.textContent = '';
        updateLineNumbers('');
        showError(e, input);
        showStatus(false, 'Pug 语法错误');
    }
}

function minifyPug() {
    const input = inputEl.value.trimEnd();
    if (!input.trim()) return;
    try {
        pug.compile(input);
        const formatted = pugBeautify(input, { fill_tab: false, tab_size: 2 });
        const minified = formatted.replace(/\n{2,}/g, '\n').trim();
        outputEl.textContent = minified;
        updateLineNumbers(minified);
        clearError();
        showStatus(true, 'Pug 已压缩');
    } catch (e) {
        showError(e, input);
        showStatus(false, 'Pug 格式错误');
    }
}

function copyOutput() {
    const text = outputEl.textContent.trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showStatus(true, '已复制到剪贴板'));
}

function clearAll() {
    inputEl.value = '';
    updateInputLines();
    clearOutput();
    showStatus(true, '等待输入');
}

function loadSample() {
    inputEl.value = `//- 示例 Pug 模板
doctype html
html(lang="zh-CN")
  head
    meta(charset="UTF-8")
    title 我的页面
    link(rel="stylesheet" href="style.css")
  body
    header#main-header
      nav.navbar
        a.logo(href="/") 首页
        ul.nav-links
          li: a(href="/about") 关于
          li: a(href="/contact") 联系
    main.content
      section.hero
        h1 欢迎来到我的网站
        p.description 这是一个用 Pug 编写的示例页面。
      section.features
        .feature-card
          h3 快速
          p 极速加载体验
        .feature-card
          h3 简洁
          p 精简代码表达`;
    updateInputLines();
    formatPug();
}
