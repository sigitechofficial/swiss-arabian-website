from pathlib import Path
p = Path(r"E:\claude-project-swiss\claude\v4-app\products.html")
t = p.read_text(encoding="utf-8")
old = "  if(t){ e.preventDefault(); if(window.parent&&window.parent!==window&&window.parent.showPage) window.parent.showPage(t); }"
new = """  if(t){
    e.preventDefault();
    if(window.parent&&window.parent!==window&&window.parent.showPage){ window.parent.showPage(t); return; }
    if(t==='landing') location.href='landing.html';
    else if(t==='products') location.href='products.html';
    else if(t==='detail') location.href='../swiss-arabian-prototype.html#detail';
  }"""
if old not in t:
    raise SystemExit("interceptor string not found")
p.write_text(t.replace(old, new, 1), encoding="utf-8", newline="\n")
print("patched interceptor")
