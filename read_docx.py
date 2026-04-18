import zipfile
import xml.etree.ElementTree as ET

def extract(f):
    doc = zipfile.ZipFile(f)
    xml = doc.read('word/document.xml')
    doc.close()
    tree = ET.XML(xml)
    W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    
    return '\n'.join(''.join(node.text for node in p.iter(W+'t') if node.text) for p in tree.iter(W+'p') if [node.text for node in p.iter(W+'t') if node.text])

try:
    with open('prd_text.txt', 'w', encoding='utf-8') as fout:
        fout.write(extract('C:/Users/huesh/Downloads/College Project/ExplainX/ExplainX_PRD.docx'))
except Exception as e:
    print("Error reading PRD:", e)

try:
    with open('trd_text.txt', 'w', encoding='utf-8') as fout:
        fout.write(extract('C:/Users/huesh/Downloads/College Project/ExplainX/ExplainX_TRD.docx'))
except Exception as e:
    print("Error reading TRD:", e)
