# Products App API

Express + MongoDB backend for the admin module: real product/category
persistence and JWT-based user accounts, replacing fakestoreapi.com and the
localStorage-overlay workaround.

## 1. Create a MongoDB Atlas cluster (one-time, manual)

I can't create this for you — it needs your own account:

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. Create a free **M0** cluster (any region close to you).
3. Under **Database Access**, add a database user with a username/password.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) — fine for
   a demo project; tighten later if this becomes a real product.
5. Click **Connect** on your cluster → **Drivers** → copy the connection
   string. It looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`

## 2. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `.env`:
- `MONGODB_URI` — paste your Atlas connection string, add `/products-app`
  before the `?` so it uses that database name.
- `JWT_SECRET` — generate one:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

## 3. Install, seed, and run

```bash
npm install
npm run seed   # one-time: imports the starter catalog into your database
npm run dev    # starts the API on http://localhost:5000
```

## 4. Deploy live (Render)

1. Push this repo to GitHub.
2. Go to https://render.com, sign up/sign in, click **New +** → **Blueprint**,
   and point it at your repo — it will detect `render.yaml` at the repo root
   and provision the `products-app-api` service automatically.
3. Render will prompt for the env vars marked `sync: false`
   (`MONGODB_URI`, `CLIENT_ORIGIN`) — paste your Atlas URI and your deployed
   frontend's URL. `JWT_SECRET` is generated for you automatically.
4. Once deployed, Render gives you a URL like
   `https://products-app-api.onrender.com`. That's your `REACT_APP_API_URL`
   for the frontend (see the root `README.md` / `.env.example`).

Free-tier Render services spin down after inactivity and take ~30s to wake
up on the next request — expected on the free plan, not a bug.

## API summary

| Method | Route                  | Auth        | Purpose                          |
|--------|-------------------------|-------------|-----------------------------------|
| POST   | /api/auth/register       | —           | Create account (first ever user becomes admin) |
| POST   | /api/auth/login          | —           | Log in, returns a JWT             |
| GET    | /api/auth/me              | Bearer token | Current user                     |
| GET    | /api/products             | —           | List products (`?visibleOnly=true` hides hidden-category items) |
| GET    | /api/products/:id         | —           | Single product                    |
| POST   | /api/products             | Admin       | Create product                    |
| PUT    | /api/products/:id         | Admin       | Update product                    |
| DELETE | /api/products/:id         | Admin       | Delete product                    |
| GET    | /api/categories           | —           | List categories (with live product counts + auto thumbnails) |
| POST   | /api/categories           | Admin       | Create category                   |
| PUT    | /api/categories/:id       | Admin       | Rename / re-image / hide-show (propagates renames to products) |
| DELETE | /api/categories/:id       | Admin       | Delete (blocked if products still use it) |
