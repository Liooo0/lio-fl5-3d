#!/bin/bash
# v6e 细节修补(把手/发动机/排气) — 纯 ox-alpha-free
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight4.log
echo "===== v6e启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3 4 5; do
  [ -f DETAIL_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v6e轮 $i/5" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v6e_detail.md 重读目标,git log --oneline -3 确认现状。任务:修三个用户反馈的外观缺陷——后门把手缺失、机舱发动机太假(启用GLB自带EngineA发动机,程序化发动机改为回退备用)、中置三出排气对位(品字形,粒子发射器跟随)。逐项 Playwright 截图自验,git commit 后写 DETAIL_DONE。若上轮已部分完成从断点继续。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v6e轮 $i 退出=$? DONE=$([ -f DETAIL_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v6e结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
