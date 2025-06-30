#!/usr/bin/env python3
"""
Production File Validation Script

This script validates that all requested fixes have been properly applied.
"""

import os
import re

def validate_fixes():
    """Validate all the fixes have been applied correctly."""
    
    file_path = "/mnt/d/SillyTavern/SillyTavern/default/港区/开发部署架构/手机-动态流式-生产版.html"
    
    print("PRODUCTION FILE VALIDATION")
    print("=" * 50)
    
    if not os.path.exists(file_path):
        print("❌ FAIL: Production file not found!")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ FAIL: Could not read file: {e}")
        return False
    
    all_passed = True
    
    # Test 1: Title Fix
    print("\n1. Title Fix Validation:")
    if '<title>QQ Chat Interface - Production</title>' in content:
        print("   ✅ PASS: Title correctly set to 'QQ Chat Interface - Production'")
    else:
        print("   ❌ FAIL: Title not properly fixed")
        all_passed = False
    
    # Test 2: Production Header
    print("\n2. Production Header Validation:")
    if 'Production Build: QQ Chat Interface' in content and 'Environment: Production' in content:
        print("   ✅ PASS: Production header properly added")
    else:
        print("   ❌ FAIL: Production header missing or incomplete")
        all_passed = False
    
    # Test 3: CSS Readability
    print("\n3. CSS Readability Validation:")
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if style_match:
        css_content = style_match.group(1)
        css_lines = css_content.count('\n')
        if css_lines > 10:  # Should have some line breaks
            print(f"   ✅ PASS: CSS has {css_lines} line breaks for better readability")
        else:
            print(f"   ⚠️  WARNING: CSS only has {css_lines} line breaks")
    else:
        print("   ❌ FAIL: No CSS style block found")
        all_passed = False
    
    # Test 4: File Structure Integrity
    print("\n4. File Structure Validation:")
    if content.startswith('<!doctype html>') or content.lower().startswith('<!doctype html>'):
        print("   ✅ PASS: Valid HTML5 doctype")
    else:
        print("   ❌ FAIL: Invalid or missing doctype")
        all_passed = False
    
    # Test 5: Critical Elements Present
    print("\n5. Critical Elements Validation:")
    critical_elements = [
        ('<html', 'HTML root element'),
        ('<head>', 'HTML head section'),
        ('<body>', 'HTML body section'),
        ('<style>', 'CSS styles'),
        ('QQ_chat_page', 'Main chat interface')
    ]
    
    for element, description in critical_elements:
        if element in content:
            print(f"   ✅ PASS: {description} found")
        else:
            print(f"   ❌ FAIL: {description} missing")
            all_passed = False
    
    # Test 6: File Size Reasonable
    print("\n6. File Size Validation:")
    file_size = len(content)
    if 500000 < file_size < 2000000:  # Between 500KB and 2MB
        print(f"   ✅ PASS: File size is reasonable ({file_size:,} bytes)")
    else:
        print(f"   ⚠️  WARNING: File size might be unusual ({file_size:,} bytes)")
    
    # Test 7: Backup Exists
    print("\n7. Backup Validation:")
    backup_pattern = file_path + '.backup.*'
    dir_path = os.path.dirname(file_path)
    filename = os.path.basename(file_path)
    
    backup_found = False
    if os.path.exists(dir_path):
        for f in os.listdir(dir_path):
            if f.startswith(filename + '.backup.'):
                backup_found = True
                print(f"   ✅ PASS: Backup file found: {f}")
                break
    
    if not backup_found:
        print("   ⚠️  WARNING: No backup file found")
    
    # Final Result
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 VALIDATION RESULT: ALL FIXES SUCCESSFULLY APPLIED!")
        print("   The production file is ready for deployment.")
    else:
        print("❌ VALIDATION RESULT: SOME ISSUES DETECTED")
        print("   Please review the failed tests above.")
    print("=" * 50)
    
    return all_passed

if __name__ == "__main__":
    validate_fixes()