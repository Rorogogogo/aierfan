(() => {
  'use strict';
  const defaults = { blockAds: true, bestQuality: true };
  let settings = { ...defaults };
  let state = { scheduler: 'waiting', blocked: 0, quality: '等待视频', error: '' };
  let totalBlocked = 0;
  let lastBlocked = 0;
  let toastTimer;
  let view;
  const notify = () => window.dispatchEvent(new CustomEvent('kubb-helper:settings', {
    detail: JSON.stringify(settings)
  }));
  function showToast() {
    if (!view) return;
    const toast = view.querySelector('#toast');
    if (!toast) return;
    toast.textContent = `已拦截广告 · 累计拦截 ${totalBlocked} 次`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
  function render() {
    if (!view) return;
    view.querySelector('#preview').hidden = !location.pathname.startsWith('/user');
    view.querySelector('#ads').checked = settings.blockAds;
    view.querySelector('#quality').checked = settings.bestQuality;
    const scheduler = { ready: '广告拦截已就绪', waiting: '等待 Kubb 广告模块', unsupported: 'Kubb 已更新：广告钩子不可用' };
    view.querySelector('#status').textContent = `${scheduler[state.scheduler] || '广告状态未知'} · 本次已拦截 ${state.blocked} 次`;
    view.querySelector('#total').textContent = `累计拦截 ${totalBlocked} 次`;
    view.querySelector('#stream').textContent = state.quality;
    const video = [...document.querySelectorAll('video')].find(v => v.videoWidth && v.videoHeight);
    view.querySelector('#decoded').textContent = video ?
      `实际画面：${video.videoWidth} × ${video.videoHeight}` : '实际画面：等待解码帧';
    view.querySelector('#error').textContent = state.error;

  }
  window.addEventListener('kubb-helper:status', event => {
    try {
      const data = JSON.parse(event.detail);
      // Only display bounded text from the page; no HTML or privileged commands.
      state = {
        scheduler: String(data.scheduler || '').slice(0, 40),
        blocked: Math.max(0, Number(data.blocked) || 0),
        quality: String(data.quality || '').slice(0, 140),
        error: String(data.error || '').slice(0, 180)
      };
      // blocked is a per-page-session count from the MAIN-world script; accumulate the
      // increments into a persistent all-time total and announce each new block.
      const delta = state.blocked - lastBlocked;
      lastBlocked = state.blocked;
      if (delta > 0) {
        totalBlocked += delta;
        chrome.storage.local.set({ totalBlocked }).catch(() => {});
        showToast();
      }
      render();
    } catch { /* Ignore malformed messages. */ }
  });
  chrome.storage.local.get({ ...defaults, totalBlocked: 0 }).then(saved => {
    settings = { blockAds: saved.blockAds !== false, bestQuality: saved.bestQuality !== false };
    totalBlocked = Math.max(0, Number(saved.totalBlocked) || 0);
    notify(); render();
  }).catch(() => notify());
  function mount() {
    if (document.getElementById('kubb-helper-panel')) return;
    const host = document.createElement('div');
    host.id = 'kubb-helper-panel';
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647';
    view = host.attachShadow({ mode: 'closed' });
    view.innerHTML = `<style>
      :host{all:initial;color-scheme:dark} details{font:13px/1.5 system-ui,sans-serif;color:#eee;background:#171922;border:1px solid #424553;border-radius:12px;box-shadow:0 8px 30px #0006;width:280px}
      summary{cursor:pointer;padding:10px 14px;font-weight:650}section{padding:0 14px 12px}label{display:flex;gap:8px;align-items:center;margin:9px 0}input{accent-color:#a8bbff}p{margin:6px 0;color:#c4c9d9;font-size:12px}#error{color:#ffbb99}button{font:inherit;background:#303548;color:#eee;border:1px solid #596079;border-radius:5px;padding:4px 8px;cursor:pointer}
      .toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%) translateY(8px);background:rgba(23,25,34,.94);color:#eee;border:1px solid #424553;border-radius:10px;padding:10px 16px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px #0008;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;max-width:80vw;text-align:center}
      .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    </style><div id="toast" class="toast" role="status" aria-live="polite"></div><details><summary>爱亦帆助手 · 实验版</summary><section>
      <label><input type="checkbox" id="ads">拦截视频中插广告</label>
      <label><input type="checkbox" id="quality">优先选择最高画质</label>
      <p id="status" role="status"></p><p id="total"></p><p id="stream"></p><p id="decoded"></p><p id="error"></p>
      <p>画质取决于你的账号实际收到的流。若广告正在播放，更改拦截开关后请刷新页面。</p>
      <button id="copy">复制测试报告</button>
      <button id="preview" hidden>预览金币显示（仅本地）</button><p id="preview-status" role="status"></p>
    </section></details>`;
    for (const [id, key] of [['ads', 'blockAds'], ['quality', 'bestQuality']]) {
      view.querySelector(`#${id}`).addEventListener('change', event => {
        settings[key] = event.target.checked;
        chrome.storage.local.set(settings).catch(() => {});
        notify(); render();
      });
    }
    let coinPreview = null;
    view.querySelector('#preview').addEventListener('click', event => {
      const notice = view.querySelector('#preview-status');
      if (coinPreview) {
        if (coinPreview.node.isConnected) coinPreview.node.textContent = coinPreview.original;
        coinPreview.label.remove();
        coinPreview = null;
        event.target.textContent = '预览金币显示（仅本地）';
        notice.textContent = '已恢复原始显示。';
        return;
      }
      const balance = document.querySelector('app-user-center .new-profile [title="金币"]');
      const node = balance && [...balance.childNodes].find(node =>
        node.nodeType === Node.TEXT_NODE && /^\s*\d[\d,]*(?:\.\d+)?\s*$/.test(node.textContent));
      if (!node) {
        notice.textContent = '请打开账号页面并等待余额加载。';
        return;
      }
      const original = node.textContent;
      const label = document.createElement('small');
      label.textContent = '（仅本地预览）';
      label.style.cssText = 'color:#ffbb99;margin-left:6px';
      node.textContent = ' 99999 ';
      balance.append(label);
      coinPreview = {node, original, label};
      notice.textContent = `仅显示效果。修改前：${original.trim()}。刷新即可还原。未向账号发送任何请求。`;
      event.target.textContent = '恢复原始金币显示';
    });
    view.querySelector('#copy').addEventListener('click', async event => {
      const videos = [...document.querySelectorAll('video')].map(v => ({
        width: v.videoWidth, height: v.videoHeight, time: Math.round(v.currentTime),
        paused: v.paused, error: v.error?.code || null
      }));
      try {
        await navigator.clipboard.writeText(JSON.stringify({ version: '0.1.0', settings, state, totalBlocked, videos }, null, 2));
        event.target.textContent = '已复制';
      } catch { event.target.textContent = '剪贴板不可用'; }
    });
    document.body.append(host);
    render(); notify();
    window.dispatchEvent(new CustomEvent('kubb-helper:request'));
  }
  document.addEventListener('loadedmetadata', render, true);
  document.addEventListener('resize', render, true);
  document.addEventListener('playing', render, true);
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
