
# Titania E-Commerce - Architecture Documentation

## 📋 Table of Contents

- [General Description](#general-description)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture - Clean Architecture](#architecture---clean-architecture)
- [Folder Structure](#folder-structure)
- [Coding Patterns](#coding-patterns)
- [Data Flow](#data-flow)
- [Configuration Guide](#configuration-guide)
- [Available Commands](#available-commands)

---

## 📌 General Description

**Titania E-Commerce** is a modern e-commerce application built with Clean Architecture that implements Domain-Driven Design patterns. The project follows SOLID principles to ensure maintainable, scalable, and testable code.

**Main Features:**
- 🛍️ Product catalog with category filtering
- 🛒 Functional shopping cart
- 💳 Payment gateway integration (Mercado Pago)
- 👤 User management
- ⭐ Rating and comments system
- 📱 Responsive interface with Tailwind CSS

---

## 🛠️ Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Frontend Framework** | Next.js | 16.1.6 |
| **Language** | TypeScript | 5.x |
| **Runtime** | Node.js | - |
| **Database** | PostgreSQL | - |
| **ORM** | Prisma | 7.4.1 |
| **Styles** | Tailwind CSS | 4.x |
| **UI Components** | Radix UI | 1.4.3 |
| **Carousel** | Embla Carousel | 8.6.0 |
| **Icons** | Lucide React | 0.563.0 |
| **Package Manager** | npm | - |

---

## 🏗️ Project Structure

```
titania-e-commerce/
│
├── app/                          # Next.js App Router - Pages and layouts
│   ├── (store)/                  # Route group for store routes
│   │   ├── layout.tsx            # Store general layout
│   │   ├── page.tsx              # Main page
│   │   ├── cart/
│   │   │   └── page.tsx          # Cart page
│   │   ├── checkout/
│   │   │   └── page.tsx          # Checkout page
│   │   ├── product/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Product detail page
│   │   └── shop/
│   │       ├── page.tsx          # Shop page
│   │       └── components/
│   │           └── hero-carousel/ # Store hero carousel
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── components/                   # Reusable React components
│   ├── layout/
│   │   ├── footer.tsx            # Footer
│   │   ├── header.tsx            # Header
│   │   └── navbar.tsx            # Navigation bar
│   ├── product/                  # Product-related components
│   │   ├── price.tsx             # Price component
│   │   ├── product-card.tsx      # Product card
│   │   ├── product-comments.tsx  # Product comments
│   │   ├── productImageCarousel.tsx # Image carousel
│   │   └── rating.tsx            # Rating component
│   └── ui/                       # Base/primitive UI components
│       ├── button.tsx            # Custom button
│       └── carousel.tsx          # Base carousel
│
├── application/                  # Application Layer - Use Cases
│   └── use-cases/                # Business logic use cases
│       ├── get-products.ts       # UC: Get product list
│       ├── get-product-by-slug.ts # UC: Get product by slug
│       └── ...                   # Other use cases
│
├── domain/                       # Domain Layer - Entities and abstractions
│   ├── product/                  # Product domain
│   │   ├── entities/
│   │   │   ├── product.ts        # Product entity
│   │   │   ├── image.ts          # ProductImage entity
│   │   │   └── category.ts       # Category entity
│   │   ├── modules/
│   │   │   └── product/
│   │   ├── repositories/
│   │   │   └── product/
│   │   │       └── product-repository.ts # Repository interface
│   │   └── service/
│   │       └── product.service.ts # Product business logic service
│   ├── cart/                     # Cart domain
│   │   ├── entities/
│   │   │   ├── cart.ts           # Cart entity
│   │   │   ├── cartItem.ts       # CartItem entity
│   │   │   └── cartStatus.ts     # Cart status
│   │   └── repositories/
│   │       └── cart-repository.ts # Repository interface
│   ├── user/                     # User domain
│   │   ├── entities/
│   │   │   ├── user.ts           # User entity
│   │   │   ├── address.ts        # Address entity
│   │   │   ├── comment.ts        # Comment entity
│   │   │   └── role.ts           # Role enum
│   │   └── repository/
│   │       └── user-repository.ts # Repository interface
│   └── providers/
│       └── payment-provider.ts    # Abstract payment provider interface
│
├── infrastructure/               # Infrastructure Layer - Implementations
│   ├── providers/
│   │   └── mercado-pago-provider.ts # Mercado Pago implementation
│   └── repositories/
│       └── product-repository-mock.ts # Mock repository implementation
│
├── lib/                          # Utilities and configuration
│   ├── theme.ts                  # Theme configuration
│   └── utils.ts                  # Utility functions
│
├── prisma/                       # Prisma configuration and schema
│   ├── prisma.config.ts          # Prisma configuration
│   ├── schema.prisma             # Database model definition
│   └── migrations/               # Database migration history
│
├── public/                       # Static public files
│
├── .eslintrc.mjs                 # ESLint configuration
├── components.json               # Components configuration
├── eslint.config.mjs             # Additional ESLint configuration
├── next.config.ts                # Next.js configuration
├── next-env.d.ts                 # Types generated by Next.js
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # This file

```

---

## 🏛️ Architecture - Clean Architecture

This project implements **Clean Architecture** (Clean Code Architecture) that organizes code into independent layers:

### Layer Structure

```
┌─────────────────────────────────────────┐
│       PRESENTATION (UI)                 │
│  Components, Pages (app/), Layouts      │
├─────────────────────────────────────────┤
│       APPLICATION LAYER                 │
│    Use Cases, Orchestration             │
├─────────────────────────────────────────┤
│        DOMAIN LAYER                     │
│   Entities, Interfaces, Value Objects   │
├─────────────────────────────────────────┤
│     INFRASTRUCTURE LAYER                │
│   DB, APIs, Concrete Implementations    │
└─────────────────────────────────────────┘
```

### Design Principles

1. **Framework Independence**: Domain doesn't depend on Next.js, Prisma, etc.
2. **Testability**: Each layer can be tested independently
3. **Maintainability**: Changes in one layer don't affect others
4. **Scalability**: Easy to add new features

---

## 📁 Folder Structure - Details

### `/app` - Next.js App Router & Pages
**Purpose**: Defines routes, layouts, and application pages.

**What goes here?**
- Next.js routes (Route Groups with `()` to organize)
- Global and local layouts
- Server Components by default
- Calls to application layer use cases
- Global styles

**Structure**:
```
app/
├── (store)/           # Route Group for store-related routes
├── api/              # API endpoints (if any)
├── layout.tsx        # Root layout - wraps entire app
├── page.tsx          # Home page
└── globals.css       # Global CSS styles
```

**Coding Patterns**:
- Use Server Components by default
- Use `'use client'` only when necessary (interactivity)
- Import components from `/components`
- Delegate logic to application layer

**Example**:
```typescript
// app/(store)/page.tsx
import { getProducts } from '@/application/use-cases/get-products'
import ProductCard from '@/components/product/product-card'

export default async function StorePage() {
  const products = await getProducts()
  
  return (
    <div>
      {products.map(p => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  )
}
```

---

### `/components` - Reusable React Components
**Purpose**: Independent visual components reusable across multiple pages.

**What goes here?**
- Components with no (or minimal) business logic
- UI components (buttons, carousels, modals)
- Layout components (header, footer, navbar)
- Domain components (ProductCard, Rating)
- TypeScript-typed props

**What doesn't go here?**
- Complex business logic
- Direct API calls
- Global state management (except simple contexts)

**Internal Structure**:
```
components/
├── layout/       # Layout structure components
├── product/      # Product domain components
└── ui/          # Primitive/base components
```

**Coding Patterns**:
- Client Components with `'use client'` if they need interactivity
- Typed props: `type ComponentProps = { ... }`
- Descriptive and specific names
- Use Tailwind CSS for styles

**Example**:
```typescript
// components/product/product-card.tsx
'use client'

type ProductCardProps = {
  p: {
    id: number
    slug: string
    name: string
    price: number
    image: string[]
  }
}

export default function ProductCard({ p }: ProductCardProps) {
  return (
    <Link href={`/product/${p.slug}`}>
      <div className="border rounded-lg">
        <img src={p.image[0]} alt={p.name} />
        <h3>{p.name}</h3>
        <Price price={p.price} />
      </div>
    </Link>
  )
}
```

---

### `/application` - Use Cases & Business Logic
**Purpose**: Contains orchestrated business logic - use cases.

**What goes here?**
- **Use Cases**: Actions the user can perform
  - getProducts()
  - getProductBySlug()
  - createOrder()
  - addToCart()
- Repository and service orchestration
- Data transformation
- Business validations

**What doesn't go here?**
- Implementation details (DB, APIs)
- React components
- UI interface logic

**Structure**:
```
application/
└── use-cases/
    ├── get-products.ts
    ├── get-product-by-slug.ts
    ├── add-to-cart.ts
    └── create-order.ts
```

**Coding Patterns**:
- One function = One use case
- Descriptive names: `getProductBySlug()`, `createOrder()`
- Receive repositories as parameters (dependency injection)
- Return DTOs or domain entities
- No local state

**Example**:
```typescript
// application/use-cases/get-product-by-slug.ts
import { ProductRepository } from '@/domain/product/repositories/product/product-repository'

export async function getProductBySlug(
  slug: string,
  productRepository: ProductRepository
) {
  const product = await productRepository.findBySlug(slug)
  
  if (!product) {
    throw new Error('Product not found')
  }
  
  return product
}
```

---

### `/domain` - Entities, Interfaces & Business Rules
**Purpose**: Defines the business core, independent of technologies.

**What goes here?**
- **Entities**: Classes representing business concepts (Product, User, Cart)
- **Repository Interfaces**: Data access contracts
- **Value Objects**: Objects representing values (CartStatus, ProductImage)
- **Domain Services**: High-level business logic
- **Enums**: Fixed business values (CartStatus, UserRole)

**What doesn't go here?**
- Concrete database implementations
- Frameworks (Next.js, Express, etc.)
- UI or components
- Application logic

**Structure by domain**:
```
domain/
├── product/
│   ├── entities/          # Domain classes
│   ├── repositories/      # Interfaces (contracts)
│   ├── service/          # Domain logic
│   └── modules/          # Specialized modules
├── cart/
│   ├── entities/
│   └── repositories/
├── user/
│   ├── entities/
│   └── repository/
└── providers/
    └── payment-provider.ts # Abstract interface
```

**Coding Patterns - Entities**:
- Classes with constructor
- Public read-only properties (`readonly`)
- Methods to manipulate state
- No external dependencies

**Example - Entity**:
```typescript
// domain/product/entities/product.ts
export class Product {
  public readonly slug: string

  constructor(
    public readonly id: number,
    public readonly name: string,
    public price: number,
    public images: ProductImage[],
    public readonly category: string,
    public readonly desc: string,
    public stock: number,
    public inStock: boolean,
    public rating?: number
  ) {
    this.slug = Product.toSlug(name)
  }

  setInStock() {
    this.inStock = this.stock > 0
  }

  static toSlug(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, '-')
  }
}
```

**Coding Patterns - Repositories (Interfaces)**:
- Define contracts only (methods without implementation)
- Database technology agnostic
- Methods named by CRUD operation

**Example - Repository Interface**:
```typescript
// domain/product/repositories/product/product-repository.ts
import { Product } from '@/domain/product/entities/product'

export interface ProductRepository {
  findAll(): Promise<Product[]>
  findById(id: number): Promise<Product | null>
  findBySlug(slug: string): Promise<Product | null>
  findByCategory(category: string): Promise<Product[]>
  addProduct(product: Product): Promise<void>
  updateProduct(product: Product): Promise<void>
  deleteProduct(id: number): Promise<void>
}
```

---

### `/infrastructure` - Concrete Implementations
**Purpose**: Specific technical implementations of domain interfaces.

**What goes here?**
- **Concrete Repositories**: Implement domain interfaces
  - ProductRepository with Prisma
  - UserRepository with real DB
  - Mocks for testing
- **Service Providers**: External integrations
  - MercadoPago for payments
  - Email providers
  - SMS providers
- **Technical configurations**: DB connections, APIs, etc.

**What doesn't go here?**
- High-level business logic
- Entity definitions
- React components

**Structure**:
```
infrastructure/
├── providers/
│   └── mercado-pago-provider.ts  # PaymentProvider implementation
└── repositories/
    └── product-repository-mock.ts # Mock for development
```

**Coding Patterns**:
- Implement domain interfaces
- Can use external libraries (Prisma, axios, etc.)
- One class = One responsibility
- Dependency injection

**Example**:
```typescript
// infrastructure/repositories/product-repository-mock.ts
import { ProductRepository } from '@/domain/product/repositories/product/product-repository'
import { Product } from '@/domain/product/entities/product'

export class ProductRepositoryMock implements ProductRepository {
  private products: Product[] = [
    new Product(1, "Shirt", 56900, [...], "shirts", "desc", 10, true),
    // more products...
  ]

  async findAll(): Promise<Product[]> {
    return this.products
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.products.find(p => p.slug === slug) || null
  }

  // ... other methods
}
```

---

### `/lib` - Utilities and Configuration
**Purpose**: Utility functions and common configurations.

**What goes here?**
- Helper functions (`utils.ts`)
- Theme configuration (`theme.ts`)
- Constants
- Format helpers
- Validation functions

**Example**:
```typescript
// lib/utils.ts
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}
```

---

### `/prisma` - ORM Configuration
**Purpose**: Database schema and migrations.

**Important Files**:
- `schema.prisma`: Model and relationship definition
- `migrations/`: Database change history
- `prisma.config.ts`: Specific configurations

---

## 🎯 Coding Patterns

### TypeScript
- **Type-safe** code: All variables and functions must have types
- Don't use `any`
- Prefer interfaces over simple types for complex objects

```typescript
// ✅ Correct
interface Product {
  id: number
  name: string
  price: number
}

// ❌ Avoid
const product: any = { id: 1, name: 'Shirt' }
```

### Naming Conventions
- **Files**: kebab-case (`product-card.tsx`, `get-products.ts`)
- **Folders**: kebab-case (`/product-card`, `/use-cases`)
- **Variables/Functions**: camelCase (`getProducts`, `productCard`)
- **Classes/Interfaces**: PascalCase (`Product`, `ProductRepository`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS = 10`)

```typescript
// Variables and functions
const maxPrice = 1000
function getProductBySlug(slug: string) { }

// Classes and interfaces
class Product { }
interface ProductRepository { }

// Constants
const API_TIMEOUT = 5000
```

### Imports
- Use `@/` alias (configured in `tsconfig.json`)
- Group imports: external libraries, then local
- Alphabetical order

```typescript
// ✅ Correct
import { useState } from 'react'
import Link from 'next/link'

import { Product } from '@/domain/product/entities/product'
import { getProducts } from '@/application/use-cases/get-products'
import ProductCard from '@/components/product/product-card'

// ❌ Avoid
import ProductCard from './components/product/product-card'
import { getProducts } from './application/use-cases/get-products'
```

### React Components
- Prefer **functional components**
- Explicit typed props
- `'use client'` only when necessary

```typescript
// ✅ Correct
'use client'

type ProductCardProps = {
  product: Product
  onSelect: (id: number) => void
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button onClick={() => onSelect(product.id)}>
      {product.name}
    </button>
  )
}

// ❌ Avoid
export default function ProductCard(props: any) {
  return <div>{props.product}</div>
}
```

### Async/Await
- Prefer async/await over .then()
- Always handle errors

```typescript
// ✅ Correct
try {
  const product = await getProductBySlug(slug)
  return product
} catch (error) {
  throw new Error(`Product not found: ${error}`)
}

// ❌ Avoid
getProductBySlug(slug).then(product => product)
```

### CSS with Tailwind
- Use Tailwind classes
- Avoid inline CSS
- Organize classes: layout → spacing → colors → effects

```typescript
// ✅ Correct
<div className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
  {/* content */}
</div>

// ❌ Avoid
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  {/* content */}
</div>
```

---

## 📊 Data Flow

### Typical Request Flow

```
1. User accesses /product/[slug]
                           ↓
2. Next.js loads page (app/(store)/product/[slug]/page.tsx)
                           ↓
3. Page calls getProductBySlug(slug, repository)
   (application/use-cases/get-product-by-slug.ts)
                           ↓
4. Use case calls repository.findBySlug(slug)
   (repository is injected as parameter)
                           ↓
5. Implemented repository retrieves data from DB
   (infrastructure/repositories/product-repository-mock.ts)
                           ↓
6. Returns Product entity
   (domain/product/entities/product.ts)
                           ↓
7. Page receives Product and passes to components
                           ↓
8. Components render the UI
   (components/product/product-card.tsx, etc.)
                           ↓
9. HTML is sent to browser
```

### Complete Flow Example

**1. URL**: User opens `/product/bershka-shirt`

**2. Page** (`app/(store)/product/[slug]/page.tsx`):
```typescript
import { getProductBySlug } from '@/application/use-cases/get-product-by-slug'
import { ProductRepositoryMock } from '@/infrastructure/repositories/product-repository-mock'
import ProductDetail from '@/components/product/product-detail'

type PageProps = { params: { slug: string } }

export default async function ProductPage({ params }: PageProps) {
  const repository = new ProductRepositoryMock()
  const product = await getProductBySlug(params.slug, repository)
  
  return <ProductDetail product={product} />
}
```

**3. Use Case** (`application/use-cases/get-product-by-slug.ts`):
```typescript
import { Product } from '@/domain/product/entities/product'
import { ProductRepository } from '@/domain/product/repositories/product/product-repository'

export async function getProductBySlug(
  slug: string,
  repository: ProductRepository
): Promise<Product> {
  const product = await repository.findBySlug(slug)
  
  if (!product) {
    throw new Error(`Product with slug "${slug}" not found`)
  }
  
  return product
}
```

**4. Repository** (`infrastructure/repositories/product-repository-mock.ts`):
```typescript
async findBySlug(slug: string): Promise<Product | null> {
  return this.products.find(p => p.slug === slug) || null
}
```

**5. Entity** (`domain/product/entities/product.ts`):
```typescript
export class Product {
  public readonly slug: string
  
  constructor(
    public readonly id: number,
    public readonly name: string,
    public price: number,
    // ... more properties
  ) {
    this.slug = Product.toSlug(name)
  }
}
```

**6. Component** (`components/product/product-detail.tsx`):
```typescript
type ProductDetailProps = {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  return (
    <div className="p-8">
      <h1>{product.name}</h1>
      <Price price={product.price} />
      {/* more content */}
    </div>
  )
}
```

---

## ⚙️ Configuration Guide

### Initial Setup

**1. Environment variables** (create `.env.local`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/titania_db"
NEXT_PUBLIC_API_URL="http://localhost:3000"
MERCADO_PAGO_KEY="your_mercado_pago_key"
```

**2. Database with Prisma**:
```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Populate initial data (if exists)
```

**3. Install dependencies**:
```bash
npm install
```

### TypeScript Alias
Configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Enables: `import { Product } from '@/domain/product/entities/product'`

---

## 🚀 Available Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)

# Production
npm run build        # Build the application
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint

# Prisma
npx prisma generate  # Generate Prisma client
npx prisma migrate   # Create/run migrations
npx prisma studio   # Open database GUI
```

---

## 📝 Commit Conventions

Use Conventional Commits:
```
feat: add new feature
fix: fix a bug
docs: documentation changes
style: formatting changes, no logic changes
refactor: refactor code
perf: performance improvements
test: add or update tests
```

Example:
```
feat: add shopping cart
fix: correct product price in product-card
docs: update README
```

---

## 🔍 Golden Rules

1. **Unidirectional dependencies**: app → application → domain ← infrastructure
2. **Never import from domain into infrastructure** (implementations depend on domain)
3. **Domain should have no external dependencies** (no Prisma, Next.js, etc.)
4. **Components without business logic** - delegate to application
5. **Use cases are orchestrators** - coordinate repositories and services
6. **Repositories in infrastructure** - implement domain interfaces

---

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Last Updated**: March 8, 2026
>>>>>>> 588dc33 (initial commit)
