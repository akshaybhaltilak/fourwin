import { useState, useEffect } from 'react';
import { db, ref, onValue } from '../DataBase/Firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { FiDownload, FiFilter, FiBarChart2, FiPieChart, FiDollarSign, FiUsers, FiCalendar, FiTrendingUp } from 'react-icons/fi';

const Reports = () => {
  const [services, setServices] = useState([]);
  const [loyalCustomers, setLoyalCustomers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [timeRange, setTimeRange] = useState('30days');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const servicesRef = ref(db, 'services');
    const loyalCustomersRef = ref(db, 'loyalCustomers');
    const redemptionsRef = ref(db, 'redemptions');
    const workersRef = ref(db, 'workers');

    onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      const servicesArray = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setServices(servicesArray);
    });

    onValue(loyalCustomersRef, (snapshot) => {
      const data = snapshot.val();
      const loyalCustomersArray = data ? Object.keys(data).map(key => ({
        carNumber: key,
        ...data[key]
      })) : [];
      setLoyalCustomers(loyalCustomersArray);
    });

    onValue(redemptionsRef, (snapshot) => {
      const data = snapshot.val();
      const redemptionsArray = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setRedemptions(redemptionsArray);
    });

    onValue(workersRef, (snapshot) => {
      const data = snapshot.val();
      const workersArray = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setWorkers(workersArray);
    });
  }, []);

  useEffect(() => {
    let startDate;
    const endDate = new Date().toISOString().split('T')[0];
    
    switch(timeRange) {
      case '7days':
        startDate = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];
        break;
      case '30days':
        startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        break;
      case '6months':
        startDate = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
        break;
      case '1year':
        startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
        break;
      default:
        startDate = dateRange.start;
    }
    
    setDateRange({
      start: startDate,
      end: endDate
    });
  }, [timeRange]);

  const filteredServices = services.filter(service => {
    return service.date >= dateRange.start && service.date <= dateRange.end;
  });

  // Helper functions for data calculations
  const calculateRevenue = () => {
    return filteredServices.reduce((sum, service) => sum + (parseInt(service.totalAmount) || 0), 0);
  };

  const getServiceTypeData = () => {
    const typeMap = {};
    
    filteredServices.forEach(service => {
      service.services.forEach(s => {
        if (!typeMap[s.type]) {
          typeMap[s.type] = { count: 0, revenue: 0 };
        }
        typeMap[s.type].count += 1;
        typeMap[s.type].revenue += parseInt(s.amount) || 0;
      });
    });
    
    return Object.keys(typeMap).map(key => ({
      name: key,
      count: typeMap[key].count,
      revenue: typeMap[key].revenue
    }));
  };

  const getStatusData = () => {
    const statusMap = {
      pending: { count: 0, revenue: 0 },
      'in-progress': { count: 0, revenue: 0 },
      completed: { count: 0, revenue: 0 }
    };
    
    filteredServices.forEach(service => {
      statusMap[service.status].count += 1;
      statusMap[service.status].revenue += parseInt(service.totalAmount) || 0;
    });
    
    return Object.keys(statusMap).map(key => ({
      name: key,
      count: statusMap[key].count,
      revenue: statusMap[key].revenue
    }));
  };

  const getDailyRevenueData = () => {
    const dailyMap = {};
    
    filteredServices.forEach(service => {
      if (!dailyMap[service.date]) {
        dailyMap[service.date] = 0;
      }
      dailyMap[service.date] += parseInt(service.totalAmount) || 0;
    });
    
    return Object.keys(dailyMap).map(date => ({
      date,
      revenue: dailyMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getMonthlyRevenueData = () => {
    const monthlyMap = {};
    
    filteredServices.forEach(service => {
      const monthYear = service.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[monthYear]) {
        monthlyMap[monthYear] = 0;
      }
      monthlyMap[monthYear] += parseInt(service.totalAmount) || 0;
    });
    
    return Object.keys(monthlyMap).map(month => ({
      month,
      revenue: monthlyMap[month]
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

  const getTopCustomers = () => {
    const customerMap = {};
    
    filteredServices.forEach(service => {
      if (!customerMap[service.carNumber]) {
        customerMap[service.carNumber] = {
          name: service.name,
          phone: service.phone,
          visits: 0,
          revenue: 0
        };
      }
      customerMap[service.carNumber].visits += 1;
      customerMap[service.carNumber].revenue += parseInt(service.totalAmount) || 0;
    });
    
    return Object.keys(customerMap).map(carNumber => ({
      carNumber,
      ...customerMap[carNumber]
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  };

  const getWorkerAttendance = () => {
    return workers.map(worker => {
      const attendanceDays = worker.attendance ? 
        Object.values(worker.attendance).flat().filter(day => day === 'present').length : 0;
      return {
        name: worker.name,
        role: worker.role,
        attendance: attendanceDays,
        salary: worker.salary || 0
      };
    });
  };

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      ...filteredServices.map(s => ({
        'Date': s.date,
        'Customer Name': s.name,
        'Car Number': s.carNumber,
        'Phone': s.phone,
        'Service Type': s.services.map(serv => serv.type).join(', '),
        'Amount': s.services.reduce((sum, serv) => sum + (parseInt(serv.amount) || 0), 0),
        'Other Charges': parseInt(s.otherCharges) || 0,
        'Total Amount': parseInt(s.totalAmount) || 0,
        'Status': s.status,
        'Notes': s.notes
      })),
      ...loyalCustomers.map(lc => ({
        'Car Number': lc.carNumber,
        'Points': lc.points || 0,
        'Last Redeemed': lc.lastRedeemed || 'Never',
        'Free Service Used': lc.freeServiceUsed ? 'Yes' : 'No'
      }))
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Business Report");
    XLSX.writeFile(workbook, `FourWin_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-red-600 mb-2">Four Win Car Wash</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">Business Analytics Dashboard</h2>
            <p className="text-gray-600">
              {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
            </p>
          </div>
          <button 
            onClick={exportToExcel}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
          >
            <FiDownload /> Export to Excel
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0 flex items-center gap-2">
              <FiFilter /> Filter Time Period
            </h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setTimeRange('7days')}
                className={`px-3 py-1 rounded-lg ${timeRange === '7days' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setTimeRange('30days')}
                className={`px-3 py-1 rounded-lg ${timeRange === '30days' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Last 30 Days
              </button>
              <button 
                onClick={() => setTimeRange('6months')}
                className={`px-3 py-1 rounded-lg ${timeRange === '6months' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Last 6 Months
              </button>
              <button 
                onClick={() => setTimeRange('1year')}
                className={`px-3 py-1 rounded-lg ${timeRange === '1year' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Last Year
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setTimeRange('custom');
                  setDateRange({...dateRange, start: e.target.value});
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setTimeRange('custom');
                  setDateRange({...dateRange, end: e.target.value});
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <FiDollarSign className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">₹{calculateRevenue().toLocaleString()}</p>
              <p className="text-sm text-gray-500">
                {filteredServices.length} services
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <FiUsers className="text-yellow-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Loyal Customers</p>
              <p className="text-2xl font-bold text-gray-800">{loyalCustomers.length}</p>
              <p className="text-sm text-gray-500">
                {redemptions.length} redemptions
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FiBarChart2 className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Avg. Revenue/Service</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{filteredServices.length > 0 ? Math.round(calculateRevenue() / filteredServices.length).toLocaleString() : 0}
              </p>
              <p className="text-sm text-gray-500">
                {getServiceTypeData().length} service types
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FiCalendar className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Workers</p>
              <p className="text-2xl font-bold text-gray-800">{workers.length}</p>
              <p className="text-sm text-gray-500">
                {getWorkerAttendance().reduce((sum, w) => sum + w.attendance, 0)} attendance days
              </p>
            </div>
          </div>
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiTrendingUp /> Revenue Trend
              </h3>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-xs bg-gray-100 rounded-lg">Daily</button>
                <button className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg">Monthly</button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getMonthlyRevenueData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#EF4444" 
                    fill="#FEE2E2" 
                    fillOpacity={0.8}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Service Types Distribution */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiPieChart /> Service Types Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getServiceTypeData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getServiceTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Secondary Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Service Status */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getStatusData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="count" fill="#F59E0B" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top Customers */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Customers</h3>
            <div className="space-y-3">
              {getTopCustomers().map((customer, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.carNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{customer.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{customer.visits} visits</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Worker Attendance */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Worker Attendance</h3>
            <div className="space-y-3">
              {getWorkerAttendance().map((worker, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-sm text-gray-500">{worker.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{worker.attendance} days</p>
                    <p className="text-sm text-gray-500">₹{worker.salary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Services Table */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Services</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car No.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.slice(0, 5).map(service => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {new Date(service.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {service.carNumber}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {service.services.map(s => s.type).join(', ')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ₹{parseInt(service.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        service.status === 'completed' ? 'bg-green-100 text-green-800' :
                        service.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loyalty Program Stats */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Loyalty Program Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Total Loyal Customers</p>
              <p className="text-2xl font-bold">{loyalCustomers.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Points Redeemed</p>
              <p className="text-2xl font-bold">
                {redemptions.reduce((sum, r) => sum + (parseInt(r.pointsRedeemed) || 0), 0)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Free Services Used</p>
              <p className="text-2xl font-bold">
                {loyalCustomers.filter(lc => lc.freeServiceUsed).length}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Recent Redemptions</h4>
            <div className="space-y-2">
              {redemptions.slice(0, 3).map((redemption, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">{redemption.name}</span>
                    <span className="text-red-600 font-bold">-{redemption.pointsRedeemed} pts</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{redemption.carNumber}</span>
                    <span>{new Date(redemption.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;