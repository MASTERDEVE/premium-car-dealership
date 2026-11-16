import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api';

const initialFilters = {
  brand: 'All',
  bodyType: 'All',
  fuelType: 'All',
  maxPrice: 70000,
  yearMin: 2018,
  yearMax: 2024,
  mileage: 50000,
  location: 'All'
};

const getEmptyVehicleForm = () => ({
  brand: 'BMW',
  model: '',
  year: 2024,
  price: 0,
  mileage: 0,
  fuelType: 'Petrol',
  transmission: 'Automatic',
  bodyType: 'Sedan',
  color: '',
  condition: 'Excellent',
  warranty: '12 months',
  location: 'Birmingham',
  status: 'Available',
  featured: false,
  isPublished: true,
  image: '',
  gallery: '',
  description: '',
  features: '',
  ownershipHistory: '',
  inspectionReport: '',
  conditionGrade: 'A+'
});

const customerBookings = [
  { id: 1, car: 'BMW 5 Series', date: 'Wed 10:30 AM', status: 'Confirmed' },
  { id: 2, car: 'Audi Q5', date: 'Fri 2:00 PM', status: 'Pending' },
  { id: 3, car: 'Mercedes C-Class', date: 'Sun 11:00 AM', status: 'Approved' }
];

const popularModels = ['BMW 5 Series', 'Audi Q5', 'Range Rover Velar'];

