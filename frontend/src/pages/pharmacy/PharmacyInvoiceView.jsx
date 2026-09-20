import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import pharmacyService from '../../services/pharmacyService';
import toast from 'react-hot-toast';
import {
  Printer,
  ArrowLeft,
  Pill,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  User,
  Stethoscope,
  Receipt,
  FileText,
} from 'lucide-react';

const PharmacyInvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const data = await pharmacyService.getBillById(id);
      if (data.success) {
        setBill(data.bill);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pharmacy tax invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Convert numbers to currency format
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Helper to convert number to words (simple for Indian numbering)
  const numberToWords = (num) => {
    const a = [
      '',
      'One ',
      'Two ',
      'Three ',
      'Four ',
      'Five ',
      'Six ',
      'Seven ',
      'Eight ',
      'Nine ',
      'Ten ',
      'Eleven ',
      'Twelve ',
      'Thirteen ',
      'Fourteen ',
      'Fifteen ',
      'Sixteen ',
      'Seventeen ',
      'Eighteen ',
      'Nineteen ',
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
      if ((n = n.toString()).length > 9) return 'overflow';
      const nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!nArray) return '';
      let str = '';
      str += nArray[1] != 0 ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'Crore ' : '';
      str += nArray[2] != 0 ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'Lakh ' : '';
      str += nArray[3] != 0 ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'Thousand ' : '';
      str += nArray[4] != 0 ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'Hundred ' : '';
      str +=
        nArray[5] != 0
          ? (str != '' ? 'and ' : '') +
            (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]])
          : '';
      return str;
    };

    const whole = Math.floor(num);
    const fraction = Math.round((num - whole) * 100);
    let res = inWords(whole) + 'Rupees';
    if (fraction > 0) {
      res += ' and ' + inWords(fraction) + 'Paise';
    }
    return res + ' Only';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Generating Pharmacy Tax Invoice...
          </p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4 max-w-sm p-6 bg-white dark:bg-slate-800 rounded-xl shadow">
          <p className="text-rose-500 font-semibold text-sm">Invoice record not found.</p>
          <button
            onClick={() => navigate('/pharmacy')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold"
          >
            Return to Pharmacy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => navigate('/pharmacy')}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pharmacy Dashboard
        </button>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow transition"
          >
            <Printer className="w-4 h-4" /> Print Pharmacy Tax Invoice
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE INVOICE SHEET (NABH Standard) */}
      {/* ========================================================================= */}
      <div
        id="pharmacy-tax-invoice"
        className="max-w-4xl mx-auto bg-white text-slate-900 p-5 sm:p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none"
      >
        {/* Header with Hospital Brand & License Info */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-700 text-white rounded-xl flex items-center justify-center font-bold text-2xl print:border print:border-slate-800">
                +
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  CarePoint Multi-Speciality Hospital
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  Department of Central Pharmacy & Clinical Dispensary
                </p>
                <p className="text-[11px] text-slate-500">
                  42 Health Avenue, Medical Enclave, Metro City - 110001
                </p>
                <p className="text-[10px] text-slate-500">
                  Ph: +91 11 2345 6789 • 24x7 Emergency Pharmacy Helpline: 1800-CARE-RX
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-teal-50 border border-teal-600 px-3 py-1 rounded text-teal-800 font-extrabold text-xs uppercase tracking-wider">
                Retail / Tax Invoice
              </div>
              <div className="mt-2 text-[11px] font-mono text-slate-600 space-y-0.5">
                <div><strong>GSTIN:</strong> 07AAAAA0000A1Z5</div>
                <div><strong>Drug Lic:</strong> DL-20B-10992 / 21B-10993</div>
                <div><strong>NABH Accr:</strong> NABH-HOSP-2024-918</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Metadata & Patient Demographics Grid */}
        <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-200 text-xs">
          {/* Patient Details */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Billed To (Patient / Customer):
            </div>
            <div className="text-sm font-bold text-slate-900">
              {bill.patientName || 'Walk-in Customer'}
            </div>
            {bill.patientPhone && (
              <div className="text-slate-600">
                Contact: <span className="font-mono">{bill.patientPhone}</span>
              </div>
            )}
            {bill.prescriptionNumber && (
              <div className="text-slate-700">
                Rx Reference: <strong className="font-mono text-teal-700">{bill.prescriptionNumber}</strong>
              </div>
            )}
            <div className="text-slate-700">
              Prescribing Doctor: <strong>{bill.doctorName || 'Consulting Physician'}</strong>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="space-y-1.5 text-right font-mono">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Invoice Credentials:
            </div>
            <div className="text-base font-black text-teal-800">
              #{bill.billNumber}
            </div>
            <div className="text-slate-600">
              Dispensed Date: <strong>{formatDateTime(bill.dispensedAt)}</strong>
            </div>
            <div className="text-slate-600">
              Billing Counter: <strong>{bill.billType}</strong>
            </div>
            <div className="text-slate-600">
              Payment Status:{' '}
              <span className="text-emerald-700 font-bold uppercase">
                {bill.paymentStatus} via {bill.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Medicine Table */}
        <div className="mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase text-slate-700">
                <th className="py-2 px-1 text-center w-8">#</th>
                <th className="py-2 px-3">Medicine Formulation & Strength</th>
                <th className="py-2 px-2 font-mono">Batch #</th>
                <th className="py-2 px-2">Expiry</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-2 text-right">MRP (₹)</th>
                <th className="py-2 px-2 text-right">GST %</th>
                <th className="py-2 px-2 text-right">Disc %</th>
                <th className="py-2 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(bill.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-1 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {item.medicineName}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-slate-700">
                    {item.batchNumber}
                  </td>
                  <td className="py-2.5 px-2 text-slate-600">
                    {formatDate(item.expiryDate)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono">
                    ₹{item.unitPrice?.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-500 font-mono">
                    {item.taxPercent || 12}%
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-500 font-mono">
                    {item.discountPercent || 0}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                    ₹{item.itemTotal?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation & Tax Summary */}
        <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-xs">
          {/* Amount In Words & Notes */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Amount In Words:
              </span>
              <p className="font-bold text-slate-800 italic mt-0.5">
                {numberToWords(bill.netAmount)}
              </p>
            </div>

            <div className="text-[10px] text-slate-500 space-y-0.5 pt-2">
              <p><strong>Pharmacy Policy:</strong></p>
              <p>1. Check batch number and expiry before leaving the counter.</p>
              <p>2. Scheduled H/H1 drugs are dispensed only against valid medical prescription.</p>
              <p>3. Store medicines in cool, dry place away from direct sunlight.</p>
            </div>
          </div>

          {/* Subtotal, Tax & Net Breakdown */}
          <div className="space-y-1.5 font-mono text-right">
            <div className="flex justify-between">
              <span className="text-slate-500">Items Gross Subtotal:</span>
              <span className="font-semibold text-slate-800">₹{bill.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CGST (50% of GST):</span>
              <span className="font-semibold text-slate-800">₹{(bill.totalTax / 2)?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SGST (50% of GST):</span>
              <span className="font-semibold text-slate-800">₹{(bill.totalTax / 2)?.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Special Discount:</span>
                <span>-₹{bill.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
              <span>Net Tax Payable:</span>
              <span className="text-base text-teal-800">₹{bill.netAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer & Pharmacist Signatory Block */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
          <div className="text-[10px] text-slate-400">
            <div>Printed Electronically on: {new Date().toLocaleString('en-IN')}</div>
            <div>Computer Generated Pharmacy Invoice. No signature stamp required.</div>
          </div>

          <div className="text-center font-mono">
            <div className="text-xs font-bold text-slate-800">
              {bill.billedBy?.name || 'Alex Chen, RPh'}
            </div>
            <div className="text-[10px] text-slate-500">Registered Pharmacist (Reg # RPH-2018-991)</div>
            <div className="text-[10px] font-bold text-teal-800 mt-1 uppercase">
              [Authorized Dispensing Officer]
            </div>
          </div>
        </div>
      </div>

      {/* Print Specific Media Styles */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, header, footer, button, .print\\:hidden {
            display: none !important;
          }
          #pharmacy-tax-invoice {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
};

export default PharmacyInvoiceView;
