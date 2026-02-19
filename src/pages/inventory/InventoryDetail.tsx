// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   ArrowLeft,
//   Package,
//   AlertTriangle,
//   TrendingUp,
//   TrendingDown,
//   DollarSign,
//   Building2,
//   Calendar,
//   Edit,
//   Trash2,
//   Plus,
//   Minus,
//   History,
//   BarChart3,
//   FileText,
//   User
// } from 'lucide-react';
// import { inventoryApi } from '../../api/inventory';
// import { Button } from '../../components/ui/Button';
// import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
// import { formatCurrency, formatDate } from '../../lib/utils';
// import { toast } from 'sonner';
// import type { InventoryItem, StockMovement } from '../../types/inventory';

// export default function InventoryDetail() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const [item, setItem] = useState<InventoryItem | null>(null);
//   const [movements, setMovements] = useState<StockMovement[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [showAdjustDialog, setShowAdjustDialog] = useState(false);
//   const [adjustment, setAdjustment] = useState({ quantity: 0, type: 'in', reason: '' });

//   useEffect(() => {
//     if (id) {
//       fetchItem();
//       fetchMovements();
//     }
//   }, [id]);

//   const fetchItem = async () => {
//     try {
//       const response = await inventoryApi.getById(Number(id));
//       setItem(response.data);
//     } catch (error) {
//       toast.error('Failed to fetch inventory item');
//       navigate('/inventory');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchMovements = async () => {
//     try {
//       const response = await inventoryApi.getMovements(Number(id));
//       setMovements(response.data);
//     } catch (error) {
//       console.error('Failed to fetch stock movements');
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       await inventoryApi.delete(Number(id));
//       toast.success('Item deleted successfully');
//       navigate('/inventory');
//     } catch (error) {
//       toast.error('Failed to delete item');
//     }
//   };

//   const handleAdjustStock = async () => {
//     try {
//       await inventoryApi.adjustStock(Number(id), adjustment);
//       toast.success('Stock adjusted successfully');
//       setShowAdjustDialog(false);
//       fetchItem();
//       fetchMovements();
//       setAdjustment({ quantity: 0, type: 'in', reason: '' });
//     } catch (error) {
//       toast.error('Failed to adjust stock');
//     }
//   };

//   const getStockStatus = (item: InventoryItem) => {
//     if (item.quantity <= item.min_stock_level) {
//       return { label: 'Critical Low', variant: 'destructive' as const };
//     }
//     if (item.quantity <= item.reorder_point) {
//       return { label: 'Low Stock', variant: 'warning' as const };
//     }
//     return { label: 'In Stock', variant: 'success' as const };
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   if (!item) {
//     return (
//       <div className="text-center py-12">
//         <Package className="mx-auto h-12 w-12 text-muted-foreground" />
//         <h3 className="mt-4 text-lg font-medium">Item not found</h3>
//         <Button className="mt-4" onClick={() => navigate('/inventory')}>
//           <ArrowLeft className="mr-2 h-4 w-4" />
//           Back to Inventory
//         </Button>
//       </div>
//     );
//   }

//   const stockStatus = getStockStatus(item);
//   const stockValue = item.quantity * item.unit_cost;
//   const profitMargin = item.selling_price > 0 
//     ? ((item.selling_price - item.unit_cost) / item.selling_price * 100).toFixed(1)
//     : '0';

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <Button variant="outline" size="icon" onClick={() => navigate('/inventory')}>
//             <ArrowLeft className="h-4 w-4" />
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold flex items-center gap-2">
//               <Package className="h-6 w-6" />
//               {item.name}
//             </h1>
//             <p className="text-muted-foreground">{item.sku} • {item.category?.name}</p>
//           </div>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="outline" onClick={() => setShowAdjustDialog(true)}>
//             <Plus className="mr-2 h-4 w-4" />
//             Adjust Stock
//           </Button>
//           <Button variant="outline" onClick={() => navigate(`/inventory/${id}/edit`)}>
//             <Edit className="mr-2 h-4 w-4" />
//             Edit
//           </Button>
//           <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
//             <Trash2 className="mr-2 h-4 w-4" />
//             Delete
//           </Button>
//         </div>
//       </div>

//       {/* Stock Alert */}
//       {stockStatus.variant === 'destructive' && (
//         <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
//           <AlertTriangle className="h-5 w-5 text-destructive" />
//           <div>
//             <p className="font-medium text-destructive">Critical Low Stock Alert</p>
//             <p className="text-sm text-destructive/80">
//               Current stock ({item.quantity}) is below minimum level ({item.min_stock_level}). Reorder immediately!
//             </p>
//           </div>
//         </div>
//       )}

//       {stockStatus.variant === 'warning' && (
//         <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
//           <AlertTriangle className="h-5 w-5 text-yellow-600" />
//           <div>
//             <p className="font-medium text-yellow-700">Low Stock Warning</p>
//             <p className="text-sm text-yellow-600">
//               Current stock ({item.quantity}) is at or below reorder point ({item.reorder_point}).
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Current Stock</p>
//                 <p className="text-3xl font-bold">{item.quantity}</p>
//                 <p className="text-xs text-muted-foreground">{item.unit_of_measure}</p>
//               </div>
//               <div className={`p-3 rounded-full ${
//                 stockStatus.variant === 'success' ? 'bg-green-100' :
//                 stockStatus.variant === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
//               }`}>
//                 <Package className={`h-6 w-6 ${
//                   stockStatus.variant === 'success' ? 'text-green-600' :
//                   stockStatus.variant === 'warning' ? 'text-yellow-600' : 'text-red-600'
//                 }`} />
//               </div>
//             </div>
//             <div className="mt-4">
//               <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Unit Cost</p>
//                 <p className="text-3xl font-bold">{formatCurrency(item.unit_cost)}</p>
//                 <p className="text-xs text-muted-foreground">per {item.unit_of_measure}</p>
//               </div>
//               <div className="p-3 rounded-full bg-blue-100">
//                 <DollarSign className="h-6 w-6 text-blue-600" />
//               </div>
//             </div>
//             <div className="mt-4">
//               <p className="text-sm text-muted-foreground">
//                 Selling: {formatCurrency(item.selling_price)}
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Stock Value</p>
//                 <p className="text-3xl font-bold">{formatCurrency(stockValue)}</p>
//                 <p className="text-xs text-muted-foreground">total value</p>
//               </div>
//               <div className="p-3 rounded-full bg-purple-100">
//                 <BarChart3 className="h-6 w-6 text-purple-600" />
//               </div>
//             </div>
//             <div className="mt-4">
//               <p className="text-sm text-muted-foreground">
//                 Margin: {profitMargin}%
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Location</p>
//                 <p className="text-xl font-bold">{item.location || 'Not set'}</p>
//                 <p className="text-xs text-muted-foreground">{item.supplier?.name || 'No supplier'}</p>
//               </div>
//               <div className="p-3 rounded-full bg-orange-100">
//                 <Building2 className="h-6 w-6 text-orange-600" />
//               </div>
//             </div>
//             <div className="mt-4">
//               <p className="text-sm text-muted-foreground">
//                 Warehouse: {item.warehouse?.name || 'Default'}
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Tabs */}
//       <Tabs defaultValue="details" className="space-y-4">
//         <TabsList>
//           <TabsTrigger value="details">Details</TabsTrigger>
//           <TabsTrigger value="movements">Stock Movements</TabsTrigger>
//           <TabsTrigger value="alerts">Alerts & Settings</TabsTrigger>
//         </TabsList>

