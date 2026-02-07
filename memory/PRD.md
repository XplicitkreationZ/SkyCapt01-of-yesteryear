# Xplicit Delivery - Product Requirements Document

## Original Problem Statement
E-commerce website for XplicitkreationZ that pivoted from a THCA flower store to **Xplicit Delivery** - a local delivery logistics platform for hemp-derived consumables and smoke shop accessories in Texas.

## Core Business Model
- **Delivery-only** service (no physical storefront)
- Courier-based delivery using services like Uber Connect
- 40-mile radius from Austin, TX (78751)
- 21+ age verification required with **mandatory ID upload**
- Texas-only delivery

## Key Features

### ✅ Implemented
- **Product Catalog** - Multi-category product listing with:
  - Consumables (hemp flower) with **product type sub-filters** (Flower, Pre-Rolls) and **strain sub-filters** (Hybrid, Sativa, Indica)
  - Accessories (rolling papers, wraps, cones, grinders)
  - Glass (pipes, bongs, bowls)
  - Nitrous (whip cream chargers, N2O tanks)
  - Kratom products
  - **Category Filter Tabs** - Quick filtering by product category with counts
  - **Product Type Sub-Filters** - Appears when Consumables selected (Flower/Pre-Rolls)
  - **Strain Sub-Filters** - Shows strain type (Hybrid/Sativa/Indica) with dynamic counts
  - **Search Bar** - Real-time search across product names, brands, descriptions
- **Product Detail Pages** - Cloud Supply-style layout with:
  - Large product images with category badge
  - Brand/category badges
  - Quantity selector
  - **Variant/Strain Selector** - Color-coded strain options for pre-rolls (Hybrid/Sativa/Indica)
  - Add to Cart with dynamic pricing
  - Description and Product Details tabs
  - Related products section
- **Shopping Cart** - Full cart functionality with:
  - Quantity management
  - **Cart Persistence** - Items saved to localStorage, persist across page refreshes
  - Subtotal and delivery fee calculation
- **ID Verification System** - Mandatory 21+ age verification:
  - **ID Upload Required** - Must upload government ID (driver's license, state ID, passport)
  - File upload supports JPG, PNG, HEIC (max 10MB)
  - ID preview shown after upload
  - ID stored as base64 in order for dispatcher verification
- **Delivery Quote System** - Distance-based tiered fees:
  - 0-10mi: $7 fee, $25 minimum
  - 10-25mi: $12 fee, $50 minimum
  - 25-40mi: $18 fee, $75 minimum
- **Square Payment Integration** - Full payment processing:
  - Square Web Payments SDK on frontend
  - Square Python SDK on backend
  - Currently in **SANDBOX mode** (test card: 4532 0151 1283 0366)
- **Dispatcher Console** (`/admin`) - Admin order management with:
  - Password-protected login (password: xplicit2024)
  - Stats dashboard (Pending, Confirmed, Dispatched, Delivered, Cancelled counts)
  - Order search by ID, customer name, or phone
  - Order cards showing customer info, address, items, total
  - **Payment Status badges** (Paid/Pending Payment)
  - **ID Verification View** - "View ID" button opens modal with customer ID image
  - Manual verification instructions with name/DOB matching
  - Status flow: Pending → Confirmed → Dispatched → Delivered
  - Cancel order functionality
- **Branding** - Updated header with "XplicitkreationZ" + "SMOKE SHOP DELIVERED" tagline
- **Responsive Mobile Header** - Hamburger menu for mobile navigation
- **Age Gate** - 21+ verification modal
- **About Page** - Content for Xplicit Delivery business model
- **FAQ Page** - Comprehensive delivery FAQs
- **Legal Disclaimers** - FDA disclosure, hemp compliance info

### 🟡 Partially Implemented
- **Square Payments** - Integrated but in SANDBOX mode (needs Production credentials)
- **ID Verification** - Manual verification by dispatcher (automated service planned)

### 📋 Upcoming Tasks (P0-P3)
1. **(P0) Add new products** - Kratom images provided by user
2. **(P1) Show variant on cart** - Display selected strain for pre-roll items in cart
3. **(P2) Finalize accessory prices** - RAW papers, Backwoods, grinders
4. **(P3) Switch Square to Production** - Update credentials for real payments
5. **(P4) COA Upload** - Certificate of Analysis per product
6. **(P5) Order Notifications** - Email/SMS triggers

### 🔮 Future/Backlog
- Third-party automated ID verification service
- Uber Direct API integration for automated dispatch
- Subscription delivery feature
- Private courier network management

## Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn/UI, react-router-dom, Square React SDK
- **Backend:** FastAPI, Motor (async MongoDB), Square Python SDK
- **Database:** MongoDB
- **Payments:** Square (Sandbox)

## Key Files
- `/app/backend/server.py` - All API routes, models, Square integration, seeding
- `/app/frontend/src/App.js` - Main router, layout, cart persistence
- `/app/frontend/src/pages/ProductDetail.js` - Product detail page
- `/app/frontend/src/pages/CartPage.js` - Cart with ID upload, delivery quotes, Square payment
- `/app/frontend/src/pages/DispatchConsole.js` - Admin order management with ID viewing
- `/app/frontend/src/pages/About.js` - About page content
- `/app/frontend/src/pages/FAQ.js` - FAQ content

## API Endpoints
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Single product detail
- `POST /api/delivery/quote` - Calculate delivery fee
- `POST /api/orders/delivery` - Create order (requires id_image)
- `POST /api/payments/square` - Process Square payment
- `GET /api/admin/orders` - Get all orders (includes id_image)
- `PATCH /api/admin/orders/{id}/status` - Update order status
- `POST /api/admin/seed-*` - Product seeding endpoints

## Database Collections
- `products` - Product catalog
- `delivery_orders` - Order records with id_image field
- `waitlist` - Email signups

## Credentials
- **Admin Console:** Password `xplicit2024`
- **Square Sandbox Test Card:** `4532 0151 1283 0366` (any future date, any CVC)

---
**Last Updated:** February 7, 2026
**Domain:** xplicitkreationz.xyz
