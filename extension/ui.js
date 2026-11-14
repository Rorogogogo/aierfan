(() => {
  'use strict';
  const shield = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6l8-3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m8.5 12 2.3 2.3 4.7-4.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const styles = `
    :host{all:initial;color-scheme:light;font:13px/1.5 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;color:#303b50;-webkit-font-smoothing:antialiased}
    *,*::before,*::after{box-sizing:border-box}button,input{font:inherit}svg{width:20px;height:20px;flex-shrink:0}
    .card{width:320px;max-width:calc(100vw - 32px);background:#fff;border:1px solid #e5e9f0;border-radius:16px;overflow:hidden;box-shadow:0 12px 36px #25324b14,0 2px 6px #25324b08;text-align:left}
    .header{display:flex;align-items:center;gap:10px;padding:20px 20px 16px}.mark{display:grid;place-items:center;width:34px;height:34px;background:#efedff;color:#635bff;border-radius:10px}.brand{font-size:18px;font-weight:700;letter-spacing:-.5px;color:#19243b}.tagline{color:#788399;font-size:11px;margin-top:1px}
    .status{margin-left:auto;display:flex;align-items:center;gap:5px;font-size:11px;color:#627086;white-space:nowrap}.dot{width:6px;height:6px;border-radius:50%;background:#9aa6b6;flex-shrink:0}.status[data-tone=ready]{color:#168366}.status[data-tone=ready] .dot{background:#18a882}.status[data-tone=warning]{color:#a96718}.status[data-tone=warning] .dot{background:#d99a3e}
    .metrics{display:grid;grid-template-columns:1fr 1fr;margin:0 20px 18px;padding:16px;background:#f7f8fc;border:1px solid #eceef5;border-radius:10px}.metric+.metric{border-left:1px solid #e5e8f0;padding-left:18px}.metric-label{color:#748097;font-size:11px;margin-bottom:4px}.number{font-size:28px;line-height:1.15;font-weight:650;letter-spacing:-1px;color:#1a2540;font-variant-numeric:tabular-nums}.unit{font-size:11px;font-weight:400;color:#8b95a7;letter-spacing:0;margin-left:5px}
    .control{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;border-top:1px solid #edf0f5;cursor:pointer}.control-title{font-size:13px;font-weight:600;color:#27334b}.control-note{font-size:11px;color:#7b879d;margin-top:3px}.switch{position:relative;display:inline-flex;width:36px;height:22px;flex-shrink:0}.switch input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}.track{width:36px;height:22px;border-radius:20px;background:#ccd2df;pointer-events:none}.track::after{content:"";display:block;width:16px;height:16px;background:#fff;border-radius:50%;margin:3px;box-shadow:0 1px 3px #17243b26}.switch input:checked+.track{background:#635bff}.switch input:checked+.track::after{transform:translateX(14px)}.switch input:focus-visible+.track{outline:3px solid #bcb7ff;outline-offset:3px}.switch input:disabled{cursor:wait}
    .footer{border-top:1px solid #edf0f5;padding:12px 20px;color:#8b95a7;font-size:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fcfcfe}.footer a{color:#635bff;text-decoration:none;font-size:11px;white-space:nowrap}.footer a:focus-visible{outline:2px solid #635bff;outline-offset:3px;border-radius:2px}
    .message{font-size:11px;color:#7a869b;padding:0 20px 15px;margin:0;line-height:1.7}.message:empty{display:none}
    details{position:relative}summary{display:flex;align-items:center;gap:8px;list-style:none;cursor:pointer;padding:10px 13px;border:1px solid #e5e9f0;border-radius:30px;background:#fff;box-shadow:0 3px 14px #25324b1a;font-weight:600;color:#25314a;width:max-content;margin-left:auto}summary::-webkit-details-marker{display:none}summary>svg{color:#635bff;width:17px;height:17px}summary .count{font-size:11px;color:#71809a;font-weight:500;font-variant-numeric:tabular-nums}summary .chevron{width:12px;height:12px;color:#9aa3b4}summary:focus-visible{outline:3px solid #bcb7ff;outline-offset:3px}details[open] .chevron{transform:rotate(180deg)}details>.card{position:absolute;bottom:54px;right:0}
    .toast{position:fixed;bottom:80px;left:50%;transform:translate(-50%,6px);display:flex;align-items:center;gap:8px;padding:10px 16px;background:#25314b;color:#fff;border:1px solid #ffffff1a;border-radius:10px;box-shadow:0 8px 28px #0002;font-size:12px;white-space:nowrap;opacity:0;pointer-events:none}.toast svg{color:#bcb7ff;width:17px;height:17px}.toast.show{opacity:1;transform:translate(-50%,0)}
    @media(hover:hover) and (pointer:fine){summary:hover{background:#faf9ff}.footer a:hover{text-decoration:underline}}
    @media(prefers-reduced-motion:no-preference){.toast{transition:opacity 160ms ease,transform 180ms cubic-bezier(.23,1,.32,1)}}
  `;
  function mount(root, { floating = false, onToggle } = {}) {
    const card = `<section class="card" aria-label="aierfan 广告拦截"><header class="header"><div class="mark">${shield}</div><div><div class="brand">aierfan</div><div class="tagline">少点打扰，多点好剧。</div></div><div id="status" class="status" role="status"><span class="dot"></span><span id="status-text">正在连接</span></div></header><div class="metrics"><div class="metric"><div class="metric-label">累计拦截</div><div class="number"><span id="total">0</span><span class="unit">次</span></div></div><div class="metric"><div class="metric-label">当前页面</div><div class="number"><span id="session">—</span><span class="unit">次</span></div></div></div><label class="control"><span><span class="control-title">拦截中插广告</span><div id="control-note" class="control-note">开关设置自动保存</div></span><span class="switch"><input id="ads" type="checkbox" role="switch" aria-label="拦截中插广告" checked><span class="track"></span></span></label><p id="message" class="message"></p><footer class="footer"><span>仅在 kubb.tv 生效 · 数据留在本机</span><a href="https://www.kubb.tv/" target="_blank" rel="noopener noreferrer">打开网站 ↗</a></footer></section>`;
    root.innerHTML = `<style>${styles}${floating ? '' : '.card{max-width:none;border:0;border-radius:0;box-shadow:none}'}</style>${floating ? `<details><summary aria-label="展开 aierfan 广告拦截控制">${shield}<span>aierfan</span><span class="count" id="chip-count">0 次</span><svg class="chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></summary>${card}</details><div id="toast" class="toast" role="status" aria-live="polite">${shield}<span>已拦截一条广告</span></div>` : card}`;
    const $ = selector => root.querySelector(selector);
    const input = $('#ads');
    input.addEventListener('change', async () => {
      input.disabled = true;
      try { await onToggle(input.checked); }
      catch { input.checked = !input.checked; $('#control-note').textContent = '保存失败，请重试'; }
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
        $('#control-note').textContent = enabled ? '自动跳过已适配的中插广告' : '已暂停，随时可以重新开启';
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
