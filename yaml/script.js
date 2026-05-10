const inputEl = document.getElementById('yaml-input');
const outputEl = document.getElementById('yaml-output');
const outputLines = document.getElementById('output-lines');
const errorList = document.getElementById('error-list');
const errorPanel = document.getElementById('error-panel');
const errorCount = document.getElementById('error-count');

function showStatus(ok, msg) {
    const badge = document.getElementById('status-badge');
    badge.textContent = msg;
    badge.style.background = ok ? '#ecfdf5' : '#fef2f2';
    badge.style.color = ok ? '#059669' : '#dc2626';
}

function clearOutput() {
    outputEl.textContent = '';
    outputLines.innerHTML = '';
    errorList.innerHTML = '';
    errorPanel.style.display = 'none';
    showStatus(true, '等待输入');
}

function updateLineNumbers(text) {
    const lines = text.split('\n');
    outputLines.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
}

function formatYaml() {
    const input = inputEl.value.trim();
    if (!input) {
        clearOutput();
        return;
    }

    try {
        const doc = YAML.parseDocument(input);
        if (doc.errors.length > 0) {
            throw doc.errors[0];
        }
        const formatted = doc.toString({ lineWidth: 0, minContentWidth: 0 });

        outputEl.textContent = formatted;
        updateLineNumbers(formatted);
        errorList.innerHTML = '';
        errorPanel.style.display = 'none';
        showStatus(true, 'YAML 格式正确');
    } catch (e) {
        outputEl.textContent = '';
        updateLineNumbers('');
        showError(e, input);
        showStatus(false, 'YAML 格式错误');
    }
}

function showError(e, input) {
    const lines = input.split('\n');

    // yaml@2 YAMLParseError has linePos array with {line, col}
    let line = 0, col = 0;
    if (e.linePos && e.linePos.length > 0) {
        line = e.linePos[0].line;
        col = e.linePos[0].col;
    } else if (e.mark) {
        // js-yaml style fallback
        line = e.mark.line;
        col = e.mark.column;
    }

    const lineNum = line + 1;
    const colNum = col + 1;

    const startLine = Math.max(0, line - 2);
    const endLine = Math.min(lines.length, line + 3);

    let html = `<div class="error-item">
        <span class="error-icon">✕</span>
        <div class="error-detail">
            <div><span class="error-line">第 ${lineNum} 行，第 ${colNum} 列</span></div>
            <div style="margin: 6px 0;">${escapeHtml(e.message)}</div>
            <div style="background:#f8fafc;border-radius:6px;padding:8px 12px;margin-top:6px;font-family:monospace;font-size:12px;">`;

    for (let i = startLine; i < endLine; i++) {
        const bg = i === line ? '#fef2f2' : 'transparent';
        const prefix = i === line ? '→ ' : '  ';
        html += `<div style="background:${bg};padding:1px 0;">${prefix}${String(i + 1).padStart(2)}: ${escapeHtml(lines[i] || '')}</div>`;
        if (i === line && col > 0) {
            html += `<div style="color:#ef4444;padding-left:48px;">${' '.repeat(col)}^</div>`;
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

function validateYaml() {
    const input = inputEl.value.trim();
    if (!input) {
        clearOutput();
        return;
    }

    try {
        const doc = YAML.parseDocument(input);
        if (doc.errors.length > 0) {
            throw doc.errors[0];
        }
        errorList.innerHTML = '';
        errorPanel.style.display = 'none';
        showStatus(true, 'YAML 格式正确，无错误');
    } catch (e) {
        outputEl.textContent = '';
        updateLineNumbers('');
        showError(e, input);
        showStatus(false, 'YAML 格式错误');
    }
}

function minifyYaml() {
    const input = inputEl.value.trim();
    if (!input) return;
    try {
        const doc = YAML.parseDocument(input);
        if (doc.errors.length > 0) {
            throw doc.errors[0];
        }
        // minify: no comments, compact flow style
        const minified = doc.toString({ lineWidth: 0, minContentWidth: 0, indent: 0 });
        outputEl.textContent = minified;
        updateLineNumbers(minified);
        errorList.innerHTML = '';
        errorPanel.style.display = 'none';
        showStatus(true, 'YAML 已压缩');
    } catch (e) {
        showError(e, input);
        showStatus(false, 'YAML 格式错误');
    }
}

function copyOutput() {
    const text = outputEl.textContent.trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showStatus(true, '已复制到剪贴板'));
}

function clearAll() {
    inputEl.value = '';
    clearOutput();
    showStatus(true, '等待输入');
}

function loadSample() {
    inputEl.value = `# 示例 YAML 配置
server:
  host: localhost
  port: 8080
  tls: true

# 数据库连接配置
database:
  driver: postgresql
  host: db.example.com
  port: 5432
  name: myapp
  pool:
    min: 5
    max: 20

# 日志与监控
logging:
  level: info
  outputs:
    - console
    - file:/var/log/myapp.log

# 功能开关
features:
  caching: true
  rate_limiting:
    enabled: true
    max_requests: 100
    window_seconds: 60
  experimental: false`;
    formatYaml();
}
