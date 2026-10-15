# Implementation Plan: Healthy Oats E-commerce Improvements

**Project:** Healthy Oats Website Audit & Bug Fixing  
**Generated:** January 2025  
**Total Issues:** 62 identified  
**Estimated Duration:** 20-25 days (1 developer, full-time)

---

## Priority Classification

Issues are organized into four priority levels based on security risk, customer impact, and business criticality:

1. **Critical (P0)** — Security vulnerabilities, broken core features, data integrity risks → Fix immediately before any launch
2. **High (P1)** — Broken functionality, poor UX on core journeys, missing validations → Fix before marketing/promotion
3. **Medium (P2)** — UI/UX improvements, accessibility, minor bugs → Fix in first post-launch iteration
4. **Low (P3)** — Code quality, optional enhancements, nice-to-haves → Fix based on capacity and user feedback

---

## PRIORITY 0: CRITICAL ISSUES (Must fix before launch)

### SEC-001: Fix admin access control vulnerability
**Audit Issue:** SEC-001  
**Files:** `server/src/middleware/auth.js`  
**Problem:** If `ADMIN_EMAILS` environment variable is empty string, the allowlist check passes for any authenticated Firebase user, granting unauthorized admin access.  
**Fix:**
1. In `auth.js` line 19, before checking email against allowlist, validate that allowlist is not empty:
   ```js
   if (allowlist.length === 0) {
     return res.status(403).json({ error: 'Admin access not configured' })
   }
   ```
2. Add startup validation in `server/src/index.js` that checks `process.env.ADMIN_EMAILS` is set and contains at least one email address
3. Add test case for empty allowlist scenario

**Verification:** 
- Start server without ADMIN_EMAILS env var → Should log error and refuse to start
- Start server with ADMIN_EMAILS="" → Should refuse to start
- Authenticate with Firebase user not in allowlist → Should return 403
- Run `npm run dev` and attempt admin login with non-allowlisted email → Verify 403 response

---

### FUNC-001: Add missing hero image or implement fallback
**Audit Issue:** FUNC-001, UX-001  
**Files:** `client/public/heroImage.png`, `client/src/pages/HomePage.jsx`  
**Problem:** Homepage references `/heroImage.png` which does not exist in `client/public/`, causing broken image display and poor first impression.  
**Fix:**
1. **Option A (Quick Fix):** Create a default hero image (1000×1000px, showing oatmeal bowl with fruits) and save as `client/public/heroImage.png`
2. **Option B (Better UX):** Update HomePage.jsx to check if image loads; if not, show gradient background with text overlay:
   ```jsx
   const [imageLoaded, setImageLoaded] = useState(false)
   <img 
     src="/heroImage.png" 
     onLoad={() => setImageLoaded(true)}
     onError={() => setImageLoaded(false)}
     style={{ display: imageLoaded ? 'block' : 'none' }}
   />
   {!imageLoaded && <div className="bg-gradient-to-br from-sage-green to-warm-orange aspect-square flex items-center justify-center text-9xl">🥣</div>}
   ```
3. Document in README.md: "Replace `/client/public/heroImage.png` with your brand's hero image (recommended 1200×1200px)"

**Verification:**
- Delete `/client/public/heroImage.png` and run `npm run dev` → Homepage should show fallback, not broken image icon
- Add hero image back → Homepage should show actual image
- Test on mobile, tablet, desktop → Image scales correctly

---

