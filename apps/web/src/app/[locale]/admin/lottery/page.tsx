'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { useErrorMessage } from '@/components/error-message';
import { api } from '@/lib/api';
import { useSessionUser } from '@/components/use-session-user';

interface Car {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  price: number;
  currency: string;
  images: string[];
  isAvailable: boolean;
}

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
  car: Car;
}

export default function AdminLotteryPage() {
  const t = useTranslations();
  const message = useErrorMessage();
  const user = useSessionUser();
  const [activeTab, setActiveTab] = useState<'cars' | 'lotteries'>('cars');
  const [cars, setCars] = useState<Car[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showLotteryModal, setShowLotteryModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'cars') {
        const data = await api<{ cars: Car[]; total: number }>('/cars');
        setCars(data.cars);
      } else {
        const data = await api<{ lotteries: Lottery[]; total: number }>('/lotteries');
        setLotteries(data.lotteries);
      }
      setError(null);
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCar = async (formData: FormData) => {
    try {
      const carData = {
        name: formData.get('name') as string,
        brand: formData.get('brand') as string,
        model: formData.get('model') as string,
        year: formData.get('year') ? parseInt(formData.get('year') as string) : undefined,
        color: formData.get('color') as string,
        price: parseFloat(formData.get('price') as string),
        currency: formData.get('currency') as string || 'ETB',
        description: formData.get('description') as string,
      };
      await api('/cars', { method: 'POST', body: JSON.stringify(carData) });
      setShowCarModal(false);
      loadData();
    } catch (err) {
      setError(message(err));
    }
  };

  const handleCreateLottery = async (formData: FormData) => {
    try {
      const lotteryData = {
        carId: formData.get('carId') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        ticketPrice: parseFloat(formData.get('ticketPrice') as string),
        currency: formData.get('currency') as string || 'ETB',
        totalTickets: parseInt(formData.get('totalTickets') as string),
        spinDueDate: new Date(formData.get('spinDueDate') as string).toISOString(),
      };
      await api('/lotteries', { method: 'POST', body: JSON.stringify(lotteryData) });
      setShowLotteryModal(false);
      loadData();
    } catch (err) {
      setError(message(err));
    }
  };

  const handleStartSpin = async (lotteryId: string) => {
    try {
      await api(`/lotteries/${lotteryId}/start-spin`, { method: 'POST' });
      loadData();
    } catch (err) {
      setError(message(err));
    }
  };

  const handleCompleteSpin = async (lotteryId: string) => {
    try {
      await api(`/lotteries/${lotteryId}/complete-spin`, { method: 'POST' });
      loadData();
    } catch (err) {
      setError(message(err));
    }
  };

  const handlePublishLottery = async (lotteryId: string) => {
    try {
      await api(`/lotteries/${lotteryId}/publish`, { method: 'POST' });
      loadData();
    } catch (err) {
      setError(message(err));
    }
  };

  return (
    <Shell>
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
            Lottery Management
          </h1>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            Manage cars, create lotteries, and control spins
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

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('cars')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'cars' ? '#0D3B4E' : 'transparent',
                color: activeTab === 'cars' ? '#fff' : '#6B7280',
                border: 'none',
                borderBottom: activeTab === 'cars' ? '2px solid #0D3B4E' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cars
            </button>
            <button
              onClick={() => setActiveTab('lotteries')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'lotteries' ? '#0D3B4E' : 'transparent',
                color: activeTab === 'lotteries' ? '#fff' : '#6B7280',
                border: 'none',
                borderBottom: activeTab === 'lotteries' ? '2px solid #0D3B4E' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Lotteries
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px' }}>
            <div style={{ fontSize: '16px', color: '#6B7280' }}>Loading...</div>
          </div>
        ) : activeTab === 'cars' ? (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCarModal(true)}
                style={{
                  padding: '12px 24px',
                  background: '#0D3B4E',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Add Car
              </button>
            </div>
            {cars.length === 0 ? (
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '64px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                  No Cars Added
                </h3>
                <p style={{ color: '#6B7280' }}>
                  Add cars to create lotteries
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {cars.map((car) => (
                  <div
                    key={car.id}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      gap: '20px'
                    }}
                  >
                    {car.images && car.images.length > 0 && (
                      <div style={{
                        width: '120px',
                        height: '80px',
                        background: `url(${car.images[0]}) center/cover`,
                        borderRadius: '8px'
                      }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                        {car.name}
                      </h3>
                      <div style={{ color: '#6B7280', fontSize: '14px', marginBottom: '8px' }}>
                        {car.brand} {car.model} {car.year}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0D3B4E' }}>
                        {car.price.toLocaleString()} {car.currency}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: car.isAvailable ? '#D1FAE5' : '#FEE2E2',
                        color: car.isAvailable ? '#065F46' : '#991B1B'
                      }}>
                        {car.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLotteryModal(true)}
                style={{
                  padding: '12px 24px',
                  background: '#0D3B4E',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Create Lottery
              </button>
            </div>
            {lotteries.length === 0 ? (
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '64px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎰</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                  No Lotteries Created
                </h3>
                <p style={{ color: '#6B7280' }}>
                  Create lotteries for users to participate
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {lotteries.map((lottery) => (
                  <div
                    key={lottery.id}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                        {lottery.title}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: lottery.status === 'ACTIVE' ? '#D1FAE5' : 
                                  lottery.status === 'SPINNING' ? '#FEF3C7' :
                                  lottery.status === 'COMPLETED' ? '#F3F4F6' : '#E0E7FF',
                        color: lottery.status === 'ACTIVE' ? '#065F46' :
                               lottery.status === 'SPINNING' ? '#92400E' :
                               lottery.status === 'COMPLETED' ? '#374151' : '#3730A3'
                      }}>
                        {lottery.status}
                      </span>
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '14px', marginBottom: '12px' }}>
                      {lottery.car.brand} {lottery.car.model} - {lottery.car.price.toLocaleString()} {lottery.currency}
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '16px',
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
                        <div style={{ color: '#6B7280', fontSize: '12px' }}>Spin Due Date</div>
                        <div style={{ fontWeight: 600 }}>{new Date(lottery.spinDueDate).toLocaleDateString()}</div>
                      </div>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {lottery.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublishLottery(lottery.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#10B981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Publish
                        </button>
                      )}
                      {lottery.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStartSpin(lottery.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#F59E0B',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Start Spin
                        </button>
                      )}
                      {lottery.status === 'SPINNING' && (
                        <button
                          onClick={() => handleCompleteSpin(lottery.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#6366F1',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Complete Spin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showCarModal && (
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
              borderRadius: '12px',
              padding: '24px',
              width: '500px',
              maxWidth: '90%'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Add Car</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateCar(new FormData(e.currentTarget)); }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Name</label>
                  <input name="name" required style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Brand</label>
                    <input name="brand" style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Model</label>
                    <input name="model" style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Year</label>
                    <input name="year" type="number" style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Color</label>
                    <input name="color" style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Price</label>
                  <input name="price" type="number" required style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Description</label>
                  <textarea name="description" rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowCarModal(false)}
                    style={{ padding: '8px 16px', background: '#E5E7EB', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 16px', background: '#0D3B4E', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Add Car
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showLotteryModal && (
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
              borderRadius: '12px',
              padding: '24px',
              width: '500px',
              maxWidth: '90%'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Create Lottery</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateLottery(new FormData(e.currentTarget)); }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Car</label>
                  <select name="carId" required style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }}>
                    {cars.filter(c => c.isAvailable).map(car => (
                      <option key={car.id} value={car.id}>{car.name} - {car.brand} {car.model}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Title</label>
                  <input name="title" required style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Description</label>
                  <textarea name="description" rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Ticket Price</label>
                    <input name="ticketPrice" type="number" required style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Total Tickets</label>
                    <input name="totalTickets" type="number" required style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Spin Due Date</label>
                  <input name="spinDueDate" type="datetime-local" required style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowLotteryModal(false)}
                    style={{ padding: '8px 16px', background: '#E5E7EB', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 16px', background: '#0D3B4E', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Create Lottery
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
