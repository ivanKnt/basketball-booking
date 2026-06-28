import os
import re

DIR = "src/components"

REPLACEMENTS = [
    # Remove glassmorphism completely
    (r'backdrop-blur-\w+', ''),
    (r'premium-glass', 'apple-card'),
    (r'glass-card', 'apple-card'),
    (r'glass-panel', 'apple-card'),
    
    # Backgrounds
    (r'bg-\[\#0a0a0c\](?:\/\d+)?', 'bg-surface'),
    (r'bg-\[\#1a1a1c\](?:\/\d+)?', 'bg-surface'),
    (r'bg-\[\#141416\](?:\/\d+)?', 'bg-surface'),
    (r'bg-\[\#141418\](?:\/\d+)?', 'bg-surface'),
    (r'bg-black\/[0-9]+', 'bg-surface'),
    
    # Text
    (r'text-white', 'text-text'),
    (r'text-zinc-[3456]00', 'text-text-muted'),
    
    # Borders
    (r'border-white\/\d+', 'border-border'),
    
    # Specific elements
    (r'font-display font-bold', 'font-display font-semibold'),
]

for root, dirs, files in os.walk(DIR):
    for file in files:
        if file.endswith(".jsx"):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in REPLACEMENTS:
                new_content = re.sub(pattern, repl, new_content)
                
            # Collapse multiple spaces inside classNames
            new_content = re.sub(r'className="([^"]+)"', lambda m: 'className="' + ' '.join(m.group(1).split()) + '"', new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
