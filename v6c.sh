#!/bin/bash
# v6c 车头朝向修复+官方图更新 — 纯 ox-alpha-free
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight4.log
echo "===== v6c启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3 4; do
  [ -f ORIENT_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v6c轮 $i/4" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v6c_orient.md 重读目标,git log --oneline -3 确认现状。任务:1)修真车装反问题(GLB 朝向180°,排气尾翼跑到车头;同时确保程序化发动机在真车车头下、排气通到车尾三出口) 2)用真外壳重截 README 四张 release 官方图(覆盖 shots/shot-*-release.png,文件名不变)。Playwright 截图自验车头朝向正确,git commit 后写 ORIENT_DONE。若上轮已部分完成从断点继续。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v6c轮 $i 退出=$? DONE=$([ -f ORIENT_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v6c结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
