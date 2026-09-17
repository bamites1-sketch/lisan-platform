# Cloudflare R2 Setup Guide for LISAN

## Required Cloudflare R2 Credentials

You need to create the following in your Cloudflare dashboard:

### 1. Create an R2 Bucket

1. Go to https://dash.cloudflare.com/
2. Navigate to **R2** in the left sidebar
3. Click **"Create bucket"**
4. Bucket name: `lisan-storage` (or your preferred name)
5. Location: Choose closest to your users (auto is fine)
6. Click **Create bucket**

### 2. Get R2 API Credentials

1. In R2 dashboard, click **"Manage R2 API Tokens"**
2. Click **"Create API token"**
3. Token name: `lisan-backend-access`
4. Permissions: **Object Read & Write**
5. Specify bucket: Select `lisan-storage` (or your bucket name)
6. Click **"Create API Token"**
7. **SAVE THESE VALUES** (they only show once):
   - **Access Key ID**: (looks like: `abc123def456...`)
   - **Secret Access Key**: (looks like: `xyz789uvw012...`)

### 3. Get Account ID

1. Still in the R2 dashboard
2. Look at the top-right corner or the R2 overview page
3. Copy your **Account ID** (32-character hex string)

### 4. R2 Endpoint URL

Your R2 endpoint follows this pattern:
```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Example: `https://a1b2c3d4e5f6g7h8.r2.cloudflarestorage.com`

### 5. Optional: Public Domain (for public assets)

If you want a custom domain for public files:
1. Go to your R2 bucket settings
2. Click **"Connect Domain"**
3. Choose a subdomain: e.g., `cdn.yourdomain.com`
4. Follow DNS setup instructions
5. This is **optional** - we'll use signed URLs by default

---

## Environment Variables to Add

Add these to your `.env` file (and later to Render):

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=lisan-storage
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your_account_id.r2.cloudflarestorage.com/lisan-storage

# Optional: Custom domain if you set one up
# R2_PUBLIC_URL=https://cdn.yourdomain.com
```

---

## Where to Get Each Value

| Variable | Where to Find It |
|----------|-----------------|
| `R2_ACCOUNT_ID` | Cloudflare Dashboard → R2 → Top right corner |
| `R2_ACCESS_KEY_ID` | Created when you make an API token |
| `R2_SECRET_ACCESS_KEY` | Created when you make an API token (save immediately!) |
| `R2_BUCKET_NAME` | The bucket name you created (e.g., `lisan-storage`) |
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | Same as endpoint + `/bucket-name` or your custom domain |

---

## Next Steps

1. Create the R2 bucket and API token in Cloudflare
2. Copy all credentials
3. Update your local `.env` file with the values above
4. I will integrate R2 into the backend code
5. When deploying to Render, add these as environment variables

---

## Pricing Info

Cloudflare R2 Storage:
- **$0.015/GB/month** for storage
- **Zero egress fees** (unlike S3)
- **10GB free** storage per month
- Class A operations (writes): $4.50 per million requests
- Class B operations (reads): $0.36 per million requests

For a typical educational platform:
- 1000 students × 50 recordings × 1MB = 50GB storage = **$0.75/month**
- Zero bandwidth costs regardless of playback volume

---

## Security Notes

- Files are **private by default**
- Access via **signed URLs** (temporary, expiring links)
- Frontend never sees R2 credentials
- Only authenticated users can upload/access files
- Each file request validates user authorization