### FUNC-002: Add UPI QR code image or implement dynamic generation
**Audit Issue:** FUNC-002  
**Files:** `client/public/upi-qr-code.png`, `client/src/pages/UpiPaymentPage.jsx`  
**Problem:** UPI payment page references `/upi-qr-code.png` which does not exist; QR code fallback shows placeholder text but confuses customers.  
**Fix:**
1. **Option A (Manual QR):** Generate UPI QR code using online tool (e.g., paytm.me/qr-code, phonepe QR generator) for the UPI ID in constants.js, save as `client/public/upi-qr-code.png`
2. **Option B (Dynamic QR):** Add QR code generation library:
   ```bash
   cd client && npm install qrcode.react
   ```
   Update UpiPaymentPage.jsx:
   ```jsx
   import { QRCodeCanvas } from 'qrcode.react'
   
   const upiString = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.upiPayeeName)}&am=${checkoutData.total}&cu=INR`
   <QRCodeCanvas value={upiString} size={256} />
   ```
3. Document in README.md: "UPI QR code is generated dynamically based on order amount and UPI ID in site settings"

**Verification:**
- Navigate to `/payment/upi` after adding item to cart and filling checkout form → QR code displays
- Scan QR code with PhonePe/Google Pay → Payment app opens with correct amount and payee name
- Test with different order amounts → QR code updates correctly

---

### DATA-001: Prevent product deletion if product is in pending orders
**Audit Issue:** DATA-001  
**Files:** `server/src/services/productService.js`  
**Problem:** Admin can delete a product that's in pending orders, causing orphaned references and broken order data.  
**Fix:**
1. In `productService.delete()`, before deleting product, check if product exists in any order with status NOT in ['delivered', 'cancelled']:
   ```js
   const ordersSnapshot = await db.collection('orders')
     .where('items', 'array-contains', { productId: id })
     .get()
   const pendingOrders = ordersSnapshot.docs
     .map(doc => doc.data())
     .filter(order => !['delivered', 'cancelled'].includes(order.status))
   
   if (pendingOrders.length > 0) {
     throw new AppError(
       `Cannot delete product. It is in ${pendingOrders.length} pending order(s). Mark as unavailable instead.`,
       400
     )
   }
   ```
2. Note: Firestore does not support `array-contains` with nested objects; need to query all orders and filter in-memory (acceptable for MVP; optimize later with order indexing)
3. Add UI in ProductsManagement: Change "Delete" to "Mark Unavailable" if product has orders; add separate "Permanently Delete" for products with no order history

**Verification:**
- Create a product, add to cart, place order with status "placed" → Attempt to delete product via admin → Should show error "Cannot delete product..."
- Mark order as "delivered" → Attempt to delete product → Should succeed
- Run `npm test` on productService delete method with various order status scenarios

---

### DATA-002: Prevent category deletion if category has products
**Audit Issue:** DATA-002  
**Files:** `server/src/services/categoryService.js`  
**Problem:** Admin can delete a category while products still reference it, causing broken category filter on menu page.  
**Fix:**
1. In `categoryService.delete()`, before deleting category, count products with that categoryId:
   ```js
   const productsSnapshot = await db.collection('products')
     .where('categoryId', '==', id)
     .limit(1)
     .get()
   
   if (!productsSnapshot.empty) {
     throw new AppError(
       'Cannot delete category. It still has products assigned to it. Reassign or delete those products first.',
       400
     )
   }
   ```
2. Add UI in CategoriesManagement: Show product count next to each category; disable delete button if count > 0 with tooltip

**Verification:**
- Create a category, assign products to it → Attempt to delete category via admin → Should show error "Cannot delete category..."
- Remove all products from category → Attempt to delete category → Should succeed
- Verify menu page category filter does not show deleted categories

---

### DATA-003: Remove add-on from products when deleting add-on
**Audit Issue:** DATA-003  
**Files:** `server/src/services/addonService.js`  
**Problem:** Admin can delete an add-on while products still reference it in their `addOnIds` array, causing validation failures on order creation.  
**Fix:**
1. In `addonService.delete()`, before deleting add-on, find all products with this add-on and remove it from their addOnIds:
   ```js
   const productsSnapshot = await db.collection('products')
     .where('addOnIds', 'array-contains', id)
     .get()
   
   const batch = db.batch()
   productsSnapshot.docs.forEach(doc => {
     const productRef = db.collection('products').doc(doc.id)
     const currentAddOnIds = doc.data().addOnIds || []
     const updatedAddOnIds = currentAddOnIds.filter(addonId => addonId !== id)
     batch.update(productRef, { addOnIds: updatedAddOnIds, updatedAt: new Date().toISOString() })
   })
   await batch.commit()
   ```
2. Add confirmation dialog in AddOnsManagement: "This add-on will be removed from X product(s). Continue?"

**Verification:**
- Create an add-on, assign to multiple products → Delete add-on via admin → Verify products no longer have that add-on in their addOnIds
- Verify orders with that add-on placed before deletion still show correct add-on name in order history
- Test cart page with product that had deleted add-on → Should not show the deleted add-on as option

---

### SEC-002: Add confirmation dialogs for destructive admin operations
**Audit Issue:** SEC-002  
**Files:** `client/src/admin/pages/ProductsManagement.jsx`, `CategoriesManagement.jsx`, `AddOnsManagement.jsx`  
**Problem:** Delete buttons trigger immediate deletion without confirmation, leading to accidental data loss.  
**Fix:**
1. Update each management page to use existing `<ConfirmDialog>` component on delete:
   ```jsx
   <ConfirmDialog
     isOpen={!!deletingItem}
     title="Delete Confirmation"
     message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
     confirmLabel="Delete"
     confirmClassName="bg-red-600 hover:bg-red-700"
     onConfirm={handleDeleteConfirmed}
     onCancel={() => setDeletingItem(null)}
   />
   ```
2. For products with orders, show additional warning: "This product is in X order(s). Consider marking as unavailable instead."
3. For categories with products, disable delete button entirely (see DATA-002 fix)

**Verification:**
- Click delete on any product/category/add-on → Confirmation dialog appears
- Click "Cancel" → Dialog closes, item not deleted
- Click "Delete" → Item deleted, dialog closes
- Try to delete product with pending orders → Additional warning message appears

---

### PERF-003: Fix N+1 query problem in order creation
**Audit Issue:** PERF-003, CODE-004  
**Files:** `server/src/services/orderService.js` method `#priceItems`  
**Problem:** Order creation loops through cart items and fetches each product/add-on individually from Firestore (1 + N queries), causing slow order creation and high database read costs.  
**Fix:**
1. Refactor `#priceItems` to batch-fetch products and add-ons:
   ```js
   async #priceItems(rawItems) {
     // Extract all product IDs and add-on IDs
     const productIds = [...new Set(rawItems.map(item => item.productId || item.id))]
     const allAddonIds = new Set()
     rawItems.forEach(item => {
       (item.selectedAddOns || []).forEach(addon => allAddonIds.add(addon.id))
     })
     const addonIds = [...allAddonIds]
   
     // Batch fetch products (Firestore 'in' supports max 10 IDs; split if needed)
     const productMap = new Map()
     for (let i = 0; i < productIds.length; i += 10) {
       const batch = productIds.slice(i, i + 10)
       const snapshot = await db.collection('products').where(admin.firestore.FieldPath.documentId(), 'in', batch).get()
       snapshot.docs.forEach(doc => productMap.set(doc.id, doc.data()))
     }
   
     // Batch fetch add-ons
     const addonMap = new Map()
     for (let i = 0; i < addonIds.length; i += 10) {
       const batch = addonIds.slice(i, i + 10)
       const snapshot = await db.collection('addons').where(admin.firestore.FieldPath.documentId(), 'in', batch).get()
       snapshot.docs.forEach(doc => addonMap.set(doc.id, doc.data()))
     }
   
     // Build priced items using fetched data
     const priced = []
     for (const item of rawItems) {
       const productId = item.productId || item.id
       const product = productMap.get(productId)
       if (!product) throw new AppError('One or more products are no longer available', 400)
       if (product.isAvailable === false) throw new AppError(`${product.name} is currently unavailable`, 400)
       
       const selectedAddOns = []
       for (const addon of item.selectedAddOns || []) {
         const addonData = addonMap.get(addon.id)
         if (!addonData) throw new AppError('An add-on is no longer available', 400)
         if (addonData.isAvailable === false) throw new AppError(`${addonData.name} is currently unavailable`, 400)
         selectedAddOns.push({
           id: addon.id,
           name: addonData.name,
           additionalPrice: Number(addonData.additionalPrice) || 0
         })
       }
       
       // ... rest of pricing logic
     }
     return priced
   }
   ```
2. Import `admin` from firebase config to access `admin.firestore.FieldPath.documentId()`

**Verification:**
- Place order with 5 items → Monitor Firebase console → Should see 1-2 product queries instead of 5
- Place order with add-ons → Should see 1 add-on query instead of N
- Test with cart having 11 different products → Should see 2 batch queries (10 + 1)
- Measure order creation time before and after fix → Should be 2-3× faster for multi-item orders

---

### FUNC-006: Surface email sending failures to customer and admin
**Audit Issue:** FUNC-006  
**Files:** `server/src/services/orderService.js`, `server/src/services/emailService.js`, `client/src/pages/OrderSuccessPage.jsx`  
**Problem:** Order confirmation emails fail silently if EMAIL_USER/EMAIL_APP_PASSWORD are not configured; customer sees success page but never receives email, and admin is unaware.  
**Fix:**
1. Modify `orderService.create()` to await email results and add to response:
   ```js
   const [customerEmailResult, adminEmailResult] = await Promise.allSettled([
     sendOrderConfirmationEmail(createdOrder, settings),
     sendAdminOrderNotification(createdOrder, settings)
   ])
   
   return {
     ...createdOrder,
     emailStatus: {
       customer: customerEmailResult.status === 'fulfilled' && customerEmailResult.value.success,
       admin: adminEmailResult.status === 'fulfilled' && adminEmailResult.value.success
     }
   }
   ```
2. Update OrderSuccessPage to check for email status and show warning banner if email failed:
   ```jsx
   {!emailSent && (
     <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
       <p className="text-yellow-800">
         <strong>Note:</strong> We could not send a confirmation email. Please save your order number: <strong>{orderNumber}</strong>
       </p>
     </div>
   )}
   ```
3. Log email failures with severity WARN so admin monitoring can catch them

**Verification:**
- Remove EMAIL_USER and EMAIL_APP_PASSWORD from .env → Place order → Should see warning banner on success page
- Add valid email credentials → Place order → Should receive email, no warning banner
- Check server logs → Email failure should be logged with order number and error reason

---

### A11Y-001 through A11Y-004: Fix critical accessibility issues
**Audit Issues:** A11Y-001, A11Y-002, A11Y-003, A11Y-004, A11Y-007  
**Files:** Multiple components  
**Problem:** Screen readers cannot properly announce interactive controls, state changes, and notifications.  
**Fix (grouped for efficiency):**

1. **A11Y-001: Mobile menu button `aria-expanded`**
   - File: `client/src/components/Navbar.jsx`
   - Add to menu button: `aria-expanded={isOpen}` and `aria-controls="mobile-menu"`
   - Add `id="mobile-menu"` to mobile menu container

2. **A11Y-002: Add-on selection ARIA roles**
   - File: `client/src/pages/ProductDetailPage.jsx`
   - Change add-on buttons from `<button>` to include role and state:
     ```jsx
     <button
       role="checkbox"
       aria-checked={isSelected}
       aria-labelledby={`addon-${addon.id}-label`}
       onClick={() => toggleAddOn(addon)}
     >
       <span id={`addon-${addon.id}-label`}>{addon.name}</span>
     </button>
     ```

