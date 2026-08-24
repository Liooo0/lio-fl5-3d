# FL5 3D 剖视模型 — 任务书（BRIEF）

## 一句话目标
在 `~/projects/fl5-3d` 用 **Three.js (ES Modules, importmap)** 写一个**纯网页交互式 Honda Civic Type R FL5 剖视模型**:从外部车身到内部机械组件,支持镜头推进、透视、爆炸视图。全程自主完成,不要提问。

## 硬性要求
1. **零依赖本地可跑**:所有代码手写,不 npm install;Three.js 通过 CDN importmap 加载(用户网络有代理,CDN 可达)。入口 `index.html`,双击/本地服务器打开即可运行。
2. **必须真实验证**:写完后用 `node` 起静态服务器(端口 8790),再用 Playwright(`~/Library/Caches/ms-playwright/chromium-*/chrome-mac/...` 或 `npx playwright screenshot` / 自写脚本)打开页面:
   - 收集 console error/warning 和 pageerror
   - 截图至少 4 个视角:整车外观、机舱特写、底盘悬挂、座舱/排气
   - 检测 WebGL context 存在且 canvas 有非黑像素
   - 把结果写入 VERIFICATION.md
3. **rAF 断链防护**(血泪坑):requestAnimationFrame 回调整体 try/catch,异常收集到 `window.__errs`;`window.__fl5 = {phase, errs, parts}` 测试接口。
4. **缓存版本号**:HTML 引用 `<script src="app.js?v=1">`(或 module+importmap 时用文件名带 ?v=),每次改 JS 必须 bump 版本号。

## FL5 特征(必做,做错=返工)
- 掀背溜背轮廓(fastback hatch),不是三厢轿车
- 尾门两侧**中置三出排气**
- 高位大尾翼
- 蜂窝格栅 + 引擎盖进气口(scoop)
- 19 寸黑色轮毂 + Brembo 风格前 4 活塞红卡钳
- 车身尺寸约 4.59m × 1.88m(不含镜)× 1.42m

## 内部机械组件清单(全部要建模)
| 系统 | 组件 |
|---|---|
| 动力 | K20C1 2.0T 直四发动机(缸体+气门室盖+进气歧管),涡轮增压器(蜗壳+压气机壳),中冷器+增压管路,油底壳 |
| 传动 | 6MT 手动变速箱(锥形壳体)+ 传动轴 + 前差速器+左右半轴 |
Transaxle 注意:FL5 是横置前驱,变速箱与发动机并排横置,半轴直接出变速箱两侧——不要做纵置传动轴到后轮! |
| 悬挂 | 前 MacPherson(弹簧+减震筒+下摆臂),后多连杆(弹簧+减震+多根连杆) |
| 制动 | 四轮制动盘+卡钳 |
| 排气 | 涂蓝隔热罩头段→高流量三元→中段→尾端三出排气口 |
| 冷却 | 散热器+电子扇,膨胀水壶 |
| 车身 | 白车身框架(线框或半透明),座舱(2 排座椅+方向盘+仪表台),电池,油箱 |

## 交互功能(核心卖点)
1. **镜头推进**:OrbitControls + 滚轮 dolly 到机舱内部看活塞/曲轴细节;near/far 平面调好防裁切。
2. **运镜模式**:按钮「▶ 运镜模式」启动自动飞行:外观环绕→俯冲进机舱→发动机特写→沿排气走到车尾→底盘悬挂→回外观,每站停留数秒并在 HUD 显示当前站点名(如「K20C1 发动机 · 涎...」)。再点一次退出。
3. **X光滑块**:车壳 opacity 1→0.05,机械组保持可见。
4. **爆炸视图滑块**:各系统组按方向散开(发动机上移、车轮外移等),再拖回来。
5. **点击零件 → HUD 显示名称**(raycaster,给每个 mesh 设 userData.label)。
6. **UI 中文**,左上角标题「Honda Civic Type R FL5 · 3D 剖视」,底部提示条。

## 代码组织
- 单文件 `app.js`(允许 2000+ 行);`index.html` 极简。
- 圆柱/圆环/挤出几何拼装零件,材质 MeshStandardMaterial + 环境/平行光,加轻雾和地面阴影。
- 性能:总面数控制在 <500k 三角形,阴影 map 1024。

## 已知坑(照抄避坑)
- importmap 里 three/addons 路径:`https://unpkg.com/three@0.160.0/examples/jsm/`
- OrbitControls 必须从 addons 导入,不能自己实现完整版
- 相机 near=0.05 far=100,防止推近时被近裁切面裁掉
- Playwright 打开 `http://localhost:8790/index.html?v=1`,等待 `window.__fl5.ready === true`(poll 10s),失败重试一次
- macOS 本地起服务不用代理变量(export no_proxy=localhost,127.0.1)

export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1 后再起本地服务/截图

## 结尾
全程自主完成,不要提问,不要停下来等确认。完成标准:index.html + app.js 可运行、VERIFICATION.md 有真实截图与 console 检查结果、git commit。
