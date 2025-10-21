# Template Selector Deployment Instructions

## Current Status

✅ Code changes complete:
- API endpoint: `/api/settings/template` 
- Settings page: Updated with LandingPageStyleSettings component
- Component: Accepts query params for subdomain

❌ Production deployment not updated yet

The new code is committed locally but the live site at `test-demo.booqing.my.id` is still using the old build.

---

## Why 404 Error?

The live deployment is showing the OLD code that doesn't have the `/api/settings/template` endpoint yet.

```
❌ Deployed version: Old build without endpoint
✅ Local version: Has endpoint + component
```

---

## Solution 1: Force Vercel Redeploy (Recommended)

### Via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project (boq/platforms or similar)
3. Click **Deployments** tab
4. Find latest deployment
5. Click the **...** menu
6. Select **Redeploy**
7. Choose **Redeploy without cache**
8. Wait 2-3 minutes for deployment

### Or via Git

Push a new commit to trigger auto-deploy:

```bash
cd D:\boq\platforms
git commit --allow-empty -m "deploy: trigger rebuild"
git push origin main
```

---

## Solution 2: Wait for Auto-Deployment

Vercel auto-deploys on every push to main. If deployment hasn't started:
- Wait 1-2 minutes
- Check Vercel dashboard for build progress
- Deployment typically takes 3-5 minutes

---

## Solution 3: Manual git commands

```powershell
cd "D:\boq\platforms"

# Verify all changes are committed
git status

# Check latest commits
git log --oneline -5

# Should show:
# be65f9d docs: add template API endpoint path fix documentation
# 02c2b57 fix: move template API endpoint to /api/settings/template
# cc61939 docs: add detailed template API fix documentation
# 7c93246 fix: update template API to accept query parameters for subdomain routing
# b52bf46 feat(api): Support tenant ID via query params for template settings

# Push to trigger deployment
git push origin main --force-with-lease

# Check remote status
git branch -v
# Should show: main <hash> [origin/main: <status>]
```

---

## Verification After Deployment

Once deployed, verify the endpoint works:

1. **Open DevTools** (F12 → Network tab)
2. **Go to Settings page:**
   ```
   https://test-demo.booqing.my.id/tenant/admin/settings?subdomain=test-demo
   ```
3. **Look for API call:**
   ```
   ✅ GET /api/settings/template?subdomain=test-demo [200]
   Response: { template: "modern" }
   ```
4. **Should see template selector loaded**
5. **Select a template and save**
   ```
   ✅ POST /api/settings/template?subdomain=test-demo [200]
   Response: { success: true, template: "beauty" }
   ```

---

## Troubleshooting

### Still Getting 404 After Deploy

1. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear all cookies for test-demo.booqing.my.id
   - Hard refresh (Ctrl+Shift+R)

2. **Check deployment status:**
   - Go to Vercel dashboard
   - Confirm new deployment shows "Ready"
   - Check build logs for errors

3. **Check file in deployed version:**
   - Deployment should include `/api/settings/template/route.ts`
   - If missing, redeploy failed

### Getting 400 Bad Request

This means endpoint exists but validation failed:
- Check `subdomain` query param is being sent
- Verify subdomain is correct (e.g., "test-demo")
- Check error message in DevTools

### Getting 500 Internal Server Error

- Check Vercel logs for errors
- Supabase connection might be failing
- Environment variables might not be set

---

## Deployed Files

The deployment should include these files:

```
app/api/settings/template/route.ts          ← API endpoint
components/tenant/LandingPageStyleSettings.tsx  ← Selector UI
app/tenant/admin/settings/content.tsx       ← Settings page
```

---

## Git Commit Info

Latest working commits:

| Commit | Description | Status |
|--------|-------------|--------|
| be65f9d | docs: add endpoint path fix documentation | ✅ Committed |
| 02c2b57 | **fix: move API to /api/settings/template** | ✅ Committed |
| cc61939 | docs: add API fix documentation | ✅ Committed |
| 7c93246 | fix: update API query params | ✅ Committed |

All changes are in your local repo and pushed to remote.

---

## FAQ

**Q: How long does deployment take?**
A: Usually 3-5 minutes. Check Vercel dashboard.

**Q: Do I need to rebuild locally?**
A: No, Vercel builds in the cloud automatically.

**Q: What if deployment fails?**
A: Check Vercel build logs for errors. Most common: env vars not set.

**Q: Can I test locally first?**
A: Yes, run `npm run dev` and test at `http://localhost:3000`

**Q: When should I see the fix?**
A: After deployment completes and you refresh your browser.

---

## Next Steps

1. **Trigger redeploy** via Vercel dashboard or `git push`
2. **Wait 3-5 minutes** for deployment to complete
3. **Refresh browser** (Ctrl+Shift+R) to clear cache
4. **Navigate to settings page**
5. **Verify template selector appears**
6. **Test selecting and saving templates**

---

If still having issues after following these steps, check:
- Vercel build logs for errors
- Browser console for detailed error messages
- Network tab to see full API responses
