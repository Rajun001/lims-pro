import zlib
import re
import sys

def parse_pdf(path):
    print("=" * 40)
    print("PARSING:", path)
    print("=" * 40)
    with open(path, "rb") as f:
        content = f.read()

    # Find streams
    streams = re.findall(b"stream[\r\n]+(.*?)[\r\n]+endstream", content, re.DOTALL)
    for i, s in enumerate(streams):
        try:
            decompressed = zlib.decompress(s)
            # Find Tj / TJ strings
            text_chunks = re.findall(rb"\((.*?)\)\s*Tj", decompressed)
            if text_chunks:
                decoded = [c.decode('latin1', 'ignore') for c in text_chunks]
                print(f"--- Stream {i} ---")
                print(" ".join(decoded))
        except Exception:
            pass

if __name__ == "__main__":
    for f in ["C:\\Users\\HP LAB\\Desktop\\131442.pdf", "C:\\Users\\HP LAB\\Desktop\\131443.pdf", "C:\\Users\\HP LAB\\Desktop\\129811.pdf"]:
        try:
            parse_pdf(f)
        except Exception as e:
            print("Error:", e)
