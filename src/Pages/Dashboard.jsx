import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db, ref, onValue } from '../DataBase/Firebase';
import { FiAward, FiUser, FiStar, FiClock, FiCheckCircle, FiCalendar } from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';

const POINTS_PER_SERVICE = 50;
const FREE_SERVICE_THRESHOLD = 400;

const getLoyaltyLevel = (serviceCount) => {
  if (serviceCount >= 10) return 'Platinum';
  if (serviceCount >= 5) return 'Gold';
  if (serviceCount >= 3) return 'Silver';
  return 'Regular';
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    services: 0,
    workers: 0,
    todayServices: 0,
    pendingServices: 0,
    completedToday: 0,
  });
  const [loyalCustomers, setLoyalCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const servicesRef = ref(db, 'services');
    const workersRef = ref(db, 'workers');
    
    // Fetch services data
    onValue(servicesRef, (snapshot) => {
      const servicesData = snapshot.val() || {};
      const servicesCount = Object.keys(servicesData).length;
      
      // Calculate today's services
      const today = new Date().toISOString().split('T')[0];
      const todayServices = Object.values(servicesData).filter(
        service => service.date === today
      ).length;
      
      // Calculate pending services
      const pendingServices = Object.values(servicesData).filter(
        service => service.status === 'pending'
      ).length;
      
      // Calculate completed today
      const completedToday = Object.values(servicesData).filter(
        service => service.date === today && service.status === 'completed'
      ).length;

      setStats(prev => ({
        ...prev,
        services: servicesCount,
        todayServices,
        pendingServices,
        completedToday
      }));
    });

    // Fetch workers data
    onValue(workersRef, (snapshot) => {
      const workersData = snapshot.val() || {};
      setStats(prev => ({
        ...prev,
        workers: Object.keys(workersData).length
      }));
    });

    // Loyal customers calculation
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const servicesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Group by car number
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
              points: 0
            };
          }
          customersMap[carNum].services.push(service);
          customersMap[carNum].totalSpent += service.totalAmount || 0;
          customersMap[carNum].points += POINTS_PER_SERVICE;
        });

        // Loyal customers: more than 1 service
        const loyalCustomersArray = Object.values(customersMap)
          .filter(customer => customer.services.length > 1)
          .map(customer => ({
            ...customer,
            loyaltyLevel: getLoyaltyLevel(customer.services.length)
          }));

        setLoyalCustomers(loyalCustomersArray);
      } else {
        setLoyalCustomers([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const platinumCount = loyalCustomers.filter(c => c.loyaltyLevel === 'Platinum').length;
  const goldCount = loyalCustomers.filter(c => c.loyaltyLevel === 'Gold').length;
  const silverCount = loyalCustomers.filter(c => c.loyaltyLevel === 'Silver').length;
  const eligibleForFree = loyalCustomers.filter(c => c.points >= FREE_SERVICE_THRESHOLD).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="text-left mb-6">
          <h1 className="text-3xl font-bold text-red-800">FourWin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Main Stats - Compact Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md font-medium text-gray-500">Services</p>
                <p className="text-md font-bold">{stats.services}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <FiCalendar className="text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md font-medium text-gray-500">Workers</p>
                <p className="text-md font-bold">{stats.workers}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <FiUser className="text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md font-medium text-gray-500">Today</p>
                <p className="text-md font-bold">{stats.todayServices}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <FiClock className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md font-medium text-gray-500">Completed</p>
                <p className="text-md font-bold">{stats.completedToday}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <FiCheckCircle className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Compact */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to="/servicing" className="bg-white rounded-lg shadow p-4 flex items-center space-x-3 hover:shadow-md transition-shadow">
            <div className="bg-red-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-md font-medium">Services</span>
          </Link>
          
          <Link to="/worker" className="bg-white rounded-lg shadow p-4 flex items-center space-x-3 hover:shadow-md transition-shadow">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-md font-medium">Workers</span>
          </Link>
          
          <Link to="/reports" className="bg-white rounded-lg shadow p-4 flex items-center space-x-3 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-md font-medium">Reports</span>
          </Link>
          
          <Link to="/loyal" className="bg-white rounded-lg shadow p-4 flex items-center space-x-3 hover:shadow-md transition-shadow">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FiAward className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-md font-medium">Loyalty</span>
          </Link>
        </div>

        {/* Today's Overview - Compact */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-xl flex items-center">
              <FiCalendar className="mr-2 text-red-600" />
              Today's Overview
            </h2>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-md text-gray-500">Scheduled</p>
              <p className="font-bold">{stats.todayServices}</p>
            </div>
            <div className="text-center">
              <p className="text-md text-gray-500">Pending</p>
              <p className="font-bold text-yellow-600">{stats.pendingServices}</p>
            </div>
            <div className="text-center">
              <p className="text-md text-gray-500">Completed</p>
              <p className="font-bold text-green-600">{stats.completedToday}</p>
            </div>
          </div>
        </div>

        {/* Loyalty Stats - Compact */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-medium flex items-center mb-3 text-xl">
            <FiAward className="mr-2 text-purple-600" />
            Loyalty Program
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-md text-purple-600">Total Members</p>
              <p className="font-bold">{loyalCustomers.length}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-md text-yellow-600">Platinum</p>
              <p className="font-bold">{platinumCount}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-md text-blue-600">Gold</p>
              <p className="font-bold">{goldCount}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-md text-green-600">Free Service</p>
              <p className="font-bold">{eligibleForFree}</p>
            </div>
          </div>
        </div>

        {/* Top Customers - Compact */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-2xl flex items-center mb-3">
            <FiStar className="mr-2 text-yellow-600" />
            Top Customers
          </h3>
          
          <div className="space-y-3">
            {loyalCustomers.length > 0 ? (
              loyalCustomers
                .sort((a, b) => b.points - a.points)
                .slice(0, 3)
                .map((customer) => (
                  <div key={customer.carNumber} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="bg-red-100 p-1 rounded-full">
                        <FiUser className="text-red-600 text-sm" />
                      </div>
                      <div>
                        <p className="text-md font-medium">{customer.name}</p>
                        <p className="text-md text-gray-500">{customer.carNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        customer.loyaltyLevel === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                        customer.loyaltyLevel === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.loyaltyLevel}
                      </span>
                      <p className="text-md font-bold mt-1">{customer.points} pts</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-sm text-gray-400 py-4">No loyal customers yet</p>
            )}
          </div>
          
          {loyalCustomers.length > 0 && (
            <Link to="/loyal" className="block text-center text-sm text-red-600 mt-3 font-medium">
              View All
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;