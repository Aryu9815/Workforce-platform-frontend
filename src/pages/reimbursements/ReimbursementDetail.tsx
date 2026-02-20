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
    <div className="space-y-6 bg-gray-50 min-h-screen p-4 md:p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reimbursements')}
            className="p-2 rounded-md hover:bg-white border border-transparent hover:border-gray-200 transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{claim.claim_number}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
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
              <Button variant="outline" className="bg-white" onClick={() => setShowApproveDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
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

      {/* Status Bar */}
      <div className={`p-4 rounded-md border flex items-center gap-3 bg-white border-gray-200 shadow-sm`}>
        <StatusIcon className={`h-6 w-6 ${statusMeta?.color || 'text-gray-600'}`} />
        <div>
          <p className="font-semibold text-gray-900">
            Status: {statusMeta?.label || claim.status}
          </p>
          {claim.approved_by && (
            <p className="text-sm text-gray-500">
              {claim.status === 'rejected' ? 'Rejected' : 'Approved'} by {claim.approved_by}
              {claim.approved_at && ` on ${formatDate(claim.approved_at)}`}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Claim Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Claim Number</p>
                      <p className="text-gray-900 font-medium">{claim.claim_number}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Claim Date</p>
                      <p className="flex items-center gap-2 text-gray-900 font-medium">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(claim.claim_date)}
                      </p>
                    </div>
                    {claim.expense_date_start && claim.expense_date_end && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Expense Period</p>
                        <p className="text-gray-900 font-medium">
                          {formatDate(claim.expense_date_start)} - {formatDate(claim.expense_date_end)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Currency</p>
                      <p className="text-gray-900 font-medium">{claim.currency}</p>
                    </div>
                  </div>
                  {claim.description && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Description</p>
                      <p className="mt-2 p-4 bg-gray-50 border border-gray-100 rounded-md text-gray-700 italic">
                        "{claim.description}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {claim.items.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No items in this claim</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-500">
                            <th className="px-3 py-3 text-left font-medium">Category</th>
                            <th className="px-3 py-3 text-left font-medium">Expense Date</th>
                            <th className="px-3 py-3 text-left font-medium">Description</th>
                            <th className="px-3 py-3 text-right font-medium">Quantity</th>
                            <th className="px-3 py-3 text-right font-medium">Unit Price</th>
                            <th className="px-3 py-3 text-right font-medium">Tax</th>
                            <th className="px-3 py-3 text-right font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {claim.items.map(item => (
                            <tr key={item.id} className="text-gray-700 hover:bg-gray-50">
                              <td className="px-3 py-3">{categoryNameById(item.category_id)}</td>
                              <td className="px-3 py-3">{formatDate(item.expense_date)}</td>
                              <td className="px-3 py-3">{item.description}</td>
                              <td className="px-3 py-3 text-right">{item.quantity}</td>
                              <td className="px-3 py-3 text-right">
                                {item.unit_price != null ? formatCurrency(item.unit_price) : '-'}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {item.tax_amount ? formatCurrency(item.tax_amount) : '-'}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
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
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Amount Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gray-50 rounded-md border border-gray-100 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-4xl font-bold text-gray-900">
                  {formatCurrency(claim.total_amount , claim.currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{claim.staff_name || claim.staff_id}</p>
                  <p className="text-xs text-gray-500">Employee ID: {claim.staff_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- FORMS (MODALS) SECTION --- */}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-lg z-50 max-w-lg p-0">
          <div className="p-6 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Approve Reimbursement</DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">
                You are approving the claim for <span className="font-semibold text-gray-900">{formatCurrency(claim.total_amount)}</span>
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Approval Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Enter any additional notes..."
                className="w-full mt-2 px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-gray-900 min-h-[120px]"
              />
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-lg border-t border-gray-100">
            <Button variant="outline" className="bg-white" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Approval
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-lg z-50 max-w-lg p-0">
          <div className="p-6 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Reject Reimbursement</DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">
                Please provide a reason for rejecting this claim.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Why is this claim being rejected?"
                className="w-full mt-2 px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition text-gray-900 min-h-[120px]"
                required
              />
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-lg border-t border-gray-100">
            <Button variant="outline" className="bg-white" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl rounded-lg z-50 max-w-lg p-0">
          <div className="p-6 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Mark as Paid</DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">
                Record the payment transaction details.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Payment Reference *</label>
              <Input
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="Transaction ID / Cheque Number"
                className="mt-2 bg-white border-gray-200 focus:ring-primary/20 text-gray-900"
              />
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-lg border-t border-gray-100">
            <Button variant="outline" className="bg-white" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsPaid} 
              disabled={!paymentReference.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReimbursementDetail;