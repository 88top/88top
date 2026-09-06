#!/usr/bin/env python3
"""
Script to create public branch by removing security dependencies and references.
This script properly handles Go file modifications to ensure the code can compile.
"""

import re
import os
import sys
import shutil


def read_file(filepath):
    """Read file content."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def write_file(filepath, content):
    """Write content to file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def modify_go_mod(filepath):
    """
    Modify go.mod to remove privatespeedtest (and optional security) dependencies.
    Automatically matches module names regardless of version or indirect comment.
    """
    content = read_file(filepath)

    # Modules to remove
    remove_modules = [
        r'github\.com/oneclickvirt/privatespeedtest',
        r'github\.com/oneclickvirt/security',
    ]

    for mod in remove_modules:
        # Remove full require line (with or without // indirect)
        content = re.sub(
            rf'^[ \t]*{mod}[ \t]+v[^\s]+(?:[ \t]+// indirect)?[ \t]*\n',
            '',
            content,
            flags=re.MULTILINE
        )

    write_file(filepath, content)
    print(f"✓ Removed privatespeedtest/security from {filepath}")


def remove_vendor_tree(path='vendor'):
    """Remove the private-module vendor snapshot from the public branch."""
    if os.path.isdir(path):
        shutil.rmtree(path)
        print(f"✓ Removed {path}/ from public branch")


def remove_code_block(lines, start_marker, end_condition='empty_line'):
    """
    Remove code block from lines starting with start_marker.
    
    Args:
        lines: List of file lines
        start_marker: String or list of strings to identify block start
        end_condition: 'empty_line' (default) or 'closing_brace' or custom function
    
    Returns:
        Modified lines with the block removed
    """
    if isinstance(start_marker, str):
        start_marker = [start_marker]
    
    result = []
    skip_mode = False
    brace_depth = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if we should start skipping
        if not skip_mode:
            for marker in start_marker:
                if marker in line:
                    skip_mode = True
                    if end_condition == 'closing_brace':
                        # Count opening braces on the function declaration line
                        brace_depth = line.count('{') - line.count('}')
                    break
            
            if not skip_mode:
                result.append(line)
        else:
            # We're in skip mode
            if end_condition == 'empty_line':
                # Skip until we find an empty line
                if line.strip() == '':
                    skip_mode = False
                    # Don't add the empty line, continue to next
            elif end_condition == 'closing_brace':
                # Track brace depth
                brace_depth += line.count('{') - line.count('}')
                if brace_depth == 0 and '}' in line:
                    # Function ended, skip until next empty line
                    end_condition = 'empty_line'
        
        i += 1
    
    return result


def modify_speed_go(filepath):
    """
    Replace the private-only speed implementation with the public implementation.

    The two files intentionally share the same API but use complementary build
    tags. Copying the already-public implementation keeps this transformation
    independent of comments or formatting in the private file.
    """
    public_filepath = os.path.join(os.path.dirname(filepath), 'speed_public.go')
    if not os.path.exists(public_filepath):
        raise FileNotFoundError(f"Public speed implementation not found: {public_filepath}")

    content = read_file(public_filepath)
    content, replacements = re.subn(
        r'(?m)^//go:build\s+ecs_public\s*$',
        '//go:build !ecs_public',
        content,
        count=1,
    )
    if replacements != 1:
        raise ValueError(f"Unexpected build tag in {public_filepath}")
    content = re.sub(
        r'(?m)^// \+build\s+ecs_public\s*$',
        '// +build !ecs_public',
        content,
        count=1,
    )
    # The public adapter intentionally keeps the PrivateSpeedPreloads type and
    # its no-op functions so the runner has the same API under both build tags.
    # Validate the actual dependency boundary instead of rejecting those
    # compatibility identifiers by substring.
    private_import = re.compile(
        r'github\.com/oneclickvirt/(?:privatespeedtest|security)(?:/|["`])',
        flags=re.IGNORECASE,
    )
    if private_import.search(content):
        raise ValueError(f"Public speed implementation imports a restricted module: {public_filepath}")

    write_file(filepath, content)
    print(f"✓ Replaced private speed implementation in {filepath}")


