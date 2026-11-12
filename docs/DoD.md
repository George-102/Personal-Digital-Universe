# Definition of Done — Personal Digital Universe

> 本文件定义“什么算真正完成”。任何一次发布必须同时满足 A、B、C、D 四组条件，缺少任一条件即视为未完成，不得对外公开链接。

---

## A. 可访问与可降级（网站是活着的，且不会把人挡在门外）

- [ ] 桌面 Chrome / Edge / Firefox / Safari 最近两个版本可正常打开。
- [ ] iOS Safari 与 Android Chrome 可正常打开，无横向溢出。
- [ ] 无 WebGL 时，所有文字、导航、联系方式仍完整可见；3D 区域显示静态背景或 CSS 动态背景。
- [ ] 3D 资源（GLB、纹理）加载失败时，不白屏、不阻塞阅读；对应区域使用封面图或 CSS 占位。
- [ ] 3D 上下文丢失时，尝试恢复一次；失败则自动切换到静态模式，不出现未捕获异常。
- [ ] 首屏文字不依赖 3D 加载完成；LCP 元素不是 Canvas。
- [ ] 移动端菜单可正常展开/关闭；触摸操作可用。
- [ ] 页面无 404 / 500 错误；`/sitemap.xml` 与 `/robots.txt` 返回 200。

---

## B. 信息可信与可读（访客能在 30 秒内正确理解你）

- [ ] 首页可见姓名（笔名/英文名）、身份描述、Explore 入口。
- [ ] 教育经历中，考研状态表述为 **Preparing for Graduate Entrance Examination**，不得显示为研究生在读或已获硕士学历。
- [ ] 论文只展示 **名称 + 状态（Published / Preprint / In Progress）**，未发表论文不得标记为 Published。
- [ ] 产品状态真实：Released / Beta / In Development / Discontinued 与实际一致。
- [ ] 《法渊》等作品未完成时标记 **Writing / In Progress**。
- [ ] DAC 3D 空域可视化带有 **“Conceptual illustration, not simulation data”** 标注。
- [x] 未配置的 CV、链接、图片不显示无效入口。（US-006f：默认无 `cvUrl` 时静态 HTML 无 download 链接，配置后临时构建实测入口与 `/cv.pdf` 200）
- [ ] 中英双语均可切换；关键页面（首页、About、Research、Projects、Writing、Contact）中文和英文文案均存在。
- [ ] 所有可点击外链可打开；失效外链不导致页面报错。

---

## C. 可被搜索与可分享（别人找得到，分享出去有脸）

- [ ] 每个主要路由有独立 `<title>`、`meta[name=description]`、`og:title`、`og:description`。
- [ ] 首页包含 Person Schema（JSON-LD），姓名、身份、GitHub、邮箱等字段可被搜索引擎读取。
- [ ] `sitemap.xml` 包含所有公开路由，`robots.txt` 允许抓取并引用 sitemap。
- [ ] 核心个人介绍、研究方向、项目名称、作品名称出现在静态 HTML 中，不只在 Canvas 或客户端 JS 里。
- [ ] OG 图片可访问；分享到微信/Twitter/LinkedIn 时有合理预览。
- [ ] 每个页面只有一个 `<h1>`；标题层级不跳级。

---

## D. 可维护与可衡量（你能长期低成本维护，且知道它在变好还是变坏）

- [x] 项目/论文/产品/作品/文章/经历使用 `content/` 下的结构化数据维护；新增一条数据后页面自动展示。
- [x] 字段缺失不导致页面崩溃；缺失字段有默认值或条件渲染。
- [ ] GitHub Token 不出现在前端 bundle；GitHub API 失败时使用本地 `github-cache.json` 或手写 fallback。
- [x] 3D 组件离开视口时暂停或降低更新频率；卸载时释放 geometry / material / texture。
- [ ] `prefers-reduced-motion: reduce` 时，持续粒子运动、滚动驱动相机、复杂转场被关闭或简化；导航和按钮反馈仍可用。
- [ ] 主题切换在刷新后保持；localStorage 不可用时回退系统主题。
- [ ] `npm run verify` 全部通过（Playwright + Lighthouse CI + 链接检查 + SEO 检查 + 质量指标：0 高危漏洞 / i18n 键 100% / JS 体积预算）——**由云端 `.github/workflows/verify.yml` 的 `verify` job 逐条执行等价全链**（push main / PR 自动触发），证据为 CI run URL 并回写 `feature_list.json` / `claude-progress.md`；本地 `npm run verify:local` 不替代此项。
- [x] GitHub Actions 在公开仓库中免费运行；门禁全绿后才由同一条流水线部署，且部署产物就是被验证的那份 `out/`，不产生费用。
- [x] 已配置 Cloudflare Web Analytics（或等价免费统计）和 UptimeRobot 免费可用性监控。
- [x] 代码许可证与内容许可证文件存在，Footer 有版权声明。
- [x] README 包含：本地启动、内容维护方式、部署方式、验收命令、降级说明。

---

## 人工验收（无法自动化的部分，发布前逐项打勾）

- [ ] 3D 场景不遮挡姓名、身份文字、导航和 CTA。
- [ ] 动画整体克制，没有高频闪烁或令人不适的快速运动。
- [ ] 移动端不是桌面端的简单缩放；触摸目标大小合理。
- [ ] 中英文切换后，文案语气和专业术语一致，没有明显机翻感。
- [ ] 笔名/英文名在全站保持一致，没有混入真实姓名。
- [ ] 所有图片、字体、封面有可用来源，无版权风险。
- [ ] 《法渊》的展示方式符合你的意愿（不全文搬运，只展示简介/状态/外部链接）。