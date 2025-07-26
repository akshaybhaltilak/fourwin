import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../DataBase/Firebase';
import { ref, onValue, update, remove, push } from 'firebase/database';
import {
  Phone, ArrowLeft, Edit, Trash2, Calendar,
  MessageSquare, Save, X, ChevronDown, ChevronUp,
  Check, Clock, DollarSign, Send,
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  CreditCard,
  Clock as TimeIcon,
  TrendingUp,
  PieChart
} from 'lucide-react';

const WorkerDetailsPage = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAdvance, setShowAddAdvance] = useState(false);
  const [showAttendance, setShowAttendance] = useState(true);
  const [editedWorker, setEditedWorker] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  });

  const roles = ['worker', 'mechanic', 'salesperson', 'manager', 'electrician', 'helper'];
  const categories = ['workshop', 'shop', 'outsider', 'office', 'delivery'];

  // Calculate total days in month
  const calculateTotalDays = (monthStr) => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  // Bulk mark attendance
  const bulkMarkAttendance = (status) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const updatedAttendance = { ...worker.attendance };
    if (!updatedAttendance[currentMonth]) {
      updatedAttendance[currentMonth] = {};
    }

    for (let day = 1; day <= daysInMonth; day++) {
      updatedAttendance[currentMonth][day] = status;
    }

    const workerRef = ref(db, `workers/${workerId}`);
    update(workerRef, { attendance: updatedAttendance })
      .catch(error => {
        console.error("Error updating bulk attendance: ", error);
      });
  };

  // Render attendance days
  const renderAttendanceDays = () => {
    if (!currentMonth) return null;

    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="bg-transparent"></div>
      );
    }

    // Render days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStatus = worker.attendance &&
        worker.attendance[currentMonth] &&
        worker.attendance[currentMonth][day] ?
        worker.attendance[currentMonth][day] : 'none';

      let statusClasses = 'bg-gray-100/50 text-gray-700';
      if (dayStatus === 'present') statusClasses = 'bg-green-100/70 text-green-800';
      if (dayStatus === 'absent') statusClasses = 'bg-red-100/70 text-red-800';

      days.push(
        <button
          key={day}
          className={`
            w-full aspect-square rounded-lg flex items-center justify-center 
            font-medium text-sm cursor-pointer transition-all
            ${statusClasses}
            hover:opacity-90 hover:scale-105
            backdrop-blur-sm
          `}
          onClick={() => handleAttendanceChange(day, dayStatus)}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // WhatsApp message templates
  const messageTemplates = [
    { title: "Payment Reminder", message: "Hello {name}, this is a reminder that your payment of ₹{amount} is due. Please collect it from the office." },
    { title: "Attendance Reminder", message: "Hello {name}, please remember to come to work tomorrow. Your presence is important." },
    { title: "Task Assignment", message: "Hello {name}, you have been assigned a new task: {task}. Please complete it by {date}." }
  ];

  // Fetch worker data
  useEffect(() => {
    if (!workerId) return;

    const workerRef = ref(db, `workers/${workerId}`);
    const unsubscribe = onValue(workerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setWorker({ id: workerId, ...data });
        setEditedWorker({ id: workerId, ...data });
      } else {
        navigate('/workers');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workerId, navigate]);

  // Update worker data
  const handleUpdateWorker = () => {
    const workerRef = ref(db, `workers/${workerId}`);
    update(workerRef, {
      name: editedWorker.name,
      age: editedWorker.age,
      phone: editedWorker.phone,
      role: editedWorker.role,
      category: editedWorker.category,
      salary: editedWorker.salary,
      joinDate: editedWorker.joinDate,
      note: editedWorker.note
    })
      .then(() => {
        setIsEditing(false);
      })
      .catch(error => {
        console.error("Error updating worker: ", error);
      });
  };

  // Delete worker
  const handleDeleteWorker = () => {
    if (window.confirm("Are you sure you want to delete this worker? This action cannot be undone.")) {
      const workerRef = ref(db, `workers/${workerId}`);
      remove(workerRef)
        .then(() => {
          navigate('/workers');
        })
        .catch(error => {
          console.error("Error deleting worker: ", error);
        });
    }
  };

  // Add advance payment
  const handleAddAdvance = () => {
    if (!advanceAmount || isNaN(parseFloat(advanceAmount)) || parseFloat(advanceAmount) <= 0) {
      alert("Please enter a valid advance amount");
      return;
    }

    const advanceData = {
      amount: parseFloat(advanceAmount),
      date: new Date().toISOString(),
      note: advanceNote || "Advance payment"
    };

    const updatedAdvances = worker.advances ? [...worker.advances, advanceData] : [advanceData];

    const workerRef = ref(db, `workers/${workerId}`);
    update(workerRef, { advances: updatedAdvances })
      .then(() => {
        setAdvanceAmount('');
        setAdvanceNote('');
        setShowAddAdvance(false);
      })
      .catch(error => {
        console.error("Error adding advance: ", error);
      });
  };

  // Handle attendance change
  const handleAttendanceChange = (day, status) => {
    if (!worker || !currentMonth) return;

    const updatedAttendance = { ...worker.attendance } || {};
    if (!updatedAttendance[currentMonth]) {
      const [year, month] = currentMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();

      updatedAttendance[currentMonth] = {};
      for (let i = 1; i <= daysInMonth; i++) {
        updatedAttendance[currentMonth][i] = 'none';
      }
    }

    let newStatus;
    if (status === 'none') newStatus = 'present';
    else if (status === 'present') newStatus = 'absent';
    else newStatus = 'none';

    updatedAttendance[currentMonth][day] = newStatus;

    const workerRef = ref(db, `workers/${workerId}`);
    update(workerRef, { attendance: updatedAttendance })
      .catch(error => {
        console.error("Error updating attendance: ", error);
      });
  };

  // Get month name
  const getMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return new Date(year, month - 1).toLocaleString('default', { month: 'long' }) + ' ' + year;
  };

  // Calculate monthly stats
  const calculateMonthlyStats = () => {
    if (!worker || !worker.attendance || !worker.attendance[currentMonth]) {
      return { presentDays: 0, absentDays: 0, payment: 0, totalAdvances: 0 };
    }

    const monthAttendance = worker.attendance[currentMonth];
    const presentDays = Object.values(monthAttendance).filter(status => status === 'present').length;
    const absentDays = Object.values(monthAttendance).filter(status => status === 'absent').length;

    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyRate = worker.salary / daysInMonth;
    const basePayment = dailyRate * presentDays;

    const advances = worker.advances || [];
    const currentMonthAdvances = advances.filter(adv => {
      const advDate = new Date(adv.date);
      return (advDate.getMonth() + 1) === month && advDate.getFullYear() === parseInt(year);
    });

    const totalAdvances = currentMonthAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount), 0);
    const finalPayment = basePayment - totalAdvances;

    return {
      presentDays,
      absentDays,
      payment: finalPayment > 0 ? finalPayment : 0,
      totalAdvances,
      dailyRate
    };
  };

  // Send WhatsApp message
  const handleSendWhatsApp = (template) => {
    const { payment } = calculateMonthlyStats();
    const formattedMessage = template.message
      .replace('{name}', worker.name)
      .replace('{amount}', payment.toFixed(0))
      .replace('{task}', 'assigned task')
      .replace('{date}', new Date().toLocaleDateString());

    const encodedMessage = encodeURIComponent(formattedMessage);
    window.open(`https://wa.me/91${worker.phone}?text=${encodedMessage}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-red-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg bg-gradient-to-br from-red-50 to-yellow-50 min-h-screen">
        <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2 text-red-800">Worker not found</h2>
          <button
            onClick={() => navigate('/workers')}
            className="mt-4 bg-gradient-to-r from-red-600 to-yellow-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-all"
          >
            Back to Workers
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateMonthlyStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/workers')}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow hover:bg-white transition-all"
          >
            <ArrowLeft size={20} className="text-red-700" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-red-800">Worker Details</h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Worker Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Worker Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-red-100 to-yellow-100 p-3 rounded-full">
                    <User size={24} className="text-red-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{worker.name}</h2>
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <Phone size={14} className="text-red-600" />
                      {worker.phone}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdateWorker}
                        className="p-2 bg-green-100/80 text-green-700 rounded-full hover:bg-green-200/80 transition-all"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedWorker({ ...worker });
                        }}
                        className="p-2 bg-gray-100/80 text-gray-600 rounded-full hover:bg-gray-200/80 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 bg-blue-100/80 text-blue-700 rounded-full hover:bg-blue-200/80 transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={handleDeleteWorker}
                        className="p-2 bg-red-100/80 text-red-700 rounded-full hover:bg-red-200/80 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Full Name*</label>
                    <input
                      type="text"
                      value={editedWorker.name}
                      onChange={(e) => setEditedWorker({ ...editedWorker, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Phone Number*</label>
                      <input
                        type="tel"
                        value={editedWorker.phone}
                        onChange={(e) => setEditedWorker({ ...editedWorker, phone: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Role*</label>
                      <select
                        value={editedWorker.role}
                        onChange={(e) => setEditedWorker({ ...editedWorker, role: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Category*</label>
                      <select
                        value={editedWorker.category}
                        onChange={(e) => setEditedWorker({ ...editedWorker, category: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Monthly Salary*</label>
                      <input
                        type="number"
                        value={editedWorker.salary}
                        onChange={(e) => setEditedWorker({ ...editedWorker, salary: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Join Date</label>
                      <input
                        type="date"
                        value={editedWorker.joinDate}
                        onChange={(e) => setEditedWorker({ ...editedWorker, joinDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Notes</label>
                    <textarea
                      value={editedWorker.note}
                      onChange={(e) => setEditedWorker({ ...editedWorker, note: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-red-600" />
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <span className="ml-2 font-medium capitalize">{worker.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PieChart size={16} className="text-yellow-600" />
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium capitalize">{worker.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-red-600" />
                    <div>
                      <span className="text-gray-500">Age:</span>
                      <span className="ml-2 font-medium">{worker.age || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-yellow-600" />
                    <div>
                      <span className="text-gray-500">Salary:</span>
                      <span className="ml-2 font-medium">₹{worker.salary}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TimeIcon size={16} className="text-red-600" />
                    <div>
                      <span className="text-gray-500">Join Date:</span>
                      <span className="ml-2 font-medium">{worker.joinDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-yellow-600" />
                    <div>
                      <span className="text-gray-500">Daily Rate:</span>
                      <span className="ml-2 font-medium">₹{stats.dailyRate?.toFixed(0) || 0}</span>
                    </div>
                  </div>
                  {worker.note && (
                    <div className="col-span-2 mt-2 bg-gray-50/50 p-3 rounded-lg">
                      <div className="text-gray-500 mb-1 flex items-center gap-2">
                        <MessageSquare size={14} /> Notes:
                      </div>
                      <div className="text-gray-700">{worker.note}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${worker.phone}`}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <Phone size={16} />
                  Call
                </a>
                <div className="relative group">
                  <button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  >
                    <MessageSquare size={16} />
                    WhatsApp
                  </button>
                  <div className="absolute z-10 hidden group-hover:block mt-1 w-64 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
                    {messageTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendWhatsApp(template)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50/50 border-b last:border-b-0 transition-all"
                      >
                        <div className="font-medium text-gray-800">{template.title}</div>
                        <div className="text-xs text-gray-500 truncate">{template.message}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowAddAdvance(!showAddAdvance)}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <DollarSign size={16} />
                  Advance
                </button>
                <button
                  onClick={() => setShowAttendance(!showAttendance)}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <Calendar size={16} />
                  Attendance
                </button>
              </div>
            </div>

            {/* Advance Payment Form */}
            {showAddAdvance && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">Add Advance Payment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Amount*</label>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Note</label>
                    <input
                      type="text"
                      value={advanceNote}
                      onChange={(e) => setAdvanceNote(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
                      placeholder="Reason for advance (optional)"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddAdvance}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg font-medium hover:opacity-90 transition-all"
                    >
                      Add Advance
                    </button>
                    <button
                      onClick={() => setShowAddAdvance(false)}
                      className="flex-1 bg-gray-200/80 py-2 rounded-lg font-medium hover:bg-gray-300/80 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Stats and Attendance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">Payment Summary</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(prevMonth => {
                      const date = new Date(prevMonth);
                      date.setMonth(date.getMonth() - 1);
                      return `${date.getFullYear()}-${date.getMonth() + 1}`;
                    })}
                    className="p-1 hover:bg-gray-100/50 rounded-full transition-all"
                  >
                    <ChevronLeft size={20} className="text-red-700" />
                  </button>
                  <span className="font-medium text-gray-700">
                    {getMonthName(currentMonth)}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(prevMonth => {
                      const date = new Date(prevMonth);
                      date.setMonth(date.getMonth() + 1);
                      return `${date.getFullYear()}-${date.getMonth() + 1}`;
                    })}
                    className="p-1 hover:bg-gray-100/50 rounded-full transition-all"
                  >
                    <ChevronRight size={20} className="text-red-700" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50/70 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-800 text-sm">Present Days</div>
                      <div className="text-green-600 font-bold text-2xl">
                        {stats.presentDays}
                      </div>
                    </div>
                    <Check size={24} className="text-green-600" />
                  </div>
                </div>
                <div className="bg-red-50/70 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-red-800 text-sm">Absent Days</div>
                      <div className="text-red-600 font-bold text-2xl">
                        {stats.absentDays}
                      </div>
                    </div>
                    <X size={24} className="text-red-600" />
                  </div>
                </div>
                <div className="bg-blue-50/70 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-blue-800 text-sm">Daily Rate</div>
                      <div className="text-blue-600 font-bold text-2xl">
                        ₹{stats.dailyRate?.toFixed(0) || 0}
                      </div>
                    </div>
                    <DollarSign size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between px-4 py-3 bg-gray-50/50 rounded-lg">
                  <span className="text-gray-700">Base Payment:</span>
                  <span className="font-medium">₹{(stats.payment + stats.totalAdvances).toFixed(0)}</span>
                </div>
                {stats.totalAdvances > 0 && (
                  <div className="flex justify-between px-4 py-3 bg-gray-50/50 rounded-lg">
                    <span className="text-gray-700">Advances Taken:</span>
                    <span className="font-medium text-red-600">- ₹{stats.totalAdvances.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between p-4 bg-gradient-to-r from-red-100/70 to-yellow-100/70 rounded-lg font-bold text-lg">
                  <span className="text-gray-800">Final Payment:</span>
                  <span className="text-red-700">₹{stats.payment.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Attendance Section */}
            {showAttendance && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={24} className="text-red-600" />
                    <h3 className="font-semibold text-lg text-gray-800">Attendance</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bulkMarkAttendance('present')}
                      className="px-3 py-1 bg-green-100/70 text-green-700 rounded-lg flex items-center gap-1 text-sm hover:bg-green-200/70 transition-all"
                    >
                      <Check size={16} /> All Present
                    </button>
                    <button
                      onClick={() => bulkMarkAttendance('absent')}
                      className="px-3 py-1 bg-red-100/70 text-red-700 rounded-lg flex items-center gap-1 text-sm hover:bg-red-200/70 transition-all"
                    >
                      <X size={16} /> All Absent
                    </button>
                  </div>
                </div>

                {/* Attendance Calendar */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div
                      key={day}
                      className="text-center font-semibold text-gray-500 text-xs"
                    >
                      {day}
                    </div>
                  ))}
                  {renderAttendanceDays()}
                </div>

                {/* Attendance Legend */}
                <div className="flex justify-center gap-4 mt-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100/70 rounded"></div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-100/70 rounded"></div>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-100/50 rounded"></div>
                    <span>Not Marked</span>
                  </div>
                </div>
              </div>
            )}

            {/* Advance History */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">Advance History</h3>

              {(!worker.advances || worker.advances.length === 0) ? (
                <div className="text-sm text-gray-500 text-center py-4 bg-gray-50/50 rounded-lg">
                  No advance payments recorded
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {worker.advances.sort((a, b) => new Date(b.date) - new Date(a.date)).map((advance, index) => (
                    <div key={index} className="flex justify-between p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100/70 p-2 rounded-full">
                          <DollarSign size={16} className="text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">₹{parseFloat(advance.amount).toFixed(0)}</div>
                          <div className="text-xs text-gray-500">{advance.note}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {new Date(advance.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(advance.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDetailsPage;