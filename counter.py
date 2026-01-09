import sys

try:
    with open('client.js', 'r', encoding='utf-8') as f:
        content = f.read()
    open_count = content.count('{')
    close_count = content.count('}')
    print(f"Open: {open_count}, Close: {close_count}")
    
    # Check parens too
    open_p = content.count('(')
    close_p = content.count(')')
    print(f"Open P: {open_p}, Close P: {close_p}")

except Exception as e:
    print(f"Error: {e}")
