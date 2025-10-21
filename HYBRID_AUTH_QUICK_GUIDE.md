# Hybrid Authentication - Quick Guide

## For Business Owners

### Registration & Setup

```
1. Visit: https://booqing.my.id
2. Click: "Start Your Free Trial"
3. Fill registration form:
   - Business name
   - Subdomain (e.g., "hairsalon")
   - Owner name
   - Email
   - Phone
   - Category
4. Submit → Setup page appears
5. Copy your temporary credentials:
   📧 Email: your-email@domain.com
   🔐 Password: X9K7M2P5Q8
6. Click: "Go to Login"
```

### Login

```
URL: https://{subdomain}.booqing.my.id/tenant/login

1. Select: "Owner" tab
2. Enter email: your-email@domain.com
3. Enter password: (temporary password from setup)
4. Click: Login
5. Redirected to: Dashboard
```

### First Time Login

After first login:

```
1. Go to: Settings
2. Change Password section
3. Enter temporary password
4. Create new strong password
5. Save
```

### Add Staff Members

```
1. In Dashboard → Staff section
2. Click: "Add Staff"
3. Enter staff:
   - Email
   - Name
   - Role (Admin, Staff)
4. Set password for staff
5. Share credentials with staff (email/chat/etc)
```

### Troubleshooting

**"Invalid credentials"**
- Check email is correct
- Check password is correct
- Check you're using "Owner" tab (not Staff/Admin)

**"Account temporarily locked"**
- 5 failed login attempts lock account for 30 minutes
- Wait and try again after 30 minutes

**"Subdomain not found"**
- Subdomain doesn't exist
- Check URL spelling

---

## For Staff Members

### Login

```
URL: https://{subdomain}.booqing.my.id/tenant/login

1. Select: "Staff" tab
2. Enter email: (from owner)
3. Enter password: (from owner)
4. Click: Login
5. Redirected to: Dashboard
```

### Change Password (First Login)

```
1. Go to: Settings → Change Password
2. Enter current temporary password
3. Create new password
4. Save
```

### Logout

```
In Dashboard:
1. Click: Sidebar "Logout" button
2. Redirected to: Login page
```

---

## For Platform Admins

### SuperAdmin Login (Main Site)

```
URL: https://booqing.my.id/login

1. Select: (any role - it checks email)
2. Enter email: admin@booqing.my.id
3. Enter password: (your superadmin password)
4. Click: Login
5. Redirected to: /admin (Platform Admin Dashboard)
```

### SuperAdmin Login (Subdomain)

```
URL: https://{subdomain}.booqing.my.id/tenant/login

1. Select: "Admin" tab
2. Enter email: admin@booqing.my.id
3. Enter password: (your superadmin password)
4. Click: Login
5. Can access any subdomain as admin
```

### Manage Businesses

```
In Platform Admin Dashboard:
1. Go to: Tenants section
2. View all registered businesses
3. Can view details and manage subscriptions
```

---

## Key Features

### ✅ SuperAdmin
- ✅ Access main site (/admin)
- ✅ Access any subdomain as admin
- ✅ Manage all businesses
- ✅ View platform analytics

### ✅ Owner
- ✅ Access own subdomain only
- ✅ Manage staff
- ✅ Create services
- ✅ View bookings & customers
- ✅ Full dashboard access

### ✅ Staff
- ✅ Access subdomain dashboard
- ✅ Manage bookings
- ✅ View customers
- ✅ Limited permissions (set by owner)

---

## Password Security

### Requirements
- At least 8 characters
- Mix of uppercase, lowercase, numbers, symbols

### Best Practices
1. ✅ Change temporary password after first login
2. ✅ Use unique password (don't reuse)
3. ✅ Don't share password (use account invites instead)
4. ✅ Change password periodically (every 90 days)
5. ✅ Use password manager

### If Password Forgotten
- Use "Forgot Password" link on login page
- Or contact platform support

---

## Session & Cookies

### Auto-Logout
- Sessions expire after 7 days
- You'll be redirected to login
- Activity extends session (no timer during use)

### Multiple Devices
- Each login creates new session
- Can be logged in on multiple devices
- Logout on one device doesn't affect others

### Private Browsing
- Sessions work in private/incognito mode
- Cookies cleared when window closes

---

## Common Issues

### Issue: Can't login
**Solutions:**
- Verify email is correct (case-insensitive)
- Check password (case-sensitive)
- Ensure you have internet connection
- Try different browser or private window

### Issue: "Account locked"
**Solutions:**
- Wait 30 minutes
- Contact support if still locked

### Issue: Forgot password
**Solutions:**
- Use "Forgot Password" link
- Or contact business owner
- Or contact platform support

### Issue: Staff can't access dashboard
**Solutions:**
- Check staff account is active (enabled)
- Verify staff has correct role permissions
- Check subdomain in URL is correct

---

## Support

**Need Help?**
- Email: support@booqing.my.id
- Documentation: /docs
- Dashboard: Help section

---

**Last Updated:** 2025-01-21
**Version:** 1.0
