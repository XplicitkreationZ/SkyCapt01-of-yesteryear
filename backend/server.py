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
from datetime import datetime, timezone, date
from fastapi.middleware.gzip import GZipMiddleware
import math
import json
from urllib.request import urlopen

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=500)
api_router = APIRouter(prefix="/api")

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
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
    category: Optional[str] = None
    brand: Optional[str] = None
    strain_type: Optional[str] = None
    size: Optional[str] = None
    image_url: Optional[str] = None
    coa_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    category: Optional[str] = None
    brand: Optional[str] = None
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
    dob: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[CartItem]
    subtotal: float
    tax: float
    total: float
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "mock_confirmed"

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
    distance_miles: Optional[float] = None

ORIGIN_ZIP = "78751"
ORIGIN_LAT = 30.318
ORIGIN_LON = -97.724
MAX_RADIUS_MI = 40.0
DISTANCE_BANDS = [ (10.0, 7.0, 25.0, "0-10mi"), (25.0, 12.0, 50.0, "10-25mi"), (40.0, 18.0, 75.0, "25-40mi") ]

def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def geocode_zip(zip_code: str):
    try:
        with urlopen(f"https://api.zippopotam.us/us/{zip_code}", timeout=5) as f:
            data = json.loads(f.read().decode("utf-8"))
            place = data["places"][0]
            lat = float(place["latitude"]); lon = float(place["longitude"])
            state = data.get("state abbreviation") or place.get("state abbreviation")
            return lat, lon, (state or "")
    except Exception:
        return None

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

@api_router.post("/products", response_model=Product)
async def create_product(payload: ProductCreate):
    product = Product(**payload.model_dump())
    doc = product.model_dump(); doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products", response_model=List[Product])
async def list_products():
    products = await db.products.find({}, {"_id": 0}).to_list(800)
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

@api_router.post("/delivery/quote", response_model=DeliveryQuoteResponse)
async def delivery_quote(payload: DeliveryQuoteRequest):
    geo = geocode_zip(payload.zip)
    if not geo:
        return DeliveryQuoteResponse(allowed=False, fee=0.0, min_order=0.0, reason="Invalid ZIP")
    lat, lon, state = geo
    if state and state.upper() != 'TX':
        return DeliveryQuoteResponse(allowed=False, fee=0.0, min_order=0.0, reason="Texas only")
    dist = haversine_miles(ORIGIN_LAT, ORIGIN_LON, lat, lon)
    if dist > MAX_RADIUS_MI:
        return DeliveryQuoteResponse(allowed=False, fee=0.0, min_order=0.0, reason="Outside 40mi radius", distance_miles=round(dist,2))
    band = None
    for m, fee, mo, name in DISTANCE_BANDS:
        if dist <= m:
            band = (fee, mo, name)
            break
    if not band:
        band = (DISTANCE_BANDS[-1][1], DISTANCE_BANDS[-1][2], DISTANCE_BANDS[-1][3])
    fee, min_order, name = band
    allowed = payload.subtotal >= min_order
    reason = None if allowed else f"Minimum order ${min_order:.2f} ({name})"
    return DeliveryQuoteResponse(allowed=allowed, fee=float(fee), min_order=float(min_order), tier=name, reason=reason, distance_miles=round(dist,2))

@api_router.post("/orders/delivery", response_model=OrderDelivery)
async def create_delivery_order(payload: OrderDeliveryCreate):
    try:
        dob = datetime.fromisoformat(payload.address.dob).date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid DOB format, use YYYY-MM-DD")
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age < 21:
        raise HTTPException(status_code=400, detail="Must be 21+")
    if payload.address.state.upper() != 'TX':
        raise HTTPException(status_code=400, detail="Texas only")
    ids = [i.product_id for i in payload.items]
    found = await db.products.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "price": 1}).to_list(800)
    price_map = {p['id']: p['price'] for p in found}
    subtotal = 0.0
    for it in payload.items:
        price = price_map.get(it.product_id)
        if price is None:
            raise HTTPException(status_code=400, detail=f"Invalid product {it.product_id}")
        subtotal += price * it.quantity
    q = await delivery_quote(DeliveryQuoteRequest(zip=payload.address.zip, subtotal=subtotal))
    if not q.allowed:
        raise HTTPException(status_code=400, detail=q.reason or "Not allowed")
    tax = 0.0
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
    doc = order.model_dump(); doc['created_at'] = doc['created_at'].isoformat()
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

