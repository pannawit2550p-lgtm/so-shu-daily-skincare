# Catalog JSON

`products.json` is the mock product table. Each product has a stable `id`, a `slug`, a `category`, a `price` with an ISO currency code, a primary image path, and `variants`. Variants have their own stable IDs and SKUs; inventory should be tracked by variant ID when it is added.

`looks.json` stores lookbook records and references products through `productIds`. It does not copy product names or prices. This keeps the receipt, lookbook, and skincare cards connected to the same product records.

`catalog.js` adapts these files into the small interface used by the UI. Cart and order APIs read the same records on the server, so the server recalculates prices instead of trusting totals sent by the browser. Inventory is currently untracked; orders are stored as pending confirmation and no payment is processed. An inventory API can implement `checkAvailability(productId, variantId)` and return `{ "available": true, "quantity": 12 }` when stock is connected.

Increase `schemaVersion` when changing the JSON structure in a way the adapter cannot read compatibly.
