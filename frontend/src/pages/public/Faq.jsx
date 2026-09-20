import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Phone,
  Calendar,
  CreditCard,
  ShieldCheck,
  Pill,
  FlaskConical,
  HeartPulse,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

const Faq = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openAccordionId, setOpenAccordionId] = useState(1);

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryDept, setInquiryDept] = useState('general');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories list
  const categories = [
    { id: 'all', label: 'All Topics', icon: HelpCircle },
    { id: 'opd', label: 'Appointments & OPD', icon: Calendar },
    { id: 'billing', label: 'Billing & Cashless TPA', icon: CreditCard },
    { id: 'ipd', label: 'Inpatient Wards (IPD)', icon: Clock },
    { id: 'pharmacy', label: 'Pharmacy & Prescriptions', icon: Pill },
    { id: 'lab', label: 'Diagnostics & Pathology', icon: FlaskConical },
    { id: 'emergency', label: '24/7 Emergency & Casualty', icon: HeartPulse },
  ];

  // Comprehensive Hospital FAQ Database
  const faqs = [
    {
      id: 1,
      category: 'opd',
      categoryLabel: 'Appointments & OPD',
      question: 'How do I book an outpatient (OPD) consultation with a specialist?',
      answer:
        'You can book an appointment online anytime through our portal by clicking "Book Appointment", selecting your desired department (e.g. Cardiology, Neurology, Orthopedics) and doctor, and choosing an available 30-minute time slot. Alternatively, you can call our central appointment desk at +91 1800-456-7890 (Ext 1) or walk into the OPD Reception between 08:00 AM and 08:00 PM.',
      tags: ['Appointment', 'Doctor', 'OPD', 'Booking'],
    },
    {
      id: 2,
      category: 'opd',
      categoryLabel: 'Appointments & OPD',
      question: 'How does the Live OPD Token Desk and triage queue operate?',
      answer:
        'Upon arriving at MedCare Hospital, present your booking confirmation or register as a walk-in at the reception counter. You will receive an automated sequential OPD token number (e.g., Token #101). The live display monitors across the OPD waiting lounge and the online Live Queue page track your exact position in real time. Doctors call patients sequentially to minimize waiting time.',
      tags: ['Token', 'Queue', 'Triage', 'Live Display'],
    },
    {
      id: 3,
      category: 'billing',
      categoryLabel: 'Billing & Cashless TPA',
      question: 'What health insurance policies and Third-Party Administrators (TPA) are accepted for cashless claims?',
      answer:
        'MedCare Hospital is empaneled with over 45+ leading government and private health insurance providers, including Star Health, HDFC ERGO, ICICI Lombard, Medi Assist, Paramount TPA, Vidal Health, and MDIndia. Cashless pre-authorization requires your health card, government photo ID, and doctor’s admission advice. Our dedicated 24x7 TPA Helpdesk initiates cashless approvals within 60 minutes.',
      tags: ['Insurance', 'TPA', 'Cashless', 'Claims', 'Pre-auth'],
    },
    {
      id: 4,
      category: 'billing',
      categoryLabel: 'Billing & Cashless TPA',
      question: 'Can I receive an estimated cost breakdown before elective surgery or inpatient admission?',
      answer:
        'Yes. Our Patient Billing & Financial Counseling Desk provides itemized cost estimates for all elective surgeries (e.g., Knee Replacement, Angioplasty, Laparoscopy, Delivery packages). The estimate includes surgeon fees, anesthesia, operating theatre charges, standard consumable packages, and room rent per day.',
      tags: ['Cost Estimate', 'Billing', 'Package', 'Surgery'],
    },
    {
      id: 5,
      category: 'ipd',
      categoryLabel: 'Inpatient Wards (IPD)',
      question: 'What documents are required during inpatient (IPD) admission?',
      answer:
        'Please bring: 1) Doctor’s IPD Admission Slip with primary diagnosis, 2) Patient Government Photo ID (Aadhaar / Passport / Voter ID), 3) Health Insurance TPA Card & Policy Copy (for cashless patients), and 4) Past medical records, discharge summaries, and current medication strips. An attendant pass is issued upon admission.',
      tags: ['Admission', 'IPD', 'Documents', 'Attendant Pass'],
    },
    {
      id: 6,
      category: 'ipd',
      categoryLabel: 'Inpatient Wards (IPD)',
      question: 'What types of inpatient room accommodations are available?',
      answer:
        'We offer diverse accommodation categories to suit all preferences: General Multi-Bedded Wards, Semi-Private Twin Sharing, Single Private AC Rooms, Executive Deluxe Rooms, and Luxury Presidential Suites. All rooms are equipped with nurse-call buttons, central oxygen/suction outlets, and daily sanitization protocols.',
      tags: ['Rooms', 'Bed Matrix', 'Deluxe', 'ICU', 'Wards'],
    },
    {
      id: 7,
      category: 'emergency',
      categoryLabel: '24/7 Emergency & Casualty',
      question: 'What should I do in a life-threatening medical emergency or accident?',
      answer:
        'Immediately call our 24/7 Trauma Emergency Helpline at +91 1800-456-7890 or dial 108/112 for rapid ambulance dispatch. Our Level-1 Trauma Centre is staffed around the clock with emergency physicians, trauma surgeons, and anesthesiologists. Patients are triaged instantly using the Emergency Severity Index (ESI) without upfront billing delays.',
      tags: ['Emergency', 'Trauma', 'Ambulance', '108', 'Casualty'],
    },
    {
      id: 8,
      category: 'pharmacy',
      categoryLabel: 'Pharmacy & Prescriptions',
      question: 'How does the 24x7 Central Pharmacy ensure genuine and unexpired medications?',
      answer:
        'Our pharmacy operates under an automated First-Expiry, First-Out (FEFO) digital inventory system. Every medicine batch is logged with its manufacturer batch number, manufacturing date, and expiry date. Batches expiring within 60 days are systematically flagged and blocked from dispensing, guaranteeing 100% genuine and safe medications with GST-compliant itemized invoices.',
      tags: ['Pharmacy', 'FEFO', 'Batch Expiry', 'Prescription', 'Medicine'],
    },
    {
      id: 9,
      category: 'pharmacy',
      categoryLabel: 'Pharmacy & Prescriptions',
      question: 'Can I purchase prescription medicines prescribed by an external doctor?',
      answer:
        'Yes. Our 24/7 Central Pharmacy counter dispenses medications for both hospital-registered patients and external prescriptions, provided the prescription is written on a registered medical practitioner’s letterhead with valid registration number, date, patient details, and clinician signature.',
      tags: ['External Rx', 'Pharmacy', 'Dispensing', 'Counter'],
    },
    {
      id: 10,
      category: 'lab',
      categoryLabel: 'Diagnostics & Pathology',
      question: 'How quickly are diagnostic laboratory and radiology results delivered?',
      answer:
        'Routine biochemistry, hematology, and urine tests (e.g., CBC, LFT, KFT, Blood Sugar) are processed within 2 to 4 hours. Specialized hormone assays, cultures, and biopsies require 24 to 72 hours. X-Ray and Ultrasound reports are available within 1 hour, while CT and MRI studies are reported by senior consultant radiologists within 3 to 6 hours. All reports are immediately synced to your online EMR Portal.',
      tags: ['Lab', 'Blood Test', 'Pathology', 'Turnaround', 'EMR'],
    },
    {
      id: 11,
      category: 'lab',
      categoryLabel: 'Diagnostics & Pathology',
      question: 'Do I need to fast before laboratory blood investigations?',
      answer:
        'Fasting (typically 8 to 12 hours with only water allowed) is mandatory for tests such as Fasting Blood Sugar (FBS), Lipid Profile, and Fasting Insulin. Routine tests like Complete Blood Count (CBC), Kidney Function, Thyroid Profile, and Glycated Hemoglobin (HbA1c) do not require fasting unless specifically advised by your doctor.',
      tags: ['Fasting', 'Blood Sample', 'Lipid Profile', 'Sugar'],
    },
    {
      id: 12,
      category: 'ipd',
      categoryLabel: 'Inpatient Wards (IPD)',
      question: 'What are the hospital visiting hours for family members and attendants?',
      answer:
        'General & Private Ward visiting hours are: Morning: 11:00 AM – 01:00 PM and Evening: 05:00 PM – 07:00 PM. In Intensive Care Units (ICU / NICU / PICU), visitation is restricted to 1 immediate attendant between 04:00 PM and 05:00 PM to maintain strict sterility and prevent cross-infection.',
      tags: ['Visiting Hours', 'Attendant', 'ICU', 'Wards'],
    },
  ];

  // Filtered FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const toggleAccordion = (id) => {
    setOpenAccordionId(openAccordionId === id ? null : id);
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryMsg.trim()) {
      toast.error('Please enter your name and question.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Inquiry submitted! Our patient care team will respond within 4 hours.');
      setInquiryName('');
      setInquiryEmail('');
      setInquiryMsg('');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER WITH LIVE SEARCH */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            Patient Helpdesk & Knowledge Base
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4 max-w-3xl mx-auto">
            Frequently Asked Questions
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
            Find immediate answers regarding outpatient appointments, cashless insurance pre-authorizations, inpatient admission procedures, and laboratory turnaround times.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics: e.g. cashless insurance, blood test fasting, ICU visiting hours..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-400 focus:bg-white/20 transition-all shadow-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-xs text-slate-400 hover:text-white bg-white/10 px-2 py-1 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-[11px] text-sky-200 text-left mt-2 ml-2">
                Showing results for &quot;{searchQuery}&quot; ({filteredFaqs.length} questions found)
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. QUICK SELF-SERVICE CARDS */}
      {/* ========================================================================= */}
      <section className="-mt-8 relative z-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">24/7 Emergency Assistance</h3>
              <p className="text-[11px] text-slate-500">Trauma resuscitation & ambulance dispatch</p>
              <a href="tel:+9118004567890" className="text-xs font-mono font-bold text-rose-600 hover:underline mt-0.5 inline-block">
                +91 1800-456-7890 (Dial 108)
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Live OPD Queue Status</h3>
              <p className="text-[11px] text-slate-500">Monitor your consultation token number</p>
              <Link to="/opd/queue" className="text-xs font-bold text-sky-600 hover:underline mt-0.5 inline-block">
                Check Token Desk &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Digital Health Records (EMR)</h3>
              <p className="text-[11px] text-slate-500">Download verified lab reports & prescriptions</p>
              <Link to="/emr" className="text-xs font-bold text-emerald-600 hover:underline mt-0.5 inline-block">
                View EMR Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CATEGORY SELECTOR TABS */}
      {/* ========================================================================= */}
      <section className="mt-12 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hms-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAIN ACCORDION & ASIDE FORM GRID */}
      {/* ========================================================================= */}
      <section className="mt-8 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Accordions List (8 cols) */}
          <div className="lg:col-span-8 space-y-3.5">
            {filteredFaqs.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No questions matched your search query</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try searching with different keywords or browse all categories. You can also submit your question directly using the form.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Reset Search & Filters
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openAccordionId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      isOpen
                        ? 'border-sky-500 shadow-md ring-1 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          {faq.categoryLabel}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                      <div
                        className={`p-1.5 rounded-full shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 bg-slate-50/50">
                        <p>{faq.answer}</p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <span className="text-[10px] text-slate-400 font-semibold">Related:</span>
                          {faq.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery(tag);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-sky-600 cursor-pointer transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Aside: "Still Have Questions?" Form (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Still Have Questions?</h3>
                  <p className="text-[11px] text-slate-500">Ask our Patient Care Helpdesk</p>
                </div>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Email or Phone *</label>
                  <input
                    type="text"
                    required
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="john@example.com / +91 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={inquiryDept}
                    onChange={(e) => setInquiryDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="opd">Outpatient (OPD) Scheduling</option>
                    <option value="insurance">Cashless Insurance & TPA</option>
                    <option value="ipd">Inpatient & Bed Allocation</option>
                    <option value="lab">Diagnostic Labs & Reports</option>
                    <option value="pharmacy">Pharmacy & Medication</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Your Question or Concern *</label>
                  <textarea
                    rows={3}
                    required
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    placeholder="Describe your inquiry in detail..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Question'}</span>
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Response within 4 operating hours
                </p>
                <p className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  Patient privacy protected under HIPAA standards
                </p>
              </div>
            </div>

            {/* Direct Phone Assistance Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-2 py-0.5 rounded">
                Direct Phone Desk
              </span>
              <h4 className="text-sm font-bold text-white">Prefer to talk with our team?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Our front desk coordinators are on duty Mon – Sat, 08:00 AM to 08:00 PM.
              </p>
              <div className="pt-1">
                <a
                  href="tel:+9118004567890"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  +91 1800-456-7890
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Faq;
