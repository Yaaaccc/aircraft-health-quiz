# AeroPrep 飞机健康监测题库

基于《飞机健康监测与故障诊断》课程大纲与作业整理的可运行刷题网页。当前版本包含 56 道客观题，纯静态页面，不需要后端，可直接部署到 GitHub Pages。

![页面预览](preview.png)

## PDF 题库

打印版题库位于：

```text
output/pdf/飞机健康监测与故障诊断_题库.pdf
```

PDF 共 33 页，分为试题与答案两大部分，包含正确选项、解析、来源和知识点，适合打印后闭卷练习。

## 功能

- 单选题、多选题、判断题即时判题
- 选择后自动显示正确答案、解析、来源与知识点标签
- 顺序练习、随机 20 题、分类练习、错题重练、收藏专项
- 错题自动归档，重练答对后自动移出
- 题目搜索、题型筛选、模块筛选
- 学习进度、正确率、连续学习天数保存在浏览器 `localStorage`
- 桌面端与移动端响应式布局

## 本地运行

直接双击 `index.html` 即可使用。为了让学习进度稳定保存在浏览器中，更推荐用本地服务器或 GitHub Pages 访问。

如果希望用本地服务器预览：

```powershell
cd D:\Codex\aircraft-health-quiz
python -m http.server 8000
```

然后打开 `http://localhost:8000/`。

## 目录

```text
aircraft-health-quiz/
├── index.html      # 页面结构
├── styles.css      # 界面与响应式样式
├── app.js          # 刷题、判题、进度与路由逻辑
├── questions.js    # 题库数据
├── output/pdf/     # 打印版题库 PDF
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

题目都在 `questions.js` 中，每题包含：

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

## 后续可扩展

- 填空题、简答题与计算题答题模式
- 错题导出、学习记录导入
- 图片题与故障树图形交互
- 模拟考试计时与交卷评分
