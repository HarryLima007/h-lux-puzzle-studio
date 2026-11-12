#!/usr/bin/env python3
"""Monta /home/claude/site/<id>/index.html a partir de /home/claude/gen/g/<id>.js.
Cabeçalho do .js:  /*@ {json} @*/  com name, t1, t2, theme, bg2, hud [[rótulo,id,valor]], css, body, libs, menuIcon."""
import json, re, sys, os, html
SRC = '/home/claude/gen/g'; OUT = '/home/claude/site'
PAUSE = '<path d="M9 6v12M15 6v12"/>'; MENU = '<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>'
def build(gid):
    s = open(f'{SRC}/{gid}.js', encoding='utf8').read()
    m = re.match(r'/\*@(.*?)@\*/\s*', s, re.S); cfg = json.loads(m.group(1)); js = re.sub(r'px Manrope(?!,)', 'px Manrope,sans-serif', s[m.end():])
    hud = ''.join(f'<div class="sc"><small>{h[0]}</small><b id="{h[1]}">{h[2]}</b></div>' for h in cfg.get('hud', []))
    body = cfg.get('body', '<div class="stage" id="stage"><canvas id="cv"></canvas></div>')
    libs = ''.join(f'<script src="../shared/{l}"></script>' for l in ['kit.js'] + cfg.get('libs', ['arcade.js']))
    icon = MENU if cfg.get('menuIcon') == 'menu' else PAUSE
    page = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="{cfg['theme']}">
<title>H-LUX {html.escape(cfg['name'])}</title>
<link rel="manifest" href="../manifest.webmanifest">
<link rel="icon" type="image/png" href="../icons/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../shared/kit.css">
<style>
:root{{--bg:{cfg['theme']};--bg2:{cfg['bg2']}}}
#cv{{display:block;touch-action:none;border-radius:14px;box-shadow:0 0 0 2px #c9a45c,0 20px 50px rgba(0,0,0,.6);user-select:none;-webkit-user-select:none}}
{cfg.get('css', '')}
</style>
</head>
<body>
<div class="app">
  <div class="top"><a class="back" href="../" data-platform-link><svg class="i"><path d="M14.5 6l-6 6 6 6"/></svg>H-LUX</a><div class="title">{cfg['t1']}<b>{cfg['t2']}</b></div><button class="ib" id="menu" aria-label="Menu"><svg class="i">{icon}</svg></button></div>
  {f'<div class="hud">{hud}</div>' if hud else ''}
  {body}
</div>
{libs}
<script>
'use strict';
{js}
</script>
</body>
</html>
'''
    os.makedirs(f'{OUT}/{gid}', exist_ok=True); open(f'{OUT}/{gid}/index.html', 'w', encoding='utf8').write(page); print('built', gid, len(page))
for g in (sys.argv[1:] or [f[:-3] for f in os.listdir(SRC) if f.endswith('.js')]): build(g)
