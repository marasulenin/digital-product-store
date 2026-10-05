\# Digital Product Store



A full-stack digital product e-commerce application built with \*\*FastAPI, React, SQLAlchemy, JWT Authentication, and Stripe Checkout\*\*.



\##  Features



\### Authentication



\* User registration

\* User login

\* JWT-based authentication

\* Protected APIs

\* User profile

\* Admin role-based access



\### Products



\* Create products

\* Update products

\* Soft delete products

\* Product details

\* Product search

\* Pagination

\* Active/inactive products



\### Cart



\* Add products to cart

\* Update quantity

\* Remove products

\* View cart

\* Calculate cart total

\* User-specific cart



\### Orders



\* Create orders from cart

\* View own orders

\* View order details

\* Order pagination

\* Payment status tracking



\### Stripe Payments



\* Stripe Checkout integration

\* Checkout session creation

\* Stripe webhook handling

\* Payment status updates

\* Successful payment handling

\* Failed/cancelled payment handling



\### Admin



\* Admin dashboard

\* Product management

\* Order management

\* User management

\* Store statistics

\* Revenue information



\### Reports



\* Revenue report

\* Product sales report

\* Order status report

\* Customer spending report

\* Store summary



\## 🛠️ Technology Stack



\### Backend



\* Python

\* FastAPI

\* SQLAlchemy

\* SQLite / PostgreSQL / MySQL

\* Pydantic

\* JWT

\* Stripe

\* Pytest

\* Uvicorn



\### Frontend



\* React

\* Vite

\* React Router

\* Axios

\* Tailwind CSS

\* React Toastify



\##  Project Structure



```text

digital-product-store/

│

├── backend/

│   ├── app/

│   │   ├── routers/

│   │   │   ├── auth.py

│   │   │   ├── products.py

│   │   │   ├── cart.py

│   │   │   ├── orders.py

│   │   │   ├── payments.py

│   │   │   ├── admin.py

│   │   │   └── reports.py

│   │   │

│   │   ├── config.py

│   │   ├── database.py

│   │   ├── dependencies.py

│   │   ├── models.py

│   │   ├── schemas.py

│   │   ├── security.py

│   │   └── main.py

│   │

│   ├── tests/

│   │   └── test\_api.py

│   │

│   ├── .env

│   └── requirements.txt

│

├── frontend/

│   ├── src/

│   │   ├── components/

│   │   ├── context/

│   │   ├── pages/

│   │   ├── services/

│   │   ├── App.jsx

│   │   └── main.jsx

│   │

│   ├── package.json

│   └── vite.config.js

│

├── .gitignore

├── package.json

└── README.md

```



\## ⚙️ Backend Setup



Open PowerShell and navigate to the backend:



```powershell

cd digital-product-store\\backend

```



Create and activate the virtual environment:



```powershell

python -m venv venv

.\\venv\\Scripts\\activate

```



Install dependencies:



```powershell

pip install -r requirements.txt

```



Create a `.env` file:



```env

DATABASE\_URL=sqlite:///./digital\_store.db



SECRET\_KEY=your-secret-key

ALGORITHM=HS256

ACCESS\_TOKEN\_EXPIRE\_MINUTES=60



STRIPE\_SECRET\_KEY=your-stripe-secret-key

STRIPE\_WEBHOOK\_SECRET=your-stripe-webhook-secret



FRONTEND\_URL=http://localhost:5173

```



\*\*Never commit `.env` or Stripe secret keys to GitHub.\*\*



\##  Run Backend



```powershell

uvicorn app.main:app --reload

```



Backend:



```text

http://127.0.0.1:8000

```



Swagger API documentation:



```text

http://127.0.0.1:8000/docs

```



ReDoc:



```text

http://127.0.0.1:8000/redoc

```



Health check:



```text

http://127.0.0.1:8000/health

```



\## 🎨 Frontend Setup



Open another terminal:



```powershell

cd digital-product-store\\frontend

```



Install dependencies:



```powershell

npm install

```



Start the development server:



```powershell

npm run dev

```



Frontend:



```text

http://localhost:5173

```



\## 💳 Stripe Setup



Create a Stripe account and use Stripe \*\*Test Mode\*\*.



