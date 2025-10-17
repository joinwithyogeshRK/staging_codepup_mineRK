import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Receipt, Calendar, CreditCard, Loader2 } from 'lucide-react';
import type { PaymentTransaction } from '../../types/subscription.types';
import { getPaymentHistory } from '../../services/subscriptionService';
import { formatDate, getPaymentMethodName } from '../../services/razorpayService';

interface PaymentHistoryProps {
  clerkId: string;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ clerkId }) => {
  const { getToken } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [clerkId, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const data = await getPaymentHistory(clerkId, page, 10, token);

      if (page === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions((prev) => [...prev, ...data.transactions]);
      }

      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError('Failed to load payment history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'captured':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-600">Loading payment history...</span>
      </div>
    );
  }

  if (error && page === 1) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchHistory}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-sm text-gray-600">No payment history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop view - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                Plan
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                Credits
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                Payment ID
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">
                  {formatDate(transaction.createdAt)}
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.planName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {transaction.planPeriod}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  ₹{transaction.amountInRupees}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    {transaction.creditsAwarded} credits
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                  {getPaymentMethodName(transaction.paymentMethod)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                  {transaction.razorpayPaymentId.substring(0, 20)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {transaction.planName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {transaction.planPeriod}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  transaction.status
                )}`}
              >
                {transaction.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium text-gray-900">
                  ₹{transaction.amountInRupees}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Credits</span>
                <span className="text-blue-600 font-medium">
                  {transaction.creditsAwarded} credits
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">
                  {formatDate(transaction.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Method</span>
                <span className="text-gray-900 capitalize">
                  {getPaymentMethodName(transaction.paymentMethod)}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-mono truncate">
                {transaction.razorpayPaymentId}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
