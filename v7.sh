#!/bin/bash
# v7 痛车涂装 — 纯 ox-alpha-free;等 v6e(DETAIL_DONE)完成后再开跑
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight4.log
echo "===== v7排队,等待 v6e =====" >> "$LOG"
for w in $(seq 1 60); do
  [ -f DETAIL_DONE ] && break
  [ -f v6e_dead ] && { echo "v6e dead, v7 abort" >> "$LOG"; exit 1; }
  sleep 60
done
echo "===== v7启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3 4 5; do
  [ -f ITASHA_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v7轮 $i/5" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v7_itasha.md 重读目标,git log --oneline -3 确认现状。任务:实现痛车涂装投影系统(侧面平面投影贴花+canvas去底+款式下拉+X光/爆炸联动),素材从 ~/FL5_itasha_concepts/ 拷贝 N4b/N3/N1 到 livery/。逐项截图自验,git commit 后写 ITASHA_DONE。若上轮已部分完成从断点继续。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v7轮 $i 退出=$? DONE=$([ -f ITASHA_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v7结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
