with open('client.js', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if '$(' in line and '.ready' in line:
            print(f"Line {i+1}: {line.strip()}")
        if '$(function()' in line:
            print(f"Line {i+1}: {line.strip()}")
        if 'window.onload' in line:
            print(f"Line {i+1}: {line.strip()}")
        if 'DOMContentLoaded' in line:
            print(f"Line {i+1}: {line.strip()}")
