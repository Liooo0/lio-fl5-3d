#!/bin/bash
# v6d bloom 炸白修补 — 纯 ox-alpha-free
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight4.log
echo "===== v6d启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3; do
  [ -f GLOSS_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v6d轮 $i/3" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v6d_gloss.md 重读目标,git log --oneline -3 确认现状。任务:真外壳上车顶/机盖bloom炸白,按任务书压bloom参数/漆面envMapIntensity/曝光,重截四张release官方图+俯视图(文件名不变),自验无成片炸白后 git commit 写 GLOSS_DONE。若上轮已部分完成从断点继续。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v6d轮 $i 退出=$? DONE=$([ -f GLOSS_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v6d结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
