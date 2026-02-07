import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadOpenApiSpec(): any {
  const p = path.resolve(__dirname, '../../../docs/openapi.yaml');
  const raw = fs.readFileSync(p, 'utf-8');
  return YAML.parse(raw);
}
