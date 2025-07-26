import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { PDFDownloadLink } from '@react-pdf/renderer';

// Service options for predefined services
const serviceOptions = [
  { id: 'basic', name: 'Basic Wash', price: 200 },
  { id: 'premium', name: 'Premium Wash', price: 400 },
  { id: 'interior', name: 'Interior Cleaning', price: 300 },
  { id: 'exterior', name: 'Exterior Polish', price: 350 },
  { id: 'standard', name: 'Standard Service', price: 250 },
];

// Create styles with red and yellow color scheme
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFF9F2', // Light yellow background
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#D32F2F', // Dark red
    paddingBottom: 15
  },
  logoContainer: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 15
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F', // Dark red
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  subtitle: {
    fontSize: 14,
    color: '#F57C00', // Orange
    marginBottom: 5,
    fontWeight: 'bold'
  },
  address: {
    fontSize: 10,
    marginBottom: 5,
    textAlign: 'center',
    color: '#555'
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
    backgroundColor: '#FFEBEE', // Light red
    padding: 10,
    borderRadius: 5
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#D32F2F' // Dark red
  },
  vehicleInfo: {
    flexDirection: 'column',
    marginBottom: 15,
    backgroundColor: '#FFF3E0', // Light orange
    padding: 10,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#F57C00' // Orange
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  seatType: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 5
  },
  table: {
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F', // Dark red
    color: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 5
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF'
  },
  tableRowAlternate: {
    backgroundColor: '#FFEBEE' // Light red
  },
  colSno: {
    width: '8%',
    textAlign: 'center'
  },
  colParticulars: {
    width: '52%'
  },
  colRate: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 10
  },
  colAmount: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 5
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10
  },
  totalBox: {
    width: '40%',
    borderTopWidth: 1,
    borderTopColor: '#D32F2F', // Dark red
    paddingTop: 5
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 5
  },
  totalLabel: {
    fontWeight: 'bold',
    color: '#D32F2F' // Dark red
  },
  totalValue: {
    fontWeight: 'bold'
  },
  grandTotal: {
    backgroundColor: '#D32F2F', // Dark red
    color: '#FFF',
    padding: 5,
    borderRadius: 3
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
    textAlign: 'center',
    color: '#777'
  },
  signature: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#D32F2F', // Dark red
    width: 200,
    alignSelf: 'flex-end',
    textAlign: 'center',
    paddingTop: 5
  },
  loyaltyBadge: {
    backgroundColor: '#F57C00', // Orange
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5
  },
  notesSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFF3E0', // Light orange
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#F57C00' // Orange
  }
});

const InvoiceComponent = ({ service, services = [] }) => {
  // Calculate service date and time
  const serviceDate = new Date(service.timestamp || service.date || new Date());
  const formattedDate = serviceDate.toLocaleDateString('en-IN');
  const formattedTime = serviceDate.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });

  // Calculate total amount
  const calculateTotal = (servicesArr, otherCharges = 0) => {
    const servicesTotal = servicesArr.reduce((sum, item) => {
      // Use item.amount if present, else fallback to default price
      const serviceDetail = serviceOptions.find(s => s.id === item.type);
      const price = item.amount !== undefined ? Number(item.amount) : (serviceDetail ? serviceDetail.price : 0);
      return sum + price;
    }, 0);
    return servicesTotal + parseInt(otherCharges || 0);
  };

  const serviceItems = service.services || [{ type: service.serviceType || 'basic', amount: service.amount || 0 }];
  const totalAmount = service.totalAmount || calculateTotal(serviceItems, service.otherCharges);

  // Loyalty info
  const customerServices = services.filter(s => 
    s.carNumber && service.carNumber && 
    s.carNumber.toLowerCase() === service.carNumber.toLowerCase()
  );
  const serviceCount = customerServices.length;
  const totalSpent = customerServices.reduce((sum, s) => {
    const items = s.services || [{ type: s.serviceType || 'basic', amount: s.amount || 0 }];
    return sum + (s.totalAmount || calculateTotal(items, s.otherCharges || 0));
  }, 0);

  const getLoyaltyLevel = (count) => {
    if (count >= 10) return 'Gold';
    if (count >= 5) return 'Silver';
    if (count >= 3) return 'Bronze';
    return 'New Customer';
  };
  const loyaltyLevel = getLoyaltyLevel(serviceCount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo and business info */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {/* <Image src="https://fourwincar.vercel.app/logo.png" style={styles.logo} /> */}
          </View>
          <Text style={styles.title}>FOURWIN CAR SPA</Text>
          <Text style={styles.subtitle}>PREMIUM CAR CARE SERVICES</Text>
          <Text style={styles.address}>
            Girl Nagar, Old R.T.O. Road, Akola 444001 {"\n"}
            Contact: +91 9175757895 | Email: info@fourwincarspa.com
          </Text>
        </View>

        {/* Invoice info */}
        <View style={styles.invoiceInfo}>
          <View>
            <Text style={styles.infoLabel}>
              Bill No: {
                (services
                  .sort((a, b) => new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date))
                  .findIndex(s => s.id === service.id) + 1 || '______')}
            </Text>
            <Text>Date: {formattedDate}</Text>
            <Text>Time: {formattedTime}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>Customer Details</Text>
            <Text>{service.name || '______'}</Text>
            <Text>Phone: {service.phone || '______'}</Text>
            {serviceCount > 1 && (
              <Text>
                Loyalty: {loyaltyLevel} 
                <Text style={styles.loyaltyBadge}>{serviceCount} visits</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Vehicle info */}
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleInfoRow}>
            <Text style={styles.infoLabel}>Vehicle Number:</Text>
            <Text>{service.carNumber || '______'}</Text>
          </View>
          <View style={styles.vehicleInfoRow}>
            <Text style={styles.infoLabel}>Vehicle Name:</Text>
            <Text>{service.carName || '______'}</Text>
          </View>
          <View style={styles.vehicleInfoRow}>
            <Text style={styles.infoLabel}>Vehicle Type:</Text>
            <View style={styles.seatType}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.checkbox, service.seater === '5' && { backgroundColor: '#000' }]} />
                <Text>5 Seater</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.checkbox, service.seater === '7' && { backgroundColor: '#000' }]} />
                <Text>7 Seater</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colSno, { color: '#FFF' }]}>S No.</Text>
            <Text style={[styles.colParticulars, { color: '#FFF' }]}>Service Particulars</Text>
            <Text style={[styles.colRate, { color: '#FFF' }]}>Rate (₹)</Text>
            <Text style={[styles.colAmount, { color: '#FFF' }]}>Amount (₹)</Text>
          </View>
          {serviceItems.map((item, index) => {
            const serviceDetail = serviceOptions.find(s => s.id === item.type);
            const name = serviceDetail ? serviceDetail.name : (item.name || 'Custom Service');
            const price = item.amount !== undefined ? Number(item.amount) : (serviceDetail ? serviceDetail.price : 0);
            return (
              <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlternate]}>
                <Text style={styles.colSno}>{index + 1}.</Text>
                <Text style={styles.colParticulars}>{name}</Text>
                <Text style={styles.colRate}>{price.toLocaleString('en-IN')}</Text>
                <Text style={styles.colAmount}>{price.toLocaleString('en-IN')}</Text>
              </View>
            );
          })}
          {(service.otherCharges && service.otherCharges > 0) && (
            <View style={[styles.tableRow, styles.tableRowAlternate]}>
              <Text style={styles.colSno}></Text>
              <Text style={styles.colParticulars}>Other Charges</Text>
              <Text style={styles.colRate}></Text>
              <Text style={styles.colAmount}>{service.otherCharges.toLocaleString('en-IN')}</Text>
            </View>
          )}
        </View>

        {/* Total amount */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sub Total:</Text>
              <Text>{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text>0.00</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax (if any):</Text>
              <Text>0.00</Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 5 }]}>
              <Text style={[styles.totalLabel, styles.totalValue]}>Grand Total:</Text>
              <Text style={[styles.totalValue, styles.grandTotal]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Notes section */}
        {service.notes && (
          <View style={styles.notesSection}>
            <Text style={[styles.infoLabel, { marginBottom: 3 }]}>Special Notes:</Text>
            <Text>{service.notes}</Text>
          </View>
        )}

        {/* Loyalty information */}
        {serviceCount > 1 && (
          <View style={[styles.notesSection, { marginTop: 10 }]}>
            <Text style={[styles.infoLabel, { marginBottom: 3 }]}>Loyalty Information:</Text>
            <Text>Total Services: {serviceCount}</Text>
            <Text>Total Amount Spent: ₹{totalSpent.toLocaleString('en-IN')}</Text>
            <Text>Loyalty Status: {loyaltyLevel} Customer</Text>
          </View>
        )}

        {/* Footer messages */}
        <View style={styles.footer}>
          <Text>- Thank you for choosing FOURWIN CAR SPA. Please visit us again!</Text>
          <Text>- Please drive carefully and have a safe journey.</Text>
          <Text>- For any queries, contact us at +91 9175757895</Text>
        </View>

        {/* Signature */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
          <View>
            <Text style={{ fontSize: 10, color: '#777', marginBottom: 5 }}>
              Payment Method: {service.paymentMode ? 
                service.paymentMode.charAt(0).toUpperCase() + service.paymentMode.slice(1) : '______'}
            </Text>
            <Text style={{ fontSize: 10, color: '#777' }}>Received By: ______</Text>
          </View>
          <View style={styles.signature}>
            <Text>Authorized Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const InvoiceDownloadLink = ({ service, allServices = [] }) => (
  <PDFDownloadLink
    document={<InvoiceComponent service={service} services={allServices} />}
    fileName={`Invoice_${service.carNumber || 'unknown'}_${service.id || Date.now()}.pdf`}
  >
    {({ loading }) => (loading ? 'Generating PDF...' : 'Download Invoice')}
  </PDFDownloadLink>
);

export { InvoiceComponent, InvoiceDownloadLink };