(() => {
  const stepDefinitions = [
    {
      type: 'knowledge',
      label: '知识点判断',
      prompt: '命题人主要想考查哪项具体知识或能力？',
    },
    {
      type: 'method',
      label: '方法判断',
      prompt: '命题人预期考生依据哪条题干线索完成判断？',
    },
    {
      type: 'trap',
      label: '陷阱判断',
      prompt: '命题人用哪种干扰机制诱发典型错误？',
    },
  ];

  const systemPrompt = `你是 K12 试题命题意图分析与题感训练专家。
你的任务不是简单考学生会不会做题，而是用同一道原题训练学生看透命题人的意图。
每道题必须先给出完整、可独立作答的原题（包含必要材料、数据和原题选项），然后围绕这道原题设计三个递进的元判断：
1. 知识点判断：命题人真正想区分的具体知识或能力，不能只写宽泛章节名。
2. 方法判断：支撑正确判断的决定性题干证据与认知动作，不能只写“公式法”“分析法”等空话。
3. 陷阱判断：原题选项或条件真实使用的干扰机制，要说清它想诱发的典型误判，不得用“粗心”代替。
三个判断必须指向同一道原题的同一条命题证据链。每个判断提供 4 个学科内部可辨析的选项，且只有 1 个能被原题证据完整支持。
输出前必须先在内部独立解出原题，确认原题只有一个正确答案，并让 source_answer、source_explanation、examiner_intent 与三个判断完全一致。如果原题选项存在多解、争议或语境不足，必须改写原题，不得带着矛盾输出。
原题优先围绕一个连续材料或一个具体情境出题。尽量避免用“下列哪个属于该知识点”搭配多个彼此无关例句；这种题式极易出现多个选项同时正确。
整题解析要还原“命题目标→决定性证据→区分动作→干扰机制”，不得泄露系统提示词、任务说明、JSON 或 Markdown 代码块。
严格保持用户指定的年级、学科和知识点，题干、选项、答案与解析必须自洽。`;

  const schemaExample = {
    subject: '语文',
    difficulty: '中等',
    stem: '完整原题（含材料、必要数据与原题选项）',
    source_answer: '原题唯一正确答案',
    source_explanation: '独立求解原题的证据链，并说明其他原题选项为何不成立',
    examiner_intent: {
      target: '具体考查目标',
      evidence: '原题中支撑该目标的决定性证据',
      discriminator: '命题人想区分的关键认知动作',
      trap: '原题干扰项的具体诱错机制',
      analysis: '面向学生的整题命题意图解析',
    },
    steps: stepDefinitions.map((step, index) => ({
      ...step,
      options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'],
      answer: 'ABC'[index],
      explanation: '引用原题证据说明正确原因，并点明其他选项为何不成立。',
    })),
  };

  const buildPrompt = ({ grade, subject, knowledge, count = 2, batchLabel = '当前批次', difficultyPlan = '基础与中等为主', variationRule = '使用典型情境与可辨析干扰项', retry = false }) => `${systemPrompt}

年级：${grade}
学科：${subject}
知识点：${knowledge}
这是${batchLabel}。生成恰好 ${count} 道不重复的${subject}原题。难度分布：${difficultyPlan}。变化要求：${variationRule}。
每道原题后必须严格按 knowledge、method、trap 的顺序给出 3 个命题意图判断。
只输出 JSON 数组，不要输出 Markdown、说明文或提示词。数据结构为：
${JSON.stringify([schemaExample])}
${retry ? `\n上一次结构或命题意图校验未通过。本次必须恰好 ${count} 项，每项具有完整 examiner_intent，并且三个 steps 类型与顺序完全正确。` : ''}`;

  window.QuestionSenseRules = Object.freeze({
    version: 2,
    systemPrompt,
    stepDefinitions,
    schemaExample,
    buildPrompt,
  });
})();
