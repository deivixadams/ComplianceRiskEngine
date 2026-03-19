import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(path):
    try:
        with zipfile.ZipFile(path, 'r') as z:
            content = z.read('word/document.xml')
            root = ET.fromstring(content)
            
            # Namespace for Word XML
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Find all text elements
            texts = []
            for t in root.findall('.//w:t', ns):
                if t.text:
                    texts.append(t.text)
            
            return "".join(texts)
    except Exception as e:
        return f"Error reading {path}: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python read_docx.py <path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    print(read_docx(file_path))
