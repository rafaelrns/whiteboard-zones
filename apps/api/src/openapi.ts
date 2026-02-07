import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export function loadOpenApiSpec(): any {
  const p = path.resolve(process.cwd(), '../../docs/openapi.yaml');
  const raw = fs.readFileSync(p, 'utf-8');
  return YAML.parse(raw);
}
