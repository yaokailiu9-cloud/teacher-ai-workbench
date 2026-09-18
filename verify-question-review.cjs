const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sandbox = {window: {}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, 'question-review.js'), 'utf8'), sandbox);
const {parse, report, categories} = sandbox.window.QuestionReview;
const fixture = () => ({status:'ready',message:'',questions:[{
  text:'质量为 2 kg，F = 10 N。求速度。',subject:'物理',restatement:'根据已知条件求速度。',
  sections: categories.map(([key])=>({key,items:key==='data'?[{quote:'F=10N',interpretation:'恒力大小'}]:[],emptyReason:'无相应信息'})),
}]});
const data=parse(JSON.stringify(fixture()));
assert.equal(data.questions[0].sections[2].items[0].quote,'F = 10 N');
const forged=fixture();forged.questions[0].sections[2].items[0].quote='F=20N';
assert.throws(()=>parse(JSON.stringify(forged)),/无法对应原题/);
const lostBound=fixture();lostBound.questions[0].text='至少有10人。求人数。';
assert.throws(()=>parse(JSON.stringify(lostBound)),/数量限定/);
const missing=fixture();missing.questions[0].sections.pop();
assert.throws(()=>parse(JSON.stringify(missing)),/六个维度/);
const duplicate=fixture();duplicate.questions[0].sections[5].key='task';
assert.throws(()=>parse(JSON.stringify(duplicate)),/重复或缺失/);
assert.throws(()=>parse('{truncated'),/格式不完整/);
assert.throws(()=>parse('{"status":"ready","questions":[]}'),/完整题目/);
assert.equal(parse('{"status":"needs_clarification","message":"题干缺失","questions":[]}').status,'needs_clarification');
const html=report(data,{subject:'物理',grade:'高二',source:'<script>bad()</script>',time:'本次'});
assert(!html.includes('<script>'));
assert.equal((html.match(/class="qr-card report-step"/g)||[]).length,6);
assert(!html.includes('2025-05-24'));
console.log('PASS: reading evidence, whitespace, missing/duplicate categories, truncation, clarification and safe rendering');
