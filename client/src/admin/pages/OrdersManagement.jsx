import { useEffect, useState } from 'react'
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  Truck, 
  XCircle,
  DollarSign,
  ShoppingBag,
  AlertCircle
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { CURRENCY_SYMBOL } from '../../config/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const OrdersManagement = () => {
  const [orders, setOrders] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [statusFilter, paymentFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (paymentFilter !== 'all') params.paymentStatus = paymentFilter

      const [ordersRes, statsRes] = await Promise.all([
        adminApi.getOrders(params),
        adminApi.getOrderStatistics()
      ])

      setOrders(ordersRes.data || [])
      setStatistics(statsRes.data || {})
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus)
      await loadData()
      if (selectedOrder?.id === orderId) {
        const updated = await adminApi.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      alert(`Failed to update order status: ${err.message}`)
    }
  }

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      await adminApi.updatePaymentStatus(orderId, newPaymentStatus)
      await loadData()
      if (selectedOrder?.id === orderId) {
        const updated = await adminApi.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      alert(`Failed to update payment status: ${err.message}`)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.phone?.includes(searchTerm)
    return matchesSearch
  })

  const getStatusBadge = (status) => {
    const badges = {
      placed: { color: 'bg-blue-100 text-blue-800', label: 'Placed' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      preparing: { color: 'bg-yellow-100 text-yellow-800', label: 'Preparing' },
      out_for_delivery: { color: 'bg-purple-100 text-purple-800', label: 'Out for Delivery' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    }
    const badge = badges[status] || badges.placed
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (paymentStatus) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      pending_verification: { color: 'bg-orange-100 text-orange-800', label: 'Pending Verification' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    }
    const badge = badges[paymentStatus] || badges.pending
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-deep-green">Orders Management</h1>
        <p className="text-gray-600 mt-1">Manage customer orders and track deliveries</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<ShoppingBag className="text-blue-600" />}
            label="Total Orders"
            value={statistics.totalOrders || 0}
            color="bg-blue-50"
          />
          <StatCard
            icon={<Clock className="text-yellow-600" />}
            label="Pending Orders"
            value={statistics.pendingOrders || 0}
            color="bg-yellow-50"
          />
          <StatCard
            icon={<AlertCircle className="text-orange-600" />}
            label="Pending Payments"
            value={statistics.pendingPayments || 0}
            color="bg-orange-50"
          />
          <StatCard
            icon={<DollarSign className="text-green-600" />}
            label="Total Revenue"
            value={`${CURRENCY_SYMBOL}${statistics.totalRevenue || 0}`}
            color="bg-green-50"
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by order number, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-deep-green">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{order.customer?.fullName}</div>
                        <div className="text-gray-500">{order.customer?.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {CURRENCY_SYMBOL}{order.pricing?.total || 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {getPaymentStatusBadge(order.payment?.status)}
                        <div className="text-xs text-gray-500 capitalize">
                          {order.payment?.method}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-deep-green hover:underline flex items-center gap-1 text-sm"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          onUpdateStatus={handleUpdateOrderStatus}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          getStatusBadge={getStatusBadge}
          getPaymentStatusBadge={getPaymentStatusBadge}
        />
      )}
    </div>
  )
}

const StatCard = ({ icon, label, value, color }) => (
  <div className={`${color} rounded-lg p-4`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
)

const OrderDetailModal = ({ 
  order, 
  onClose, 
  onUpdateStatus, 
  onUpdatePaymentStatus,
  getStatusBadge,
  getPaymentStatusBadge 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-deep-green">
            Order Details - {order.orderNumber}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Payment Management */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Order Status */}
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package size={20} />
                Order Status
              </h3>
              <div className="mb-3">{getStatusBadge(order.status)}</div>
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                className="input"
              >
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status */}
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign size={20} />
                Payment Status
              </h3>
              <div className="mb-3">
                {getPaymentStatusBadge(order.payment?.status)}
                <div className="text-sm text-gray-600 mt-1 capitalize">
                  Method: {order.payment?.method}
                </div>
              </div>
              <select
                value={order.payment?.status}
                onChange={(e) => onUpdatePaymentStatus(order.id, e.target.value)}
                className="input"
              >
                <option value="pending">Pending</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Customer Information */}
          <div className="card">
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <div className="font-medium">{order.customer?.fullName}</div>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <div className="font-medium">{order.customer?.email}</div>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <div className="font-medium">{order.customer?.phone}</div>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-600">Delivery Address:</span>
                <div className="font-medium">
                  {order.customer?.address?.street}, {order.customer?.address?.city},{' '}
                  {order.customer?.address?.state} - {order.customer?.address?.pincode}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <h3 className="font-semibold mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-4 pb-3 border-b last:border-0">
                  <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🥣
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      {CURRENCY_SYMBOL}{item.basePrice} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-semibold">
                    {CURRENCY_SYMBOL}{item.subtotal}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="card">
            <h3 className="font-semibold mb-3">Pricing Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {CURRENCY_SYMBOL}{order.pricing?.subtotal || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charge:</span>
                <span className="font-medium">
                  {order.pricing?.deliveryCharge > 0
                    ? `${CURRENCY_SYMBOL}${order.pricing.deliveryCharge}`
                    : 'FREE'}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-deep-green">
                  {CURRENCY_SYMBOL}{order.pricing?.total || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="card">
              <h3 className="font-semibold mb-2">Order Notes</h3>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Created: {new Date(order.createdAt).toLocaleString()}</div>
            <div>Last Updated: {new Date(order.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrdersManagement
