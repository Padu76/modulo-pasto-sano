import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Users, ShoppingBag, TrendingUp, Clock, CheckCircle, XCircle, Eye, FileText, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

const PastosanoDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrdersForPdf, setSelectedOrdersForPdf] = useState(new Set());

  // Dati mock
  const todayStats = {
    reservations: 24,
    orders: 18,
    revenue: 650,
    satisfaction: 4.8
  };

  const weeklyData = [
    { day: 'Lun', ordini: 12, fatturato: 340 },
    { day: 'Mar', ordini: 19, fatturato: 520 },
    { day: 'Mer', ordini: 15, fatturato: 410 },
    { day: 'Gio', ordini: 22, fatturato: 680 },
    { day: 'Ven', ordini: 28, fatturato: 890 },
    { day: 'Sab', ordini: 35, fatturato: 1250 },
    { day: 'Dom', ordini: 18, fatturato: 650 }
  ];

  const reservations = [
    { id: 1, customer: 'Mario Rossi', time: '19:30', guests: 4, status: 'confermata' },
    { id: 2, customer: 'Anna Verdi', time: '20:00', guests: 2, status: 'in-attesa' },
    { id: 3, customer: 'Luca Bianchi', time: '20:30', guests: 6, status: 'confermata' },
    { id: 4, customer: 'Sofia Neri', time: '21:00', guests: 3, status: 'annullata' }
  ];

  const orders = [
    {
      id: 1,
      customer: 'Mario Rossi',
      time: '19:45',
      status: 'preparazione',
      total: 45.50,
      items: [
        { name: 'Spaghetti Carbonara', quantity: 2, price: 12.00 },
        { name: 'Tiramisù', quantity: 1, price: 6.50 },
        { name: 'Vino Rosso', quantity: 1, price: 15.00 }
      ]
    },
    {
      id: 2,
      customer: 'Anna Verdi',
      time: '20:15',
      status: 'servito',
      total: 28.00,
      items: [
        { name: 'Pizza Margherita', quantity: 1, price: 8.00 },
        { name: 'Insalata Mista', quantity: 1, price: 6.00 },
        { name: 'Acqua', quantity: 2, price: 4.00 },
        { name: 'Caffè', quantity: 2, price: 3.00 }
      ]
    },
    {
      id: 3,
      customer: 'Luca Bianchi',
      time: '20:45',
      status: 'completato',
      total: 65.00,
      items: [
        { name: 'Antipasto Misto', quantity: 1, price: 15.00 },
        { name: 'Bistecca alla Griglia', quantity: 2, price: 22.00 },
        { name: 'Contorno di Verdure', quantity: 2, price: 8.00 }
      ]
    }
  ];

  const generateOrdersPDF = () => {
    if (selectedOrdersForPdf.size === 0) {
      alert('Seleziona almeno un ordine per creare il PDF');
      return;
    }

    const doc = new jsPDF();
    const selectedOrders = orders.filter(order => selectedOrdersForPdf.has(order.id));
    
    // Header
    doc.setFontSize(20);
    doc.text('Lista Ordini - Pastosano', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 20, 30);
    doc.text(`Ordini selezionati: ${selectedOrders.length}`, 20, 40);
    
    let yPosition = 60;
    
    selectedOrders.forEach((order, index) => {
      // Nome cliente
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`${order.customer}`, 20, yPosition);
      
      // Prodotti
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      yPosition += 10;
      
      order.items.forEach((item) => {
        doc.text(`• ${item.name} x${item.quantity}`, 30, yPosition);
        yPosition += 8;
      });
      
      yPosition += 5;
      
      // Nuova pagina se necessario
      if (yPosition > 250 && index < selectedOrders.length - 1) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    doc.save('ordini-selezionati.pdf');
  };

  const toggleOrderSelection = (orderId) => {
    const newSelection = new Set(selectedOrdersForPdf);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrdersForPdf(newSelection);
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'preparazione':
        return <Clock className="text-yellow-500" size={16} />;
      case 'servito':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'completato':
        return <CheckCircle className="text-blue-500" size={16} />;
      default:
        return <XCircle className="text-red-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confermata':
        return 'bg-green-100 text-green-800';
      case 'in-attesa':
        return 'bg-yellow-100 text-yellow-800';
      case 'annullata':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Pastosano</h1>
              <span className="ml-2 text-sm text-gray-500">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Panoramica', icon: TrendingUp },
              { id: 'reservations', label: 'Prenotazioni', icon: Calendar },
              { id: 'orders', label: 'Ordini', icon: ShoppingBag },
              { id: 'menu', label: 'Menu', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="mr-2" size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="text-blue-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Prenotazioni Oggi</p>
                    <p className="text-2xl font-bold text-gray-900">{todayStats.reservations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingBag className="text-green-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ordini Oggi</p>
                    <p className="text-2xl font-bold text-gray-900">{todayStats.orders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="text-yellow-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Fatturato Oggi</p>
                    <p className="text-2xl font-bold text-gray-900">€{todayStats.revenue}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="text-purple-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Soddisfazione</p>
                    <p className="text-2xl font-bold text-gray-900">{todayStats.satisfaction}/5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ordini Settimanali</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ordini" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Fatturato Settimanale</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`€${value}`, 'Fatturato']} />
                    <Line type="monotone" dataKey="fatturato" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Prenotazioni di Oggi</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ospiti
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stato
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reservation.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reservation.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reservation.guests}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                            {reservation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Ordini Recenti</h3>
                <div className="flex gap-2">
                  <button
                    onClick={generateOrdersPDF}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <Printer size={16} />
                    PDF Ordini ({selectedOrdersForPdf.size})
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedOrdersForPdf.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <div>
                          <h4 className="font-medium text-gray-800">{order.customer}</h4>
                          <p className="text-sm text-gray-600">{order.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className="text-sm font-medium">{order.status}</span>
                        </div>
                        <span className="text-sm font-bold">€{order.total.toFixed(2)}</span>
                        <button
                          onClick={() => openOrderModal(order)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Gestione Menu</h3>
              <p className="text-gray-600">Sezione menu in sviluppo...</p>
            </div>
          </div>
        )}
      </main>

      {/* Order Modal */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Dettagli Ordine - {selectedOrder.customer}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Orario: {selectedOrder.time}</p>
                  <p className="text-sm text-gray-600">Stato: {selectedOrder.status}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Articoli:</h4>
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Totale:</span>
                    <span>€{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsOrderModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastosanoDashboard;