import json
import sys

def parse_lint(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return

    any_errors = []
    for file_result in data:
        file_path = file_result.get('filePath', 'unknown')
        messages = file_result.get('messages', [])
        for msg in messages:
            if msg.get('ruleId') == '@typescript-eslint/no-explicit-any':
                any_errors.append({
                    'file': file_path,
                    'line': msg.get('line'),
                    'message': msg.get('message')
                })

    # Sort and group by file
    any_errors.sort(key=lambda x: x['file'])
    
    with open('any_errors_list_final.txt', 'w', encoding='utf-8') as f:
        current_file = ""
        for err in any_errors:
            if err['file'] != current_file:
                current_file = err['file']
                f.write(f"\nFILE: {current_file}\n")
            f.write(f"  Line {err['line']}: {err['message']}\n")
            
    print(f"Found {len(any_errors)} 'no-explicit-any' errors.")
    print("Results saved to any_errors_list_final.txt")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parse_lint.py <lint_results.json>")
    else:
        parse_lint(sys.argv[1])
