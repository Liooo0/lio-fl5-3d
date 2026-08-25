#!/bin/bash
# v5b 辉光过曝修补 — 纯 ox-alpha-free
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight3.log
echo "===== v5b启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3; do
  [ -f BLOOM_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v5b轮 $i/3" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v5b_bloom.md 重读目标,然后按任务书调 bloom/曝光/车漆/地面反射,Playwright 截图自验无炸白光斑、车漆读作深红金属,git commit 后写 BLOOM_DONE。若上轮已部分完成从断点继续。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v5b轮 $i 退出=$? DONE=$([ -f BLOOM_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v5b结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
