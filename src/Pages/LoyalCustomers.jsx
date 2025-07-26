import { useEffect, useState } from 'react';
import { db, ref, onValue, update, push } from '../DataBase/Firebase';
import { FiUser, FiPhone, FiAward, FiStar, FiCheck, FiClock, FiAlertCircle, FiPlus, FiMinus, FiDownload, FiMessageSquare } from 'react-icons/fi';
import { MdCarRepair, MdOutlineCarRental, MdOutlineCarCrash, MdWhatsapp } from 'react-icons/md';
import { GiCarWheel } from 'react-icons/gi';
import { FaCar } from 'react-icons/fa';

const LoyalCustomers = () => {
  const [loyalCustomers, setLoyalCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState({});
  const [showAddPoints, setShowAddPoints] = useState(null);

  // Points system configuration
  const POINTS_PER_SERVICE = 50;
  const FREE_SERVICE_THRESHOLD = 400;
  const POINTS_VALIDITY_DAYS = 60; // 2 months
  const LOYALTY_LEVELS = {
    1: 'Regular',
    3: 'Bronze',
    5: 'Silver',
    8: 'Gold'
  };

  useEffect(() => {
    const servicesRef = ref(db, 'services');
    const redemptionRef = ref(db, 'redemptions');
    
    onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const servicesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Group services by car number
        const customersMap = {};
        servicesArray.forEach(service => {
          const carNum = service.carNumber;
          if (!customersMap[carNum]) {
            customersMap[carNum] = {
              name: service.name,
              phone: service.phone,
              carNumber: carNum,
              services: [],
              totalSpent: 0,
              points: 0,
              pointsExpiry: null,
              redemptionHistory: []
            };
          }
          
          const serviceDate = new Date(service.date);
          const expiryDate = new Date(serviceDate);
          expiryDate.setDate(expiryDate.getDate() + POINTS_VALIDITY_DAYS);
          
          const serviceWithPoints = {
            ...service,
            pointsEarned: POINTS_PER_SERVICE,
            date: serviceDate.toLocaleDateString(),
            expiryDate: expiryDate.toLocaleDateString(),
            timestamp: serviceDate.getTime()
          };
          
          customersMap[carNum].services.push(serviceWithPoints);
          customersMap[carNum].totalSpent += service.totalAmount || 
            calculateTotal(service.services || [{amount: service.amount}], service.otherCharges);
          customersMap[carNum].points += POINTS_PER_SERVICE;
          
          // Set the latest expiry date
          if (!customersMap[carNum].pointsExpiry || expiryDate > new Date(customersMap[carNum].pointsExpiry)) {
            customersMap[carNum].pointsExpiry = expiryDate.toISOString();
          }
        });
        
        // Get redemption history
        onValue(redemptionRef, (redemptionSnapshot) => {
          const redemptionData = redemptionSnapshot.val();
          if (redemptionData) {
            Object.keys(redemptionData).forEach(key => {
              const redemption = redemptionData[key];
              if (customersMap[redemption.carNumber]) {
                customersMap[redemption.carNumber].redemptionHistory = 
                  customersMap[redemption.carNumber].redemptionHistory || [];
                customersMap[redemption.carNumber].redemptionHistory.push(redemption);
                
                // Deduct redeemed points from total
                if (redemption.pointsRedeemed) {
                  customersMap[redemption.carNumber].points -= redemption.pointsRedeemed;
                }
              }
            });
          }
          
          // Convert to array and filter customers with multiple services
          const loyalCustomersArray = Object.values(customersMap)
            .filter(customer => customer.services.length >= 1)
            .map(customer => ({
              ...customer,
              loyaltyLevel: getLoyaltyLevel(customer.services.length - (customer.redemptionHistory?.length || 0)),
              services: customer.services.sort((a, b) => b.timestamp - a.timestamp),
              pointsExpired: new Date(customer.pointsExpiry) < new Date(),
              redemptionHistory: customer.redemptionHistory?.sort((a, b) => new Date(b.date) - new Date(a.date)) || []
            }));
          
          setLoyalCustomers(loyalCustomersArray);
        });
      }
    });
  }, []);

  const calculateTotal = (services, otherCharges = 0) => {
    const servicesTotal = services.reduce((sum, service) => sum + parseInt(service.amount || 0), 0);
    return servicesTotal + parseInt(otherCharges || 0);
  };

  const getLoyaltyLevel = (serviceCount) => {
    if (serviceCount >= 8) return 'Gold';
    if (serviceCount >= 5) return 'Silver';
    if (serviceCount >= 3) return 'Bronze';
    return 'Regular';
  };

  const getLoyaltyColor = (level) => {
    switch (level) {
      case 'Gold': return 'bg-yellow-600 text-white';
      case 'Silver': return 'bg-gray-400 text-white';
      case 'Bronze': return 'bg-amber-800 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheck className="mr-1 text-green-600" />;
      case 'in-progress': return <FiClock className="mr-1 text-yellow-600" />;
      default: return <FiAlertCircle className="mr-1 text-red-600" />;
    }
  };

  const redeemFreeService = (customer) => {
    if (window.confirm(`Are you sure you want to redeem a free service for ${customer.name}? This will deduct ${FREE_SERVICE_THRESHOLD} points.`)) {
      const redemptionData = {
        carNumber: customer.carNumber,
        name: customer.name,
        pointsRedeemed: FREE_SERVICE_THRESHOLD,
        date: new Date().toISOString(),
        previousPoints: customer.points,
        newPoints: customer.points - FREE_SERVICE_THRESHOLD,
        previousLevel: customer.loyaltyLevel,
        newLevel: getLoyaltyLevel(customer.services.length - ((customer.redemptionHistory?.length || 0) + 1))
      };

      // Add to redemption history
      const redemptionRef = ref(db, 'redemptions');
      push(redemptionRef, redemptionData).then(() => {
        alert(`Free service redeemed successfully! ${FREE_SERVICE_THRESHOLD} points deducted.`);
      });
    }
  };

  const addPointsManually = (carNumber) => {
    const points = pointsToAdd[carNumber] || 0;
    if (points <= 0) {
      alert('Please enter a valid number of points');
      return;
    }

    if (window.confirm(`Add ${points} points to ${carNumber}?`)) {
      const customer = loyalCustomers.find(c => c.carNumber === carNumber);
      if (customer) {
        const customerRef = ref(db, `loyalCustomers/${carNumber}`);
        update(customerRef, { 
          points: customer.points + points,
          lastUpdated: new Date().toISOString()
        }).then(() => {
          alert('Points added successfully!');
          setShowAddPoints(null);
          setPointsToAdd({...pointsToAdd, [carNumber]: 0});
        });
      }
    }
  };

  const sendWhatsAppReminder = (phone, name, points) => {
    const message = `Hi ${name},\n\nThis is a friendly reminder that you have ${points} loyalty points with Four Win Cars that will expire soon. Redeem them for a free service before they expire!\n\nThank you for being a valued customer.\n\n-Four Win Cars Team`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const filteredCustomers = loyalCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.carNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-200">
          <div className="bg-gradient-to-r from-red-700 to-yellow-600 text-white px-6 py-4">
            <h1 className="text-2xl font-bold flex items-center">
              <FiAward className="mr-2" /> Four Win Cars Loyalty Program
            </h1>
            <p className="text-sm opacity-90 mt-1">
              Rewarding our valued customers with exclusive benefits
            </p>
          </div>
          
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="text-gray-500 text-sm font-medium">Total Customers</div>
                <div className="text-2xl font-bold mt-1">{loyalCustomers.length}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="text-gray-500 text-sm font-medium">Gold Members</div>
                <div className="text-2xl font-bold mt-1 text-yellow-600">
                  {loyalCustomers.filter(c => c.loyaltyLevel === 'Gold').length}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="text-gray-500 text-sm font-medium">Points Redeemed</div>
                <div className="text-2xl font-bold mt-1 text-green-600">
                  {loyalCustomers.reduce((sum, c) => sum + (c.redemptionHistory?.length || 0), 0)}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="text-gray-500 text-sm font-medium">Points Expiring Soon</div>
                <div className="text-2xl font-bold mt-1 text-red-600">
                  {loyalCustomers.filter(c => {
                    if (!c.pointsExpiry) return false;
                    const expiryDate = new Date(c.pointsExpiry);
                    const today = new Date();
                    const diffTime = expiryDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7 && diffDays > 0;
                  }).length}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <h2 className="text-xl font-semibold text-gray-800">Customer Loyalty Dashboard</h2>
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or car number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              
              {/* Offers Banner */}
              <div className="bg-gradient-to-r from-red-600 to-yellow-500 text-white rounded-lg p-4 mb-6 shadow-md">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg">🏆 Earn Points, Get Rewards!</h3>
                    <p className="text-sm">
                      Get {POINTS_PER_SERVICE} points per service. Reach {FREE_SERVICE_THRESHOLD} points for a FREE full body wash!
                      Points expire after {POINTS_VALIDITY_DAYS} days.
                    </p>
                  </div>
                  <div className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                    LIMITED TIME OFFER
                  </div>
                </div>
              </div>
              
              {filteredCustomers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCustomers.map(customer => (
                    <div key={customer.carNumber} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg flex items-center">
                              {customer.name}
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getLoyaltyColor(customer.loyaltyLevel)}`}>
                                {customer.loyaltyLevel}
                              </span>
                            </h3>
                            <p className="text-gray-600 text-sm flex items-center mt-1">
                              <FiPhone className="mr-1" /> {customer.phone}
                            </p>
                            <p className="text-gray-600 text-sm flex items-center">
                              <FaCar className="mr-1" /> {customer.carNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {customer.services.length} {customer.services.length === 1 ? 'service' : 'services'}
                            </div>
                            <div className={`font-bold text-lg mt-1 ${customer.pointsExpired ? 'text-gray-400' : 'text-red-600'}`}>
                              {customer.points} pts
                              {customer.pointsExpired && <span className="text-xs text-red-500 ml-1">(Expired)</span>}
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r from-yellow-400 to-red-500`} 
                              style={{ width: `${Math.min(100, (customer.points / FREE_SERVICE_THRESHOLD) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex justify-between">
                            <span>0 pts</span>
                            <span>{FREE_SERVICE_THRESHOLD} pts</span>
                          </div>
                        </div>
                        
                        {customer.points >= FREE_SERVICE_THRESHOLD && !customer.pointsExpired && (
                          <div className="mt-3 p-2 bg-green-100 text-green-800 rounded-lg text-sm flex items-center justify-between">
                            <span>Eligible for free service!</span>
                            <button 
                              onClick={() => redeemFreeService(customer)}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            >
                              Redeem Now
                            </button>
                          </div>
                        )}
                        
                        {customer.pointsExpiry && (
                          <div className={`mt-2 text-xs ${new Date(customer.pointsExpiry) < new Date() ? 'text-red-500' : 'text-gray-500'}`}>
                            Points {new Date(customer.pointsExpiry) < new Date() ? 'expired' : 'expire'} on: {new Date(customer.pointsExpiry).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-between items-center">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium py-1 flex items-center"
                          >
                            View Details
                          </button>
                          
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => sendWhatsAppReminder(customer.phone, customer.name, customer.points)}
                              className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50"
                              title="Send WhatsApp Reminder"
                            >
                              <MdWhatsapp size={18} />
                            </button>
                            
                            <button 
                              onClick={() => setShowAddPoints(showAddPoints === customer.carNumber ? null : customer.carNumber)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                              title="Add Points"
                            >
                              <FiPlus size={18} />
                            </button>
                          </div>
                        </div>
                        
                        {showAddPoints === customer.carNumber && (
                          <div className="mt-2 flex items-center">
                            <input
                              type="number"
                              value={pointsToAdd[customer.carNumber] || ''}
                              onChange={(e) => setPointsToAdd({
                                ...pointsToAdd,
                                [customer.carNumber]: parseInt(e.target.value) || 0
                              })}
                              placeholder="Points to add"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button
                              onClick={() => addPointsManually(customer.carNumber)}
                              className="ml-2 bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
                  No customers found matching your search
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">
                <FaCar className="inline mr-2" />
                {selectedCustomer.name}'s Loyalty Details
              </h2>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                    <FiUser className="mr-2" /> Customer Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Name:</span> {selectedCustomer.name}</p>
                    <p className="text-sm"><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>
                    <p className="text-sm"><span className="font-medium">Car Number:</span> {selectedCustomer.carNumber}</p>
                    <button 
                      onClick={() => sendWhatsAppReminder(selectedCustomer.phone, selectedCustomer.name, selectedCustomer.points)}
                      className="mt-2 text-sm bg-green-500 text-white px-3 py-1 rounded flex items-center hover:bg-green-600"
                    >
                      <MdWhatsapp className="mr-1" /> Send Reminder
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                    <FiAward className="mr-2" /> Loyalty Status
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Level:</span> 
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getLoyaltyColor(selectedCustomer.loyaltyLevel)}`}>
                        {selectedCustomer.loyaltyLevel}
                      </span>
                    </p>
                    <p className="text-sm"><span className="font-medium">Total Services:</span> {selectedCustomer.services.length}</p>
                    <p className="text-sm"><span className="font-medium">Total Points:</span> 
                      <span className={`ml-1 font-bold ${selectedCustomer.pointsExpired ? 'text-gray-500' : 'text-red-600'}`}>
                        {selectedCustomer.points}
                        {selectedCustomer.pointsExpired && <span className="text-xs text-red-500 ml-1">(Expired)</span>}
                      </span>
                    </p>
                    <p className="text-sm"><span className="font-medium">Total Spent:</span> ₹{selectedCustomer.totalSpent}</p>
                    {selectedCustomer.pointsExpiry && (
                      <p className="text-sm">
                        <span className="font-medium">Points Expiry:</span> 
                        <span className={`ml-1 ${new Date(selectedCustomer.pointsExpiry) < new Date() ? 'text-red-500' : ''}`}>
                          {new Date(selectedCustomer.pointsExpiry).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                <MdCarRepair className="mr-2" /> Service History
              </h3>
              <div className="space-y-3">
                {selectedCustomer.services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium flex items-center">
                          {service.date}
                          {service.expiryDate && (
                            <span className={`ml-2 text-xs px-1 rounded ${new Date(service.expiryDate) < new Date() ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                              Exp: {service.expiryDate}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {service.services ? 
                            service.services.map(s => s.type).join(', ') : 
                            service.serviceType}
                        </p>
                        {service.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">"{service.notes}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{service.totalAmount || calculateTotal(service.services || [{amount: service.amount}], service.otherCharges)}</p>
                        <div className="flex items-center justify-end mt-1">
                          {getStatusIcon(service.status)}
                          <span className="text-xs capitalize">
                            {service.status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-yellow-600 mt-1 font-medium">
                          +{POINTS_PER_SERVICE} points
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center hover:bg-gray-200">
                        <FiDownload className="mr-1" /> Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Redemption History Section */}
              {selectedCustomer.redemptionHistory.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                    <FiAward className="mr-2" /> Redemption History
                  </h3>
                  <div className="space-y-3">
                    {selectedCustomer.redemptionHistory.map((redemption, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-amber-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {new Date(redemption.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Redeemed {redemption.pointsRedeemed} points for free service
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Previous: {redemption.previousPoints} pts ({redemption.previousLevel}) → 
                              Current: {redemption.newPoints} pts ({redemption.newLevel})
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-red-600 font-bold">
                              -{redemption.pointsRedeemed} pts
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Free service provided
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedCustomer.points >= FREE_SERVICE_THRESHOLD && !selectedCustomer.pointsExpired && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">🎉 Free Service Available!</h3>
                      <p className="text-sm mt-1">
                        This customer has earned a free full car body wash!
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          redeemFreeService(selectedCustomer);
                          setSelectedCustomer(null);
                        }}
                        className="bg-white text-green-600 px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-100 whitespace-nowrap"
                      >
                        Redeem Now
                      </button>
                      <button 
                        onClick={() => sendWhatsAppReminder(selectedCustomer.phone, selectedCustomer.name, selectedCustomer.points)}
                        className="bg-green-800 text-white px-4 py-1 rounded-full text-sm font-bold hover:bg-green-900 flex items-center whitespace-nowrap"
                      >
                        <MdWhatsapp className="mr-1" /> Notify Customer
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedCustomer.pointsExpired && (
                <div className="mt-6 p-4 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">⚠️ Points Expired</h3>
                      <p className="text-sm mt-1">
                        This customer's points expired on {new Date(selectedCustomer.pointsExpiry).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => sendWhatsAppReminder(selectedCustomer.phone, selectedCustomer.name, 0)}
                      className="bg-white text-red-600 px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-100 flex items-center"
                    >
                      <FiMessageSquare className="mr-1" /> Send Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyalCustomers;