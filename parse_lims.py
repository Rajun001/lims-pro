import re
import sys

try:
    with open(r"C:\Users\OFICINA\.gemini\antigravity-ide\brain\34882418-421b-40e3-bd45-6bd6f1606bfe\.system_generated\steps\425\content.md", "r", encoding="utf-8") as f:
        content = f.read()

    # Remove scripts
    content = re.sub(r'<script[^>]*>[\s\S]*?</script>', ' ', content, flags=re.IGNORECASE)
    # Remove styles
    content = re.sub(r'<style[^>]*>[\s\S]*?</style>', ' ', content, flags=re.IGNORECASE)
    # Remove all HTML tags
    content = re.sub(r'<[^>]+>', ' ', content)
    # Condense whitespace
    content = re.sub(r'\s+', ' ', content)
    
    with open("parsed.txt", "w", encoding="utf-8") as out:
        out.write(content[:15000].strip())
except Exception as e:
    print(e)