3. **A11Y-003: Quantity controls grouping**
   - File: `client/src/pages/CartPage.jsx` and `ProductDetailPage.jsx`
   - Wrap quantity controls in group:
     ```jsx
     <div role="group" aria-label={`Quantity for ${item.name}`} className="flex items-center...">
       <button aria-label="Decrease quantity" onClick={handleDecrease}>...</button>
       <span aria-live="polite" aria-atomic="true">{quantity}</span>
       <button aria-label="Increase quantity" onClick={handleIncrease}>...</button>
     </div>
     ```

4. **A11Y-004: Toast notification `role="alert"`**
   - File: `client/src/components/Toast.jsx`
   - Update toast container:
     ```jsx
     <div role="alert" aria-live="polite" aria-atomic="true" className="fixed...">
       {message}
     </div>
     ```

5. **A11Y-007: HTML lang attribute**
   - File: `client/index.html`
   - Change `<html lang="en">` (line 2)

**Verification:**
- Install NVDA screen reader (Windows) or VoiceOver (Mac)
- Navigate through product detail page with keyboard → Screen reader announces "checkbox, checked/unchecked" for add-ons
- Add item to cart → Screen reader announces "Alert: [Product name] added to cart"
- Navigate quantity controls → Screen reader announces "Quantity for [product], decrease quantity button, 1, increase quantity button"
- Open mobile menu → Screen reader announces "button, expanded" or "button, collapsed"
- Run automated a11y audit with axe DevTools → Should pass all WCAG 2.1 Level A/AA criteria for tested components

---

## PRIORITY 1: HIGH PRIORITY ISSUES (Fix before marketing)

### FUNC-003: Implement server-side price validation on cart page
**Audit Issue:** FUNC-003  
**Files:** `client/src/pages/CartPage.jsx`, `server/src/routes/publicRoutes.js`, `client/src/services/api.js`  
**Problem:** Cart displays prices from when items were added; if admin changes product prices between add-to-cart and checkout, cart shows stale prices and customer is surprised at checkout.  
**Fix:**
1. Create new API endpoint `POST /api/cart/validate` that accepts cart items and returns fresh prices:
   ```js
   // server/src/routes/publicRoutes.js
   router.post('/cart/validate', async (req, res, next) => {
     try {
       const items = req.body.items || []
       const priced = await orderService.priceItems(items) // Make priceItems public
       res.json({ items: priced })
     } catch (error) {
       next(error)
     }
   })
   ```
2. Extract `#priceItems` to public method in orderService (or create cartService)
3. Update CartPage to fetch fresh prices on mount:
   ```jsx
   useEffect(() => {
     const validatePrices = async () => {
       const response = await publicApi.validateCart({ items: cart })
       const freshItems = response.data.items
       
       // Check if any prices changed
       const priceChanges = cart.map((item, idx) => {
         const fresh = freshItems[idx]
         const oldPrice = getItemUnitPrice(item)
         const newPrice = fresh.unitPrice
         return oldPrice !== newPrice ? { item: item.name, oldPrice, newPrice } : null
       }).filter(Boolean)
       
       if (priceChanges.length > 0) {
         // Show notification banner
         setPriceChanges(priceChanges)
         // Update cart with fresh prices
         setCart(freshItems)
       }
     }
     validatePrices()
   }, [])
   ```
4. Display price change notification banner at top of cart page

**Verification:**
- Add product to cart → Admin changes product price → Refresh cart page → Should see "Prices updated" banner with old and new prices
- Verify cart total reflects new prices
- Proceed to checkout → Checkout total matches updated cart total

---

### FUNC-004: Document UPI payment verification workflow
**Audit Issue:** FUNC-004  
**Files:** `README.md`, new file `docs/UPI_PAYMENT_WORKFLOW.md`  
**Problem:** UPI orders are created with "pending_verification" status but there's no documented process for admin to verify payments.  
**Fix:**
1. Create `docs/UPI_PAYMENT_WORKFLOW.md` with step-by-step admin workflow:
   ```md
   # UPI Payment Verification Workflow
   
   ## For Admin
   
   When a customer selects UPI payment and completes the payment flow:
   
   1. Order is created with payment status "pending_verification"
   2. Customer sees order success page
   3. Admin receives email notification about new UPI order
   
   ### Verification Steps:
   
   1. Check your UPI payment app (PhonePe/Google Pay/etc.) transaction history
   2. Find payment matching:
      - Amount: Order total from email
      - Sender name: Customer full name
      - Timestamp: Around order creation time
   3. In admin panel, go to Orders Management
   4. Find the order by order number
   5. If payment found and correct:
      - Click "Update Payment Status" → "Paid"
      - Order status auto-updates to "Confirmed"
   6. If payment not found after 30min:
      - Contact customer via phone/email
      - If customer did not pay: Update payment status to "Failed"
      - If customer paid but you can't find it: Investigate transaction ID
   
   ### Common Issues:
   
   - **Payment from different name:** Customer may pay from family member's account
   - **Partial payment:** Amount doesn't match order total; contact customer
   - **Duplicate payment:** Customer paid twice; refund one transaction
   
   ## Future Enhancement
   
   Consider integrating automated payment gateway (Razorpay, PayU, Cashfree) for automatic verification via webhooks.
   ```
2. Add link to this doc in README.md under "UPI Payments" section
3. Add inline help tooltip in OrdersManagement next to payment status dropdown

**Verification:**
- Admin receives UPI order → Follows documented steps → Successfully verifies payment and updates status
- Test edge cases mentioned in doc (different name, partial payment)

---

### FUNC-005: Move idempotency key to server-side
**Audit Issue:** FUNC-005  
**Files:** `server/src/middleware/rateLimit.js`, `server/src/services/orderService.js`, `client/src/pages/CheckoutPage.jsx`  
**Problem:** Idempotency key stored in sessionStorage; user opening checkout in multiple tabs can create duplicate orders.  
**Fix:**
1. Create server-side idempotency key store with 15min expiration:
   ```js
   // server/src/services/idempotencyService.js
   const idempotencyKeys = new Map() // In production, use Redis or Firestore
   
   export const createIdempotencyKey = (customerId) => {
     const key = crypto.randomUUID()
     const expires = Date.now() + (15 * 60 * 1000) // 15 minutes
     idempotencyKeys.set(key, { customerId, expires })
     return key
   }
   
   export const validateIdempotencyKey = (key, customerId) => {
     const record = idempotencyKeys.get(key)
     if (!record) return false
     if (Date.now() > record.expires) {
       idempotencyKeys.delete(key)
       return false
     }
     return record.customerId === customerId
   }
   ```
2. Create new endpoint `POST /api/checkout/init` that generates idempotency key:
   ```js
   router.post('/checkout/init', rateLimit({ max: 10 }), (req, res) => {
     const customerId = req.body.email || req.ip
     const key = createIdempotencyKey(customerId)
     res.json({ idempotencyKey: key, expiresIn: 900 })
   })
   ```
3. Update CheckoutPage to fetch idempotency key from server instead of generating client-side
4. Update orderService.create() to validate idempotency key before creating order

**Verification:**
- Open checkout in two tabs → Fill form in both → Submit in both tabs simultaneously → Only one order created
- Wait 16 minutes after getting idempotency key → Try to submit order → Should reject with "Checkout session expired"
- Submit order, refresh success page, navigate back to checkout → Should get new idempotency key

