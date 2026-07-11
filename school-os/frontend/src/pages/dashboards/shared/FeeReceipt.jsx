import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Printer, Download, ArrowLeft, CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";

export default function FeeReceipt() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  // Mock data for the receipt
  const receiptData = {
    receiptNo: id || "RCP-2026-8942",
    date: new Date().toLocaleDateString("en-IN"),
    academicYear: "2026-27",
    studentName: "Aarav Sharma",
    classSection: "X - A",
    admissionNo: "ADM230012",
    parentName: "Rajesh Sharma",
    paymentMethod: "UPI",
    transactionId: "TXN983420184",
    fees: [
      { id: 1, head: "Tuition Fee (Quarter 1)", amount: 15000 },
      { id: 2, head: "Transport Fee", amount: 4500 },
      { id: 3, head: "Laboratory Fee", amount: 2000 },
      { id: 4, head: "Library Fee", amount: 1000 },
      { id: 5, head: "Sports & Extracurricular", amount: 1500 },
    ]
  };

  const total = receiptData.fees.reduce((acc, curr) => acc + curr.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardShell title="Fee Receipt" subtitle="View and print student fee receipts">
      <div className="max-w-4xl mx-auto pb-12">
        {/* Controls - Hidden in print */}
        <div className="no-print flex items-center justify-between mb-6">
          <Link
            to="/dashboard/office"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition bg-white px-4 py-2 rounded-xl shadow-sm"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition">
              <Download size={16} /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md transition"
            >
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>

        {/* Printable Receipt Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="print-receipt bg-white rounded-2xl shadow-xl overflow-hidden relative"
          ref={printRef}
        >
          {/* PAID Watermark */}
          <div className="watermark opacity-10">PAID</div>

          <div className="p-10 border-4 border-double border-indigo-100 m-4 rounded-xl relative z-10 bg-white/80">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-indigo-100 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center p-2">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-indigo-900 tracking-tight">St. S.N. Public School</h1>
                  <p className="text-gray-500 text-sm mt-1">Pindra, Varanasi — 221209</p>
                  <p className="text-gray-500 text-sm">Ph: +91 98765 43210 | CBSE Affiliation: 2130000</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block px-4 py-2 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200 mb-2">
                  OFFICIAL RECEIPT
                </div>
                <p className="text-sm font-semibold text-gray-700">Receipt No: <span className="text-indigo-600">{receiptData.receiptNo}</span></p>
                <p className="text-sm text-gray-600">Date: {receiptData.date}</p>
                <p className="text-sm text-gray-600">Session: {receiptData.academicYear}</p>
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-6 bg-indigo-50/50 p-6 rounded-xl border border-indigo-50 mb-8">
              <div>
                <p className="text-sm text-gray-500 mb-1">Student Name</p>
                <p className="font-semibold text-gray-900">{receiptData.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Admission No</p>
                <p className="font-semibold text-gray-900">{receiptData.admissionNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Class & Section</p>
                <p className="font-semibold text-gray-900">{receiptData.classSection}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Parent's Name</p>
                <p className="font-semibold text-gray-900">{receiptData.parentName}</p>
              </div>
            </div>

            {/* Fee Particulars */}
            <div className="mb-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="py-3 px-4 rounded-tl-xl w-16">S.No</th>
                    <th className="py-3 px-4">Fee Particulars</th>
                    <th className="py-3 px-4 rounded-tr-xl text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.fees.map((fee, index) => (
                    <tr key={fee.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{fee.head}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        {fee.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-indigo-50 font-bold text-indigo-900 text-lg border-t-2 border-indigo-200">
                    <td colSpan="2" className="py-4 px-4 text-right rounded-bl-xl">Total Amount:</td>
                    <td className="py-4 px-4 text-right rounded-br-xl">₹ {total.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Details & Signatures */}
            <div className="grid grid-cols-2 gap-12 mt-12 items-end">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Status: <span className="text-green-600">Successful</span></span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Method: <span className="font-medium text-gray-900">{receiptData.paymentMethod}</span></p>
                  <p className="text-sm text-gray-600">Transaction ID: <span className="font-medium text-gray-900">{receiptData.transactionId}</span></p>
                </div>
              </div>

              <div className="flex justify-end gap-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-2 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={`https://snpublicschool.edu.in/verify/receipt/${receiptData.receiptNo}`}
                      size={72}
                      level="Q"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">Scan to Verify</p>
                </div>
                <div>
                  <div className="w-40 border-b-2 border-gray-400 mb-2"></div>
                  <p className="text-sm font-semibold text-gray-700">Authorized Signatory</p>
                  <p className="text-[10px] text-gray-500">Accountant / Cashier</p>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
              <p>This is a computer generated receipt and does not require a physical signature.</p>
              <p>Fees once paid are not refundable. Please keep this receipt for future reference.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
