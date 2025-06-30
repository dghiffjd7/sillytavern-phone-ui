#!/usr/bin/env python3
import re

def aggressive_optimize_html(input_path, output_path):
    print("🚀 开始激进优化...")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_size = len(content)
    print(f"📊 原始文件大小: {original_size:,} 字符")
    
    # 1. Remove all remaining console.log statements except errors
    print("🔧 移除更多日志语句...")
    console_patterns = [
        r'console\.log\([^)]*\);\s*',
        r'console\.debug\([^)]*\);\s*',
        r'console\.trace\([^)]*\);\s*',
        r'console\.info\([^)]*\);\s*'
    ]
    
    for pattern in console_patterns:
        content = re.sub(pattern, '', content)
    
    # 2. Remove all comments except the production header
    print("🔧 移除所有注释...")
    # Keep the production header comment
    header_match = re.search(r'<!--.*?生产版本.*?-->', content, re.DOTALL)
    header = header_match.group(0) if header_match else ""
    
    # Remove all comments
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Add back the header
    if header:
        content = content.replace('<!doctype html>', f'<!doctype html>\n{header}')
    
    # 3. More aggressive whitespace removal
    print("🔧 激进压缩空白...")
    # Remove multiple spaces
    content = re.sub(r'[ \t]+', ' ', content)
    # Remove empty lines
    content = re.sub(r'\n\s*\n', '\n', content)
    # Remove leading/trailing spaces on lines
    content = '\n'.join(line.strip() for line in content.split('\n') if line.strip())
    
    # 4. Minify JavaScript more aggressively
    print("🔧 压缩JavaScript...")
    def minify_js_aggressive(match):
        js = match.group(1)
        # Remove extra spaces around operators
        js = re.sub(r'\s*([=+\-*/,;:{}()[\]<>!&|])\s*', r'\1', js)
        # Remove spaces after keywords
        js = re.sub(r'\b(if|else|for|while|function|var|let|const|return)\s+', r'\1 ', js)
        # Compress function declarations
        js = re.sub(r'function\s+(\w+)\s*\(', r'function \1(', js)
        # Remove extra spaces in object/array literals
        js = re.sub(r'\{\s*', '{', js)
        js = re.sub(r'\s*\}', '}', js)
        js = re.sub(r'\[\s*', '[', js)
        js = re.sub(r'\s*\]', ']', js)
        return f"<script>{js}</script>"
    
    content = re.sub(r'<script[^>]*>(.*?)</script>', minify_js_aggressive, content, flags=re.DOTALL)
    
    # 5. Minify CSS more aggressively  
    print("🔧 压缩CSS...")
    def minify_css_aggressive(match):
        css = match.group(1)
        # Remove all comments
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
        # Remove spaces around CSS selectors and properties
        css = re.sub(r'\s*\{\s*', '{', css)
        css = re.sub(r';\s*', ';', css)
        css = re.sub(r'\s*}\s*', '}', css)
        css = re.sub(r'\s*,\s*', ',', css)
        css = re.sub(r'\s*:\s*', ':', css)
        css = re.sub(r'\s*;\s*', ';', css)
        # Remove trailing semicolons before }
        css = re.sub(r';\s*}', '}', css)
        # Remove multiple spaces
        css = re.sub(r'\s+', ' ', css)
        css = css.strip()
        return f"<style>{css}</style>"
    
    content = re.sub(r'<style[^>]*>(.*?)</style>', minify_css_aggressive, content, flags=re.DOTALL)
    
    # 6. Remove unnecessary whitespace in HTML attributes
    print("🔧 压缩HTML属性...")
    content = re.sub(r'\s*=\s*"', '="', content)
    content = re.sub(r'"\s+', '" ', content)
    content = re.sub(r'\s+>', '>', content)
    content = re.sub(r'<\s+', '<', content)
    
    # 7. Final cleanup
    content = re.sub(r'\n{2,}', '\n', content)
    content = content.strip()
    
    optimized_size = len(content)
    reduction = ((original_size - optimized_size) / original_size) * 100
    
    print(f"📊 优化后文件大小: {optimized_size:,} 字符")
    print(f"📉 文件大小减少: {reduction:.1f}%")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ 激进优化完成! 文件已保存到: {output_path}")
    return reduction

if __name__ == "__main__":
    input_file = "/mnt/d/SillyTavern/SillyTavern/default/港区/开发部署架构/手机-动态流式.html"
    output_file = "/mnt/d/SillyTavern/SillyTavern/default/港区/开发部署架构/手机-动态流式-生产版.html"
    
    reduction = aggressive_optimize_html(input_file, output_file)
    
    if reduction >= 40:
        print(f"🎉 达到优化目标! 文件大小减少了 {reduction:.1f}%")
    else:
        print(f"⚠️ 文件大小减少了 {reduction:.1f}%，未达到40%目标，但已最大化优化")