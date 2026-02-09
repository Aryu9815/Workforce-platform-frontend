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
  AlertCircle,
  Calendar,
  User,
  DollarSign,
  Download
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import type { Reimbursement } from '../../types/reimbursement';

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText },
  submitted: { label: 'Submitted', variant: 'warning' as const, icon: Clock },
  under_review: { label: 'Under Review', variant: 'default' as const, icon: AlertCircle },
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
  paid: { label: 'Paid', variant: 'success' as const, icon: CheckCircle },
};

const ReimbursementList = () =>  {
  const navigate = useNavigate();
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchReimbursements();
  }, [pagination.page, activeTab]);

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const response = await reimbursementsApi.getAll(params);
      setReimbursements(response.data.items);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        pages: response.data.pages,
      }));
    } catch (error) {
      toast.error('Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReimbursement) return;
    try {
      await reimbursementsApi.delete(selectedReimbursement.id);
      toast.success('Reimbursement deleted successfully');
      fetchReimbursements();
    } catch (error) {
      toast.error('Failed to delete reimbursement');
    } finally {
      setShowDeleteDialog(false);
      setSelectedReimbursement(null);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await reimbursementsApi.approve(id, { notes: '' });
      toast.success('Reimbursement approved');
      fetchReimbursements();
    } catch (error) {
      toast.error('Failed to approve reimbursement');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await reimbursementsApi.reject(id, { reason: '' });
      toast.success('Reimbursement rejected');
      fetchReimbursements();
    } catch (error) {
      toast.error('Failed to reject reimbursement');
    }
  };

  const filteredReimbursements = reimbursements.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.staff?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = reimbursements.reduce((sum, r) => sum + Number(r.amount), 0);
  const pendingAmount = reimbursements
    .filter(r => ['submitted', 'under_review'].includes(r.status))
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const approvedAmount = reimbursements
    .filter(r => ['approved', 'paid'].includes(r.status))
    .reduce((sum, r) => sum + Number(r.amount), 0);

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
                <p className="text-2xl font-bold">{reimbursements.length}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(approvedAmount)}</p>
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

      {/* Reimbursements Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Claim</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
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
                ) : filteredReimbursements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4" />
                      <p>No reimbursements found</p>
                    </td>
                  </tr>
                ) : (
                  filteredReimbursements.map((reimbursement) => {
                    const StatusIcon = statusConfig[reimbursement.status as keyof typeof statusConfig]?.icon || FileText;
                    return (
                      <tr
                        key={reimbursement.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/reimbursements/${reimbursement.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{reimbursement.title}</p>
                            <p className="text-sm text-muted-foreground">{reimbursement.description?.substring(0, 50)}...</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{reimbursement.staff?.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span>{reimbursement.category?.name || 'Uncategorized'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(reimbursement.expense_date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{formatCurrency(reimbursement.amount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={statusConfig[reimbursement.status as keyof typeof statusConfig]?.variant || 'default'}
                            className="flex items-center gap-1 w-fit"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[reimbursement.status as keyof typeof statusConfig]?.label || reimbursement.status}
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
                                navigate(`/reimbursements/${reimbursement.id}`);
                              }}>
                                View Details
                              </DropdownMenuItem>
                              {reimbursement.status === 'submitted' && (
                                <>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(reimbursement.id);
                                  }}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(reimbursement.id);
                                  }}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {reimbursement.receipt_url && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(reimbursement.receipt_url, '_blank');
                                }}>
                                  <Download className="mr-2 h-4 w-4" />
                                  View Receipt
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReimbursement(reimbursement);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
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
          {!loading && filteredReimbursements.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
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

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reimbursement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedReimbursement?.title}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReimbursementList;