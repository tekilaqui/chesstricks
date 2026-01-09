import os

def clean_css(filename):
    with open(filename, 'rb') as f:
        content = f.read()
    
    # Remove BOM
    if content.startswith(b'\xef\xbb\xbf'):
        content = content[3:]
    
    # Decode to string
    text = content.decode('utf-8')
    
    # Remove leading spaces from each line
    lines = text.splitlines()
    cleaned_lines = [line.lstrip() for line in lines]
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write('\n'.join(cleaned_lines))

if __name__ == "__main__":
    clean_css('style.css')
