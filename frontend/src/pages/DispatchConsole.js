import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  RefreshCw,
  LogOut,
  MapPin,
  Phone,
  User,
  DollarSign
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Simple admin password (in production, use proper auth)
const ADMIN_PASSWORD = "xplicit2024";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500", icon: Clock, textColor: "text-yellow-400" },
  pending_dispatch: { label: "Pending", color: "bg-yellow-500", icon: Clock, textColor: "text-yellow-400" },
  confirmed: { label: "Confirmed", color: "bg-blue-500", icon: Package, textColor: "text-blue-400" },
  dispatched: { label: "Dispatched", color: "bg-purple-500", icon: Truck, textColor: "text-purple-400" },
  delivered: { label: "Delivered", color: "bg-emerald-500", icon: CheckCircle, textColor: "text-emerald-400" },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: XCircle, textColor: "text-red-400" },
};

const STATUS_FLOW = ["pending", "pending_dispatch", "confirmed", "dispatched", "delivered"];

export default function DispatchConsole() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, dispatched: 0, delivered: 0, cancelled: 0, total: 0 });

  // Check if already logged in
  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch orders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuth", "true");
      setLoginError("");
    } else {
      setLoginError("Invalid password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("adminAuth");
    navigate("/");
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/orders`);
      setOrders(data.orders || []);
      
      // Calculate stats
      const newStats = { pending: 0, confirmed: 0, dispatched: 0, delivered: 0, cancelled: 0, total: data.orders?.length || 0 };
      (data.orders || []).forEach(order => {
        let status = order.status || "pending";
        // Normalize pending_dispatch to pending for stats
        if (status === "pending_dispatch") status = "pending";
        if (newStats[status] !== undefined) newStats[status]++;
      });
      setStats(newStats);
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API}/admin/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(); // Refresh orders
    } catch (e) {
      console.error("Failed to update order:", e);
    }
  };

  const getNextStatus = (currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch = !searchQuery || 
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.phone?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-zinc-900 border-emerald-500/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Package className="w-8 h-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl text-white">Dispatcher Console</CardTitle>
            <p className="text-zinc-400 text-sm mt-2">Admin access required</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-testid="admin-password-input"
                />
                {loginError && (
                  <p className="text-red-400 text-sm mt-2" data-testid="login-error">{loginError}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                data-testid="admin-login-btn"
              >
                Access Console
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                className="w-full text-zinc-400 hover:text-white"
                onClick={() => navigate("/")}
              >
                Back to Shop
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Console
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-emerald-500/30 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dispatcher Console</h1>
              <p className="text-xs text-zinc-400">XplicitkreationZ Order Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={fetchOrders} 
              variant="outline" 
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              data-testid="refresh-orders-btn"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="text-zinc-400 hover:text-white"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" data-testid="stats-cards">
          {Object.entries(STATUS_CONFIG)
            .filter(([status]) => !['pending_dispatch'].includes(status)) // Hide duplicate statuses
            .map(([status, config]) => (
            <Card 
              key={status} 
              className={`bg-zinc-900 border-zinc-800 cursor-pointer transition-all ${filterStatus === status ? 'ring-2 ring-emerald-500' : 'hover:border-zinc-700'}`}
              onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              data-testid={`stat-${status}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wide">{config.label}</p>
                    <p className={`text-2xl font-bold ${config.textColor}`}>{stats[status]}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${config.color}/20 flex items-center justify-center`}>
                    <config.icon className={`w-5 h-5 ${config.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search by order ID, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
              data-testid="order-search-input"
            />
          </div>
          <Button 
            onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:text-white"
          >
            Clear Filters
          </Button>
        </div>

        {/* Orders List */}
        <div className="space-y-4" data-testid="orders-list">
          {filteredOrders.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No orders found</p>
                <p className="text-zinc-500 text-sm mt-1">
                  {orders.length === 0 ? "Orders will appear here when customers place them" : "Try adjusting your filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map(order => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const nextStatus = getNextStatus(order.status);
              
              return (
                <Card key={order.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all" data-testid={`order-${order.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} text-white flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                          <span className="text-zinc-400 text-sm">Order #{order.id?.slice(0, 8)}</span>
                          <span className="text-zinc-500 text-xs">{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          {/* Customer */}
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-zinc-500 mt-0.5" />
                            <div>
                              <p className="text-white text-sm font-medium">{order.customer?.name || "N/A"}</p>
                              <p className="text-zinc-400 text-xs flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {order.customer?.phone || "N/A"}
                              </p>
                            </div>
                          </div>
                          
                          {/* Delivery Address */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-zinc-500 mt-0.5" />
                            <div>
                              <p className="text-white text-sm">{order.delivery?.address || "N/A"}</p>
                              <p className="text-zinc-400 text-xs">{order.delivery?.zip || ""}</p>
                            </div>
                          </div>
                          
                          {/* Order Total */}
                          <div className="flex items-start gap-2">
                            <DollarSign className="w-4 h-4 text-zinc-500 mt-0.5" />
                            <div>
                              <p className="text-emerald-400 text-sm font-semibold">${order.total?.toFixed(2) || "0.00"}</p>
                              <p className="text-zinc-400 text-xs">{order.items?.length || 0} items</p>
                            </div>
                          </div>
                        </div>

                        {/* Items Preview */}
                        {order.items && order.items.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-zinc-800">
                            <p className="text-zinc-500 text-xs mb-1">Items:</p>
                            <p className="text-zinc-300 text-sm">
                              {order.items.map(item => {
                                const name = item.name || `Product #${item.product_id?.slice(0,6) || '???'}`;
                                const qty = item.qty || item.quantity || 1;
                                const variant = item.variant ? ` - ${item.variant}` : '';
                                return `${name}${variant} (x${qty})`;
                              }).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        {nextStatus && order.status !== 'cancelled' && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, nextStatus)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
                            data-testid={`advance-${order.id}`}
                          >
                            → {STATUS_CONFIG[nextStatus].label}
                          </Button>
                        )}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            data-testid={`cancel-${order.id}`}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
