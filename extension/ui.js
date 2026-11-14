(() => {
  'use strict';
  const shield = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="m12 2 8 3v5.5c0 5.2-3.4 8.9-8 11.5-4.6-2.6-8-6.3-8-11.5V5l8-3Zm-2 6v8l6.7-4L10 8Z"/></svg>';
  const styles = `
    :host{all:initial;color-scheme:dark;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;color:#d9dce7;-webkit-font-smoothing:antialiased}
    *,*::before,*::after{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit}svg{width:16px;height:16px;flex-shrink:0}
    .card{width:248px;max-width:calc(100vw - 24px);background:#181a23;border:1px solid #ffffff12;border-radius:10px;overflow:hidden;box-shadow:0 8px 24px #0004;text-align:left}
    .header{display:flex;align-items:center;gap:7px;padding:12px 13px 10px}.mark{display:grid;place-items:center;color:#ffffff}.brand{font-size:13px;font-weight:650;letter-spacing:-.2px;color:#ececf4}
    .status{margin-left:auto;display:flex;align-items:center;gap:5px;font-size:10px;color:#999eaf;white-space:nowrap}.dot{width:5px;height:5px;border-radius:50%;background:#73798c;flex-shrink:0}.status[data-tone=ready]{color:#90bfae}.status[data-tone=ready] .dot{background:#76b79d}.status[data-tone=warning]{color:#dfb977}.status[data-tone=warning] .dot{background:#dfb977}
    .metrics{display:grid;grid-template-columns:1fr 1fr;margin:0 13px;padding:0 0 11px;gap:12px}.metric{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.metric+.metric{border-left:1px solid #ffffff10;padding-left:12px}.metric-label{color:#969bac;font-size:10px;white-space:nowrap}.number{font-size:18px;line-height:1.2;font-weight:600;letter-spacing:-.4px;color:#e1e3ef;font-variant-numeric:tabular-nums}.unit{font-size:10px;font-weight:400;color:#8c91a3;letter-spacing:0;margin-left:3px}
    .control{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border-top:1px solid #ffffff0d;cursor:pointer}.control-title{font-size:11px;font-weight:500;color:#cfd2df}.control-note{font-size:10px;color:#dfb977;margin-top:3px}.switch{position:relative;display:inline-flex;width:30px;height:18px;flex-shrink:0}.switch input{position:absolute;inset:-3px;width:36px;height:24px;margin:0;opacity:0;cursor:pointer}.track{width:30px;height:18px;border-radius:20px;background:#444856;pointer-events:none}.track::after{content:"";display:block;width:12px;height:12px;background:#ecebf8;border-radius:50%;margin:3px}.switch input:checked+.track{background:#7970d9}.switch input:checked+.track::after{transform:translateX(12px)}.switch input:focus-visible+.track{outline:2px solid #b0a9ff;outline-offset:3px}.switch input:disabled{cursor:wait}
    .footer{border-top:1px solid #ffffff0d;padding:8px 13px;color:#969bac;font-size:10px;display:flex;align-items:center;justify-content:space-between;gap:8px}.footer a{color:#b0a9ff;text-decoration:none;white-space:nowrap}.footer a:focus-visible{outline:2px solid #b0a9ff;outline-offset:3px;border-radius:2px}
    .message{font-size:10px;color:#a1a6b7;padding:0 13px 10px;margin:0;line-height:1.7}.message:empty{display:none}
    details{position:relative}summary{display:flex;align-items:center;gap:6px;list-style:none;cursor:pointer;padding:6px 9px;border:1px solid #ffffff18;border-radius:8px;background:#181a23;box-shadow:0 2px 10px #0003;font-size:11px;font-weight:500;color:#c8cbda;width:max-content;margin-left:auto}summary::-webkit-details-marker{display:none}summary>svg{color:#ffffff;width:13px;height:13px}summary .count{font-size:10px;color:#949aad;font-weight:400;font-variant-numeric:tabular-nums}summary .chevron{width:10px;height:10px;color:#7e859a}summary:focus-visible{outline:2px solid #b0a9ff;outline-offset:3px}details[open] .chevron{transform:rotate(180deg)}details>.card{position:absolute;bottom:38px;right:0}
    .toast{position:fixed;bottom:64px;left:50%;transform:translate(-50%,4px);display:flex;align-items:center;gap:6px;padding:8px 12px;background:#1d202c;color:#dfe1eb;border:1px solid #ffffff14;border-radius:8px;box-shadow:0 4px 18px #0004;font-size:11px;white-space:nowrap;opacity:0;pointer-events:none}.toast svg{color:#ffffff;width:14px;height:14px}.toast.show{opacity:1;transform:translate(-50%,0)}
    @media(hover:hover) and (pointer:fine){summary:hover{background:#222532}.footer a:hover{text-decoration:underline}}
    @media(prefers-reduced-motion:no-preference){.toast{transition:opacity 160ms ease,transform 180ms cubic-bezier(.23,1,.32,1)}}
  `;
  function mount(root, { floating = false, onToggle } = {}) {
    const card = `<section class="card" aria-label="aierfan 广告拦截"><header class="header"><div class="mark">${shield}</div><div><div class="brand">aierfan</div></div><div id="status" class="status" role="status"><span class="dot"></span><span id="status-text">正在连接</span></div></header><div class="metrics"><div class="metric"><div class="metric-label">累计拦截</div><div class="number"><span id="total">0</span><span class="unit">次</span></div></div><div class="metric"><div class="metric-label">当前页面</div><div class="number"><span id="session">—</span><span class="unit">次</span></div></div></div><label class="control"><span><span class="control-title">拦截中插广告</span><div id="control-note" class="control-note" hidden></div></span><span class="switch"><input id="ads" type="checkbox" role="switch" aria-label="拦截中插广告" checked><span class="track"></span></span></label><p id="message" class="message"></p><footer class="footer" hidden><span>仅 kubb.tv · 本机保存</span><a href="https://www.kubb.tv/" target="_blank" rel="noopener noreferrer">打开网站 ↗</a></footer></section>`;
    root.innerHTML = `<style>${styles}${floating ? '' : '.card{max-width:none;border:0;border-radius:0;box-shadow:none}'}</style>${floating ? `<details><summary aria-label="展开 aierfan 广告拦截控制">${shield}<span>aierfan</span><span class="count" id="chip-count">0 次</span><svg class="chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></summary>${card}</details><div id="toast" class="toast" role="status" aria-live="polite">${shield}<span>已拦截一条广告</span></div>` : card}`;
    const $ = selector => root.querySelector(selector);
    const input = $('#ads');
    input.addEventListener('change', async () => {
      input.disabled = true;
      try { await onToggle(input.checked); }
      catch { input.checked = !input.checked; $('#control-note').textContent = '保存失败，请重试'; $('#control-note').hidden = false; }
      finally { input.disabled = false; }
    });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && $('details')?.open) {
        $('details').open = false;
        $('summary').focus();
      }
    });
    let timer;
    return {
      render({ enabled = true, total = 0, blocked = null, scheduler = 'unavailable', error = '' }) {
        input.checked = enabled;
        $('#total').textContent = total.toLocaleString('zh-CN');
        $('#session').textContent = blocked === null ? '—' : blocked.toLocaleString('zh-CN');
        if (floating) $('#chip-count').textContent = `${blocked ?? 0} 次`;
        const labels = { ready: ['已开启', 'ready'], waiting: ['等待视频', 'neutral'], unsupported: ['需适配', 'warning'], unavailable: ['待连接', 'neutral'] };
        const [label, tone] = enabled ? labels[scheduler] || labels.waiting : ['已暂停', 'neutral'];
        $('#status-text').textContent = label;
        $('#status').dataset.tone = tone;
        $('#control-note').hidden = true;
        $('.footer').hidden = floating || scheduler !== 'unavailable';
        $('#message').textContent = error || (scheduler === 'unavailable' ? '打开 kubb.tv 视频页面后，这里会显示拦截状态。' : scheduler === 'unsupported' ? '网站播放器已更新，当前广告模块暂未适配。' : !enabled ? '若广告已经开始播放，刷新页面后再试。' : '');
      },
      toast() {
        const toast = $('#toast');
        if (!toast) return;
        clearTimeout(timer);
        toast.classList.add('show');
        timer = setTimeout(() => toast.classList.remove('show'), 3000);
      }
    };
  }
  globalThis.__aierfanUI = { mount };
})();