def activate_public_component(filepath):
    """Make a public-only implementation available to ordinary Go builds."""
    content = read_file(filepath)
    content, replacements = re.subn(
        r'(?m)^//go:build\s+ecs_public\s*\n(?:^// \+build\s+ecs_public\s*\n)?\n?',
        '',
        content,
        count=1,
    )
    if replacements != 1:
        raise ValueError(f"Unexpected public build tag in {filepath}")
    write_file(filepath, content)
    print(f"✓ Activated public implementation for default builds: {filepath}")


def remove_private_go_sources():
    """Remove source files whose dependencies are intentionally private."""
    private_files = [
        'api/components_security_private.go',
        'api/components_speed_private.go',
        'api/components_local_test.go',
        'goecs_private_test.go',
        'internal/tests/speed_private_registry.go',
        'internal/tests/speed_test.go',
    ]
    for filepath in private_files:
        if not os.path.isfile(filepath):
            raise FileNotFoundError(f"Private source expected by public generator is missing: {filepath}")
        os.remove(filepath)
        print(f"✓ Removed private source: {filepath}")


def remove_private_delivery_artifacts():
    """Keep private publishing machinery out of the generated public tree."""
    private_artifacts = [
        '.back/create_public_branch.py',
        '.github/workflows/build_binary.yaml',
        '.github/workflows/build_public.yml',
    ]
    for filepath in private_artifacts:
        if not os.path.isfile(filepath):
            raise FileNotFoundError(f"Private delivery artifact expected by public generator is missing: {filepath}")
        os.remove(filepath)
        print(f"✓ Removed private delivery artifact: {filepath}")


def validate_public_go_sources(root='.'):
    """Fail closed when a new private Go import was missed by the generator."""
    private_import = re.compile(
        r'"github\.com/oneclickvirt/(?:privatespeedtest|security)(?:/|\")',
        flags=re.IGNORECASE,
    )
    matches = []
    ignored_directories = {'.git', 'vendor', '.cache', '.tmp'}
    for directory, directories, filenames in os.walk(root):
        directories[:] = [name for name in directories if name not in ignored_directories]
        for filename in filenames:
            if not filename.endswith('.go'):
                continue
            filepath = os.path.join(directory, filename)
            if private_import.search(read_file(filepath)):
                matches.append(filepath)
    if matches:
        raise ValueError(f"Public Go source still imports restricted modules: {', '.join(matches)}")


def validate_public_delivery_tree(root='.'):
    """Reject private module references outside module metadata after generation."""
    private_reference = re.compile(
        r'github\.com/oneclickvirt/(?:privatespeedtest|security)(?:/|["`]|$)',
        flags=re.IGNORECASE,
    )
    text_extensions = {'.go', '.json', '.md', '.mdx', '.mod', '.py', '.sh', '.yaml', '.yml'}
    ignored_directories = {'.git', 'vendor', '.cache', '.tmp'}
    matches = []
    for directory, directories, filenames in os.walk(root):
        directories[:] = [name for name in directories if name not in ignored_directories]
        for filename in filenames:
            if os.path.splitext(filename)[1].lower() not in text_extensions:
                continue
            filepath = os.path.join(directory, filename)
            if private_reference.search(read_file(filepath)):
                matches.append(filepath)
    if matches:
        raise ValueError(f"Public delivery tree still references restricted modules: {', '.join(matches)}")


def modify_utils_go(filepath):
    """
    Modify utils/utils.go to:
    1. Replace security/network import with basics/network
    2. Replace SecurityUploadToken usage with hardcoded token
    """
    content = read_file(filepath)
    
    # Replace import
    content = re.sub(
        r'"github\.com/oneclickvirt/security/network"',
        r'"github.com/oneclickvirt/basics/network"',
        content
    )
    
    # Replace token usage - find the exact line and replace it
    content = re.sub(
        r'\ttoken := network\.SecurityUploadToken',
        r'\ttoken := "OvwKx5qgJtf7PZgCKbtyojSU.MTcwMTUxNzY1MTgwMw"',
        content
    )
    
    # Update title for public version
    content = re.sub(
        r'VPS融合怪测试',
        r'VPS融合怪测试(非官方编译)',
        content
    )
    content = re.sub(
        r'VPS Fusion Monster Test',
        r'VPS Fusion Monster Test (Unofficial)',
        content
    )
    
    write_file(filepath, content)
    print(f"✓ Modified {filepath}")