---

### FUNC-007: Add loading state to "Add to Cart" button
**Audit Issue:** FUNC-007  
**Files:** `client/src/pages/MenuPage.jsx`, `client/src/pages/ProductDetailPage.jsx`  
**Problem:** "Add to Cart" button shows no visual feedback during operation; users may click multiple times on slow connections.  
**Fix:**
1. Add loading state to ProductCard component in MenuPage:
   ```jsx
   const [adding, setAdding] = useState(false)
   
   const handleAddToCart = async (e) => {
     e.preventDefault()
     if (adding) return
     setAdding(true)
     try {
       await addToCart(product, 1)
     } finally {
       setAdding(false)
     }
   }
   
   <button disabled={adding} onClick={handleAddToCart} className="...">
     {adding ? (
       <>
         <LoadingSpinner size="small" />
         Adding...
       </>
     ) : (
       <>
         <ShoppingCart size={18} />
         Add to Cart
       </>
     )}
   </button>
   ```
2. Apply same pattern to ProductDetailPage "Add to Cart" and "Buy Now" buttons
3. Ensure CartContext's `addToCart` is marked as async (it currently returns void; make it return Promise)

**Verification:**
- Throttle network to "Slow 3G" in Chrome DevTools → Click "Add to Cart" → Button shows spinner and "Adding..." text, becomes disabled
- Wait for operation to complete → Button returns to normal state
- Click button rapidly → Only one add-to-cart operation executes

---

### FUNC-008: Fix "Buy Now" navigation on add-to-cart failure
**Audit Issue:** FUNC-008  
**Files:** `client/src/pages/ProductDetailPage.jsx`  
**Problem:** "Buy Now" calls `addToCart` then immediately navigates to `/checkout`; if addToCart fails, navigation happens anyway and user lands on checkout with empty cart.  
**Fix:**
1. Make `addToCart` in CartContext return a Promise that resolves to success boolean
2. Update handleBuyNow to await result:
   ```jsx
   const handleBuyNow = async () => {
     setAdding(true)
     try {
       const success = await addToCart(product, quantity, selectedAddOns)
       if (success) {
         navigate('/checkout')
       } else {
         // Show error toast or inline error message
         setError('Failed to add item to cart. Please try again.')
       }
     } catch (err) {
       setError(err.message || 'An error occurred')
     } finally {
       setAdding(false)
     }
   }
   ```
3. Add error state display below "Buy Now" button

**Verification:**
- Mock addToCart to fail (temporarily modify CartContext) → Click "Buy Now" → Should show error message, should NOT navigate to checkout
- Remove mock → Click "Buy Now" → Should add to cart and navigate successfully
- Check with product at MAX_ITEM_QUANTITY in cart → Try "Buy Now" → Should show "maximum quantity" error, not navigate

---

### FUNC-009: Add slug uniqueness check on product update
**Audit Issue:** FUNC-009  
**Files:** `server/src/services/productService.js`  
**Problem:** Updating a product's name generates new slug but doesn't check if that slug already exists in another product, causing 400 error.  
**Fix:**
1. In `productService.update()`, after sanitizing data, check slug uniqueness:
   ```js
   const updateData = {
     ...sanitizeProduct({ ...existingDoc.data(), ...data }),
     updatedAt: new Date().toISOString(),
   }
   delete updateData.createdAt
   
   // Check slug uniqueness if slug changed
   if (updateData.slug && updateData.slug !== existingDoc.data().slug) {
     const slugClash = await db.collection(COLLECTION)
       .where('slug', '==', updateData.slug)
       .limit(1)
       .get()
     
     if (!slugClash.empty && slugClash.docs[0].id !== id) {
       throw new AppError(
         `A product with slug "${updateData.slug}" already exists. Please choose a different name or manually set a unique slug.`,
         400
       )
     }
   }
   
   await docRef.update(updateData)
   ```
2. Note: This check already exists in productService.update() at line 103 (verified in code reading); this issue may be resolved but test to confirm

**Verification:**
- Create two products: "Classic Oats" and "Premium Oats"
- Rename "Premium Oats" to "Classic Oats" → Should show error "slug already exists"
- Rename to "Classic Oats V2" → Should succeed with slug "classic-oats-v2"

---

### FUNC-012: Add rate limiting to order lookup endpoint
**Audit Issue:** FUNC-012  
**Files:** `server/src/routes/publicRoutes.js`  
**Problem:** `GET /api/orders/:orderNumber` requires email but has no rate limiting; attackers could enumerate order numbers.  
**Fix:**
1. Add rate limiting to order lookup endpoint:
   ```js
   router.get('/orders/:orderNumber', 
     rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: 'order-lookup' }), 
     async (req, res, next) => {
       // ... existing code
     }
   )
   ```
2. Consider adding CAPTCHA on order tracking page for additional security (optional, future enhancement)

**Verification:**
- Make 6 requests to `/api/orders/ORD-20250101-1234?email=test@example.com` within 15 minutes → 6th request should return 429 "Too many requests"
- Wait 15 minutes → Should be able to make requests again

---

### UX-002: Add form validation error summary
**Audit Issue:** UX-002  
**Files:** `client/src/pages/CheckoutPage.jsx`  
**Problem:** Form validation errors appear inline only; users must scroll to find each error field, especially on mobile.  
**Fix:**
1. Add error summary banner at top of form:
   ```jsx
   {Object.keys(errors).length > 0 && (
     <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
       <h3 className="font-semibold text-red-800 mb-2">Please fix the following errors:</h3>
       <ul className="list-disc list-inside text-sm text-red-700">
         {Object.entries(errors).map(([field, message]) => (
           <li key={field}>
             <button
               type="button"
               onClick={() => document.getElementById(field)?.focus()}
               className="underline hover:no-underline"
             >
               {message}
             </button>
           </li>
         ))}
       </ul>
     </div>
   )}
   ```
2. Ensure error summary appears after form submission attempt, above all form sections
3. Make error messages clickable links that focus the corresponding field

**Verification:**
- Fill checkout form with invalid data (empty name, invalid email, wrong pincode) → Click submit
- Error summary banner appears at top with 3 errors listed
- Click "Email is invalid" link in summary → Email input field is focused
- Test on mobile device → Error summary is visible without scrolling

---

### UX-004: Improve UPI payment return flow UX
**Audit Issue:** UX-004  
**Files:** `client/src/pages/UpiPaymentPage.jsx`  
**Problem:** "Pay Now via UPI App" button uses `window.location.href` to open UPI deep link, navigating user away from payment page; high risk they forget to return and complete order.  
**Fix:**
1. Change UPI deep link to open in new tab instead (note: may not work on all mobile browsers due to security restrictions):
   ```jsx
   const handlePayNow = () => {
     const deepLink = generateUpiDeepLink()
     // Try to open in new window/tab
     const opened = window.open(deepLink, '_blank')
     if (!opened) {
       // Fallback: same window
       window.location.href = deepLink
     }
   }
   ```
2. Add prominent visual reminder above confirmation button:
   ```jsx
   <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
     <div className="flex gap-3">
       <AlertCircle className="text-blue-600 flex-shrink-0" size={24} />
       <div>
         <h3 className="font-bold text-blue-900 mb-1">After paying in your UPI app:</h3>
         <p className="text-sm text-blue-800">
           Return to this page and click the "I've Completed Payment" button below to confirm your order.
         </p>
       </div>
     </div>
   </div>
   ```
3. Add browser notification API to remind user after 2 minutes if page is in background
4. Consider sending SMS with "complete order" link (requires SMS service integration; defer to future)

