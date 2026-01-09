with open('style.css', 'r', encoding='utf-8') as f:
    content = f.read()
open_p = content.count('(')
close_p = content.count(')')
print(f"Open P: {open_p}, Close P: {close_p}")
