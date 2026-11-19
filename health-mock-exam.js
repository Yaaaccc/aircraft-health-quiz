window.HEALTH_MOCK_EXAM = {
  id: "health-mock-01",
  title: "飞机健康监测与故障诊断 · 综合模拟卷",
  subtitle: "依据课程复习提纲组卷 · 作业原题优先",
  duration: "90 分钟",
  totalScore: 100,
  questionCount: 32,
  sourceNote: "客观题与简答题优先复用课程作业及复习提纲中的原题；填空题按提纲考点整理，两道计算题按“故障树 + 贝叶斯”要求编制。分值为本模拟卷练习设置，具体以老师要求为准。",
  sections: [
    {
      id: "single",
      title: "一、单项选择题",
      type: "single",
      score: 1,
      instruction: "10 题，每题 1 分，共 10 分",
      questionIds: [
        "sensor-01",
        "air-05",
        "air-06",
        "bleed-03",
        "bleed-09",
        "phm-01",
        "phm-02",
        "phm-03",
        "data-01",
        "fta-10"
      ]
    },
    {
      id: "multiple",
      title: "二、多项选择题",
      type: "multiple",
      score: 2,
      instruction: "5 题，每题 2 分，共 10 分；多选、少选、错选均不得分",
      questionIds: [
        "sensor-10",
        "sensor-05",
        "air-04",
        "phm-04",
        "data-05"
      ]
    },
    {
      id: "fill",
      title: "三、填空题",
      type: "fill",
      score: 2,
      instruction: "9 题，每题两空，每空 1 分，共 18 分",
      questions: [
        {
          id: "mock-fill-01",
          number: 1,
          question: "航空发动机排气温度（EGT）测量通常采用____热电偶，并采用____布置以适应尾喷管高温、多点测量的需求。",
          answers: ["K 型", "多点环型"],
          explanation: "K 型热电偶测温范围宽、耐高温；EGT 测点通常沿排气通道多点环型布置，结构坚固且无需外部供电。",
          source: "提纲 · 传感器与测量"
        },
        {
          id: "mock-fill-02",
          number: 2,
          question: "流量控制与关断活门（FCSOV）控制进入空调系统的引气量，并将引气分为不经调节的____和进入空气循环制冷组件的____。",
          answers: ["热路", "冷路"],
          explanation: "FCSOV 把引气分成热路和冷路：热路用于温度调节，冷路进入空气循环制冷组件降温除水。",
          source: "提纲 · 空调系统"
        },
        {
          id: "mock-fill-03",
          number: 3,
          question: "空气循环机（ACM）由涡轮、压气机和____三部分组成；冷路空气进入 ACM 前，首先经过____进行第一次散热冷却。",
          answers: ["风扇", "主级热交换器"],
          explanation: "ACM 的三个核心旋转部件是涡轮、压气机和风扇；冷路空气先经主级热交换器初步散热，再进入后续制冷与除水环节。",
          source: "提纲 · 空调系统"
        },
        {
          id: "mock-fill-04",
          number: 4,
          question: "ARINC 429 在机载数据传输中属于____总线；ACARS 主要承担____报文传输。",
          answers: ["低速主流机载数据", "空地"],
          explanation: "ARINC 429 是应用广泛的低速主流机载总线；ACARS 用于飞机与地面之间的空地报文通信。",
          source: "提纲 · 数据总线"
        },
        {
          id: "mock-fill-05",
          number: 5,
          question: "飞机健康监测常见的三类触发机制是时间/周期触发、____和____，三者相互补充。",
          answers: ["事件触发（如 OOOI）", "阈值越限触发"],
          explanation: "周期触发保证常规采样，事件触发覆盖 OOOI 等关键阶段，阈值越限触发用于捕捉异常突变。",
          source: "提纲 · 触发机制"
        },
        {
          id: "mock-fill-06",
          number: 6,
          question: "数据预处理的四个维度是完整性、____、一致性和____。",
          answers: ["准确性", "时效性"],
          explanation: "完整性、准确性、一致性和时效性共同决定后续状态监测与故障诊断的数据质量。",
          source: "提纲 · 数据预处理"
        },
        {
          id: "mock-fill-07",
          number: 7,
          question: "机载传感器选型时，除量程外，还要重点考虑____、环境耐受和____等要求。",
          answers: ["精度", "适航认证"],
          explanation: "传感器选型不能只看量程，还要综合精度、环境耐受、重量、功耗和适航认证要求。",
          source: "提纲 · 传感器选型"
        },
        {
          id: "mock-fill-08",
          number: 8,
          question: "飞机起飞爬升阶段，引气源通常由第____级逐步切换到第____级；巡航阶段主要保持 5 级引气。",
          answers: ["9", "5"],
          explanation: "起飞爬升阶段发动机功率提高，引气由 9 级逐步切换到 5 级；巡航阶段通常保持 5 级引气。",
          source: "提纲 · 引气系统"
        },
        {
          id: "mock-fill-09",
          number: 9,
          question: "PHM 四层架构中，感知层之后是____，预测层之后是____。",
          answers: ["诊断层", "决策层"],
          explanation: "PHM 四层架构依次为感知层、诊断层、预测层和决策层。",
          source: "提纲 · PHM"
        }
      ]
    },
    {
      id: "short",
      title: "四、简答题",
      type: "short",
      score: 5,
      instruction: "6 题，每题 5 分，共 30 分",
      questionIds: [
        "short-01",
        "short-02",
        "short-03",
        "short-04",
        "short-05",
        "short-06"
      ]
    },
    {
      id: "calc",
      title: "五、计算题",
      type: "calc",
      score: 16,
      instruction: "2 题，每题 16 分，共 32 分",
      questions: [
        {
          id: "mock-calc-01",
          number: 1,
          title: "故障树计算",
          question: "某监测系统的顶事件 T 表示“监测功能失效”。其故障树逻辑为 T = A·(B+C)，基本事件 A、B、C 相互独立，失效概率分别为 P(A)=0.02、P(B)=0.03、P(C)=0.04。求最小割集、顶事件发生概率，并比较各基本事件的概率重要度和结构重要度。",
          asks: ["求最小割集", "求顶事件概率 P(T)", "比较概率重要度与结构重要度"],
          solution: [
            {
              heading: "最小割集",
              body: "T = A·(B+C) = A·B + A·C，因此最小割集为 {A,B} 和 {A,C}。"
            },
            {
              heading: "顶事件概率",
              body: "P(T)=P(A)[1-(1-P(B))(1-P(C))]=0.02×[1-0.97×0.96]=0.02×0.0688=0.001376，即约 0.1376%。"
            },
            {
              heading: "概率重要度",
              body: "I_A=P(B)+P(C)-P(B)P(C)=0.0688；I_B=P(A)(1-P(C))=0.0192；I_C=P(A)(1-P(B))=0.0194。因此概率重要度排序为 A > C > B，A 对顶事件概率影响最大。"
            },
            {
              heading: "结构重要度",
              body: "从故障树结构看，A 位于所有最小割集中，B 与 C 对称，因此结构重要度排序为 A > B = C。"
            }
          ],
          formula: "T = A·(B+C) → MCS = {A,B}, {A,C}",
          source: "提纲 · 故障树计算（模拟改编）"
        },
        {
          id: "mock-calc-02",
          number: 2,
          title: "贝叶斯诊断",
          question: "某发动机轴承磨损故障记为 F，先验概率 P(F)=0.02。滑油金属屑信号记为 S，已知故障时出现阳性信号的概率 P(S|F)=0.95，正常时误报概率 P(S|¬F)=0.05。求一次阳性信号后的 P(F|S)；若两次独立检测均为阳性，再求 P(F|S₁S₂)。",
          asks: ["一次阳性信号的后验概率", "两次独立阳性信号的后验概率"],
          solution: [
            {
              heading: "一次阳性信号",
              body: "P(S)=P(S|F)P(F)+P(S|¬F)P(¬F)=0.95×0.02+0.05×0.98=0.068。"
            },
            {
              heading: "贝叶斯更新",
              body: "P(F|S)=P(S|F)P(F)/P(S)=0.019/0.068≈0.2794，即约 27.94%。"
            },
            {
              heading: "两次独立阳性",
              body: "两次独立观测的似然为 0.95²=0.9025，正常误报为 0.05²=0.0025。P(F|S₁S₂)=0.02×0.9025/[0.02×0.9025+0.98×0.0025]≈0.8805，即约 88.05%。"
            },
            {
              heading: "结论",
              body: "单次阳性信号只能把故障概率从 2% 提高到约 27.9%；两次独立阳性可提高到约 88.1%，说明重复观测和证据融合能显著提升诊断置信度。"
            }
          ],
          formula: "P(F|S)=P(S|F)P(F)/P(S)",
          source: "提纲 · 贝叶斯计算（模拟改编）"
        }
      ]
    }
  ]
};
