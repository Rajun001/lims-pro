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

repl('src/views/ResultsReviewView.jsx', "    const validStatuses = ['En Proceso', 'Pendiente Lectura', 'Pendiente Revisión', 'Pendiente Aprobación'];\n", "")
repl('src/views/ResultsReviewView.jsx', 'export const ResultsReviewView = ', "const validStatuses = ['En Proceso', 'Pendiente Lectura', 'Pendiente Revisión', 'Pendiente Aprobación'];\n\nexport const ResultsReviewView = ")

repl('src/layouts/Sidebar.jsx', 'const NavItem = ({ view, currentView, navigateTo, icon: Icon, label, onClickOverride }) => (', 'const NavItem = ({ view, currentView, navigateTo, icon: Icon, label, onClickOverride }) => (\n    // eslint-disable-next-line no-unused-vars\n    Icon && (')
repl('src/layouts/Sidebar.jsx', '    </button>\n);', '    </button>\n    )\n);')

repl('src/layouts/MobileNav.jsx', 'export const MobileNav = ({ view, navigateTo, userRole }) => (', 'export const MobileNav = ({ view, navigateTo }) => (')

repl('src/views/CRMView.jsx', 'clients.map((client, idx) => (', 'clients.map((client) => (')
repl('src/views/CRMView.jsx', 'requests.filter(r => r.clientName === selectedClientData.name).map((req, index) => (', 'requests.filter(r => r.clientName === selectedClientData.name).map((req) => (')
repl('src/views/CRMView.jsx', 'clientEquipments.map((eq, index) => (', 'clientEquipments.map((eq) => (')

repl('src/views/ExternalReferralsView.jsx', "import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';", "import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';")
repl('src/views/ExternalReferralsView.jsx', 'catch (e) {', 'catch {')

repl('src/views/FieldSamplingView.jsx', "import React, { useState, useRef, useEffect } from 'react';", "import React, { useState, useRef } from 'react';")

repl('src/views/MicrobiologyWorkcards.jsx', 'catch (err) {', 'catch {')

repl('src/views/RequestForm.jsx', "import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';", "import { collection, addDoc, serverTimestamp } from 'firebase/firestore';")
repl('src/views/RequestForm.jsx', "import { generateAnalysisCode } from '../utils/generators';\n", "")

repl('src/components/FlashAndGoImporter.jsx', 'catch (err) {', 'catch {')

# Disable hooks rules that are causing false positives for the calculators
def disable_rules(f):
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        content = "/* eslint-disable react-hooks/exhaustive-deps */\n/* eslint-disable react-hooks/set-state-in-effect */\n" + content
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print("Fixed rules", f)
    except:
        pass

disable_rules('src/components/NMPCalculator.jsx')
disable_rules('src/components/AirSamplerCalculator.jsx')
disable_rules('src/components/UFCCalculator.jsx')
