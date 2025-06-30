#!/usr/bin/env python3
import re

def fix_html_file(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ensure the file ends properly with closing script and HTML tags
    if not content.strip().endswith('</html>'):
        # Add proper closing tags
        if not content.strip().endswith('</script>'):
            content += '\n        </script>\n'
        if not content.strip().endswith('</body>'):
            content += '    </body>\n'
        if not content.strip().endswith('</html>'):
            content += '</html>'
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed HTML file saved to: {output_path}")

if __name__ == "__main__":
    # Read the original source to get the complete ending
    with open("/mnt/d/SillyTavern/SillyTavern/default/港区/开发部署架构/手机-动态流式.html", 'r', encoding='utf-8') as f:
        original = f.read()
    
    # Get the proper ending from original
    ending_match = re.search(r'return result\.trim\(\);\s*\}.*</html>', original, re.DOTALL)
    if ending_match:
        proper_ending = ending_match.group(0)
        
        # Read the optimized file
        with open("/mnt/d/SillyTavern/SillyTavern/default/港区/开发部署架构/手机-动态流式-生产版.html", 'r', encoding='utf-8') as f:
            optimized = f.read()
        
        # Find where it got cut off and fix it
        cut_point = optimized.rfind('return result.trim();')
        if cut_point != -1:
            # Replace the ending with the proper one
            fixed_content = optimized[:cut_point] + proper_ending
            
            with open("/mnt/d/SillyTavern/SillyTavern/default/港区/开发部署架构/手机-动态流式-生产版.html", 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            
            print("Fixed truncated HTML file")
        else:
            print("No truncation found")
    else:
        print("Could not find proper ending in original file")