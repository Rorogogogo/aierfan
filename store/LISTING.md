# aierfan 0.2.1 listing copy

Use with the 0.2.1 package and updated screenshot when submitting the next store revision. Version 0.1.0 was already submitted separately; this file does not change that submission.

## Description

aierfan 是一款适用于 kubb.tv 的轻量广告拦截扩展。

主要功能
- 拦截已适配播放器中的定时中插广告。
- 每次拦截显示简短提示。
- 在工具栏弹窗或页面右下角面板查看本页与累计拦截次数。
- 一个开关，随时开启或暂停；设置自动保存在本机。

安装后刷新 kubb.tv 视频页面。点击 Chrome 工具栏中的 aierfan 图标，或页面右下角的 aierfan 小按钮，即可打开控制面板。

仅支持 https://kubb.tv 与 https://www.kubb.tv。本扩展针对定时中插广告，不保证拦截横幅、片源内嵌广告或其他播放器广告。网站播放器更新可能影响兼容性。

不收集或上传个人数据，不包含追踪或远程代码。开关设置与拦截次数仅保存在本机浏览器中。

本扩展为独立开源项目，与视频网站无隶属或官方合作关系。

## Single purpose

Suppress scheduled mid-roll advertisements in the adapted kubb.tv video player, with a local on/off control and blocked-ad counts.

## storage justification

Stores only the user's ad-blocking preference and cumulative blocked-ad count locally on their device. No values are transmitted.

## Host permission justification

Content scripts run only on https://kubb.tv/* and https://www.kubb.tv/* to suppress the player's scheduled mid-roll ads and show local controls and counts. MAIN-world execution integrates with the page's scheduler. No other hosts or account credentials are accessed.

## Privacy policy

https://github.com/Rorogogogo/aiyifan-ads-free/blob/main/PRIVACY.md