**Verification:**
- On mobile device: Click "Pay Now via UPI App" → UPI app opens → Complete payment → Return to browser tab (payment page should still be open)
- On desktop: Click "Pay Now via UPI App" → UPI app opens in new tab/window → Browser tab with payment page remains open
- Wait 2 minutes after clicking "Pay Now" without returning → Browser notification appears (if supported)

---

### UX-009: Add pagination to admin orders table
**Audit Issue:** UX-009  
**Files:** `client/src/admin/pages/OrdersManagement.jsx`  
**Problem:** Orders table loads all orders at once; page becomes slow and unresponsive with 100+ orders.  
**Fix:**
1. Add pagination state and controls:
   ```jsx
   const [page, setPage] = useState(1)
   const [pageSize] = useState(20)
   
   const paginatedOrders = filteredOrders.slice(
     (page - 1) * pageSize,
     page * pageSize
   )
   const totalPages = Math.ceil(filteredOrders.length / pageSize)
   
   // Render pagination controls
   <div className="flex items-center justify-between mt-6">
     <p className="text-sm text-gray-600">
       Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
     </p>
     <div className="flex gap-2">
       <button
         onClick={() => setPage(p => Math.max(1, p - 1))}
         disabled={page === 1}
         className="btn-outline"
       >
         Previous
       </button>
       <span className="px-4 py-2">Page {page} of {totalPages}</span>
       <button
         onClick={() => setPage(p => Math.min(totalPages, p + 1))}
         disabled={page === totalPages}
         className="btn-outline"
       >
         Next
       </button>
     </div>
   </div>
   ```
2. Add "Orders per page" dropdown to allow admin to choose 20/50/100
3. Persist page size preference in localStorage

**Verification:**
- Admin panel with 50+ orders → Orders page loads fast, shows first 20
- Click "Next" → Shows orders 21-40
- Change page size to 50 → Shows orders 1-50
- Apply filter (e.g., status "placed") → Pagination resets to page 1, shows correct total

---

### DATA-004: Use deterministic order number generation
**Audit Issue:** DATA-004  
**Files:** `server/src/services/orderService.js`  
**Problem:** Order number uses `Math.random()` which could theoretically collide (extremely unlikely but possible).  
**Fix:**
1. Replace order number generation with timestamp + sequential counter:
   ```js
   // At top of orderService.js
   let orderCounter = 0
   
   // In create() method
   const timestamp = Date.now()
   orderCounter = (orderCounter + 1) % 10000 // Reset after 9999
   const orderNumber = `ORD-${timestamp.toString(36).toUpperCase()}-${orderCounter.toString().padStart(4, '0')}`
   ```
2. OR use Firestore auto-incrementing counter:
   ```js
   const counterRef = db.collection('_counters').doc('orders')
   const newCount = await db.runTransaction(async (transaction) => {
     const doc = await transaction.get(counterRef)
     const count = (doc.exists ? doc.data().count : 0) + 1
     transaction.set(counterRef, { count }, { merge: true })
     return count
   })
   const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
   const orderNumber = `ORD-${dateStr}-${newCount.toString().padStart(6, '0')}`
   ```
3. Option 2 (Firestore counter) is more reliable for distributed systems; Option 1 (in-memory counter) is simpler but resets on server restart

**Verification:**
- Create 100 orders rapidly (simulate with script) → All order numbers are unique
- Restart server, create another order → Order number continues sequence (if using Firestore counter) or restarts (if in-memory)
- Check Firestore for `_counters/orders` document → Should exist and increment with each order

---

## PRIORITY 2: MEDIUM PRIORITY ISSUES (First post-launch sprint)

### FUNC-010: Show "(unavailable)" for deleted add-ons in cart
**Audit Issue:** FUNC-010  
**Files:** `client/src/contexts/CartContext.jsx`, `client/src/pages/CartPage.jsx`  
**Problem:** If admin deletes an add-on after customer adds it to cart, cart still shows the stale add-on name; customer doesn't know it's unavailable until checkout fails.  
**Fix:**
1. Add add-on availability check on cart page mount:
   ```jsx
   // CartPage.jsx
   useEffect(() => {
     const checkAddOnAvailability = async () => {
       const response = await publicApi.getAddOns()
       const availableAddOnIds = new Set(
         response.data.filter(a => a.isAvailable).map(a => a.id)
       )
       
       const updatedCart = cart.map(item => ({
         ...item,
         selectedAddOns: item.selectedAddOns?.map(addon => ({
           ...addon,
           isAvailable: availableAddOnIds.has(addon.id)
         }))
       }))
       
       if (JSON.stringify(cart) !== JSON.stringify(updatedCart)) {
         updateCart(updatedCart) // Add updateCart method to CartContext
       }
     }
     checkAddOnAvailability()
   }, [])
   ```
2. Display "(unavailable)" next to deleted add-on names in cart
3. Show warning banner: "Some add-ons are no longer available and will be removed at checkout"

**Verification:**
- Add product with add-on to cart → Admin deletes that add-on → Refresh cart page → Add-on shows as "(unavailable)"
- Proceed to checkout → Order is created without the unavailable add-on
- Verify pricing updates correctly when unavailable add-on is removed

---

### UX-003: Increase cart item image size
**Audit Issue:** UX-003  
**Files:** `client/src/pages/CartPage.jsx`  
**Problem:** Cart item images are small (24×24px on mobile); customers have difficulty recognizing products visually.  
**Fix:**
1. Update CartItem component image size:
   ```jsx
   <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
     {item.imageUrl ? (
       <img
         src={item.imageUrl}
         alt={item.name}
         className="w-full h-full object-cover"
       />
     ) : (
       <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl">
         🥣
       </div>
     )}
   </div>
   ```
2. Adjust cart item grid to accommodate larger images (stack image + content vertically on very small screens)

**Verification:**
- View cart on mobile (375px width) → Images are 80×80px, clearly visible
- View cart on tablet → Images are 96×96px
- View cart on desktop → Images are 96×96px, layout looks balanced

---

### UX-005: Add order tracking page
**Audit Issue:** UX-005, FEAT-001  
**Files:** New `client/src/pages/OrderTrackingPage.jsx`, update `App.jsx` routing  
**Problem:** After order success page, customers cannot check their order status; must save order number manually.  
**Fix:**
1. Create new route `/track-order` with form to enter order number + email
2. Create OrderTrackingPage component:
   ```jsx
   const OrderTrackingPage = () => {
     const [orderNumber, setOrderNumber] = useState('')
     const [email, setEmail] = useState('')
     const [order, setOrder] = useState(null)
     const [loading, setLoading] = useState(false)
     const [error, setError] = useState('')
     
     const handleSubmit = async (e) => {
       e.preventDefault()
       setLoading(true)
       setError('')
       try {
         const response = await publicApi.getOrderByNumber(orderNumber, email)
         setOrder(response.data)
       } catch (err) {
         setError('Order not found. Please check your order number and email.')
       } finally {
         setLoading(false)
       }
     }
     
     return (
       <div className="min-h-screen py-16">
         <div className="container-custom max-w-2xl">
           <h1 className="text-4xl font-bold text-deep-green mb-8">Track Your Order</h1>
           
           {!order ? (
             <form onSubmit={handleSubmit} className="card p-6">
               <div className="space-y-4">
                 <div>
                   <label htmlFor="orderNumber" className="label">Order Number</label>
                   <input
                     id="orderNumber"
                     type="text"
                     value={orderNumber}
                     onChange={(e) => setOrderNumber(e.target.value)}
                     placeholder="ORD-20250101-1234"
                     className="input"
                     required
                   />
                 </div>
                 <div>
                   <label htmlFor="email" className="label">Email Address</label>
                   <input
                     id="email"
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="your@email.com"
                     className="input"
                     required
                   />
                 </div>
                 {error && <p className="text-red-600 text-sm">{error}</p>}
                 <button type="submit" disabled={loading} className="btn-primary w-full">
                   {loading ? <LoadingSpinner size="small" /> : 'Track Order'}
                 </button>
               </div>
             </form>
           ) : (
             <OrderStatusDisplay order={order} onTrackAnother={() => setOrder(null)} />
           )}
         </div>
       </div>
     )
   }
   ```