def modify_params_go(filepath):
    """
    Modify internal/params/params.go to change security flag default to false.
    """
    content = read_file(filepath)
    
    # Change default value in struct initialization
    content = re.sub(
        r'(\s+SecurityTestStatus:\s+)true,',
        r'\1false,',
        content
    )
    
    # Change flag default value
    content = re.sub(
        r'(c\.GoecsFlag\.BoolVar\(&c\.SecurityTestStatus, "security", )true(, "Enable/Disable security test"\))',
        r'\1false\2',
        content
    )
    
    write_file(filepath, content)
    print(f"✓ Modified {filepath}")

def sanitize_public_markdown(root='.'):
    """Remove restricted speed-test implementation details from public Markdown."""
    go_mod_content = read_file('go.mod')
    go_version_match = re.search(r'^go (\d+\.\d+(?:\.\d+)?)', go_mod_content, re.MULTILINE)
    if not go_version_match:
        raise ValueError("Could not extract the Go version for public documentation")
    go_version = go_version_match.group(1)
    restricted_line = re.compile(
        r'^[^\r\n]*(?:'
        r'privatespeedtest|privateSpeed|privatepst|private[_-]speed|'
        r'private[ \t-]+carrier(?:[ \t-]+speed)?[ \t-]+nodes?|'
        r'私有(?:国内|三网)?测速(?:节点)?|私有节点|备用候选|'
        r'プライベート回線キャリア(?:のノード)?|'
        r'Candidate servers are checked before selection|'
        r'测速前会先检查候选节点|'
        r'候補サーバーの利用可否を確認してから選択'
        r')[^\r\n]*(?:\r?\n|$)',
        flags=re.IGNORECASE | re.MULTILINE,
    )
    unresolved_marker = re.compile(
        r'privatespeedtest|private[ \t-]+carrier(?:[ \t-]+speed)?[ \t-]+nodes?|'
        r'私有(?:国内|三网)?测速(?:节点)?|私有节点|プライベート回線キャリア',
        flags=re.IGNORECASE,
    )
    for directory, subdirectories, filenames in os.walk(root):
        subdirectories[:] = [
            name for name in subdirectories
            if name not in {'.git', 'vendor', '.cache', '.tmp'}
        ]
        for filename in filenames:
            if not filename.lower().endswith(('.md', '.mdx')):
                continue
            filepath = os.path.join(directory, filename)
            content = read_file(filepath)
            original = content

            content = re.sub(
                r'(?m)^- IP quality/security information concurrent query:.*$',
                '- IP quality/security information: unavailable in the public source build.',
                content,
            )
            content = re.sub(
                r'(?m)^- IP 质量/安全信息并发查询：.*$',
                '- IP 质量/安全信息：公开源码构建中不可用。',
                content,
            )
            content = re.sub(
                r'(?m)^依赖项目：\[https://github\.com/oneclickvirt/securityCheck\]\(https://github\.com/oneclickvirt/securityCheck\)\s*$',
                '公开源码构建不包含 IP 质量/安全信息组件；该项会显示为不可用。',
                content,
            )
            content = re.sub(
                r'(?m)^Dependency project: \[https://github\.com/oneclickvirt/securityCheck\]\(https://github\.com/oneclickvirt/securityCheck\)\s*$',
                'The public source build does not include the IP quality/security component; this section is reported as unavailable.',
                content,
            )
            content = re.sub(
                r'(?m)^依存プロジェクト：\[https://github\.com/oneclickvirt/securityCheck\]\(https://github\.com/oneclickvirt/securityCheck\)\s*$',
                '公開ソースビルドにはIP品質/セキュリティ情報コンポーネントは含まれず、この項目は利用不可として表示されます。',
                content,
            )
            content = re.sub(
                r'(?ms)^### \*\*IP质量检测\*\*\n.*?(?=^### |\Z)',
                '### **IP质量检测**\n\n公开源码构建不包含 IP 质量/安全信息组件；该项会显示为不可用。\n\n',
                content,
            )
            content = re.sub(
                r'(?ms)^### IP Quality Detection\n.*?(?=^### |\Z)',
                '### IP Quality Detection\n\nThe public source build does not include the IP quality/security component; this section is reported as unavailable.\n\n',
                content,
            )
            content = re.sub(
                r'(?ms)^### IP品質検出\n.*?(?=^### |\Z)',
                '### IP品質検出\n\n公開ソースビルドにはIP品質/セキュリティ情報コンポーネントは含まれず、この項目は利用不可として表示されます。\n\n',
                content,
            )
            content = re.sub(
                r'(Enable/Disable security test \(default )true(\))',
                r'\g<1>false\2',
                content,
            )
            content = re.sub(
                r'Select go \d+\.\d+\.\d+[ \t]+version to install[ \t]*',
                f'Select go {go_version} version to install',
                content,
            )
            content = re.sub(
                r'选择 go \d+\.\d+\.\d+[ \t]+的版本进行安装[ \t]*',
                f'选择 go {go_version} 的版本进行安装',
                content,
            )

            # Preserve the surrounding public speed-test sentence while dropping
            # the restricted component name and its selection/registry details.
            content = re.sub(
                r'(?i)\s*Private[ \t-]+carrier(?:[ \t-]+speed)?[ \t-]+nodes?\s+from\s+`?privatespeedtest[^.\r\n]*\.\s*',
                ' ',
                content,
            )
            content = re.sub(
                r'，同时融合[^。\r\n]*(?:privatespeedtest|私有国内测速节点)[^。\r\n]*?；',
                '；',
                content,
                flags=re.IGNORECASE,
            )
            content = re.sub(
                r'(?i)\s*[（(](?:without private dependencies)[）)]',
                '',
                content,
            )
            content = re.sub(r'(?i)\bwithout private dependencies\b', '', content)
            content = re.sub(r'不含私有依赖', '', content)
            content = restricted_line.sub('', content)
            content = re.sub(r'\n{3,}', '\n\n', content)

            if unresolved_marker.search(content):
                raise ValueError(f"Public Markdown still contains restricted speed-test details: {filepath}")
            if re.search(r'(?i)securitycheck|Enable/Disable security test \(default true\)', content):
                raise ValueError(f"Public Markdown still describes unavailable private security behavior: {filepath}")

            if content != original:
                write_file(filepath, content)
                print(f"✓ Sanitized public documentation: {filepath}")


def main():
    """Main function to process all files."""
    print("Starting public branch creation process...")
    print()
    
    # Check if we're in the right directory
    if not os.path.exists('go.mod'):
        print("Error: go.mod not found. Please run this script from the project root.")
        sys.exit(1)
    
    # Modify Go source files
    print("Modifying Go source files...")
    modify_speed_go('internal/tests/speed.go')
    activate_public_component('api/components_public.go')
    remove_private_go_sources()
    modify_utils_go('utils/utils.go')
    modify_params_go('internal/params/params.go')
    print()
    
    # Modify go.mod
    print("Modifying go.mod...")
    modify_go_mod('go.mod')
    remove_vendor_tree()
    print()

    print("Sanitizing public delivery files...")
    sanitize_public_markdown()
    remove_private_delivery_artifacts()
    validate_public_go_sources()
    validate_public_delivery_tree()
    print()
        
    print("✓ All modifications completed successfully!")
    print()
    print("Next steps:")
    print("1. Run 'go mod tidy' to clean up dependencies")
    print("2. Run 'go build -o maintest' to verify compilation")
    print("3. Test the binary with: ./maintest -menu=false -l en -security=false -upload=false")


if __name__ == '__main__':
    main()