@api_router.post("/admin/seed-accessories")
async def seed_accessories():
    items = [
        {"name": "RAW Classic Rolling Papers 1 1/4", "price": 2.49, "category": "Accessory", "brand": "RAW", "size": "1 1/4", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/bs8mxi93_raw-classic-rolling-papers-single-pack-1-1-4_600x.jpg"},
        {"name": "Blazy Susan Rose Wraps (2ct)", "price": 2.99, "category": "Accessory", "brand": "Blazy Susan", "size": "2 wraps", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/kgy6p2eg_Blazy-Susan-Rose-Wraps_600x.jpg"},
        {"name": "RAW Classic King Size Cones (single)", "price": 1.99, "category": "Accessory", "brand": "RAW", "size": "King Size", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/hlaimnsk_R_Cone_Class_King_sm_grande_7f6d341b-e5ed-4b3e-9e2b-e2f538a05f7a_600x.jpg"},
        {"name": "RAW Black King Size Cones (single)", "price": 2.29, "category": "Accessory", "brand": "RAW", "size": "King Size", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/kws0id3i_hpxo04iufzovyrucokjo_936f64fe-73bd-40d7-9420-e0c3da133e0f_600x.jpg"},
        {"name": "4-Part Aluminum Herb Grinder (Black)", "price": 19.99, "category": "Accessory", "brand": "Generic", "size": "2.2in", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/0q6wfz3k_4_parts_dry_herb_grinder_black_5000x.jpg"},
    ]
    inserted = 0
    for s in items:
        res = await db.products.update_one({"name": s["name"]}, {"$set": s, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
        if res.upserted_id:
            inserted += 1
    return {"ok": True, "inserted": inserted}

@api_router.post("/admin/seed-glass")
async def seed_glass():
    items = [
        {"name": "Eyce Silicone Spoon Pipe (Smoke/Black)", "price": 24.99, "category": "Glass", "brand": "Eyce", "size": "Spoon Pipe", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/cpqezmsu_eyce-silicone-spoon-pipe-smoke-black-hand-pipe-ey-ssp-sbk-14893882048586_edaedaf9-1847-45a3-a9e6-9faf901cf276_5000x.jpg"},
        {"name": "Silicone Recycler Rig (Aqua)", "price": 69.99, "category": "Glass", "brand": "Silicone", "size": "Recycler", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/384s134s_o3vjbksazu1ifbrh7vtj_600x.jpg"},
        {"name": "Glass Round Base Bong 8\"", "price": 39.99, "category": "Glass", "brand": "Glass", "size": "8\"", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/brmtuk2y_OxkdN58iVJ5DZAMfF0reW1vvj0y8bEvIUG9OJEHS_600x.jpg"},
        {"name": "10\" Color Accented Beaker Bong (Blue)", "price": 49.99, "category": "Glass", "brand": "Glass", "size": "10\"", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/z74xljmk_10BlueColorAccentedBeakerBong_5000x.png"},
        {"name": "GRAV 14mm Male Octobowl", "price": 18.99, "category": "Glass", "brand": "GRAV", "size": "14mm Male", "image_url": "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/it29p4xf_grav-r-14mm-male-octobowl.jpg"},
    ]
    inserted = 0
    for s in items:
        res = await db.products.update_one({"name": s["name"]}, {"$set": s, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
        if res.upserted_id:
            inserted += 1
    return {"ok": True, "inserted": inserted}

@api_router.post("/admin/seed-n2o")
async def seed_n2o():
    # Delete old N2O products with wrong names
    await db.products.delete_many({"name": {"$in": ["N2O Chargers (50-pack)", "N2O Tank (Full)"]}})
    items = [
        {"name": "Special Blue Whip Cream Chargers (50-pack)", "price": 29.99, "category": "Nitrous", "brand": "Special Blue", "size": "50 chargers", "description": "Premium food-grade nitrous oxide chargers. European quality. Perfect for culinary use with whip cream dispensers.", "image_url": "https://customer-assets.emergentagent.com/job_xplicit-dispatch/artifacts/0rvp84cq_special-blue-whip-cream-chargers__82145.jpg"},
        {"name": "Whip-It! N2O Cream Charger Tank (580g)", "price": 89.99, "category": "Nitrous", "brand": "Whip-It!", "size": "580g Tank", "description": "The Original Whip-It! nitrous oxide cream charger tank. Food-grade N2O for professional culinary applications.", "image_url": "https://customer-assets.emergentagent.com/job_xplicit-dispatch/artifacts/7geskeyg_516MF0pq-lL.__AC_SX300_SY300_QL70_ML2_.jpg"},
        {"name": "Best Whip Cream Charger Tank (635g)", "price": 99.99, "category": "Nitrous", "brand": "Best Whip", "size": "635g Tank", "description": "Best Whip food-grade nitrous oxide tank. Culinary-grade, ultra-pure filtered. Made in Italy. 21+ only.", "image_url": "https://customer-assets.emergentagent.com/job_xplicit-dispatch/artifacts/hjtyvxxb_Best_Whip_Food-Grade_Nitrous_Oxide_Tank_635g_clipped_rev_1__73291.webp"},
        {"name": "Whip Cream Chargers Blue (50-pack)", "price": 34.99, "category": "Nitrous", "brand": "Special Blue", "size": "50 chargers", "description": "Special Blue European whip cream chargers. 8g N2O cartridges for standard dispensers.", "image_url": "https://customer-assets.emergentagent.com/job_xplicit-dispatch/artifacts/dwdzd92x_OIP.webp"}
    ]
    inserted = 0
    for s in items:
        res = await db.products.update_one({"name": s["name"]}, {"$set": s, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
        if res.upserted_id:
            inserted += 1
    return {"ok": True, "inserted": inserted}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def create_indexes():
    try:
        await db.products.create_index("id", unique=True)
        await db.products.create_index([("category", 1), ("brand", 1)])
        await db.products.create_index("name", unique=False)
        await db.waitlist.create_index("email", unique=True)
        await db.waitlist.create_index([("created_at", -1)])
        await db.delivery_orders.create_index([("created_at", -1)])
    except Exception as e:
        logger.warning(f"Index creation issue: {e}")

@api_router.post("/seed")
async def seed_products():
    existing = await db.products.count_documents({"category": {"$in": ["Consumable", None]}})
    if existing > 0:
        return {"skipped": True, "count": existing}
    samples = [
        {"name": "Blue Dream 3.5g Flower Bag", "description": "Balanced uplift with berry notes. Fresh-sealed mylar bag.", "price": 34.00, "category": "Consumable", "brand": "Xplicit", "strain_type": "Hybrid", "size": "3.5g", "image_url": "https://images.unsplash.com/photo-1518465444133-93542d08fdd9", "coa_url": "https://example.com/coa/blue-dream.pdf"},
        {"name": "Sour Diesel 1g Gram Bag", "description": "Citrus-diesel aroma for daytime clarity. Single gram bag.", "price": 12.00, "category": "Consumable", "brand": "Xplicit", "strain_type": "Sativa", "size": "1g", "image_url": "https://images.unsplash.com/photo-1559558260-dfa522cfd57c", "coa_url": "https://example.com/coa/sour-diesel.pdf"},
    ]
    docs = []
    for s in samples:
        p = Product(**s)
        d = p.model_dump(); d['created_at'] = d['created_at'].isoformat()
        docs.append(d)
    if docs:
        await db.products.insert_many(docs)
    count = await db.products.count_documents({})
    return {"inserted": count}

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
