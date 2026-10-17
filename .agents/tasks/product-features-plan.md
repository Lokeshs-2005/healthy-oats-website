# Implementation Plan: Product Features Enhancement

## Overview
This plan addresses cleanup of removed category/addon features, adds multiple product images, implements quantity-based pricing tiers, and enables dual-admin email notifications.

## Context
- Project: React + Vite client with Express backend
- Build: `npm run build:client` for client, no build needed for server
- Test: `npm run test:client` (vitest) and `npm run test:server` (jest)
- Dev: `npm run dev` runs both client (port 5173) and server (port 5000) concurrently
- The ADMIN_EMAILS environment variable is already configured in .env with two email addresses

---

## Implementation Steps

- [ ] 1. **Fix AdminDashboard to remove category/addon references**
      
      The dashboard currently calls `publicApi.getCategories()` and `publicApi.getAddOns()` which don't exist in api.js. Remove these API calls from loadStats, remove the categories and addons stat cards from the statCards array, and remove the "Manage Categories" and "Manage Add-ons" quick action buttons.
      
      **Files:** `client/src/admin/pages/AdminDashboard.jsx`
      
      **Verify:** Run `cd client && npm run dev` and navigate to admin dashboard at http://localhost:5173/admin - confirm no console errors about missing API methods and that only product-related stats and actions are shown.

---

- [ ] 2. **Add additional images field to product schema**
      
      Update the `sanitizeProduct` function in productService.js to include an `additionalImages` field (array of strings). Each URL should be validated: trim to max 500 chars, and ensure it's a valid string. The field should be optional and default to an empty array if not provided.
      
      **Files:** `server/src/services/productService.js`
      
      **Verify:** Start server with `cd server && npm run dev` - server should start without errors. Test by creating/updating a product via admin panel.

---

- [ ] 3. **Add pricing tiers field to product schema**
      
      Update the `sanitizeProduct` function to include a `pricingTiers` field (array of objects with `quantity` string and `price` number). Validate that each tier has both fields, price is a positive number, and quantity is a non-empty string. The field should be optional and default to an empty array. Keep the existing `basePrice` field for backward compatibility.
      
      **Files:** `server/src/services/productService.js`
      
      **Verify:** Server restart should succeed without errors. The schema change will be tested when the form is updated in the next step.

---

- [ ] 4. **Update ProductFormModal to support additional images**
      
      Add a section below the main product image for "Additional Images". Include a dynamic list where admins can add/remove image URL text inputs. Each input should accept a URL string. Add "+Add Image" and "Remove" buttons for managing the list. Store these in formData.additionalImages array and submit with the product data.
      
      **Files:** `client/src/admin/components/ProductFormModal.jsx`
      
      **Verify:** Run `npm run dev`, go to admin products page, open add/edit product modal - confirm additional images section appears and allows adding/removing URL inputs. Test saving a product with additional images.

---

- [ ] 5. **Update ProductFormModal to support pricing tiers**
      
      Add a "Pricing Tiers" section after the base price field. Each tier row should have two inputs: quantity (text, e.g., "250g", "500g") and price (number). Include "+ Add Tier" button to add new rows and a remove button for each row. Store in formData.pricingTiers array. The base price field remains for backward compatibility and products without tiers.
      
      **Files:** `client/src/admin/components/ProductFormModal.jsx`
      
      **Verify:** In admin modal, confirm pricing tiers section appears with ability to add/remove tiers. Save a product with 2-3 pricing tiers and verify it saves correctly by reopening the modal.

---

- [ ] 6. **Update ProductDetailPage to display additional images**
      
      Below the main product image, display additional images as clickable thumbnails in a horizontal row. When a thumbnail is clicked, swap it with the main image. Keep the implementation simple - just small thumbnail images (e.g., 80x80px) with onClick handlers. Only show the thumbnail gallery if additionalImages array exists and has items.
      
      **Files:** `client/src/pages/ProductDetailPage.jsx`
      
      **Verify:** Navigate to a product detail page with additional images - confirm thumbnails appear below main image and clicking them swaps with the main display image.

---

- [ ] 7. **Update ProductDetailPage to support pricing tier selection**
      
      If product has pricingTiers array with items, display a dropdown/select for choosing quantity/size instead of showing just the base price. The selected tier's price should update the displayed price dynamically. When adding to cart, pass the selected tier's quantity and price. If no pricing tiers exist, fall back to using basePrice as before.
      
      **Files:** `client/src/pages/ProductDetailPage.jsx`
      
      **Verify:** View a product with pricing tiers - confirm selector appears, price updates when selection changes, and "Buy Now" button shows the correct selected price.

---

- [ ] 8. **Update MenuPage ProductCard to display pricing tiers**
      
      In the ProductCard component, if product has pricingTiers array with items, display "from ₹X" where X is the lowest tier price. When adding to cart from the menu, use the first/lowest tier's price and quantity. If no tiers, show basePrice as before.
      
      **Files:** `client/src/pages/MenuPage.jsx`
      
      **Verify:** Navigate to menu page - products with pricing tiers should show "from ₹X" instead of a single price. Click "Add to Cart" and verify it adds the correct tier to cart.

