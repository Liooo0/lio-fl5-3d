#!/bin/bash
# v7b 角色痛车涂装 — 纯 ox-alpha-free;等 v7(ITASHA_DONE)完成后再开跑
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight4.log
echo "===== v7b排队,等待 v7 =====" >> "$LOG"
for w in $(seq 1 90); do
  [ -f ITASHA_DONE ] && break
  [ -f v7_dead ] && { echo "v7 dead, v7b abort" >> "$LOG"; exit 1; }
  sleep 60
done
echo "===== v7b启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3 4 5; do
  [ -f CHAR_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v7b轮 $i/5" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v7b_char.md 重读目标,git log --oneline -3 确认现状。任务:在 v7 痛车系统上追加两款整车侧投影角色涂装(livery/utaha.png 霞之丘诗羽、livery/mai.png 樱岛麻衣,材质替换式投影,条带边缘 clamp 延展),款式下拉追加两项,README Liveries 节加版权注记。逐项截图自验,git commit 后写 CHAR_DONE。若上轮已部分完成从断点继续。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v7b轮 $i 退出=$? DONE=$([ -f CHAR_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v7b结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
