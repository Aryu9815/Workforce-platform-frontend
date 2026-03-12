import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  IndianRupee
} from 'lucide-react';
import { reimbursementsApi } from '../../api/reimbursements';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/DropdownMenu';
import { formatCurrency, formatDate, getErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { ReimbursementClaim, ExpenseCategory } from '../../types';

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  submitted: { label: 'Submitted', variant: 'warning', icon: Clock },
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  paid: { label: 'Paid', variant: 'success', icon: CheckCircle },
};

const ReimbursementList = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | ReimbursementClaim['status']>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    pages: 0,
  });

  const getPermissions = useAuthStore(state => state.getPermissions);

  useEffect(() => {
    reimbursementsApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [pagination.page, activeTab]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        page_size: pagination.page_size,
      };
      if (activeTab !== 'all') params.status = activeTab;

      const response = await reimbursementsApi.getClaims(params);

      setClaims(response.items);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        pages: response.pages,
        page_size: (response as any).page_size ?? prev.page_size,
      }));
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to fetch reimbursement claims'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await reimbursementsApi.approveClaim(id, 'approved');
      toast.success('Reimbursement claim approved');
      fetchClaims();
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to approve reimbursement claim'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reimbursementsApi.approveClaim(id, 'rejected');
      toast.success('Reimbursement claim rejected');
      fetchClaims();
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to reject reimbursement claim'));
    }
  };

  const categoryNameById = (categoryId?: string) => {
    if (!categoryId) return 'N/A';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'N/A';
  };

  const filteredClaims = claims.filter(claim => {
    const query = searchQuery.toLowerCase();
    return (
      claim.claim_number.toLowerCase().includes(query) ||
      (claim.description || '').toLowerCase().includes(query) ||
      (claim.staff_name || '').toLowerCase().includes(query)
    );
  });

  const totalAmount = claims.reduce((sum, claim) => sum + Number(claim.total_amount), 0);
  const pendingAmount = claims
    .filter(claim => claim.status === 'submitted')
    .reduce((sum, claim) => sum + Number(claim.total_amount), 0);
  const approvedAmount = claims
    .filter(claim => claim.status === 'approved' || claim.status === 'paid')
    .reduce((sum, claim) => sum + Number(claim.total_amount), 0);

  const canViewReimbursements = getPermissions('reimbursement:view');
  const canCreateReimbursements = getPermissions('reimbursement:create');
  const canApproveReimbursements = getPermissions('reimbursement:approve');
  
  if (!canViewReimbursements) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view reimbursements.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Reimbursements</h1>
          <p className="text-sm text-gray-500">
            Manage expense reimbursements and claims
          </p>
        </div>
        {canCreateReimbursements && (
          <Button onClick={() => navigate('/reimbursements/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Reimbursement
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[ 
          { label: "Total Claims", value: claims.length, icon: FileText },
          { label: "Total Amount", value: formatCurrency(totalAmount, 'INR'), icon: IndianRupee },
          { label: "Pending", value: formatCurrency(pendingAmount, 'INR'), icon: Clock },
          { label: "Approved/Paid", value: formatCurrency(approvedAmount, 'INR'), icon: CheckCircle }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border border-gray-200 bg-white shadow-none">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-3 rounded-full bg-teal-50">
                  <Icon className="h-6 w-6 text-teal-600" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-6 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reimbursements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-6 border-0 border-b border-gray-300 focus:border-teal-600 focus:ring-0 text-sm"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="submitted">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Claim","Employee","Main Category","Date","Amount","Status","Actions"].map((head,i)=>(
                    <th key={i} className="px-6 py-3 text-left font-medium text-gray-600">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No reimbursements found
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map(claim => {
                    const StatusConfig = statusConfig[claim.status];
                    const StatusIcon = StatusConfig?.icon || FileText;
                    const mainItem = claim.items[0];

                    return (
                      <tr
                        key={claim.id}
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => navigate(`/reimbursements/${claim.id}`)}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {claim.claim_number}
                          </p>
                          {claim.description && (
                            <p className="text-xs text-gray-500">
                              {claim.description.substring(0, 80)}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {claim.staff_name || claim.staff_id}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {mainItem ? categoryNameById(mainItem.category_id) : 'No items'}
                        </td>

                        <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(claim.claim_date)}
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatCurrency(claim.total_amount, claim.currency)}
                        </td>

                        <td className="px-6 py-4">
                          <Badge className="bg-gray-100 text-gray-700 flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {StatusConfig?.label}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/reimbursements/${claim.id}`)}>
                                View Details
                              </DropdownMenuItem>
                              {claim.status === 'submitted' && canApproveReimbursements && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(claim.id)}>
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(claim.id)}>
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReimbursementList;
