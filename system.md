# System Architecture - Titania E-Commerce

## 📚 Introduction

This document complements `README.md` with internal technical details about the Titania E-Commerce system architecture.

---

## 🔗 Dependencies Between Layers

### Dependency Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│     Pages (app/), Components, Layouts, Next.js Routes      │
│                                                             │
│  ✓ Uses: Use Cases from application/                       │
│  ✓ Uses: Components from components/                       │
│  ✗ NO direct imports from domain or infrastructure         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                           │
│           Use Cases (application/use-cases/)               │
│                                                             │
│  ✓ Uses: Entities and repositories from domain/            │
│  ✓ Orchestrates: Multiple repositories for complex cases   │
│  ✗ NO direct imports from presentation                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                            │
│  Entities, Repository Interfaces, Services, Value Objects  │
│                                                             │
│  ✓ Defines: Entities (Product, Cart, User)                 │
│  ✓ Defines: Repository interfaces (contracts)              │
│  ✓ Defines: Pure business logic                            │
│  ✗ NO imports from: application, infrastructure, frameworks│
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                           │
│    Concrete Implementations (Repositories, Providers)      │
│                                                             │
│  ✓ Implements: Interfaces from domain/                     │
│  ✓ Uses: External libraries (Prisma, Axios, etc.)         │
│  ✓ Accesses: Database, external APIs                       │
│  ✗ NO imports from: application, presentation             │
└─────────────────────────────────────────────────────────────┘
```

### Key Dependency Rule

```
app → application → domain ← infrastructure

Only infrastructure depends on domain, never the reverse.
```

---

## 🎯 Common Flow Examples

### 1. Get Product List

```
User opens /shop
         ↓
app/(store)/shop/page.tsx (Server Component)
         ↓
Creates instance: new ProductRepositoryMock()
         ↓
Calls: getProducts(repository)
         ↓
application/use-cases/get-products.ts
         ↓
repository.findAll()
         ↓
infrastructure/repositories/product-repository-mock.ts
         ↓
Returns Product[]
         ↓
Passes to: <ProductList products={products} />
         ↓
components/product/product-card.tsx (Client Component if interactive)
         ↓
Renders HTML
```

### 2. Add Product to Cart

```
User clicks "Add to Cart"
         ↓
components/product/add-to-cart-button.tsx (Client Component)
         ↓
Validates: Product, quantity, stock
         ↓
Calls: addToCart(productId, quantity, cartRepository)
         ↓
application/use-cases/add-to-cart.ts
         ↓
cartRepository.findByUser(userId)
         ↓
Gets current cart
         ↓
cartRepository.addItem(cartId, productId, quantity)
         ↓
infrastructure/repositories/cart-repository-mock.ts
         ↓
Updates cart
         ↓
Returns: Updated Cart
         ↓
Updates UI locally (component state)
         ↓
