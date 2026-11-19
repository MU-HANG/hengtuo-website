# 恒拓重工集团网站

恒拓重工集团为虚构企业。网站包含集团介绍、四大产业板块、研发与智造介绍，以及三款可交互的概念装备。

## 本地预览

在网站根目录运行 `python -m http.server 8000`，打开 `http://localhost:8000`。站点已随附构建后的 3D 渲染代码和图片。

## 更新内容

- 页面和品牌文案位于 `index.html`。
- 样式及玻璃按钮的高光效果位于 `styles.css`。
- 三款装备的文案和参数位于 `app.js`，模型结构位于 `viewer.js`。
- 修改模型后，运行 `npm ci` 和 `npm run build`，提交新的 `viewer.bundle.js`。
- GitHub Pages 使用 `main` 分支的根目录发布。图片和脚本使用相对地址。

页面图片由用户提供或由 AI 生成。三款概念装备为本项目建模。Three.js 使用 MIT 许可，许可证位于 `assets/THREE-LICENSE.txt`。
