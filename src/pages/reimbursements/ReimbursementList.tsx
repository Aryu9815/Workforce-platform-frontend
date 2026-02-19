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
  // DollarSign,
  IndianRupee
} from 'lucide-react';
import { reimbursementsApi } from '../../api/reimbursements';
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
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import type { ReimbursementClaim, ExpenseCategory } from '../../types';

const statusConfig: Record<
  ReimbursementClaim['status'],
  { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive'; icon: typeof FileText }
> = {
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

  useEffect(() => {
    reimbursementsApi
      .getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [pagination.page, activeTab]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params: {
        page?: number;
        page_size?: number;
        staff_id?: string;
        status?: string;
        project_id?: string;
      } = {
        page: pagination.page,
        page_size: pagination.page_size,
      };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const response = await reimbursementsApi.getClaims(params);
      setClaims(response.items);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        pages: response.pages,
        page_size: (response as any).page_size ?? prev.page_size,
      }));
    } catch {
      toast.error('Failed to fetch reimbursement claims');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await reimbursementsApi.approveClaim(id, 'approved');
      toast.success('Reimbursement claim approved');
      fetchClaims();
    } catch {
      toast.error('Failed to approve reimbursement claim');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reimbursementsApi.approveClaim(id, 'rejected');
      toast.success('Reimbursement claim rejected');
      fetchClaims();
    } catch {
      toast.error('Failed to reject reimbursement claim');
    }
  };

  const categoryNameById = (categoryId: string | undefined) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reimbursements</h1>
          <p className="text-muted-foreground">Manage expense reimbursements and claims</p>
        </div>
        <Button onClick={() => navigate('/reimbursements/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Reimbursement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold">{claims.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount, 'INR')}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <IndianRupee className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingAmount, 'INR')}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved/Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(approvedAmount, 'INR')}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reimbursements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="submitted">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Reimbursement Claims Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Claim</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Main Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4" />
                      <p>No reimbursements found</p>
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
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/reimbursements/${claim.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{claim.claim_number}</p>
                            {claim.description && (
                              <p className="text-sm text-muted-foreground">
                                {claim.description.substring(0, 80)}
                                {claim.description.length > 80 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{claim.staff_name || claim.staff_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span>
                            {mainItem ? categoryNameById(mainItem.category_id) : 'No items'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(claim.claim_date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">
                            {formatCurrency(claim.total_amount, claim.currency)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={StatusConfig?.variant || 'default'}
                            className="flex items-center gap-1 w-fit"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {StatusConfig?.label || claim.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/reimbursements/${claim.id}`);
                              }}>
                                View Details
                              </DropdownMenuItem>
                              {claim.status === 'submitted' && (
                                <>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(claim.id);
                                  }}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(claim.id);
                                  }}>
                                    <XCircle className="mr-2 h-4 w-4" />
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

          {/* Pagination */}
          {!loading && filteredClaims.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.page_size + 1} to{' '}
                {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReimbursementList;
