# LLM Prompt Mode Triggers (Coding Models)

This document summarizes common prompt formulations that implicitly shift coding model behavior. While models do not expose explicit modes, wording strongly influences optimization priorities.

---
## 🔧 Deterministic / Minimal Change Mode
**Goal:** Bug fixing, compile stability, safe diffs

**High‑Signal Triggers:**
- "Fix the bug"
- "Fix with minimal changes"
- "Do not refactor"
- "Keep the existing structure"
- "Minimal diff only"
- "Preserve API"
- "Do not change logic unless necessary"

**Behavioral Bias:**
- Conservative edits
- Syntax correctness prioritized
- Lower architectural ambition

---
## 🏗 Refactor / Architecture Mode
**Goal:** Code quality, maintainability, best practices

**High‑Signal Triggers:**
- "Refactor this code"
- "Improve architecture"
- "Apply best practices"
- "Make this maintainable"
- "Clean up the design"
- "Improve readability"
- "Make this production‑ready"

**Behavioral Bias:**
- Larger structural changes
- Pattern introduction
- Higher risk of overengineering

---
## 📐 Spec‑Driven / Constraint Mode
**Goal:** Strict compliance with requirements

**High‑Signal Triggers:**
- "Must"
- "Strict requirements"
- "Do not change X"
- "Preserve interface"
- "Constraints:"
- "Non‑negotiable"
- "Follow specification exactly"

**Behavioral Bias:**
- Constraint prioritization
- Reduced creativity
- Deterministic solution shaping

---
## 🚀 Pragmatic / Fast Solution Mode
**Goal:** Speed, utility, quick implementation

**High‑Signal Triggers:**
- "Quick solution"
- "Simple approach"
- "Avoid overengineering"
- "Lightweight implementation"
- "Quick hack"
- "Fastest way"

**Behavioral Bias:**
- Reduced abstraction layers
- Direct solutions
- Higher tolerance for shortcuts

---
## 📚 Teaching / Explanation Mode
**Goal:** Learning, conceptual clarity

**High‑Signal Triggers:**
- "Explain"
- "Why"
- "Step by step"
- "For learning purposes"
- "I am new to X"

**Behavioral Bias:**
- Verbose responses
- Simplifications
- Conceptual scaffolding

---
## ⚡ Performance / Optimization Mode
**Goal:** Efficiency, speed, resource usage

**High‑Signal Triggers:**
- "Optimize"
- "Performance critical"
- "Reduce allocations"
- "Improve efficiency"
- "Low latency"

**Behavioral Bias:**
- Algorithmic changes
- Potential readability trade‑offs
- Aggressive improvements

---
## 🧩 Stability / Enterprise Safety Mode
**Goal:** Defensive, robust production code

**High‑Signal Triggers:**
- "Production‑ready"
- "Enterprise‑grade"
- "Robust"
- "Defensive coding"
- "Handle edge cases"
- "Error handling"

**Behavioral Bias:**
- Extra validation layers
- Guard clauses
- Verbosity increase

---
## 🧠 Key Insight
Coding models continuously infer optimization priorities from wording. Small phrasing changes produce large behavioral shifts.

**Practical Strategy:**
Combine triggers deliberately:

Example:
"Fix the bug with minimal changes. Do not refactor. Preserve API."

This sharply reduces unwanted architectural drift.

---
## ✅ Expert Prompt Pattern
A high‑stability professional prompt often includes:

- Primary objective (fix/refactor/optimize)
- Change constraints (minimal diff / preserve API)
- Quality bias (readability / performance / maintainability)
- Risk bias (avoid overengineering)

Example Template:

"[Objective]. Constraints: [rules]. Prioritize: [bias]. Avoid: [anti‑patterns]."

