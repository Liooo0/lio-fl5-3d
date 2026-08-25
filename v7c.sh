#!/bin/bash
# v7c 门把手修复 — 纯 ox-alpha-free
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight4.log
echo "===== v7c启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3 4; do
  [ -f HANDLE_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v7c轮 $i/4" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v7c_handle.md 重读目标,git log --oneline -3 确认现状。背景:上一版程序化把手 handleX=0.8 兜底值,生成在车身内部看不见,用户两次反馈没有门把手。按任务书用射线定位法重做,Playwright 截图自验把手可见,git commit 后写 HANDLE_DONE。若上轮已部分完成从断点继续。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v7c轮 $i 退出=$? DONE=$([ -f HANDLE_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v7c结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
