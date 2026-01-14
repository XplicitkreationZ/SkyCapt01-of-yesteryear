# Xplicit Delivery - Product Requirements Document

## Original Problem Statement
E-commerce website for XplicitkreationZ that pivoted from a THCA flower store to **Xplicit Delivery** - a local delivery logistics platform for hemp-derived consumables and smoke shop accessories in Texas.

## Core Business Model
- **Delivery-only** service (no physical storefront)
- Courier-based delivery using services like Uber Connect
- 40-mile radius from Austin, TX (78751)
- 21+ age verification required
- Texas-only delivery

## Key Features

### ✅ Implemented
- **Product Catalog** - Multi-category product listing with:
  - Consumables (hemp flower) with **strain sub-filters** (Hybrid, Sativa, Indica)
  - Accessories (rolling papers, wraps, cones, grinders)
  - Glass (pipes, bongs, bowls)
  - Nitrous (whip cream chargers, N2O tanks)
  - **Category Filter Tabs** - Quick filtering by product category with counts
  - **Strain Sub-Filters** - Appears when Consumables selected (Hybrid/Sativa/Indica)
  - **Search Bar** - Real-time search across product names, brands, descriptions
- **Product Detail Pages** - Cloud Supply-style layout with:
  - Large product images
  - Brand/category badges
  - Quantity selector
  - Add to Cart with dynamic pricing
  - Description and Product Details tabs
  - Related products
- **Shopping Cart** - Full cart functionality with quantity management
- **Delivery Quote System** - Distance-based tiered fees:
  - 0-10mi: $7 fee, $25 minimum
  - 10-25mi: $12 fee, $50 minimum
  - 25-40mi: $18 fee, $75 minimum
- **Age Gate** - 21+ verification modal
- **About Page** - Updated content for Xplicit Delivery business model
- **FAQ Page** - Comprehensive delivery FAQs
- **Legal Disclaimers** - FDA disclosure, hemp compliance info

### 🟡 Mocked (MVP Phase)
- Payment processing (Stripe integration planned)
- ID verification at delivery
- Uber Direct API integration for courier dispatch
- Order notifications (email/SMS)

### 📋 Upcoming Tasks (P0-P3)
1. **(P0) Dispatcher Console** - Admin order management
2. **(P1) COA Upload** - Certificate of Analysis per product
3. **(P2) Order Notifications** - Mock email/SMS triggers
4. **(P3) Real Product Pricing** - Replace placeholder prices

### 🔮 Future/Backlog
- Real payment gateway (Stripe)
- Third-party ID verification service
- Uber Direct API integration
- Subscription delivery feature
- Private courier network management

## Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn/UI, react-router-dom
- **Backend:** FastAPI, Motor (async MongoDB)
- **Database:** MongoDB

## Key Files
- `/app/backend/server.py` - All API routes, models, seeding
- `/app/frontend/src/App.js` - Main router, layout, components
- `/app/frontend/src/pages/ProductDetail.js` - Product detail page
- `/app/frontend/src/pages/About.js` - About page content
- `/app/frontend/src/pages/CartPage.js` - Cart with delivery quotes
- `/app/frontend/src/pages/FAQ.js` - FAQ content

## API Endpoints
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Single product detail
- `POST /api/delivery/quote` - Calculate delivery fee
- `POST /api/orders/delivery` - Create mock order
- `POST /api/admin/seed-*` - Product seeding endpoints

## Database Collections
- `products` - Product catalog
- `delivery_orders` - Order records
- `waitlist` - Email signups

---
**Last Updated:** December 2025
**Domain:** xplicitkreationz.com