//         <TabsContent value="details" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>Item Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm font-medium text-muted-foreground">SKU</label>
//                   <p>{item.sku}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-muted-foreground">Barcode</label>
//                   <p>{item.barcode || 'Not set'}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-muted-foreground">Category</label>
//                   <p>{item.category?.name || 'Uncategorized'}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-muted-foreground">Unit of Measure</label>
//                   <p>{item.unit_of_measure}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-muted-foreground">Supplier</label>
//                   <p>{item.supplier?.name || 'Not assigned'}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-muted-foreground">Warehouse</label>
//                   <p>{item.warehouse?.name || 'Default'}</p>
//                 </div>
//               </div>
//               {item.description && (
//                 <div>
//                   <label className="text-sm font-medium text-muted-foreground">Description</label>
//                   <p className="mt-1">{item.description}</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Pricing Information</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="p-4 bg-muted rounded-lg">
//                   <p className="text-sm text-muted-foreground">Unit Cost</p>
//                   <p className="text-2xl font-bold">{formatCurrency(item.unit_cost)}</p>
//                 </div>
//                 <div className="p-4 bg-muted rounded-lg">
//                   <p className="text-sm text-muted-foreground">Selling Price</p>
//                   <p className="text-2xl font-bold">{formatCurrency(item.selling_price)}</p>
//                 </div>
//                 <div className="p-4 bg-muted rounded-lg">
//                   <p className="text-sm text-muted-foreground">Profit per Unit</p>
//                   <p className="text-2xl font-bold text-green-600">
//                     {formatCurrency(item.selling_price - item.unit_cost)}
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="movements">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <History className="h-5 w-5" />
//                 Stock Movement History
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {movements.length === 0 ? (
//                 <div className="text-center py-8 text-muted-foreground">
//                   <History className="mx-auto h-12 w-12 mb-4" />
//                   <p>No stock movements recorded yet</p>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {movements.map((movement) => (
//                     <div
//                       key={movement.id}
//                       className="flex items-center justify-between p-4 border rounded-lg"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className={`p-2 rounded-full ${
//                           movement.movement_type === 'in' || movement.movement_type === 'adjustment_in'
//                             ? 'bg-green-100'
//                             : 'bg-red-100'
//                         }`}>
//                           {movement.movement_type === 'in' || movement.movement_type === 'adjustment_in' ? (
//                             <TrendingUp className={`h-5 w-5 ${
//                               movement.movement_type === 'in' ? 'text-green-600' : 'text-blue-600'
//                             }`} />
//                           ) : (
//                             <TrendingDown className="h-5 w-5 text-red-600" />
//                           )}
//                         </div>
//                         <div>
//                           <p className="font-medium capitalize">
//                             {movement.movement_type.replace('_', ' ')}
//                           </p>
//                           <p className="text-sm text-muted-foreground">
//                             {movement.reason || 'No reason provided'}
//                           </p>
//                           <p className="text-xs text-muted-foreground">
//                             by {movement.created_by?.full_name || 'System'} • {formatDate(movement.created_at)}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <p className={`text-lg font-bold ${
//                           movement.movement_type === 'in' || movement.movement_type === 'adjustment_in'
//                             ? 'text-green-600'
//                             : 'text-red-600'
//                         }`}>
//                           {movement.movement_type === 'in' || movement.movement_type === 'adjustment_in' ? '+' : '-'}
//                           {movement.quantity}
//                         </p>
//                         <p className="text-sm text-muted-foreground">
//                           Balance: {movement.balance_after}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="alerts">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <AlertTriangle className="h-5 w-5" />
//                 Stock Alert Settings
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="p-4 border rounded-lg">
//                   <p className="text-sm text-muted-foreground">Minimum Stock Level</p>
//                   <p className="text-2xl font-bold">{item.min_stock_level}</p>
//                   <p className="text-xs text-muted-foreground">Critical alert below this</p>
//                 </div>
//                 <div className="p-4 border rounded-lg">
//                   <p className="text-sm text-muted-foreground">Reorder Point</p>
//                   <p className="text-2xl font-bold">{item.reorder_point}</p>
//                   <p className="text-xs text-muted-foreground">Warning alert at this level</p>
//                 </div>
//                 <div className="p-4 border rounded-lg">
//                   <p className="text-sm text-muted-foreground">Reorder Quantity</p>
//                   <p className="text-2xl font-bold">{item.reorder_quantity}</p>
//                   <p className="text-xs text-muted-foreground">Suggested order amount</p>
//                 </div>
//               </div>

//               <div className="bg-muted p-4 rounded-lg">
//                 <h4 className="font-medium mb-2">Alert Status</h4>
//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <span>Current Stock</span>
//                     <span className="font-medium">{item.quantity}</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-2">
//                     <div
//                       className={`h-2 rounded-full ${
//                         item.quantity <= item.min_stock_level ? 'bg-red-500' :
//                         item.quantity <= item.reorder_point ? 'bg-yellow-500' : 'bg-green-500'
//                       }`}
//                       style={{
//                         width: `${Math.min(100, (item.quantity / (item.reorder_point * 2)) * 100)}%`
//                       }}
//                     ></div>
//                   </div>
//                   <div className="flex justify-between text-sm text-muted-foreground">
//                     <span>0</span>
//                     <span>Min: {item.min_stock_level}</span>
//                     <span>Reorder: {item.reorder_point}</span>
//                     <span>{item.reorder_point * 2}</span>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Delete Dialog */}
//       <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Inventory Item</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="flex justify-end gap-2 mt-4">
//             <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={handleDelete}>
//               Delete
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Adjust Stock Dialog */}
//       <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Adjust Stock</DialogTitle>
//             <DialogDescription>
//               Adjust stock quantity for <strong>{item.name}</strong>
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 mt-4">
//             <div>
//               <label className="text-sm font-medium">Adjustment Type</label>
//               <div className="flex gap-2 mt-2">
//                 <Button
//                   type="button"
//                   variant={adjustment.type === 'in' ? 'default' : 'outline'}
//                   onClick={() => setAdjustment({ ...adjustment, type: 'in' })}
//                   className="flex-1"
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   Stock In
//                 </Button>
//                 <Button
//                   type="button"
//                   variant={adjustment.type === 'out' ? 'default' : 'outline'}
//                   onClick={() => setAdjustment({ ...adjustment, type: 'out' })}
//                   className="flex-1"
//                 >
//                   <Minus className="mr-2 h-4 w-4" />
//                   Stock Out
//                 </Button>
//               </div>
//             </div>
//             <div>
//               <label className="text-sm font-medium">Quantity</label>
//               <input
//                 type="number"
//                 min="1"
//                 value={adjustment.quantity}
//                 onChange={(e) => setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })}
//                 className="w-full mt-1 px-3 py-2 border rounded-md"
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium">Reason</label>
//               <textarea
//                 value={adjustment.reason}
//                 onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
//                 placeholder="Enter reason for adjustment..."
//                 className="w-full mt-1 px-3 py-2 border rounded-md"
//                 rows={3}
//               />
//             </div>
//           </div>
//           <div className="flex justify-end gap-2 mt-4">
//             <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleAdjustStock} disabled={adjustment.quantity <= 0}>
//               Confirm Adjustment
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
