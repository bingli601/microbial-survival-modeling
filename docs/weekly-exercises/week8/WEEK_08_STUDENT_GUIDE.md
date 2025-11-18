# Week 8 Student Guide: Polish & Performance

## 0. Recap: APIs & Week 7 Solution

For a recap of last week’s solution, see the **Week 7 Student Guide**. You learned how to connect your React app to an API, handle async data, and build a chat interface.

---

## Session Overview

| Time      | Topic                        | Activity/Goal                          |
|-----------|------------------------------|----------------------------------------|
| 0:00-0:10 | Welcome & Mindset            | Set professional standards, demo issues|
| 0:10-0:30 | Error Boundaries             | Break app, fix with ErrorBoundary      |
| 0:30-1:00 | Loading & Skeletons          | Audit, build skeletons, progressive UX |
| 1:00-1:30 | Performance Optimization     | Profile, memoize, code split, virtual  |
| 1:30-1:50 | Accessibility                | Semantic HTML, keyboard, screen reader |
| 1:50-2:00 | Wrap Up & Checklist          | Review, preview, assign homework       |

---

## Learning Objectives

By the end of this session, you will:
- Implement error boundaries and graceful error handling
- Create elegant loading states and skeleton screens
- Optimize performance with React best practices
- Build accessible and inclusive user interfaces
- Apply professional UX patterns and micro-interactions

---


## 1. Error Boundaries & Graceful Failures

### The Problem with Errors

Error boundaries are special React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the whole app.

**Why it matters:**
Without error boundaries, a single bug in any component can take down your entire app and ruin user trust. Error boundaries let you recover gracefully and keep the rest of your app running.

### Step-by-step Demo
1. **Use the provided broken components in `src/components/broken/BrokenExamples.tsx`:**
   - `BrokenNullProperty` (accesses property of null)
   - `BrokenArrayOutOfBounds` (accesses out-of-bounds array index)
   - `BrokenThrowError` (throws an error intentionally)
   - `BrokenRenderLoop` (causes a render loop)
   - `BrokenFailedFetch` (simulates a failed network request)

2. **In your app, render one of these directly:**
   ```tsx
   import { BrokenNullProperty, BrokenFailedFetch } from '@/components/broken/BrokenExamples';
   // ...
   <BrokenNullProperty />
   <BrokenFailedFetch />
   ```
   Show that the app crashes or shows a red error overlay. Try each broken example to see different error types.

3. **Now, create `ErrorBoundary.tsx` (show both class and function-based examples):**
   **Class-based (native React):**
   ```tsx
    import React from 'react';

    interface ErrorBoundaryState {
        hasError: boolean;
    }
    
    interface ErrorBoundaryProps {
        children: React.ReactNode;
    }

    class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
        constructor(props: ErrorBoundaryProps) { 
            super(props); 
            this.state = { hasError: false }; 
        }
        static getDerivedStateFromError() { return { hasError: true }; }
        render() {
            if (this.state.hasError) return <div> Something went wrong. </div>;
            return this.props.children;
        }
    }
    export default ErrorBoundary;
   ```

   **Function-based (using react-error-boundary):**
   > To use this, install the package:
   > ```sh
   > npm install react-error-boundary
   > ```
   ```tsx
   import { ErrorBoundary } from 'react-error-boundary';
   function ErrorFallback({ error }) {
     return <div>Something went wrong: {error.message}</div>;
   }
   // Usage:
   <ErrorBoundary FallbackComponent={ErrorFallback}>
     <BrokenNullProperty />
   </ErrorBoundary>
   ```
   **What is a Fallback Component?**
   A fallback component is what gets rendered when an error is caught by the error boundary. It should display a helpful message and optionally let the user retry or report the error. In the example above, `ErrorFallback` is the fallback component.

4. **What gets wrapped?**
   - You wrap only the part of your app that might break. For example:
   ```tsx
   import ErrorBoundary from '@/components/ErrorBoundary';
   import { BrokenNullProperty } from '@/components/broken/BrokenExamples';
   // ...
   <ErrorBoundary>
     <BrokenNullProperty />
   </ErrorBoundary>
   ```
   - Now, only the broken part is replaced with the fallback UI, and the rest of your app keeps working.
   - Try wrapping multiple broken components, or wrap a whole page to catch any errors in its children.

5. **Student Challenge:**
   - Render a broken component, then wrap it in ErrorBoundary and see the difference. Try wrapping different parts of your app to see what gets caught.

---


## 2. Loading Experience (Skeleton Screens)

