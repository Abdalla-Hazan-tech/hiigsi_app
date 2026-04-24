const { spawnSync } = require('node:child_process');
const path = require('node:path');

const scriptPath = path.join(__dirname, 'generate_branding.ps1');

const result = spawnSync(
  'powershell',
  ['-ExecutionPolicy', 'Bypass', '-File', scriptPath],
  {
    cwd: __dirname,
    stdio: 'inherit',
  }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
