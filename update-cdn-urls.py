#!/usr/bin/env python3
import re

# Read CDN URL mappings
cdn_map = {}
with open('cdn-urls.txt', 'r') as f:
    for line in f:
        if '|' in line:
            local_path, cdn_url = line.strip().split('|')
            cdn_map[local_path] = cdn_url

# Read template backgrounds file
with open('client/src/lib/templateBackgrounds.ts', 'r') as f:
    content = f.read()

# Replace all local paths with CDN URLs
for local_path, cdn_url in cdn_map.items():
    # Match patterns like "/template-backgrounds/buyers-01.png"
    pattern = f'"/template-backgrounds/{local_path.replace("template-backgrounds/", "")}"'
    replacement = f'"{cdn_url}"'
    content = content.replace(pattern, replacement)
    
    # Also match patterns like '/samples/sample-post-1.png'
    pattern2 = f'"/samples/{local_path.replace("samples/", "")}"'
    content = content.replace(pattern2, f'"{cdn_url}"')

# Write updated content
with open('client/src/lib/templateBackgrounds.ts', 'w') as f:
    f.write(content)

print("✓ Updated templateBackgrounds.ts with CDN URLs")

# Count replacements
matches = len(re.findall(r'https://files\.manuscdn\.com', content))
print(f"✓ Total CDN URLs in file: {matches}")
