# E-Commerce Backend

A full-featured Node.js + Express + PostgreSQL e-commerce backend with authentication, products, cart, orders, reviews, admin panel, flash sales, and a loyalty points system.

## Features

### Core E-Commerce
- User registration & login (JWT authentication)
- Product catalog with categories, search, filtering, pagination
- Shopping cart (add, update, remove, clear)
- Wishlist
- Order placement & order history
- Product reviews & ratings
- Admin dashboard & product/user management

### Additional Features
- **Flash Sales** — time-limited discounted products
- **Loyalty Points & Rewards** — earn points on purchases, redeem for discounts
- Low-stock tracking
- Order status management

## Tech Stack
- Node.js + Express
- PostgreSQL (via `pg` / Supabase)
- bcryptjs (password hashing)
- jsonwebtoken (auth)
- express-validator (validation)
- dotenv

## Database Configuration

Update `.env` with your Supabase credentials:

```
DB_HOST=db.gtrmagfswoxmsipkyeje.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR-DATABASE-PASSWORD
```

## Setup

```bash
# Install dependencies
npm install

# Initialize database tables and seed data
npm run init-db

# Start development server
npm run dev

# Start production server
npm start
```

## Default Admin Account
- Email: `admin@ecommerce.com`
- Password: `admin123`

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List products (filter/paginate) | No |
| GET | `/api/products/featured` | Featured products | No |
| GET | `/api/products/:id` | Get product detail | No |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |

### Categories
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List categories | No |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Deactivate category | Admin |

### Cart
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Get cart | Yes |
| POST | `/api/cart` | Add to cart | Yes |
| PUT | `/api/cart/:id` | Update cart item | Yes |
| DELETE | `/api/cart/:id` | Remove from cart | Yes |
| DELETE | `/api/cart` | Clear cart | Yes |

### Wishlist
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/wishlist` | Get wishlist | Yes |
| POST | `/api/wishlist` | Add to wishlist | Yes |
| DELETE | `/api/wishlist/:id` | Remove from wishlist | Yes |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders` | My orders | Yes |
| GET | `/api/orders/:id` | Order detail | Yes |
| GET | `/api/orders/admin` | All orders | Admin |
| PUT | `/api/orders/:id/status` | Update order status | Admin |

### Reviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products/:id/reviews` | Product reviews | No |
| POST | `/api/products/:id/reviews` | Create review | Yes |

### Flash Sales
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/flash-sales` | Active flash sales | No |
| POST | `/api/flash-sales` | Create flash sale | Admin |

### Loyalty
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/loyalty/profile` | Loyalty points & tier | Yes |
| GET | `/api/loyalty/transactions` | Points history | Yes |
| GET | `/api/loyalty/rewards` | Available rewards | Yes |
| POST | `/api/loyalty/redeem` | Redeem a reward | Yes |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

## Additional Feature: Loyalty Points & Rewards

Customers earn **1 point per $10 spent** on every order. Points can be redeemed for rewards:

- Welcome Bonus: 100 points → $5 off
- Silver Member: 500 points → 10% off
- Gold Member: 1500 points → 20% off
- Platinum Member: 3000 points → 30% off

Points are tracked in `loyalty_transactions` for full transparency.

## License
MIT
