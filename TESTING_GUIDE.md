# 🧪 TapNova Networks - Complete Testing Guide

## ✅ Publisher Account Setup

**Publisher Account Created & Approved:**
- **Email:** `legendrycoypgamers@gmail.com`
- **Status:** `approved` ✅
- **Password:** Use your existing password (or reset via forgot password)

---

## 📍 Complete Route List

### 🔐 Authentication Routes

| Route | Method | Description | Access |
|-------|--------|-------------|--------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth authentication handler | Public |
| `/api/auth/publisher-signup` | POST | Publisher registration | Public |
| `/api/reset-password` | POST | Password reset request | Public |
| `/api/user-info` | GET | Get current user info | Authenticated |

**Frontend Pages:**
- `/auth/login` - Login page (admin & publisher)
- `/auth/signup` - Publisher signup page
- `/auth/admin/login` - Admin login page
- `/forgot-password` - Password reset page

---

### 👤 Publisher Routes (Protected)

#### Dashboard & Pages
| Route | Description | Access |
|-------|-------------|--------|
| `/publisher/dashboard` | Publisher dashboard with stats | Publisher |
| `/publisher/offers` | View available offers | Publisher |
| `/publisher/smartlinks` | Manage smartlinks | Publisher |
| `/publisher/reports` | View reports & analytics | Publisher |
| `/publisher/track` | Track clicks & conversions | Publisher |

#### API Endpoints
| Route | Method | Description |
|-------|--------|-------------|
| `/api/publishers/offers` | GET | Get offers for publisher |
| `/api/publishers/coupons` | GET | Get coupons for publisher |
| `/api/publishers/postback` | GET, POST | Publisher postback configuration |
| `/api/publisher/id` | GET | Get publisher ID |
| `/api/smartlink/create` | POST | Create a smartlink |
| `/api/track/click` | POST | Track a click |
| `/api/track/convert` | POST | Track a conversion |
| `/api/track/display` | GET | Track offer display |

---

### 👨‍💼 Admin Routes (Protected)

#### Dashboard & Pages
| Route | Description | Access |
|-------|-------------|--------|
| `/admin/dashboard` | Admin dashboard | Admin |
| `/admin/dashboard/documentation` | API documentation | Admin |

#### Admin API Endpoints

**Dashboard & Analytics:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/dashboard` | GET | Admin dashboard stats |
| `/api/admin/dashboard/aggregate` | GET | Aggregate statistics |

**Publisher Management:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/publishers` | GET | List all publishers |
| `/api/admin/publishers/[id]` | PATCH | Update publisher status |
| `/api/admin/publisher` | GET | Get publisher details |

**Admin Management:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/admins` | GET, POST | List/create admins |
| `/api/admin/admins/[id]` | GET, PATCH, DELETE | Manage admin |
| `/api/admin/admins/[id]/password` | PATCH | Change admin password |

**Offer Management:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/offers` | GET, POST | List/create offers |
| `/api/admin/offers/[id]` | GET, PATCH, DELETE | Manage offer |
| `/api/admin/offers/add` | POST | Add new offer |
| `/api/admin/offer_publishers/by-offer` | GET | Get publishers for offer |
| `/api/admin/offer_publishers/commission` | POST | Set commission rates |

**Link Management:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/links/add` | POST | Add tracking link |
| `/api/admin/links/delete` | DELETE | Delete tracking link |

**Smartlink Management:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/smartlinks` | GET | List smartlinks |
| `/api/admin/smartlinks/[id]` | GET, PATCH | Manage smartlink |
| `/api/admin/smartlinks/[id]/status` | PATCH | Update smartlink status |

**Coupon Management:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/coupons` | GET | List coupons |
| `/api/admin/coupons/add` | POST | Add coupon |
| `/api/admin/coupons/[id]` | GET, PATCH, DELETE | Manage coupon |
| `/api/admin/coupons/[id]/status` | PATCH | Update coupon status |

**Other Admin Features:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/profile` | GET, PATCH | Admin profile |
| `/api/admin/profile/password` | PATCH | Change password |
| `/api/admin/postback` | GET, POST | Postback configuration |
| `/api/admin/smtp` | GET, POST | SMTP settings |

---

### 🌐 Public Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Home/landing page |
| `/home` | GET | Home page |
| `/api/offers/display` | GET | Display offers (public) |
| `/api/offers/top` | GET | Top offers |
| `/api/offers/coupons` | GET | Get coupons for offer |
| `/api/postback` | POST | Postback handler |
| `/api/webhook/conversion` | POST | Webhook for conversions |

---

## 🧪 Testing Workflow

### Step 1: Start the Development Server

```bash
cd heromedianetworks
npm run dev
```

The app will be available at `http://localhost:3000`

---

### Step 2: Test Publisher Login

1. **Navigate to:** `http://localhost:3000/auth/login`
2. **Select:** "Publisher" as login type
3. **Enter credentials:**
   - Email: `legendrycoypgamers@gmail.com`
   - Password: (your existing password)
4. **Expected:** Redirect to `/publisher/dashboard`

---

### Step 3: Test Publisher Dashboard Features

#### 3.1 Dashboard Overview
- **Route:** `/publisher/dashboard`
- **Test:**
  - View statistics (clicks, conversions, revenue)
  - Check charts and graphs
  - Verify data loading

#### 3.2 View Offers
- **Route:** `/publisher/offers`
- **Test:**
  - View available offers
  - Filter offers by status
  - Check offer details

#### 3.3 Create Smartlink
- **Route:** `/publisher/smartlinks`
- **Test:**
  - Create a new smartlink
  - View existing smartlinks
  - Check smartlink status

#### 3.4 View Reports
- **Route:** `/publisher/reports`
- **Test:**
  - View click reports
  - View conversion reports
  - Filter by date range
  - Export reports (if available)

#### 3.5 Track Clicks
- **Route:** `/publisher/track`
- **Test:**
  - Generate tracking links
  - Test click tracking
  - View tracking data

---

### Step 4: Test Publisher API Endpoints

#### 4.1 Get Offers
```bash
curl -X GET http://localhost:3000/api/publishers/offers \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### 4.2 Get Coupons
```bash
curl -X GET http://localhost:3000/api/publishers/coupons \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### 4.3 Create Smartlink
```bash
curl -X POST http://localhost:3000/api/smartlink/create \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"offer_id": 1}'
```

#### 4.4 Track Click
```bash
curl -X POST http://localhost:3000/api/track/click \
  -H "Content-Type: application/json" \
  -d '{
    "pub_id": "YOUR_PUBLISHER_ID",
    "offer_id": 1,
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0"
  }'
```

---

### Step 5: Test Admin Dashboard (If you have admin access)

1. **Navigate to:** `http://localhost:3000/auth/admin/login`
2. **Login with admin credentials**
3. **Test Admin Features:**
   - View dashboard statistics
   - Manage publishers (approve/reject)
   - Create/edit offers
   - Manage coupons
   - Configure smartlinks
   - View reports

---

### Step 6: Test Public Routes

#### 6.1 View Public Offers
```bash
curl -X GET http://localhost:3000/api/offers/display
```

#### 6.2 Get Top Offers
```bash
curl -X GET http://localhost:3000/api/offers/top
```

#### 6.3 Get Coupons for Offer
```bash
curl -X GET http://localhost:3000/api/offers/coupons?offer_id=1
```

---

### Step 7: Test Postback/Webhook

#### 7.1 Postback Handler
```bash
curl -X POST http://localhost:3000/api/postback \
  -H "Content-Type: application/json" \
  -d '{
    "click_id": "uuid-here",
    "offer_id": 1,
    "pub_id": "publisher-uuid",
    "amount": 10.50,
    "status": "approved"
  }'
```

#### 7.2 Webhook Conversion
```bash
curl -X POST http://localhost:3000/api/webhook/conversion \
  -H "Content-Type: application/json" \
  -d '{
    "click_id": "uuid-here",
    "offer_id": 1,
    "pub_id": "publisher-uuid",
    "amount": 10.50
  }'
```

---

## 🔍 Testing Checklist

### Publisher Features
- [ ] Login as publisher
- [ ] View dashboard statistics
- [ ] Browse available offers
- [ ] Create smartlink
- [ ] View reports
- [ ] Track clicks
- [ ] View coupons
- [ ] Update profile (if available)
- [ ] Change password (if available)

### Admin Features (if accessible)
- [ ] Login as admin
- [ ] View admin dashboard
- [ ] Approve/reject publishers
- [ ] Create/edit offers
- [ ] Manage coupons
- [ ] Configure smartlinks
- [ ] View analytics
- [ ] Manage admins

### API Endpoints
- [ ] All publisher endpoints return correct data
- [ ] Authentication works for protected routes
- [ ] Public endpoints are accessible
- [ ] Postback/webhook handlers work
- [ ] Error handling is proper

### Edge Cases
- [ ] Invalid credentials
- [ ] Missing required fields
- [ ] Unauthorized access attempts
- [ ] Invalid IDs in URLs
- [ ] Network errors

---

## 🐛 Common Issues & Solutions

### Issue: Cannot login
**Solution:** 
- Check if publisher status is "approved"
- Verify password is correct
- Check browser console for errors
- Verify NextAuth secret is set in `.env`

### Issue: API returns 401 Unauthorized
**Solution:**
- Ensure you're logged in
- Check session token in cookies
- Verify middleware is not blocking the route

### Issue: Database connection errors
**Solution:**
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running
- Run `npx prisma generate` to regenerate Prisma client

### Issue: Publisher status not updating
**Solution:**
- Check database directly: `SELECT * FROM publishers WHERE email = 'legendrycoypgamers@gmail.com';`
- Verify the script ran successfully
- Check Prisma client is up to date

---

## 📊 Database Verification

To verify the publisher account in the database:

```sql
SELECT id, name, email, status, created_at 
FROM publishers 
WHERE email = 'legendrycoypgamers@gmail.com';
```

Expected result:
- `status` should be `approved`
- Account should exist with the email

---

## 🚀 Quick Start Testing

1. **Start server:** `npm run dev`
2. **Login:** Go to `/auth/login` → Select "Publisher" → Use `legendrycoypgamers@gmail.com`
3. **Explore:** Navigate through all publisher dashboard sections
4. **Test APIs:** Use browser DevTools Network tab to see API calls
5. **Check Console:** Look for any errors in browser console

---

## 📝 Notes

- All publisher routes require authentication
- All admin routes require admin role
- Public routes are accessible without authentication
- Session tokens are stored in cookies (NextAuth)
- Database uses Prisma ORM with PostgreSQL

---

## 🎯 Next Steps

After testing:
1. Report any bugs or issues
2. Verify all features work as expected
3. Test with different user roles
4. Test edge cases and error scenarios
5. Verify data persistence in database

Happy Testing! 🎉