Show confirmation to user
```

---

## 📦 Main Entities

### Product Domain

**Files**:
- `domain/product/entities/product.ts` - Main class
- `domain/product/entities/image.ts` - Product images
- `domain/product/entities/category.ts` - Categories
- `domain/product/repositories/product/product-repository.ts` - Interface
- `domain/product/service/product.service.ts` - Domain logic

**Responsibilities**:
- Validate product data
- Calculate slug from name
- Update stock status (inStock)
- Validate ratings and comments

**Method Example**:
```typescript
class Product {
  static toSlug(name: string): string {
    // Converts "Bershka Shirt" → "bershka-shirt"
    return name
      .normalize("NFD")                    // Separates accents
      .replace(/[\u0300-\u036f]/g, "")    // Removes accents
      .toLowerCase()                       // Lowercase
      .replace(/\s+/g, '-')                // Spaces to dashes
  }
}
```

### Cart Domain

**Files**:
- `domain/cart/entities/cart.ts` - Main cart
- `domain/cart/entities/cartItem.ts` - Items in cart
- `domain/cart/entities/cartStatus.ts` - Possible states
- `domain/cart/repositories/cart-repository.ts` - Interface

**CartStatus Enum**:
```typescript
enum CartStatus {
  ACTIVE = "active",
  ABANDONED = "abandoned",
  CHECKED_OUT = "checked_out"
}
```

### User Domain

**Files**:
- `domain/user/entities/user.ts` - User
- `domain/user/entities/address.ts` - Address
- `domain/user/entities/comment.ts` - Comments
- `domain/user/entities/role.ts` - Roles (Admin, Customer, etc.)
- `domain/user/repository/user-repository.ts` - Interface

---

## 🔐 Providers - Abstract Interfaces

### PaymentProvider

**File**: `domain/providers/payment-provider.ts`

```typescript
export interface PaymentProvider {
  createPayment(order: Order, amount: number): Promise<PaymentResponse>
  verifyPayment(transactionId: string): Promise<boolean>
  refundPayment(transactionId: string): Promise<void>
}
```

**Implementation**: 
- `infrastructure/providers/mercado-pago-provider.ts` - Specific Mercado Pago

**Advantage**: To switch to Stripe, just implement the interface without touching application/domain.

---

## 📊 Use Cases by Area

### Product Use Cases
- `get-products.ts` - General list
- `get-product-by-slug.ts` - Detail by slug
- `get-products-by-category.ts` (potential)
- `search-products.ts` (potential)

### Cart Use Cases (potential)
- `add-to-cart.ts`
- `remove-from-cart.ts`
- `update-cart-item-quantity.ts`
- `clear-cart.ts`
- `get-cart.ts`

### Order Use Cases (potential)
- `create-order.ts`
- `process-payment.ts`
- `get-order-history.ts`

---

## 🗂️ Folder Structure - Rules

### `/domain` - Strict Structure

```
domain/
├── [entity]/                 # Per business concept
│   ├── entities/            # Domain classes
│   │   ├── [entity].ts      # Main class
│   │   └── [value-obj].ts   # Related value objects
│   ├── repositories/        # Data access interfaces
│   │   └── [entity]-repository.ts
│   ├── service/             # Domain services
│   │   └── [entity].service.ts
│   └── modules/             # Specialized submodules
└── providers/               # External service interfaces
    └── [service]-provider.ts
```

### `/application` - Clear Structure

```
application/
└── use-cases/
    ├── [action]-[entity].ts     # e.g.: add-to-cart.ts
    ├── get-[entities].ts         # For lists
    └── get-[entity]-by-[field].ts # For specific search
```

### `/infrastructure` - Grouped Implementations

```
infrastructure/
├── providers/               # Concrete implementations
│   ├── [service]-provider.ts
│   └── [service]-provider.impl.ts
└── repositories/           # ORMs, APIs, Mocks
    ├── [entity]-repository-mock.ts    # For development
    ├── [entity]-repository-prisma.ts  # For real DB
    └── [entity]-repository-api.ts     # For external APIs
```

---

## 🔄 Data Flow Patterns

### Server Component → Use Case

```typescript
// Server Component in app/
const product = await getProductBySlug(slug, new ProductRepositoryMock())

// Use Case:
export async function getProductBySlug(slug, repo) {
  const product = await repo.findBySlug(slug)
  if (!product) throw new Error('Not found')
  return product // Product Entity
}

// Pass to component:
<ProductDetail product={product} />
```

### Client Component → Event Handler

```typescript
'use client'

export default function AddToCartButton({ productId }) {
  async function handleClick() {
    const cart = await addToCart(productId, 1)
    setCart(cart) // Local state
    showNotification("¡Product added!")
  }
  
  return <button onClick={handleClick}>Add to Cart</button>
}
```

---

## 🏢 Dependency Injection

### Manual Pattern (Current)

```typescript
// In the page
const repository = new ProductRepositoryMock()
const product = await getProductBySlug(slug, repository)

// Advantages: Simple, explicit
// Disadvantages: Repetitive code in many pages
```

### Factory Pattern (Future)

```typescript
// factory.ts
export function createProductRepository(): ProductRepository {
  if (process.env.NODE_ENV === 'production') {
    return new ProductRepositoryPrisma()
  }
  return new ProductRepositoryMock()
}

// In the page
const repository = createProductRepository()
```

### DI Container Pattern (Scalable)

```typescript
// container.ts
class DIContainer {
  private services = new Map()
  
