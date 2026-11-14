// Download public JavaScript only. No cookies, account or credentials are used.
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-helper-check-'));
const origin = 'https://www.kubb.tv';
function download(url) {
  const response = spawnSync('curl', ['--fail', '--silent', '--show-error', '--location', '--max-time', '25', url], {encoding:'utf8', maxBuffer:20*1024*1024});
  if (response.status !== 0) throw Error(response.stderr || 'Public bundle download failed');
  return response.stdout;
}
try {
  const page = download(origin+'/play/46Aua0WZD14?id=iQPgH4IiFDC');
  const src = page.match(/<script[^>]+src="(\/app\/main\.[a-z0-9]+\.js)"/i)?.[1];
  if (!src) throw Error('Kubb changed its page structure; main bundle not found.');
  const file = path.join(dir, 'kubb-public-main.js');
  fs.writeFileSync(file, download(origin+src));
  console.log('Checking current public bundle:', src);
  const result = spawnSync(process.execPath, ['--test', 'test/extension.test.cjs', 'test/live-source.test.cjs'], {
    cwd:path.join(__dirname,'..'), stdio:'inherit', env:{...process.env,KUBB_PUBLIC_BUNDLE:file}
  });
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
