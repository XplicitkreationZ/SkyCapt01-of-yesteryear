from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Tuple
import uuid
from datetime import datetime, timezone, date
from fastapi.middleware.gzip import GZipMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=500)

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
    coa_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    strain_type: Optional[str] = None
    size: Optional[str] = None
    image_url: Optional[str] = None
    coa_url: Optional[str] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1

class Address(BaseModel):
    name: str
    phone: str
    address1: str
    address2: Optional[str] = None
    city: str
    state: str
    zip: str
    dob: str  # YYYY-MM-DD

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

class OrderDeliveryCreate(BaseModel):
    items: List[CartItem]
    address: Address

class OrderDelivery(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[CartItem]
    address: Address
    subtotal: float
    delivery_fee: float
    tax: float
    total: float
    tier: Optional[str] = None
    payment_method: str = "card"
    payment_status: str = "mock_authorized"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending_dispatch"

class DeliveryQuoteRequest(BaseModel):
    zip: str
    subtotal: float

class DeliveryQuoteResponse(BaseModel):
    allowed: bool
    fee: float
    min_order: float
    tier: Optional[str] = None
    reason: Optional[str] = None

# ---------- Utility ----------
TX_ZIP_RANGES: List[Tuple[int, int]] = [
    (73301, 73399),
    (75001, 79999),
    (88510, 88595)
]

DELIVERY_TIERS = [
    {"name": "Zone A", "zip_ranges": [(75001, 75254), (75270, 75287)], "fee": 7.0, "min_order": 25.0},
    {"name": "Zone B", "zip_ranges": [(75201, 75399), (76001, 76199)], "fee": 12.0, "min_order": 50.0},
    {"name": "Zone C", "zip_ranges": [(76200, 76999)], "fee": 15.0, "min_order": 75.0},
]

def is_tx_zip(zip_str: str) -> bool:
    try:
        z = int(zip_str[:5])
    except Exception:
        return False
    for a, b in TX_ZIP_RANGES:
        if a <= z <= b:
            return True
    return False

def tier_for_zip(zip_str: str):
    try:
        z = int(zip_str[:5])
    except Exception:
        return None
    for t in DELIVERY_TIERS:
        for a, b in t["zip_ranges"]:
            if a <= z <= b:
                return t
    return None

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

# ----- Mock checkout (legacy) -----
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

# ----- Delivery quote & orders -----
@api_router.post("/delivery/quote", response_model=DeliveryQuoteResponse)
async def delivery_quote(payload: DeliveryQuoteRequest):
    if not is_tx_zip(payload.zip):
        return DeliveryQuoteResponse(allowed=False, fee=0.0, min_order=0.0, reason="Texas only")
    tier = tier_for_zip(payload.zip)
    if not tier:
        return DeliveryQuoteResponse(allowed=False, fee=0.0, min_order=0.0, reason="Zip not serviced")
    fee = float(tier['fee'])
    min_order = float(tier['min_order'])
    allowed = payload.subtotal >= min_order
    reason = None if allowed else f"Minimum order ${min_order:.2f} for {tier['name']}"
    return DeliveryQuoteResponse(allowed=allowed, fee=fee, min_order=min_order, tier=tier['name'], reason=reason)

@api_router.post("/orders/delivery", response_model=OrderDelivery)
async def create_delivery_order(payload: OrderDeliveryCreate):
    # validate age
    try:
        dob = datetime.fromisoformat(payload.address.dob).date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid DOB format, use YYYY-MM-DD")
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age < 21:
        raise HTTPException(status_code=400, detail="Must be 21+")
    # validate state
    if payload.address.state.upper() != 'TX':
        raise HTTPException(status_code=400, detail="Texas only")
    # compute subtotal
    ids = [i.product_id for i in payload.items]
    found = await db.products.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "price": 1}).to_list(100)
    price_map = {p['id']: p['price'] for p in found}
    subtotal = 0.0
    for it in payload.items:
        price = price_map.get(it.product_id)
        if price is None:
            raise HTTPException(status_code=400, detail=f"Invalid product {it.product_id}")
        subtotal += price * it.quantity
    # quote
    q = await delivery_quote(DeliveryQuoteRequest(zip=payload.address.zip, subtotal=subtotal))
    if not q.allowed:
        raise HTTPException(status_code=400, detail=q.reason or "Not allowed")
    tax = 0.0  # add later
    total = round(subtotal + q.fee + tax, 2)
    order = OrderDelivery(
        items=payload.items,
        address=payload.address,
        subtotal=round(subtotal, 2),
        delivery_fee=q.fee,
        tax=tax,
        total=total,
        tier=q.tier,
    )
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.delivery_orders.insert_one(doc)
    return order

class StatusUpdate(BaseModel):
    status: str
    dispatcher_note: Optional[str] = None

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, payload: StatusUpdate):
    res = await db.delivery_orders.update_one({"id": order_id}, {"$set": {"status": payload.status, "dispatcher_note": payload.dispatcher_note}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True}

@api_router.get("/config/tiers")
async def get_tiers():
    return DELIVERY_TIERS

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
            "coa_url": "https://example.com/coa/blue-dream.pdf",
        },
        {
            "name": "Sour Diesel 1g Gram Bag",
            "description": "Citrus-diesel aroma for daytime clarity. Single gram bag.",
            "price": 12.00,
            "strain_type": "Sativa",
            "size": "1g",
            "image_url": "https://images.unsplash.com/photo-1559558260-dfa522cfd57c",
            "coa_url": "https://example.com/coa/sour-diesel.pdf",
        },
        {
            "name": "Pineapple Express 3.5g Flower Bag",
            "description": "Tropical sweetness meets energetic vibes.",
            "price": 32.00,
            "strain_type": "Hybrid",
            "size": "3.5g",
            "image_url": STOCK_IMAGES[2],
            "coa_url": "https://example.com/coa/pineapple-express.pdf",
        },
        {
            "name": "Wedding Cake 1g Gram Bag",
            "description": "Frosted vanilla gas in a compact single.",
            "price": 13.00,
            "strain_type": "Indica",
            "size": "1g",
            "image_url": STOCK_IMAGES[0],
            "coa_url": "https://example.com/coa/wedding-cake.pdf",
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def create_indexes():
    try:
        await db.products.create_index("id", unique=True)
        await db.waitlist.create_index("email", unique=True)
        await db.waitlist.create_index([("created_at", -1)])
        await db.delivery_orders.create_index([("created_at", -1)])
    except Exception as e:
        logger.warning(f"Index creation issue: {e}")

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
