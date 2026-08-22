import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function getGitInfo() {
  try {
    const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    let commitCount = 1;
    try {
      commitCount = parseInt(execSync('git rev-list --count HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim(), 10) || 1;
    } catch {
      commitCount = 1;
    }
    return { commit, branch, commitCount };
  } catch {
    return { commit: 'uncommitted', branch: 'main', commitCount: 1 };
  }
}

function getBaseVersion() {
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version && pkg.version !== '0.0.0') return pkg.version;
    }
  } catch {
    // fallback
  }
  return '2.5.0';
}

function generateVersion() {
  const gitInfo = getGitInfo();
  const baseVersion = getBaseVersion();
  
  // Manejo de número de compilación incremental
  const buildNumFile = path.join(ROOT_DIR, '.build_number');
  let buildNumber = gitInfo.commitCount;
  if (fs.existsSync(buildNumFile)) {
    try {
      const storedNum = parseInt(fs.readFileSync(buildNumFile, 'utf8').trim(), 10);
      if (!isNaN(storedNum) && storedNum >= buildNumber) {
        buildNumber = storedNum + 1;
      }
    } catch {
      // Ignorar error de lectura
    }
  }
  fs.writeFileSync(buildNumFile, String(buildNumber));

  const builtAt = new Date().toISOString();
  const fullVersion = `v${baseVersion}-b${buildNumber}.${gitInfo.commit}`;

  const versionData = {
    app: 'LIMS-PRO',
    version: baseVersion,
    buildNumber,
    gitCommit: gitInfo.commit,
    gitBranch: gitInfo.branch,
    fullVersion,
    builtAt,
    environment: process.env.NODE_ENV || 'production'
  };

  const targets = [
    path.join(ROOT_DIR, 'public/version.json'),
    path.join(ROOT_DIR, 'api/version.json'),
    path.join(ROOT_DIR, 'src/version.json')
  ];

  for (const target of targets) {
    try {
      const dir = path.dirname(target);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(target, JSON.stringify(versionData, null, 2));
      console.log(`📌 [VERSION] Archivo generado: ${path.relative(ROOT_DIR, target)} -> ${fullVersion}`);
    } catch (err) {
      console.warn(`⚠️ Error al escribir ${target}:`, err.message);
    }
  }

  return versionData;
}

generateVersion();