---

- [ ] 9. **Update CartContext to handle products with pricing tiers**
      
      Modify `getCartItemId` to include the selected tier quantity when a product has tiers (e.g., `productId:250g` vs `productId:500g` should be separate cart entries). Update `addToCart` to accept and store `selectedQuantity` (tier quantity label like "250g") and `selectedPrice` on cart items. Update `getItemUnitPrice` to use `selectedPrice` if present, otherwise fall back to `basePrice`.
      
      **Files:** `client/src/contexts/CartContext.jsx`
      
      **Verify:** Add same product with different tiers to cart - they should appear as separate cart items. Check cart total calculation is correct using the selected tier prices.

---

- [ ] 10. **Update CartPage to display selected quantity tier**
      
      In the CartItem component, display the selectedQuantity (e.g., "250g") next to the product name if it exists. This helps users distinguish between different tiers of the same product in their cart.
      
      **Files:** `client/src/pages/CartPage.jsx`
      
      **Verify:** Add products with different tiers to cart, navigate to cart page - confirm tier quantities are displayed next to product names (e.g., "Banana Oats - 250g").

---

- [ ] 11. **Update CheckoutPage to display selected quantity tier**
      
      In the order summary section, display selectedQuantity alongside the product name if it exists. This ensures the checkout page clearly shows which tier/quantity the customer is purchasing.
      
      **Files:** `client/src/pages/CheckoutPage.jsx`
      
      **Verify:** Proceed to checkout with tiered products - confirm order summary shows tier quantities. Complete a test order (can use COD) and verify order placement works correctly.

---

- [ ] 12. **Update email service to support multiple admin emails**
      
      Modify `sendAdminOrderNotification` in emailService.js to read `process.env.ADMIN_EMAILS` (already configured as "healthyoatsgg@gmail.com,gg0304897@gmail.com" in .env), split by comma, trim whitespace, and send to all admin emails. Nodemailer's `to` field accepts comma-separated strings or arrays. Keep the existing fallback to `settings.businessEmail || fromEmail` if ADMIN_EMAILS is not set.
      
      **Files:** `server/src/services/emailService.js`
      
      **Verify:** Place a test order and check that admin notification emails are sent to both email addresses specified in ADMIN_EMAILS. Check server logs for email sending confirmation or errors.

---

- [ ] 13. **End-to-end verification**
      
      Run both client and server together, test the complete flow: create a product with additional images and pricing tiers in admin panel, view it on menu page, select a tier and add to cart, proceed through checkout, place an order. Verify all features work correctly including the dual-admin email notification.
      
      **Files:** None (testing only)
      
      **Verify:** Run `npm run dev` from project root, complete a full order flow with new features, confirm: additional images display, pricing tiers work, cart handles tiers correctly, checkout shows tiers, emails sent to both admins.

---

## Design Decisions

### Multiple Images Implementation
**Decision:** Use simple text URL inputs in the admin form rather than file uploads for additional images.

**Rationale:** The existing product form already uses URL inputs for the main image (with an optional upload button that generates a URL). Keeping additional images as URL inputs maintains consistency, simplifies the implementation, and avoids complications with multiple file uploads. Admins can still use the main image uploader separately and paste the generated URLs.

### Pricing Tiers Structure
**Decision:** Store pricing tiers as `[{quantity: string, price: number}]` and keep the existing `basePrice` field.

**Rationale:** Using a string for quantity (rather than a number) allows flexible descriptions like "250g", "500g", "1kg" that are more user-friendly than numeric IDs. Keeping basePrice ensures backward compatibility with existing products and provides a fallback. Products without pricing tiers continue to work exactly as before.

### Cart Item Identification
**Decision:** Include the selected tier quantity in the cart item ID (e.g., `productId:250g`).

**Rationale:** Different tiers of the same product should be separate cart items since they have different prices. This allows users to order multiple sizes of the same product in one order. The alternative (storing tier selection on a single cart item) would be more complex and confusing when users want different quantities of different tiers.

### Tier Display on Menu Page
**Decision:** Show "from ₹X" for products with pricing tiers, using the lowest price.

**Rationale:** This pattern is familiar from e-commerce sites and clearly indicates variable pricing without cluttering the compact product card. When adding to cart from the menu page, we use the first/lowest tier as a sensible default - users can adjust on the product detail page if needed.

### Admin Email Implementation
**Decision:** Use environment variable `ADMIN_EMAILS` as comma-separated list, falling back to existing `settings.businessEmail`.

**Rationale:** The .env file already has the correct structure with both admin emails. Using an environment variable is simpler than adding database configuration for this feature. The fallback ensures the system continues to work if ADMIN_EMAILS is not configured, maintaining backward compatibility.

