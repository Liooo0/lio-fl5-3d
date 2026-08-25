# FL5-3D 开源发布报告 RELEASE REPORT

日期: 2026-08-25 · 版本: v1.0.0 (commit `5b844b2`)

## 链接

| 项目 | URL |
|---|---|
| 仓库 | https://github.com/Liooo0/lio-fl5-3d |
| GitHub Pages | https://liooo0.github.io/lio-fl5-3d/ |
| Release tag | `v1.0.0` |

> 注: 任务书中 Pages 域名写作 `lioopoo0.github.io`, 实际账号为 **Liooo0**, 正确域名为 `liooo0.github.io`(已实测 200)。

## 发布质检结果(全部通过)

1. **Secret 扫描**: `git grep -iE "sk-…|api_key|password|token"` 全历史 4 个 commit 0 命中 ✅
2. **内部文件**: `git ls-files` 无 BRIEF*.md / ROUND*.md / overnight.* / POLISH_DONE(.gitignore 隔离); VERIFICATION.md 清理了用户名指代与 `~/projects/fl5-3d` 本机路径后 commit(`5b844b2`) ✅
3. **绝对路径**: 全历史 grep `/Users/liuwendi|/Users/` 0 命中; serve.js 使用 `__dirname` 相对根 + localhost ✅
4. **Playwright 最终回归**(headless chromium, SwiftShader): `window.__fl5.ready=true`, **console error = 0**, **pageerror = 0**, 171 可点零件, 39,426 三角形, 四视角截图正常 ✅
   - 像素级对照 v11 基线: 布局一致、内容亮度更高(SwiftShader 参数差异致 PNG 更小), 非空图/非黑屏
5. **README 终审**: 英文 ✅ · 截图相对路径 shots/ ✅ · Pages 说明(含正式 URL) ✅ · MIT LICENSE 文件 ✅ · 免责声明(unofficial fan project, not affiliated with Honda)独立章节 ✅

## 功能清单

- K20C1 2.0T 发动机全解剖(红色气门室盖/进气歧管/涡轮/中冷)/ 6MT 变速箱 / 半轴 / 前麦弗逊+后多连杆 / Brembo 卡钳 / 蓝色隔热罩头段→中置三出排气 / 散热器 / 油箱 / 座舱(Recaro 风格座椅+平底方向盘)
- 纯程序化几何(零模型文件), ExtrudeGeometry 顶点雕塑车身 + clearcoat 冠军白车漆
- X光车壳滑块 / 爆炸视图滑块 / 8 站运镜模式(HUD) / 点击零件中文标签跟随 / 入场缓入+自动旋转
- ~39k 三角形, PCFSoft 阴影, ACES tone mapping, rAF try/catch 防断链 + `window.__fl5` 测试接口

## 已知限制

1. **Three.js 走 unpkg CDN**: 断网时页面停留在加载提示(Pages 部署同样依赖外网 CDN)
2. **headless/SwiftShader 下 FPS≈8**: 软渲染所致; 真机 GPU(<40k 三角)轻松 60FPS
3. **几何为近似还原**: 非官方数据建模, 比例按公开规格(4.59×1.88×1.42m, 轴距 2.74m)近似
4. **UI 为中文**: 零件标签与 HUD 中文为主(README 英文)
5. **无移动端专门适配**: 桌面浏览器体验最佳(触控未做手势区分)
6. **修改 app.js 需手动 bump** `index.html` 的 `?v=` 缓存版本号

## 截图清单(shots/, release 组为本轮回归实测)

| 文件 | 内容 |
|---|---|
| shot-exterior-release.png | 整车外观(冠军白, 五辐轮毂) |
| shot-engine-release.png | 机舱特写(K20C1+涡轮+管路, X光) |
| shot-chassis-release.png | 底盘悬挂(爆炸视图) |
| shot-cabin-release.png | 座舱与排气(X光) |
| shot-{exterior,engine,chassis,cabin,tour}(-v4/-v5/-v10/-v11).png | 历轮验证存档 |

## Git 全量 log

```
5b844b2 Release QA: sanitize VERIFICATION.md (drop local paths/username), add MIT LICENSE, final README review + release screenshots (console/pageerror=0)
75bc38b Round C: README.md + final verification + POLISH_DONE — all 6 checklist items pass (v11)
7ae620e Round B: engine bay details (valve cover dimples, capsule plenum, alternator), layered exhaust tips, Recaro seats, flat-bottom wheel, intro glide + auto-rotate + tip-follow (v11)
e401693 Round A: sculpted body surfaces, curved glass, clearcoat paint, 5-spoke wheels, ground AO+sky dome, dark BiW frame (v10)
afe57dd FL5 3D cutaway: Three.js interactive model + Playwright verification v3
```
