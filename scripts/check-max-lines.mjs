// Fails CI when a source file grows past its line budget, so modules stay small and focused.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SOURCE_LIMIT = 200;
const TEST_LIMIT = 300;
const CHECKED = /\.(ts|tsx|css|mjs)$/;
const EXEMPT = /(^|\/)(generated|migrations)\//;
const TEST = /\.(spec|test)\.tsx?$|(^|\/)tests\//;

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .split('\n')
  .filter((file) => CHECKED.test(file) && !EXEMPT.test(file));

const offenders = files.flatMap((file) => {
  const lines = readFileSync(file, 'utf8').split('\n').length;
  const limit = TEST.test(file) ? TEST_LIMIT : SOURCE_LIMIT;
  return lines > limit ? [`${file}: ${lines} lines (limit ${limit})`] : [];
});

if (offenders.length > 0) {
  console.error(`Files over the line limit:\n${offenders.join('\n')}`);
  process.exit(1);
}
console.log(`check:lines OK (${files.length} files)`);
