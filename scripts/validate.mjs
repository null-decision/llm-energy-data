#!/usr/bin/env node
/**
 * Checks every file in data/ against the schemas, plus the rules a schema can't express:
 * each entry sits at data/models/<id>.json, every `source` is listed in data/sources.json, ranges and intervals are
 * in order, no date lies in the future, no value comes from a source we must not copy, and files are formatted the
 * same way. `--fix` rewrites the formatting only.
 *
 *   npm run validate
 *   npm run format
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MODELS_DIR = join(ROOT, 'data', 'models');
const SOURCES_FILE = join(ROOT, 'data', 'sources.json');

/** Sources whose numbers must never enter this repository (README, "What is not here"). */
const BANNED = [
  { pattern: /artificialanalysis\.ai/i, why: 'Artificial Analysis: redistribution terms unclear' },
  { pattern: /sustainableaigroup\.com|\bCLEER\b/i, why: 'CLEER (Sustainable AI Group): non-commercial licence' },
];

const fix = process.argv.includes('--fix');
const errors = [];

function report(file, message) {
  errors.push(`${relative(ROOT, file)}: ${message}`);
}

function readJson(file) {
  const text = readFileSync(file, 'utf8');
  try {
    return { text, json: JSON.parse(text) };
  } catch (error) {
    report(file, `not valid JSON (${error.message})`);
    return undefined;
  }
}

function checkFormatting(file, text, json) {
  const formatted = `${JSON.stringify(json, null, 2)}\n`;
  if (text === formatted) return;
  if (fix) writeFileSync(file, formatted);
  else report(file, 'not formatted: run `npm run format`');
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

function compileSchema(name) {
  return ajv.compile(JSON.parse(readFileSync(join(ROOT, 'schema', name), 'utf8')));
}

const validateModel = compileSchema('model.schema.json');
const validateSources = compileSchema('sources.schema.json');

/** Reports every schema error and returns whether the value passed. */
function checkSchema(file, validate, json) {
  if (validate(json)) return true;
  for (const error of validate.errors) report(file, `${error.instancePath || '/'} ${error.message}`);
  return false;
}

/** Every value inside a JSON value, the value itself first, with its JSON path. */
function* walk(value, path = '') {
  yield [path, value];
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) yield* walk(item, `${path}/${key}`);
  }
}

function checkBanned(file, json) {
  for (const [path, value] of walk(json)) {
    if (typeof value !== 'string') continue;
    for (const { pattern, why } of BANNED) {
      if (pattern.test(value)) report(file, `${path || '/'} mentions a source we must not copy from (${why})`);
    }
  }
}

/** The ends of a number that is either { value } or { min, max }. */
function lowest(number) {
  return number.value ?? number.min;
}

function highest(number) {
  return number.value ?? number.max;
}

// A day of slack, so a date written in a time zone ahead of the CI runner's still passes.
const latestDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// --- Sources ------------------------------------------------------------------------------------------------

const sourceIds = new Set();
const sourcesFile = readJson(SOURCES_FILE);
if (sourcesFile) {
  checkFormatting(SOURCES_FILE, sourcesFile.text, sourcesFile.json);
  checkSchema(SOURCES_FILE, validateSources, sourcesFile.json);
  checkBanned(SOURCES_FILE, sourcesFile.json);
  for (const source of sourcesFile.json.sources ?? []) {
    if (sourceIds.has(source.id)) report(SOURCES_FILE, `source id "${source.id}" is listed twice`);
    sourceIds.add(source.id);
  }
}

// --- Models -------------------------------------------------------------------------------------------------

const modelFiles = readdirSync(MODELS_DIR, { recursive: true })
  .filter(name => name.endsWith('.json'))
  .map(name => join(MODELS_DIR, name))
  .sort();

for (const file of modelFiles) {
  const loaded = readJson(file);
  if (!loaded) continue;
  const { text, json: entry } = loaded;
  checkFormatting(file, text, entry);
  if (!checkSchema(file, validateModel, entry)) continue;
  checkBanned(file, entry);

  const expectedId = relative(MODELS_DIR, file).slice(0, -'.json'.length).split(sep).join('/');
  if (entry.id !== expectedId) report(file, `id "${entry.id}" doesn't match its path (expected "${expectedId}")`);
  // One "../" for each folder between the file and the repository root: data, models and the id's own folders.
  const expectedSchema = `${'../'.repeat(expectedId.split('/').length + 1)}schema/model.schema.json`;
  if (entry.$schema !== expectedSchema) report(file, `$schema should be "${expectedSchema}"`);

  for (const [path, value] of walk(entry)) {
    const namesSource = value && typeof value === 'object' && 'source' in value;
    if (!namesSource) continue;
    if (!sourceIds.has(value.source)) report(file, `${path}/source "${value.source}" is not in data/sources.json`);
    if (value.checked_at > latestDate) report(file, `${path}/checked_at ${value.checked_at} is in the future`);
    if ('min' in value && value.min > value.max) report(file, `${path} has min above max`);
  }

  const { type, total_params_b: total, active_params_b: active } = entry.architecture;
  if (total && active) {
    if (lowest(active) > highest(total)) report(file, '/architecture: active parameters exceed total');
    const activeEqualsTotal = lowest(active) === lowest(total) && highest(active) === highest(total);
    if (type?.value === 'dense' && !activeEqualsTotal) {
      report(file, '/architecture: a dense model must have as many active parameters as total');
    }
  }

  for (const [i, speed] of entry.speeds.entries()) {
    if (speed.period.from > speed.period.to) report(file, `/speeds/${i}/period starts after it ends`);
    if (speed.checked_at < speed.period.to) report(file, `/speeds/${i}/checked_at is before the period ends`);
  }
  for (const [i, price] of entry.prices.entries()) {
    if (price.valid_from && price.valid_until && price.valid_from > price.valid_until) {
      report(file, `/prices/${i} is valid from after it is valid until`);
    }
  }
  for (const [i, quality] of entry.quality.entries()) {
    for (const [category, r] of Object.entries(quality.ratings)) {
      if (r.rating < r.rating_lower || r.rating > r.rating_upper) {
        report(file, `/quality/${i}/ratings/${category}: rating is outside its interval`);
      }
    }
    if (quality.snapshot_date > quality.checked_at) report(file, `/quality/${i}: snapshot is newer than checked_at`);
  }
}

if (modelFiles.length === 0) report(MODELS_DIR, 'no model entries found');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} in ${modelFiles.length} model entries.`);
  process.exit(1);
}
const done = fix ? 'Formatted and checked' : 'Checked';
console.log(`${done} ${modelFiles.length} model entries and ${sourceIds.size} sources: all valid.`);
