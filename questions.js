window.QUIZ_META = {
  title: "飞机健康监测与故障诊断",
  subtitle: "课程复习题库",
  version: "1.0"
};

window.QUESTIONS = [
  {
    id: "sensor-01",
    category: "传感器与测量",
    type: "single",
    difficulty: "基础",
    question: "航空发动机排气温度（EGT）测量通常采用 K 型热电偶，以下哪项是其适配该场景的核心原因？",
    options: [
      { key: "A", text: "测温范围覆盖 -200℃～1250℃，可适应尾喷管高温环境" },
      { key: "B", text: "线性度与稳定性优于 Pt100" },
      { key: "C", text: "特别适合 -50℃～300℃ 的中低温测量" },
      { key: "D", text: "无需接触被测介质即可测温" }
    ],
    answer: ["A"],
    explanation: "K 型热电偶基于塞贝克效应工作，测温范围宽、耐高温，适用于发动机尾喷管等恶劣环境；Pt100 的线性与稳定性更好，但主要覆盖中低温场景。",
    source: "第二章作业",
    tags: ["EGT", "热电偶"]
  },
  {
    id: "sensor-02",
    category: "传感器与测量",
    type: "single",
    difficulty: "基础",
    question: "Pt100 铂电阻更常用于以下哪种机载温度测量？",
    options: [
      { key: "A", text: "发动机尾喷管 EGT" },
      { key: "B", text: "滑油、燃油及客舱等中低温测量" },
      { key: "C", text: "飞机结构振动" },
      { key: "D", text: "飞控作动筒位移" }
    ],
    answer: ["B"],
    explanation: "Pt100 精度高、线性与稳定性好，典型量程约 -50℃～300℃，适合滑油温度、燃油温度和客舱温度等中低温测量。",
    source: "课程大纲 · 传感器",
    tags: ["Pt100", "RTD"]
  },
  {
    id: "sensor-03",
    category: "传感器与测量",
    type: "single",
    difficulty: "基础",
    question: "飞控作动筒位置反馈、反推展开位置测量通常采用 LVDT 传感器，该传感器属于哪类测量器件？",
    options: [
      { key: "A", text: "温度传感器" },
      { key: "B", text: "压力传感器" },
      { key: "C", text: "位移传感器" },
      { key: "D", text: "流量传感器" }
    ],
    answer: ["C"],
    explanation: "LVDT 即线性可变差动变压器，基于互感变化测量直线位移，具有精度高、可靠性好的特点。",
    source: "第二章作业",
    tags: ["LVDT", "位移"]
  },
  {
    id: "sensor-04",
    category: "传感器与测量",
    type: "single",
    difficulty: "基础",
    question: "民航飞机燃油计量单元（FMU）出口的燃油流量测量，普遍采用以下哪种传感器？",
    options: [
      { key: "A", text: "超声波流量计" },
      { key: "B", text: "涡轮流量计" },
      { key: "C", text: "差压式流量计" },
      { key: "D", text: "容积式流量计" }
    ],
    answer: ["B"],
    explanation: "涡轮流量计的叶轮转速与体积流量成正比，精度约 0.5%，是 Jet A-1 燃油计量的主流方案。",
    source: "第二章作业",
    tags: ["流量", "FMU"]
  },
  {
    id: "sensor-05",
    category: "传感器与测量",
    type: "multiple",
    difficulty: "进阶",
    question: "以下关于磁电式与霍尔式转速传感器的描述，正确的有？",
    options: [
      { key: "A", text: "磁电式传感器为无源工作，适合中高速段 N1/N2 转速测量" },
      { key: "B", text: "霍尔式传感器需外部供电，可从零速起测" },
      { key: "C", text: "磁电式传感器输出方波信号，抗干扰能力强" },
      { key: "D", text: "霍尔式传感器输出正弦波信号，无需供电" }
    ],
    answer: ["A", "B"],
    explanation: "磁电式传感器无源，齿轮切割磁力线产生正弦波，适合中高速测量；霍尔式传感器需供电，输出方波，可零速起测、抗干扰能力强。",
    source: "第二章作业",
    tags: ["转速", "磁电式", "霍尔式"]
  },
  {
    id: "sensor-06",
    category: "传感器与测量",
    type: "judge",
    difficulty: "基础",
    question: "振动超限是发动机故障最直接、最早出现的征兆之一，发动机振动监测通常在风扇机匣、涡轮机匣设置双测点，用于监测轴承与叶片的异常状态。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["A"],
    explanation: "该描述符合压电式振动传感器的部署原则。振动超限往往早于其他明显故障征兆，是发动机健康监测的重要指标。",
    source: "第二章作业",
    tags: ["振动", "发动机"]
  },
  {
    id: "sensor-07",
    category: "传感器与测量",
    type: "judge",
    difficulty: "进阶",
    question: "某维修团队认为 Pt100 铂电阻线性稳定性优、测量精度高，决定选用 Pt100 替代传统 K 型热电偶作为 EGT 测量传感器，该选型方案是合理的。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["B"],
    explanation: "Pt100 主要适用于 -50℃～300℃ 的中低温测量，无法覆盖 EGT 的高温环境；K 型热电偶的宽温域和耐高温能力才是 EGT 场景的关键。",
    source: "第二章作业",
    tags: ["EGT", "选型"]
  },
  {
    id: "sensor-08",
    category: "传感器与测量",
    type: "judge",
    difficulty: "进阶",
    question: "磁电式转速传感器可从零速起测、输出方波信号抗干扰能力强；霍尔式转速传感器为无源器件，仅适合中高转速段测量。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["B"],
    explanation: "题干把两类传感器特性说反了。霍尔式需供电、可零速起测并输出方波；磁电式无源、输出正弦波，更适合中高速测量。",
    source: "第二章作业",
    tags: ["转速", "易混点"]
  },
  {
    id: "sensor-09",
    category: "传感器与测量",
    type: "judge",
    difficulty: "基础",
    question: "LVDT 差动变压器式位移传感器属于接触式测量传感器，存在机械磨损问题，仅能用于油门杆角度测量，无法应用于飞控作动筒位置反馈。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["B"],
    explanation: "LVDT 为非接触式测量，无机械磨损、可靠性高，广泛用于飞控作动筒、反推、襟翼和油门杆等位置反馈。",
    source: "第二章作业",
    tags: ["LVDT", "非接触"]
  },
  {
    id: "sensor-10",
    category: "传感器与测量",
    type: "multiple",
    difficulty: "综合",
    question: "为大气数据计算机、液压系统、座舱压力调节三个场景选配压力传感器，下列匹配合理的有？",
    options: [
      { key: "A", text: "大气数据计算机的总压/静压测量——电容式压力传感器" },
      { key: "B", text: "液压系统压力监测——压阻式压力传感器" },
      { key: "C", text: "座舱压力调节——谐振式压力传感器" },
      { key: "D", text: "以上场景都应优先选用压阻式压力传感器" }
    ],
    answer: ["A", "B", "C"],
    explanation: "电容式温度稳定性好、功耗低，适合大气数据测量；压阻式灵敏度高、体积小，适合液压中等压力；谐振式输出频率信号、抗干扰强、精度高，适合座舱压力调节。",
    source: "第二章作业",
    tags: ["压力传感器", "选型"]
  },
  {
    id: "sensor-11",
    category: "传感器与测量",
    type: "single",
    difficulty: "基础",
    question: "机载传感器选型时，通常需要优先综合权衡哪些因素？",
    options: [
      { key: "A", text: "量程、精度、环境耐受与适航认证要求" },
      { key: "B", text: "只比较采购价格" },
      { key: "C", text: "只追求体积最小" },
      { key: "D", text: "只参考安装位置是否方便" }
    ],
    answer: ["A"],
    explanation: "机载传感器必须同时满足测量任务与环境要求，并符合适航认证。价格、体积和安装位置是因素，但不能脱离量程、精度和可靠性单独决策。",
    source: "课程大纲 · 传感器",
    tags: ["选型", "适航"]
  },
  {
    id: "sensor-12",
    category: "传感器与测量",
    type: "single",
    difficulty: "基础",
    question: "机载振动监测常用压电加速度计，其核心工作原理是？",
    options: [
      { key: "A", text: "压电效应" },
      { key: "B", text: "塞贝克效应" },
      { key: "C", text: "电磁感应" },
      { key: "D", text: "霍尔效应" }
    ],
    answer: ["A"],
    explanation: "压电加速度计利用压电晶体在受力时产生电荷的压电效应，将振动加速度转换为电信号。",
    source: "课程大纲 · 振动",
    tags: ["压电效应", "加速度计"]
  },
  {
    id: "bleed-01",
    category: "引气系统",
    type: "single",
    difficulty: "基础",
    question: "引气系统中的预冷器主要用于什么功能？",
    options: [
      { key: "A", text: "增加引气温度" },
      { key: "B", text: "降低引气温度" },
      { key: "C", text: "调节引气压力" },
      { key: "D", text: "过滤引气杂质" }
    ],
    answer: ["B"],
    explanation: "预冷器的主要作用是降低引气温度，防止高温气体对下游设备和管路造成损害。",
    source: "作业七 · 引气系统",
    tags: ["预冷器", "温度"]
  },
  {
    id: "bleed-02",
    category: "引气系统",
    type: "single",
    difficulty: "基础",
    question: "下列哪一项不是引气系统健康监测的关键参数？",
    options: [
      { key: "A", text: "引气压力" },
      { key: "B", text: "引气温度" },
      { key: "C", text: "引气湿度" },
      { key: "D", text: "引气流量" }
    ],
    answer: ["C"],
    explanation: "引气系统关键监测参数主要包括压力、温度和流量，引气湿度不属于该系统的核心健康监测对象。",
    source: "作业七 · 引气系统",
    tags: ["监测参数"]
  },
  {
    id: "bleed-03",
    category: "引气系统",
    type: "single",
    difficulty: "进阶",
    question: "在飞机从地面开车并滑出到爬升至 1500 英尺并加速到 250 节的过程中，引气系统如何调节压力？",
    options: [
      { key: "A", text: "从 5 级调压到 9 级调压" },
      { key: "B", text: "保持 5 级调压" },
      { key: "C", text: "从 9 级调压到 5 级调压" },
      { key: "D", text: "保持 9 级调压" }
    ],
    answer: ["C"],
    explanation: "该阶段发动机功率逐步提高，引气源由 9 级逐步切换到 5 级，因此是从 9 级调压到 5 级调压。",
    source: "作业七 · 引气系统",
    tags: ["压力调节", "飞行阶段"]
  },
  {
    id: "bleed-04",
    category: "引气系统",
    type: "multiple",
    difficulty: "进阶",
    question: "在飞机爬升到 10000 英尺并加速到爬升速度后，以及在巡航阶段，引气系统如何调节压力？",
    options: [
      { key: "A", text: "从 9 级调压到 5 级调压" },
      { key: "B", text: "保持 5 级调压" },
      { key: "C", text: "从 5 级调压到 9 级调压" },
      { key: "D", text: "保持 9 级调压" }
    ],
    answer: ["B"],
    explanation: "爬升到 10000 英尺以上并加速后，以及巡航阶段，引气系统保持 5 级调压。",
    source: "作业七 · 引气系统",
    tags: ["压力调节", "巡航"]
  },
  {
    id: "bleed-05",
    category: "引气系统",
    type: "judge",
    difficulty: "进阶",
    question: "在飞机下降到 10000 英尺并减速到 250 节，然后以 250 节下降到 1500 英尺的过程中，引气系统是从 5 级调压到 9 级调压。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["A"],
    explanation: "下降过程中发动机功率降低，引气源会从 5 级切换回 9 级，因此表述正确。",
    source: "作业七 · 引气系统",
    tags: ["压力调节", "下降"]
  },
  {
    id: "bleed-06",
    category: "引气系统",
    type: "multiple",
    difficulty: "进阶",
    question: "下列引气活门与功能匹配正确的有？",
    options: [
      { key: "A", text: "HSV——高压级活门" },
      { key: "B", text: "PRSOV——压力调节与关断活门" },
      { key: "C", text: "PCCV——预冷器控制活门" },
      { key: "D", text: "FCSOV——燃油关断活门" }
    ],
    answer: ["A", "B", "C"],
    explanation: "FCSOV 是流量控制与关断活门，不是燃油关断活门。HSV、PRSOV、PCCV 的配对均正确。",
    source: "课程大纲 · 引气系统",
    tags: ["活门", "缩写"]
  },
  {
    id: "bleed-07",
    category: "引气系统",
    type: "single",
    difficulty: "基础",
    question: "高压级活门（HSV）主要负责什么？",
    options: [
      { key: "A", text: "控制高压级（第 9 级）引气进入引气系统" },
      { key: "B", text: "控制预冷器冷却空气流量" },
      { key: "C", text: "直接调节座舱温度" },
      { key: "D", text: "测量引气温度" }
    ],
    answer: ["A"],
    explanation: "HSV 用于控制第 9 级高压引气的进入，通常在发动机低功率、5 级引气压力不足时参与供气。",
    source: "课程大纲 · 引气系统",
    tags: ["HSV", "第9级"]
  },
  {
    id: "bleed-08",
    category: "引气系统",
    type: "single",
    difficulty: "基础",
    question: "预冷器控制活门（PCCV）的主要功能是？",
    options: [
      { key: "A", text: "调节预冷器冷却空气流量，从而控制引气温度" },
      { key: "B", text: "关断燃油供给" },
      { key: "C", text: "直接设定客舱高度" },
      { key: "D", text: "测量第 5 级引气压力" }
    ],
    answer: ["A"],
    explanation: "PCCV 通过调节冷却空气流量来控制预冷器出口温度，使引气温度保持在允许范围内。",
    source: "课程大纲 · 引气系统",
    tags: ["PCCV", "预冷器"]
  },
  {
    id: "bleed-09",
    category: "引气系统",
    type: "single",
    difficulty: "进阶",
    question: "当引气温度超过约 490°F 时，引气系统通常会采取什么保护动作？",
    options: [
      { key: "A", text: "自动增加引气量" },
      { key: "B", text: "触发引气跳开或关断" },
      { key: "C", text: "切换到第 5 级高压引气" },
      { key: "D", text: "打开客舱再循环风扇" }
    ],
    answer: ["B"],
    explanation: "超温传感器在温度达到约 490°F 时触发保护，使引气跳开或关断，避免高温损伤下游系统。",
    source: "课程大纲 · 引气保护",
    tags: ["490°F", "超温保护"]
  },
  {
    id: "bleed-10",
    category: "引气系统",
    type: "single",
    difficulty: "进阶",
    question: "引气系统中的 450°F 恒温调节器主要起什么作用？",
    options: [
      { key: "A", text: "提前减小引气量，防止温度接近 490°F 时触发跳开" },
      { key: "B", text: "提高引气温度以改善空调性能" },
      { key: "C", text: "测量引气压力并显示在驾驶舱" },
      { key: "D", text: "控制第 9 级活门的机械开度" }
    ],
    answer: ["A"],
    explanation: "450°F 恒温调节器通过提前减小引气量进行温度调节，避免引气温度继续升高并触发约 490°F 的超温跳开。",
    source: "课程大纲 · 引气保护",
    tags: ["450°F", "恒温调节"]
  },
  {
    id: "air-01",
    category: "空调系统",
    type: "single",
    difficulty: "基础",
    question: "在飞机空调系统健康监测中，下列哪个参数不是主要监测对象？",
    options: [
      { key: "A", text: "温度" },
      { key: "B", text: "湿度" },
      { key: "C", text: "噪音水平" },
      { key: "D", text: "空气质量" }
    ],
    answer: ["C"],
    explanation: "噪音可能影响乘客舒适度，但不属于空调系统健康监测的主要参数。",
    source: "作业六 · 空调系统",
    tags: ["监测参数"]
  },
  {
    id: "air-02",
    category: "空调系统",
    type: "single",
    difficulty: "基础",
    question: "在飞机空调系统故障诊断实践中，下列哪项不是常用的故障诊断步骤？",
    options: [
      { key: "A", text: "收集故障信息" },
      { key: "B", text: "进行系统测试" },
      { key: "C", text: "更换所有部件" },
      { key: "D", text: "分析故障原因" }
    ],
    answer: ["C"],
    explanation: "直接更换所有部件既低效又增加成本。故障诊断应基于现象、测试和数据定位具体原因。",
    source: "作业六 · 空调系统",
    tags: ["排故流程"]
  },
  {
    id: "air-03",
    category: "空调系统",
    type: "single",
    difficulty: "基础",
    question: "在阈值监控中，单点超限监控主要关注的是什么？",
    options: [
      { key: "A", text: "连续时间内的监控参数" },
      { key: "B", text: "任意时刻的监控参数是否超出阈值" },
      { key: "C", text: "历史数据的统计分析" },
      { key: "D", text: "超限窗口的确定" }
    ],
    answer: ["B"],
    explanation: "单点超限监控对任意时刻的监控参数进行判断，关注当前值是否越过设定阈值。",
    source: "作业六 · 空调系统",
    tags: ["阈值监控"]
  },
  {
    id: "air-04",
    category: "空调系统",
    type: "multiple",
    difficulty: "进阶",
    question: "在飞机空调系统健康监测中，哪些数据是需要重点监测的？",
    options: [
      { key: "A", text: "温度" },
      { key: "B", text: "湿度" },
      { key: "C", text: "压力" },
      { key: "D", text: "噪音水平" }
    ],
    answer: ["A", "B", "C"],
    explanation: "温度、湿度和压力是空调系统健康监测的重点数据。噪音主要与舒适性相关，不是核心监测对象。",
    source: "作业六 · 空调系统",
    tags: ["监测参数"]
  },
  {
    id: "air-05",
    category: "空调系统",
    type: "single",
    difficulty: "基础",
    question: "流量控制与关断活门（FCSOV）在空调系统中的主要作用是？",
    options: [
      { key: "A", text: "控制进入空调系统的引气量，并将引气分为热路和冷路" },
      { key: "B", text: "控制驾驶舱照明亮度" },
      { key: "C", text: "测量燃油流量" },
      { key: "D", text: "控制起落架收放" }
    ],
    answer: ["A"],
    explanation: "FCSOV 控制进入空调系统的引气量，并将引气分成不经调节的热路和进入空气循环制冷组件的冷路。",
    source: "课程大纲 · 空调系统",
    tags: ["FCSOV", "冷热路"]
  },
  {
    id: "air-06",
    category: "空调系统",
    type: "single",
    difficulty: "基础",
    question: "空气循环机（ACM）主要由哪三部分组成？",
    options: [
      { key: "A", text: "涡轮、压气机、风扇" },
      { key: "B", text: "涡轮、燃烧室、喷管" },
      { key: "C", text: "压气机、燃油泵、换热器" },
      { key: "D", text: "风扇、油泵、发电机" }
    ],
    answer: ["A"],
    explanation: "ACM 由涡轮、压气机和风扇三部分组成，是空气循环制冷系统的核心旋转组件。",
    source: "课程大纲 · 空调系统",
    tags: ["ACM", "结构"]
  },
  {
    id: "air-07",
    category: "空调系统",
    type: "single",
    difficulty: "进阶",
    question: "空调系统冷路空气进入空气循环机前，首先经过哪个部件进行第一次散热冷却？",
    options: [
      { key: "A", text: "主级热交换器" },
      { key: "B", text: "预冷器" },
      { key: "C", text: "水分离器" },
      { key: "D", text: "客舱再循环风扇" }
    ],
    answer: ["A"],
    explanation: "冷路空气首先经过主级热交换器进行第一次散热冷却，然后再进入后续制冷与除水环节。",
    source: "课程大纲 · 空调系统",
    tags: ["主级热交换器", "冷路"]
  },
  {
    id: "phm-01",
    category: "健康监测与 PHM",
    type: "single",
    difficulty: "基础",
    question: "故障检测率（FDR）主要衡量什么能力？",
    options: [
      { key: "A", text: "故障发生后正确发出告警的能力" },
      { key: "B", text: "将故障定位到指定 LRU 的能力" },
      { key: "C", text: "系统正常时误告警的频率" },
      { key: "D", text: "降低维修成本的能力" }
    ],
    answer: ["A"],
    explanation: "FDR 是故障检测率，反映故障发生后系统正确检测并发出告警的能力，用于评价漏报水平。",
    source: "课程大纲 · PHM 指标",
    tags: ["FDR", "检测率"]
  },
  {
    id: "phm-02",
    category: "健康监测与 PHM",
    type: "single",
    difficulty: "基础",
    question: "将故障定位到指定 LRU 或有限候选单元的能力，对应哪个指标？",
    options: [
      { key: "A", text: "故障检测率 FDR" },
      { key: "B", text: "故障隔离率 FIR" },
      { key: "C", text: "虚警率 FAR" },
      { key: "D", text: "平均故障间隔时间 MTBF" }
    ],
    answer: ["B"],
    explanation: "FIR 是故障隔离率，评价故障定位的准确性与隔离粒度，直接影响可维修性。",
    source: "课程大纲 · PHM 指标",
    tags: ["FIR", "隔离率"]
  },
  {
    id: "phm-03",
    category: "健康监测与 PHM",
    type: "single",
    difficulty: "基础",
    question: "系统正常时错误发出故障告警的频率，称为什么指标？",
    options: [
      { key: "A", text: "故障检测率 FDR" },
      { key: "B", text: "故障隔离率 FIR" },
      { key: "C", text: "虚警率 FAR" },
      { key: "D", text: "剩余使用寿命 RUL" }
    ],
    answer: ["C"],
    explanation: "FAR 是虚警率，反映系统正常时错误告警的频率，关系到告警可信度和维修资源占用。",
    source: "课程大纲 · PHM 指标",
    tags: ["FAR", "虚警率"]
  },
  {
    id: "phm-04",
    category: "健康监测与 PHM",
    type: "multiple",
    difficulty: "进阶",
    question: "以下关于飞机健康监测三层技术链路的描述，正确的有？",
    options: [
      { key: "A", text: "机载传感器是感知起点，负责将温度、压力等物理量转换为电信号" },
      { key: "B", text: "数据采集与传输环节完成模拟信号数字化与机载总线上报" },
      { key: "C", text: "实时报文监控环节实现异常识别与多级预警" },
      { key: "D", text: "三个环节独立运行，无数据交互" }
    ],
    answer: ["A", "B", "C"],
    explanation: "感知、传输与预警三个环节环环相扣，形成完整信号流，并非彼此独立。",
    source: "第二章作业",
    tags: ["三层链路", "数据流"]
  },
  {
    id: "phm-05",
    category: "健康监测与 PHM",
    type: "single",
    difficulty: "基础",
    question: "PHM 闭环的五个环节，正确顺序是？",
    options: [
      { key: "A", text: "数据采集 → 状态监测 → 故障诊断 → 寿命预测 → 维修决策" },
      { key: "B", text: "故障诊断 → 数据采集 → 维修决策 → 状态监测 → 寿命预测" },
      { key: "C", text: "状态监测 → 维修决策 → 数据采集 → 寿命预测 → 故障诊断" },
      { key: "D", text: "寿命预测 → 故障诊断 → 数据采集 → 状态监测 → 维修决策" }
    ],
    answer: ["A"],
    explanation: "PHM 从数据采集建立感知基础，依次完成状态监测、故障诊断和寿命预测，最终支撑维修决策。",
    source: "课程大纲 · PHM",
    tags: ["五环节", "闭环"]
  },
  {
    id: "phm-06",
    category: "健康监测与 PHM",
    type: "single",
    difficulty: "基础",
    question: "PHM 四层架构中，负责估计剩余使用寿命与退化趋势的是哪一层？",
    options: [
      { key: "A", text: "感知层" },
      { key: "B", text: "诊断层" },
      { key: "C", text: "预测层" },
      { key: "D", text: "决策层" }
    ],
    answer: ["C"],
    explanation: "预测层面向未来，估计剩余使用寿命与退化趋势，为前瞻性维修决策提供依据。",
    source: "课程大纲 · PHM",
    tags: ["四层架构", "预测层"]
  },
  {
    id: "phm-07",
    category: "健康监测与 PHM",
    type: "judge",
    difficulty: "基础",
    question: "健康监测主要回答飞机当前处于何种技术状态，故障诊断则进一步判断故障存在性、发生部位与原因。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["A"],
    explanation: "健康监测侧重状态感知与异常发现，故障诊断在异常基础上完成定位、定性与原因分析。",
    source: "课程大纲 · AHM",
    tags: ["AHM", "故障诊断"]
  },
  {
    id: "phm-08",
    category: "健康监测与 PHM",
    type: "single",
    difficulty: "基础",
    question: "AHM 技术的发展推动航空维修策略发生怎样的转变？",
    options: [
      { key: "A", text: "从定时维修转向视情维修，并进一步走向预测性维修" },
      { key: "B", text: "从视情维修退回定时维修" },
      { key: "C", text: "只保留故障后维修" },
      { key: "D", text: "取消所有定期检查" }
    ],
    answer: ["A"],
    explanation: "健康监测与诊断能力提升，使维修策略由固定时间间隔的定时维修，转向基于状态的视情维修和预测性维修。",
    source: "课程大纲 · 维修策略",
    tags: ["视情维修", "预测性维修"]
  },
  {
    id: "phm-09",
    category: "健康监测与 PHM",
    type: "single",
    difficulty: "进阶",
    question: "FMECA 指导传感器部署的三步法中，第一步是？",
    options: [
      { key: "A", text: "梳理故障模式，识别优先监测对象" },
      { key: "B", text: "直接采购传感器" },
      { key: "C", text: "先计算全部维修成本" },
      { key: "D", text: "先确定传感器颜色和尺寸" }
    ],
    answer: ["A"],
    explanation: "三步法先梳理故障模式，再识别可观测参数与监测点，最后按危害等级决定冗余和工程约束。",
    source: "课程大纲 · FMECA",
    tags: ["FMECA", "传感器部署"]
  },
  {
    id: "phm-10",
    category: "健康监测与 PHM",
    type: "judge",
    difficulty: "进阶",
    question: "关键监测参数通常至少采用双余度，飞控相关参数可达三至四余度，同时还要权衡成本、重量、可靠性与适航要求。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["A"],
    explanation: "冗余设计要随故障危害等级提高，但也不能无限增加，需要综合成本、重量、可靠性和适航要求。",
    source: "课程大纲 · FMECA",
    tags: ["冗余", "适航"]
  },
  {
    id: "phm-11",
    category: "健康监测与 PHM",
    type: "judge",
    difficulty: "基础",
    question: "PHM 只负责故障诊断，不涉及寿命预测与维修决策。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["B"],
    explanation: "PHM 是集状态监测、故障诊断、寿命预测与维修决策于一体的系统级技术框架，并非只有诊断。",
    source: "课程大纲 · PHM",
    tags: ["PHM", "概念"]
  },
  {
    id: "data-01",
    category: "数据链路与预处理",
    type: "single",
    difficulty: "基础",
    question: "ARINC 429 在机载数据传输中的典型定位是？",
    options: [
      { key: "A", text: "低速主流机载数据总线" },
      { key: "B", text: "高速航空以太网" },
      { key: "C", text: "军用 1553B 总线" },
      { key: "D", text: "空地报文通信系统" }
    ],
    answer: ["A"],
    explanation: "ARINC 429 是应用广泛的低速主流机载总线。AFDX 面向高速以太网，1553B 常用于军用/高可靠场景，ACARS 用于空地报文。",
    source: "课程大纲 · 数据总线",
    tags: ["ARINC 429", "总线"]
  },
  {
    id: "data-02",
    category: "数据链路与预处理",
    type: "multiple",
    difficulty: "进阶",
    question: "以下哪些属于课程中提到的机载数据总线或传输规范？",
    options: [
      { key: "A", text: "ARINC 429" },
      { key: "B", text: "ARINC 629" },
      { key: "C", text: "AFDX" },
      { key: "D", text: "1553B" }
    ],
    answer: ["A", "B", "C", "D"],
    explanation: "ARINC 429、ARINC 629、AFDX 与 1553B 都是课程中提到的机载数据传输规范，各自面向不同速率和可靠性场景。",
    source: "课程大纲 · 数据总线",
    tags: ["总线", "规范"]
  },
  {
    id: "data-03",
    category: "数据链路与预处理",
    type: "single",
    difficulty: "基础",
    question: "ACARS 主要承担什么功能？",
    options: [
      { key: "A", text: "飞机与地面之间的报文通信" },
      { key: "B", text: "客舱娱乐视频传输" },
      { key: "C", text: "发动机点火控制" },
      { key: "D", text: "液压系统增压" }
    ],
    answer: ["A"],
    explanation: "ACARS 是飞机通信寻址与报告系统，用于飞机与地面之间传输航班、维护和运行报文。",
    source: "课程大纲 · 数据总线",
    tags: ["ACARS", "空地报文"]
  },
  {
    id: "data-04",
    category: "数据链路与预处理",
    type: "single",
    difficulty: "基础",
    question: "OOOI 事件触发的典型应用场景是？",
    options: [
      { key: "A", text: "按航班阶段事件采集和上报数据" },
      { key: "B", text: "每秒固定采集一次全部参数" },
      { key: "C", text: "仅由维修人员手动触发" },
      { key: "D", text: "只在发生故障后采集" }
    ],
    answer: ["A"],
    explanation: "OOOI 分别对应 Out、Off、On、In 等航班阶段事件，可在关键节点触发数据采集与报文上报。",
    source: "课程大纲 · 触发机制",
    tags: ["OOOI", "事件触发"]
  },
  {
    id: "data-05",
    category: "数据链路与预处理",
    type: "multiple",
    difficulty: "进阶",
    question: "飞机健康监测中常见的触发机制包括哪些？",
    options: [
      { key: "A", text: "时间/周期触发" },
      { key: "B", text: "事件触发（如 OOOI）" },
      { key: "C", text: "阈值越限触发" },
      { key: "D", text: "只能依赖人工触发" }
    ],
    answer: ["A", "B", "C"],
    explanation: "周期、事件和阈值越限三类触发机制互补，可兼顾常规监控、关键阶段数据与异常事件捕捉。",
    source: "课程大纲 · 触发机制",
    tags: ["触发机制", "周期"]
  },
  {
    id: "data-06",
    category: "数据链路与预处理",
    type: "single",
    difficulty: "基础",
    question: "课程中提到的数据预处理四个维度是？",
    options: [
      { key: "A", text: "完整性、准确性、一致性、时效性" },
      { key: "B", text: "体积、重量、功耗、成本" },
      { key: "C", text: "压力、温度、流量、振动" },
      { key: "D", text: "采集、传输、存储、展示" }
    ],
    answer: ["A"],
    explanation: "数据预处理重点保证数据完整、准确、一致和及时，为后续监测、诊断与预测提供可靠输入。",
    source: "课程大纲 · 数据预处理",
    tags: ["数据质量", "四维度"]
  },
  {
    id: "fta-01",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "基础",
    question: "在故障树分析中，顶事件是指什么？",
    options: [
      { key: "A", text: "系统正常运行的状态" },
      { key: "B", text: "导致系统失效的最终结果" },
      { key: "C", text: "系统中某一部件的故障" },
      { key: "D", text: "系统中某一部件的正常状态" }
    ],
    answer: ["B"],
    explanation: "顶事件是故障树分析所关注的系统级不希望发生事件，通常描述系统失效或严重后果。",
    source: "项目三 · 故障树",
    tags: ["顶事件", "FTA"]
  },
  {
    id: "fta-02",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "基础",
    question: "故障树分析中，基本事件是指什么？",
    options: [
      { key: "A", text: "系统整体的失效模式" },
      { key: "B", text: "导致系统失效的直接原因" },
      { key: "C", text: "系统中某一部件的正常工作状态" },
      { key: "D", text: "系统中某一部件的维护状态" }
    ],
    answer: ["B"],
    explanation: "基本事件是无需继续分解的底层故障原因，通常是部件失效、环境因素或人为差错。",
    source: "项目三 · 故障树",
    tags: ["基本事件", "FTA"]
  },
  {
    id: "fta-03",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "基础",
    question: "在故障树分析中，逻辑门的作用是什么？",
    options: [
      { key: "A", text: "表示系统中各个部件之间的物理连接" },
      { key: "B", text: "表示各个事件之间的逻辑关系" },
      { key: "C", text: "表示系统中各个部件的工作状态" },
      { key: "D", text: "表示系统中各个部件的维护状态" }
    ],
    answer: ["B"],
    explanation: "逻辑门用于表达事件之间的逻辑组合关系，例如与门表示全部输入事件发生才导致输出事件发生，或门表示任一输入事件发生即可。",
    source: "项目三 · 故障树",
    tags: ["逻辑门", "FTA"]
  },
  {
    id: "fta-04",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "基础",
    question: "故障树分析中，布尔代数表达式主要用于什么？",
    options: [
      { key: "A", text: "描述系统的物理特性" },
      { key: "B", text: "描述系统的逻辑关系并支持化简计算" },
      { key: "C", text: "描述系统的维护策略" },
      { key: "D", text: "描述系统的故障模式" }
    ],
    answer: ["B"],
    explanation: "布尔代数把故障树转换为逻辑表达式，可进行化简、求最小割集以及开展概率计算。",
    source: "项目三 · 故障树",
    tags: ["布尔代数", "FTA"]
  },
  {
    id: "fta-05",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "基础",
    question: "在故障树分析中，最小割集指的是什么？",
    options: [
      { key: "A", text: "系统中所有可能的故障组合" },
      { key: "B", text: "导致系统失效的最小故障组合" },
      { key: "C", text: "系统中所有可能的正常工作状态组合" },
      { key: "D", text: "系统中所有可能的维护状态组合" }
    ],
    answer: ["B"],
    explanation: "最小割集中任一底事件不发生，该组合就不再导致顶事件发生，因此它描述了系统失效的最小充分条件。",
    source: "项目三 · 故障树",
    tags: ["最小割集", "FTA"]
  },
  {
    id: "fta-06",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "进阶",
    question: "最小割向量 X 的定义是？",
    options: [
      { key: "A", text: "对任意 Z<X，均有 Φ(Z)=0" },
      { key: "B", text: "对任意 Z>X，均有 Φ(Z)=1" },
      { key: "C", text: "所有底事件均处于正常状态" },
      { key: "D", text: "顶事件概率等于 1" }
    ],
    answer: ["A"],
    explanation: "最小割向量是使顶事件发生的状态向量，并且其任何真子向量都不能使顶事件发生，因此满足对任意 Z<X 有 Φ(Z)=0。",
    source: "课程大纲 · 故障树计算",
    tags: ["割向量", "最小割"]
  },
  {
    id: "fta-07",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "基础",
    question: "贝叶斯网络的两项核心结构组成是？",
    options: [
      { key: "A", text: "有向无环图与条件概率表" },
      { key: "B", text: "二叉树与维修工单" },
      { key: "C", text: "时间序列与阈值表" },
      { key: "D", text: "传感器清单与备件清单" }
    ],
    answer: ["A"],
    explanation: "贝叶斯网络由有向无环图表达变量间依赖关系，并由条件概率表（CPT）量化节点之间的影响程度。",
    source: "课程大纲 · 贝叶斯",
    tags: ["贝叶斯网络", "CPT"]
  },
  {
    id: "fta-08",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "进阶",
    question: "故障树中，结构重要度反映的是什么？",
    options: [
      { key: "A", text: "底事件在故障树结构中对顶事件的影响程度" },
      { key: "B", text: "底事件的精确发生概率" },
      { key: "C", text: "系统维修成本高低" },
      { key: "D", text: "传感器测量精度" }
    ],
    answer: ["A"],
    explanation: "结构重要度从故障树拓扑结构出发评价底事件的重要性，不考虑底事件具体概率大小。",
    source: "课程大纲 · 故障树计算",
    tags: ["结构重要度", "FTA"]
  },
  {
    id: "fta-09",
    category: "故障树与可靠性",
    type: "judge",
    difficulty: "基础",
    question: "最小割集是导致系统失效的最小故障组合，若其中任一底事件不发生，该组合便不再导致顶事件发生。",
    options: [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" }
    ],
    answer: ["A"],
    explanation: "这是最小割集的定义。最小割集可用于识别系统的薄弱环节，并进一步计算顶事件发生概率。",
    source: "课程大纲 · 故障树",
    tags: ["最小割集", "定义"]
  },
  {
    id: "fta-10",
    category: "故障树与可靠性",
    type: "single",
    difficulty: "基础",
    question: "设备故障率的浴盆曲线通常由哪三个阶段组成？",
    options: [
      { key: "A", text: "早期失效期（递减）、偶发失效期（恒定）、耗损失效期（递增）" },
      { key: "B", text: "设计期、制造期、报废期" },
      { key: "C", text: "正常状态、异常状态、故障状态" },
      { key: "D", text: "预热阶段、巡航阶段、冷却阶段" }
    ],
    answer: ["A"],
    explanation: "浴盆曲线描述产品故障率随时间的变化：早期失效期故障率递减，偶发失效期相对恒定，耗损失效期因老化磨损而递增。",
    source: "课程大纲 · 可靠性",
    tags: ["浴盆曲线", "故障率"]
  }
];
