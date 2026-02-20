import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  CreditCard,
} from 'lucide-react';
import { reimbursementsApi } from '../../api/reimbursements';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/sonner';
import type { ReimbursementClaim, ExpenseCategory } from '../../types';

const statusConfig: Record<
  ReimbursementClaim['status'],
  { label: string; icon: typeof FileText; color: string }
> = {
  draft: { label: 'Draft', icon: FileText, color: 'text-gray-600' },
  submitted: { label: 'Submitted', icon: Clock, color: 'text-yellow-600' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600' },
  paid: { label: 'Paid', icon: CreditCard, color: 'text-green-600' },
};

const ReimbursementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<ReimbursementClaim | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const getPermissions = useAuthStore(state => state.getPermissions);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [claimResponse, categoriesResponse] = await Promise.all([
          reimbursementsApi.getClaim(id),
          reimbursementsApi.getCategories().catch(() => [] as ExpenseCategory[]),
        ]);
        setClaim(claimResponse);
        setCategories(categoriesResponse);
      } catch {
        toast.error('Failed to fetch reimbursement claim');
        navigate('/reimbursements');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const refreshClaim = async () => {
    if (!id) return;
    try {
      const data = await reimbursementsApi.getClaim(id);
      setClaim(data);
    } catch {
      toast.error('Failed to refresh reimbursement claim');
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await reimbursementsApi.submitClaim(id);
      toast.success('Reimbursement claim submitted for approval');
      await refreshClaim();
    } catch {
      toast.error('Failed to submit reimbursement claim');
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await reimbursementsApi.approveClaim(id, 'approved', notes || undefined);
      toast.success('Reimbursement claim approved');
      setShowApproveDialog(false);
      setNotes('');
      await refreshClaim();
    } catch {
      toast.error('Failed to approve reimbursement claim');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      await reimbursementsApi.approveClaim(id, 'rejected', rejectionReason || undefined);
      toast.success('Reimbursement claim rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      await refreshClaim();
    } catch {
      toast.error('Failed to reject reimbursement claim');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id) return;
    try {
      await reimbursementsApi.markAsPaid(id, paymentReference);
      toast.success('Reimbursement claim marked as paid');
      setShowPayDialog(false);
      setPaymentReference('');
      await refreshClaim();
    } catch {
      toast.error('Failed to mark reimbursement claim as paid');
    }
  };

  const categoryNameById = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const canViewReimbursements = getPermissions('reimbursements:view' as any) || getPermissions('attendance:view');
  const canSubmitReimbursement = getPermissions('reimbursements:create' as any) || getPermissions('attendance:mark');
  const canApproveReimbursements = getPermissions('reimbursements:approve' as any) || getPermissions('attendance:edit');

  if (!canViewReimbursements) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view this reimbursement.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Reimbursement claim not found</h3>
        <Button className="mt-4" onClick={() => navigate('/reimbursements')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reimbursements
        </Button>
      </div>
    );
  }

  const statusMeta = statusConfig[claim.status];
  const StatusIcon = statusMeta?.icon || FileText;
  const isPaid = claim.status === 'paid';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/reimbursements')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{claim.claim_number}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span>{claim.staff_name || claim.staff_id}</span>
              {claim.created_at && (
                <>
                  <span>•</span>
                  <span>{formatDate(claim.created_at)}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {claim.status === 'draft' && canSubmitReimbursement && (
            <Button onClick={handleSubmit}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          )}
          {claim.status === 'submitted' && canApproveReimbursements && (
            <>
              <Button variant="outline" onClick={() => setShowApproveDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {claim.status === 'approved' && canApproveReimbursements && (
            <Button onClick={() => setShowPayDialog(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div
        className={`p-4 rounded-lg border flex items-center gap-3 ${
          isPaid
            ? 'bg-green-50 border-green-200'
            : claim.status === 'rejected'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        <StatusIcon className={`h-6 w-6 ${statusMeta?.color || 'text-gray-600'}`} />
        <div>
          <p className={`font-medium ${statusMeta?.color || 'text-gray-700'}`}>
            Status: {statusMeta?.label || claim.status}
          </p>
          {claim.approved_by && (
            <p className="text-sm text-muted-foreground">
              {claim.status === 'rejected' ? 'Rejected' : 'Approved'} by {claim.approved_by}
              {claim.approved_at && ` on ${formatDate(claim.approved_at)}`}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Claim Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Claim Number</p>
                      <p>{claim.claim_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Claim Date</p>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(claim.claim_date)}
                      </p>
                    </div>
                    {claim.expense_date_start && claim.expense_date_end && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expense Period</p>
                        <p>
                          {formatDate(claim.expense_date_start)} - {formatDate(claim.expense_date_end)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Currency</p>
                      <p>{claim.currency}</p>
                    </div>
                  </div>
                  {claim.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="mt-1 p-3 bg-muted rounded-lg">{claim.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {claim.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items in this claim</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="px-3 py-2 text-left">Category</th>
                            <th className="px-3 py-2 text-left">Expense Date</th>
                            <th className="px-3 py-2 text-left">Description</th>
                            <th className="px-3 py-2 text-right">Quantity</th>
                            <th className="px-3 py-2 text-right">Unit Price</th>
                            <th className="px-3 py-2 text-right">Tax</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {claim.items.map(item => (
                            <tr key={item.id}>
                              <td className="px-3 py-2">{categoryNameById(item.category_id)}</td>
                              <td className="px-3 py-2">{formatDate(item.expense_date)}</td>
                              <td className="px-3 py-2">{item.description}</td>
                              <td className="px-3 py-2 text-right">{item.quantity}</td>
                              <td className="px-3 py-2 text-right">
                                {item.unit_price != null ? formatCurrency(item.unit_price) : '-'}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.tax_amount ? formatCurrency(item.tax_amount) : '-'}
                              </td>
                              <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Amount Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(claim.total_amount , claim.currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{claim.staff_name || claim.staff_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(claim.paid_at || claim.payment_reference) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {claim.payment_reference && (
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Reference</p>
                    <p>{claim.payment_reference}</p>
                  </div>
                )}
                {claim.paid_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid At</p>
                    <p>{formatDate(claim.paid_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reimbursement</DialogTitle>
            <DialogDescription>
              Approve reimbursement claim for <strong>{formatCurrency(claim.total_amount)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Approval Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="w-full mt-1 px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reimbursement</DialogTitle>
            <DialogDescription>
              Reject reimbursement claim for <strong>{formatCurrency(claim.total_amount)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="w-full mt-1 px-3 py-2 border rounded-md"
                rows={3}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Record payment for <strong>{formatCurrency(claim.total_amount)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Payment Reference</label>
              <Input
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="Enter payment reference..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={!paymentReference.trim()}>
              <CreditCard className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReimbursementDetail;
