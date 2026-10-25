"""Converte uma página de um ficheiro Illustrator/PDF num SVG recortado ao conteúdo.

Uso:
  pdftocairo -svg -f 1 -l 1 logo.ai pagina.svg      # o .ai moderno é um PDF
  python3 -I crop-logo-svg.py pagina.svg logo.svg

Remove o fundo branco da página e ajusta o viewBox aos traçados.
"""
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
# Remove o rectângulo de fundo que o pdftocairo cria (primeiro grupo com clip).
s = re.sub(r'<defs>.*?</defs>\s*<g clip-path="url\(#clip-0\)">.*?</g>', '', s, flags=re.S)
xs, ys = [], []
for d in re.findall(r' d="([^"]+)"', s):
    n = list(map(float, re.findall(r'-?\d+\.?\d*', d)))
    xs += n[0::2]
    ys += n[1::2]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
s = re.sub(r'width="[^"]+" height="[^"]+" viewBox="[^"]+"',
           f'viewBox="{x0:.2f} {y0:.2f} {x1 - x0:.2f} {y1 - y0:.2f}"', s, count=1)
open(dst, 'w').write(s)
print(f'viewBox: {x0:.1f} {y0:.1f} {x1 - x0:.1f} {y1 - y0:.1f}')