3. Create OrderStatusDisplay component showing order details, timeline, and current status
4. Add "Track Your Order" link to footer and order success page
5. Update `publicApi.getOrderByNumber` to pass email as query param (already implemented)

**Verification:**
- Navigate to `/track-order` → Enter valid order number and email → Order details display with current status
- Enter invalid order number → Shows error "Order not found"
- Enter correct order number but wrong email → Shows error (backend validates email match)
- View order status timeline → Current status is highlighted, future steps are grayed out

---

### UX-006: Close mobile menu on route change
**Audit Issue:** UX-006  
**Files:** `client/src/components/Navbar.jsx`  
**Problem:** Mobile menu stays open after clicking a navigation link; user must manually close it.  
**Fix:**
1. Add location listener to close menu on navigation:
   ```jsx
   import { useLocation } from 'react-router-dom'
   
   const Navbar = () => {
     const [isOpen, setIsOpen] = useState(false)
     const location = useLocation()
     
     useEffect(() => {
       setIsOpen(false) // Close menu on route change
     }, [location.pathname])
     
     // ... rest of component
   }
   ```

**Verification:**
- Open mobile menu → Click "Our Menu" → Menu closes automatically
- Open mobile menu → Click "Contact" → Menu closes automatically
- Navigate to same page again → Menu stays closed

---

### PERF-001: Add client-side caching for frequently accessed data
**Audit Issue:** PERF-001  
**Files:** Multiple pages, new `client/src/hooks/useSettings.js`, `useProducts.js`  
**Problem:** Site settings and products are fetched on every page load; repeated API calls for same data.  
**Fix:**
1. Install React Query or SWR for caching:
   ```bash
   cd client && npm install @tanstack/react-query
   ```
2. Wrap app in QueryClientProvider:
   ```jsx
   // main.jsx
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 10 * 60 * 1000, // 10 minutes
       },
     },
   })
   
   <QueryClientProvider client={queryClient}>
     <App />
   </QueryClientProvider>
   ```
3. Create custom hooks using React Query:
   ```jsx
   // hooks/useSettings.js
   import { useQuery } from '@tantml:invoke>
   import { publicApi } from '../services/api'
   import { DEFAULT_SETTINGS } from '../config/constants'
   
   export const useSettings = () => {
     return useQuery({
       queryKey: ['settings'],
       queryFn: async () => {
         const response = await publicApi.getSiteSettings()
         return { ...DEFAULT_SETTINGS, ...response.data }
       },
       staleTime: 5 * 60 * 1000,
     })
   }
   ```
4. Replace manual settings fetching in all components with `useSettings()` hook
5. Apply same pattern for products, categories, add-ons

**Verification:**
- Open homepage → Check network tab → 1 request to `/api/site-settings`
- Navigate to menu page → No new request to `/api/site-settings` (served from cache)
- Wait 6 minutes → Navigate to contact page → New request to `/api/site-settings` (cache expired)
- Admin updates site settings → Customer refreshes page within 5min → Sees old settings (expected; acceptable)

---

### PERF-002: Implement progressive loading on menu page
**Audit Issue:** PERF-002  
**Files:** `client/src/pages/MenuPage.jsx`  
**Problem:** Products, categories, and add-ons all fetched before rendering; slow time-to-interactive.  
**Fix:**
1. Show products immediately, load filters afterwards:
   ```jsx
   useEffect(() => {
     // Load products first
     loadProducts()
     
     // Load categories and add-ons in parallel after products render
     setTimeout(() => {
       Promise.all([loadCategories(), loadAddOns()])
     }, 100)
   }, [])
   
   const loadProducts = async () => {
     try {
       setLoading(true)
       const res = await publicApi.getProducts()
       setProducts(res.data || [])
     } catch (err) {
       setError(err.message)
     } finally {
       setLoading(false)
     }
   }
   
   const loadCategories = async () => {
     const res = await publicApi.getCategories()
     setCategories(res.data || [])
   }
   
   const loadAddOns = async () => {
     const res = await publicApi.getAddOns()
     setAddOns(res.data || [])
   }
   ```
