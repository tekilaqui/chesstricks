def check_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        for char in line:
            if char == '{':
                stack.append(('brace', line_num))
            elif char == '}':
                if stack and stack[-1][0] == 'brace':
                    stack.pop()
                else:
                    print(f"Extra closing brace at line {line_num}")
            elif char == '(':
                stack.append(('paren', line_num))
            elif char == ')':
                if stack and stack[-1][0] == 'paren':
                    stack.pop()
                else:
                    print(f"Extra closing paren at line {line_num}")

    for type, line in stack:
        print(f"Unclosed {type} starting at line {line}")

if __name__ == "__main__":
    check_braces('client.js')
