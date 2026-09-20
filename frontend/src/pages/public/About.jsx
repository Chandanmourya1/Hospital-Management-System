import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  ShieldCheck,
  HeartPulse,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Stethoscope,
  ArrowRight,
  Calendar,
  ChevronRight,
  Microscope,
  Bed,
  Pill,
  Target,
  Compass,
  Star,
  Quote,
  Layers,
  FileCheck,
} from 'lucide-react';

const About = () => {
  const [activeTab, setActiveTab] = useState('mission');
  const [activeTimelineYear, setActiveTimelineYear] = useState('2026');

  // Core Pillars / Tabbed Content
  const philosophyTabs = [
    {
      id: 'mission',
      label: 'Our Mission',
      icon: Target,
      tag: 'Clinical Purpose',
      title: 'Delivering Compassionate, Evidence-Based Tertiary Healthcare',
      content:
        'To pioneer transformative, ethical, and patient-centered clinical care by combining distinguished medical specialists, cutting-edge diagnostic technology, and digital healthcare delivery to heal with empathy and scientific rigor.',
      points: [
        'Zero-compromise patient safety and clinical audit protocols.',
        'Accessible, transparent, and dignified medical services for every citizen.',
        'Continuous research, clinical fellowship, and medical innovation.',
      ],
    },
    {
      id: 'vision',
      label: 'Our Vision',
      icon: Compass,
      tag: 'Future Horizon',
      title: 'The Preferred Epicentre of Tertiary Clinical Excellence & Innovation',
      content:
        'To be globally recognized as a premier academic medical institution and tertiary referral hub, setting international benchmarks in clinical outcomes, robotic precision medicine, and intelligent paperless hospital management.',
      points: [
        'Ranked among the top tertiary care hospitals in the nation.',
        '100% digital, paperless, and interoperable EHR clinical ecosystem.',
        'Benchmark clinical recovery and infection-control safety rates.',
      ],
    },
    {
      id: 'values',
      label: 'Core Values',
      icon: Star,
      tag: 'Guiding Principles',
      title: 'Integrity, Compassion, Innovation, and Respect',
      content:
        'Every medical intervention, nursing round, and administrative decision at MedCare Hospital is anchored in uncompromising institutional ethics, deep empathy, and collaborative multidisciplinary clinical care.',
      points: [
        'Integrity: Total medical transparency and ethical healthcare billing.',
        'Compassion: Treating patients and their families with warmth and dignity.',
        'Innovation: Adopting advanced biomedical engineering and clinical informatics.',
      ],
    },
    {
      id: 'safety',
      label: 'Patient Safety Charter',
      icon: ShieldCheck,
      tag: 'NABH Directive',
      title: 'Rigorous Quality Assurance & Zero-Harm Patient Commitment',
      content:
        'Our clinical governance protocols align with international healthcare accreditations (NABH & JCI), enforcing strict infection prevention, closed-loop medication administration, and continuous clinician peer reviews.',
      points: [
        'NABH 5th Edition and NABL accredited diagnostic operations.',
        'Standardized HEPA filtration & laminar flow surgical suites.',
        'Strict barcode-assisted FEFO medication safety and bio-waste protocols.',
      ],
    },
  ];

  // Milestone History
  const milestones = [
    {
      year: '2005',
      title: 'Hospital Inception & Foundation',
      desc: 'Founded as a 120-bed multi-speciality hospital with premier emergency and surgical care facilities in the capital district.',
      badge: 'Foundation',
    },
    {
      year: '2012',
      title: 'NABH & NABL Accreditations',
      desc: 'Awarded prestigious National Accreditation Board for Hospitals (NABH) and NABL certifications for exemplary clinical governance and pathology standards.',
      badge: 'Quality Milestone',
    },
    {
      year: '2018',
      title: 'Tertiary Cardiac & Neuro Tower',
      desc: 'Expanded to 350 beds with the commissioning of state-of-the-art Digital Flat-Panel Cardiac Cath Labs and Dedicated Neuro-ICU suites.',
      badge: 'Expansion',
    },
    {
      year: '2022',
      title: 'Robotic Surgery & Advanced Oncology',
      desc: 'Introduced 4th-generation robotic surgical systems, PET-CT diagnostic scanners, and a comprehensive daycare oncology infusion unit.',
      badge: 'Innovation',
    },
    {
      year: '2026',
      title: 'Paperless Smart HMIS 2.0 Deployment',
      desc: 'Achieved complete clinical digitization: 500+ beds, 120+ medical specialists, real-time FEFO pharmacy dispensing, and an interconnected patient EMR portal.',
      badge: 'Digital Era',
    },
  ];

  // Clinical Leadership
  const leadership = [
    {
      name: 'Dr. Arthur Sterling, MD, FRCP',
      role: 'Medical Superintendent & Chief of Medicine',
      dept: 'Internal & Critical Care Medicine',
      experience: '28+ Years Experience',
      education: 'MD (Harvard), FRCP (London)',
      quote: 'Exceptional clinical outcomes begin when cutting-edge diagnostic technology is steered by genuine empathy for human suffering.',
      imageBg: 'from-blue-600 to-sky-700',
    },
    {
      name: 'Dr. Elena Rostova, MS, MCh (AIIMS)',
      role: 'Head of Surgical Sciences & Robotic Oncology',
      dept: 'Surgical Oncology & Minimally Invasive Surgery',
      experience: '22+ Years Experience',
      education: 'MS (Surgery), MCh (Surgical Oncology)',
      quote: 'Precision robotics combined with rigorous infection control ensures rapid recovery and optimal patient safety.',
      imageBg: 'from-emerald-600 to-teal-700',
    },
    {
      name: 'Dr. Rajesh Nair, DM (Cardiology), FACC',
      role: 'Director of Interventional Cardiology & Cath Lab',
      dept: 'Cardiovascular Sciences',
      experience: '25+ Years Experience',
      education: 'DM (Cardiology), Fellowship (Cleveland Clinic)',
      quote: 'Every second counts in acute cardiac emergencies. Our 24/7 primary angioplasty team delivers door-to-balloon time under 45 minutes.',
      imageBg: 'from-rose-600 to-red-700',
    },
    {
      name: 'Dr. Sarah Jenkins, MD, FRCPath',
      role: 'Director of Laboratories & Clinical Pathology',
      dept: 'Laboratory Medicine & Blood Transfusion',
      experience: '19+ Years Experience',
      education: 'MD (Pathology), FRCPath (UK)',
      quote: 'Diagnostic accuracy is the cornerstone of clinical efficacy. Our NABL-certified labs verify critical panic values instantly.',
      imageBg: 'from-purple-600 to-indigo-700',
    },
    {
      name: 'Sister Mary Thomas, MSc (Nursing)',
      role: 'Chief Nursing Officer & Patient Safety Director',
      dept: 'Nursing Services & Infection Control',
      experience: '24+ Years Experience',
      education: 'MSc (Critical Care Nursing)',
      quote: 'Compassionate bedside care and meticulous patient advocacy form the heart of healing at MedCare.',
      imageBg: 'from-amber-600 to-yellow-700',
    },
    {
      name: 'David Vance, M.Pharm, MBA',
      role: 'Chief Pharmacist & Supply Chain Director',
      dept: 'Central Pharmacy & Clinical Pharmacology',
      experience: '18+ Years Experience',
      education: 'M.Pharm (Clinical), MBA (Hospital Admin)',
      quote: 'Zero medication error is our mandate. With FEFO automation, every formulation dispensed is strictly unexpired and genuine.',
      imageBg: 'from-cyan-600 to-blue-700',
    },
  ];

  // Infrastructure Metrics
  const stats = [
    { label: 'Hospital Beds Capacity', value: '500+', subtext: 'Tertiary, HDU & Private Suites', icon: Bed, color: 'text-sky-600' },
    { label: 'Specialist Clinicians', value: '120+', subtext: 'Board-Certified Consultants', icon: Stethoscope, color: 'text-emerald-600' },
    { label: 'Clinical Specialities', value: '35+', subtext: 'Super-Speciality Departments', icon: Activity, color: 'text-purple-600' },
    { label: 'Patient Recovery Rate', value: '99.4%', subtext: 'Audited Clinical Outcome Rate', icon: HeartPulse, color: 'text-rose-600' },
    { label: 'Modular Operation Theatres', value: '12', subtext: 'Laminar Flow & Robotic Suites', icon: Sparkles, color: 'text-amber-600' },
    { label: 'Annual Consultations', value: '150k+', subtext: 'Outpatients Treated Successfully', icon: Users, color: 'text-teal-600' },
  ];

  const currentTab = philosophyTabs.find((tab) => tab.id === activeTab) || philosophyTabs[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER WITH ACCREDITATION RIBBON */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24">
        {/* Glow Spheres */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 relative z-10">
          <div className="max-w-3xl space-y-4">
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200">
              <Award className="w-4 h-4 text-sky-400" />
              <span>NABH Accredited Tertiary Referral Hospital</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Centre for Clinical Excellence & Patient-Centered Care
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Established in 2005, MedCare Multi-Speciality Hospital represents the pinnacle of modern healthcare delivery. We unite world-renowned medical consultants, robotic surgical advancements, and an intelligent digital health information system to heal, protect, and empower human lives.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                to="/appointments/book"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
              >
                <Calendar className="w-4 h-4" /> Book Consultation
              </Link>
              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-colors"
              >
                <Stethoscope className="w-4 h-4 text-emerald-400" /> Medical Specialists
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
              >
                <span>Explore Services</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Accreditations Strip */}
        <div className="mt-14 border-y border-white/10 bg-white/5 backdrop-blur-md">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-white font-bold text-xs leading-none">NABH Certified</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">National Accreditation Board for Hospitals</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Microscope className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <p className="text-white font-bold text-xs leading-none">NABL Pathology</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">ISO 15189:2012 Certified Laboratories</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <p className="text-white font-bold text-xs leading-none">Level-1 Trauma</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">24x7 Resuscitation & Emergency Cath Lab</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <p className="text-white font-bold text-xs leading-none">EHR 2.0 & HIPAA</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Encrypted Paperless Electronic Records</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INFRASTRUCTURE & METRICS GRID */}
      {/* ========================================================================= */}
      <section className="-mt-8 relative z-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl bg-slate-50 border border-slate-100 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stat</span>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{stat.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{stat.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE PHILOSOPHY, MISSION & VALUES SWITCHER */}
      {/* ========================================================================= */}
      <section className="mt-16 sm:mt-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
            Institutional Foundations
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Guided by Uncompromising Clinical Ethics
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Every clinical intervention and patient journey is grounded in compassionate care, scientific precision, and strict compliance.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center flex-wrap gap-2 mb-8">
          {philosophyTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100">
                {currentTab.tag}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {currentTab.title}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {currentTab.content}
              </p>

              <div className="pt-2 space-y-2.5">
                {currentTab.points.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-sky-950 to-blue-950 rounded-2xl p-6 text-white shadow-inner flex flex-col justify-between h-full min-h-[220px]">
              <div>
                <div className="flex items-center justify-between text-sky-400 mb-3">
                  <Activity className="w-6 h-6" />
                  <span className="text-[10px] font-mono tracking-wider bg-white/10 px-2 py-0.5 rounded">
                    MEDCARE AUDIT STANDARD
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">Zero Harm & Clinical Governance</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Our mortality and surgical site infection (SSI) rates remain in the lowest 1st percentile nationwide, validated by independent healthcare quality auditors.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>NABH 5th Edition Certified</span>
                <span className="text-emerald-400 font-semibold">100% Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE MILESTONE TIMELINE */}
      {/* ========================================================================= */}
      <section className="mt-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Our Journey of Healing
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Two Decades of Healthcare Innovation
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Click any milestone year below to inspect key breakthroughs in our clinical history.
          </p>
        </div>

        {/* Year Pills */}
        <div className="flex justify-center flex-wrap gap-3 mb-8">
          {milestones.map((item) => {
            const isSelected = activeTimelineYear === item.year;
            return (
              <button
                key={item.year}
                onClick={() => setActiveTimelineYear(item.year)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {item.year}
              </button>
            );
          })}
        </div>

        {/* Timeline Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {milestones.map((item) => {
            const isSelected = activeTimelineYear === item.year;
            return (
              <div
                key={item.year}
                onClick={() => setActiveTimelineYear(item.year)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-sky-500 shadow-lg ring-2 ring-sky-500/20 scale-[1.02]'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-sky-600">{item.year}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Phase {item.year}</span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-600' : 'text-slate-300'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CLINICAL & EXECUTIVE LEADERSHIP TEAM */}
      {/* ========================================================================= */}
      <section className="mt-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Medical Governance
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Distinguished Clinical Leadership
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Led by internationally recognized clinicians, surgeons, and healthcare administrators.
            </p>
          </div>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 hover:underline shrink-0"
          >
            <span>View Full Roster of 120+ Specialists</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leadership.map((member, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Banner with Avatar Badge */}
                <div className={`h-24 bg-gradient-to-r ${member.imageBg} p-4 flex items-start justify-between text-white`}>
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-lg shadow-sm">
                    {member.name.replace('Dr. ', '').charAt(0)}
                  </div>
                  <span className="text-[11px] font-semibold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-white/90">
                    {member.experience}
                  </span>
                </div>

                {/* Profile Details */}
                <div className="p-5 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{member.name}</h3>
                  <p className="text-xs font-semibold text-sky-600">{member.role}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{member.dept} • {member.education}</p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 relative">
                    <Quote className="w-4 h-4 text-slate-300 absolute top-2 right-2" />
                    <p className="text-xs text-slate-600 italic leading-relaxed pr-4">
                      &quot;{member.quote}&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to="/doctors"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-slate-600" />
                  <span>Consultation Profile</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION BANNER */}
      {/* ========================================================================= */}
      <section className="mt-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-200 bg-white/15 px-3 py-1 rounded-full">
              Begin Your Healing Journey
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Compassionate, Expert Care is Only a Click Away
            </h3>
            <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
              Whether you need routine outpatient consultation, emergency trauma resuscitation, or complex robotic surgery, our multi-disciplinary medical team is ready 24 hours a day, 7 days a week.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              to="/appointments/book"
              className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs sm:text-sm font-extrabold shadow-lg transition-all hover:scale-105"
            >
              Book Doctor Appointment
            </Link>
            <a
              href="tel:+9118004567890"
              className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition-colors"
            >
              24/7 Helpline: +91 1800-456-7890
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