2. Show skeleton loaders for category filter while loading
3. Add-ons section loads last (it's below the fold on most screens)

**Verification:**
- Navigate to menu page with network throttled to "Fast 3G" → Products grid appears within 1-2 seconds
- Category filter shows skeleton → Loads 1 second later
- Add-ons section shows "Loading..." → Loads last
- Measure time-to-interactive: Should improve by 30-50%

---

### A11Y-005: Fix form label associations
**Audit Issue:** A11Y-005  
**Files:** `client/src/pages/CheckoutPage.jsx`, `client/src/admin/pages/ProductFormModal.jsx`  
**Problem:** Some form inputs use implicit label association (nesting) instead of explicit `htmlFor`/`id`, which some screen readers may not handle correctly.  
**Fix:**
1. Audit all form labels and ensure explicit association:
   ```jsx
   // Before (implicit)
   <label>
     Full Name
     <input name="fullName" ... />
   </label>
   
   // After (explicit)
   <label htmlFor="fullName">Full Name</label>
   <input id="fullName" name="fullName" ... />
   ```
2. Apply to all form components in checkout, admin product form, admin add-on form, etc.
3. Add `aria-describedby` to inputs that have helper text or error messages

**Verification:**
- Use NVDA screen reader → Navigate through checkout form → Each input announces its label correctly
- Focus an input with validation error → Screen reader announces "Email, invalid, edit text, Please enter a valid email address"

---

### A11Y-006: Implement modal focus trap and Escape key handler
**Audit Issue:** A11Y-006  
**Files:** `client/src/admin/components/ProductFormModal.jsx`, `client/src/admin/components/ConfirmDialog.jsx`  
**Problem:** Modals do not trap focus; keyboard users can tab out to underlying page. Escape key does not close modal.  
**Fix:**
1. Install focus-trap-react library:
   ```bash
   cd client && npm install focus-trap-react
   ```
2. Wrap modal content in FocusTrap:
   ```jsx
   import FocusTrap from 'focus-trap-react'
   
   const ProductFormModal = ({ isOpen, onClose, product }) => {
     useEffect(() => {
       const handleEscape = (e) => {
         if (e.key === 'Escape') onClose()
       }
       if (isOpen) {
         document.addEventListener('keydown', handleEscape)
         return () => document.removeEventListener('keydown', handleEscape)
       }
     }, [isOpen, onClose])
     
     if (!isOpen) return null
     
     return (
       <div className="fixed inset-0 z-50 bg-black/50">
         <FocusTrap>
           <div className="modal-content" role="dialog" aria-modal="true">
             {/* modal content */}
           </div>
         </FocusTrap>
       </div>
     )
   }
   ```
3. Apply same pattern to ConfirmDialog and any other modals

**Verification:**
- Open product form modal → Tab through inputs → Focus stays within modal, does not reach underlying page
- Press Escape key → Modal closes
- Click outside modal → Modal closes (verify this still works)
- Use screen reader → Modal is announced as "dialog"

---

### CODE-007: Fix API error handling to avoid mutation
**Audit Issue:** CODE-007  
**Files:** `client/src/services/api.js`  
**Problem:** Error interceptor mutates `error.message` which loses original error info; debugging is harder.  
**Fix:**
1. Create custom error class instead of mutating:
   ```jsx
   // services/api.js
   class ApiError extends Error {
     constructor(message, originalError, statusCode) {
       super(message)
       this.name = 'ApiError'
       this.originalError = originalError
       this.statusCode = statusCode
     }
   }
   
   api.interceptors.response.use(
     (response) => response,
     (error) => {
       const message = error.response?.data?.error || error.message || 'An error occurred'
       const statusCode = error.response?.status
       throw new ApiError(message, error, statusCode)
     }
   )
   ```
2. Update error handling in components to check for `error.originalError` if detailed logging needed

**Verification:**
- Trigger API error (e.g., server offline) → Check console → Original axios error is preserved in error.originalError
- Display error message to user → Shows clean message from API response
- Sentry/error tracking → Can access full error stack from originalError

---

### CODE-008: Document rate limiter limitations or add persistence
**Audit Issue:** CODE-008  
**Files:** `server/src/middleware/rateLimit.js`, `README.md`  
**Problem:** In-memory rate limit store resets on server restart; rate limits are ineffective after deploys.  
**Fix:**
1. **Option A (Document limitation):** Add to README.md:
   ```md
   ## Rate Limiting
   
   The API uses in-memory rate limiting for order creation and other endpoints. 
   
   **Limitation:** Rate limits reset when the server restarts (e.g., during deployment). 
   For production use with multiple server instances or frequent deploys, consider 
   migrating to persistent rate limiting with Redis or Firestore.
   
   ### Implementing Persistent Rate Limiting (Optional)
   
   1. Install redis client: `npm install ioredis`
   2. Update `rateLimit.js` to use Redis instead of Map
   3. Set REDIS_URL environment variable
   ```
2. **Option B (Add persistence):** Implement Firestore-based rate limiting:
   ```js
   // middleware/rateLimit.js
   import { db } from '../config/firebase.js'
   
   export const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20, keyPrefix = 'rl' } = {}) => {
     return async (req, res, next) => {
       const ip = (req.headers['x-forwarded-for'] || req.ip).split(',')[0].trim()
       const key = `${keyPrefix}:${ip}`
       const now = Date.now()
       
       try {
         const docRef = db.collection('_rate_limits').doc(key)
         const doc = await docRef.get()
         const data = doc.exists ? doc.data() : { attempts: [], expiresAt: now + windowMs }
         
         // Filter attempts within window
         const recent = data.attempts.filter(ts => now - ts < windowMs)
         
         if (recent.length >= max) {
           return res.status(429).json({ error: 'Too many requests. Please try again later.' })
         }
         
         // Add current attempt and update
         recent.push(now)
         await docRef.set({ attempts: recent, expiresAt: now + windowMs })
         next()
       } catch (error) {
         console.error('Rate limit check failed:', error)
         next() // Fail open
       }
     }
   }
   ```
3. Add cleanup job to delete expired rate limit documents (Cloud Function scheduled every hour)

**Verification:**
- If Option A: README.md clearly documents limitation
- If Option B: Make 10 requests → Restart server → Make 11 more requests immediately → 21st request should be rate-limited (limit persists across restart)

---

## PRIORITY 3: LOW PRIORITY ISSUES (Future iterations)

### UX-007: Add skeleton loading states
**Audit Issue:** UX-007  
**Fix:** Create skeleton card components and display during loading state on MenuPage, HomePage featured products, admin tables  
**Verification:** Throttle network, navigate to menu → See skeleton cards animate in

---

### UX-008: Show max quantity hint on product detail
**Audit Issue:** UX-008  
**Fix:** Add text near quantity selector: "Maximum 20 per item"  
**Verification:** View product detail page → Hint is visible below quantity controls

---

### UX-010: Make "Proceed to Checkout" button more prominent in cart
**Audit Issue:** UX-010  
**Fix:** Increase button size, change "Continue to Menu" to `btn-outline` style  
**Verification:** View cart → "Proceed to Checkout" is visually primary action

---

### UX-011: Add "Save my details" option for returning customers
**Audit Issue:** UX-011  
**Fix:** Add checkbox on checkout form to save customer details to localStorage; auto-fill on next visit  
**Verification:** Check "Save my details" → Complete order → Return to checkout → Form is pre-filled

---

### CODE-001: Extract common hooks (useScrollToTop, useSettings)
**Audit Issue:** CODE-001  
**Fix:** Create custom hooks in `client/src/hooks/`:
- `useScrollToTop.js`: `useEffect(() => window.scrollTo(0, 0), [])`
- `usePageTitle.js`: `useEffect(() => { document.title = title }, [title])`  
Replace repeated patterns across all page components  
**Verification:** Navigate between pages → Scroll position resets, page title updates

---

### CODE-002: Add JSDoc comments to all service methods
**Audit Issue:** CODE-002  
**Fix:** Add JSDoc to all public methods in `server/src/services/*.js`:
```js
/**
 * Create a new product
 * @param {Object} data - Product data
 * @param {string} data.name - Product name
 * @param {number} data.basePrice - Base price in INR
 * @returns {Promise<Object>} Created product with id
 * @throws {AppError} If validation fails or slug already exists
 */
async create(data) { ... }
```  
**Verification:** Hover over service method in VS Code → JSDoc tooltip appears with param/return types

---

### CODE-003: Move getIdempotencyKey to utility file
**Audit Issue:** CODE-003  
**Fix:** Move from CheckoutPage to `client/src/utils/checkout.js`; import where needed  
**Verification:** Checkout flow still works; function is now testable in isolation

---

### CODE-005: Move getDeliveryCharge out of constants.js
**Audit Issue:** CODE-005  
**Fix:** Move to `client/src/utils/pricing.js`; update imports  
**Verification:** Cart and checkout still calculate delivery charge correctly

---

### CODE-006: Replace console.log with proper logger
**Audit Issue:** CODE-006  
**Fix:** Install winston or pino; replace all console.log/error with logger.info/error; add log levels (debug/info/warn/error)  
**Verification:** Server logs structured JSON; can filter by log level

---

### PERF-004: Optimize Google Fonts loading
**Audit Issue:** PERF-004  
**Fix:** Add `&display=swap` to Google Fonts URL in `client/index.html`; consider self-hosting fonts  
**Verification:** Run Lighthouse → Font loading does not block first contentful paint

---

### PERF-005: Cache product detail page data
**Audit Issue:** PERF-005  
**Fix:** Use React Query for product details with 5min stale time (similar to PERF-001)  
**Verification:** Navigate to product → Back → Navigate to same product again → No new API request

---

### A11Y-007: Add lang attribute to html element
**Audit Issue:** A11Y-007 (ALREADY FIXED in audit analysis)  
**Fix:** `client/index.html` line 2: `<html lang="en">`  
**Verification:** View page source → `<html lang="en">` is present

---

### A11Y-008: Hide decorative elements from screen readers
**Audit Issue:** A11Y-008  
**Fix:** Add `aria-hidden="true"` to all decorative background divs (gradient circles, etc.) in HomePage  
**Verification:** Use NVDA → Decorative elements are not announced

---

### FEAT-002: Add admin dashboard statistics visualization
**Audit Issue:** FEAT-002  
**Fix:** Install Chart.js or Recharts; create bar/line charts for revenue, orders over time  
**Verification:** Navigate to admin dashboard → See charts showing order trends

---

### FEAT-003: Add search functionality in admin product list
**Audit Issue:** FEAT-003  
**Fix:** Add search input in ProductsManagement that filters by product name/slug (already has search state; just need to implement filtering)  
**Verification:** Type "oats" in search box → Only products with "oats" in name/slug appear

---

### FEAT-005: Add inventory management
**Audit Issue:** FEAT-005  
**Fix:** Add `stock` field to products; decrement on order creation; show "Out of Stock" badge when stock = 0  
**Verification:** Create product with stock=5 → Place 5 orders → Product automatically marked unavailable

---

### FEAT-006: Add order cancellation by customer
**Audit Issue:** FEAT-006  
**Fix:** On order tracking page, add "Cancel Order" button (only if status = "placed"); call new API endpoint `PATCH /api/orders/:id/cancel`  
**Verification:** Track order with status "placed" → Click "Cancel" → Order status updates to "cancelled"

---

### DATA-005: Add expiration to cart localStorage
**Audit Issue:** DATA-005  
**Fix:** Store timestamp with cart in localStorage; on app load, check if older than 7 days and clear if expired  
**Verification:** Add items to cart → Change system date to 8 days later → Refresh page → Cart is empty

---

## Implementation Constraints (CRITICAL - READ BEFORE STARTING)

### Architecture & Dependencies
- **Preserve existing stack:** React 18, Vite, Tailwind CSS, Node.js, Express, Firebase Firestore, Firebase Auth, Cloudinary
- **No new frameworks:** Do not introduce Next.js, NestJS, TypeScript, or other fundamental changes
- **Minimize new dependencies:** Only add libraries when clearly beneficial (e.g., React Query for caching, focus-trap-react for accessibility)
- **Maintain monorepo structure:** Keep client/ and server/ separation

### Code Style & Conventions
- **Follow existing patterns:** Study how similar features are implemented before writing new code
- **Match naming conventions:** camelCase for variables/functions, PascalCase for components, kebab-case for CSS classes
- **Use existing components:** Reuse LoadingSpinner, ErrorMessage, EmptyState, Toast, ConfirmDialog
- **Maintain Tailwind utility-first approach:** Do not add new CSS files; use Tailwind classes

### Data Integrity & Safety
- **Never destructive DB changes:** Do not modify Firestore schemas in ways that break existing data
- **Preserve working features:** Test before and after each change; if a feature works, do not break it while fixing another
- **Maintain backward compatibility:** APIs should accept existing request formats even after adding new fields
- **Test with real data:** Use existing products/orders in Firestore for testing, not just empty database

### Security & Secrets
- **Never expose secrets:** Do not log or echo EMAIL_USER, EMAIL_APP_PASSWORD, CLOUDINARY_API_SECRET, Firebase service account key
- **Never hardcode config:** All business information must remain in database or env vars, never in code
- **Reference by key name:** In documentation and audit report, refer to "ADMIN_EMAILS" not actual email addresses

### Testing & Deployment
- **Verify after each fix:** Run the verification steps specified in each issue's "Verification" section
- **Test on multiple devices:** Mobile (375px), tablet (768px), desktop (1280px+) for UI changes
- **Run existing tests:** Execute `npm test` after backend changes
- **Check for regressions:** Navigate through main customer journey (homepage → menu → cart → checkout → success) after each priority level

### What NOT to Do
- ❌ Do not introduce payment gateway integration (Razorpay, Stripe, etc.) without explicit approval — flag as blocker
- ❌ Do not remove manual UPI verification workflow — it's intentional for MVP
- ❌ Do not add customer account/authentication system — all orders are guest checkout
- ❌ Do not modify Firebase security rules without testing in emulator
- ❌ Do not delete or rename Firestore collections
- ❌ Do not change existing API endpoint URLs (would break deployed frontend)
- ❌ Do not add features not requested in audit (scope creep)

---

## Testing Strategy

### After Each Priority Level
1. **Run automated checks:**
   ```bash
   cd client && npm run build && npm run lint
   cd ../server && npm start # Verify no errors
   ```

2. **Manual regression testing:**
   - Customer journey: Homepage → Menu → Product Detail → Add to Cart → Cart → Checkout (COD) → Success
   - UPI journey: Same as above but select UPI payment → Complete UPI flow → Success
   - Admin journey: Login → Products → Create/Edit/Delete → Orders → Update Status

3. **Accessibility testing (after Priority 0 and 2):**
   - Tab through entire site with keyboard only
   - Test with NVDA or VoiceOver screen reader
   - Run axe DevTools extension on key pages

4. **Cross-browser testing (before launch):**
   - Chrome/Edge (desktop + mobile)
   - Safari (desktop + iOS)
   - Firefox (desktop)

5. **Performance testing (before launch):**
   - Run Lighthouse audit on homepage, menu, cart, checkout
   - Target scores: Performance >85, Accessibility >90, Best Practices >95, SEO >90

---

## Deployment Checklist

### Before Production Launch
- [ ] All Priority 0 (Critical) issues resolved
- [ ] All Priority 1 (High) issues resolved  
- [ ] Static assets (hero image, UPI QR code) present in `client/public/`
- [ ] Environment variables configured on hosting platform (Vercel/Netlify)
- [ ] Firebase security rules deployed: `firebase deploy --only firestore:rules`
- [ ] Email credentials configured and tested (send test order confirmation)
- [ ] Admin email allowlist contains at least one valid email
- [ ] CORS_ORIGINS set to production frontend URL
- [ ] SSL certificate active (HTTPS)
- [ ] Custom domain pointed to hosting platform
- [ ] Cloudinary configured with production API keys
- [ ] Firebase project upgraded to Blaze plan (if expecting >50 orders/day)
- [ ] Monitoring/logging set up (Sentry or similar)
- [ ] Backup strategy for Firestore data
- [ ] Admin login tested on production
- [ ] End-to-end customer order flow tested on production
- [ ] UPI payment verification workflow documented and tested
- [ ] Mobile responsiveness verified on real devices
- [ ] README.md updated with production deployment instructions

---

## Summary

**Total Issues:** 62  
**Priority 0 (Critical):** 10 issues — **~5-7 days**  
**Priority 1 (High):** 13 issues — **~7-10 days**  
**Priority 2 (Medium):** 13 issues — **~5-7 days**  
**Priority 3 (Low):** 26 issues — **~3-5 days**

**Minimum Viable Production:** Complete Priority 0 + Priority 1 = **~12-17 days**  
**Recommended for Launch:** Priority 0 + Priority 1 + Priority 2 = **~17-24 days**  
**Feature Complete:** All priorities = **~20-30 days**

**Critical Path to Launch:**
1. Week 1: SEC-001, FUNC-001, FUNC-002, DATA-001/002/003, SEC-002, PERF-003, FUNC-006, A11Y critical issues
2. Week 2: FUNC-003, FUNC-005, FUNC-007, FUNC-008, FUNC-009, FUNC-012, UX-002, UX-004, UX-009, DATA-004
3. Week 3-4: Medium priority UI/UX improvements, accessibility, performance, remaining high-priority issues
4. Post-Launch: Low priority code quality, optional features based on user feedback

This plan ensures a production-ready, secure, accessible e-commerce platform while preserving the existing architecture and working features.
