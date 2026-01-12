# Ngrok Setup for Backend API

## 🌐 Current Public URL

**Your backend is now accessible at:**
```
https://nondisastrously-ungrazed-hang.ngrok-free.dev
```

⚠️ **Note:** This URL changes each time you restart ngrok. For a stable URL, consider upgrading to ngrok paid plan.

---

## 📋 API Endpoints

All your REST API endpoints are now accessible via the ngrok URL:

### Base URL
```
https://nondisastrously-ungrazed-hang.ngrok-free.dev
```

### Example Endpoints

**Node Registry:**
- `GET https://nondisastrously-ungrazed-hang.ngrok-free.dev/nodes/admin`
- `GET https://nondisastrously-ungrazed-hang.ngrok-free.dev/nodes/check/0x...`
- `POST https://nondisastrously-ungrazed-hang.ngrok-free.dev/nodes/add`

**Model Registry:**
- `GET https://nondisastrously-ungrazed-hang.ngrok-free.dev/models`
- `POST https://nondisastrously-ungrazed-hang.ngrok-free.dev/models`
- `GET https://nondisastrously-ungrazed-hang.ngrok-free.dev/models/blockchain/0`

**Inference Manager:**
- `POST https://nondisastrously-ungrazed-hang.ngrok-free.dev/inference/request`
- `GET https://nondisastrously-ungrazed-hang.ngrok-free.dev/inference/status/0`
- `POST https://nondisastrously-ungrazed-hang.ngrok-free.dev/inference/submit`

**IPFS:**
- `POST https://nondisastrously-ungrazed-hang.ngrok-free.dev/ipfs/upload`

---

## 🚀 Frontend Integration

Your friend can now use this URL in their frontend:

```javascript
const API_BASE_URL = 'https://nondisastrously-ungrazed-hang.ngrok-free.dev';

// Example: Get all models
fetch(`${API_BASE_URL}/models`)
  .then(res => res.json())
  .then(data => console.log(data));

// Example: Request inference
fetch(`${API_BASE_URL}/inference/request`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: '0',
    wallet: '0x...',
    durationMinutes: '10'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🛠️ Managing Ngrok

### Start Ngrok
```bash
./start_ngrok.sh [port]
```

Default port is 3000. If your backend runs on a different port:
```bash
./start_ngrok.sh 5000
```

### View Ngrok Dashboard
Open in browser: `http://localhost:4040`

This shows:
- All requests coming through the tunnel
- Request/response details
- Public URL information

### Stop Ngrok
Press `Ctrl+C` in the terminal where ngrok is running, or:
```bash
pkill ngrok
```

### Get Current URL
```bash
curl http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

---

## ⚠️ Important Notes

1. **URL Changes:** Free ngrok URLs change each time you restart. Share the new URL with your friend when it changes.

2. **Backend Must Be Running:** Make sure your backend is running on the correct port before starting ngrok.

3. **CORS:** The backend already has CORS enabled, so frontend requests should work.

4. **Ngrok Free Plan Limitations:**
   - URLs change on restart
   - Connection limits
   - For production, consider ngrok paid plan or deploy to a cloud service

5. **Security:** The ngrok URL is public. Don't expose sensitive credentials.

---

## 📝 Quick Test

Test if the tunnel is working:

```bash
curl https://nondisastrously-ungrazed-hang.ngrok-free.dev/
```

Should return: `Inference backend running`

---

## 🔄 Restarting Ngrok

If you need to restart ngrok:

1. Stop current ngrok: `pkill ngrok`
2. Start again: `./start_ngrok.sh`
3. Get new URL: `curl http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'`
4. Share new URL with your friend

---

## 📚 Full API Documentation

See `backend/API_DOCUMENTATION.md` for complete API reference.
