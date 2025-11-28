from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
from fastapi.middleware.gzip import GZipMiddleware


# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ---------- Models ----------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    price: float
    strain_type: Optional[str] = None  # Indica/Sativa/Hybrid
    size: Optional[str] = None  # 3.5g, 7g, etc
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    strain_type: Optional[str] = None
    size: Optional[str] = None
    image_url: Optional[str] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[CartItem]
    subtotal: float
    tax: float
    total: float
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "mock_confirmed"  # mock checkout

class WaitlistCreate(BaseModel):
    email: EmailStr
    source: Optional[str] = None

class WaitlistEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    source: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.get("/health")
async def health():
    return {"status": "ok"}

@api_router.get("/ready")
async def ready():
    try:
        await db.command("ping")
        return {"status": "ready", "mongo": True}
    except Exception as e:
        return {"status": "degraded", "mongo": False, "error": str(e)}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# ----- Products CRUD -----
@api_router.post("/products", response_model=Product)
async def create_product(payload: ProductCreate):
    product = Product(**payload.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products", response_model=List[Product])
async def list_products():
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    for p in products:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(p.get('created_at'), str):
        p['created_at'] = datetime.fromisoformat(p['created_at'])
    return p

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}

# ----- Mock checkout -----
@api_router.post("/orders", response_model=Order)
async def create_order(items: List[CartItem], email: Optional[str] = None):
    # calculate subtotal from DB prices
    ids = [i.product_id for i in items]
    found = await db.products.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "price": 1}).to_list(100)
    price_map = {p['id']: p['price'] for p in found}
    subtotal = 0.0
    for it in items:
        price = price_map.get(it.product_id)
        if price is None:
            raise HTTPException(status_code=400, detail=f"Invalid product {it.product_id}")
        subtotal += price * it.quantity
    tax = round(subtotal * 0.0, 2)  # tax later
    total = round(subtotal + tax, 2)
    order = Order(items=items, subtotal=round(subtotal,2), tax=tax, total=total, email=email)
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    return order

# ----- Waitlist -----
@api_router.post("/waitlist", response_model=WaitlistEntry)
async def add_to_waitlist(payload: WaitlistCreate):
    # idempotent on email
    existing = await db.waitlist.find_one({"email": payload.email})
    if existing:
        # return existing as model
        existing.pop('_id', None)
        if isinstance(existing.get('created_at'), str):
            existing['created_at'] = datetime.fromisoformat(existing['created_at'])
        return WaitlistEntry(**existing)
    entry = WaitlistEntry(email=payload.email, source=payload.source)
    doc = entry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.waitlist.insert_one(doc)
    return entry

@api_router.get("/waitlist", response_model=List[WaitlistEntry])
async def list_waitlist():
    items = await db.waitlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        if isinstance(it.get('created_at'), str):
            it['created_at'] = datetime.fromisoformat(it['created_at'])
    return items

# ----- Sample data helpers -----
STOCK_IMAGES = [
    "https://images.unsplash.com/photo-1559558260-dfa522cfd57c",  # clean buds studio on white
    "https://images.unsplash.com/photo-1518465444133-93542d08fdd9",  # buds close-up on neutral bg
    "https://images.unsplash.com/photo-1589141986943-5578615fdef2",  # buds pile
]

async def _insert_samples():
    samples = [
        {
            "name": "Blue Dream 3.5g Flower Bag",
            "description": "Balanced uplift with berry notes. Fresh-sealed mylar bag.",
            "price": 34.00,
            "strain_type": "Hybrid",
            "size": "3.5g",
            "image_url": STOCK_IMAGES[1],
        },
        {
            "name": "Sour Diesel 1g Gram Bag",
            "description": "Citrus-diesel aroma for daytime clarity. Single gram bag.",
            "price": 12.00,
            "strain_type": "Sativa",
            "size": "1g",
            "image_url": "https://images.unsplash.com/photo-1559558260-dfa522cfd57c",
        },
        {
            "name": "Pineapple Express 3.5g Flower Bag",
            "description": "Tropical sweetness meets energetic vibes.",
            "price": 32.00,
            "strain_type": "Hybrid",
            "size": "3.5g",
            "image_url": STOCK_IMAGES[2],
        },
        {
            "name": "Wedding Cake 1g Gram Bag",
            "description": "Frosted vanilla gas in a compact single.",
            "price": 13.00,
            "strain_type": "Indica",
            "size": "1g",
            "image_url": STOCK_IMAGES[0],
        },
    ]
    docs = []
    for s in samples:
        p = Product(**s)
        d = p.model_dump()
        d['created_at'] = d['created_at'].isoformat()
        docs.append(d)
    if docs:
        await db.products.insert_many(docs)

# ----- Seed sample products -----
@api_router.post("/seed")
async def seed_products():
    existing = await db.products.count_documents({})
    if existing > 0:
        return {"skipped": True, "count": existing}
    await _insert_samples()
    count = await db.products.count_documents({})
    return {"inserted": count}

# ----- Admin: reset samples (dev utility) -----
@api_router.post("/admin/reset-samples")
async def reset_samples():
    await db.products.delete_many({})
    await _insert_samples()
    count = await db.products.count_documents({})
    return {"reset": True, "count": count}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
