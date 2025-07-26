import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../DataBase/Firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { Phone, Edit, Trash2, Eye, Filter, Calendar, Search, ChevronDown, User, UserPlus, Wallet, Plus, X, ChevronRight } from 'lucide-react';

const WorkersPage = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    role: 'worker',
    category: 'washing',
    salary: '',
    joinDate: new Date().toISOString().split('T')[0],
    note: ''
  });

  const roles = ['Manager', 'Supervisor', 'Worker', 'Detailer', 'Cashier', 'Driver'];
  const categories = ['washing', 'detailing', 'office', 'management', 'delivery'];

  // Fetch workers data from Firebase
  useEffect(() => {
    const workersRef = ref(db, 'workers');
    const unsubscribe = onValue(workersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const workersArray = Object.entries(data).map(([id, details]) => ({
          id,
          ...details
        }));
        setWorkers(workersArray);
      } else {
        setWorkers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Add new worker
  const handleAddWorker = (e) => {
    e.preventDefault();
    const workersRef = ref(db, 'workers');
    const newWorkerRef = push(workersRef);

    // Calculate current month attendance record structure
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const initialAttendance = {};
    for (let i = 1; i <= daysInMonth; i++) {
      initialAttendance[i] = 'none';
    }

    const workerData = {
      ...formData,
      attendance: {
        [`${currentYear}-${currentMonth + 1}`]: initialAttendance
      },
      advances: [],
      createdAt: new Date().toISOString()
    };

    set(newWorkerRef, workerData)
      .then(() => {
        setFormData({
          name: '',
          age: '',
          phone: '',
          role: 'worker',
          category: 'washing',
          salary: '',
          joinDate: new Date().toISOString().split('T')[0],
          note: ''
        });
        setShowAddForm(false);
      })
      .catch(error => {
        console.error("Error adding worker: ", error);
      });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Navigate to worker details
  const handleViewWorker = (workerId) => {
    navigate(`/worker/${workerId}`);
  };

  // Filter workers based on category, role, and search term
  const filteredWorkers = workers.filter(worker => {
    const matchesCategory = filterCategory === 'all' || worker.category === filterCategory;
    const matchesRole = filterRole === 'all' || worker.role === filterRole;
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.phone.includes(searchTerm);

    return matchesCategory && matchesRole && matchesSearch;
  });

  // Calculate present days and payment for current month
  const calculateMonthlyStats = (worker) => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthKey = `${currentYear}-${currentMonth}`;

    if (!worker.attendance || !worker.attendance[monthKey]) {
      return { presentDays: 0, payment: 0 };
    }

    const monthAttendance = worker.attendance[monthKey];
    const presentDays = Object.values(monthAttendance).filter(status => status === 'present').length;

    // Calculate payment based on present days
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dailyRate = worker.salary / daysInMonth;
    const basePayment = dailyRate * presentDays;

    // Subtract advances if any
    const advances = worker.advances || [];
    const currentMonthAdvances = advances.filter(adv => {
      const advDate = new Date(adv.date);
      return advDate.getMonth() + 1 === currentMonth && advDate.getFullYear() === currentYear;
    });

    const totalAdvances = currentMonthAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount), 0);
    const finalPayment = basePayment - totalAdvances;

    return {
      presentDays,
      payment: finalPayment > 0 ? finalPayment : 0,
      totalAdvances
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-900">Workforce Management</h1>
            <p className="text-red-700">Manage your team members efficiently</p>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl hover:from-red-700 hover:to-red-900 transition-all shadow-lg hover:shadow-xl"
          >
            {showAddForm ? <X size={20} /> : <Plus size={20} />}
            <span>{showAddForm ? 'Cancel' : 'Add Worker'}</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Filters and Add Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100 shadow-lg">
              <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <Search className="text-red-600" size={20} />
                Search Workers
              </h2>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  className="w-full pl-10 pr-4 py-3 bg-white/70 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-red-300 text-red-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-red-500" size={20} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Filter by Role</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-red-800 pr-10"
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-red-500 pointer-events-none" size={20} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Filter by Category</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-red-800 pr-10"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-red-500 pointer-events-none" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Add Worker Form */}
            {showAddForm && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100 shadow-lg">
                <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                  <UserPlus className="text-red-600" size={20} />
                  Add New Worker
                </h2>
                
                <form onSubmit={handleAddWorker} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Full Name*</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">Phone*</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">Salary*</label>
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Monthly salary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">Role*</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-red-800"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">Category*</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-red-800"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Join Date</label>
                    <input
                      type="date"
                      name="joinDate"
                      value={formData.joinDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Notes</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/70 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Additional notes"
                      rows="3"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-red-900 font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Save Worker Details
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column - Workers List */}
          <div className="lg:col-span-2">
            {/* Stats Card */}
            <div className="bg-gradient-to-r from-red-800 to-red-900 text-white rounded-2xl p-6 mb-6 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold mb-1">Team Overview</h2>
                  <p className="text-red-200">Manage your workforce efficiently</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{workers.length}</div>
                    <div className="text-sm text-red-200">Total Workers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {workers.filter(w => w.role === 'Manager').length}
                    </div>
                    <div className="text-sm text-red-200">Managers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {workers.filter(w => w.role === 'Worker').length}
                    </div>
                    <div className="text-sm text-red-200">Workers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workers List */}
            <div className="space-y-4">
              {filteredWorkers.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-red-100 shadow-lg flex flex-col items-center justify-center min-h-[300px]">
                  <UserPlus className="text-red-300 mb-4" size={40} />
                  <h3 className="text-xl font-semibold text-red-800 mb-2">No workers found</h3>
                  <p className="text-red-600 max-w-md mb-4">
                    {searchTerm ? 'No workers match your search criteria' : 'Add your first worker to get started'}
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add New Worker
                  </button>
                </div>
              ) : (
                filteredWorkers.map(worker => {
                  const { presentDays, payment, totalAdvances } = calculateMonthlyStats(worker);
                  const dueColor = payment > 0 ? 'text-green-500' : 'text-gray-500';
                  const advanceColor = totalAdvances > 0 ? 'text-red-400' : 'text-gray-400';

                  return (
                    <div key={worker.id} className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-red-100 shadow-md hover:shadow-lg transition-all">
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="bg-red-100 p-2 rounded-full">
                                <User className="text-red-600" size={20} />
                              </div>
                              <h3 className="text-xl font-semibold text-red-900">{worker.name}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded-full capitalize">
                                {worker.role}
                              </span>
                              <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full capitalize">
                                {worker.category}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewWorker(worker.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            aria-label="View details"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                            <div className="text-sm text-red-700 mb-1 flex items-center gap-2">
                              <Phone className="text-red-500" size={16} />
                              Contact
                            </div>
                            <div className="font-medium text-red-900">{worker.phone || 'Not provided'}</div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                            <div className="text-sm text-red-700 mb-1 flex items-center gap-2">
                              <Wallet className="text-red-500" size={16} />
                              Salary
                            </div>
                            <div className="font-medium text-red-900">₹{worker.salary?.toLocaleString() || '0'}</div>
                          </div>
                        </div>

                        <div className="mt-4 bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg p-4 border border-red-100">
                          <div className="flex justify-between items-center mb-3">
                            <div className="text-sm font-medium text-red-700 flex items-center gap-2">
                              <Calendar className="text-red-500" size={16} />
                              This Month's Stats
                            </div>
                            <div className="text-xs bg-white px-3 py-1 rounded-full text-red-700 border border-red-200">
                              {presentDays} {presentDays === 1 ? 'day' : 'days'} worked
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-red-600 mb-1">Current Balance</div>
                              <div className={`font-bold ${dueColor}`}>
                                ₹{Math.abs(payment).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-red-600 mb-1">Advances Taken</div>
                              <div className={`font-bold ${advanceColor}`}>
                                {totalAdvances > 0 ? `₹${totalAdvances.toLocaleString()}` : 'None'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkersPage;