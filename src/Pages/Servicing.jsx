import { useState, useEffect } from 'react';
import { db, ref, push, set, onValue, update, remove } from '../DataBase/Firebase';
import { v4 as uuidv4 } from 'uuid';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoiceComponent } from './Invoice';
import * as XLSX from 'xlsx';
import {
  FiEdit, FiTrash2, FiPlus, FiSearch, FiCalendar,
  FiFilter, FiUser, FiPhone, FiDollarSign, FiCheck,
  FiClock, FiAlertCircle, FiAward, FiStar, FiDownload,
  FiX, FiChevronDown, FiChevronUp, FiMessageSquare
} from 'react-icons/fi';
import { FaCar, FaWhatsapp } from 'react-icons/fa';
import { MdCarRepair, MdCall, MdEmail } from 'react-icons/md';

const Servicing = () => {
  // Car options array
  const carOptions = [
    {
      brand: "Maruti Suzuki",
      models: ["Alto K10", "Eeco", "Wagon R", "Swift", "Dzire", "Ertiga", "Celerio", "Brezza", "Baleno", "Ignis", "XL6", "S-Presso", "Grand Vitara", "Jimny", "Fronx", "Super Carry", "Invicto"]
    },
    {
      brand: "Tata Motors",
      models: ["Punch", "Tiago", "Tigor", "Altroz", "Nexon", "Harrier", "Safari", "Curvv", "Tiago.ev"]
    },
    {
      brand: "Mahindra & Mahindra",
      models: ["Bolero", "Bolero Neo", "Thar", "Thar Roxx", "Scorpio", "Scorpio-N", "XUV 3XO", "XUV700", "XUV400", "BE 6", "XEV 9e"]
    },
    {
      brand: "Hyundai Motor India",
      models: ["Grand i10 Nios", "i20", "Aura", "Verna", "Exter", "Venue", "Creta", "Alcazar", "Tucson", "Creta Electric", "Ioniq 5"]
    },
    {
      brand: "Kia India",
      models: ["Carens", "Seltos", "Sonet", "Syros"]
    },
    {
      brand: "Toyota Kirloskar Motor",
      models: ["Innova Crysta", "Innova HyCross", "Fortuner", "Camry", "Glanza", "Urban Cruiser Hyryder", "Hilux"]
    },
    {
      brand: "Honda Cars India",
      models: ["Amaze", "City", "Elevate"]
    },
    {
      brand: "Renault India",
      models: ["Kwid", "Kiger", "Triber"]
    },
    {
      brand: "Nissan Motor India",
      models: ["Magnite"]
    },
    {
      brand: "Volkswagen India",
      models: ["Virtus", "Taigun"]
    },
    {
      brand: "Škoda Auto India",
      models: ["Kushaq", "Kodiaq", "Slavia", "Kyalq"]
    },
    {
      brand: "MG Motor India",
      models: ["Astor", "Comet EV", "Gloster", "Hector", "Hector Plus", "ZS EV", "Windsor EV"]
    },
    {
      brand: "Citroën India",
      models: ["C3", "C3 Aircross", "C5 Aircross", "-C3", "Basalt"]
    },
    {
      brand: "Audi India",
      models: ["A4", "A6", "Q5", "Q7"]
    },
    {
      brand: "BMW India",
      models: ["3 Series", "5 Series", "X1", "X3", "X4", "X5", "X7"]
    },
    {
      brand: "Mercedes-Benz India",
      models: ["C-Class", "E-Class", "S-Class", "EQS", "GLC", "GLE", "V-Class"]
    },
    {
      brand: "Jaguar",
      models: ["F-Pace"]
    },
    {
      brand: "Land Rover",
      models: ["Range Rover", "Evoque", "Sport", "Velar"]
    },
    {
      brand: "Lexus India",
      models: ["RX 350h", "RX 500h", "LX 500d", "LM 350"]
    },
    {
      brand: "Tesla",
      models: ["Model Y"]
    },
    {
      brand: "BYD & VinFast",
      models: ["(Multiple EV models planned)"]
    }
  ];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    carName: '',
    carNumber: '',
    services: [{ type: 'basic', amount: 0 }],
    otherCharges: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
    seater: '5',
    paymentMode: 'CASH'
  });

  const [services, setServices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isRepeatCustomer, setIsRepeatCustomer] = useState(false);
  const [repeatCustomerData, setRepeatCustomerData] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loyalCustomers, setLoyalCustomers] = useState([]);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  const serviceOptions = [
    { id: 'basic', name: 'Car Body Wash', price5: 300, price7: 400 },
    { id: 'premium', name: 'Top Up Car Wash', price5: 250, price7: 350 },
    { id: 'interior', name: 'Interior Polish', price5: 100, price7: 100 },
    { id: 'exterior', name: 'Outer Polish', price5: 100, price7: 100 },
    { id: 'standard', name: 'Interior Detailinng Clean', price5: 2000, price7: 3000 },
    { id: 'rubbing', name: 'Car Rubbing', price5: 0, price7: 0 },
    { id: 'coating', name: 'Car Coating', price5: 0, price7: 0 },
    { id: 'clean', name: 'Headlight Clean', price5: 0, price7: 0 },
    { id: 'mirror', name: 'Mirror Scratch Remove', price5: 0, price7: 0 },
    { id: 'other', name: 'Other Services', price5: 0, price7: 0 },
  ];

  useEffect(() => {
    const servicesRef = ref(db, 'services');
    onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const servicesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
        setServices(servicesArray);

        // Identify loyal customers (cars with multiple services)
        const carServiceCount = {};
        servicesArray.forEach(service => {
          const carNum = service.carNumber;
          carServiceCount[carNum] = (carServiceCount[carNum] || 0) + 1;
        });

        const loyalCars = Object.entries(carServiceCount)
          .filter(([_, count]) => count > 1)
          .map(([carNumber]) => carNumber);

        setLoyalCustomers(loyalCars);
      } else {
        setServices([]);
        setLoyalCustomers([]);
      }
    });
  }, []);

  useEffect(() => {
    if (formData.carNumber.length >= 3) {
      checkRepeatCustomer(formData.carNumber);
    }
  }, [formData.carNumber]);

  const checkRepeatCustomer = (carNumber) => {
    const customerServices = services.filter(service =>
      service.carNumber.toLowerCase() === carNumber.toLowerCase()
    );

    if (customerServices.length > 0) {
      setIsRepeatCustomer(true);
      const latestService = customerServices.reduce((latest, current) =>
        new Date(current.date) > new Date(latest.date) ? current : latest
      );

      setRepeatCustomerData({
        name: latestService.name,
        phone: latestService.phone,
        carName: latestService.carName || '',
        carNumber: latestService.carNumber,
        totalServices: customerServices.length,
        lastServiceDate: latestService.date,
        totalSpent: customerServices.reduce((sum, service) =>
          sum + (service.totalAmount || calculateTotal(service.services || [{ amount: service.amount }], service.otherCharges)), 0)
      });
      setCustomerHistory(customerServices.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      setIsRepeatCustomer(false);
      setRepeatCustomerData(null);
      setCustomerHistory([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSeaterChange = (seater) => {
    setFormData(prev => {
      const updatedServices = prev.services.map(service => {
        const selectedService = serviceOptions.find(s => s.id === service.type);
        if (selectedService) {
          return {
            ...service,
            amount: seater === '7' ? selectedService.price7 : selectedService.price5
          };
        }
        return service;
      });
      return {
        ...prev,
        seater,
        services: updatedServices
      };
    });
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    if (field === 'type') {
      updatedServices[index].type = value;
      const selectedService = serviceOptions.find(s => s.id === value);
      if (selectedService) {
        updatedServices[index].amount = formData.seater === '7' ? selectedService.price7 : selectedService.price5;
      }
    } else if (field === 'amount') {
      updatedServices[index].amount = value;
    }
    setFormData(prev => ({
      ...prev,
      services: updatedServices
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { type: 'basic', amount: 300 }]
    }));
  };

  const removeService = (index) => {
    if (formData.services.length <= 1) return;
    const updatedServices = formData.services.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      services: updatedServices
    }));
  };

  const calculateTotal = (services, otherCharges = 0) => {
    const servicesTotal = services.reduce((sum, service) => sum + parseInt(service.amount || 0), 0);
    return servicesTotal + parseInt(otherCharges || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const serviceId = editingService ? editingService.id : uuidv4();
    const serviceRef = ref(db, `services/${serviceId}`);

    const serviceData = {
      ...formData,
      id: serviceId,
      timestamp: new Date().toISOString(),
      totalAmount: calculateTotal(formData.services, formData.otherCharges)
    };

    set(serviceRef, serviceData)
      .then(() => {
        alert(editingService ? 'Service updated successfully!' : 'Service scheduled successfully!');
        resetForm();
        setShowForm(false);
      })
      .catch(error => {
        console.error('Error adding service: ', error);
        alert('Error scheduling service. Please try again.');
      });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      carName: '',
      carNumber: '',
      services: [{ type: 'basic', amount: 200 }],
      otherCharges: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: '',
      seater: '5',
      paymentMode: 'cash'
    });
    setIsRepeatCustomer(false);
    setRepeatCustomerData(null);
    setEditingService(null);
  };

  const editService = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      phone: service.phone,
      carName: service.carName || '',
      carNumber: service.carNumber,
      services: service.services || [{ type: 'basic', amount: 200 }],
      otherCharges: service.otherCharges || 0,
      date: service.date,
      status: service.status,
      notes: service.notes || '',
      seater: service.seater || '5',
      paymentMode: service.paymentMode || 'cash'
    });
    setShowForm(true);
  };

  const deleteService = (id) => {
    if (window.confirm('Are you sure you want to delete this service record?')) {
      const serviceRef = ref(db, `services/${id}`);
      remove(serviceRef)
        .then(() => console.log('Service deleted'))
        .catch(error => console.error('Error deleting service: ', error));
    }
  };

  const updateStatus = (id, newStatus) => {
    const serviceRef = ref(db, `services/${id}`);
    update(serviceRef, { status: newStatus })
      .then(() => console.log('Status updated'))
      .catch(error => console.error('Error updating status: ', error));
  };

  const filteredServices = services.filter(service => {
    const matchesFilter = filter === 'all' || service.status === filter;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.carNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.phone.includes(searchTerm) ||
      (service.carName && service.carName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDate = !dateFilter || service.date === dateFilter;
    return matchesFilter && matchesSearch && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'in-progress': return 'bg-amber-100 text-amber-800';
      default: return 'bg-rose-100 text-rose-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheck className="mr-1" />;
      case 'in-progress': return <FiClock className="mr-1" />;
      default: return <FiAlertCircle className="mr-1" />;
    }
  };

  const getLoyaltyLevel = (serviceCount) => {
    if (serviceCount >= 10) return 'Gold';
    if (serviceCount >= 5) return 'Silver';
    if (serviceCount >= 3) return 'Bronze';
    return 'Regular';
  };

  const getLoyaltyColor = (serviceCount) => {
    if (serviceCount >= 10) return 'bg-purple-100 text-purple-800';
    if (serviceCount >= 5) return 'bg-yellow-100 text-yellow-800';
    if (serviceCount >= 3) return 'bg-gray-100 text-gray-800';
    return 'bg-blue-100 text-blue-800';
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(services.map(service => ({
      'Customer Name': service.name,
      'Phone': service.phone,
      'Car Name': service.carName || '',
      'Car Number': service.carNumber,
      'Services': service.services ?
        service.services.map(s => serviceOptions.find(opt => opt.id === s.type)?.name).join(', ') :
        serviceOptions.find(s => s.id === service.serviceType)?.name,
      'Amount': service.totalAmount || calculateTotal(service.services || [{ amount: service.amount }], service.otherCharges),
      'Date': service.date,
      'Status': service.status,
      'Notes': service.notes
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Services");
    XLSX.writeFile(workbook, "car_services.xlsx");
  };

  const sendWhatsApp = (phone, service) => {
    // Calculate points: 50 points per service (or you can use your own logic)
    const pointsEarned = 50;
    const totalPoints = (service.loyaltyPoints || 0) + pointsEarned;

    const message =
      `Hi ${service.name}!\n\n` +
      `Your car (${service.carNumber}) has been serviced at FourWin Car Spa!\n\n` +
      // `Amount: ₹${service.totalAmount || calculateTotal(service.services || [{ amount: service.amount }], service.otherCharges)}\n` +
      `Status: ${service.status.charAt(0).toUpperCase() + service.status.slice(1)}\n\n` +
      `Congratulations! You've earned ${pointsEarned} points on this service.\n` +
      // `Your total loyalty points: ${totalPoints}\n\n` +
      `Thank you for choosing us! We appreciate your trust. \n` +
      `Come back soon for more rewards and a sparkling ride.....`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${phone}?text=${encodedMessage}`, '_blank');
  };

  const toggleCustomerExpand = (id) => {
    setExpandedCustomer(expandedCustomer === id ? null : id);
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysServices = filteredServices.filter(s => s.date === today);
  const otherServices = filteredServices.filter(s => s.date !== today);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header and Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-red-900">Car Servicing Dashboard</h1>
            <p className="text-yellow-800">Manage all car services in one place</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search by name, car no or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80 backdrop-blur-sm"
              />
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md whitespace-nowrap"
            >
              {showForm ? <FiX size={18} /> : <FiPlus size={18} />}
              {showForm ? 'Close Form' : 'Add Service'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-lg p-4 shadow-sm">
            <div className="text-red-800 text-sm font-medium">Total Services</div>
            <div className="text-2xl font-bold mt-1 text-red-900">{services.length}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-yellow-100 rounded-lg p-4 shadow-sm">
            <div className="text-yellow-800 text-sm font-medium">Today's Services</div>
            <div className="text-2xl font-bold mt-1 text-yellow-900">
              {services.filter(s => s.date === today).length}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-lg p-4 shadow-sm">
            <div className="text-red-800 text-sm font-medium">Pending</div>
            <div className="text-2xl font-bold mt-1 text-red-900">
              {services.filter(s => s.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-yellow-100 rounded-lg p-4 shadow-sm">
            <div className="text-yellow-800 text-sm font-medium">Loyal Customers</div>
            <div className="text-2xl font-bold mt-1 text-yellow-900">
              {loyalCustomers.length}
              <span className="text-xs ml-1 font-normal text-yellow-700">
                ({services.length > 0 ? Math.round((loyalCustomers.length / services.length) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Service Form - Hidden by default */}
          {showForm && (
            <div className="lg:w-1/3">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-red-100">
                <div className="bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-4">
                  <h2 className="text-xl font-bold">
                    {editingService ? 'Edit Service' : 'New Service Request'}
                  </h2>
                </div>

                <div className="p-6">
                  {isRepeatCustomer && repeatCustomerData && (
                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <FiAward className="mr-2 text-yellow-600" />
                            <h3 className="font-bold text-yellow-800">
                              Repeat Customer ({repeatCustomerData.totalServices} visits)
                            </h3>
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">
                            <span className="font-medium">Last Service:</span> {new Date(repeatCustomerData.lastServiceDate).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              name: repeatCustomerData.name,
                              phone: repeatCustomerData.phone,
                              carName: repeatCustomerData.carName,
                              carNumber: repeatCustomerData.carNumber
                            }));
                          }}
                          className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full hover:bg-yellow-200 flex items-center"
                        >
                          <FiUser className="mr-1" /> Use Details
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1 flex items-center">
                          <FiUser className="mr-2 text-red-600" /> Customer Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1 flex items-center">
                          <FiPhone className="mr-2 text-red-600" /> Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80"
                          required
                          minLength="10"
                          maxLength="10"
                        />
                      </div>

                      {/* Car Name Select */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1 flex items-center">
                          <FaCar className="mr-2 text-red-600" /> Car Name
                        </label>
                        <select
                          name="carName"
                          value={formData.carName}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80"
                          required
                        >
                          <option value="">Select Car Name</option>
                          {carOptions.map((brand, idx) => (
                            <optgroup key={brand.brand} label={brand.brand}>
                              {brand.models.map(model => (
                                <option key={model} value={`${brand.brand} ${model}`}>
                                  {brand.brand} - {model}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1 flex items-center">
                          <FaCar className="mr-2 text-red-600" /> Car Number
                        </label>
                        <input
                          type="text"
                          name="carNumber"
                          value={formData.carNumber}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              carNumber: e.target.value.toUpperCase()
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80 uppercase"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1 flex items-center">
                          <FiCalendar className="mr-2 text-red-600" /> Service Date
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-gray-700 text-sm font-medium flex items-center">
                            <FiDollarSign className="mr-2 text-red-600" /> Services
                          </label>
                          <button
                            type="button"
                            onClick={addService}
                            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full hover:bg-red-200 flex items-center"
                          >
                            <FiPlus className="mr-1" /> Add Service
                          </button>
                        </div>

                        {formData.services.map((service, index) => (
                          <div key={index} className="flex items-end mb-2 gap-2">
                            <div className="flex-1">
                              <select
                                value={service.type}
                                onChange={(e) => handleServiceChange(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white/80"
                              >
                                {serviceOptions.map(option => (
                                  <option key={option.id} value={option.id}>
                                    {option.name} (₹{option.price})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="w-24">
                              <input
                                type="number"
                                value={service.amount}
                                onChange={(e) => handleServiceChange(index, 'amount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white/80"
                                min="0"
                              />
                            </div>
                            {formData.services.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeService(index)}
                                className="p-2 text-gray-500 hover:text-red-500"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Other Charges (₹)</label>
                        <input
                          type="number"
                          name="otherCharges"
                          value={formData.otherCharges}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Notes</label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80"
                          rows="2"
                        ></textarea>
                      </div>

                      {/* Seater Selection */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Seater Type</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="seater"
                              checked={formData.seater === '5'}
                              onChange={() => handleSeaterChange('5')}
                            />
                            5 Seater
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="seater"
                              checked={formData.seater === '7'}
                              onChange={() => handleSeaterChange('7')}
                            />
                            7 Seater
                          </label>
                        </div>
                      </div>

                      {/* Payment Mode */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Payment Mode</label>
                        <select
                          name="paymentMode"
                          value={formData.paymentMode}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/80"
                          required
                        >
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="BANKING">Banking</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-red-900">Total Amount:</span>
                          <span className="text-lg font-bold text-red-900">
                            ₹{calculateTotal(formData.services, formData.otherCharges)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 shadow-md"
                        >
                          {editingService ? 'Update Service' : 'Schedule Service'}
                        </button>

                        {editingService && (
                          <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-300"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Service List */}
          <div className={`${showForm ? 'lg:w-2/3' : 'w-full'}`}>
            <div className="bg-white backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-red-100">
              <div className="bg-gradient-to-r from-red-700 to-red-800 text-gray-100 px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-50">Service Records</h2>

                  <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                    {/* Filter Dropdown */}
                    <div className="relative flex-1 xs:flex-none xs:w-40">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiFilter className="text-gray-600" />
                      </div>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-100/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-900 font-medium"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Date Picker */}
                    <div className="relative flex-1 xs:flex-none xs:w-36">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-600" />
                      </div>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-100/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      />
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={exportToExcel}
                      className="flex items-center justify-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 font-semibold py-2 rounded-lg text-sm whitespace-nowrap"
                    > Export to Excel
                      <FiDownload size={14} />
                      <span className="hidden xs:inline">Export</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {filteredServices.length > 0 ? (
                  <div className="space-y-3">
                    {/* Today's Services */}
                    {todaysServices.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
                          <FiCalendar className="mr-2" /> Today's Services ({todaysServices.length})
                        </h3>
                        <div className="space-y-3">
                          {todaysServices.map(service => (
                            <ServiceCard
                              key={service.id}
                              service={service}
                              expandedCustomer={expandedCustomer}
                              toggleCustomerExpand={toggleCustomerExpand}
                              editService={editService}
                              deleteService={deleteService}
                              updateStatus={updateStatus}
                              sendWhatsApp={sendWhatsApp}
                              serviceOptions={serviceOptions}
                              calculateTotal={calculateTotal}
                              loyalCustomers={loyalCustomers}
                              services={services}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Services */}
                    {otherServices.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-red-900 mb-2">All Services ({otherServices.length})</h3>
                        <div className="space-y-3">
                          {otherServices.map(service => (
                            <ServiceCard
                              key={service.id}
                              service={service}
                              expandedCustomer={expandedCustomer}
                              toggleCustomerExpand={toggleCustomerExpand}
                              editService={editService}
                              deleteService={deleteService}
                              updateStatus={updateStatus}
                              sendWhatsApp={sendWhatsApp}
                              serviceOptions={serviceOptions}
                              calculateTotal={calculateTotal}
                              loyalCustomers={loyalCustomers}
                              services={services}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FiAlertCircle className="mx-auto text-4xl mb-3 text-gray-400" />
                    <p className="text-lg">No services found matching your criteria</p>
                    {!showForm && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
                      >
                        <FiPlus className="mr-2" /> Add New Service
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceCard = ({
  service,
  expandedCustomer,
  toggleCustomerExpand,
  editService,
  deleteService,
  updateStatus,
  sendWhatsApp,
  serviceOptions,
  calculateTotal,
  loyalCustomers,
  services
}) => {
  const isLoyalCustomer = loyalCustomers.includes(service.carNumber);
  const serviceCount = services.filter(s => s.carNumber === service.carNumber).length;
  const totalAmount = service.totalAmount || calculateTotal(service.services || [{ amount: service.amount }], service.otherCharges);

  return (
    <div key={service.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
      <div
        className="p-4 cursor-pointer"
        onClick={() => toggleCustomerExpand(service.id)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isLoyalCustomer ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
              {isLoyalCustomer ? <FiStar /> : <FiUser />}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{service.name}</h3>
              <p className="text-sm text-gray-600">{service.carNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-red-900">₹{totalAmount}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${service.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                service.status === 'in-progress' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                {service.status.replace('-', ' ')}
              </span>
            </div>
            <button className="text-gray-500 hover:text-red-600">
              {expandedCustomer === service.id ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>
        </div>
      </div>

      {expandedCustomer === service.id && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{service.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{new Date(service.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Car Name</p>
              <p className="font-medium">{service.carName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Services</p>
              <p className="font-medium">
                {service.services ?
                  service.services.map(s => serviceOptions.find(opt => opt.id === s.type)?.name).join(', ') :
                  serviceOptions.find(s => s.id === service.serviceType)?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Visits</p>
              <p className="font-medium">
                {serviceCount > 1 ? (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${serviceCount >= 10 ? 'bg-purple-100 text-purple-800' :
                    serviceCount >= 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                    {serviceCount} visits
                  </span>
                ) : 'First visit'}
              </p>
            </div>
          </div>

          {service.notes && (
            <div className="mb-3">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-sm italic">"{service.notes}"</p>
            </div>
          )}

          <div className='mb-3'>
            <p className="text-md text-gray-800"> <span className='font-bold'>Car Type: </span> {service.seater === '7' ? '7 Seater' : '5 Seater'}</p>
            <p className="text-md text-gray-800"><span className='font-bold'>Payment Mode: </span> {service.paymentMode}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            <a
              href={`tel:${service.phone}`}
              className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-full text-sm"
            >
              <MdCall /> Call
            </a>

            <button
              onClick={() => sendWhatsApp(service.phone, service)}
              className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-full text-sm"
            >
              <FaWhatsapp /> WhatsApp
            </button>

            <PDFDownloadLink
              document={<InvoiceComponent service={service} services={services} />}
              fileName={`Invoice_${service.carNumber}_${service.id}.pdf`}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-full text-sm"
            >
              {({ loading }) => loading ? 'Preparing...' : <><FiDownload /> Invoice</>}
            </PDFDownloadLink>

            <select
              value={service.status}
              onChange={(e) => updateStatus(service.id, e.target.value)}
              className="bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <button
              onClick={() => editService(service)}
              className="flex items-center gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded-full text-sm"
            >
              <FiEdit /> Edit
            </button>

            <button
              onClick={() => deleteService(service.id)}
              className="flex items-center gap-1 bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-full text-sm"
            >
              <FiTrash2 /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servicing;