  register(name: string, factory: () => any) {
    this.services.set(name, factory)
  }
  
  get(name: string) {
    return this.services.get(name)()
  }
}

const container = new DIContainer()
container.register('productRepository', () => new ProductRepositoryMock())

// In the page
const repository = container.get('productRepository')
```

---

## 🧪 Testability

### Why This Architecture is Testable

**1. Domain is Pure (No Dependencies)**
```typescript
// Easy to test without complex mocks
test('Product.toSlug() converts name correctly', () => {
  const slug = Product.toSlug('Bershka Shirt')
  expect(slug).toBe('bershka-shirt')
})
```

**2. Repositories are Interchangeable**
```typescript
// Test with mock
test('getProductBySlug returns product', async () => {
  const mockRepo: ProductRepository = {
    findBySlug: jest.fn().mockResolvedValue(mockProduct)
  }
  
  const result = await getProductBySlug('test', mockRepo)
  expect(result).toBe(mockProduct)
})
```

**3. Components can be tested without backend**
```typescript
// Mock props
<ProductCard p={{
  id: 1,
  name: 'Test Product',
  price: 100,
  image: ['test.jpg'],
  slug: 'test'
}} />
```

---

## 📈 Scalability Future-Proof

### Adding New Functionality

**Topic**: Wishlist

1. **Domain** - Create entities:
```typescript
// domain/wishlist/entities/wishlist.ts
export class Wishlist {
  constructor(
    public id: number,
    public userId: number,
    public items: WishlistItem[]
  ) {}
}

// domain/wishlist/entities/wishlist-item.ts
export class WishlistItem {
  constructor(
    public productId: number,
    public addedAt: Date
  ) {}
}
```

2. **Domain** - Create interface:
```typescript
// domain/wishlist/repositories/wishlist-repository.ts
export interface WishlistRepository {
  findByUserId(userId: number): Promise<Wishlist | null>
  addItem(wishlistId: number, productId: number): Promise<void>
  removeItem(wishlistId: number, productId: number): Promise<void>
}
```

3. **Application** - Create use cases:
```typescript
// application/use-cases/add-to-wishlist.ts
export async function addToWishlist(
  userId: number,
  productId: number,
  wishlistRepository: WishlistRepository
) {
  const wishlist = await wishlistRepository.findByUserId(userId)
  if (!wishlist) throw new Error('Wishlist not found')
  
  await wishlistRepository.addItem(wishlist.id, productId)
}
```

4. **Infrastructure** - Implement repository:
```typescript
// infrastructure/repositories/wishlist-repository-mock.ts
export class WishlistRepositoryMock implements WishlistRepository {
  async findByUserId(userId: number): Promise<Wishlist | null> {
    // Mock implementation
  }
  // ... other methods
}
```

5. **Presentation** - Use in components:
```typescript
// components/product/add-to-wishlist-button.tsx
'use client'

export default function AddToWishlistButton({ productId, userId }) {
  async function handleClick() {
    const repo = new WishlistRepositoryMock()
    await addToWishlist(userId, productId, repo)
  }
  
  return <button onClick={handleClick}>♥ Wishlist</button>
}
```

---

## 🔍 Debugging Tips

### 1. Trace the Flow

```
Where is the error?
  ↓
Which layer? (app, application, domain, infrastructure)
  ↓
Read the files in that layer
  ↓
Check external dependencies
```

### 2. Use Console Log Strategically

```typescript
// In use case
export async function getProductBySlug(slug, repo) {
  console.log(`[USE-CASE] Getting product with slug: ${slug}`)
  
  const product = await repo.findBySlug(slug)
  console.log(`[USE-CASE] Found product:`, product)
  
  if (!product) {
    console.error(`[USE-CASE] Product not found for slug: ${slug}`)
    throw new Error('Product not found')
  }
  
  return product
}
```

### 3. Check Types at Compilation

```bash
npx tsc --noEmit  # Only checks, doesn't compile
```

---

## 📝 Additional Documentation

See `README.md` for:
- General project description
- Complete technology stack
- Configuration guide
- Available commands
- Code conventions

---

**Last Updated**: March 8, 2026
