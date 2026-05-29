import re

def fix(f, pattern, repl):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    new_content = re.sub(pattern, repl, content)
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)

fix('src/layouts/MobileNav.jsx', r'export const MobileNav = \({ view, navigateTo, userRole }\) => \(', r'export const MobileNav = ({ view, navigateTo }) => (')
fix('src/views/CRMView.jsx', r'clients\.map\(\(client, idx\) => \(', r'clients.map((client) => (')
fix('src/views/CRMView.jsx', r'requests\.filter\(r => r\.clientName === selectedClientData\.name\)\.map\(\(req, index\) => \(', r'requests.filter(r => r.clientName === selectedClientData.name).map((req) => (')
fix('src/views/CRMView.jsx', r'clientEquipments\.map\(\(eq, index\) => \(', r'clientEquipments.map((eq) => (')

fix('src/views/ExternalReferralsView.jsx', r"import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';", r"import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';")
fix('src/views/ExternalReferralsView.jsx', r'\} catch \(e\) \{', r'} catch {')

fix('src/views/RequestForm.jsx', r"import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';", r"import { collection, addDoc, serverTimestamp } from 'firebase/firestore';")