### What are Skeleton Screens?
Skeleton screens are UI placeholders that mimic the layout and shape of the content that is being loaded. Instead of showing a generic "Loading..." message or spinner, skeletons give users a preview of what will appear, making the wait feel shorter and more predictable.

### Where and Why to Use Skeletons
- Use skeleton screens anywhere you fetch data or load content that takes more than a split second (e.g., API calls, images, charts).
- They are especially helpful for lists, cards, tables, or dashboards where the structure is known but the data is not yet available.
- Skeletons improve perceived performance by showing users the app is working and what to expect, reducing frustration and bounce rates.

### How to Implement Skeletons
1. **Use the provided loading example in `src/components/LoadingExample.tsx`:**
   ```tsx
   import LoadingExample from '@/components/LoadingExample';
   <LoadingExample />
   ```
   This component simulates a data fetch and shows a spinner and "Loading..." text, then displays the loaded data.

2. **For a more realistic UI, replace the loading state with a skeleton that matches the shape of your real content:**
   ```tsx
   if (loading) return <div className="animate-pulse bg-gray-200 h-6 w-32 rounded" />;
   ```
   You can use multiple skeletons to match the layout (e.g., for a list, render several skeleton rows).

   **Example Skeleton Row:**
   ```tsx
   function SkeletonRow() {
     return <div className="animate-pulse bg-gray-200 h-6 w-32 rounded mb-2" />;
   }

   {loading && (
     <div>
       {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
     </div>
   )}
   ```

3. **Customizing Your App**
   - Replace generic skeletons with shapes that match your real content (e.g., avatar, text, buttons)
   - Add your own data, features, and UI improvements
   - Make sure all interactive elements are accessible and error boundaries are used where needed

4. **What gets wrapped?**
   - You can wrap only the part of your app that is loading, or the whole page if needed.

5. **Student Challenge:**
   - Replace a "Loading..." in one component with a skeleton. Try to match the skeleton's shape to the real content (e.g., avatar, text, button shapes).

---

---


## 3. Performance (Memoization & Lazy Loading)

### Why does performance optimization matter?
- It saves work: React skips calculations and rendering when nothing has changed.
- Your app feels faster, especially with big lists or slow calculations.
- It’s like remembering the answer to a hard math problem so you don’t have to solve it again unless the numbers change.

### Step-by-step Demo
1. **Show a component that recalculates on every render:**
   ```tsx
   function ExpensiveComponent({ num }) {
     function slowDouble(n) {
       // Simulate expensive calculation
       for (let i = 0; i < 1e7; i++) {}
       return n * 2;
     }
     const doubled = slowDouble(num);
     return <div>Double: {doubled}</div>;
   }
   // Every render, slowDouble runs again.
   ```

2. **Wrap with useMemo:**
   ```tsx
   import { useMemo } from 'react';
   function ExpensiveComponent({ num }) {
     function slowDouble(n) {
       for (let i = 0; i < 1e7; i++) {}
       return n * 2;
     }
     const doubled = useMemo(() => slowDouble(num), [num]);
     return <div>Double: {doubled}</div>;
   }
   // Now, slowDouble only runs when num changes.
   ```

3. **For a big component, use React.memo:**
   ```tsx
   const ListItem = React.memo(function ListItem({ value }) {
     return <li>{value}</li>;
   });
   // ListItem only re-renders if its value prop changes.
   ```

4. **Lazy Loading and Code Splitting:**
   - Lazy loading means loading parts of your app only when they’re needed, not all at once. This makes your app start faster and saves bandwidth for users.
   - In React, you can lazy load components so that big or rarely-used parts of your UI are only loaded when the user actually needs them (for example, a settings page or a big chart).
   - **Example:**
   ```tsx
   import React, { Suspense } from 'react';
   const Big = React.lazy(() => import('./Big'));
   <Suspense fallback={<div>Loading...</div>}><Big /></Suspense>
   ```

5. **Virtual Scrolling for Large Data Sets:**
   - For very large datasets, implement virtual scrolling to only render visible rows.
   - **Example:**
   ```tsx
   import { FixedSizeList as List } from 'react-window';

   const VirtualizedDataTable = ({ data }) => {
     const Row = ({ index, style }) => (
       <div style={style} className="flex border-b">
         <div className="w-1/4 p-2">{data[index].name}</div>
         <div className="w-1/4 p-2">{data[index].value}</div>
         <div className="w-1/4 p-2">{data[index].date}</div>
         <div className="w-1/4 p-2">{data[index].category}</div>
       </div>
     );

     return (
       <List
         height={400}
         itemCount={data.length}
         itemSize={50}
         className="border rounded"
       >
         {Row}
       </List>
     );
   };
   ```

