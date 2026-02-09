import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Building2,
  Edit,
  Trash2,
  Download,
  History,
  CreditCard
} from 'lucide-react';
import { reimbursementsApi } from '../../api/reimbursements';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/sonner';
import type { Reimbursement, ApprovalHistory } from '../../types/reimbursement';

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText, color: 'text-gray-600' },
  submitted: { label: 'Submitted', variant: 'warning' as const, icon: Clock, color: 'text-yellow-600' },
  under_review: { label: 'Under Review', variant: 'default' as const, icon: AlertCircle, color: 'text-blue-600' },
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
  paid: { label: 'Paid', variant: 'success' as const, icon: CreditCard, color: 'text-green-600' },
};

const ReimbursementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reimbursement, setReimbursement] = useState<Reimbursement | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    payment_method: 'bank_transfer',
    transaction_id: '',
    paid_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (id) {
      fetchReimbursement();
      fetchApprovalHistory();
    }
  }, [id]);

  const fetchReimbursement = async () => {
    try {
      const response = await reimbursementsApi.getById(Number(id));
      setReimbursement(response.data);
    } catch (error) {
      toast.error('Failed to fetch reimbursement');
      navigate('/reimbursements');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      const response = await reimbursementsApi.getApprovalHistory(Number(id));
      setApprovalHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch approval history');
    }
  };

  const handleDelete = async () => {
    try {
      await reimbursementsApi.delete(Number(id));
      toast.success('Reimbursement deleted successfully');
      navigate('/reimbursements');
    } catch (error) {
      toast.error('Failed to delete reimbursement');
    }
  };

  const handleApprove = async () => {
    try {
      await reimbursementsApi.approve(Number(id), { notes });
      toast.success('Reimbursement approved');
      setShowApproveDialog(false);
      setNotes('');
      fetchReimbursement();
      fetchApprovalHistory();
    } catch (error) {
      toast.error('Failed to approve reimbursement');
    }
  };

  const handleReject = async () => {
    try {
      await reimbursementsApi.reject(Number(id), { reason: rejectionReason });
      toast.success('Reimbursement rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      fetchReimbursement();
      fetchApprovalHistory();
    } catch (error) {
      toast.error('Failed to reject reimbursement');
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await reimbursementsApi.markAsPaid(Number(id), paymentDetails);
      toast.success('Reimbursement marked as paid');
      setShowPayDialog(false);
      fetchReimbursement();
      fetchApprovalHistory();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const handleSubmit = async () => {
    try {
      await reimbursementsApi.submit(Number(id));
      toast.success('Reimbursement submitted for approval');
      fetchReimbursement();
      fetchApprovalHistory();
    } catch (error) {
      toast.error('Failed to submit reimbursement');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reimbursement) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Reimbursement not found</h3>
        <Button className="mt-4" onClick={() => navigate('/reimbursements')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reimbursements
        </Button>
      </div>
    );
  }

  const StatusIcon = statusConfig[reimbursement.status as keyof typeof statusConfig]?.icon || FileText;
  const statusConfig_item = statusConfig[reimbursement.status as keyof typeof statusConfig];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/reimbursements')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{reimbursement.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span>Submitted by {reimbursement.staff?.full_name}</span>
              <span>•</span>
              <span>{formatDate(reimbursement.created_at)}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {reimbursement.status === 'draft' && (
            <Button onClick={handleSubmit}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          )}
          {reimbursement.status === 'submitted' && (
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
          {reimbursement.status === 'approved' && (
            <Button onClick={() => setShowPayDialog(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/reimbursements/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border flex items-center gap-3 ${
        reimbursement.status === 'approved' || reimbursement.status === 'paid'
          ? 'bg-green-50 border-green-200'
          : reimbursement.status === 'rejected'
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <StatusIcon className={`h-6 w-6 ${statusConfig_item?.color || 'text-gray-600'}`} />
        <div>
          <p className={`font-medium ${statusConfig_item?.color || 'text-gray-700'}`}>
            Status: {statusConfig_item?.label || reimbursement.status}
          </p>
          {reimbursement.approved_by && (
            <p className="text-sm text-muted-foreground">
              {reimbursement.status === 'rejected' ? 'Rejected' : 'Approved'} by {reimbursement.approved_by.full_name}
              {reimbursement.approved_at && ` on ${formatDate(reimbursement.approved_at)}`}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">Approval History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Category</label>
                      <p>{reimbursement.category?.name || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expense Date</label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(reimbursement.expense_date)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Project</label>
                      <p>{reimbursement.project?.name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
                      <p className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {reimbursement.department?.name || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                  {reimbursement.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="mt-1 p-3 bg-muted rounded-lg">{reimbursement.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {reimbursement.receipt_url && (
                <Card>
                  <CardHeader>
                    <CardTitle>Receipt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <FileText className="h-10 w-10 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">Receipt Document</p>
                        <p className="text-sm text-muted-foreground">Click to view or download</p>
                      </div>
                      <Button variant="outline" onClick={() => window.open(reimbursement.receipt_url, '_blank')}>
                        <Download className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Approval History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {approvalHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="mx-auto h-12 w-12 mb-4" />
                      <p>No approval history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {approvalHistory.map((history, index) => (
                        <div key={history.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              history.action === 'approved' ? 'bg-green-100' :
                              history.action === 'rejected' ? 'bg-red-100' :
                              history.action === 'paid' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              {history.action === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {history.action === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                              {history.action === 'paid' && <CreditCard className="h-4 w-4 text-blue-600" />}
                              {history.action === 'submitted' && <FileText className="h-4 w-4 text-gray-600" />}
                            </div>
                            {index < approvalHistory.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium capitalize">{history.action.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              by {history.performed_by?.full_name || 'System'} • {formatDate(history.performed_at)}
                            </p>
                            {history.notes && (
                              <p className="text-sm mt-1 p-2 bg-muted rounded">{history.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Amount Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-4xl font-bold text-primary">{formatCurrency(reimbursement.amount)}</p>
              </div>
              {reimbursement.approved_amount && reimbursement.approved_amount !== reimbursement.amount && (
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-green-600">Approved Amount</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(reimbursement.approved_amount)}</p>
                </div>
              )}
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
                  <p className="font-medium">{reimbursement.staff?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{reimbursement.staff?.employee_id}</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">Department</p>
                <p>{reimbursement.department?.name || 'Not assigned'}</p>
              </div>
            </CardContent>
          </Card>

          {reimbursement.payment_details && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="capitalize">{reimbursement.payment_details.payment_method.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p>{reimbursement.payment_details.transaction_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Date</p>
                  <p>{formatDate(reimbursement.payment_details.paid_date)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reimbursement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{reimbursement.title}</strong>? This action cannot be undone.
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

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reimbursement</DialogTitle>
            <DialogDescription>
              Approve reimbursement claim for <strong>{formatCurrency(reimbursement.amount)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Approval Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reimbursement</DialogTitle>
            <DialogDescription>
              Reject reimbursement claim for <strong>{formatCurrency(reimbursement.amount)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
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

      {/* Pay Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Record payment for <strong>{formatCurrency(reimbursement.amount)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <select
                value={paymentDetails.payment_method}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_method: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="credit_card">Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Transaction ID</label>
              <Input
                value={paymentDetails.transaction_id}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, transaction_id: e.target.value })}
                placeholder="Enter transaction reference..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Date</label>
              <Input
                type="date"
                value={paymentDetails.paid_date}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, paid_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={!paymentDetails.transaction_id.trim()}>
              <CreditCard className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReimbursementDetail;
