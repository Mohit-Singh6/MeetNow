Below is a **complete but compact Flexbox revision** — **what each property does, when to use it, and a small example**.
Read it once and you’ll stop guessing flex behavior.

---

# FLEXBOX = 2 levels

1. **Flex container properties** (parent)
2. **Flex item properties** (children)

---

## 1️⃣ Flex container properties

### `display: flex`

Turns an element into a flex container.

```css
.container {
  display: flex;
}
```

Without this → nothing works.

---

### `flex-direction`

**Main axis direction**.

```css
flex-direction: row;        /* default */
flex-direction: column;
flex-direction: row-reverse;
flex-direction: column-reverse;
```

**Use when:**
You want items laid horizontally vs vertically.

---

### `flex-wrap`

Controls wrapping.

```css
flex-wrap: nowrap;  /* default */
flex-wrap: wrap;
flex-wrap: wrap-reverse;
```

**Use when:**
Items should move to next line instead of shrinking.

---

### `flex-flow` (shorthand)

```css
flex-flow: row wrap;
```

= `flex-direction + flex-wrap`

---

### `justify-content`

Alignment **along main axis**.

```css
justify-content: flex-start;
justify-content: center;
justify-content: flex-end;
justify-content: space-between;
justify-content: space-around;
justify-content: space-evenly;
```

**Use when:**
Spacing or positioning items horizontally (row) or vertically (column).

---

### `align-items`

Alignment **along cross axis** (single line).

```css
align-items: stretch; /* default */
align-items: flex-start;
align-items: center;
align-items: flex-end;
align-items: baseline;
```

**Use when:**
You want vertical alignment in a row layout.

---

### `align-content`

Alignment of **multiple rows/columns** (only works if wrapped).

```css
align-content: flex-start;
align-content: center;
align-content: space-between;
```

❗ Does **nothing** if there is only one row.

---

### Container example

```css
.container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
```

---

## 2️⃣ Flex item properties

### `flex-grow`

How much item grows relative to others.

```css
.item {
  flex-grow: 1;
}
```

**Use when:**
You want items to fill available space.

---

### `flex-shrink`

How much item shrinks when space is tight.

```css
.item {
  flex-shrink: 0;
}
```

**Use when:**
You want to prevent shrinking.

---

### `flex-basis`

Initial size **before** grow/shrink.

```css
.item {
  flex-basis: 200px;
}
```

Acts like width (row) or height (column).

---

### `flex` (shorthand — VERY IMPORTANT)

```css
flex: 1;           /* grow=1 shrink=1 basis=0 */
flex: 0 0 200px;
flex: 1 0 auto;
```

**Most used values:**

```css
flex: 1;       /* equal-width columns */
flex: none;    /* fixed-size item */
```

---

### `align-self`

Override `align-items` for **one item**.

```css
.item {
  align-self: flex-end;
}
```

**Use when:**
One item needs different vertical alignment.

---

### `order`

Change visual order (not DOM order).

```css
.item {
  order: 2;
}
```

Lower order appears first.

---

## 3️⃣ Mental model (THIS matters)

* **Main axis** → `flex-direction`
* **Main-axis alignment** → `justify-content`
* **Cross-axis alignment** → `align-items`
* **Item sizing** → `flex-grow / shrink / basis`

---

## 4️⃣ Common real patterns

### Equal-width columns

```css
.item {
  flex: 1;
}
```

---

### Center something perfectly

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

---

### Navbar layout

```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

---

### Prevent item shrinking

```css
.item {
  flex-shrink: 0;
}
```

---

## 5️⃣ What NOT to confuse

| Property          | Axis                    |
| ----------------- | ----------------------- |
| `justify-content` | main                    |
| `align-items`     | cross                   |
| `align-content`   | cross (multi-line only) |

---

## One-line truth

> **Flexbox is about axis control: direction → alignment → space distribution.**

If you want next:

* **Flexbox vs Grid**
* **Why `align-content` “does nothing”**
* **Flexbox interview traps**

Just say which.