6. **Student Challenge:**
   - Memoize a calculation or lazy-load a component. Try wrapping a component with React.memo and see when it re-renders.

---

---


## 4. Accessibility (Keyboard, Screen Reader, and More)

### What is Accessibility?
Accessibility (often abbreviated as a11y) means designing and building software so that people with disabilities can use it. This includes users who rely on screen readers, keyboard navigation, voice control, or other assistive technologies.

### Why it matters
Accessibility is a legal, ethical, and UX requirement. It ensures your app is usable by everyone, regardless of ability, and often improves usability for all users.

### Technical Aspects (Simplified)
- Use the right HTML tags (like `<button>`, `<nav>`, `<main>`) so assistive tech understands your UI.
- Make sure everything you can click or type into works with just the keyboard (Tab, Enter, Space).
- Add helpful labels (like `aria-label`) if something isn’t clear to a screen reader.
- Check that text and buttons are easy to read (good color contrast).

### How to Test Accessibility
- Use browser accessibility inspectors (Chrome DevTools, Firefox Accessibility panel)
- Try navigating your app with only the keyboard (Tab, Shift+Tab, Enter, Space)
- Use a screen reader (VoiceOver on Mac, NVDA or JAWS on Windows)
- Online tools: [axe DevTools](https://www.deque.com/axe/devtools/), [WAVE](https://wave.webaim.org/), [Lighthouse](https://developer.chrome.com/docs/lighthouse/accessibility/)

### Step-by-step Demo
1. **Semantic HTML and ARIA:**
   - Use semantic tags and ARIA attributes for clarity and accessibility.
   - **Example:**
   ```tsx
   // ❌ Poor semantics
   <div onClick={handleClick}>Submit</div>
   <div>
     <div>Chart showing data trends</div>
     <div>{/* Chart content */}</div>
   </div>

   // ✅ Proper semantics
   <button onClick={handleClick} aria-label="Submit data for analysis">
     Submit
   </button>
   <section aria-labelledby="chart-title">
     <h2 id="chart-title">Chart showing data trends</h2>
     <div role="img" aria-label="Bar chart showing upward trend in sales data">
       {/* Chart content */}
     </div>
   </section>
   ```

2. **Keyboard Navigation:**
   - Ensure all interactive elements are keyboard accessible.
   - **Example:**
   ```tsx
   const DataTable = ({ data }) => {
     const [selectedRow, setSelectedRow] = useState(0);

     const handleKeyDown = (e) => {
       switch (e.key) {
         case 'ArrowDown':
           e.preventDefault();
           setSelectedRow(prev => Math.min(prev + 1, data.length - 1));
           break;
         case 'ArrowUp':
           e.preventDefault();
           setSelectedRow(prev => Math.max(prev - 1, 0));
           break;
         case 'Enter':
           e.preventDefault();
           handleRowAction(selectedRow);
           break;
       }
     };

     return (
       <table role="table" aria-label="Data analysis results">
         <thead>
           <tr>
             <th scope="col">Name</th>
             <th scope="col">Value</th>
             <th scope="col">Actions</th>
           </tr>
         </thead>
         <tbody onKeyDown={handleKeyDown} tabIndex={0}>
           {data.map((row, index) => (
             <tr 
               key={row.id}
               aria-selected={selectedRow === index}
               className={selectedRow === index ? 'bg-blue-100' : ''}
             >
               <td>{row.name}</td>
               <td>{row.value}</td>
               <td>
                 <button 
                   aria-label={`Edit ${row.name}`}
                   onClick={() => handleEdit(row.id)}
                 >
                   Edit
                 </button>
               </td>
             </tr>
           ))}
         </tbody>
       </table>
     );
   };
   ```

3. **Screen Reader Support:**
   - Provide meaningful descriptions for screen readers.
   - **Example:**
   ```tsx
   const ChartSection = ({ data, loading }) => {
     const chartDescription = useMemo(() => {
       if (!data.length) return "No data available";
       const values = data.map(d => d.value);
       const max = Math.max(...values);
       const min = Math.min(...values);
       const avg = values.reduce((a, b) => a + b, 0) / values.length;
       return `Chart displays ${data.length} data points. Values range from ${min} to ${max}, with an average of ${avg.toFixed(1)}. The overall trend shows ${avg > values[0] ? 'an increase' : 'a decrease'} over time.`;
     }, [data]);

     if (loading) {
       return (
         <div role="status" aria-live="polite">
           <span className="sr-only">Loading chart data...</span>
           <ChartSkeleton />
         </div>
       );
     }

     return (
       <section aria-labelledby="chart-title">
         <h2 id="chart-title">Data Visualization</h2>
         <div 
           role="img" 
           aria-label={chartDescription}
           aria-describedby="chart-description"
         >
           <Chart data={data} />
         </div>
         <p id="chart-description" className="sr-only">
           {chartDescription}
         </p>
       </section>
     );
   };
   ```


4. **Accessible Button Example:**
   ```tsx
   <button aria-label="Submit data" onClick={handleSubmit}>
     <span aria-hidden="true">🚀</span> Submit
   </button>
   ```

### Making a Custom Button Keyboard Accessible (Tab Navigation)

**Why?**
Not all interactive elements are accessible by default. Native `<button>` elements are, but custom elements like `<div>` are not. Keyboard users (and screen readers) need to be able to reach and activate all controls.

**How to do it:**

1. **Add `tabIndex={0}`**
   - Makes the element focusable by Tab.
   ```tsx
   <div tabIndex={0} onClick={handleSubmit}>Submit</div>
   ```

2. **Add `role="button"`**
   - Announces the element as a button to screen readers.
   ```tsx
   <div role="button" tabIndex={0} onClick={handleSubmit}>Submit</div>
   ```

3. **Add Keyboard Event Handling**
   - Native buttons activate on Enter or Space. Add this behavior:
   ```tsx
   <div
     role="button"
     tabIndex={0}
     onClick={handleSubmit}
     onKeyDown={e => {
       if (e.key === 'Enter' || e.key === ' ') handleSubmit();
     }}
   >
     Submit
   </div>
   ```

4. **Add an ARIA Label (Optional)**
   - If the button’s purpose isn’t clear, add `aria-label`:
   ```tsx
   <div
     role="button"
     tabIndex={0}
     onClick={handleSubmit}
     onKeyDown={e => {
       if (e.key === 'Enter' || e.key === ' ') handleSubmit();
     }}
     aria-label="Submit form"
   >
     <span aria-hidden="true">🚀</span> Submit
   </div>
   ```

**Test:**
- Tab to the button. It should receive focus.
- Press Enter or Space. The handler should run.
- Try a screen reader: it should announce "button, Submit form."

**Best Practice:**
- Use `<button>` whenever possible. If you must use a custom element, always add `tabIndex`, `role`, keyboard handlers, and ARIA labels.

5. **Student Challenge:**
   - Make one button or table keyboard and screen reader accessible. Try using a screen reader or keyboard navigation to test your work.

---

## 5. Putting It All Together: Practical Example

Here’s a component that combines skeleton loading, useMemo, and accessibility:

```tsx
import React, { useState, useEffect, useMemo } from 'react';

function DemoList({ items }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setData(items);
      setLoading(false);
    }, 1200);
  }, [items]);

  if (loading) {
    return (
      <ul aria-busy="true" aria-label="Loading list">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="animate-pulse bg-gray-200 h-6 w-32 rounded mb-2" aria-hidden="true" />
        ))}
      </ul>
    );
  }

  const renderedList = useMemo(() =>
    data.map((item, idx) => (
      <li
        key={idx}
        tabIndex={0}
        aria-label={`Item ${item}`}
        className="focus:outline focus:ring-2 focus:ring-blue-500"
      >
        {item}
      </li>
    )),
    [data]
  );

  return (
    <ul aria-label="Loaded list">{renderedList}</ul>
  );
}

// Usage:
// <DemoList items={["Apple", "Banana", "Cherry", "Date", "Elderberry"]} />
```

---

## 6. Wrap-Up: Professional App Checklist

- [ ] Error boundaries prevent crashes
- [ ] Skeleton screens for loading
- [ ] Memoization/lazy loading for performance
- [ ] Keyboard and screen reader accessibility

---

## Homework
- Run axe-core and fix at least 3 accessibility issues
- Implement dark mode and verify contrast ratios

---

## Troubleshooting & Tips

- If error boundaries aren’t catching errors, check if the error is inside an event handler or useEffect (these need manual try/catch).
- Always include all dependencies in useMemo/useCallback.
- Use semantic HTML and ARIA attributes for accessibility.
- Test your app with keyboard and screen reader tools.

---

**Keep building! These patterns are what make your apps feel professional and ready for real users.**
