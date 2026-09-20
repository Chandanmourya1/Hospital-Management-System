import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  HeartPulse,
  Stethoscope,
  Pill,
  FlaskConical,
  Sparkles,
  ShieldCheck,
  Award,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Eye,
  X,
  Bed,
  Microscope,
  Zap,
  Info,
  Maximize2,
  Layers,
} from 'lucide-react';
import { ResponsiveModal } from '../../components/common';

const Services = () => {
  const [selectedDeptCategory, setSelectedDeptCategory] = useState('all');
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('all');
  const [activeGalleryModalItem, setActiveGalleryModalItem] = useState(null);

  // Department Categories
  const deptCategories = [
    { id: 'all', label: 'All Specialities' },
    { id: 'cardiology', label: 'Cardiology' },
    { id: 'neurology', label: 'Neurology' },
    { id: 'orthopedics', label: 'Orthopedics' },
    { id: 'pediatrics', label: 'Pediatrics' },
    { id: 'oncology', label: 'Oncology' },
    { id: 'critical', label: 'Critical Care & Emergency' },
    { id: 'pharmacy', label: 'Pharmacy' },
    { id: 'lab', label: 'Diagnostics & Pathology' },
  ];

  // Clinical Departments Data
  const clinicalDepartments = [
    {
      id: 'cardio',
      category: 'cardiology',
      name: 'Cardiology & Digital Cath Lab',
      tagline: 'Centre for Advanced Cardiovascular Sciences',
      lead: 'Dr. Rajesh Nair, DM (Cardiology), FACC',
      badge: '24/7 Primary Angioplasty',
      icon: HeartPulse,
      accentColor: 'text-rose-600 bg-rose-50 border-rose-100',
      description:
        'Comprehensive cardiac care encompassing non-invasive cardiology, 24x7 emergency coronary interventions, electrophysiology, and complex structural heart repair.',
      procedures: [
        'Coronary Angiography & Angioplasty (PTCA)',
        'Fractional Flow Reserve (FFR) & IVUS Imaging',
        'Permanent Pacemaker & ICD Implantation',
        'Transcatheter Aortic Valve Replacement (TAVR)',
      ],
      technology: 'Philips Azurion 7 Biplane Cath Lab with ClarityIQ & 3D HeartGuide',
      timing: 'OPD: 08:00 AM – 08:00 PM | Emergency Cath Lab: 24/7',
      linkDept: 'Cardiology',
    },
    {
      id: 'neuro',
      category: 'neurology',
      name: 'Neurology & Neurosurgery',
      tagline: 'Comprehensive Brain & Spine Institute',
      lead: 'Dr. Alistair Finch, MCh (Neurosurgery)',
      badge: 'Comprehensive Stroke Centre',
      icon: Activity,
      accentColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      description:
        'Advanced neuro-medical and neuro-surgical management for stroke, epilepsy, movement disorders, brain tumors, and complex minimally invasive spinal reconstructions.',
      procedures: [
        'Intravenous Thrombolysis & Mechanical Thrombectomy',
        'Microsurgical Brain & Spinal Cord Tumor Resection',
        'Endoscopic Skull Base & Pituitary Surgery',
        'Deep Brain Stimulation (DBS) for Parkinson’s',
      ],
      technology: 'Carl Zeiss KINEVO 900 Robotic Visualization System & Intraoperative Neuromonitoring',
      timing: 'OPD: 09:00 AM – 06:00 PM | Acute Stroke Unit: 24/7',
      linkDept: 'Neurology',
    },
    {
      id: 'ortho',
      category: 'orthopedics',
      name: 'Orthopedics & Joint Reconstruction',
      tagline: 'Centre for Musculoskeletal & Sports Medicine',
      lead: 'Dr. Marcus Brody, MS (Ortho), FRCS',
      badge: 'Robotic Joint Centre',
      icon: Zap,
      accentColor: 'text-sky-600 bg-sky-50 border-sky-100',
      description:
        'Pioneering robotic joint replacements, complex pelvic-acetabular trauma surgery, sports arthroscopy, and spine stabilization using computer-guided navigation.',
      procedures: [
        'Robotic Total Knee & Hip Replacement (Arthroplasty)',
        'Arthroscopic ACL / Meniscus Reconstruction',
        'Minimally Invasive Spine Surgery (MISS)',
        'Complex Poly-Trauma & Fracture Fixation',
      ],
      technology: 'Stryker Mako Robotic-Arm Assisted Surgical Platform & C-Arm Image Intensifier',
      timing: 'OPD: 08:30 AM – 07:30 PM | Trauma Team: 24/7',
      linkDept: 'Orthopedics',
    },
    {
      id: 'peds',
      category: 'pediatrics',
      name: 'Pediatrics & Neonatology (NICU)',
      tagline: 'Maternal & Child Healthcare Centre',
      lead: 'Dr. Priya Sharma, MD, DNB (Pediatrics)',
      badge: 'Level-III Tertiary NICU',
      icon: Sparkles,
      accentColor: 'text-amber-600 bg-amber-50 border-amber-100',
      description:
        'Dedicated care for pediatric disorders, developmental milestones, pediatric intensive care, and specialized Level-III care for premature and critically ill neonates.',
      procedures: [
        'Extremely Low Birth Weight (ELBW) Neonatal Care',
        'Pediatric Advanced Life Support (PALS) ICU Care',
        'Pediatric Bronchoscopy & Endoscopy',
        'Comprehensive Pediatric Vaccination Clinics',
      ],
      technology: 'GE Giraffe Omnibed Incubators & SLE6000 High-Frequency Oscillatory Ventilators',
      timing: 'OPD: 09:00 AM – 07:00 PM | Pediatric ER & NICU: 24/7',
      linkDept: 'Pediatrics',
    },
    {
      id: 'onco',
      category: 'oncology',
      name: 'Medical & Surgical Oncology',
      tagline: 'Comprehensive Cancer Care Institute',
      lead: 'Dr. Elena Rostova, MS, MCh (AIIMS)',
      badge: 'Tumor Board Integrated',
      icon: Award,
      accentColor: 'text-purple-600 bg-purple-50 border-purple-100',
      description:
        'Holistic cancer treatment incorporating surgical oncology, targeted immunotherapy, chemotherapy daycare infusion suites, and multidisciplinary tumor board staging.',
      procedures: [
        'Minimally Invasive Laparoscopic & Robotic Cancer Excision',
        'Outpatient Chemotherapy & Targeted Biotherapy',
        'Organ-Preserving Breast & Head-Neck Surgery',
        'Cancer Screening & Early Genetic Risk Profiling',
      ],
      technology: 'Biosafety Cabinet Level-II Chemo Preparation & Digital Flow Cytometry',
      timing: 'OPD: 09:00 AM – 05:30 PM | Infusion Daycare: 08:00 AM – 08:00 PM',
      linkDept: 'Oncology',
    },
    {
      id: 'crit',
      category: 'critical',
      name: '24/7 Critical Care & Trauma Emergency',
      tagline: 'Level-1 Emergency & Resuscitation Center',
      lead: 'Dr. Arthur Sterling, MD, FRCP',
      badge: 'Level-1 Trauma Certified',
      icon: ShieldCheck,
      accentColor: 'text-rose-600 bg-rose-50 border-rose-100',
      description:
        'Round-the-clock emergency medical specialists, high-dependency units (HDU), dedicated cardiac resuscitation bays, and mobile ICU ambulances.',
      procedures: [
        'Immediate Advanced Cardiac & Trauma Life Support (ACLS/ATLS)',
        'Bedside Extracorporeal Membrane Oxygenation (ECMO)',
        'Continuous Renal Replacement Therapy (CRRT)',
        'Intensive Mechanical Ventilation & Hemodynamic Monitoring',
      ],
      technology: 'Dräger Infinity Central Monitoring & Hamilton-C6 Intelligent Ventilators',
      timing: 'Continuous 24 Hours / 365 Days Active',
      linkDept: 'General Medicine',
    },
    {
      id: 'pharm',
      category: 'pharmacy',
      name: 'Central Pharmacy & Clinical Supply',
      tagline: 'Smart FEFO Inventory & Dispensary',
      lead: 'David Vance, M.Pharm, MBA',
      badge: '100% FEFO Batch Traceability',
      icon: Pill,
      accentColor: 'text-teal-600 bg-teal-50 border-teal-100',
      description:
        'Automated, computer-verified hospital pharmacy operating under strict First-Expiry, First-Out (FEFO) protocols, providing verified medications with GST tax invoices.',
      procedures: [
        'Barcode-Assisted Inpatient Unit-Dose Dispensing',
        'Outpatient Retail POS & Prescription Counseling',
        'Emergency Narcotic & Cold-Chain Vaccine Storage',
        'Automated Purchase Requisition & Stock Reconciliation',
      ],
      technology: 'Cold-Chain 2°C–8°C Monitoring & Cloud-Synchronized Inventory POS',
      timing: 'Continuous 24 Hours / 365 Days Active',
      linkDept: 'Pharmacy',
    },
    {
      id: 'diag',
      category: 'lab',
      name: 'Diagnostic Pathology & Imaging',
      tagline: 'NABL Certified Clinical Testing Labs',
      lead: 'Dr. Sarah Jenkins, MD, FRCPath',
      badge: 'ISO 15189:2012 Certified',
      icon: Microscope,
      accentColor: 'text-cyan-600 bg-cyan-50 border-cyan-100',
      description:
        'Fully automated clinical biochemistry, hematology, microbiology, histopathology, and digital radiology providing fast, tamper-proof electronic reports.',
      procedures: [
        'Complete Biochemistry, Liver & Renal Function Profiles',
        '3.0 Tesla High-Field Whole-Body MRI Scanning',
        '128-Slice Low-Dose Multi-Detector CT Angiography',
        '4D Obstetric & Musculoskeletal Ultrasonography',
      ],
      technology: 'Roche Cobas 8000 Automated Biochemistry & Siemens 3.0T MAGNETOM MRI',
      timing: 'Sample Collection: 24/7 | Radiology: 24/7 Active',
      linkDept: 'Diagnostics',
    },
  ];

  // Facility Gallery Data
  const galleryItems = [
    {
      id: 'ot-1',
      category: 'ot',
      categoryLabel: 'Operation Theatres',
      title: 'Modular Robotic Surgical Suite (OT-1)',
      badge: 'Class 100 Laminar Airflow',
      specs: 'Positive Pressure • 35 Air Changes/Hr • HEPA H14 Filtration',
      description:
        'Hermetically sealed surgical theater with seamless anti-microbial wall cladding, pendant-mounted surgical gas manifolds, and integrated multi-screen telemedicine visualization.',
      equipment: ['Stryker Mako Robotic Platform', 'Maquet ALPHAMAXX Surgical Table', 'Dräger Zeus Anesthesia Workstation', 'Karl Storz 4K Ultra-HD Endoscopy Tower'],
      imageTheme: 'from-sky-900 via-blue-900 to-indigo-950',
      tag: 'NABH OT Protocol',
    },
    {
      id: 'icu-1',
      category: 'icu',
      categoryLabel: 'Intensive Care Units',
      title: 'Tertiary Medical & Surgical ICU (24 Beds)',
      badge: '1:1 Nurse-to-Patient Ratio',
      specs: 'Isolated Cubicles • Negative Pressure Isolation • Central Telemetry',
      description:
        'Equipped with motorized ceiling pendants, dedicated hemodialysis water connections, continuous cardiac output monitors, and smart acoustic insulation.',
      equipment: ['Hamilton-C6 Closed-Loop Ventilators', 'Philips IntelliVue MX800 Monitors', 'Fresenius Multifiltrate Pro CRRT', 'Mindray Resona 7 Point-of-Care Ultrasound'],
      imageTheme: 'from-emerald-950 via-teal-950 to-slate-950',
      tag: 'Continuous Hemodynamic Monitoring',
    },
    {
      id: 'cath-1',
      category: 'ot',
      categoryLabel: 'Operation Theatres',
      title: 'Digital Biplane Cardiac Cath Lab',
      badge: 'Door-to-Balloon < 45 Mins',
      specs: 'Flat Panel Detector • Low-Dose ClarityIQ • Zero-Vibration Floor',
      description:
        'Advanced interventional suite dedicated to acute coronary interventions, structural valve repairs, complex electrophysiology studies, and neuro-thrombectomy.',
      equipment: ['Philips Azurion 7 Biplane System', 'Volcano IVUS & FFR Console', 'Datascope CS300 Intra-Aortic Balloon Pump (IABP)', 'St. Jude Medical EnSite Cardiac Mapping'],
      imageTheme: 'from-rose-950 via-red-950 to-slate-950',
      tag: 'Interventional Cardiology',
    },
    {
      id: 'mri-1',
      category: 'radiology',
      categoryLabel: 'Diagnostics & Imaging',
      title: '3.0 Tesla Silent Whole-Body MRI Suite',
      badge: 'Ultra-High Gradient 3T',
      specs: '70cm Wide Bore • Acoustic QuietSuite • Ambient Lighting Experience',
      description:
        'Next-generation 3.0 Tesla magnetic resonance imaging scanner providing sub-millimeter anatomical detail for neuro, cardiac, and musculoskeletal diagnostics with 70% noise reduction.',
      equipment: ['Siemens MAGNETOM Vida 3T MRI', 'Tim 4G Multi-Channel Matrix Coils', 'BioMatrix Breathing Sensor Technology', 'Post-Processing Neuro-Perfusion Workstation'],
      imageTheme: 'from-purple-950 via-indigo-950 to-slate-950',
      tag: 'AERB Radiation & RF Safety',
    },
    {
      id: 'ct-1',
      category: 'radiology',
      categoryLabel: 'Diagnostics & Imaging',
      title: '128-Slice Dual-Source Cardiac CT Scanner',
      badge: '0.28s Rotation Speed',
      specs: 'Low-Dose ASiR-V Reconstruction • High Heart Rate Freezing',
      description:
        'Ultrafast computed tomography capable of whole-heart coronary angiography in a single cardiac beat, pediatric scans without sedation, and high-resolution trauma trauma-grams.',
      equipment: ['GE Revolution HD CT Scanner', 'Dual-Head Automated Contrast Injector', 'Radiation Dose Tracking & Reporting', 'Vitrea Advanced 3D Reconstruction Console'],
      imageTheme: 'from-cyan-950 via-sky-950 to-slate-950',
      tag: 'Fast Multi-Slice Diagnostics',
    },
    {
      id: 'deluxe-1',
      category: 'wards',
      categoryLabel: 'Patient Suites & Wards',
      title: 'Executive Presidential Inpatient Suite',
      badge: 'Private Healing Environment',
      specs: 'Two-Room Suite • Motorized Hill-Rom Bed • Nurse Call Intercom',
      description:
        'Spacious, sanitized inpatient accommodation featuring an attendant lounge, refrigerator, private microwave, smart entertainment, and 24-hour dedicated nursing attention.',
      equipment: ['Hill-Rom Progressa Smart ICU Bed', 'Central Medical Gas Outlets', 'High-Speed Wi-Fi & Workstation', 'Private En-Suite Washroom with Grab Rails'],
      imageTheme: 'from-amber-950 via-orange-950 to-slate-950',
      tag: 'Inpatient Hospital Comfort',
    },
    {
      id: 'pharm-1',
      category: 'pharmacy',
      categoryLabel: 'Pharmacy & Logistics',
      title: 'Central Clinical Dispensary & Cold Store',
      badge: '24/7 FEFO Automated',
      specs: 'Continuous 2°C–8°C Cold Chain • Barcode Scanning • Inward Logistics',
      description:
        'Central dispensing pharmacy maintaining complete medication stock with computer-assisted batch tracking, automated low-stock reorder warnings, and computerized billing.',
      equipment: ['Medical Grade Vaccine Refrigerators', 'Barcode Handheld Scanners', 'FEFO Inventory Audit Terminals', 'Digital Temperature Dataloggers with SMS Alerts'],
      imageTheme: 'from-teal-950 via-cyan-950 to-slate-950',
      tag: 'Drug License Regulated',
    },
    {
      id: 'er-1',
      category: 'emergency',
      categoryLabel: 'Emergency & Trauma',
      title: 'Level-1 Emergency Resuscitation Bay',
      badge: 'Instant Triage Ready',
      specs: 'Dedicated Ambulance Dock • ESI Triage • Crash Carts Equipped',
      description:
        'Immediate access trauma bay designed for rapid multi-trauma stabilization, cardiac arrests, acute strokes, and mass casualty triage with direct elevator to OTs.',
      equipment: ['Zoll R Series Defibrillators with CPR Feedback', 'Sonosite Edge II Trauma Point-of-Care Ultrasound', 'LUCAS 3 Mechanical Chest Compression System', 'Rapid Fluid & Blood Infuser'],
      imageTheme: 'from-rose-950 via-slate-900 to-slate-950',
      tag: 'Golden Hour Emergency Care',
    },
  ];

  // Gallery filter categories
  const galleryCategories = [
    { id: 'all', label: 'All Facilities' },
    { id: 'ot', label: 'Operation Theatres (OT)' },
    { id: 'icu', label: 'Intensive Care (ICU)' },
    { id: 'radiology', label: 'Diagnostics & Imaging' },
    { id: 'wards', label: 'Patient Suites & Wards' },
    { id: 'pharmacy', label: 'Pharmacy & Logistics' },
    { id: 'emergency', label: 'Emergency Trauma' },
  ];

  // Filtered Clinical Departments
  const filteredDepts = clinicalDepartments.filter((dept) => {
    if (selectedDeptCategory === 'all') return true;
    return dept.category === selectedDeptCategory;
  });

  // Filtered Gallery Items
  const filteredGallery = galleryItems.filter((item) => {
    if (selectedGalleryCategory === 'all') return true;
    return item.category === selectedGalleryCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200">
            <Building2 className="w-4 h-4 text-sky-400" />
            35+ Super-Speciality Departments & Clinical Services
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4 max-w-4xl mx-auto">
            Comprehensive Clinical Services & State-of-the-Art Facilities
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
            Delivering advanced tertiary medical sciences, robotic surgery, 24x7 emergency resuscitation, automated diagnostic pathology, and comfortable inpatient healing environments.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#gallery"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-colors"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Explore Hospital Facility Gallery</span>
            </a>
            <Link
              to="/appointments/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-600/30 transition-all hover:scale-105"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Doctor Appointment</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CLINICAL DEPARTMENTS DIRECTORY */}
      {/* ========================================================================= */}
      <section className="mt-12 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              Departmental Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Clinical Specialities & Surgical Units
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select a speciality below to filter departments, procedures, and medical technologies.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 hms-scrollbar mb-8">
          {deptCategories.map((cat) => {
            const isSelected = selectedDeptCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedDeptCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Department Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDepts.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border ${dept.accentColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">{dept.name}</h3>
                        <p className="text-xs text-slate-500">{dept.tagline}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">
                      {dept.badge}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {dept.description}
                  </p>

                  {/* Procedures Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Key Clinical Procedures:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {dept.procedures.map((proc, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{proc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technology Deployments */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Biomedical Engineering:</span>
                    <span className="text-slate-600">{dept.technology}</span>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-700">{dept.lead}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {dept.timing}
                    </p>
                  </div>

                  <Link
                    to={`/doctors?dept=${encodeURIComponent(dept.linkDept)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-semibold transition-colors shrink-0"
                  >
                    <span>View Specialists</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE HOSPITAL FACILITY GALLERY */}
      {/* ========================================================================= */}
      <section id="gallery" className="mt-24 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Infrastructure & Equipment
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Hospital Facility & Technology Gallery
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Inspect our world-class medical facilities, modular surgical theaters, ICU suites, and advanced diagnostic imaging infrastructure. Click any card for detailed specifications.
          </p>
        </div>

        {/* Gallery Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-3 hms-scrollbar mb-8">
          {galleryCategories.map((cat) => {
            const isSelected = selectedGalleryCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedGalleryCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveGalleryModalItem(item)}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Visual Header / Stylized Room Card */}
                <div className={`h-48 bg-gradient-to-br ${item.imageTheme} p-5 text-white flex flex-col justify-between relative overflow-hidden`}>
                  {/* Subtle Grid / Overlay Pattern */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-2xs opacity-40 pointer-events-none" />

                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-slate-200">
                      {item.categoryLabel}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <span className="text-[10px] font-mono text-sky-300 block mb-1">
                      {item.badge}
                    </span>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-2.5">
                  <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                    {item.specs}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Strip */}
              <div className="p-5 pt-0">
                <div className="w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-sky-50 text-slate-700 group-hover:text-sky-700 text-xs font-semibold flex items-center justify-between transition-colors">
                  <span>View Specifications</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FACILITY DETAILS MODAL / LIGHTBOX */}
      {/* ========================================================================= */}
      <ResponsiveModal
        isOpen={Boolean(activeGalleryModalItem)}
        onClose={() => setActiveGalleryModalItem(null)}
        title={activeGalleryModalItem?.title || 'Facility Specifications'}
        subtitle={activeGalleryModalItem?.specs}
        size="3xl"
        icon={<Building2 className="w-5 h-5 text-sky-600" />}
      >
        {activeGalleryModalItem && (
          <div className="space-y-5">
            {/* Visual Banner */}
            <div className={`h-44 rounded-2xl bg-gradient-to-r ${activeGalleryModalItem.imageTheme} p-6 text-white flex flex-col justify-between shadow-inner`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                  {activeGalleryModalItem.categoryLabel}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  {activeGalleryModalItem.tag}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{activeGalleryModalItem.title}</h3>
                <p className="text-xs text-slate-200 mt-1">{activeGalleryModalItem.badge}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Architectural & Clinical Overview
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeGalleryModalItem.description}
              </p>
            </div>

            {/* Installed Biomedical Equipment Roster */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Key Biomedical Technologies & Equipment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeGalleryModalItem.equipment?.map((eq, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{eq}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality & Safety Protocols */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-xs text-sky-900 leading-relaxed">
                <strong className="block font-bold mb-0.5">NABH & Infection Control Directives:</strong>
                This facility undergoes daily automated ultraviolet (UV-C) decontamination, continuous positive/negative differential pressure tracking, and bi-monthly microbiological air sampling.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveGalleryModalItem(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Facility View
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* ========================================================================= */}
      {/* 5. PATIENT AMENITIES & QUALITY COMMITMENT */}
      {/* ========================================================================= */}
      <section className="mt-24 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-950 px-3 py-1 rounded-full border border-sky-800">
              Patient Convenience
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-3">
              Comprehensive On-Campus Patient Amenities
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Designed to make every hospital visit seamless, dignified, and comfortable for patients and visiting family members.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-emerald-400 font-bold block">24/7 Blood Bank</span>
              <p className="text-slate-400 text-[11px]">Component separation & cross-match</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-sky-400 font-bold block">Oxygen Generating Plant</span>
              <p className="text-slate-400 text-[11px]">Dual PSA continuous cryogenic supply</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-purple-400 font-bold block">Valet & Mobility Help</span>
              <p className="text-slate-400 text-[11px]">Free wheelchair escort & parking</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-amber-400 font-bold block">Hygienic Cafeteria</span>
              <p className="text-slate-400 text-[11px]">Dietician-supervised clinical meals</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-rose-400 font-bold block">24/7 TPA Desk</span>
              <p className="text-slate-400 text-[11px]">Cashless insurance approvals</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-teal-400 font-bold block">Digital EMR Kiosks</span>
              <p className="text-slate-400 text-[11px]">Paperless report print stations</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
