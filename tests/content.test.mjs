import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../js/content.js';

test('stage ids and codes', () => {
  assert.deepEqual(STAGES.map(s => s.id), [0, 1, 2, 3, 4]);
  assert.equal(STAGES[0].code, null);
  const codes = STAGES.slice(1).map(s => s.code);
  assert.deepEqual(codes, ['MIND', 'TIME', 'WORD', 'FACT']);
});
test('questions are well formed', () => {
  for (const s of STAGES) {
    assert.ok(s.questions.length > 0, `stage ${s.id} empty`);
    for (const q of s.questions) {
      assert.ok(q.prompt && q.explain, `missing text in stage ${s.id}`);
      if (q.type === 'choice') {
        assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.prompt);
        if (q.probs) {
          assert.equal(q.probs.length, q.options.length, q.prompt);
          assert.equal(q.probs.indexOf(Math.max(...q.probs)), q.answer, q.prompt);
        }
      } else {
        assert.equal(q.type, 'order');
        assert.ok(q.items.length >= 3);
        const years = q.items.map(i => i.year);
        assert.deepEqual(years, [...years].sort((a, b) => a - b), 'items stored in answer order');
      }
    }
  }
});
