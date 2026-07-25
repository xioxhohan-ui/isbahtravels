import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Booking } from "@/lib/types/database";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#0F172A",
    borderBottomStyle: "solid",
    paddingBottom: 16,
    marginBottom: 20,
  },
  logo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
  },
  logoAccent: {
    color: "#047857",
  },
  tagline: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metaCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "solid",
    borderRadius: 8,
    padding: 12,
  },
  metaTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0F172A",
  },
  metaSubText: {
    fontSize: 9,
    color: "#475569",
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCol: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    borderBottomStyle: "solid",
    padding: 10,
  },
  tableColDescription: {
    width: "55%",
    fontSize: 10,
    fontWeight: "bold",
  },
  tableColDate: {
    width: "25%",
    fontSize: 10,
    color: "#475569",
    textAlign: "center",
  },
  tableColAmount: {
    width: "20%",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
  },
  totalBox: {
    backgroundColor: "#0F172A",
    color: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 9,
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34D399",
    marginTop: 2,
  },
  totalMethod: {
    fontSize: 9,
    color: "#CBD5E1",
    textAlign: "right",
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    borderTopStyle: "solid",
    paddingTop: 14,
    textAlign: "center",
  },
  footerTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
  },
  footerSub: {
    fontSize: 8,
    color: "#64748B",
    marginTop: 2,
  },
});

interface ReceiptDocumentProps {
  booking: Booking;
}

export function ReceiptDocument({ booking }: ReceiptDocumentProps) {
  const customerName = booking.details?.customer_name || booking.details?.lead_passenger || "Customer";
  const customerEmail = booking.details?.customer_email || booking.details?.email || "customer@isbahtravels.com";
  const customerPhone = booking.details?.customer_phone || booking.details?.phone || "+880 1700-123456";
  const itemTitle = booking.details?.title || booking.details?.airline || `${booking.booking_type.toUpperCase()} Booking`;
  const travelDate = booking.details?.travel_date || booking.details?.departure_date || new Date(booking.created_at).toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              ISBAH <Text style={styles.logoAccent}>TRAVELS</Text>
            </Text>
            <Text style={styles.tagline}>Official Payment Invoice & E-Ticket</Text>
          </View>
          <View>
            <Text style={styles.badge}>PAID • SSLCOMMERZ VERIFIED</Text>
          </View>
        </View>

        {/* Customer & Booking Meta Section */}
        <View style={styles.metaSection}>
          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>Customer Information</Text>
            <Text style={styles.metaText}>{customerName}</Text>
            <Text style={styles.metaSubText}>Email: {customerEmail}</Text>
            <Text style={styles.metaSubText}>Phone: {customerPhone}</Text>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>Booking Information</Text>
            <Text style={styles.metaText}>Booking ID: #{booking.id}</Text>
            <Text style={styles.metaSubText}>Booking Type: {booking.booking_type.toUpperCase()}</Text>
            <Text style={styles.metaSubText}>
              Transaction ID: {booking.payment_details?.transaction_id || `ISBAH-SSL-${booking.id}`}
            </Text>
          </View>
        </View>

        {/* Price Breakdown Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: "55%" }]}>Item Description</Text>
            <Text style={[styles.tableHeaderCol, { width: "25%", textAlign: "center" }]}>Travel Date</Text>
            <Text style={[styles.tableHeaderCol, { width: "20%", textAlign: "right" }]}>Amount (BDT)</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableColDescription}>{itemTitle}</Text>
            <Text style={styles.tableColDate}>{travelDate}</Text>
            <Text style={styles.tableColAmount}>৳{booking.total_price.toLocaleString()}</Text>
          </View>
        </View>

        {/* Total Paid Box */}
        <View style={styles.totalBox}>
          <View>
            <Text style={styles.totalLabel}>Total Paid Amount</Text>
            <Text style={styles.totalAmount}>৳{booking.total_price.toLocaleString()} BDT</Text>
          </View>
          <View>
            <Text style={styles.totalMethod}>
              Payment Method: {booking.payment_details?.method || "SSLCommerz bKash/Card"}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Isbah Travels Ltd. • Civil Aviation Authorized Travel Agency</Text>
          <Text style={styles.footerSub}>
            Suite 402, Main Gulshan Avenue, Dhaka-1212, Bangladesh • Hotline: +880 1700-123456
          </Text>
        </View>
      </Page>
    </Document>
  );
}