Configure:



```env

STRIPE\_SECRET\_KEY=your-stripe-secret-key

STRIPE\_WEBHOOK\_SECRET=your-stripe-webhook-secret

```



Run the Stripe CLI webhook listener:



```powershell

stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async\_payment\_failed --forward-to http://127.0.0.1:8000/payments/webhook

```



The webhook endpoint is:



```text

POST /payments/webhook

```



Checkout endpoint:



```text

POST /payments/create-checkout-session

```



\## 🔐 Authentication Flow



1\. Register a user.

2\. Login using email and password.

3\. Backend returns a JWT access token.

4\. Frontend stores the token.

5\. Axios automatically sends:



```text

Authorization: Bearer <access\_token>

```



6\. Protected endpoints verify the JWT.

7\. Admin endpoints additionally verify the user's admin role.



\## 👨‍💼 Admin Features



Admin users can access:



```text

/admin

/admin/products

/admin/orders

```



Admin API endpoints include:



```text

GET    /admin/stats

POST   /admin/products

PUT    /admin/products/{product\_id}

DELETE /admin/products/{product\_id}

GET    /admin/orders

GET    /admin/orders/{order\_id}

GET    /admin/users

```



\##  Reports



Available admin reports:



```text

GET /reports/revenue

GET /reports/product-sales

GET /reports/order-status

GET /reports/customers

GET /reports/summary

```



\##  Testing



Run the backend tests:



```powershell

cd backend

pytest -v

```



The test suite covers areas including:



\* User registration

\* Login

\* Invalid login

\* Product creation

\* Product listing

\* Pagination

\* Cart operations

\* Orders

\* Payment functionality

\* Authorization

\* Admin access



\##  Main Frontend Routes



```text

/login

/register

/products

/products/:id

/cart

/checkout

/orders

/orders/:id

/payment-success

/payment-cancelled

/admin

/admin/products

/admin/orders

```



\##  Main Backend Endpoints



\### Authentication



```text

POST /auth/register

POST /auth/login

GET  /auth/me

```



\### Products



```text

GET    /products

GET    /products/{product\_id}

POST   /admin/products

PUT    /admin/products/{product\_id}

DELETE /admin/products/{product\_id}

```



\### Cart



```text

GET    /cart

POST   /cart/items

PUT    /cart/items/{item\_id}

DELETE /cart/items/{item\_id}

```



\### Orders



```text

POST /orders

GET  /orders

GET  /orders/{order\_id}

```



\### Payments



```text

POST /payments/create-checkout-session

POST /payments/webhook

```



\## 🗄️ Database Relationships



The application uses the following main entities:



```text

User

&#x20;│

&#x20;├── Cart

&#x20;│     └── CartItem ─── Product

&#x20;│

&#x20;└── Order

&#x20;      ├── OrderItem ─── Product

&#x20;      └── Payment

```



Main database tables:



\* users

\* products

\* carts

\* cart\_items

\* orders

\* order\_items

\* payments



\## 🔒 Security



\* Passwords are hashed before storage.

\* JWT authentication protects private endpoints.

\* Admin APIs require admin authorization.

\* Users can access only their own cart and orders.

\* Stripe webhook signatures are verified.

\* Secrets are stored in environment variables.

\* `.env` is excluded from Git.



\##  API Pagination Example



Products can be requested with:



```text

GET /products?page=1\&limit=10\&search=python

```



Example response:



```json

{

&#x20; "items": \[],

&#x20; "total": 25,

&#x20; "page": 1,

&#x20; "limit": 10,

&#x20; "total\_pages": 3

}

```



\##  Project Objective



This project demonstrates full-stack development skills including:



\* REST API development

\* Database relationships

\* Authentication and authorization

\* CRUD operations

\* Pagination and search

\* Shopping cart functionality

\* Order management

\* Stripe payment integration

\* Webhook processing

\* React frontend integration

\* Admin functionality

\* SQL reporting

\* Automated testing



\##  Author



\*\*Lenin Marasu\*\*



Digital Product Store — Full-Stack Development Project



````



\### Save and push it



From:



```text

C:\\Users\\shyamsundar\\digital\_product\_store



