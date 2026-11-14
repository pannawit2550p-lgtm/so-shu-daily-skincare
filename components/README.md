# UI components

Page sections are native custom elements. Each section keeps its markup and styles together in matching `.js` and `.css` files:

- status-bar.js
- lookbook-stage.js
- dock.js
- look-controls.js
- focus-view.js
- product-slip.js
- story-section.js
- product-ritual.js

The section styles live in matching files, including `story-section.css` and `product-ritual.css`. `styles.css` owns global tokens, reset rules, shared primitives, and the page shell.

Reusable pieces used inside those sections live alongside them:

- product-line.js composes the item row and size-picker.js.
- price-card.js renders the subtotal, discount, and total card.
- look-model.js renders repeated lookbook entries.
- toast.js owns the toast behavior.

The matching component styles are in the `.css` files. `script.js` coordinates interaction and shared page state. `catalog.js` is a JSON-backed adapter. It reads normalized product records from `data/products.json`, resolves the look references in `data/looks.json`, and exposes `loadLooks()`, `listProducts()`, `getProduct(productId)`, and `checkAvailability(productId, variantId)`.

Products have stable IDs and variant IDs. Look records store product IDs rather than copied product details, so receipt lines, lookbook items, and product cards resolve to the same product record. For a backend, keep this adapter interface and replace its JSON reads with API calls; stock checks should return `null` while untracked or `{ available, quantity }` when inventory is connected. See `data/README.md` for the JSON record shape.

`cart-api.js` calls the server cart/order endpoints. `cart-drawer.js` provides the accessible bag and checkout dialog; the server persists guest carts and order snapshots in SQLite. Order status stays pending confirmation while inventory and payment are unconfigured.

The component scripts are loaded from index.html before script.js; keep that order when adding another component. Ring imagery is sourced from catalog items with an `image` field, so the catalog remains the source of truth for products shown in the orbit. Run `npm start` from the project root to serve the JSON files over HTTP.
