# ExplainX Architecture: UI vs AI Content Separation

## ✅ Clear Separation of Concerns

The ExplainX extension maintains a **strict separation** between:
1. **UI Elements** (Extension provides these)
2. **AI Content** (AI model provides this)

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (450px wide, right side of screen)         │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔷 HEADER (UI Element)                        │  │
│  │ ⚡ ExplainX                              ✕    │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔷 MODE SELECTOR (UI Element)                 │  │
│  │ [Simple] [Student] [Code] [Interview] [Summary]│  │
│  │  ↑ These are BUTTONS, not content headings    │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔷 CONTENT AREA (AI Response Only)            │  │
│  │                                                │  │
│  │ #explainx-body div contains:                  │  │
│  │ - Headings from AI (## Overview)              │  │
│  │ - Paragraphs from AI                          │  │
│  │ - Lists from AI                               │  │
│  │ - Code blocks from AI                         │  │
│  │                                                │  │
│  │ ❌ NO extra headers added                     │  │
│  │ ❌ NO modifications to AI content             │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔷 FOOTER (UI Element)                        │  │
│  │ 📋 Copy to Clipboard                          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Component Breakdown

### **1. HEADER (UI Element)**
**Location:** Lines 98-101 in [content.ts](file:///c:/Users/huesh/Downloads/College%20Project/ExplainX/src/content.ts#L98-L101)

```html
<div class="explainx-header">
  <span class="explainx-logo">⚡ ExplainX</span>
  <button class="explainx-close" id="explainx-close-btn">✕</button>
</div>
```

**Purpose:**
- Extension branding
- Close button to dismiss sidebar

**Source:** Extension code (not AI)

---

### **2. MODE SELECTOR (UI Element)**
**Location:** Lines 102-108 in [content.ts](file:///c:/Users/huesh/Downloads/College%20Project/ExplainX/src/content.ts#L102-L108)

```html
<div class="explainx-modes">
  <button class="mode active" data-mode="simple">Simple</button>
  <button class="mode" data-mode="student">Student</button>
  <button class="mode" data-mode="beginner-code">Beginner Code</button>
  <button class="mode" data-mode="interview">Interview</button>
  <button class="mode" data-mode="summary">Summary</button>
</div>
```

**Purpose:**
- Interactive buttons to switch between explanation modes
- Visual indicator of current active mode (`.active` class)
- Triggers re-explanation when clicked

**Behavior:**
```typescript
// When user clicks a mode button (lines 149-162)
overlay.querySelectorAll('.mode').forEach(btn => {
  btn.addEventListener('click', () => {
    const newMode = btn.dataset.mode;
    currentMode = newMode;
    showSidebar(newMode, null, null); // Show loading
    chrome.runtime.sendMessage({
      type: 'RE_EXPLAIN',
      selectedText: currentSelectedText,
      mode: newMode,
    });
  });
});
```

**Source:** Extension code (not AI)

**Styling:** [content.css](file:///c:/Users/huesh/Downloads/College%20Project/ExplainX/src/styles/content.css#L95-L125)
```css
.explainx-modes {
  display: flex;
  gap: 6px;
  padding: 12px 20px;
  overflow-x: auto;
  border-bottom: 1px solid #e0e0e0;
}

.mode {
  background: #f1f3f4;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 12px;
  cursor: pointer;
}

.mode.active {
  background: #e8f0fe;
  color: #1a73e8;
  border-color: #d2e3fc;
  font-weight: 500;
}
```

---

### **3. CONTENT AREA (AI Response Only)**
**Location:** Lines 109-116 in [content.ts](file:///c:/Users/huesh/Downloads/College%20Project/ExplainX/src/content.ts#L109-L116)

```html
<div id="explainx-body">
  ${error
    ? `<span class="explainx-error">⚠️ ${error}</span>`
    : explanation
      ? marked.parse(explanation) // ← ONLY AI content
      : `<span class="explainx-loading">Thinking...</span>`
  }
</div>
```

**Purpose:**
- Displays the AI's response
- Renders markdown headings, paragraphs, lists, code blocks
- Scrollable area for long explanations

**What's Inside:**
- ✅ Headings from AI (`## Overview`, `## Key Concepts`, etc.)
- ✅ Paragraphs from AI
- ✅ Lists from AI
- ✅ Code blocks from AI
- ✅ All formatting from AI

**What's NOT Inside:**
- ❌ No "Explanation" header
- ❌ No mode name as header
- ❌ No wrapper titles
- ❌ No modifications to AI content

**Source:** 100% from AI model response

**Rendering:** `marked.parse(explanation)` converts markdown to HTML

---

### **4. FOOTER (UI Element)**
**Location:** Line 117 in [content.ts](file:///c:/Users/huesh/Downloads/College%20Project/ExplainX/src/content.ts#L117)

```html
<button id="explainx-copy">📋 Copy to Clipboard</button>
```

**Purpose:**
- Copy AI explanation to clipboard

**Source:** Extension code (not AI)

---

## 🔄 Interaction Flow

### **User Clicks Mode Button:**

```
User clicks [Student] button
    ↓
Event listener triggered (line 149)
    ↓
Current mode updated to 'student'
    ↓
showSidebar('student', null, null) called
    ↓
Sidebar shows loading state
    ↓
Message sent to background: RE_EXPLAIN
    ↓
Background calls AI with student prompt
    ↓
AI returns response with ## headings
    ↓
SHOW_EXPLANATION message received
    ↓
showSidebar('student', explanation, null) called
    ↓
marked.parse(explanation) renders AI content
    ↓
User sees new explanation with AI's headings
```

**Important:** The mode buttons are **navigation controls**, not content headings.

---

## 📊 Visual Comparison

### **Mode Selector vs Content Headings**

| Aspect | Mode Buttons | Content Headings |
|--------|--------------|------------------|
| **Location** | `.explainx-modes` div | `#explainx-body` div |
| **Source** | Extension code | AI model response |
| **Purpose** | Navigation/switching modes | Organize AI content |
| **HTML Tag** | `<button>` | `<h2>`, `<h3>`, etc. |
| **Styling** | Pill-shaped buttons | Blue text, larger font |
| **Interactive** | ✅ Clickable | ❌ Static text |
| **Changes** | User clicks to switch | AI decides structure |
| **Example** | `[Simple] [Student]` | `## Overview` |

---

## 🎯 Example: Complete Sidebar

### **User selects "Student" mode:**

```html
<!-- SIDEBAR HTML STRUCTURE -->
<div id="explainx-popup">
  
  <!-- 1. HEADER (UI) -->
  <div class="explainx-header">
    <span class="explainx-logo">⚡ ExplainX</span>
    <button class="explainx-close">✕</button>
  </div>
  
  <!-- 2. MODE SELECTOR (UI) - Interactive buttons -->
  <div class="explainx-modes">
    <button class="mode" data-mode="simple">Simple</button>
    <button class="mode active" data-mode="student">Student</button>
    <button class="mode" data-mode="beginner-code">Beginner Code</button>
    <button class="mode" data-mode="interview">Interview</button>
    <button class="mode" data-mode="summary">Summary</button>
  </div>
  
  <!-- 3. CONTENT AREA (AI Response) - Headings from AI -->
  <div id="explainx-body">
    <h2>Overview</h2>                    <!-- AI heading -->
    <p>Async/await is syntactic sugar...</p>
    
    <h2>Key Concepts</h2>                <!-- AI heading -->
    <ul>
      <li><strong>async</strong>: Marks a function...</li>
      <li><strong>await</strong>: Pauses execution...</li>
    </ul>
    
    <h2>Real-World Example</h2>          <!-- AI heading -->
    <p>Think of ordering food...</p>
    
    <h2>Summary</h2>                     <!-- AI heading -->
    <p>Promises handle asynchronous...</p>
  </div>
  
  <!-- 4. FOOTER (UI) -->
  <button id="explainx-copy">📋 Copy to Clipboard</button>
  
</div>
```

**Key Observations:**
- Mode buttons are in `.explainx-modes` (separate div)
- Content headings are in `#explainx-body` (from AI)
- No overlap, no confusion
- Clear separation of UI and content

---

## 🔧 Technical Implementation

### **Mode Button Rendering:**
```typescript
// From promptTemplates.ts
export const MODE_LABELS: Record<Mode, string> = {
  'simple': 'Simple',
  'student': 'Student',
  'beginner-code': 'Beginner Code',
  'interview': 'Interview',
  'summary': 'Summary',
};

export const ALL_MODES: Mode[] = ['simple', 'student', 'beginner-code', 'interview', 'summary'];

// In content.ts, lines 103-107
${ALL_MODES.map(m => `
  <button class="mode ${m === activeMode ? 'active' : ''}" data-mode="${m}">
    ${MODE_LABELS[m]}
  </button>
`).join('')}
```

### **Content Rendering:**
```typescript
// In content.ts, lines 109-116
<div id="explainx-body">
  ${explanation
    ? marked.parse(explanation)  // AI response → HTML
    : '...loading...'
  }
</div>
```

---

## ✅ Verification Checklist

### **Mode Selector (UI):**
- [x] Located in `.explainx-modes` container
- [x] Renders as `<button>` elements
- [x] Shows all 5 modes (Simple, Student, Code, Interview, Summary)
- [x] Active mode highlighted with `.active` class
- [x] Clickable to switch modes
- [x] Triggers RE_EXPLAIN message
- [x] Separate from content area

### **Content Headings (AI):**
- [x] Located in `#explainx-body` container
- [x] Renders as `<h1>`, `<h2>`, `<h3>`, etc.
- [x] Structure determined by AI response
- [x] Uses markdown ## syntax from AI
- [x] No extra headers added
- [x] No modifications to AI content
- [x] Pure `marked.parse()` rendering

---

## 🎨 Styling Differences

### **Mode Buttons:**
```css
.mode {
  background: #f1f3f4;        /* Gray background */
  padding: 4px 10px;          /* Small pill shape */
  border-radius: 14px;        /* Rounded */
  font-size: 12px;            /* Small text */
  cursor: pointer;            /* Clickable */
}

.mode.active {
  background: #e8f0fe;        /* Blue background */
  color: #1a73e8;             /* Blue text */
  font-weight: 500;           /* Semi-bold */
}
```

### **Content Headings:**
```css
#explainx-body h2 {
  font-size: 16px;            /* Larger text */
  color: #1a73e8;             /* Blue color */
  font-weight: 600;           /* Bold */
  margin-top: 16px;           /* Spacing */
  margin-bottom: 8px;
}
```

**Visually distinct!** No confusion possible.

---

## 📝 Summary

### **Two Completely Different Elements:**

1. **Mode Selector Buttons** (UI)
   - What: Interactive navigation buttons
   - Where: `.explainx-modes` div
   - Source: Extension code
   - Purpose: Switch between explanation modes
   - HTML: `<button>` elements
   - Action: Triggers AI re-explanation

2. **Content Headings** (AI)
   - What: Section headers in explanation
   - Where: `#explainx-body` div
   - Source: AI model response
   - Purpose: Organize explanation content
   - HTML: `<h1>`, `<h2>`, `<h3>` elements
   - Action: Static text (part of content)

### **Implementation Status: ✅ CORRECT**

The current implementation **perfectly maintains this separation**:
- Mode buttons are UI controls
- Content headings are from AI
- No overlap, no confusion
- Clean, professional design

---

**Architecture Verified**: April 2026  
**Separation Status**: ✅ Production Ready  
**UI/Content Boundary**: Clear and Maintained
