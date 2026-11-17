# AeroPrep 课程刷题站

基于课程大纲、作业与学习笔记整理的可运行刷题网站。网站包含两门**完全独立**的课程空间，共用一个入口与视觉风格，但题库、错题、简答草稿、自评和学习进度互不混算。

- 飞机健康监测与故障诊断：56 道客观题 + 11 道简答题
- 人为因素与航空法规：70 道客观题 + 12 道简答题

纯静态页面，不需要后端，可直接部署到 GitHub Pages。

![页面预览](preview.png)

## 在线访问

- 学习站首页：https://yaaaccc.github.io/aircraft-health-quiz/
- 人为因素与航空法规：https://yaaaccc.github.io/aircraft-health-quiz/human-factors.html
- GitHub 仓库：https://github.com/Yaaaccc/aircraft-health-quiz

## PDF 题库

两门课各自有一份打印版题库：

```text
output/pdf/飞机健康监测与故障诊断_题库.pdf
output/pdf/人为因素与航空法规_题库.pdf
```

- 健康监测 PDF：41 页，56 道客观题 + 11 道简答。
- 人为因素 PDF：46 页，70 道客观题 + 12 道简答。

两份 PDF 均分为客观题、客观题答案、简答题、简答参考答案四大部分，包含正确选项、解析、来源、评分关键词和知识点，适合打印后闭卷练习。

## 功能

- 单选题、多选题、判断题即时判题
- 选择后自动显示正确答案、解析、来源与知识点标签
- 11 道健康监测简答题：草稿保存、先作答后展开答案、“掌握 / 模糊 / 不会”自评
- 12 道人为因素简答题：独立草稿与自评，不与健康监测混算
- 顺序练习、随机 20 题、章节 / 模块练习、错题重练
- 错题自动归档，重练答对后自动移出
- 题目搜索、题型筛选、模块筛选
- 两门课程分别使用独立 `localStorage` 键保存进度
- 桌面端与移动端响应式布局

## 本地运行

直接双击 `index.html` 即可使用。为了让学习进度稳定保存在浏览器中，更推荐用本地服务器或 GitHub Pages 访问。

如果希望用本地服务器预览：

```powershell
cd D:\Codex\aircraft-health-quiz
python -m http.server 8000
```

然后打开 `http://localhost:8000/`。

人为因素课程入口：

```text
http://localhost:8000/human-factors.html
```

## 目录

```text
aircraft-health-quiz/
├── index.html                  # 飞机健康监测入口
├── app.js                      # 健康监测刷题与简答逻辑
├── questions.js                # 健康监测客观题
├── short-answers.js            # 健康监测简答题
├── human-factors.html          # 人为因素与航空法规入口
├── human-factors.js            # 人为因素刷题与简答逻辑
├── human-factors-questions.js  # 人为因素客观题与简答题
├── human-factors.css           # 第二门课程的局部样式
├── styles.css                  # 共用界面与响应式样式
├── assets/                     # 简答题图片
├── output/pdf/                 # 打印版题库 PDF
└── favicon.svg
```

## 发布到 GitHub Pages

在项目目录执行：

```powershell
git init
git add .
git commit -m "feat: add aircraft health quiz"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

然后在 GitHub 仓库中进入 `Settings` → `Pages`：

1. `Build and deployment` 选择 `Deploy from a branch`
2. 分支选择 `main`
3. 目录选择 `/ (root)`
4. 保存后等待约 1 分钟

发布地址通常是：

```text
https://你的用户名.github.io/你的仓库名/
```

## 题库维护

健康监测客观题在 `questions.js`，简答题在 `short-answers.js`。

人为因素客观题和简答题都在 `human-factors-questions.js`：

```js
{
  id: "hf-01",
  chapter: "第一章 绪论",
  type: "single", // single | multiple | judge
  difficulty: "基础",
  question: "题干",
  options: ["选项一", "选项二"],
  answer: [0], // 正确选项索引；多选可写多个索引
  explanation: "答案解析",
  source: "学习笔记 · 第一章 绪论",
  tags: ["知识点"]
}
```

健康监测客观题格式：

```js
{
  id: "sensor-01",
  category: "传感器与测量",
  type: "single", // single | multiple | judge
  difficulty: "基础",
  question: "题干",
  options: [{ key: "A", text: "选项内容" }],
  answer: ["A"],
  explanation: "答案解析",
  source: "课程作业",
  tags: ["知识点"]
}
```

新增题目时保持 `id` 唯一，并确保 `answer` 中的选项键存在于 `options` 中。

## 资料说明

- 健康监测题库依据课程大纲、六次作业及作业作答整理。
- 压力传感器选型题采用作业官方答案。
- 故障树作图/计算题依据作业手写作答与 95 分记录整理，非官方标准答案。
- 人为因素题库依据《人为因素和航空法规-学习笔记3.0.pdf》整理。
- 法规部分若与现行 CCAR 或任课教师最新口径不一致，以最新规章和课堂要求为准。
