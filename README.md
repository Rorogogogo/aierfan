# Kubb Helper for Chrome

Experimental Manifest V3 extension, built and installed locally on 14 November 2026.

## What it does

- Stops Kubb's JavaScript mid-roll scheduler before it begins an ad countdown or replaces the episode source.
- Prefers the highest resolution among the HLS streams already delivered to the player.
- Shows an ad-block counter and the actual decoded video dimensions.
- Provides separate switches for ad blocking and quality selection, saved locally.
- Returns to adaptive quality if the selected stream produces a fatal HLS error.

This is not a VIP unlock. The tested episode supplied one stream, decoded at **720 × 400**, even though Kubb labels it 480P. The extension found no higher-resolution variant in that player session. It does not change membership, purchase coins, rewrite media URLs or request restricted streams.

It targets scheduled mid-video ads. Banner ads, ads baked into the movie, prerolls using a different player, and server-side insertion are outside the verified scope.

## Installed copy

The extension files are now located at:

`/Users/roro/Developer/Personal Project/kubb-helper/extension`

Chrome extension ID: `pmnabdombbkpoiedcheejnnfcjbobggg`.

Keep that folder in place. Chrome’s existing registration continues to work through the compatibility link at `/Users/roro/Developer/kubb-helper`, preserving its extension ID and saved settings. Existing Kubb tabs need a reload before the extension runs. Expand **Kubb Helper · experimental** at the bottom right to inspect the status or change settings. A newly opened video tab works immediately.

To install elsewhere: open `chrome://extensions/`, enable Developer mode, click **Load unpacked**, and select the `extension` folder. No build or dependency installation is required.

After editing the code, click **Reload** on the Kubb Helper card in `chrome://extensions/`, then reload the Kubb tab.

## Verified behavior

Test URL: `https://www.kubb.tv/play/46Aua0WZD14?id=iQPgH4IiFDC` (Reply 1988, episode 02).

Live Chrome comparison:

1. Ad hook reported ready.
2. With blocking disabled, seeking to approximately 44:55 caused Kubb to display **3s 后播放广告** (ad countdown).
3. With blocking enabled after reloading, the same seek registered **1 blocked**; playback advanced past 45:00 without the countdown or ad replacement.
4. A previous live pass registered **2 blocked**.
5. The player supplied one stream; decoded dimensions were **720 × 400**.
6. Disabling quality preference displayed **Automatic**. Re-enabling it displayed **Only one stream supplied**.
7. Both settings were restored to enabled. The separate test tab was left paused around 45:23. The earlier viewing tab was retained.

Eight automated tests passed, including a contract test that executes the current public scheduler module with a fake timer, triggers its real mid-roll point, and verifies suppression and re-enabling. HLS tests cover unordered variants, default-selection timing, fatal-error fallback, and quality switching off. Webpack tests cover the bootstrap callback and its retained old push function.

Run offline tests:

```sh
npm test
```

The public-source contract test is skipped offline unless `KUBB_PUBLIC_BUNDLE` points to a downloaded Kubb main bundle. To download the current public bundle and run all eight tests:

```sh
npm run test:live-source
```

## How it works

`main.js` runs at document start in the page's JavaScript world. It wraps the factory for the observed `bgqT` Webpack module, checks its scheduler interface, and intercepts `startPlay` while ad blocking is enabled. The existing scheduler marks its trigger point as played; the helper prevents the countdown and clears the pending flag. The original method is called when the switch is off.

It also observes `Hls.loadSource`, waits until the manifest handlers finish, and sets `nextLevel` to the highest supplied variant. The player remains responsible for fetching and decoding the stream. The displayed dimensions come from the actual video element.

`content.js` runs in Chrome's isolated world and owns the controls and settings storage. It uses bounded text for page status and does not render page-provided HTML.

The only extension permission is `storage`. Content scripts match only `https://www.kubb.tv/*` and `https://kubb.tv/*`. There is no telemetry, remote code, cookie access, account access, external server, or network-blocking permission. The test-report button copies only settings, status and video dimensions/time/error code; it omits media URLs and account information.

## Limitations and recovery

Kubb's scheduler is a private interface and can change. The extension checks the expected method names; if the module or interface changes, the ad hook can remain waiting or report unsupported. Disable its switch or disable the extension and reload the page if playback behaves unexpectedly.

Turning ad blocking on while an ad is already playing does not end that ad. Reload afterward. Quality preference cannot create a higher-resolution stream that the server did not supply. Some streams omit resolution metadata; actual decoded dimensions are displayed independently.

To remove it, use **Remove** on the Kubb Helper card in Chrome's extensions page.

## Removed HD-response diagnostic

The video-service (`jBNF` / `getMedia`) hook and its quality-path messages have been removed. Inspecting that one response was insufficient to establish where VIP authorization is enforced. The helper now labels single-level HLS data as **Active playlist has one quality**, without treating it as a conclusion about other available sources or backend enforcement.

The local coin-display demonstration that earlier builds included has been removed. The extension does not touch the coin balance, membership, purchases, or any account value — it only blocks scheduled mid-roll ads and selects the highest quality among the streams the player already receives.
