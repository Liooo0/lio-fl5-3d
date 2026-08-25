#!/bin/bash
# v6 换壳手术 — 纯 ox-alpha-free,轮次给足(用户:ox free 随便烧)
cd "$(dirname "$0")" || exit 1
export no_proxy=localhost,127.0.0.1 NO_PROXY=localhost,127.0.0.1
LOG=overnight4.log
echo "===== v6启动 $(date '+%m-%d %H:%M') =====" >> "$LOG"
for i in 1 2 3 4 5 6 7 8; do
  [ -f SHELL_DONE ] && break
  echo "[$(date '+%m-%d %H:%M')] v6轮 $i/8" >> "$LOG"
  opencode run -s ses_fcb74ad28ffefeTf6s7yYy63zs -m oxfree/ox-alpha-free --auto "继续任务。先 cat BRIEF_v6_shellswap.md 重读目标,git log --oneline -3 和 ls shots/ 确认现状,然后按任务书做换壳手术(GLTFLoader接入models/fl5.glb真外壳,机械组保留,X光/爆炸/章节联动)。任务书里已有GLB材质名情报,不要重复解析模型。每完成一个大步骤单独commit并截图自验。若上轮已部分完成从断点继续。全部验收过了写 SHELL_DONE。全程自主,不要提问。" >> "$LOG" 2>&1
  echo "[$(date '+%m-%d %H:%M')] v6轮 $i 退出=$? DONE=$([ -f SHELL_DONE ] && echo yes || echo no)" >> "$LOG"
done
echo "===== v6结束 $(date '+%m-%d %H:%M') =====" >> "$LOG"
