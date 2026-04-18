# Design System Strategy: Industrial Intelligence

## 1. Overview & Creative North Star
**Creative North Star: The Kinetic Command Center**

This design system is not a static interface; it is a high-precision instrument. It moves away from "generic SaaS" by adopting an aesthetic of **Industrial Intelligence**. The goal is to make the user feel like they are operating a multi-million dollar piece of hardware through a glass interface.

We achieve this through **Organic Brutalism**: the rigid, mathematical precision of industrial grids softened by sophisticated tonal layering and "glass" depth. We break the template look by using intentional asymmetry—heavy left-aligned typography scales contrasted with technical data visualizations on the right—and by treating the screen as a physical, illuminated control surface rather than a flat web page.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the "Foundri Dark" spectrum, moving from the depth of a factory floor to the illuminated glow of a digital readout.

### The Color Tokens
*   **Background (Deep Base):** `#111317` (Surface)
*   **The Accents:**
    *   **Primary (Intelligence):** `#F6C945` (Foundri Yellow). Use this strictly for "High-Intelligence" moments: AI insights, critical status changes, or primary calls to action.
    *   **Secondary (Data Flow):** `#3B82F6` (Electric Blue). Use for active states, data streams, and technical links.
*   **The Tonal Tiers:**
    *   `surface_container_lowest`: `#0C0E12` (Used for "inset" areas or deep background wells)
    *   `surface_container_low`: `#1A1C20` (Standard workspace background)
    *   `surface_container_high`: `#282A2E` (Standard card/module surface)
    *   `surface_container_highest`: `#333539` (Elevated overlays or hover states)

### The "No-Line" Rule
Standard 1px borders are prohibited for sectioning. Structural definition must be achieved through **background color shifts**. To separate a sidebar from a main content area, place a `surface_container_low` panel against a `surface` background. If you feel a "need" for a line, use a 24px-32px margin of empty space instead.

### Glass & Gradient Soul
To prevent the UI from feeling "dead," use semi-transparent surfaces for floating command panels. Use `surface_container_high` at 80% opacity with a `20px` backdrop-blur. 
*   **Signature Texture:** Primary CTAs should not be flat. Apply a subtle linear gradient from `primary` (`#F6C945`) to `primary_fixed_dim` (`#EEC13E`) at a 135-degree angle to give the button "weight."

---

## 3. Typography: The Editorial Tech Scale
We pair the mechanical, wide-set nature of **Space Grotesk** with the utilitarian clarity of **Inter**.

*   **Display & Headlines (Space Grotesk):** These are your "Industrial Marks." Use `display-lg` (3.5rem) for hero data points. Headlines should feel authoritative and slightly "oversized" compared to the content below them to create a sense of hierarchy.
*   **Body & Labels (Inter):** The "Operator's Manual." Inter handles all functional reading. Use `label-sm` (0.6875rem) in all-caps with `0.05em` letter-spacing for technical metadata and table headers to mimic blueprint annotations.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, height is expressed through light and shade, not lines.

*   **The Layering Principle:** Treat the UI as stacked sheets of material. A `surface_container_lowest` area feels "milled out" of the interface, while a `surface_container_highest` card feels like it has been "placed on top."
*   **Ambient Shadows:** Use shadows only for temporary floating elements (modals/dropdowns). 
    *   *Shadow Profile:* `0px 12px 32px rgba(0, 0, 0, 0.4)`. The shadow must feel like it is an occlusion of ambient light, never a harsh drop shadow.
*   **The Ghost Border:** If a container requires a border for accessibility (e.g., in a complex grid of cards), use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
*   **Industrial Grid:** All layouts must snap to an 8px grid. Asymmetry should be intentional—for example, a 3-column layout where the left column is 2x wider than the others to host a large "Command Headline."

---

## 5. Components

### Buttons (Tactile Controls)
*   **Primary:** Foundri Yellow (`#F6C945`) background, Deep Carbon (`#0F1115`) text. Corner radius: `0.25rem` (sm).
*   **Secondary:** Ghost style. `outline_variant` at 20% opacity border, White text.
*   **Interaction:** On hover, the Primary button should "glow" using a subtle outer shadow of the same color (`rgba(246, 201, 69, 0.3)`).

### Input Fields (Command Entry)
*   **Style:** Background-filled (`surface_container_highest`), no border, bottom-aligned labels.
*   **Focus State:** A 2px solid left-border in `secondary` (Electric Blue) to indicate the "active line," mimicking a terminal cursor.

### Cards & Modules
*   **Rule:** Forbid divider lines within cards. Use `body-sm` text in `secondary` color to act as a header, and use vertical spacing (16px–24px) to separate groups of information.
*   **Header:** Every card should have a "technical ID" in the top right corner (e.g., `REF_0042`) in `label-sm` to reinforce the industrial aesthetic.

### Additional Component: The "Intelligence Rail"
A vertical or horizontal bar that appears only when AI insights are present. It uses a `primary` (Yellow) to `transparent` gradient border (1px) and houses high-level summaries in `Space Grotesk`.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use 1.5px stroke weights for all icons. Anything thinner feels too "consumer," anything thicker feels too "playful."
*   **Do** use high-contrast typography scales (e.g., a very large Title next to very small Metadata).
*   **Do** lean into "Command Center" layouts—dense information density handled through clear grouping and wide gutters.

### Don’t:
*   **Don’t** use rounded corners above `0.75rem` (xl). This system is precision-engineered, not "bubbly."
*   **Don’t** use yellow for everything. If more than 5% of your screen is yellow, you are losing the "Intelligence" signal.
*   **Don’t** use pure black `#000000`. Use the `surface` palette to maintain depth and prevent eye strain.
*   **Don’t** use standard 1px grey dividers. If you can't separate content with color tiers or space, reconsider the layout.