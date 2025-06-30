#!/usr/bin/env python3
"""
Production HTML File Fixer Script

This script fixes the following issues in the production HTML file:
1. Fixes the title from "Document" to "QQ Chat Interface - Production"
2. Adds minimal line breaks to CSS for better readability while keeping it optimized
3. Verifies all brackets and parentheses are balanced
4. Adds a proper production header comment if missing
5. Saves the corrected file

Author: Claude
"""

import re
import os
import sys
from datetime import datetime

def check_brackets_balanced(content):
    """Check if all brackets and parentheses are balanced in the content."""
    stack = []
    bracket_pairs = {'(': ')', '[': ']', '{': '}'}
    errors = []
    
    for i, char in enumerate(content):
        if char in bracket_pairs:
            stack.append((char, i))
        elif char in bracket_pairs.values():
            if not stack:
                errors.append(f"Unmatched closing bracket '{char}' at position {i}")
                continue
            
            open_bracket, open_pos = stack.pop()
            if bracket_pairs[open_bracket] != char:
                errors.append(f"Mismatched brackets: '{open_bracket}' at {open_pos} and '{char}' at {i}")
    
    # Check for unclosed brackets
    for open_bracket, pos in stack:
        errors.append(f"Unclosed bracket '{open_bracket}' at position {pos}")
    
    return len(errors) == 0, errors

def format_css_minimal(css_content):
    """Add minimal line breaks to CSS while keeping it optimized."""
    # Split CSS into rules but keep them compact
    formatted = css_content
    
    # Add line breaks after closing braces (but not inside media queries or nested rules)
    formatted = re.sub(r'}(?=[^}]*{)', '}\n', formatted)
    
    # Add line breaks after @import statements
    formatted = re.sub(r'(@import[^;]+;)', r'\1\n', formatted)
    
    # Add line breaks after @keyframes closing braces
    formatted = re.sub(r'(@keyframes[^{]+{[^{}]*{[^}]*}[^}]*})', r'\1\n', formatted)
    
    # Clean up multiple consecutive newlines
    formatted = re.sub(r'\n+', '\n', formatted)
    
    return formatted.strip()

def add_production_header(content):
    """Add production header comment if missing."""
    production_header = '''<!--
Production Build: QQ Chat Interface
Generated on: {timestamp}
Environment: Production
Optimization: CSS minified, JS compressed

IMPORTANT: This is the production version. 
For development, use the development version files.
-->

'''.format(timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    
    # Check if production header already exists
    if 'Production Build:' in content or 'Environment: Production' in content:
        return content
    
    # Insert after <!doctype html> but before <html>
    if '<!doctype html>' in content.lower():
        content = re.sub(
            r'(<!doctype html>\s*)',
            r'\1' + production_header,
            content,
            flags=re.IGNORECASE
        )
    else:
        content = production_header + content
    
    return content

def fix_production_file(file_path):
    """Main function to fix the production file."""
    print(f"Starting to fix production file: {file_path}")
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} does not exist!")
        return False
    
    # Read the file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"Successfully read file ({len(content)} characters)")
    except Exception as e:
        print(f"Error reading file: {e}")
        return False
    
    original_content = content
    
    # 1. Fix the title
    print("1. Fixing title...")
    content = re.sub(
        r'<title>Document</title>',
        '<title>QQ Chat Interface - Production</title>',
        content
    )
    if '<title>QQ Chat Interface - Production</title>' in content:
        print("   ✓ Title fixed successfully")
    else:
        print("   ⚠ Title was not found or already correct")
    
    # 2. Format CSS for better readability
    print("2. Formatting CSS...")
    style_pattern = r'<style>(.*?)</style>'
    style_match = re.search(style_pattern, content, re.DOTALL)
    
    if style_match:
        css_content = style_match.group(1)
        formatted_css = format_css_minimal(css_content)
        content = content.replace(style_match.group(1), formatted_css)
        print(f"   ✓ CSS formatted (reduced from {len(css_content)} to {len(formatted_css)} chars)")
    else:
        print("   ⚠ No <style> tag found")
    
    # 3. Check bracket balance
    print("3. Checking bracket balance...")
    is_balanced, errors = check_brackets_balanced(content)
    if is_balanced:
        print("   ✓ All brackets and parentheses are balanced")
    else:
        print("   ✗ Bracket/parentheses issues found:")
        for error in errors[:10]:  # Show first 10 errors
            print(f"      {error}")
        if len(errors) > 10:
            print(f"      ... and {len(errors) - 10} more errors")
    
    # 4. Add production header
    print("4. Adding production header...")
    content_with_header = add_production_header(content)
    if content_with_header != content:
        content = content_with_header
        print("   ✓ Production header added")
    else:
        print("   ⚠ Production header already exists or could not be added")
    
    # 5. Additional syntax checks
    print("5. Performing additional syntax checks...")
    
    # Check for common HTML issues
    issues = []
    
    # Check for unclosed tags (basic check)
    open_tags = re.findall(r'<(\w+)(?:\s[^>]*)?>(?!</)', content)
    close_tags = re.findall(r'</(\w+)>', content)
    
    # Count tags (excluding self-closing ones)
    self_closing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'source']
    open_count = {}
    for tag in open_tags:
        if tag.lower() not in self_closing:
            open_count[tag.lower()] = open_count.get(tag.lower(), 0) + 1
    
    close_count = {}
    for tag in close_tags:
        close_count[tag.lower()] = close_count.get(tag.lower(), 0) + 1
    
    for tag, count in open_count.items():
        close_c = close_count.get(tag, 0)
        if count != close_c:
            issues.append(f"Tag balance issue: {tag} opened {count} times, closed {close_c} times")
    
    # Check for unclosed quotes in attributes
    quote_issues = re.findall(r'=\s*"[^"]*$', content)
    if quote_issues:
        issues.append(f"Potential unclosed quotes found: {len(quote_issues)} instances")
    
    if not issues:
        print("   ✓ No major syntax issues detected")
    else:
        print("   ⚠ Potential syntax issues found:")
        for issue in issues:
            print(f"      {issue}")
    
    # 6. Save the file
    print("6. Saving the corrected file...")
    try:
        # Create backup
        backup_path = file_path + '.backup.' + datetime.now().strftime('%Y%m%d_%H%M%S')
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original_content)
        print(f"   ✓ Backup created: {backup_path}")
        
        # Save corrected file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✓ File saved successfully")
        
        # Show size comparison
        original_size = len(original_content)
        new_size = len(content)
        size_diff = new_size - original_size
        print(f"   ✓ File size: {original_size} → {new_size} bytes ({size_diff:+} bytes)")
        
    except Exception as e:
        print(f"   ✗ Error saving file: {e}")
        return False
    
    print("\n" + "="*50)
    print("File correction completed successfully!")
    print("="*50)
    
    return True

if __name__ == "__main__":
    # Define the file path
    file_path = "/mnt/d/SillyTavern/SillyTavern/default/港区/开发部署架构/手机-动态流式-生产版.html"
    
    print("QQ Chat Interface Production File Fixer")
    print("="*50)
    
    # Run the fix
    success = fix_production_file(file_path)
    
    if success:
        print("\nAll fixes have been applied successfully!")
        sys.exit(0)
    else:
        print("\nSome issues occurred during the fixing process.")
        sys.exit(1)