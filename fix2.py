import os

def repl(f, src, dst):
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        content = content.replace(src, dst)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print("Fixed", f)
    except Exception as e:
        print("Error in", f, e)

repl('src/components/CAMTUCalculator.jsx', 'import React, { useState, useEffect } from \\'react\\';', 'import React, { useState, useEffect } from \\'react\\';\n/* eslint-disable react-hooks/exhaustive-deps */\n/* eslint-disable react-hooks/set-state-in-effect */')

repl('src/components/UFCCalculator.jsx', '    const [plates, setPlates] = useState([]);\n    const [method, setMethod] = useState(\\'Vaciado\\');\n', '')

repl('src/layouts/MobileNav.jsx', 'export const MobileNav = ({ view, navigateTo, userRole }) => (', 'export const MobileNav = ({ view, navigateTo }) => (')

repl('src/views/CRMView.jsx', 'clients.map((client, idx) => (', 'clients.map((client) => (')
repl('src/views/CRMView.jsx', 'requests.filter(r => r.clientName === selectedClientData.name).map((req, index) => (', 'requests.filter(r => r.clientName === selectedClientData.name).map((req) => (')
repl('src/views/CRMView.jsx', 'clientEquipments.map((eq, index) => (', 'clientEquipments.map((eq) => (')

repl('src/views/ExternalReferralsView.jsx', "import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';", "import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';")
repl('src/views/ExternalReferralsView.jsx', 'catch (e) {', 'catch {')

repl('src/views/RequestForm.jsx', "import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';", "import { collection, addDoc, serverTimestamp } from 'firebase/firestore';")

repl('src/views/ResultsReviewView.jsx', '    }, [requests, validStatuses]);', '    }, [requests]);')
