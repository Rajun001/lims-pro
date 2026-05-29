import fitz
import json
import re
import os

pdf_path = "tarifario.pdf"
doc = fitz.open(pdf_path)

catalog = []

for page in doc:
    text = page.get_text("text")
    lines = text.split("\n")
    
    # In PyMuPDF, table columns are sometimes read block by block.
    # If it's read block by block, we might have Name, Name, Name... then Code, Code... then Price, Price.
    # To handle both row-by-row and block-by-block, let's use the PyMuPDF 'words' method which gives coordinates.
    # Actually, simpler: the user gave me the OCR text of the PDF in the conversation!
    # I can just paste the text into a txt file and parse it. But I don't have the text anymore except what I remember.
    
    # Let's try the simplest line by line parsing, often it works.
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Look for code: exactly 4 or 5 digits, often ending in 0 (1010, 1020, 12000, etc.)
        # The price is either 'Lab Internacional', or a number with commas.
        match = re.search(r'^(.*?)\s+(\d{4,5})\s*(?:[₡\$]\s*)?([\d,\.]+)?(?:Lab Internacional)?$', line)
        if match:
            name = match.group(1).strip()
            code = match.group(2)
            price = match.group(3)
            
            if "Lab Internacional" in line:
                price = "Lab Internacional"
            elif price:
                price = price.replace(",", "")
            
            # Skip if name is just a number or too short
            if len(name) > 2 and not name.isdigit():
                catalog.append({
                    "code": code,
                    "name": name,
                    "price": price if price else ""
                })

if not os.path.exists("src/data"):
    os.makedirs("src/data")

with open("src/data/cmqccr_catalog.json", "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(catalog)} tests.")
