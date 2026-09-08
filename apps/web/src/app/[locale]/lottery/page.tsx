'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { useErrorMessage } from '@/components/error-message';
import { api } from '@/lib/api';
import { useSessionUser } from '@/components/use-session-user';
import { io, Socket } from 'socket.io-client';

interface Lottery {
  id: string;
  title: string;
  description: string | null;
  ticketPrice: number;
  currency: string;
  totalTickets: number;
  soldTickets: number;
  spinDueDate: string;
  status: string;
  winnerTicketId?: string | null;
  winnerTicket?: {
    id: string;
    ticketNumber: number;
    userId: string;
  } | null;
  car: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    images: string[];
    price: number;
  };
  spinResult?: {
    winningTicketId: string;
    spinStartedAt: string;
    spinCompletedAt: string;
    durationMs: number;
  } | null;
}

export default function LotteryPage() {
  const t = useTranslations();
  const message = useErrorMessage();
  const user = useSessionUser();
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [spinningLotteryId, setSpinningLotteryId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    loadLotteries();

    // Initialize WebSocket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    setSocket(socketInstance);

    socketInstance.on('spin-start', (data: { lotteryId: string }) => {
      console.log('Spin started for lottery:', data.lotteryId);
      setSpinningLotteryId(data.lotteryId);
      loadLotteries();
    });

    socketInstance.on('spin-complete', (data: { lotteryId: string; winningTicketId: string }) => {
      console.log('Spin completed for lottery:', data.lotteryId);
      setSpinningLotteryId(null);
      loadLotteries();
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const loadLotteries = async () => {
    try {
      setLoading(true);
      const data = await api<{ lotteries: Lottery[] }>('/lotteries');
      console.log('Lotteries loaded:', data.lotteries);
      setLotteries(data.lotteries);
      setError(null);
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = (lottery: Lottery) => {
    setSelectedLottery(lottery);
    setShowPaymentModal(true);
    setSelectedPaymentMethod('');
    setPhoneNumber('');
  };

  const handlePayment = async () => {
    if (!selectedLottery || !selectedPaymentMethod || !phoneNumber) {
      setError('Please select a payment method and enter phone number');
      return;
    }

    try {
      setBuyingTicket(true);
      
      // Step 1: Create a PENDING ticket
      const ticketResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lotteryId: selectedLottery.id }),
      });
      
      const ticketData = await ticketResponse.json();
      
      if (!ticketResponse.ok) {
        throw new Error(ticketData.error?.message || 'Failed to create ticket');
      }
      
      const ticket = ticketData.data;
      
      // Step 2: Initialize payment with Chapa
      const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/payments/chapa/initialize-lottery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          userEmail: 'user@example.com', // Replace with actual user email
          userName: 'User Name', // Replace with actual user name
          userPhone: phoneNumber,
        }),
      });
      
      const paymentData = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error?.message || 'Failed to initialize payment');
      }
      
      // Step 3: Redirect to Chapa checkout
      const payment = paymentData.data;
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      } else {
        throw new Error('No checkout URL provided');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
    } finally {
      setBuyingTicket(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10B981';
      case 'SPINNING':
        return '#F59E0B';
      case 'COMPLETED':
        return '#6B7280';
      case 'DRAFT':
        return '#6366F1';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'SPINNING':
        return 'Spinning';
      case 'COMPLETED':
        return 'Completed';
      case 'DRAFT':
        return 'Draft';
      case 'PUBLISHED':
        return 'Published';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Shell>
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
            Car Lottery
          </h1>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            Participate in car lotteries and win amazing prizes
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#991B1B'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px' }}>
            <div style={{ fontSize: '16px', color: '#6B7280' }}>Loading lotteries...</div>
          </div>
        ) : lotteries.length === 0 ? (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '64px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎰</div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              No Active Lotteries
            </h3>
            <p style={{ color: '#6B7280' }}>
              Check back later for new lottery opportunities
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
            {lotteries.map((lottery) => (
              <div
                key={lottery.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {lottery.car.images && lottery.car.images.length > 0 && (
                  <div style={{
                    height: '200px',
                    background: `url(${lottery.car.images[0]}) center/cover`,
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: getStatusColor(lottery.status),
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {getStatusLabel(lottery.status)}
                    </div>
                    {spinningLotteryId === lottery.id && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulse 1s ease-in-out infinite'
                      }}>
                        <div style={{
                          fontSize: '48px',
                          animation: 'spin 2s linear infinite'
                        }}>
                          🎰
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <style jsx>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                  }
                `}</style>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                    {lottery.title}
                  </h3>
                  {lottery.description && (
                    <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
                      {lottery.description}
                    </p>
                  )}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                      {lottery.car.brand} {lottery.car.model}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#0D3B4E' }}>
                      {lottery.car.price.toLocaleString()} {lottery.currency}
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: '12px' }}>Ticket Price</div>
                      <div style={{ fontWeight: 600 }}>{lottery.ticketPrice.toLocaleString()} {lottery.currency}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: '12px' }}>Total Tickets</div>
                      <div style={{ fontWeight: 600 }}>{lottery.totalTickets}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: '12px' }}>Sold Tickets</div>
                      <div style={{ fontWeight: 600 }}>{lottery.soldTickets}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: '12px' }}>Available</div>
                      <div style={{ fontWeight: 600 }}>{lottery.totalTickets - lottery.soldTickets}</div>
                    </div>
                  </div>
                  <div style={{
                    background: '#F3F4F6',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#6B7280'
                  }}>
                    <div>Spin Due Date: {new Date(lottery.spinDueDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{
                    height: '8px',
                    background: '#E5E7EB',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '16px'
                  }}>
                    <div
                      style={{
                        height: '100%',
                        background: '#0D3B4E',
                        width: `${(lottery.soldTickets / lottery.totalTickets) * 100}%`
                      }}
                    />
                  </div>
                  {lottery.status === 'ACTIVE' && user && (
                    <button
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0D3B4E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleBuyTicket(lottery)}
                    >
                      Buy Ticket
                    </button>
                  )}

                  {lottery.status === 'COMPLETED' && lottery.winnerTicket && (
                    <div style={{
                      width: '100%',
                      padding: '16px',
                      background: '#FEF3C7',
                      border: '2px solid #F59E0B',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: '#92400E', marginBottom: '8px', fontWeight: 600 }}>
                        🎉 Winner Announced
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 700, color: '#92400E' }}>
                        #{lottery.winnerTicket.ticketNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: '#B45309', marginTop: '4px' }}>
                        Winning Ticket Number
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaymentModal && selectedLottery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '32px',
            width: '450px',
            maxWidth: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Choose Payment Method</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Campaign</div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                {selectedLottery.title}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>Tickets</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
                <span>Total</span>
                <span>{selectedLottery.ticketPrice.toLocaleString()} {selectedLottery.currency}</span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Payment Method</div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  onClick={() => setSelectedPaymentMethod('telebirr')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: selectedPaymentMethod === 'telebirr' ? '2px solid #0D3B4E' : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>📱</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Telebirr</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Pay with Ethiopian Telebirr mobile wallet</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('cbe')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: selectedPaymentMethod === 'cbe' ? '2px solid #0D3B4E' : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🏦</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>CBE Birr</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Commercial Bank of Ethiopia mobile banking</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('awash')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: selectedPaymentMethod === 'awash' ? '2px solid #0D3B4E' : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>💳</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Awash Bank</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Awash Bank mobile banking app</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('card')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: selectedPaymentMethod === 'card' ? '2px solid #0D3B4E' : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>💰</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Debit/Credit Card</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Visa / Mastercard international card</div>
                  </div>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+251 9XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {error && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#991B1B',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={buyingTicket || !selectedPaymentMethod || !phoneNumber}
              style={{
                width: '100%',
                padding: '14px',
                background: buyingTicket || !selectedPaymentMethod || !phoneNumber ? '#9CA3AF' : '#0D3B4E',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: buyingTicket || !selectedPaymentMethod || !phoneNumber ? 'not-allowed' : 'pointer'
              }}
            >
              {buyingTicket ? 'Processing...' : `Pay ${selectedLottery.ticketPrice.toLocaleString()} ${selectedLottery.currency}`}
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
