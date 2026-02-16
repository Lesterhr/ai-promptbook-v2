# **Das Architektur-Framework für Agenten-Instruktionen: Eine umfassende Analyse von Markdown-basierten Steuermechanismen für KI-Agenten**

## **Executive Summary**

Die Softwareentwicklung befindet sich in einer fundamentalen Transformation: Der Übergang von der imperativen Programmierung durch Menschen hin zur deklarativen Orchestrierung autonomer KI-Agenten ist in vollem Gange. In diesem neuen Paradigma ist der Quellcode nicht mehr das alleinige Artefakt der Wertschöpfung; vielmehr rückt die Qualität des Kontexts und der Instruktionen in den Mittelpunkt. Large Language Models (LLMs), die als Kern dieser Agenten fungieren, sind probabilistische Systeme. Um sie in deterministische Werkzeuge für Enterprise-Umgebungen zu verwandeln, bedarf es einer rigiden, strukturierten Governance-Schicht.

Diese Governance manifestiert sich heute primär in Markdown-Instruktionsdateien – statischen Artefakten, die als "Betriebssystem" oder "Verfassung" des Agenten dienen. Ob als AGENTS.md, .cursorrules, CLAUDE.md oder .github/copilot-instructions.md implementiert – diese Dateien teilen einen gemeinsamen Zweck: die Reduktion stochastischer Varianz und die Durchsetzung architektonischer Axiome.1

Der vorliegende Forschungsbericht liefert eine erschöpfende Analyse des aktuellen Stands der Technik bei Agenten-Instruktionen. Basierend auf der Auswertung von über 2.500 Repositories sowie technischer Dokumentationen von Microsoft, Anthropic und OpenAI wird ein "Universal Agent Protocol" abgeleitet. Dieser Bericht dekonstruiert die Mechanismen der Kontext-Injektion, analysiert die Wirksamkeit von XML-Delimitern und Negativ-Constraints und kulminiert in der Entwicklung eines optimalen, modularen Templates, das als Single Source of Truth für moderne KI-gestützte Entwicklungsumgebungen dient.

## ---

**1\. Die Ökologie der Instruktionsdateien: Standards und Fragmentierung**

Die Landschaft der KI-Konfiguration ist derzeit durch eine Phase der Divergenz geprägt, die jedoch erste Anzeichen einer Konvergenz hin zu universellen Standards zeigt. Das Verständnis der subtilen Unterschiede zwischen den proprietären Formaten ist essenziell, um ein Template zu entwickeln, das systemübergreifend funktioniert.

### **1.1 Der Aufstieg von Markdown als Lingua Franca**

Die Industrie hat sich faktisch auf Markdown als Standardformat für Agenten-Instruktionen geeinigt. Diese Wahl ist keineswegs zufällig, sondern technisch begründet. Markdown bietet eine semantische Struktur (Überschriften, Listen, Code-Blöcke), die von LLMs während des Pre-Trainings als hierarchische Datenstruktur internalisiert wurde.4 Im Gegensatz zu JSON oder YAML, die eine strikte Syntax-Adhärenz erfordern und bei Syntaxfehlern oft zum Abbruch der Verarbeitung führen, erlaubt Markdown eine Hybridform aus natürlicher Sprache und Struktur, die optimal mit den NLP-Fähigkeiten moderner Modelle korreliert.6

Untersuchungen an der Datei AGENTS.md zeigen, dass eine einzelne, im Root-Verzeichnis platzierte Markdown-Datei die Zuverlässigkeit von Agenten signifikant erhöht, Halluzinationen reduziert und Korrekturschleifen minimiert.1 Diese Datei fungiert als persistenter Kontext-Injektor, der sicherstellt, dass jede Interaktion mit einem geteilten Verständnis der Projektaxiome beginnt.

### **1.2 Vergleichende Analyse proprietärer Standards**

Obwohl Universalität das Ziel ist, existieren derzeit verschiedene "Dialekte" der Agenten-Instruktion. Ein optimales Template muss diese Dialekte synthetisieren.

#### **1.2.1 GitHub Copilot (.github/copilot-instructions.md)**

Microsofts Ansatz für den GitHub Copilot ist stark auf natürliche Sprache und Persona-Definition fokussiert. Die Best Practices konzentrieren sich hier auf "Dos and Don'ts" und die Zuweisung einer spezifischen Rolle (z.B. "Du bist ein Senior TypeScript Engineer").4

* **Charakteristika:**  
  * Starke Betonung von Markdown-Hierarchien zur Gewichtung von Instruktionen.  
  * Integration in den "System Prompt" des Modells, bevor User-Input verarbeitet wird.  
  * Fokus auf Verhaltensregeln eher als auf strikte Werkzeugnutzung.

#### **1.2.2 Cursor (.cursor/rules/\*.mdc)**

Cursor verfolgt einen hochgradig modularen Ansatz mit .mdc (Markdown for Cursor) Dateien. Diese Innovation erlaubt das "Globbing", bei dem spezifische Regeln nur dann in den Kontext geladen werden, wenn relevante Dateien bearbeitet werden (z.B. Regeln für \*.css Dateien werden nur geladen, wenn Stylesheets editiert werden). Dies optimiert die Nutzung des Kontextfensters (Context Window Economics) und stellt hohe Relevanz sicher.9

* **Architektonische Implikation:** Ein monolithisches Regelwerk ist in komplexen Monorepos ineffizient. Das optimale Template muss daher modularisierbar sein, um "Context Pollution" – die Verunreinigung des Aufmerksamkeitsfokus des Modells durch irrelevante Regeln – zu vermeiden.

#### **1.2.3 Claude Code (CLAUDE.md)**

Anthropics CLI-Tool verlässt sich auf eine prägnante Root-Datei. Der Schwerpunkt liegt auf Informationsdichte: Architektur, Build-Befehle und Testprotokolle. Ein Alleinstellungsmerkmal von Claude ist die extrem hohe Adhärenz zu XML-Tags. CLAUDE.md nutzt Tags wie \<architecture\> oder \<testing\>, um Instruktionen zu kompartimentieren, was die Parsing-Genauigkeit des Modells drastisch erhöht.11

#### **1.2.4 Cline / Roo Code (.clinerules)**

Diese Agenten operieren oft in einem autonomen Loop ("Plan vs. Act"). Ihre Instruktionsdateien müssen rigide Protokolle für die Werkzeugnutzung definieren, um zu verhindern, dass der Agent destruktive Befehle ausführt, ohne vorherige Bestätigung einzuholen.13 Hier wird die Instruktionsdatei zur Sicherheitsbarriere.

### **1.3 Die Konvergenz: AGENTS.md als universeller Standard**

Um der Konfigurationsdrift ("Drift") entgegenzuwirken, formiert sich die Open-Source-Community um AGENTS.md als herstellerneutralen Standard.2 Die Philosophie lautet "Context-as-Code": Agenten-Instruktionen werden mit derselben Strenge behandelt wie Infrastruktur-Konfigurationen (IaC). Ein standardisiertes AGENTS.md erlaubt es Entwicklern, die "Verfassung" ihres Projekts einmalig zu definieren, während individuelle Tools so konfiguriert werden, dass sie aus dieser zentralen Quelle lesen.

| Standard | Primäre Stärke | Kontext-Mechanismus | Beste Nutzung für |
| :---- | :---- | :---- | :---- |
| **AGENTS.md** | Universalität, Vendor-Neutral | Root-Level Injektion | Basis-Architektur, Projekt-Axiome |
| **.cursorrules** | Kontext-Effizienz | Glob-basiertes Laden | Dateityp-spezifische Syntax-Regeln |
| **CLAUDE.md** | Struktur-Adhärenz | XML-Parsing | Komplexe Refactorings, Architektur-Analysen |
| **copilot-instructions** | Integration | VS Code Native | Workflow-Optimierung, Style-Guides |

*Tabelle 1: Vergleichende Analyse der Instruktions-Standards*

## ---

**2\. Theoretische Fundamente der Prompt-Architektur**

Bevor ein Template erstellt werden kann, müssen die theoretischen Wirkmechanismen verstanden werden, die erfolgreiche Instruktionen von ineffektiven unterscheiden. Die Forschung zeigt, dass erfolgreiche Prompts nicht auf "magischen Phrasen" basieren, sondern auf Prinzipien der kognitiven Architektur von LLMs.

### **2.1 Persona Engineering und Latent Space Steering**

Die klassische Instruktion "Du bist ein hilfreicher Assistent" ist obsolet und führt oft zu generischen, tutorial-artigen Antworten. Hochleistungs-Instruktionen definieren eine hyper-spezifische Rolle. Für eine komplexe Webanwendung könnte die Persona lauten: "Ein Principal Systems Architect, spezialisiert auf skalierbare, typsichere React-Pattern und Domain-Driven Design."

Diese Technik, bekannt als "Latent Space Steering", positioniert den Vektor des Modells in einem Bereich des Trainingsraums, in dem Expertenwissen wahrscheinlicher ist als Anfängerwissen.8

* **Implikation zweiter Ordnung:** Die Persona definiert nicht nur das Wissen, sondern auch die *Ablehnungsgrenzen*. Eine "Security Engineer"-Persona wird unsicheren Code (z.B. eval()) mit höherer Wahrscheinlichkeit ablehnen als ein generischer Assistent, da ihre "Sicherheits-Schwellenwerte" durch das Pre-Training in diesem Kontext strenger gewichtet sind.

### **2.2 Die XML-Delimiter-Hypothese**

Forschungen von Anthropic und OpenAI belegen die überlegene Wirksamkeit von XML-Tags zur Strukturierung von Prompts. Das Umschließen semantischer Blöcke in Tags wie \<coding\_standards\>, \<project\_structure\> und \<examples\> hilft dem Modell, zwischen Kontext, Instruktion und Daten zu unterscheiden.15

Dies basiert auf der Art und Weise, wie Transformer-Modelle "Attention" verarbeiten. Markdown-Header (\#\#) sind weiche Trenner. XML-Tags hingegen fungieren als harte Container. Sie verhindern das "Leaking" von Instruktionen, bei dem das Modell beispielsweise Beispielcode (\<example\>) irrtümlich als direkte Handlungsanweisung interpretiert.

### **2.3 Kontext-Ökonomie und Hierarchische Modularität**

Da Projekte wachsen, wird eine einzelne 500-Zeilen-Instruktionsdatei unhandlich und verbraucht unnötige Tokens. Die Lösung ist **hierarchische Modularität**.17

1. **Root AGENTS.md:** Globale Axiome (Coding Style, Git-Workflow).  
2. **Sub-Verzeichnis AGENTS.md:** Domänenspezifische Regeln (z.B. fokussiert frontend/AGENTS.md auf CSS und Komponenten, während backend/AGENTS.md auf Datenbankschemata und API-Verträge fokussiert).

Agenten müssen instruiert werden, rekursiv nach lokalen Instruktionsdateien im aktuellen Arbeitsverzeichnis zu suchen, bevor sie auf die Root-Datei zurückgreifen. Dies mimt das Verhalten von .gitignore oder .eslintrc und ist ein Designmuster, das sich in der Softwareentwicklung bewährt hat.

## ---

**3\. Strategische Prompt-Muster: Das "Wie" der Instruktion**

Die Analyse der Research Snippets offenbart spezifische Muster, die in einem optimalen Template nicht fehlen dürfen.

### **3.1 Chain-of-Thought vs. O-Serie (Reasoning Modelle)**

Eine kritische Divergenz in der Prompting-Strategie zeichnet sich zwischen Standardmodellen (GPT-4o, Claude 3.5 Sonnet) und "Reasoning"-Modellen (OpenAI o1, o3) ab.

* **Standard-Modelle:** Profitieren massiv von expliziten Anweisungen wie "Denke Schritt für Schritt" (Chain-of-Thought, CoT), um logische Schlussfolgerungen zu induzieren.18  
* **Reasoning-Modelle (o1/o3):** Diese Modelle haben CoT internalisiert. Forschungsergebnisse deuten darauf hin, dass forciertes CoT-Prompting (z.B. "Erkläre jeden Schritt") die Leistung degradieren kann, da es mit den internen Denkprozessen des Modells kollidiert. Für diese Modelle müssen Prompts auf **Constraints (Einschränkungen)** und **Endziele** fokussieren, nicht auf den Denkprozess selbst.20

**Template-Konsequenz:** Das optimale Template muss adaptiv sein. Es sollte eine Sektion "Reasoning Strategy" enthalten, die je nach angesteuertem Modell aktiviert oder deaktiviert werden kann.

### **3.2 Negative Constraints (Die Apophatische Methode)**

Dem Agenten zu sagen, was er *nicht* tun soll, ist oft effektiver, als ihm zu sagen, was er tun soll. "Negative Constraints" beschneiden den Entscheidungsbaum (Pruning) und verhindern bekannte Fehlerquellen.22

* **Beispiele für effektive Negative Constraints:**  
  * "Verwende niemals any in TypeScript."  
  * "Hinterlasse keine Zombie-Kommentare (auskommentierter Code)."  
  * "Commite niemals Secrets oder API-Keys."  
  * "Erstelle keine neuen Dateien, ohne vorher zu prüfen, ob ähnliche Utilities existieren."

Diese Methode nutzt die Fähigkeit des Modells zur Mustererkennung negativ: Durch das explizite Labeling eines Musters als "verboten" wird die Wahrscheinlichkeit seiner Generierung im Vektorraum drastisch reduziert.

### **3.3 Few-Shot Learning mit "Good vs. Bad" Beispielen**

Konkrete Code-Snippets haben eine höhere Instruktionsbandbreite als Prosa. Eine Sektion "Good vs. Bad" demonstriert den gewünschten Stil effektiver als drei Absätze Erklärung.8

* **Mechanismus:** Dies nutzt In-Context Learning. Wenn das Modell ein Beispiel sieht, das als "Bad" markiert ist, und eines als "Good", kalibriert es seine Generierungsparameter, um den Abstand zum "Bad"-Beispiel zu maximieren und die Nähe zum "Good"-Beispiel zu suchen.

## ---

**4\. Der "Plan-Act-Verify" Loop: Kognitive Architektur für Autonomie**

Für autonome Agenten (wie Cline oder AutoGPT) reicht es nicht, *wie* sie coden sollen; man muss definieren, *wie sie arbeiten* sollen. Die Instruktionen müssen einen kognitiven Loop erzwingen, um destruktive "Lazy"-Aktionen zu verhindern.13

Dieser Loop besteht aus vier Phasen:

1. **Exploration:** Lese relevante Dateien. Rate niemals Pfade.  
2. **Planning:** Schlage eine Änderung in \<plan\> Tags vor. Dies zwingt das Modell, erst zu denken (CoT), bevor es Tokens für Code generiert.  
3. **Action:** Führe die Änderung durch.  
4. **Verification:** Führe Tests aus, um den Fix zu bestätigen.

Das Fehlen dieses Loops ist die Hauptursache für Agenten, die Code verschlimmbessern oder in Endlosschleifen geraten. Das Template muss diesen Loop explizit als Gesetz verankern.

## ---

**5\. Das Optimale Template: "Universal Agent Protocol"**

Basierend auf der Synthese dieser Erkenntnisse präsentieren wir das optimale Template. Es ist so konzipiert, dass es:

1. **Modulär** ist (erweiterbar für spezifische Situationen).  
2. **Polyglot** ist (lesbar von Copilot, Cursor, Claude und Cline).  
3. **Constraint-Getrieben** ist (Fokus auf Grenzen).  
4. **XML-Strukturiert** ist (für maximale Parsing-Sicherheit).

### ---

**5.1 Das Template (Markdown-Quellcode)**

Speichern Sie den folgenden Block als AGENTS.md im Root-Verzeichnis Ihres Projekts.

# **AGENTS.md \- Universal Agent Protocol**

**System Notice:** Diese Datei enthält die fundamentalen Axiome und die "Verfassung" für dieses Projekt. Alle KI-Agenten (Cursor, Copilot, Claude, Cline) müssen diesen Prinzipien strikt folgen. Ignorieren dieser Datei ist ein kritischer Fehler.

\<agent\_persona\>

**Rolle:** Senior Full-Stack Engineer & Systems Architect

**Spezialisierung:** Skalierbare Systeme

**Eigenschaften:** Präzise, Defensiv, Idiomatisch, Performance-besessen.

**Tone:** Professionell, technisch, konzise. Kein Marketing-Sprech, keine Entschuldigungen ("I apologize...").

**Denkweise:** Analytisch. Bevorzugt stabile, wartbare Lösungen gegenüber "cleveren" Hacks.

\</agent\_persona\>

\<project\_context\>

## **Tech Stack (Versionen strikt einhalten)**

* **Core:**  
* **State Management:** \- *Begründung: Wir bevorzugen atomare Updates.*  
* **Styling:** \- *Constraint: Keine inline-styles, nutze Utility-Klassen.*  
* **Testing:**  
* **Database:**

## **Key Architecture**

* **Pattern:**  
* **Rendering:**  
* **Data Fetching:**  
  \</project\_context\>

\<operating\_rules\>

## **Der Plan-Act-Verify Loop (MANDATORY)**

Jede komplexe Aufgabe muss diesem Protokoll folgen:

1. **Explore:** Bevor Code geschrieben wird, inspiziere relevante Dateien mittels Tools (read\_file, grep). Rate niemals Dateipfade.  
2. **Plan:** Für nicht-triviale Änderungen, skizziere den Ansatz in \<plan\> Tags. Identifiziere potenzielle Risiken (Breaking Changes).  
3. **Act:** Implementiere kleine, atomare Änderungen.  
4. **Verify:** Führe relevante Tests (npm test \<file\>) nach dem Editieren aus. Repariere Regressionen sofort.

## **Datei-Operationen**

* **Neue Dateien:** Prüfe immer, ob eine ähnliche Utility bereits existiert, bevor eine neue erstellt wird (DRY).  
* **Edits:** Entferne niemals Kommentare, es sei denn, sie sind obsolet. Bewahre den existierenden Code-Stil.  
* **Dependencies:** Installiere keine neuen Pakete ohne explizite Erlaubnis des Users.  
  \</operating\_rules\>

\<coding\_standards\>

## **Generelle Prinzipien**

* **DRY (Don't Repeat Yourself):** Extrahiere Logik in Hooks/Utils.  
* **Early Returns:** Nutze Guard Clauses, um Verschachtelungstiefe zu reduzieren.  
* **Naming:**  
  * Variablen: camelCase (deskriptiv, keine x, y, data)  
  * Komponenten: PascalCase  
  * Konstanten: SCREAMING\_SNAKE\_CASE  
* **Typing:** Striktes TypeScript. Kein any. Definiere Interfaces für alle Props/API-Antworten.

## **Negative Constraints (NEVER DO)**

* 🚫 Führe niemals zirkuläre Abhängigkeiten ein.  
* 🚫 Hardcode niemals Secrets oder API-Keys (nutze .env).  
* 🚫 Hinterlasse niemals console.log im Produktionscode.  
* 🚫 Nutze keine veralteten Lifecycle-Methoden (z.B. componentWillMount).  
* 🚫 Lösche keine existierenden Tests, um den Build "grün" zu machen.  
  \</coding\_standards\>

### **Data Fetching**

\*\*❌ BAD (Veraltet, Race-Conditions möglich):\*\*javascript

useEffect(() \=\> {

fetch('/api/user').then(res \=\> res.json()).then(setData);

},);

\*\*✅ GOOD (Type-safe, Caching, Deduping):\*\*  
\`\`\`javascript  
const { data, isLoading } \= useQuery({  
  queryKey: \['user'\],  
  queryFn: fetchUser  
});

### **Error Handling**

**❌ BAD (Swallowing Errors):**

JavaScript

try {... } catch (e) { console.log(e); }

**✅ GOOD (Structured Logging & Propagation):**

JavaScript

try {... } catch (error) {  
  logger.error('Failed to process transaction', { error, context: txId });  
  throw new AppError('TransactionFailed', error);  
}

\<documentation\_requirements\>

* Aktualisiere README.md, wenn sich die Architektur ändert.  
* Füge JSDoc/DocString zu allen exportierten Funktionen hinzu.  
* Erkläre komplexe Logik mit Inline-Kommentaren ("Warum", nicht "Was").  
  \</documentation\_requirements\>

\---

\#\# 6\. Erweiterungsstrategien: Kontext-Overlays für spezifische Situationen

Die Anfrage fordert explizit eine Methode, dieses Template für "bestimmte Situationen" zu erweitern. Dies erreichen wir durch das Konzept der \*\*Kontext-Overlays\*\*. Anstatt das Haupt-Template zu ändern, instruieren wir den Agenten per Prompt, in einen spezifischen "Modus" zu wechseln. Dieser Modus aktiviert zusätzliche Regelsets.

\#\#\# 6.1 Szenario: Debugging / Maintenance Mode

Wenn der Agent einen Bug fixen soll, ist Kreativität schädlich. Er muss zum Ermittler werden.

\*   \*\*Prompt-Erweiterung:\*\*  
    \> "Aktiviere DEBUG\_MODE. Priorisiere Log-Analyse. Refactore keinen Code, der nicht direkt mit dem Fehler zusammenhängt. Nutze die wissenschaftliche Methode: Hypothese \-\> Test \-\> Schlussfolgerung."

\*   \*\*Erweiterung im Template (\`AGENTS.md\` hinzufügen):\*\*  
    \`\`\`xml  
    \<mode name="debug"\>  
      \<priority\>Isolation und Reproduktion\</priority\>  
      \<rules\>  
        1\. Erstelle einen Reproduktions-Testfall, BEVOR du fixst.  
        2\. Verifiziere den Fix gegen diesen Testfall.  
        3\. Ändere nur die minimal notwendigen Zeilen.  
      \</rules\>  
    \</mode\>  
    \`\`\`

\#\#\# 6.2 Szenario: Refactoring / Modernisierung

Bei Upgrades von Legacy-Code muss der Agent destruktiv sein dürfen, aber verhaltensneutral bleiben.

\*   \*\*Prompt-Erweiterung:\*\*  
    \> "Aktiviere REFACTOR\_MODE. Ziel: Verbessere Wartbarkeit ohne das Verhalten zu ändern. Erzwinge strikte Typisierung."

\*   \*\*Erweiterung im Template:\*\*  
    \`\`\`xml  
    \<mode name="refactor"\>  
      \<priority\>Wartbarkeit und Clean Code\</priority\>  
      \<rules\>  
        1\. Stelle sicher, dass 100% Testabdeckung existiert, bevor du startest.  
        2\. Halte dich strikt an SOLID Prinzipien.  
        3\. Bevorzuge Komposition über Vererbung.  
        4\. Dokumentiere alle Änderungen in einem CHANGELOG-Eintrag.  
      \</rules\>  
    \</mode\>  
    \`\`\`

\#\#\# 6.3 Szenario: Dokumentation (Scribe Mode)

\*   \*\*Prompt-Erweiterung:\*\*  
    \> "Aktiviere SCRIBE\_MODE. Fokus auf Klarheit, Genauigkeit und Beispiele. Zielgruppe: Junior Developer."

\---

\#\# 7\. Implementierungsstrategie

Um die Effektivität dieses Frameworks zu maximieren, wird folgende Implementierungsstrategie empfohlen:

1\.  \*\*Die Symlink-Strategie:\*\* Erstellen Sie die Master-Datei \`AGENTS.md\` im Root. Erstellen Sie Symlinks für alle tool-spezifischen Pfade, um sicherzustellen, dass alle Agenten auf dasselbe "Gehirn" zugreifen.\[2\] Dies verhindert Fragmentierung.  
    \*   \`ln \-s AGENTS.md.cursorrules\`  
    \*   \`ln \-s AGENTS.md.github/copilot-instructions.md\`  
    \*   \`ln \-s AGENTS.md CLAUDE.md\`  
2\.  \*\*Der iterative Feedback-Loop:\*\* Behandeln Sie die Instruktionsdatei wie Quellcode. Wenn der Agent einen Fehler macht (z.B. eine falsche Bibliothek nutzt), korrigieren Sie nicht nur den Code im Chat, sondern \*\*korrigieren Sie den Prompt\*\*. Fügen Sie sofort einen neuen "Negative Constraint" zur \`AGENTS.md\` hinzu.  
3\.  \*\*Linting the Linter:\*\* Nutzen Sie ein leichtgewichtiges Skript (z.B. in CI/CD), um zu validieren, dass \`AGENTS.md\` valides Markdown enthält und Code-Blöcke syntaktisch korrekt sind. Dies verhindert "Garbage In, Garbage Out"-Szenarien beim LLM.

\#\# 8\. Zukünftige Entwicklungen: MCP und dynamische Agenten

Die nächste Evolutionsstufe, die sich bereits abzeichnet, ist die Integration des \*\*Model Context Protocol (MCP)\*\*. MCP standardisiert, wie Agenten auf externe Daten (Postgres, Slack, GitHub) zugreifen.\[26, 27\]

In Zukunft wird die \`AGENTS.md\` nicht nur statische Regeln enthalten, sondern auch dynamische Routing-Anweisungen für MCP-Server:  
\*   \*"Wenn du Datenbank-Probleme debuggst, nutze das \`postgres-mcp\` Tool, um das Schema zu prüfen, anstatt Annahmen zu treffen."\*

Dies verwandelt die Instruktionsdatei von einem passiven Dokument in einen aktiven Router für Werkzeugkompetenzen.

\#\# Fazit

Das hier vorgestellte "Universal Agent Protocol" repräsentiert den State-of-the-Art in der Agenten-Instruktion. Es geht über einfache "Tipps und Tricks" hinaus und bietet einen engineering-tauglichen Konfigurationsstandard. Durch die Adoption dieses Markdown-basierten, XML-angereicherten und modularen Ansatzes können Entwickler KI-Agenten von erratischen Assistenten in zuverlässige, experten-gleiche Kollaborateure verwandeln. Das bereitgestellte Template dient als skalierbares Fundament, das mit der Komplexität des Projekts und den evolvierenden Fähigkeiten der zugrunde liegenden KI-Modelle mitwachsen kann.

Der Schlüssel zum Erfolg liegt nicht in der Wahl des "klügsten" Modells, sondern in der Klarheit der Instruktionen, die diesem Modell gegeben werden. In der Ära der KI-Entwicklung ist der Prompt Engineer der neue Architekt.

#### **Works cited**

1. What is AGENTS.md?, accessed February 13, 2026, [https://cobusgreyling.medium.com/what-is-agents-md-2846b586b116](https://cobusgreyling.medium.com/what-is-agents-md-2846b586b116)  
2. AGENTS.md: A Standard for AI Coding Agents \- Igor Kupczyński, accessed February 13, 2026, [https://kupczynski.info/posts/agents-md-a-standard-for-ai-coding-agents/](https://kupczynski.info/posts/agents-md-a-standard-for-ai-coding-agents/)  
3. AGENTS.md: A New Standard for Unified Coding Agent Instructions \- Addo Zhang \- Medium, accessed February 13, 2026, [https://addozhang.medium.com/agents-md-a-new-standard-for-unified-coding-agent-instructions-0635fc5cb759](https://addozhang.medium.com/agents-md-a-new-standard-for-unified-coding-agent-instructions-0635fc5cb759)  
4. Write effective instructions for declarative agents | Microsoft Learn, accessed February 13, 2026, [https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/declarative-agent-instructions](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/declarative-agent-instructions)  
5. Guidelines and best practices for automating with AI agent \- Webex Help Center, accessed February 13, 2026, [https://help.webex.com/en-us/article/nelkmxk/Guidelines-and-best-practices-for-automating-with-AI-agent](https://help.webex.com/en-us/article/nelkmxk/Guidelines-and-best-practices-for-automating-with-AI-agent)  
6. How to prevent GPT from outputting responses in Markdown format? \- Prompting, accessed February 13, 2026, [https://community.openai.com/t/how-to-prevent-gpt-from-outputting-responses-in-markdown-format/961314](https://community.openai.com/t/how-to-prevent-gpt-from-outputting-responses-in-markdown-format/961314)  
7. GPT-4.1 Prompting Guide \- OpenAI for developers, accessed February 13, 2026, [https://developers.openai.com/cookbook/examples/gpt4-1\_prompting\_guide/](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide/)  
8. How to write a great agents.md: Lessons from over 2,500 repositories \- The GitHub Blog, accessed February 13, 2026, [https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)  
9. Best practices for coding with agents \- Cursor, accessed February 13, 2026, [https://cursor.com/blog/agent-best-practices](https://cursor.com/blog/agent-best-practices)  
10. Supercharge Your Codebase: Automate Cursor Rules \- SashiDo.io, accessed February 13, 2026, [https://www.sashido.io/en/blog/cursor-self-improving-rules](https://www.sashido.io/en/blog/cursor-self-improving-rules)  
11. Best Practices for Claude Code, accessed February 13, 2026, [https://code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)  
12. Claude Code Hacks, accessed February 13, 2026, [https://medium.com/data-science-in-your-pocket/claude-code-hacks-b1ea297e765d](https://medium.com/data-science-in-your-pocket/claude-code-hacks-b1ea297e765d)  
13. Prompt Engineering for AI Agents \- PromptHub, accessed February 13, 2026, [https://www.prompthub.us/blog/prompt-engineering-for-ai-agents](https://www.prompthub.us/blog/prompt-engineering-for-ai-agents)  
14. How to write PRDs for AI Coding Agents | by David Haberlah | Jan, 2026, accessed February 13, 2026, [https://medium.com/@haberlah/how-to-write-prds-for-ai-coding-agents-d60d72efb797](https://medium.com/@haberlah/how-to-write-prds-for-ai-coding-agents-d60d72efb797)  
15. Prompt engineering techniques and best practices: Learn by doing with Anthropic's Claude 3 on Amazon Bedrock | Artificial Intelligence, accessed February 13, 2026, [https://aws.amazon.com/blogs/machine-learning/prompt-engineering-techniques-and-best-practices-learn-by-doing-with-anthropics-claude-3-on-amazon-bedrock/](https://aws.amazon.com/blogs/machine-learning/prompt-engineering-techniques-and-best-practices-learn-by-doing-with-anthropics-claude-3-on-amazon-bedrock/)  
16. Use XML tags to structure your prompts \- Claude API Docs, accessed February 13, 2026, [https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)  
17. Improve your AI code output with AGENTS.md (+ my best tips) \- Builder.io, accessed February 13, 2026, [https://www.builder.io/blog/agents-md](https://www.builder.io/blog/agents-md)  
18. Effective context engineering for AI agents \- Anthropic, accessed February 13, 2026, [https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)  
19. Prompting best practices \- Claude API Docs, accessed February 13, 2026, [https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)  
20. The most comprehensive prompting guide for reasoning models : r/ChatGPTPromptGenius, accessed February 13, 2026, [https://www.reddit.com/r/ChatGPTPromptGenius/comments/1ix0bzm/the\_most\_comprehensive\_prompting\_guide\_for/](https://www.reddit.com/r/ChatGPTPromptGenius/comments/1ix0bzm/the_most_comprehensive_prompting_guide_for/)  
21. Prompting guideline for reasoning, non-reasoning & hybrid ai models \- Reddit, accessed February 13, 2026, [https://www.reddit.com/r/PromptEngineering/comments/1ixstgw/prompting\_guideline\_for\_reasoning\_nonreasoning/](https://www.reddit.com/r/PromptEngineering/comments/1ixstgw/prompting_guideline_for_reasoning_nonreasoning/)  
22. What is Prompt Engineering? The Foundation of AI Communication \- Capabl India, accessed February 13, 2026, [https://www.capabl.in/blog/what-is-prompt-engineering-the-foundation-of-ai-communication](https://www.capabl.in/blog/what-is-prompt-engineering-the-foundation-of-ai-communication)  
23. Gemini 3 prompting guide | Generative AI on Vertex AI \- Google Cloud Documentation, accessed February 13, 2026, [https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/gemini-3-prompting-guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/gemini-3-prompting-guide)  
24. Taming AI Chaos: A Structured Agent Workflow for Predictable Coding \- Allegro Tech Blog, accessed February 13, 2026, [https://blog.allegro.tech/2025/10/taming-ai-chaos-a-structured-agent-workflow-for-predicable-coding.html](https://blog.allegro.tech/2025/10/taming-ai-chaos-a-structured-agent-workflow-for-predicable-coding.html)  
25. Feature Request: Support Separate AI Models for “Plan” and “Act” Modes (Inspired by Clinebot) \- Cursor \- Community Forum, accessed February 13, 2026, [https://forum.cursor.com/t/feature-request-support-separate-ai-models-for-plan-and-act-modes-inspired-by-clinebot/119789](https://forum.cursor.com/t/feature-request-support-separate-ai-models-for-plan-and-act-modes-inspired-by-clinebot/119789)