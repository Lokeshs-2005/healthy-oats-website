# Implementation Plan

## Project Context

**Technology Stack:**
- Frontend: React 18 + Vite, React Router, Tailwind CSS, lucide-react icons
- Backend: Node.js + Express, Firebase/Firestore (document database)
- Build: npm workspaces (client + server)
- Test: Vitest (client), Jest (server)

**Architecture:**
- Backend uses service pattern - all product operations in `productService.js`
- Firestore document-based storage (no Mongoose schema - uses plain JS objects with validation in service layer)
- Products sorted by `createdAt` DESC by default in `productService.getAll()`
- Admin UI uses ProductFormModal for create/edit operations
- Public pages (HomePage, MenuPage) fetch products via `publicApi.getProducts()`

**Key Decisions:**
1. **displayOrder field**: Add to product objects in Firestore with default value 999 (high number sorts to end). Products with lower displayOrder values appear first.
2. **Sorting strategy**: Modify `productService.getAll()` to sort by `displayOrder` ASC first, then `createdAt` DESC as tiebreaker. This ensures explicit ordering takes precedence while maintaining chronological order for products without explicit order.
3. **UI placement**: Add displayOrder input at top of ProductFormModal (high visibility for admins). Use number input with default 999, step 1, min 0.
4. **HomePage benefits section**: Replace "Build Your Perfect Bowl" 3-step section with "Why Choose Healthy Oats?" benefits section using lucide-react icons (Leaf, Clock, Heart, ShoppingBag/CheckCircle). Keep existing "Why Choose Us" section distinct - it uses Award/Heart/Clock/Sparkles with colored gradient backgrounds.

---

## Implementation Steps

- [ ] 1. **Add displayOrder field to product service and validation**
      Modify `server/src/services/productService.js`:
      - Add `displayOrder` field (default: 999) to `sanitizeProduct()` function in both create and update paths
      - Ensure displayOrder is a number >= 0, fallback to 999 if invalid
      - Update `getAll()` method to sort by `displayOrder` ASC, then `createdAt` DESC
      Files: `server/src/services/productService.js`
      Verify: Run `npm run dev:server` and check server starts without errors. Test GET /api/products endpoint manually or via browser DevTools.

- [ ] 2. **Update ProductFormModal to include displayOrder input field**
      Modify `client/src/admin/components/ProductFormModal.jsx`:
      - Add `displayOrder` field to formData state (default: 999)
      - Add number input for displayOrder after the "Product Name" field
      - Include label "Display Order" with helper text "(Lower numbers appear first on homepage)"
      - Set input attributes: type="number", min="0", step="1"
      Files: `client/src/admin/components/ProductFormModal.jsx`
      Verify: Run `npm run dev:client`, navigate to admin products page, open product form modal, and confirm displayOrder input appears and accepts numbers.

- [ ] 3. **Update HomePage to show first 6 products by displayOrder**
      Modify `client/src/pages/HomePage.jsx`:
      - Products are already limited to 6 via API call `getProducts({ featured: true, available: true, limit: 6 })`
      - No code change needed - backend sorting by displayOrder will automatically affect order
      - Only verification needed
      Files: No changes required (backend sorting handles this)
      Verify: Run `npm run dev` (both client and server), open homepage in browser at http://localhost:5173, confirm featured products appear (order will be by displayOrder once step 1 is complete).

- [ ] 4. **Update MenuPage to display all products sorted by displayOrder**
      Modify `client/src/pages/MenuPage.jsx`:
      - MenuPage already fetches all products via `getProducts()` and applies client-side sorting
      - Backend now sorts by displayOrder (from step 1), but MenuPage has client-side sort overriding it
      - Keep existing sort dropdown options but update default sort to respect backend order when sortBy === 'name'
      - Update filteredProducts logic: when sortBy === 'name', maintain the order from backend (already sorted by displayOrder + createdAt)
      Files: `client/src/pages/MenuPage.jsx`
      Verify: Run `npm run dev`, navigate to /menu, confirm products display in displayOrder ascending (when "Name" sort is selected).

- [ ] 5. **Replace "Build Your Perfect Bowl" section with benefits section on HomePage**
      Modify `client/src/pages/HomePage.jsx`:
      - Locate the "Build Your Perfect Bowl" section (starts around line 230)
      - Replace entire section with new "Why Choose Healthy Oats?" section
      - Import new icons from lucide-react: `Leaf`, `CheckCircle` (add to existing imports)
      - Create 3-4 benefit cards with structure:
        * Fresh & Natural - Leaf icon, green color scheme
        * Made to Order - Clock icon (already imported), orange color scheme  
        * Nutritious & Healthy - Heart icon (already imported), red/pink color scheme
        * Quality Ingredients - CheckCircle icon, blue color scheme
      - Use similar card styling as existing sections (rounded-2xl, shadow-lg, hover effects)
      - Keep this section DISTINCT from existing "Why Choose Us" section (which stays unchanged)
      Files: `client/src/pages/HomePage.jsx`
      Verify: Run `npm run dev:client`, navigate to homepage, scroll to where "Build Your Perfect Bowl" was, confirm new benefits section appears with proper icons and styling.

- [ ] 6. **Test complete feature set**
      Full integration testing:
      - Start both server and client: `npm run dev`
      - Admin workflow: Login to admin, create/edit product with displayOrder values (e.g., product A with order 1, product B with order 5, product C with order 3)
      - Homepage: Verify first 6 products appear in displayOrder ascending (A, C, B based on example)
      - Menu page: Verify all products appear in displayOrder ascending when sorted by "Name"
      - Benefits section: Verify new section appears on homepage with correct icons and content
      Files: N/A (integration testing)
      Verify: Manual testing checklist above passes. Run `npm run build:client` to ensure no build errors.

- [ ] 7. **Commit and push changes to GitHub**
      Git operations:
      - Stage specific files modified in steps 1, 2, 4, and 5
      - Create commit with message: "Final updates: product display order and improved homepage benefits section"
      - Push to origin (current branch)
      Files: All modified files from previous steps
      Verify: Run `git status` to confirm clean working tree after push. Check GitHub repository to confirm commit appears.

---

## Notes

- **Firebase/Firestore**: This project uses Firebase (not Mongoose/MongoDB). Product data is stored as documents with flexible schemas. The `displayOrder` field will be added to the document structure.
- **No schema file**: Unlike MongoDB/Mongoose projects, there's no separate schema file. Product structure is defined implicitly in `productService.js` sanitization logic.
- **Existing products**: Products created before this update won't have displayOrder field. The service layer handles this with a default value (999) during sorting, so they appear after explicitly ordered products.
- **Testing**: The project has test scripts configured but verification focuses on manual testing and build validation since we're adding a simple field and UI changes.
