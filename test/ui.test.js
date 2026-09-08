import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('history UI uses the rendered DOM ids and exposes clear controls', () => {
  assert.match(html, /id="historyList"/);
  assert.match(html, /id="emptyHistory"/);
  assert.match(html, /id="clearHistory"/);
  assert.match(html, /emptyState\.classList\.toggle\('hidden', hasHistory\)/);
  assert.match(html, /document\.querySelectorAll\('#toneSelector \[data-tone\]'\)/);
  assert.doesNotMatch(html, /\.tone-btn/);
});

test('output controls are wired for copy and text download', () => {
  assert.match(html, /id="outputText"[^>]*aria-live="polite"/);
  assert.match(html, /id="copyOutput"/);
  assert.match(html, /await navigator\.clipboard\.writeText\(lastOutputText\)/);
  assert.match(html, /id="downloadOutput"/);
  assert.match(html, /new Blob\(\['\\uFEFF', lastOutputText\]/);
});

test('text upload is constrained and updates the live word count', () => {
  assert.match(html, /id="fileUpload"[^>]*accept="\.txt,text\/plain"/);
  assert.match(html, /el\('fileUpload'\)\.addEventListener\('change'/);
  assert.match(html, /inputText\.addEventListener\('input'/);
  assert.match(html, /file\.size > 1024 \* 1024/);
});

test('processing state blocks duplicate requests and is always released', () => {
  assert.match(html, /if \(isProcessing\) return;/);
  assert.match(html, /processBtn\.disabled = isBusy/);
  assert.match(html, /detectOnlyBtn\.disabled = isBusy/);
  assert.match(html, /finally \{\s*setProcessingState\(false\);/);
});
