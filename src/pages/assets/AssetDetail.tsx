import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { assetsApi } from '@/api/assets'
import {formatCurrency} from '@/lib/utils'
import {
  ArrowLeft,
  Calendar,
  Tag,
  Hash,
  MapPin,
  Info,
  History,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Layers,
  // DollarSign,
  IndianRupee
} from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/separator'

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset-history', id],
    queryFn: () => assetsApi.getAssetHistory(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700"></div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Asset Not Found</h2>
        <p className="text-gray-500 mt-2">The asset you are looking for does not exist or you don't have permission to view it.</p>
        <button
          onClick={() => navigate('/assets')}
          className="mt-4 px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition"
        >
          Back to Assets
        </button>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Available</Badge>
      case 'assigned':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Assigned</Badge>
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Maintenance</Badge>
      case 'lost':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Lost</Badge>
      case 'disposed':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">Disposed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/assets')}
            className="p-2 rounded-md hover:bg-gray-200 transition text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{asset.asset_tag}</h1>
              {getStatusBadge(asset.status)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {asset.asset_type.brand} {asset.asset_type.name} • {asset.category.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Asset Info & Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-teal-700" />
                Asset Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Asset Tag</p>
                      <p className="text-sm font-semibold text-gray-900">{asset.asset_tag}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Serial Number</p>
                      <p className="text-sm font-semibold text-gray-900">{asset.serial_number || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{asset.location || 'Not Specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Purchase Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {asset.purchase_date ? format(new Date(asset.purchase_date), 'PPP') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IndianRupee className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Purchase Price</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {asset.purchase_price ? formatCurrency(asset.purchase_price) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-teal-700" />
                Assignment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {asset.assignment_history.length > 0 ? (
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-4">
                  {asset.assignment_history.map((item) => (
                    <div key={item.id} className="relative pl-8">
                      {/* Timeline Dot */}
                      <div className={`absolute left-[-9px] top-0 h-4 w-4 rounded-full border-2 bg-white ${item.is_active ? 'border-teal-600' : 'border-gray-300'}`} />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            {item.staff_name}
                            {item.is_active && (
                              <Badge className="bg-teal-50 text-teal-700 text-[10px] h-5 border-teal-200">Current</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Assigned: {format(new Date(item.assigned_date), 'MMM dd, yyyy')}
                            </span>
                            {item.returned_date && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Returned: {format(new Date(item.returned_date), 'MMM dd, yyyy')}
                              </span>
                            )}
                            {!item.returned_date && item.expected_return_date && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock className="h-3 w-3" />
                                Expected: {format(new Date(item.expected_return_date), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs space-y-1">
                          {item.condition_on_assign && (
                            <p className="text-gray-500">
                              <span className="font-medium text-gray-700">Assign Condition:</span> {item.condition_on_assign}
                            </p>
                          )}
                          {item.condition_on_return && (
                            <p className="text-gray-500">
                              <span className="font-medium text-gray-700">Return Condition:</span> {item.condition_on_return}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 italic">
                  No assignment history found for this asset.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ownership & Classification */}
        <div className="space-y-6">
          {/* Current Holder */}
          <Card className={`${asset.current_assignment ? 'border-teal-200 bg-teal-50/30' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <User className="h-4 w-4" />
                Current Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {asset.current_assignment ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                      {asset.current_assignment.staff_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{asset.current_assignment.staff_name}</p>
                      <p className="text-xs text-gray-500">Since {format(new Date(asset.current_assignment.assigned_date), 'PPP')}</p>
                    </div>
                  </div>
                  <Separator className="bg-teal-200/50" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Condition</span>
                      <span className="font-medium text-gray-900">{asset.current_assignment.condition_on_assign || 'Good'}</span>
                    </div>
                    {asset.current_assignment.expected_return_date && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Due Date</span>
                        <span className="font-medium text-amber-700">
                          {format(new Date(asset.current_assignment.expected_return_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 italic">Not currently assigned</p>
                  <p className="text-xs text-gray-400 mt-1">This asset is available for checkout</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                <div className="flex items-center gap-2 mt-1">
                  <Package className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-semibold text-gray-900">{asset.category.name}</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4">{asset.category.code}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Asset Type</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{asset.asset_type.name}</p>
                  <p className="text-xs text-gray-500">{asset.asset_type.brand} {asset.asset_type.model_number}</p>
                </div>
              </div>
              {asset.asset_type.tag_prefix && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Tag Prefix</p>
                  <p className="text-sm font-mono font-semibold text-teal-700 mt-1">{asset.asset_type.tag_prefix}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gray-900 text-white border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Total Assignments</p>
                  <p className="text-3xl font-bold mt-1">{asset.total_assignments}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <History className="h-6 w-6 text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}