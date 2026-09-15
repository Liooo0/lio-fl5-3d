#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v31 出图脚本 — 用项目自带的 window.__fl5 测试接口出官方图。

用法:
  /usr/bin/python3 shots_capture.py            # 出 README 四张官方图
  /usr/bin/python3 shots_capture.py variants   # 出配色变体图（车漆/轮毂）
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "shots")
URL = os.environ.get("FL5_URL", "http://127.0.0.1:8790")
W, H = 1600, 900


def shoot(pg, path, view, paint=None, wheel=None, settle=1400):
    js = []
    if paint:
        js.append(f"__fl5.api.setPaint('{paint}')")
    if wheel:
        js.append(f"__fl5.api.setWheel('{wheel}')")
    js.append(f"__fl5.api.setView('{view}')")
    pg.evaluate("; ".join(js))
    pg.wait_for_timeout(settle)
    pg.screenshot(path=path)
    return path


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "release"
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(os.path.join(OUT, "release"), exist_ok=True)

    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--use-gl=angle", "--enable-unsafe-swiftshader"])
        pg = b.new_page(viewport={"width": W, "height": H})
        pg.goto(URL, wait_until="load")
        pg.wait_for_function("window.__fl5 && window.__fl5.phase === 'ready'", timeout=90_000)
        pg.wait_for_timeout(7000)          # 等 GLB 真车壳加载完
        mode_now = pg.evaluate("__fl5.shellMode || 'proc'")

        made = []
        if mode == "release":
            # README 四张官方图：文件名必须保持不变
            for view in ("exterior", "engine", "chassis", "cabin"):
                p = os.path.join(OUT, f"shot-{view}-release.png")
                shoot(pg, p, view)
                made.append(p)
                p2 = os.path.join(OUT, "release", f"shot-{view}-release.png")
                shoot(pg, p2, view)
                made.append(p2)
        else:
            jobs = [
                ("shot-white-exterior-v31.png", "exterior", "white", "black"),
                ("shot-white-closeup-v31.png", "cabin", "white", "black"),
                ("shot-red-v31.png", "exterior", "red", "black"),
                ("shot-wheel-silver-v31.png", "chassis", "red", "silver"),
                ("shot-brakes-v31.png", "chassis", "white", "silver"),
            ]
            for fn, view, paint, wheel in jobs:
                p = os.path.join(OUT, fn)
                shoot(pg, p, view, paint, wheel)
                made.append(p)

        stats = pg.evaluate("JSON.stringify({shell: __fl5.shellMode, errs: __fl5.errs, stats: __fl5.stats})")
        b.close()

    print(f"shellMode={mode_now}  出图 {len(made)} 张")
    for m in made:
        print("  ", os.path.relpath(m, ROOT), f"{os.path.getsize(m)//1024}KB")
    print("运行时状态:", stats[:600])


if __name__ == "__main__":
    main()
