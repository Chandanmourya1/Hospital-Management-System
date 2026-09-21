import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import PatientProfile from '../models/PatientProfile.js';
import Appointment from '../models/Appointment.js';
import OpdVisit from '../models/OpdVisit.js';
import WardRoom from '../models/WardRoom.js';
import IpdAdmission from '../models/IpdAdmission.js';
import MedicalDocument from '../models/MedicalDocument.js';
import Medicine from '../models/Medicine.js';
import MedicinePurchase from '../models/MedicinePurchase.js';
import PharmacyBill from '../models/PharmacyBill.js';
import LabTestCatalog from '../models/LabTestCatalog.js';
import LabOrder from '../models/LabOrder.js';
import LabReport from '../models/LabReport.js';

// Fix for Windows / ISP DNS timeout on Atlas SRV & TXT records (queryTxt ETIMEOUT)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hms_db';
  await mongoose.connect(uri);
  console.log('[Seeder] Connected to MongoDB');
};

const defaultSchedule = (activeDays, start = '09:00', end = '17:00', max = 20) => {
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return allDays.map((day) => ({
    day,
    isAvailable: activeDays.includes(day),
    startTime: start,
    endTime: end,
    maxPatients: max,
  }));
};

const getNextDateForDay = (targetDayName) => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetIndex = daysOfWeek.indexOf(targetDayName);
  const now = new Date();
  const currentDay = now.getDay();
  let diff = targetIndex - currentDay;
  if (diff <= 0) diff += 7;
  const result = new Date(now);
  result.setDate(now.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getPastDateForDay = (targetDayName) => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetIndex = daysOfWeek.indexOf(targetDayName);
  const now = new Date();
  const currentDay = now.getDay();
  let diff = currentDay - targetIndex;
  if (diff <= 0) diff += 7;
  const result = new Date(now);
  result.setDate(now.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const seedData = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    console.error('\n❌ [Seeder Safety] Blocked: Seeding in production is disabled to prevent accidental data loss.');
    console.error('💡 To override this, set ALLOW_PROD_SEED=true.\n');
    process.exit(1);
  }

  try {
    await connectDB();

    console.log('[Seeder] Clearing previous seed accounts and appointments...');
    const seedEmails = [
      'admin@hms.local',
      'doctor@hms.local',
      'marcus.vance@hms.local',
      'elena.rostova@hms.local',
      'receptionist@hms.local',
      'pharmacist@hms.local',
      'labtech@hms.local',
      'patient@hms.local',
      'emily.clark@hms.local',
    ];

    const existingUsers = await User.find({ email: { $in: seedEmails } });
    const userIds = existingUsers.map((u) => u._id);

    await Appointment.deleteMany({
      $or: [{ patient: { $in: userIds } }, { doctor: { $in: userIds } }],
    });
    await OpdVisit.deleteMany({
      $or: [{ patient: { $in: userIds } }, { doctor: { $in: userIds } }],
    });
    await IpdAdmission.deleteMany({});
    await WardRoom.deleteMany({});
    await MedicalDocument.deleteMany({});
    await Medicine.deleteMany({});
    await MedicinePurchase.deleteMany({});
    await PharmacyBill.deleteMany({});
    await LabTestCatalog.deleteMany({});
    await LabOrder.deleteMany({});
    await LabReport.deleteMany({});
    await DoctorProfile.deleteMany({ user: { $in: userIds } });
    await PatientProfile.deleteMany({ user: { $in: userIds } });
    await User.deleteMany({ email: { $in: seedEmails } });

    console.log('[Seeder] Seeding new role accounts...');

    // 1. Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@hms.local',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210',
      gender: 'male',
      isVerified: true,
      address: {
        street: 'Admin Block, Healthcare Boulevard',
        city: 'Metro City',
        state: 'State',
        zipCode: '110001',
      },
    });

    // 2. Doctor 1: Dr. Sarah Jenkins (Cardiology)
    const doctor1 = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'doctor@hms.local',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '+91 98765 43211',
      gender: 'female',
      isVerified: true,
      address: {
        street: 'Doctors Enclave, Suite 4B',
        city: 'Metro City',
        state: 'State',
        zipCode: '110001',
      },
    });

    const docProfile1 = await DoctorProfile.create({
      user: doctor1._id,
      doctorId: 'DOC-1001',
      specialization: 'Senior Interventional Cardiologist',
      department: 'Cardiology',
      licenseNumber: 'MED-REG-2018-9843',
      consultationFee: 800,
      experienceYears: 12,
      roomNumber: 'Consultation Suite 204, East Wing',
      availabilityStatus: 'Available',
      workingHours: { start: '09:00', end: '17:00' },
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      weeklySchedule: defaultSchedule(
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        '09:00',
        '17:00',
        20
      ),
      slotDurationMinutes: 30,
      qualifications: [
        { degree: 'MBBS', institution: 'Johns Hopkins School of Medicine', year: 2012 },
        { degree: 'MD Cardiology', institution: 'Harvard Medical School', year: 2016 },
        { degree: 'Fellowship in Cardiac Electrophysiology', institution: 'Cleveland Clinic', year: 2018 },
      ],
      bio: 'Board-certified cardiologist with over 12 years of clinical and surgical experience in acute coronary syndromes, echocardiography, and catheter-based interventions.',
    });

    // 3. Doctor 2: Dr. Marcus Vance (Neurology)
    const doctor2 = await User.create({
      name: 'Dr. Marcus Vance',
      email: 'marcus.vance@hms.local',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '+91 98765 43216',
      gender: 'male',
      isVerified: true,
      address: {
        street: 'Neurosciences Pavilion, Apt 12',
        city: 'Metro City',
        state: 'State',
        zipCode: '110001',
      },
    });

    const docProfile2 = await DoctorProfile.create({
      user: doctor2._id,
      doctorId: 'DOC-1002',
      specialization: 'Consultant Neurologist & Stroke Specialist',
      department: 'Neurology',
      licenseNumber: 'MED-REG-2015-7721',
      consultationFee: 950,
      experienceYears: 15,
      roomNumber: 'Neuro Suite 310, 3rd Floor',
      availabilityStatus: 'Available',
      workingHours: { start: '10:00', end: '16:00' },
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      weeklySchedule: defaultSchedule(
        ['Monday', 'Wednesday', 'Friday'],
        '10:00',
        '16:00',
        15
      ),
      slotDurationMinutes: 45,
      qualifications: [
        { degree: 'MBBS', institution: 'Oxford University Medical School', year: 2009 },
        { degree: 'MD Neurology', institution: 'Mayo Clinic College of Medicine', year: 2013 },
        { degree: 'DM Neurovascular Medicine', institution: 'Stanford Medicine', year: 2015 },
      ],
      bio: 'Senior consultant neurologist specializing in neurodegenerative diseases, acute ischemic stroke management, and advanced electroencephalography.',
    });

    // 4. Doctor 3: Dr. Elena Rostova (Orthopedics)
    const doctor3 = await User.create({
      name: 'Dr. Elena Rostova',
      email: 'elena.rostova@hms.local',
      password: 'Doctor@123',
      role: 'doctor',
      phone: '+91 98765 43217',
      gender: 'female',
      isVerified: true,
      address: {
        street: 'Orthopedic Towers, Room 22',
        city: 'Metro City',
        state: 'State',
        zipCode: '110001',
      },
    });

    const docProfile3 = await DoctorProfile.create({
      user: doctor3._id,
      doctorId: 'DOC-1003',
      specialization: 'Orthopedic Surgeon & Joint Replacement Specialist',
      department: 'Orthopedics',
      licenseNumber: 'MED-REG-2020-4109',
      consultationFee: 750,
      experienceYears: 9,
      roomNumber: 'Orthopedic Clinic 108, Ground Floor',
      availabilityStatus: 'Available',
      workingHours: { start: '08:30', end: '15:30' },
      availableDays: ['Tuesday', 'Thursday', 'Saturday'],
      weeklySchedule: defaultSchedule(
        ['Tuesday', 'Thursday', 'Saturday'],
        '08:30',
        '15:30',
        25
      ),
      slotDurationMinutes: 30,
      qualifications: [
        { degree: 'MBBS', institution: 'King’s College London', year: 2015 },
        { degree: 'MS Orthopedic Surgery', institution: 'Charité University Hospital', year: 2019 },
      ],
      bio: 'Specialist in arthroscopic reconstruction, minimally invasive robotic joint replacements, and sports musculoskeletal trauma rehabilitation.',
    });

    // 5. Receptionist
    const receptionist = await User.create({
      name: 'Alex Morgan',
      email: 'receptionist@hms.local',
      password: 'Receptionist@123',
      role: 'receptionist',
      phone: '+91 98765 43212',
      gender: 'other',
      isVerified: true,
      address: {
        street: 'West Desk, Central Lobby',
        city: 'Metro City',
        state: 'State',
        zipCode: '110001',
      },
    });

    // 5b. Pharmacist
    const pharmacist = await User.create({
      name: 'Alex Chen, RPh',
      email: 'pharmacist@hms.local',
      password: 'Pharmacist@123',
      role: 'pharmacist',
      phone: '+91 98765 43219',
      gender: 'male',
      isVerified: true,
      address: {
        street: 'Central Hospital Pharmacy, Ground Floor',
        city: 'Metro City',
        state: 'State',
        zipCode: '110001',
      },
    });

    // 5c. Lab Technician / Pathologist
    const labtech = await User.create({
      name: 'Dr. Robert Taylor, MD Pathologist',
      email: 'labtech@hms.local',
      password: 'Labtech@123',
      role: 'lab_technician',
      phone: '+91 98765 43220',
      gender: 'male',
      isVerified: true,
      address: {
        street: 'Central Clinical Diagnostic Lab, Level 1 East Wing',
        city: 'Metro City',
        state: 'State',
        zipCode: '110001',
      },
    });

    // 6. Patient 1: John Doe (PAT-1001)
    const patient1 = await User.create({
      name: 'John Doe',
      email: 'patient@hms.local',
      password: 'Patient@123',
      role: 'patient',
      phone: '+91 98765 43213',
      gender: 'male',
      dateOfBirth: new Date('1994-06-15'),
      isVerified: true,
      address: {
        street: '42 Baker Street',
        city: 'Metro City',
        state: 'State',
        zipCode: '110002',
      },
    });

    const patientProfile1 = await PatientProfile.create({
      user: patient1._id,
      patientId: 'PAT-1001',
      bloodGroup: 'O+',
      maritalStatus: 'Married',
      occupation: 'Software Engineer',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+91 98765 99999',
        alternatePhone: '+91 98765 88888',
      },
      insurance: {
        provider: 'BlueCross Health Insurance',
        policyNumber: 'BCBS-98745210',
        groupNumber: 'GRP-4412',
        expiryDate: new Date('2028-12-31'),
        coverageDetails: 'Comprehensive Inpatient & Outpatient Coverage up to $50,000',
      },
      allergies: [
        {
          allergen: 'Penicillin',
          severity: 'Severe',
          reaction: 'Anaphylaxis and respiratory distress',
          identifiedDate: new Date('2020-04-10'),
        },
        {
          allergen: 'Peanuts',
          severity: 'Moderate',
          reaction: 'Hives and facial swelling',
          identifiedDate: new Date('2018-09-22'),
        },
      ],
      medicalHistory: [
        {
          condition: 'Mild Asthma',
          diagnosisDate: new Date('2016-03-12'),
          status: 'Chronic',
          notes: 'Triggered by seasonal pollen; uses Albuterol inhaler PRN.',
          recordedBy: doctor1._id,
        },
        {
          condition: 'Laparoscopic Appendectomy',
          diagnosisDate: new Date('2021-11-05'),
          status: 'Resolved',
          notes: 'Routine surgery with no post-operative complications.',
          recordedBy: doctor1._id,
        },
      ],
    });

    // 7. Patient 2: Emily Clark (PAT-1002)
    const patient2 = await User.create({
      name: 'Emily Clark',
      email: 'emily.clark@hms.local',
      password: 'Patient@123',
      role: 'patient',
      phone: '+91 98765 43214',
      gender: 'female',
      dateOfBirth: new Date('1988-09-20'),
      isVerified: true,
      address: {
        street: '18 Elm Avenue',
        city: 'Metro City',
        state: 'State',
        zipCode: '110003',
      },
    });

    const patientProfile2 = await PatientProfile.create({
      user: patient2._id,
      patientId: 'PAT-1002',
      bloodGroup: 'A+',
      maritalStatus: 'Single',
      occupation: 'Architect',
      emergencyContact: {
        name: 'Robert Clark',
        relationship: 'Father',
        phone: '+91 98765 77777',
      },
      insurance: {
        provider: 'UnitedHealthcare Global',
        policyNumber: 'UHC-5541239',
        groupNumber: 'GRP-9901',
        expiryDate: new Date('2027-06-30'),
        coverageDetails: 'Standard Corporate Health Plan',
      },
      allergies: [
        {
          allergen: 'Latex',
          severity: 'Mild',
          reaction: 'Localized contact dermatitis',
          identifiedDate: new Date('2022-01-15'),
        },
      ],
      medicalHistory: [
        {
          condition: 'Primary Hypertension',
          diagnosisDate: new Date('2023-05-18'),
          status: 'Active',
          notes: 'Managed via diet and lifestyle modification.',
          recordedBy: doctor1._id,
        },
      ],
    });

    console.log('[Seeder] Seeding initial appointment schedule...');

    const dateSarah = getNextDateForDay('Wednesday');
    const dateMarcus = getNextDateForDay('Friday');
    const dateElenaPast = getPastDateForDay('Tuesday');
    const dateSarahCancel = getNextDateForDay('Thursday');

    await Appointment.create([
      {
        appointmentId: 'APT-1001',
        patient: patient1._id,
        patientProfile: patientProfile1._id,
        doctor: doctor1._id,
        doctorProfile: docProfile1._id,
        department: 'Cardiology',
        appointmentDate: dateSarah,
        timeSlot: '10:00 - 10:30',
        startTime: '10:00',
        endTime: '10:30',
        status: 'Confirmed',
        bookingType: 'Online',
        reasonForVisit: 'Routine cardiovascular checkup and ECG evaluation',
        consultationFee: docProfile1.consultationFee,
        roomNumber: docProfile1.roomNumber,
        consultationNotes: 'Patient advised to bring previous cholesterol lab reports.',
      },
      {
        appointmentId: 'APT-1002',
        patient: patient2._id,
        patientProfile: patientProfile2._id,
        doctor: doctor2._id,
        doctorProfile: docProfile2._id,
        department: 'Neurology',
        appointmentDate: dateMarcus,
        timeSlot: '11:00 - 11:45',
        startTime: '11:00',
        endTime: '11:45',
        status: 'Confirmed',
        bookingType: 'Walk-in',
        reasonForVisit: 'Follow-up on recurring migraine symptoms and visual aura',
        consultationFee: docProfile2.consultationFee,
        roomNumber: docProfile2.roomNumber,
        consultationNotes: 'Patient reports headaches mostly occurring during screen use.',
      },
      {
        appointmentId: 'APT-1003',
        patient: patient1._id,
        patientProfile: patientProfile1._id,
        doctor: doctor3._id,
        doctorProfile: docProfile3._id,
        department: 'Orthopedics',
        appointmentDate: dateElenaPast,
        timeSlot: '14:00 - 14:30',
        startTime: '14:00',
        endTime: '14:30',
        status: 'Completed',
        bookingType: 'Online',
        reasonForVisit: 'Knee joint consultation after minor sports injury',
        consultationFee: docProfile3.consultationFee,
        roomNumber: docProfile3.roomNumber,
        consultationNotes: 'Physical examination completed. Mild MCL strain identified. Prescribed anti-inflammatory medication and advised 2 weeks rest. Follow-up if pain persists.',
      },
      {
        appointmentId: 'APT-1004',
        patient: patient2._id,
        patientProfile: patientProfile2._id,
        doctor: doctor1._id,
        doctorProfile: docProfile1._id,
        department: 'Cardiology',
        appointmentDate: dateSarahCancel,
        timeSlot: '15:00 - 15:30',
        startTime: '15:00',
        endTime: '15:30',
        status: 'Cancelled',
        bookingType: 'Online',
        reasonForVisit: 'Annual preventative cardiac screening',
        cancellationReason: 'Patient had urgent out-of-town business travel conflict.',
        consultationFee: docProfile1.consultationFee,
        roomNumber: docProfile1.roomNumber,
      },
    ]);

    console.log('[Seeder] Seeding initial OPD outpatient visits & digital prescriptions...');

    await OpdVisit.create([
      {
        visitId: 'OPD-1001',
        tokenNumber: 1,
        patient: patient1._id,
        patientProfile: patientProfile1._id,
        doctor: doctor1._id,
        doctorProfile: docProfile1._id,
        department: 'Cardiology',
        visitDate: new Date(),
        status: 'Completed',
        vitals: {
          bloodPressure: '128/82',
          heartRate: 74,
          temperature: 98.4,
          respiratoryRate: 16,
          spO2: 99,
          weight: 72,
          height: 178,
          bmi: 22.7,
          recordedAt: new Date(),
        },
        chiefComplaints: 'Occasional exertional shortness of breath and mild palpitations after exercise',
        symptomsDuration: '2 weeks',
        physicalExamination: 'S1/S2 heart sounds clear, no murmur detected. Bilateral clear breath sounds. Peripheral pulses intact.',
        diagnosis: 'Sinus Tachycardia - Stress & Exertional',
        clinicalNotes: 'Rest ECG within normal limits. Advised proper hydration, electrolyte repletion, and gradual cardiovascular conditioning.',
        prescription: {
          prescriptionId: 'RX-1001',
          medicines: [
            {
              name: 'Metoprolol Tartrate 25mg',
              dosage: '1 tablet',
              frequency: '1-0-1',
              duration: '14 days',
              instructions: 'After meals with water',
            },
            {
              name: 'Coenzyme Q10 100mg',
              dosage: '1 capsule',
              frequency: '0-1-0',
              duration: '30 days',
              instructions: 'Take with midday lunch',
            },
          ],
          investigationsRecommended: ['2D Echocardiogram', 'Serum Electrolytes Profile'],
          dietaryAdvice: 'Reduce daily caffeine intake, limit sodium to <2g/day, drink at least 2.5L water daily.',
          generalNotes: 'Avoid strenuous high-intensity interval training until echocardiogram review.',
          issuedAt: new Date(),
        },
        followUp: {
          recommended: true,
          followUpDate: new Date(Date.now() + 14 * 86400000),
          instructions: 'Review in Cardiology OPD after 2 weeks with 2D Echo report.',
          appointmentCreated: false,
        },
        consultationFee: docProfile1.consultationFee,
        billingStatus: 'Paid',
        recordedBy: admin._id,
      },
      {
        visitId: 'OPD-1002',
        tokenNumber: 1,
        patient: patient2._id,
        patientProfile: patientProfile2._id,
        doctor: doctor2._id,
        doctorProfile: docProfile2._id,
        department: 'Neurology',
        visitDate: new Date(),
        status: 'Waiting',
        vitals: {
          bloodPressure: '118/76',
          heartRate: 68,
          temperature: 98.6,
          respiratoryRate: 18,
          spO2: 98,
          weight: 58,
          height: 165,
          bmi: 21.3,
          recordedAt: new Date(),
        },
        chiefComplaints: 'Severe throbbing unilateral headache accompanied by photophobia and nausea',
        symptomsDuration: '4 days',
        consultationFee: docProfile2.consultationFee,
        billingStatus: 'Paid',
        recordedBy: admin._id,
      },
    ]);

    console.log('[Seeder] Seeding Wards, Rooms and Beds for IPD...');
    const gw101 = await WardRoom.create({
      wardName: 'General Medical Ward',
      wardType: 'General',
      floor: '1st Floor',
      roomNumber: 'GW-101',
      dailyRate: 1500,
      beds: [
        { bedNumber: 'Bed 1', status: 'Available', features: ['Central Oxygen', 'Manual Hospital Bed'] },
        { bedNumber: 'Bed 2', status: 'Available', features: ['Central Oxygen', 'Cardiac Monitor'] },
        { bedNumber: 'Bed 3', status: 'Available', features: ['Manual Hospital Bed'] },
        { bedNumber: 'Bed 4', status: 'Cleaning', features: ['Central Oxygen', 'Manual Hospital Bed'] },
      ],
    });

    const gw102 = await WardRoom.create({
      wardName: 'General Surgical Ward',
      wardType: 'General',
      floor: '1st Floor',
      roomNumber: 'GW-102',
      dailyRate: 1600,
      beds: [
        { bedNumber: 'Bed 1', status: 'Available', features: ['Oxygen Port', 'Suction Apparatus'] },
        { bedNumber: 'Bed 2', status: 'Available', features: ['Oxygen Port'] },
        { bedNumber: 'Bed 3', status: 'Available', features: ['Oxygen Port'] },
      ],
    });

    const icu201 = await WardRoom.create({
      wardName: 'Intensive Care Unit (ICU)',
      wardType: 'ICU',
      floor: '2nd Floor',
      roomNumber: 'ICU-201',
      dailyRate: 6500,
      beds: [
        { bedNumber: 'Bed 1', status: 'Available', features: ['Mechanical Ventilator', 'Multi-para Monitor', 'Defibrillator Access', 'Central Line Kit'] },
        { bedNumber: 'Bed 2', status: 'Available', features: ['Mechanical Ventilator', 'Multi-para Monitor', 'Infusion Pump'] },
      ],
    });

    const ccu202 = await WardRoom.create({
      wardName: 'Cardiac Care Unit (CCU)',
      wardType: 'ICU',
      floor: '2nd Floor',
      roomNumber: 'CCU-202',
      dailyRate: 5500,
      beds: [
        { bedNumber: 'Bed 1', status: 'Available', features: ['Telemetry ECG Monitor', 'Central Oxygen', 'Crash Cart Access'] },
        { bedNumber: 'Bed 2', status: 'Available', features: ['Telemetry ECG Monitor', 'Central Oxygen'] },
      ],
    });

    const sp301 = await WardRoom.create({
      wardName: 'Semi-Private Care Suite',
      wardType: 'Semi-Private',
      floor: '3rd Floor',
      roomNumber: 'SP-301',
      dailyRate: 3200,
      beds: [
        { bedNumber: 'Bed 1', status: 'Available', features: ['Privacy Curtain', 'Central Oxygen', 'Attendant Chair'] },
        { bedNumber: 'Bed 2', status: 'Available', features: ['Privacy Curtain', 'Central Oxygen', 'Attendant Chair'] },
      ],
    });

    const pvt401 = await WardRoom.create({
      wardName: 'Executive Deluxe Suite',
      wardType: 'Private',
      floor: '4th Floor',
      roomNumber: 'PVT-401',
      dailyRate: 5000,
      beds: [
        { bedNumber: 'Bed 1', status: 'Available', features: ['Motorized ICU Bed', 'Central Oxygen', 'En-suite Washroom', 'Attendant Sofa-Cum-Bed', 'Smart LED TV', 'Mini Refrigerator'] },
      ],
    });

    console.log('[Seeder] Seeding Demo Inpatient Admission (IPD-1001)...');
    const demoAdmission = await IpdAdmission.create({
      admissionId: 'IPD-1001',
      patient: patient1._id,
      patientProfile: patientProfile1._id,
      attendingDoctor: doctor1._id,
      attendingDoctorProfile: docProfile1._id,
      department: 'Cardiology',
      admissionDate: new Date(Date.now() - 3 * 86400000), // admitted 3 days ago
      admissionType: 'Emergency',
      provisionalDiagnosis: 'Acute Coronary Syndrome - Unstable Angina with Grade II Hypertension',
      chiefComplaints: 'Severe retrosternal squeezing chest pain lasting >45 mins, radiation to left jaw and shoulder, diaphoresis',
      status: 'Under Treatment',
      bedAllocation: {
        ward: gw101._id,
        wardName: gw101.wardName,
        roomNumber: gw101.roomNumber,
        bedNumber: 'Bed 1',
        dailyRate: gw101.dailyRate,
        allocatedAt: new Date(Date.now() - 3 * 86400000),
        transferHistory: [],
      },
      initialVitals: {
        bloodPressure: '148/94',
        heartRate: 92,
        temperature: 98.8,
        respiratoryRate: 22,
        spO2: 95,
        weight: 78,
        height: 175,
        bmi: 25.5,
        recordedAt: new Date(Date.now() - 3 * 86400000),
      },
      doctorRounds: [
        {
          roundDate: new Date(Date.now() - 1 * 86400000),
          doctor: doctor1._id,
          clinicalObservations: 'Chest tightness has subsided. S1, S2 audible without gallop or murmur. Bilateral chest clear to auscultation. Vitals improving on dual antiplatelet and statin therapy.',
          patientCondition: 'Improving',
          medicationOrders: [
            { name: 'Aspirin', dosage: '75mg', route: 'Oral', frequency: '1-0-0', instructions: 'After breakfast', status: 'Active' },
            { name: 'Clopidogrel', dosage: '75mg', route: 'Oral', frequency: '0-1-0', instructions: 'After lunch', status: 'Active' },
            { name: 'Atorvastatin', dosage: '40mg', route: 'Oral', frequency: '0-0-1', instructions: 'At bedtime', status: 'Active' },
            { name: 'Metoprolol Succinate', dosage: '25mg', route: 'Oral', frequency: '1-0-0', instructions: 'Morning before food', status: 'Active' },
            { name: 'Enoxaparin (LMWH)', dosage: '0.6ml (60mg)', route: 'Subcutaneous', frequency: 'Q12H', instructions: 'Administer deep subcutaneous in abdominal wall', status: 'Active' },
          ],
          investigationsOrdered: ['Serial Troponin-I at 24h', 'Lipid Profile Fasting', 'Daily 12-lead ECG'],
          dietaryInstructions: 'Strict low salt, low cholesterol, cardiac diabetic diet. Water restriction to 2L/day.',
        },
      ],
      nursingRecords: [
        {
          recordedAt: new Date(Date.now() - 4 * 3600000),
          nurseName: 'Sister Rachel Adams, RN',
          shift: 'Morning',
          vitals: {
            bloodPressure: '128/82',
            heartRate: 74,
            temperature: 98.4,
            respiratoryRate: 18,
            spO2: 98,
            bloodSugar: 118,
          },
          intakeOutput: {
            oralIntakeMl: 800,
            ivFluidsMl: 500,
            urineOutputMl: 950,
            drainOutputMl: 0,
          },
          painScale: 2,
          nursingNotes: 'Patient ambulated within the room without shortness of breath or dizziness. Peripheral IV cannula patent in left forearm. Subcutaneous Enoxaparin administered as per order. Diet tolerated well.',
        },
      ],
      admittedBy: admin._id,
    });

    // Mark Bed 1 in GW-101 as Occupied with currentAdmission
    await WardRoom.updateOne(
      { _id: gw101._id, 'beds.bedNumber': 'Bed 1' },
      {
        $set: {
          'beds.$.status': 'Occupied',
          'beds.$.currentAdmission': demoAdmission._id,
        },
      }
    );

    console.log('[Seeder] Seeding Diagnostic Test Reports & Medical Documents for EMR...');
    const uploadDir = path.join(__dirname, '../../uploads/emr');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write mock sample report files for realistic file viewing/downloading
    const ecgSamplePath = path.join(uploadDir, 'demo_ecg_report.pdf');
    if (!fs.existsSync(ecgSamplePath)) {
      fs.writeFileSync(
        ecgSamplePath,
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT /F1 14 Tf 50 700 Td (MEDCARE HOSPITAL - 12-LEAD ECG REPORT) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n380\n%%EOF'
      );
    }

    const cbcSamplePath = path.join(uploadDir, 'demo_cbc_report.pdf');
    if (!fs.existsSync(cbcSamplePath)) {
      fs.writeFileSync(
        cbcSamplePath,
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT /F1 14 Tf 50 700 Td (MEDCARE HOSPITAL - COMPLETE BLOOD COUNT REPORT) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n380\n%%EOF'
      );
    }

    const xraySamplePath = path.join(uploadDir, 'demo_chest_xray.pdf');
    if (!fs.existsSync(xraySamplePath)) {
      fs.writeFileSync(
        xraySamplePath,
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT /F1 14 Tf 50 700 Td (MEDCARE HOSPITAL - CHEST RADIOGRAPHY REPORT) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n380\n%%EOF'
      );
    }

    // Seed Medical Documents
    await MedicalDocument.create([
      {
        patient: patient1._id,
        patientProfile: patientProfile1._id,
        title: '12-Lead Resting Electrocardiogram (ECG)',
        documentType: 'Diagnostic Report',
        category: 'Cardiology',
        documentDate: new Date(Date.now() - 3 * 86400000),
        facility: 'MedCare Advanced Cardiology Centre',
        doctor: doctor1._id,
        fileUrl: '/uploads/emr/demo_ecg_report.pdf',
        fileName: 'demo_ecg_report.pdf',
        fileType: 'application/pdf',
        fileSize: 15420,
        findings: 'Sinus rhythm at 88 bpm. Symmetric T-wave inversion across precordial leads V2-V5 indicating anterior myocardial ischemia.',
        isAbnormal: true,
        abnormalDetails: 'Ischemic anterior T-wave changes requiring serial troponin tracking and inpatient telemetry monitoring.',
        tags: ['ECG', 'Ischemia', 'Cardiology'],
        notes: 'Correlated with acute chest tightness presentation.',
        uploadedBy: doctor1._id,
      },
      {
        patient: patient1._id,
        patientProfile: patientProfile1._id,
        title: 'Complete Blood Count (CBC) with Automated Differential',
        documentType: 'Pathology / Lab',
        category: 'Pathology',
        documentDate: new Date(Date.now() - 2 * 86400000),
        facility: 'MedCare Central Pathology Laboratory',
        doctor: doctor1._id,
        fileUrl: '/uploads/emr/demo_cbc_report.pdf',
        fileName: 'demo_cbc_report.pdf',
        fileType: 'application/pdf',
        fileSize: 18200,
        findings: 'Hb 14.1 g/dL, WBC 8,200 /mcL, Platelets 240,000 /mcL, ESR 12 mm/hr. All hemogram parameters within normal biological reference intervals.',
        isAbnormal: false,
        tags: ['CBC', 'Hemogram', 'Blood Test'],
        notes: 'Baseline hematology panel clear.',
        uploadedBy: admin._id,
      },
      {
        patient: patient1._id,
        patientProfile: patientProfile1._id,
        title: 'Digital Chest Radiograph (PA View)',
        documentType: 'Radiology / Scan',
        category: 'Radiology',
        documentDate: new Date(Date.now() - 3 * 86400000),
        facility: 'MedCare Department of Radio-Diagnosis',
        doctor: doctor1._id,
        fileUrl: '/uploads/emr/demo_chest_xray.pdf',
        fileName: 'demo_chest_xray.pdf',
        fileType: 'application/pdf',
        fileSize: 24500,
        findings: 'Cardiothoracic ratio normal (<50%). Lung fields clear without active focal consolidation, pleural effusion, or pulmonary congestion.',
        isAbnormal: false,
        tags: ['Chest X-Ray', 'Radiology'],
        notes: 'No acute pulmonary pathology.',
        uploadedBy: admin._id,
      },
      {
        patient: patient2._id,
        patientProfile: patientProfile2._id,
        title: 'Serum Renal Function & Electrolytes Profile',
        documentType: 'Pathology / Lab',
        category: 'Pathology',
        documentDate: new Date(Date.now() - 1 * 86400000),
        facility: 'MedCare Central Pathology Laboratory',
        doctor: doctor2._id,
        fileUrl: '/uploads/emr/demo_cbc_report.pdf',
        fileName: 'demo_cbc_report.pdf',
        fileType: 'application/pdf',
        fileSize: 14600,
        findings: 'Serum Creatinine 0.85 mg/dL, Blood Urea Nitrogen 16 mg/dL, Serum Sodium 139 mEq/L, Serum Potassium 4.2 mEq/L. Normal renal clearance.',
        isAbnormal: false,
        tags: ['RFT', 'Electrolytes', 'Kidney Function'],
        notes: 'Evaluated post hypertensive crisis stabilization.',
        uploadedBy: doctor2._id,
      },
    ]);

    // Update patientProfile1 with treatments & procedures
    patientProfile1.treatments = [
      {
        treatmentName: 'Dual Antiplatelet Therapy (DAPT) Regimen',
        treatmentType: 'Medication Course',
        startDate: new Date(Date.now() - 3 * 86400000),
        outcome: 'Improved',
        notes: 'Aspirin 75mg + Clopidogrel 75mg daily initiated with high-intensity Atorvastatin for plaque stabilization.',
        doctor: doctor1._id,
        department: 'Cardiology',
      },
      {
        treatmentName: 'Coronary Angiography Diagnostic Evaluation',
        treatmentType: 'Diagnostic Intervention',
        startDate: new Date(Date.now() - 2 * 86400000),
        endDate: new Date(Date.now() - 2 * 86400000),
        outcome: 'Successful',
        notes: 'Demonstrated non-obstructive 35% LAD plaque. Conservative medical management recommended over stent intervention.',
        doctor: doctor1._id,
        department: 'Cardiology',
      },
    ];
    await patientProfile1.save();

    // Update patientProfile2 with treatments & procedures
    patientProfile2.treatments = [
      {
        treatmentName: 'Intravenous Labetalol Infusion Protocol',
        treatmentType: 'Medication Course',
        startDate: new Date(Date.now() - 1 * 86400000),
        endDate: new Date(Date.now() - 1 * 86400000),
        outcome: 'Successful',
        notes: 'Target BP <140/90 achieved within 4 hours without neurological or renal compromise.',
        doctor: doctor2._id,
        department: 'Neurology',
      },
    ];
    await patientProfile2.save();

    // ========================================================================
    // 12. PHARMACY INVENTORY, PURCHASES & BILLS
    // ========================================================================
    console.log('[Seeder] Seeding Pharmacy Medicine Inventory & Batches...');
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const med1 = await Medicine.create({
      itemCode: 'MED-1001',
      name: 'Augmentin 625mg Tablet',
      genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
      category: 'Antibiotic',
      dosageForm: 'Tablet',
      strength: '625mg',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals',
      rackLocation: 'Rack A-1, Shelf 3',
      unitPrice: 140.0,
      mrp: 201.5,
      taxPercent: 12,
      reorderLevel: 50,
      description: 'Broad-spectrum antibiotic for bacterial respiratory, skin, and urinary tract infections.',
      batches: [
        {
          batchNumber: 'AUG-2026-A1',
          quantity: 120,
          purchasePrice: 140.0,
          mrp: 201.5,
          manufacturingDate: new Date(now.getTime() - 60 * day),
          expiryDate: new Date(now.getTime() + 450 * day),
          supplier: 'Apex Pharma Logistics Ltd',
        },
        {
          batchNumber: 'AUG-2026-A2',
          quantity: 80,
          purchasePrice: 142.0,
          mrp: 205.0,
          manufacturingDate: new Date(now.getTime() - 20 * day),
          expiryDate: new Date(now.getTime() + 600 * day),
          supplier: 'MedSupply Global Distribution',
        },
      ],
    });

    const med2 = await Medicine.create({
      itemCode: 'MED-1002',
      name: 'Dolo 650mg Tablet',
      genericName: 'Paracetamol',
      category: 'Analgesic / Antipyretic',
      dosageForm: 'Tablet',
      strength: '650mg',
      manufacturer: 'Micro Labs Limited',
      rackLocation: 'Rack A-2, Shelf 1',
      unitPrice: 18.0,
      mrp: 32.0,
      taxPercent: 12,
      reorderLevel: 100,
      description: 'First-line analgesic and antipyretic for relief of fever, headache, and body aches.',
      batches: [
        {
          batchNumber: 'DOLO-2026-88',
          quantity: 450,
          purchasePrice: 18.0,
          mrp: 32.0,
          manufacturingDate: new Date(now.getTime() - 40 * day),
          expiryDate: new Date(now.getTime() + 700 * day),
          supplier: 'Apex Pharma Logistics Ltd',
        },
      ],
    });

    const med3 = await Medicine.create({
      itemCode: 'MED-1003',
      name: 'Glycomet 500mg Tablet',
      genericName: 'Metformin Hydrochloride',
      category: 'Antidiabetic',
      dosageForm: 'Tablet',
      strength: '500mg',
      manufacturer: 'USV Private Limited',
      rackLocation: 'Rack B-1, Shelf 2',
      unitPrice: 22.0,
      mrp: 38.5,
      taxPercent: 12,
      reorderLevel: 60,
      description: 'Biguanide oral hypoglycemic agent for glycemic control in Type 2 Diabetes Mellitus.',
      batches: [
        {
          batchNumber: 'GLY-2026-M1',
          quantity: 210,
          purchasePrice: 22.0,
          mrp: 38.5,
          manufacturingDate: new Date(now.getTime() - 30 * day),
          expiryDate: new Date(now.getTime() + 500 * day),
          supplier: 'MedSupply Global Distribution',
        },
      ],
    });

    const med4 = await Medicine.create({
      itemCode: 'MED-1004',
      name: 'Atorva 20mg Tablet',
      genericName: 'Atorvastatin Calcium',
      category: 'Cardiovascular',
      dosageForm: 'Tablet',
      strength: '20mg',
      manufacturer: 'Zydus Cadila',
      rackLocation: 'Rack B-3, Shelf 1',
      unitPrice: 95.0,
      mrp: 148.0,
      taxPercent: 12,
      reorderLevel: 40,
      description: 'HMG-CoA reductase inhibitor for management of primary hypercholesterolemia and cardiovascular prevention.',
      batches: [
        {
          batchNumber: 'ATV-2026-Z2',
          quantity: 175,
          purchasePrice: 95.0,
          mrp: 148.0,
          manufacturingDate: new Date(now.getTime() - 50 * day),
          expiryDate: new Date(now.getTime() + 480 * day),
          supplier: 'Apex Pharma Logistics Ltd',
        },
      ],
    });

    const med5 = await Medicine.create({
      itemCode: 'MED-1005',
      name: 'Pan 40mg Tablet',
      genericName: 'Pantoprazole Sodium Gastro-resistant',
      category: 'Antacid / PPI',
      dosageForm: 'Tablet',
      strength: '40mg',
      manufacturer: 'Alkem Laboratories Ltd',
      rackLocation: 'Rack C-1, Shelf 4',
      unitPrice: 85.0,
      mrp: 135.0,
      taxPercent: 12,
      reorderLevel: 50,
      description: 'Proton pump inhibitor (PPI) for GERD, peptic ulcer disease, and gastric acid hypersecretion.',
      batches: [
        {
          batchNumber: 'PAN-2026-P4',
          quantity: 280,
          purchasePrice: 85.0,
          mrp: 135.0,
          manufacturingDate: new Date(now.getTime() - 45 * day),
          expiryDate: new Date(now.getTime() + 650 * day),
          supplier: 'Apex Pharma Logistics Ltd',
        },
      ],
    });

    const med6 = await Medicine.create({
      itemCode: 'MED-1006',
      name: 'Asthalin 100mcg Inhaler',
      genericName: 'Salbutamol Inhalation Aerosol',
      category: 'Respiratory',
      dosageForm: 'Inhaler',
      strength: '100mcg / actuation (200 doses)',
      manufacturer: 'Cipla Limited',
      rackLocation: 'Rack D-2, Shelf 2',
      unitPrice: 90.0,
      mrp: 145.0,
      taxPercent: 12,
      reorderLevel: 25,
      description: 'Short-acting beta-2 adrenergic agonist bronchodilator for relief of acute bronchospasm in asthma and COPD.',
      batches: [
        {
          batchNumber: 'AST-2026-C9',
          quantity: 65,
          purchasePrice: 90.0,
          mrp: 145.0,
          manufacturingDate: new Date(now.getTime() - 35 * day),
          expiryDate: new Date(now.getTime() + 380 * day),
          supplier: 'MedSupply Global Distribution',
        },
      ],
    });

    const med7 = await Medicine.create({
      itemCode: 'MED-1007',
      name: 'Monocef 1g Injection',
      genericName: 'Ceftriaxone Sodium Sterile Powder',
      category: 'Emergency / Critical',
      dosageForm: 'Injection',
      strength: '1000mg vial',
      manufacturer: 'Aristo Pharmaceuticals Ltd',
      rackLocation: 'Cold Storage Unit CS-1',
      unitPrice: 42.0,
      mrp: 68.0,
      taxPercent: 12,
      reorderLevel: 30,
      description: 'Third-generation cephalosporin broad-spectrum IV/IM antibiotic for severe inpatient systemic infections.',
      batches: [
        {
          batchNumber: 'MONO-2026-A1',
          quantity: 90,
          purchasePrice: 42.0,
          mrp: 68.0,
          manufacturingDate: new Date(now.getTime() - 15 * day),
          expiryDate: new Date(now.getTime() + 400 * day),
          supplier: 'Apex Pharma Logistics Ltd',
        },
      ],
    });

    const med8 = await Medicine.create({
      itemCode: 'MED-1008',
      name: 'Cetcip 10mg Tablet',
      genericName: 'Cetirizine Dihydrochloride',
      category: 'Antihistamine',
      dosageForm: 'Tablet',
      strength: '10mg',
      manufacturer: 'Cipla Limited',
      rackLocation: 'Rack A-4, Shelf 2',
      unitPrice: 12.0,
      mrp: 24.5,
      taxPercent: 12,
      reorderLevel: 40,
      description: 'Second-generation non-sedating H1 antihistamine for allergic rhinitis, urticaria, and pollen allergies.',
      batches: [
        {
          batchNumber: 'CET-2026-81',
          quantity: 340,
          purchasePrice: 12.0,
          mrp: 24.5,
          manufacturingDate: new Date(now.getTime() - 60 * day),
          expiryDate: new Date(now.getTime() + 800 * day),
          supplier: 'MedSupply Global Distribution',
        },
      ],
    });

    // 9. Low Stock Demo Medicine
    const med9 = await Medicine.create({
      itemCode: 'MED-1009',
      name: 'Azithral 500mg Tablet',
      genericName: 'Azithromycin Dihydrate',
      category: 'Antibiotic',
      dosageForm: 'Tablet',
      strength: '500mg',
      manufacturer: 'Alembic Pharmaceuticals Ltd',
      rackLocation: 'Rack A-3, Shelf 1',
      unitPrice: 65.0,
      mrp: 119.0,
      taxPercent: 12,
      reorderLevel: 50, // stock 18 <= 50 -> Low Stock Alert!
      description: 'Macrolide antibiotic active against atypical respiratory pathogens, chlamydia, and skin infections.',
      batches: [
        {
          batchNumber: 'AZI-2026-LOW',
          quantity: 18,
          purchasePrice: 65.0,
          mrp: 119.0,
          manufacturingDate: new Date(now.getTime() - 90 * day),
          expiryDate: new Date(now.getTime() + 300 * day),
          supplier: 'Apex Pharma Logistics Ltd',
        },
      ],
    });

    // 10. Critical Near-Expiry Demo Medicine (< 30 days)
    const med10 = await Medicine.create({
      itemCode: 'MED-1010',
      name: 'Lantus 100 IU/mL Solostar Pen',
      genericName: 'Insulin Glargine (rDNA origin)',
      category: 'Antidiabetic',
      dosageForm: 'Injection',
      strength: '100 IU/mL (3ml prefilled pen)',
      manufacturer: 'Sanofi Healthcare India Ltd',
      rackLocation: 'Cold Storage Unit CS-2',
      unitPrice: 480.0,
      mrp: 685.0,
      taxPercent: 5,
      reorderLevel: 20,
      description: 'Long-acting basal insulin analogue for once-daily glycemic maintenance in Diabetes Mellitus.',
      batches: [
        {
          batchNumber: 'LAN-2026-EXP30',
          quantity: 14,
          purchasePrice: 480.0,
          mrp: 685.0,
          manufacturingDate: new Date(now.getTime() - 340 * day),
          expiryDate: new Date(now.getTime() + 18 * day), // expires in 18 days!
          supplier: 'Apex Pharma Logistics Ltd',
        },
      ],
    });

    // 11. Expired Batch Demo Medicine
    const med11 = await Medicine.create({
      itemCode: 'MED-1011',
      name: 'Benadryl DR Cough Syrup 100ml',
      genericName: 'Dextromethorphan Hydrobromide',
      category: 'Respiratory',
      dosageForm: 'Syrup',
      strength: '15mg / 5ml (100ml bottle)',
      manufacturer: 'Johnson & Johnson Consumer',
      rackLocation: 'Rack D-1, Shelf 3',
      unitPrice: 72.0,
      mrp: 115.0,
      taxPercent: 12,
      reorderLevel: 20,
      description: 'Antitussive cough suppressant for dry hacking non-productive cough.',
      batches: [
        {
          batchNumber: 'BEN-2025-PAST',
          quantity: 8,
          purchasePrice: 72.0,
          mrp: 115.0,
          manufacturingDate: new Date(now.getTime() - 740 * day),
          expiryDate: new Date(now.getTime() - 12 * day), // expired 12 days ago!
          supplier: 'MedSupply Global Distribution',
        },
      ],
    });

    // 12. Metoprolol Tartrate (Cardiovascular - Matches RX-1001)
    const med12 = await Medicine.create({
      itemCode: 'MED-1012',
      name: 'Betaloc 25mg Tablet',
      genericName: 'Metoprolol Tartrate 25mg',
      category: 'Cardiovascular',
      dosageForm: 'Tablet',
      strength: '25mg',
      manufacturer: 'AstraZeneca Pharma India',
      rackLocation: 'Rack B-2, Shelf 3',
      unitPrice: 38.0,
      mrp: 64.5,
      taxPercent: 12,
      reorderLevel: 40,
      description: 'Selective beta-1 blocker for hypertension, angina pectoris, and tachyarrhythmias.',
      batches: [
        {
          batchNumber: 'BET-2026-M2',
          quantity: 160,
          purchasePrice: 38.0,
          mrp: 64.5,
          manufacturingDate: new Date(now.getTime() - 40 * day),
          expiryDate: new Date(now.getTime() + 600 * day),
          supplier: 'MedSupply Global Distribution',
        },
      ],
    });

    // 13. Coenzyme Q10 (Supplement - Matches RX-1001)
    const med13 = await Medicine.create({
      itemCode: 'MED-1013',
      name: 'Ubicar 100mg Capsule',
      genericName: 'Coenzyme Q10 100mg',
      category: 'Other',
      dosageForm: 'Capsule',
      strength: '100mg',
      manufacturer: 'Fourrts India Laboratories',
      rackLocation: 'Rack C-2, Shelf 1',
      unitPrice: 180.0,
      mrp: 295.0,
      taxPercent: 18,
      reorderLevel: 30,
      description: 'Antioxidant and mitochondrial cofactor for cardiovascular cellular energy support.',
      batches: [
        {
          batchNumber: 'UBI-2026-Q1',
          quantity: 90,
          purchasePrice: 180.0,
          mrp: 295.0,
          manufacturingDate: new Date(now.getTime() - 30 * day),
          expiryDate: new Date(now.getTime() + 420 * day),
          supplier: 'Apex Pharma Logistics Ltd',
        },
      ],
    });

    // Seed Sample Purchases
    console.log('[Seeder] Seeding Sample Medicine Procurement Purchases...');
    await MedicinePurchase.create({
      purchaseNumber: 'PUR-1001',
      supplier: 'Apex Pharma Logistics Ltd',
      supplierContact: 'Ph: +91 99880 11223 | GSTIN: 07AAACA1234F1Z5',
      invoiceNumber: 'INV-APEX-9842',
      purchaseDate: new Date(now.getTime() - 15 * day),
      items: [
        {
          medicine: med1._id,
          medicineName: med1.name,
          batchNumber: 'AUG-2026-A1',
          manufacturingDate: new Date(now.getTime() - 60 * day),
          expiryDate: new Date(now.getTime() + 450 * day),
          quantity: 120,
          unitCost: 140.0,
          mrp: 201.5,
          taxPercent: 12,
          totalCost: 18816.0,
        },
        {
          medicine: med2._id,
          medicineName: med2.name,
          batchNumber: 'DOLO-2026-88',
          manufacturingDate: new Date(now.getTime() - 40 * day),
          expiryDate: new Date(now.getTime() + 700 * day),
          quantity: 450,
          unitCost: 18.0,
          mrp: 32.0,
          taxPercent: 12,
          totalCost: 9072.0,
        },
      ],
      subtotal: 24900.0,
      taxAmount: 2988.0,
      discount: 500.0,
      totalAmount: 27388.0,
      paymentStatus: 'Paid',
      paymentMethod: 'Bank Transfer',
      notes: 'Initial procurement order for inpatient and outpatient pharmacy dispensary.',
      receivedBy: pharmacist._id,
    });

    // Seed Sample Dispensed Pharmacy Bill
    console.log('[Seeder] Seeding Demo Dispensed Pharmacy Bill...');
    await PharmacyBill.create({
      billNumber: 'PHARM-1001',
      billType: 'Outpatient (OPD)',
      patient: patient1._id,
      patientName: patient1.name,
      patientPhone: patient1.phone,
      prescriptionNumber: 'RX-PREV-0988',
      doctorName: 'Dr. Sarah Jenkins',
      items: [
        {
          medicine: med4._id,
          medicineName: med4.name,
          batchNumber: 'ATV-2026-Z2',
          expiryDate: new Date(now.getTime() + 480 * day),
          quantity: 10,
          unitPrice: 148.0,
          taxPercent: 12,
          discountPercent: 5,
          itemTotal: 1574.72,
        },
        {
          medicine: med5._id,
          medicineName: med5.name,
          batchNumber: 'PAN-2026-P4',
          expiryDate: new Date(now.getTime() + 650 * day),
          quantity: 10,
          unitPrice: 135.0,
          taxPercent: 12,
          discountPercent: 5,
          itemTotal: 1436.4,
        },
      ],
      subtotal: 2688.5,
      totalTax: 322.62,
      discount: 100.0,
      netAmount: 2911.12,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI / QR',
      billedBy: pharmacist._id,
      dispensedAt: new Date(now.getTime() - 2 * day),
      notes: 'Dispensed per cardiologist outpatient consultation protocol.',
    });

    // ----------------------------------------------------
    // 12. LABORATORY MANAGEMENT SEEDING
    // ----------------------------------------------------
    console.log('[Seeder] Seeding Master Lab Test Catalog, Orders & Diagnostic Reports...');

    // Master Catalog Tests
    const cbcTest = await LabTestCatalog.create({
      testCode: 'CBC-01',
      testName: 'Complete Blood Count with Differential (CBC)',
      category: 'Hematology',
      department: 'Clinical Hematology',
      sampleType: 'EDTA Whole Blood (Purple Top)',
      sampleVolume: '3 ml',
      fastingRequired: false,
      turnaroundHours: 4,
      price: 450,
      description: 'Comprehensive screening test for anemia, infection, inflammation, and hematological disorders.',
      parameters: [
        { name: 'Hemoglobin', unit: 'g/dL', referenceRange: '13.0 - 17.0', minNormal: 13.0, maxNormal: 17.0, criticalLow: 7.0, criticalHigh: 20.0 },
        { name: 'Total Leukocyte Count (WBC)', unit: '/uL', referenceRange: '4000 - 11000', minNormal: 4000, maxNormal: 11000, criticalLow: 2000, criticalHigh: 30000 },
        { name: 'Platelet Count', unit: '/uL', referenceRange: '150000 - 450000', minNormal: 150000, maxNormal: 450000, criticalLow: 50000, criticalHigh: 1000000 },
        { name: 'Red Blood Cell Count (RBC)', unit: 'million/uL', referenceRange: '4.5 - 5.9', minNormal: 4.5, maxNormal: 5.9, criticalLow: 2.5, criticalHigh: 7.0 },
        { name: 'Hematocrit (PCV)', unit: '%', referenceRange: '40.0 - 50.0', minNormal: 40.0, maxNormal: 50.0, criticalLow: 20.0, criticalHigh: 60.0 },
      ],
    });

    const lftTest = await LabTestCatalog.create({
      testCode: 'LFT-01',
      testName: 'Liver Function Test Panel (LFT)',
      category: 'Biochemistry',
      department: 'Clinical Biochemistry',
      sampleType: 'Serum / Clot Activator (Gold/Red Top)',
      sampleVolume: '5 ml',
      fastingRequired: true,
      turnaroundHours: 6,
      price: 850,
      description: 'Panel assessing hepatic synthetic function, biliary excretion, and hepatocellular integrity.',
      parameters: [
        { name: 'Total Bilirubin', unit: 'mg/dL', referenceRange: '0.2 - 1.2', minNormal: 0.2, maxNormal: 1.2, criticalLow: 0, criticalHigh: 15.0 },
        { name: 'Direct Bilirubin', unit: 'mg/dL', referenceRange: '0.0 - 0.3', minNormal: 0.0, maxNormal: 0.3, criticalLow: 0, criticalHigh: 8.0 },
        { name: 'SGOT (AST)', unit: 'U/L', referenceRange: '10 - 40', minNormal: 10, maxNormal: 40, criticalLow: 0, criticalHigh: 500 },
        { name: 'SGPT (ALT)', unit: 'U/L', referenceRange: '7 - 56', minNormal: 7, maxNormal: 56, criticalLow: 0, criticalHigh: 500 },
        { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', referenceRange: '44 - 147', minNormal: 44, maxNormal: 147, criticalLow: 0, criticalHigh: 600 },
        { name: 'Serum Albumin', unit: 'g/dL', referenceRange: '3.5 - 5.0', minNormal: 3.5, maxNormal: 5.0, criticalLow: 1.5, criticalHigh: 6.5 },
      ],
    });

    const kftTest = await LabTestCatalog.create({
      testCode: 'KFT-01',
      testName: 'Kidney / Renal Function Test Panel (KFT)',
      category: 'Biochemistry',
      department: 'Clinical Biochemistry',
      sampleType: 'Serum (Gold/Red Top)',
      sampleVolume: '4 ml',
      fastingRequired: false,
      turnaroundHours: 6,
      price: 750,
      description: 'Assesses glomerular filtration, nitrogenous waste elimination, and electrolyte balance.',
      parameters: [
        { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', referenceRange: '7.0 - 20.0', minNormal: 7.0, maxNormal: 20.0, criticalLow: 2.0, criticalHigh: 80.0 },
        { name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.7 - 1.3', minNormal: 0.7, maxNormal: 1.3, criticalLow: 0.3, criticalHigh: 6.0 },
        { name: 'Serum Uric Acid', unit: 'mg/dL', referenceRange: '3.5 - 7.2', minNormal: 3.5, maxNormal: 7.2, criticalLow: 1.5, criticalHigh: 12.0 },
        { name: 'Serum Sodium (Na+)', unit: 'mEq/L', referenceRange: '136 - 145', minNormal: 136, maxNormal: 145, criticalLow: 120, criticalHigh: 160 },
        { name: 'Serum Potassium (K+)', unit: 'mEq/L', referenceRange: '3.5 - 5.1', minNormal: 3.5, maxNormal: 5.1, criticalLow: 2.8, criticalHigh: 6.5 },
      ],
    });

    const lipidTest = await LabTestCatalog.create({
      testCode: 'LIPID-01',
      testName: 'Lipid Profile Panel (Fasting)',
      category: 'Biochemistry',
      department: 'Clinical Biochemistry',
      sampleType: 'Serum (Gold Top)',
      sampleVolume: '4 ml',
      fastingRequired: true,
      turnaroundHours: 6,
      price: 650,
      description: 'Cardiovascular risk stratification profiling cholesterol and triglyceride fractions.',
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '125 - 200', minNormal: 125, maxNormal: 200, criticalLow: 80, criticalHigh: 400 },
        { name: 'Triglycerides', unit: 'mg/dL', referenceRange: '40 - 150', minNormal: 40, maxNormal: 150, criticalLow: 20, criticalHigh: 500 },
        { name: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: '40 - 60', minNormal: 40, maxNormal: 60, criticalLow: 20, criticalHigh: 120 },
        { name: 'LDL Cholesterol', unit: 'mg/dL', referenceRange: '0 - 100', minNormal: 0, maxNormal: 100, criticalLow: 0, criticalHigh: 250 },
      ],
    });

    const thyroidTest = await LabTestCatalog.create({
      testCode: 'THYROID-01',
      testName: 'Thyroid Function Profile (T3, T4, TSH)',
      category: 'Immunology & Endocrinology',
      department: 'Endocrinology Lab',
      sampleType: 'Serum (Gold/Red Top)',
      sampleVolume: '4 ml',
      fastingRequired: false,
      turnaroundHours: 8,
      price: 800,
      description: 'Chemiluminescent immunoassay for evaluating hyperthyroidism, hypothyroidism, and pituitary-thyroid axis.',
      parameters: [
        { name: 'Total Triiodothyronine (T3)', unit: 'ng/dL', referenceRange: '80 - 200', minNormal: 80, maxNormal: 200, criticalLow: 40, criticalHigh: 400 },
        { name: 'Total Thyroxine (T4)', unit: 'ug/dL', referenceRange: '5.1 - 14.1', minNormal: 5.1, maxNormal: 14.1, criticalLow: 2.0, criticalHigh: 25.0 },
        { name: 'Thyroid Stimulating Hormone (TSH)', unit: 'uIU/mL', referenceRange: '0.4 - 4.2', minNormal: 0.4, maxNormal: 4.2, criticalLow: 0.05, criticalHigh: 25.0 },
      ],
    });

    const hba1cTest = await LabTestCatalog.create({
      testCode: 'HBA1C-01',
      testName: 'Glycated Hemoglobin (HbA1c) HPLC',
      category: 'Biochemistry',
      department: 'Clinical Biochemistry',
      sampleType: 'EDTA Whole Blood (Purple Top)',
      sampleVolume: '2 ml',
      fastingRequired: false,
      turnaroundHours: 4,
      price: 550,
      description: 'Gold-standard HPLC test reflecting average plasma glucose concentration over the previous 8-12 weeks.',
      parameters: [
        { name: 'HbA1c', unit: '%', referenceRange: '4.0 - 5.6', minNormal: 4.0, maxNormal: 5.6, criticalLow: 3.0, criticalHigh: 14.0 },
        { name: 'Estimated Average Glucose (eAG)', unit: 'mg/dL', referenceRange: '70 - 115', minNormal: 70, maxNormal: 115, criticalLow: 40, criticalHigh: 350 },
      ],
    });

    const urineTest = await LabTestCatalog.create({
      testCode: 'URINE-01',
      testName: 'Routine & Microscopic Urine Examination',
      category: 'Clinical Pathology',
      department: 'Clinical Pathology',
      sampleType: 'Clean Catch Midstream Urine',
      sampleVolume: '20 - 30 ml',
      fastingRequired: false,
      turnaroundHours: 3,
      price: 250,
      description: 'Screening for renal disease, urinary tract infections, calculi, and systemic metabolic abnormalities.',
      parameters: [
        { name: 'Urine pH', unit: '', referenceRange: '5.0 - 7.5', minNormal: 5.0, maxNormal: 7.5, criticalLow: 4.0, criticalHigh: 9.0 },
        { name: 'Specific Gravity', unit: '', referenceRange: '1.005 - 1.030', minNormal: 1.005, maxNormal: 1.030, criticalLow: 1.000, criticalHigh: 1.040 },
        { name: 'Urine Albumin/Protein', unit: '', referenceRange: 'Negative (Nil)', minNormal: null, maxNormal: null, criticalLow: null, criticalHigh: null },
        { name: 'Urine Sugar/Glucose', unit: '', referenceRange: 'Negative (Nil)', minNormal: null, maxNormal: null, criticalLow: null, criticalHigh: null },
        { name: 'Pus Cells (WBCs)', unit: '/hpf', referenceRange: '0 - 5', minNormal: 0, maxNormal: 5, criticalLow: null, criticalHigh: 50 },
        { name: 'Red Blood Cells (RBCs)', unit: '/hpf', referenceRange: '0 - 2', minNormal: 0, maxNormal: 2, criticalLow: null, criticalHigh: 30 },
      ],
    });

    const widalTest = await LabTestCatalog.create({
      testCode: 'WIDAL-01',
      testName: 'Widal Slide Agglutination Test for Enteric Fever',
      category: 'Microbiology & Serology',
      department: 'Medical Microbiology',
      sampleType: 'Serum (Red Top)',
      sampleVolume: '3 ml',
      fastingRequired: false,
      turnaroundHours: 4,
      price: 350,
      description: 'Serological detection of febrile agglutinins against Salmonella enterica serotypes Typhi and Paratyphi.',
      parameters: [
        { name: 'S. Typhi O Antigen Titre', unit: 'Titre', referenceRange: '< 1:80 (Negative)', minNormal: null, maxNormal: null, criticalLow: null, criticalHigh: null },
        { name: 'S. Typhi H Antigen Titre', unit: 'Titre', referenceRange: '< 1:80 (Negative)', minNormal: null, maxNormal: null, criticalLow: null, criticalHigh: null },
        { name: 'S. Paratyphi AH Antigen Titre', unit: 'Titre', referenceRange: '< 1:80 (Negative)', minNormal: null, maxNormal: null, criticalLow: null, criticalHigh: null },
        { name: 'S. Paratyphi BH Antigen Titre', unit: 'Titre', referenceRange: '< 1:80 (Negative)', minNormal: null, maxNormal: null, criticalLow: null, criticalHigh: null },
      ],
    });

    const electroTest = await LabTestCatalog.create({
      testCode: 'ELECTRO-01',
      testName: 'Serum Electrolytes Panel (Na, K, Cl, HCO3)',
      category: 'Biochemistry',
      department: 'Clinical Biochemistry',
      sampleType: 'Serum (Heparin / Clot Tube)',
      sampleVolume: '3 ml',
      fastingRequired: false,
      turnaroundHours: 2,
      price: 600,
      description: 'Ion-selective electrode (ISE) evaluation of vital circulatory electrolytes and acid-base equilibrium.',
      parameters: [
        { name: 'Serum Sodium (Na+)', unit: 'mEq/L', referenceRange: '135 - 145', minNormal: 135, maxNormal: 145, criticalLow: 120, criticalHigh: 160 },
        { name: 'Serum Potassium (K+)', unit: 'mEq/L', referenceRange: '3.5 - 5.2', minNormal: 3.5, maxNormal: 5.2, criticalLow: 2.8, criticalHigh: 6.5 },
        { name: 'Serum Chloride (Cl-)', unit: 'mEq/L', referenceRange: '96 - 106', minNormal: 96, maxNormal: 106, criticalLow: 80, criticalHigh: 125 },
        { name: 'Bicarbonate (HCO3-)', unit: 'mEq/L', referenceRange: '22 - 29', minNormal: 22, maxNormal: 29, criticalLow: 10, criticalHigh: 40 },
      ],
    });

    const troponinTest = await LabTestCatalog.create({
      testCode: 'TROPONIN-01',
      testName: 'High-Sensitivity Cardiac Troponin I (hs-cTnI) STAT',
      category: 'Biochemistry',
      department: 'Critical Care Biochemistry',
      sampleType: 'Heparin Plasma or Serum',
      sampleVolume: '3 ml',
      fastingRequired: false,
      turnaroundHours: 1,
      price: 1200,
      description: 'Ultra-sensitive biomarker for rapid diagnosis and exclusion of acute myocardial infarction (AMI). Critical alert triggers if > 0.04 ng/mL.',
      parameters: [
        { name: 'Cardiac Troponin I (cTnI)', unit: 'ng/mL', referenceRange: '0.00 - 0.04', minNormal: 0.0, maxNormal: 0.04, criticalLow: null, criticalHigh: 0.04 },
      ],
    });

    // Sample Lab Orders & Reports
    // Order 1: LAB-1001 (Completed IPD Order with Verified Report for John Doe)
    const labOrder1 = await LabOrder.create({
      orderNumber: 'LAB-1001',
      orderType: 'Inpatient (IPD)',
      patient: patient1._id,
      patientName: patient1.name,
      patientPhone: patient1.phone,
      patientGender: patient1.gender,
      patientAge: 32,
      referringDoctor: doctor1.name,
      referringDoctorUser: doctor1._id,
      prescriptionNumber: 'RX-1001',
      tests: [
        {
          test: cbcTest._id,
          testCode: cbcTest.testCode,
          testName: cbcTest.testName,
          category: cbcTest.category,
          sampleType: cbcTest.sampleType,
          price: cbcTest.price,
          status: 'Verified / Approved',
        },
        {
          test: kftTest._id,
          testCode: kftTest.testCode,
          testName: kftTest.testName,
          category: kftTest.category,
          sampleType: kftTest.sampleType,
          price: kftTest.price,
          status: 'Verified / Approved',
        },
      ],
      priority: 'Routine',
      sampleDetails: {
        barcode: 'SMP-1001',
        sampleCollectedAt: new Date(now.getTime() - 24 * 3600 * 1000),
        collectedBy: labtech._id,
        collectorName: labtech.name,
        sampleCondition: 'Good / Normal',
        sampleNotes: 'Specimens collected via clean antecubital venipuncture without hemolysis.',
      },
      totalAmount: 1200,
      discount: 0,
      netAmount: 1200,
      billingStatus: 'Paid',
      paymentMethod: 'Insurance / TPA',
      orderStatus: 'Completed',
      clinicalNotes: 'Baseline admission workup for chest heaviness evaluation.',
      bookedBy: receptionist._id,
    });

    // Report for Order 1 Test 1 (CBC)
    const report1 = await LabReport.create({
      reportNumber: 'RPT-LAB-1001',
      labOrder: labOrder1._id,
      orderNumber: labOrder1.orderNumber,
      patient: patient1._id,
      patientName: patient1.name,
      patientGender: patient1.gender,
      patientAge: 32,
      patientPhone: patient1.phone,
      referringDoctor: doctor1.name,
      test: cbcTest._id,
      testCode: cbcTest.testCode,
      testName: cbcTest.testName,
      category: cbcTest.category,
      sampleType: cbcTest.sampleType,
      barcode: 'SMP-1001',
      sampleCollectedAt: new Date(now.getTime() - 24 * 3600 * 1000),
      sampleReceivedAt: new Date(now.getTime() - 23 * 3600 * 1000),
      reportDate: new Date(now.getTime() - 20 * 3600 * 1000),
      results: [
        { parameterName: 'Hemoglobin', value: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', flag: 'Normal', method: 'Cyanmethemoglobin / Automated' },
        { parameterName: 'Total Leukocyte Count (WBC)', value: '7800', unit: '/uL', referenceRange: '4000 - 11000', flag: 'Normal', method: 'Impedance Cell Counter' },
        { parameterName: 'Platelet Count', value: '240000', unit: '/uL', referenceRange: '150000 - 450000', flag: 'Normal', method: 'Automated Laser Counter' },
        { parameterName: 'Red Blood Cell Count (RBC)', value: '4.95', unit: 'million/uL', referenceRange: '4.5 - 5.9', flag: 'Normal', method: 'Automated Cell Counter' },
        { parameterName: 'Hematocrit (PCV)', value: '43.2', unit: '%', referenceRange: '40.0 - 50.0', flag: 'Normal', method: 'Automated Centrifugation' },
      ],
      overallStatus: 'Normal',
      interpretation: 'Normal hematological profile. No evidence of anemia, leukocytosis, or thrombopathy.',
      notes: 'Sample processed on Beckman Coulter DxH 900 automated hematology analyzer.',
      status: 'Verified / Approved',
      enteredBy: labtech._id,
      verifiedBy: labtech._id,
      verifierName: 'Dr. Robert Taylor, MD Pathologist / Lab Director',
      verifiedAt: new Date(now.getTime() - 20 * 3600 * 1000),
      isSyncedToEmr: true,
    });

    // Sync to EMR MedicalDocument
    const emrDoc1 = await MedicalDocument.create({
      documentId: 'EMR-LAB-1001',
      patient: patient1._id,
      patientName: patient1.name,
      title: 'Diagnostic Pathology Report: Complete Blood Count (CBC)',
      category: 'Pathology',
      documentType: 'Pathology / Lab',
      date: new Date(now.getTime() - 20 * 3600 * 1000),
      issuingDoctor: doctor1.name,
      department: 'Clinical Hematology',
      description: `Lab Order LAB-1001 / Report RPT-LAB-1001. Overall Status: Normal. Certified by Dr. Robert Taylor, MD Pathologist.`,
      tags: ['CBC', 'Hematology', 'Lab Report', 'Blood Test'],
      fileUrl: `/lab/reports/${report1._id}`,
      fileName: `RPT-LAB-1001-CBC.pdf`,
      isAbnormal: false,
      uploadedBy: labtech._id,
    });
    report1.emrDocument = emrDoc1._id;
    await report1.save();

    // Order 2: LAB-1002 (In Lab / Processing OPD Order for Emily Clark)
    const labOrder2 = await LabOrder.create({
      orderNumber: 'LAB-1002',
      orderType: 'Outpatient (OPD)',
      patient: patient2._id,
      patientName: patient2.name,
      patientPhone: patient2.phone,
      patientGender: patient2.gender,
      patientAge: 29,
      referringDoctor: doctor1.name,
      referringDoctorUser: doctor1._id,
      tests: [
        {
          test: thyroidTest._id,
          testCode: thyroidTest.testCode,
          testName: thyroidTest.testName,
          category: thyroidTest.category,
          sampleType: thyroidTest.sampleType,
          price: thyroidTest.price,
          status: 'In Lab / Processing',
        },
        {
          test: lipidTest._id,
          testCode: lipidTest.testCode,
          testName: lipidTest.testName,
          category: lipidTest.category,
          sampleType: lipidTest.sampleType,
          price: lipidTest.price,
          status: 'In Lab / Processing',
        },
      ],
      priority: 'Urgent',
      sampleDetails: {
        barcode: 'SMP-1002',
        sampleCollectedAt: new Date(now.getTime() - 2 * 3600 * 1000),
        collectedBy: labtech._id,
        collectorName: labtech.name,
        sampleCondition: 'Good / Normal',
        sampleNotes: 'Patient fasting for 12 hours confirmed prior to phlebotomy.',
      },
      totalAmount: 1450,
      discount: 50,
      netAmount: 1400,
      billingStatus: 'Paid',
      paymentMethod: 'UPI / QR',
      orderStatus: 'In Lab / Processing',
      clinicalNotes: 'Suspected subclinical hypothyroidism and borderline hyperlipidemia investigation.',
      bookedBy: receptionist._id,
    });

    // Order 3: LAB-1003 (STAT Emergency Order with CRITICAL Troponin Alert for John Doe)
    const labOrder3 = await LabOrder.create({
      orderNumber: 'LAB-1003',
      orderType: 'Emergency / STAT',
      patient: patient1._id,
      patientName: patient1.name,
      patientPhone: patient1.phone,
      patientGender: patient1.gender,
      patientAge: 32,
      referringDoctor: doctor1.name,
      referringDoctorUser: doctor1._id,
      tests: [
        {
          test: troponinTest._id,
          testCode: troponinTest.testCode,
          testName: troponinTest.testName,
          category: troponinTest.category,
          sampleType: troponinTest.sampleType,
          price: troponinTest.price,
          status: 'Verified / Approved',
        },
      ],
      priority: 'Emergency / STAT',
      sampleDetails: {
        barcode: 'SMP-1003',
        sampleCollectedAt: new Date(now.getTime() - 45 * 60 * 1000),
        collectedBy: labtech._id,
        collectorName: labtech.name,
        sampleCondition: 'Good / Normal',
        sampleNotes: 'STAT urgent sample collected in cardiac emergency ICU bay.',
      },
      totalAmount: 1200,
      discount: 0,
      netAmount: 1200,
      billingStatus: 'Paid',
      paymentMethod: 'Cash',
      orderStatus: 'Completed',
      clinicalNotes: 'Acute chest pain radiating to left jaw, diaphoresis. Suspected NSTEMI / ACS.',
      bookedBy: doctor1._id,
    });

    // Critical Report for Order 3
    const report3 = await LabReport.create({
      reportNumber: 'RPT-LAB-1003',
      labOrder: labOrder3._id,
      orderNumber: labOrder3.orderNumber,
      patient: patient1._id,
      patientName: patient1.name,
      patientGender: patient1.gender,
      patientAge: 32,
      patientPhone: patient1.phone,
      referringDoctor: doctor1.name,
      test: troponinTest._id,
      testCode: troponinTest.testCode,
      testName: troponinTest.testName,
      category: troponinTest.category,
      sampleType: troponinTest.sampleType,
      barcode: 'SMP-1003',
      sampleCollectedAt: new Date(now.getTime() - 45 * 60 * 1000),
      sampleReceivedAt: new Date(now.getTime() - 35 * 60 * 1000),
      reportDate: new Date(now.getTime() - 15 * 60 * 1000),
      results: [
        {
          parameterName: 'Cardiac Troponin I (cTnI)',
          value: '0.18',
          unit: 'ng/mL',
          referenceRange: '0.00 - 0.04',
          flag: 'Critical',
          method: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
        },
      ],
      overallStatus: 'Critical Panic Alert',
      criticalAlertAcknowledged: false,
      interpretation: 'CRITICAL PANIC VALUE: High-Sensitivity Cardiac Troponin I markedly elevated (0.18 ng/mL vs normal cutoff <= 0.04 ng/mL). Indicates active myocardial injury consistent with Acute Coronary Syndrome (ACS / NSTEMI). Immediate clinical cardiology intervention recommended.',
      notes: 'URGENT: Telephonic critical alert notified to ICU on-duty cardiologist Dr. Sarah Jenkins at ' + new Date().toLocaleTimeString(),
      status: 'Verified / Approved',
      enteredBy: labtech._id,
      verifiedBy: labtech._id,
      verifierName: 'Dr. Robert Taylor, MD Pathologist / Lab Director',
      verifiedAt: new Date(now.getTime() - 15 * 60 * 1000),
      isSyncedToEmr: true,
    });

    const emrDoc3 = await MedicalDocument.create({
      documentId: 'EMR-LAB-1003',
      patient: patient1._id,
      patientName: patient1.name,
      title: '🚨 CRITICAL PANIC REPORT: Cardiac Troponin I (STAT)',
      category: 'Pathology',
      documentType: 'Pathology / Lab',
      date: new Date(now.getTime() - 15 * 60 * 1000),
      issuingDoctor: doctor1.name,
      department: 'Critical Care Biochemistry',
      description: `Lab Order LAB-1003 / Report RPT-LAB-1003. OVERALL STATUS: CRITICAL PANIC ALERT. cTnI: 0.18 ng/mL (High Risk Myocardial Infarction). Certified by Dr. Robert Taylor, MD Pathologist.`,
      tags: ['Troponin', 'STAT', 'Critical Panic Alert', 'Cardiology', 'Lab Report'],
      fileUrl: `/lab/reports/${report3._id}`,
      fileName: `RPT-LAB-1003-TROPONIN-STAT.pdf`,
      isAbnormal: true,
      abnormalDetails: 'CRITICAL PANIC VALUE: Cardiac Troponin I = 0.18 ng/mL (Cutoff <= 0.04 ng/mL). Immediate cardiac intervention initiated.',
      uploadedBy: labtech._id,
    });
    report3.emrDocument = emrDoc3._id;
    await report3.save();

    console.log('\n======================================================');
    console.log('🎉 Seed Accounts, OPD, IPD, EMR, PHARMACY & LAB Created:');
    console.log('------------------------------------------------------');
    console.log('👑 Admin:        admin@hms.local        | Admin@123');
    console.log('🩺 Doctor 1:     doctor@hms.local       | Doctor@123 (DOC-1001, Cardiology, Mon-Fri)');
    console.log('🧠 Doctor 2:     marcus.vance@hms.local | Doctor@123 (DOC-1002, Neurology, Mon/Wed/Fri)');
    console.log('🦴 Doctor 3:     elena.rostova@hms.local| Doctor@123 (DOC-1003, Orthopedics, Tue/Thu/Sat)');
    console.log('📋 Receptionist: receptionist@hms.local | Receptionist@123');
    console.log('💊 Pharmacist:   pharmacist@hms.local   | Pharmacist@123 (Alex Chen, RPh)');
    console.log('🔬 Lab Tech:     labtech@hms.local      | Labtech@123 (Dr. Robert Taylor, MD Pathologist)');
    console.log('🧑‍🦱 Patient 1:    patient@hms.local      | Patient@123 (PAT-1001, O+)');
    console.log('👩 Patient 2:    emily.clark@hms.local  | Patient@123 (PAT-1002, A+)');
    console.log('📅 Appointments: APT-1001, APT-1002, APT-1003, APT-1004');
    console.log('🏥 OPD Visits:   OPD-1001 (Completed + RX-1001), OPD-1002 (Waiting Token #1)');
    console.log('🛏️ IPD Wards:    GW-101, GW-102, ICU-201, CCU-202, SP-301, PVT-401');
    console.log('🛌 IPD Patient:  IPD-1001 (John Doe, GW-101 Bed 1, Under Treatment)');
    console.log('📁 EMR Records:  ECG, CBC, Chest X-Ray & Renal Panel Reports + Treatments');
    console.log('💊 Pharmacy:     13 Medicines (Low Stock & Expired Demos), PUR-1001, PHARM-1001');
    console.log('🔬 Laboratory:   10 Master Tests (CBC, LFT, KFT, TROPONIN), LAB-1001, LAB-1002, LAB-1003 (STAT Critical Alert)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    console.error('\n❌ [Seeder Safety] Blocked: Wiping data in production is disabled to protect database records.');
    console.error('💡 To override this, set ALLOW_PROD_SEED=true.\n');
    process.exit(1);
  }

  try {
    await connectDB();
    const seedEmails = [
      'admin@hms.local',
      'doctor@hms.local',
      'marcus.vance@hms.local',
      'elena.rostova@hms.local',
      'receptionist@hms.local',
      'pharmacist@hms.local',
      'labtech@hms.local',
      'patient@hms.local',
      'emily.clark@hms.local',
    ];
    const users = await User.find({ email: { $in: seedEmails } });
    const ids = users.map((u) => u._id);

    await Appointment.deleteMany({
      $or: [{ patient: { $in: ids } }, { doctor: { $in: ids } }],
    });
    await OpdVisit.deleteMany({
      $or: [{ patient: { $in: ids } }, { doctor: { $in: ids } }],
    });
    await IpdAdmission.deleteMany({});
    await WardRoom.deleteMany({});
    await MedicalDocument.deleteMany({});
    await Medicine.deleteMany({});
    await MedicinePurchase.deleteMany({});
    await PharmacyBill.deleteMany({});
    await LabTestCatalog.deleteMany({});
    await LabOrder.deleteMany({});
    await LabReport.deleteMany({});
    await DoctorProfile.deleteMany({ user: { $in: ids } });
    await PatientProfile.deleteMany({ user: { $in: ids } });
    await User.deleteMany({ email: { $in: seedEmails } });

    console.log('[Seeder] Seed accounts wiped successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  seedData();
}