function App() {
  const [selectedTab, setSelectedTab] = useState('inventory');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [statusMessage, setStatusMessage] = useState('');
  const [dashboard, setDashboard] = useState({ totalVehicles: 0, availableNow: 0, reservedNow: 0, featuredCount: 0, salesTrend: [], popularModels: [] });
  const [adminData, setAdminData] = useState({ stats: {}, vehicles: [], leads: [], testDrives: [], reservations: [] });
  const [notifications, setNotifications] = useState([]);
  const [calculator, setCalculator] = useState({ price: 42000, downPayment: 8000, interestRate: 5.2, tenure: 60 });
  const [forms, setForms] = useState({
    lead: { name: '', email: '', phone: '', message: '', vehicleId: '', vehicleName: '' },
    testDrive: { customerName: '', email: '', phone: '', vehicleId: '', vehicleName: '', preferredDate: '', preferredTime: '', dealership: 'Birmingham' },
    reservation: { customerName: '', email: '', phone: '', vehicleId: '', vehicleName: '', depositAmount: 2500 }
  });
  const [adminForm, setAdminForm] = useState(getEmptyVehicleForm());
  const [editingVehicleId, setEditingVehicleId] = useState(null);

  const refreshVehicles = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All' && value !== 0) params.append(key, value);
    });

    const response = await fetch(`${API_URL}/vehicles?${params.toString()}`);
    const data = await response.json();
    setVehicles(data);
    if (data.length && !selectedVehicle) {
      setSelectedVehicle(data[0]);
    }
  };

  const refreshDashboard = async () => {
    const [dash, admin, notify] = await Promise.all([
      fetch(`${API_URL}/dashboard`).then((res) => res.json()),
      fetch(`${API_URL}/admin`).then((res) => res.json()),
      fetch(`${API_URL}/notifications`).then((res) => res.json())
    ]);

    setDashboard(dash);
    setAdminData(admin);
    setNotifications(notify);
  };

  useEffect(() => {
    refreshVehicles();
  }, [filters]);

  useEffect(() => {
    refreshDashboard();
  }, []);

  const compareVehicles = useMemo(
    () => vehicles.filter((vehicle) => compareIds.includes(vehicle._id)),
    [vehicles, compareIds]
  );

  const emi = useMemo(() => {
    const principal = Math.max(calculator.price - calculator.downPayment, 0);
    const monthlyRate = calculator.interestRate / 100 / 12;
    const months = calculator.tenure;

    if (principal <= 0 || monthlyRate <= 0) return 0;
    const numerator = principal * monthlyRate;
    const denominator = 1 - Math.pow(1 + monthlyRate, -months);
    return numerator / denominator;
  }, [calculator]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (group, field, value) => {
    setForms((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value }
    }));
  };

  const handleAdminFieldChange = (field, value) => {
    setAdminForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    const label = `${vehicle.brand} ${vehicle.model}`;
    setForms((prev) => ({
      ...prev,
      lead: { ...prev.lead, vehicleId: vehicle._id, vehicleName: label },
      testDrive: { ...prev.testDrive, vehicleId: vehicle._id, vehicleName: label },
      reservation: { ...prev.reservation, vehicleId: vehicle._id, vehicleName: label }
    }));
  };

  const resetAdminForm = () => {
    setAdminForm(getEmptyVehicleForm());
    setEditingVehicleId(null);
  };

  const startVehicleEdit = (vehicle) => {
    setEditingVehicleId(vehicle._id);
    setAdminForm({
      brand: vehicle.brand || 'BMW',
      model: vehicle.model || '',
      year: vehicle.year || 2024,
      price: vehicle.price || 0,
      mileage: vehicle.mileage || 0,
      fuelType: vehicle.fuelType || 'Petrol',
      transmission: vehicle.transmission || 'Automatic',
      bodyType: vehicle.bodyType || 'Sedan',
      color: vehicle.color || '',
      condition: vehicle.condition || 'Excellent',
      warranty: vehicle.warranty || '12 months',
      location: vehicle.location || 'Birmingham',
      status: vehicle.status || 'Available',
      featured: Boolean(vehicle.featured),
      isPublished: vehicle.isPublished !== false,
      image: vehicle.image || '',
      gallery: Array.isArray(vehicle.gallery) ? vehicle.gallery.join(', ') : '',
      description: vehicle.description || '',
      features: Array.isArray(vehicle.features) ? vehicle.features.join(', ') : '',
      ownershipHistory: vehicle.ownershipHistory || '',
      inspectionReport: vehicle.inspectionReport || '',
      conditionGrade: vehicle.conditionGrade || 'A+'
    });
    setSelectedTab('admin');
  };

  const toggleWishlist = (vehicleId) => {
    setWishlist((prev) => prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]);
  };

  const toggleCompare = (vehicleId) => {
    if (compareIds.includes(vehicleId)) {
      setCompareIds((prev) => prev.filter((id) => id !== vehicleId));
      return;
    }

    if (compareIds.length >= 4) return;
    setCompareIds((prev) => [...prev, vehicleId]);
  };

  const submitLead = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forms.lead)
    });
    const data = await response.json();
    setStatusMessage(data.message || 'Inquiry sent');
    setForms((prev) => ({ ...prev, lead: { ...prev.lead, name: '', email: '', phone: '', message: '' } }));
  };

  const submitTestDrive = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/test-drives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forms.testDrive)
    });
    const data = await response.json();
    setStatusMessage(data.message || 'Test-drive booked');
    setForms((prev) => ({ ...prev, testDrive: { ...prev.testDrive, customerName: '', email: '', phone: '', preferredDate: '', preferredTime: '' } }));
  };

  const submitReservation = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forms.reservation)
    });
    const data = await response.json();
    setStatusMessage(data.message || 'Reservation accepted');
    setForms((prev) => ({ ...prev, reservation: { ...prev.reservation, customerName: '', email: '', phone: '', depositAmount: 2500 } }));
  };

  const createReservationPayment = async (event) => {
    event.preventDefault();

    const amount = Number(forms.reservation.depositAmount || 2500);
    const vehicleName = forms.reservation.vehicleName || selectedVehicle?.model || 'Luxury vehicle';
    const reservationPayload = {
      customerName: forms.reservation.customerName,
      email: forms.reservation.email,
      phone: forms.reservation.phone,
      vehicleId: forms.reservation.vehicleId || selectedVehicle?._id || '',
      vehicleName,
      depositAmount: amount,
      refundPolicy: 'Refundable deposit'
    };

    try {
      const orderResponse = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          vehicleName,
          customerName: forms.reservation.customerName,
          email: forms.reservation.email,
          phone: forms.reservation.phone
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Unable to create Razorpay order');
      }

      if (orderData.paymentStatus === 'keys_missing' || orderData.demo) {
        const reservationResponse = await fetch(`${API_URL}/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservationPayload)
        });

        const reservationData = await reservationResponse.json();
        setStatusMessage(orderData.message || reservationData.message || 'Reservation created in demo mode');
        setForms((prev) => ({
          ...prev,
          reservation: { ...prev.reservation, customerName: '', email: '', phone: '', depositAmount: 2500 }
        }));
        return;
      }

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
          document.body.appendChild(script);
        });
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Velour Motors',
        description: `Vehicle reservation deposit for ${vehicleName}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          const verifyResponse = await fetch(`${API_URL}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              reservationData: reservationPayload
            })
          });

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData.verified) {
            setStatusMessage(verifyData.message || 'Payment verification failed');
            return;
          }

          setStatusMessage(`Deposit paid successfully for ${vehicleName}. Reservation confirmed.`);
          setForms((prev) => ({
            ...prev,
            reservation: { ...prev.reservation, customerName: '', email: '', phone: '', depositAmount: 2500 }
          }));
        },
        prefill: {
          name: forms.reservation.customerName,
          email: forms.reservation.email,
          contact: forms.reservation.phone
        },
        theme: {
          color: '#d7b26c'
        },
        modal: {
          ondismiss: () => {
            setStatusMessage('Payment cancelled. Your reservation is still pending.');
          }
        }
      });

      razorpay.open();
    } catch (error) {
      setStatusMessage(error.message || 'Payment failed');
    }
  };

  const saveVehicle = async (event) => {
    event.preventDefault();

    const payload = {
      ...adminForm,
      year: Number(adminForm.year),
      price: Number(adminForm.price),
      mileage: Number(adminForm.mileage),
      featured: Boolean(adminForm.featured),
      isPublished: Boolean(adminForm.isPublished),
      features: adminForm.features ? adminForm.features.split(',').map((item) => item.trim()).filter(Boolean) : [],
      gallery: adminForm.gallery ? adminForm.gallery.split(',').map((item) => item.trim()).filter(Boolean) : [adminForm.image],
      image: adminForm.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'
    };

    const url = editingVehicleId ? `${API_URL}/admin/vehicles/${editingVehicleId}` : `${API_URL}/admin/vehicles`;
    const method = editingVehicleId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setStatusMessage(data.message || 'Vehicle saved');
    await refreshDashboard();
    await refreshVehicles();
    resetAdminForm();
    setSelectedTab('admin');
  };

  const deleteVehicle = async (vehicleId) => {
    if (!window.confirm('Delete this vehicle listing?')) return;

    const response = await fetch(`${API_URL}/admin/vehicles/${vehicleId}`, { method: 'DELETE' });
    const data = await response.json();
    setStatusMessage(data.message || 'Vehicle deleted');
    await refreshDashboard();
    await refreshVehicles();
  };

  const tabContent = () => {
    if (selectedTab === 'inventory') {
      return (
        <>
          <section className="luxury-hero">
            <div className="hero-copy">
              <p className="eyebrow gold">Luxury performance • hand selected</p>
              <h1>Drive the extraordinary.</h1>
              <p>
                Discover meticulously curated premium vehicles with concierge-level service,
                transparent pricing, and elevated ownership experiences from first click to final turn.
              </p>
              <div className="hero-actions">
                <button className="primary-button">Explore Collection</button>
                <button className="ghost-button">Book a Viewing</button>
              </div>
              <div className="hero-metrics">
                <div>
                  <strong>120+</strong>
                  <span>Luxury listings</span>
                </div>
                <div>
                  <strong>4.9/5</strong>
                  <span>Client rating</span>
                </div>
                <div>
                  <strong>48h</strong>
                  <span>Delivery window</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-image-card">
                <img
                  src="https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80"
                  alt="Luxury sedan in motion"
                />
                <div className="hero-floating-card">
                  <span>Featured</span>
                  <h3>BMW 5 Series</h3>
                  <p>From $42,900</p>
                </div>
              </div>
            </div>
          </section>

          <section className="feature-strip">
            <div>
              <span>✔</span>
              <p>Certified inspections</p>
            </div>
            <div>
              <span>✔</span>
              <p>Nationwide delivery</p>
            </div>
            <div>
              <span>✔</span>
              <p>Tailored finance plans</p>
            </div>
            <div>
              <span>✔</span>
              <p>Concierge buying experience</p>
            </div>
          </section>

          <section className="filters-panel">
            <select name="brand" value={filters.brand} onChange={handleFilterChange}>
              <option>All</option>
              <option>BMW</option>
              <option>Mercedes</option>
              <option>Audi</option>
              <option>Porsche</option>
              <option>Jaguar</option>
              <option>Range Rover</option>
            </select>
            <select name="bodyType" value={filters.bodyType} onChange={handleFilterChange}>
              <option>All</option>
              <option>Sedan</option>
              <option>SUV</option>
            </select>
            <select name="fuelType" value={filters.fuelType} onChange={handleFilterChange}>
              <option>All</option>
              <option>Petrol</option>
              <option>Diesel</option>
            </select>
            <select name="location" value={filters.location} onChange={handleFilterChange}>
              <option>All</option>
              <option>Birmingham</option>
              <option>Manchester</option>
              <option>London</option>
              <option>Leeds</option>
              <option>Bristol</option>
              <option>Edinburgh</option>
            </select>
            <input type="range" min="20000" max="70000" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} />
            <input type="number" min="2018" max="2024" name="yearMin" value={filters.yearMin} onChange={handleFilterChange} />
            <input type="number" min="2018" max="2024" name="yearMax" value={filters.yearMax} onChange={handleFilterChange} />
            <input type="number" min="2000" max="50000" name="mileage" value={filters.mileage} onChange={handleFilterChange} />
          </section>

          <section className="inventory-grid">
            {vehicles.map((vehicle) => (
              <article key={vehicle._id} className={`vehicle-card ${selectedVehicle?._id === vehicle._id ? 'active' : ''}`}>
                <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} />
                <div className="vehicle-content">
                  <div className="vehicle-topline">
                    <div>
                      <span>{vehicle.brand}</span>
                      <h3>{vehicle.model}</h3>
                    </div>
                    <button className="mini-button" onClick={() => toggleWishlist(vehicle._id)}>{wishlist.includes(vehicle._id) ? '♥' : '♡'}</button>
                  </div>
                  <div className="chip-row">
                    <span>{vehicle.year}</span>
                    <span>{vehicle.mileage.toLocaleString()} mi</span>
                    <span>{vehicle.transmission}</span>
                  </div>
                  <p className="vehicle-copy">{vehicle.description}</p>
                  <div className="vehicle-footer">
                    <strong>${vehicle.price.toLocaleString()}</strong>
                    <div className="action-row">
                      <button className="ghost-button" onClick={() => toggleCompare(vehicle._id)}>{compareIds.includes(vehicle._id) ? 'Compared' : 'Compare'}</button>
                      <button className="primary-button" onClick={() => selectVehicle(vehicle)}>View</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {selectedVehicle && (
            <section className="detail-panel">
              <div className="detail-gallery">
                <img src={selectedVehicle.image} alt={selectedVehicle.model} />
              </div>
              <div className="detail-copy">
                <p className="eyebrow gold">Vehicle details</p>
                <h2>{selectedVehicle.brand} {selectedVehicle.model}</h2>
                <p>{selectedVehicle.description}</p>
                <ul>
                  {(selectedVehicle.features || []).map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <div className="spec-grid">
                  <div><span>Condition</span><strong>{selectedVehicle.condition}</strong></div>
                  <div><span>Fuel</span><strong>{selectedVehicle.fuelType}</strong></div>
                  <div><span>Mileage</span><strong>{selectedVehicle.mileage.toLocaleString()} mi</strong></div>
                  <div><span>Warranty</span><strong>{selectedVehicle.warranty}</strong></div>
                  <div><span>Ownership</span><strong>{selectedVehicle.ownershipHistory}</strong></div>
                  <div><span>Grade</span><strong>{selectedVehicle.conditionGrade}</strong></div>
                </div>
                <div className="detail-actions">
                  <button className="primary-button" onClick={() => setSelectedTab('booking')}>Book drive</button>
                  <button className="ghost-button" onClick={() => setSelectedTab('reservation')}>Reserve now</button>
                </div>
              </div>
            </section>
          )}

          <section className="signature-showcase">
            <div className="showcase-header">
              <div>
                <p className="eyebrow gold">Signature collection</p>
                <h2>Crafted for the few who expect more.</h2>
              </div>
              <button className="primary-button">Explore Collection</button>
            </div>

            <div className="showcase-grid">
              <article className="showcase-card showcase-card-tall">
                <img src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80" alt="Luxury performance coupe" />
                <div className="showcase-overlay">
                  <span>Grand Tourer</span>
                  <h3>Mercedes AMG GT</h3>
                  <p>From $118,000</p>
                </div>
              </article>

              <article className="showcase-card">
                <img src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80" alt="Luxury SUV" />
                <div className="showcase-overlay small">
                  <span>Luxury SUV</span>
                  <h3>Range Rover Sport</h3>
                  <p>From $81,500</p>
                </div>
              </article>

              <article className="showcase-card">
                <img src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80" alt="Executive sedan" />
                <div className="showcase-overlay small">
                  <span>Executive Sedan</span>
                  <h3>BMW 7 Series</h3>
                  <p>From $96,900</p>
                </div>
              </article>
            </div>
          </section>
        </>
      );
    }

    if (selectedTab === 'compare') {
      return (
        <section className="panel-box">
          <p className="eyebrow gold">Compare cars</p>
          <h2>Side-by-side comparisons</h2>
          {compareVehicles.length === 0 ? <p>Select up to 4 vehicles to compare.</p> : (
            <div className="compare-grid">
              {compareVehicles.map((vehicle) => (
                <div key={vehicle._id} className="compare-card">
                  <img src={vehicle.image} alt={vehicle.model} />
                  <h3>{vehicle.brand} {vehicle.model}</h3>
                  <ul>
                    <li>Price: ${vehicle.price.toLocaleString()}</li>
                    <li>Year: {vehicle.year}</li>
                    <li>Mileage: {vehicle.mileage.toLocaleString()} mi</li>
                    <li>Fuel: {vehicle.fuelType}</li>
                    <li>Transmission: {vehicle.transmission}</li>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (selectedTab === 'booking') {
      return (
        <section className="panel-box two-col">
          <form className="glass-form" onSubmit={submitTestDrive}>
            <p className="eyebrow gold">Test-drive booking</p>
            <h2>Choose a car, date, and time</h2>
            <input type="text" placeholder="Full name" value={forms.testDrive.customerName} onChange={(e) => handleInputChange('testDrive', 'customerName', e.target.value)} required />
            <input type="email" placeholder="Email address" value={forms.testDrive.email} onChange={(e) => handleInputChange('testDrive', 'email', e.target.value)} required />
            <input type="tel" placeholder="Phone" value={forms.testDrive.phone} onChange={(e) => handleInputChange('testDrive', 'phone', e.target.value)} required />
            <select value={forms.testDrive.dealership} onChange={(e) => handleInputChange('testDrive', 'dealership', e.target.value)}>
              <option>Birmingham</option>
              <option>Manchester</option>
              <option>London</option>
              <option>Leeds</option>
            </select>
            <div className="split-row">
              <input type="date" value={forms.testDrive.preferredDate} onChange={(e) => handleInputChange('testDrive', 'preferredDate', e.target.value)} required />
              <input type="time" value={forms.testDrive.preferredTime} onChange={(e) => handleInputChange('testDrive', 'preferredTime', e.target.value)} required />
            </div>
            <button type="submit" className="primary-button">Confirm test drive</button>
          </form>

          <div className="info-stack">
            <div className="info-card">
              <p className="eyebrow gold">Quick reminder</p>
              <h3>Bring your licence</h3>
              <p>Completed forms are reviewed within 2 hours during business hours.</p>
            </div>
            <div className="info-card">
              <p className="eyebrow gold">Popular models</p>
              {popularModels.map((name) => <div key={name} className="list-row">{name}</div>)}
            </div>
          </div>
        </section>
      );
    }

    if (selectedTab === 'reservation') {
      return (
        <section className="panel-box two-col">
          <form className="glass-form" onSubmit={createReservationPayment}>
            <p className="eyebrow gold">Reserve a vehicle</p>
            <h2>Secure your chosen car with a refundable deposit</h2>
            <input type="text" placeholder="Full name" value={forms.reservation.customerName} onChange={(e) => handleInputChange('reservation', 'customerName', e.target.value)} required />
            <input type="email" placeholder="Email" value={forms.reservation.email} onChange={(e) => handleInputChange('reservation', 'email', e.target.value)} required />
            <input type="tel" placeholder="Phone" value={forms.reservation.phone} onChange={(e) => handleInputChange('reservation', 'phone', e.target.value)} required />
            <input type="number" min="500" step="100" placeholder="Deposit amount" value={forms.reservation.depositAmount} onChange={(e) => handleInputChange('reservation', 'depositAmount', Number(e.target.value))} />
            <button type="submit" className="primary-button">Pay deposit</button>
          </form>

          <div className="calculator-card">
            <p className="eyebrow gold">Finance calculator</p>
            <h3>Estimate EMI</h3>
            <label>Vehicle price<input type="number" value={calculator.price} onChange={(e) => setCalculator((prev) => ({ ...prev, price: Number(e.target.value) }))} /></label>
            <label>Down payment<input type="number" value={calculator.downPayment} onChange={(e) => setCalculator((prev) => ({ ...prev, downPayment: Number(e.target.value) }))} /></label>
            <label>Interest rate<input type="number" step="0.1" value={calculator.interestRate} onChange={(e) => setCalculator((prev) => ({ ...prev, interestRate: Number(e.target.value) }))} /></label>
            <label>Tenure (months)<input type="number" value={calculator.tenure} onChange={(e) => setCalculator((prev) => ({ ...prev, tenure: Number(e.target.value) }))} /></label>
            <div className="emi-output">Estimated EMI: ${emi.toFixed(0)} / month</div>
          </div>
        </section>
      );
    }

    if (selectedTab === 'dashboard') {
      return (
        <section className="dashboard-grid">
          <div className="stats-card wide">
            <p className="eyebrow gold">Customer dashboard</p>
            <h2>Your bookings</h2>
            {customerBookings.map((booking) => (
              <div key={booking.id} className="booking-row">
                <span>{booking.car}</span>
                <span>{booking.date}</span>
                <span className="status-pill">{booking.status}</span>
              </div>
            ))}
          </div>

          <div className="stats-card">
            <p className="eyebrow gold">Notifications</p>
            {notifications.map((item) => (
              <div key={item.id} className="notification-item">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            ))}
          </div>

          <div className="stats-card wide">
            <p className="eyebrow gold">Admin overview</p>
            <h2>Sales dashboard</h2>
            <div className="mini-stats">
              <div><strong>{adminData.stats.totalInventory || 0}</strong><span>Inventory</span></div>
              <div><strong>{adminData.stats.pendingBookings || 0}</strong><span>Pending bookings</span></div>
              <div><strong>{adminData.stats.reservations || 0}</strong><span>Reservations</span></div>
              <div><strong>{adminData.stats.leads || 0}</strong><span>Leads</span></div>
            </div>
            <div className="trend-row">
              {dashboard.salesTrend.map((value, index) => (
                <div key={index} className="trend-bar" style={{ height: `${value * 8}px` }} />
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (selectedTab === 'admin') {
      return (
        <section className="panel-box admin-layout">
          <div className="admin-form-card">
            <p className="eyebrow gold">Inventory management</p>
            <h2>{editingVehicleId ? 'Edit listing' : 'Add new vehicle'}</h2>
            <form className="admin-form" onSubmit={saveVehicle}>
              <div className="two-col-form">
                <input placeholder="Brand" value={adminForm.brand} onChange={(e) => handleAdminFieldChange('brand', e.target.value)} required />
                <input placeholder="Model" value={adminForm.model} onChange={(e) => handleAdminFieldChange('model', e.target.value)} required />
                <input type="number" placeholder="Year" value={adminForm.year} onChange={(e) => handleAdminFieldChange('year', Number(e.target.value))} required />
                <input type="number" placeholder="Price" value={adminForm.price} onChange={(e) => handleAdminFieldChange('price', Number(e.target.value))} required />
                <input type="number" placeholder="Mileage" value={adminForm.mileage} onChange={(e) => handleAdminFieldChange('mileage', Number(e.target.value))} />
                <select value={adminForm.fuelType} onChange={(e) => handleAdminFieldChange('fuelType', e.target.value)}>
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Hybrid</option>
                  <option>Electric</option>
                </select>
                <select value={adminForm.transmission} onChange={(e) => handleAdminFieldChange('transmission', e.target.value)}>
                  <option>Automatic</option>
                  <option>Manual</option>
                  <option>Semi-Automatic</option>
                </select>
                <select value={adminForm.bodyType} onChange={(e) => handleAdminFieldChange('bodyType', e.target.value)}>
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Hatchback</option>
                  <option>Coupe</option>
                </select>
                <input placeholder="Color" value={adminForm.color} onChange={(e) => handleAdminFieldChange('color', e.target.value)} />
                <input placeholder="Location" value={adminForm.location} onChange={(e) => handleAdminFieldChange('location', e.target.value)} />
                <select value={adminForm.status} onChange={(e) => handleAdminFieldChange('status', e.target.value)}>
                  <option>Available</option>
                  <option>Reserved</option>
                  <option>Sold</option>
                </select>
                <input placeholder="Condition grade" value={adminForm.conditionGrade} onChange={(e) => handleAdminFieldChange('conditionGrade', e.target.value)} />
              </div>

              <input placeholder="Vehicle image URL" value={adminForm.image} onChange={(e) => handleAdminFieldChange('image', e.target.value)} />
              <input placeholder="Gallery image URLs (comma separated)" value={adminForm.gallery} onChange={(e) => handleAdminFieldChange('gallery', e.target.value)} />
              <textarea placeholder="Description" value={adminForm.description} onChange={(e) => handleAdminFieldChange('description', e.target.value)} rows="3" />
              <input placeholder="Features (comma separated)" value={adminForm.features} onChange={(e) => handleAdminFieldChange('features', e.target.value)} />
              <input placeholder="Ownership history" value={adminForm.ownershipHistory} onChange={(e) => handleAdminFieldChange('ownershipHistory', e.target.value)} />
              <textarea placeholder="Inspection report" value={adminForm.inspectionReport} onChange={(e) => handleAdminFieldChange('inspectionReport', e.target.value)} rows="2" />

              <div className="toggle-row">
                <label><input type="checkbox" checked={adminForm.featured} onChange={(e) => handleAdminFieldChange('featured', e.target.checked)} /> Featured</label>
                <label><input type="checkbox" checked={adminForm.isPublished} onChange={(e) => handleAdminFieldChange('isPublished', e.target.checked)} /> Published</label>
              </div>

              <div className="admin-action-row">
                <button type="submit" className="primary-button">{editingVehicleId ? 'Update listing' : 'Add listing'}</button>
                <button type="button" className="ghost-button" onClick={resetAdminForm}>Reset</button>
              </div>
            </form>
          </div>

          <div className="admin-list-card">
            <p className="eyebrow gold">Current inventory</p>
            <h2>Manage listings</h2>
            {adminData.vehicles.map((vehicle) => (
              <div key={vehicle._id} className="admin-list-item">
                <div className="admin-item-copy">
                  <strong>{vehicle.brand} {vehicle.model}</strong>
                  <span>{vehicle.status} • ${vehicle.price.toLocaleString()}</span>
                </div>
                <div className="admin-item-actions">
                  <button className="ghost-button" onClick={() => startVehicleEdit(vehicle)}>Edit</button>
                  <button className="ghost-button danger" onClick={() => deleteVehicle(vehicle._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="panel-box">
        <p className="eyebrow gold">Admin dashboard</p>
        <h2>Inventory and operations</h2>
        <div className="admin-grid">
          <div className="stats-card">
            <h3>Recent leads</h3>
            {adminData.leads.map((lead) => (
              <div key={lead._id || lead.id} className="lead-item">
                <strong>{lead.name}</strong>
                <p>{lead.vehicleName || 'General enquiry'}</p>
              </div>
            ))}
          </div>
          <div className="stats-card">
            <h3>Bookings</h3>
            {adminData.testDrives.map((item) => (
              <div key={item._id || item.id} className="lead-item">
                <strong>{item.customerName}</strong>
                <p>{item.vehicleName} • {item.status}</p>
              </div>
            ))}
          </div>
          <div className="stats-card">
            <h3>Reservations</h3>
            {adminData.reservations.map((item) => (
              <div key={item._id || item.id} className="lead-item">
                <strong>{item.customerName}</strong>
                <p>{item.vehicleName} • £{item.depositAmount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-box">
          <div className="brand-mark">V</div>
          <div>
            <p className="eyebrow">Luxury performance</p>
            <h2>Velour Motors</h2>
          </div>
        </div>
        <nav className="main-nav">
          <button className={selectedTab === 'inventory' ? 'nav-button active' : 'nav-button'} onClick={() => setSelectedTab('inventory')}>Inventory</button>
          <button className={selectedTab === 'compare' ? 'nav-button active' : 'nav-button'} onClick={() => setSelectedTab('compare')}>Compare</button>
          <button className={selectedTab === 'booking' ? 'nav-button active' : 'nav-button'} onClick={() => setSelectedTab('booking')}>Bookings</button>
          <button className={selectedTab === 'reservation' ? 'nav-button active' : 'nav-button'} onClick={() => setSelectedTab('reservation')}>Reserve</button>
          <button className={selectedTab === 'dashboard' ? 'nav-button active' : 'nav-button'} onClick={() => setSelectedTab('dashboard')}>Dashboard</button>
          <button className={selectedTab === 'admin' ? 'nav-button active' : 'nav-button'} onClick={() => setSelectedTab('admin')}>Admin</button>
        </nav>
        <button className="primary-button">Book a call</button>
      </header>

      <main>
        {statusMessage && <div className="notice-banner">{statusMessage}</div>}
        {tabContent()}
      </main>
    </div>
  );
}

export default App;
