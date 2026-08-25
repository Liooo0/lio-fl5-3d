#!/bin/bash
# v6b X光修补 — 纯 ox-alpha-free
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight4.log
echo "===== v6b启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3 4; do
  [ -f XRAY_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v6b轮 $i/4" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v6b_xray.md 重读目标,git log --oneline -3 确认现状,然后修X光透视(内饰/玻璃/漆面全套透明联动+renderOrder)和车顶bloom炸光,Playwright截图自验(xray=0.15能看清红色发动机),git commit后写XRAY_DONE。若上轮已部分完成从断点继续。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v6b轮 $i 退出=$? DONE=$([ -f XRAY_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v6b结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
