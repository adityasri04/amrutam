import { PrismaClient, UserRole, ConsultationMode } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.refreshToken.deleteMany();
  await prisma.slotLock.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.specialization.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create specializations
  const specializations = [
    {
      name: 'General Ayurveda',
      description: 'General Ayurvedic consultation and treatment',
      icon: '🌿'
    },
    {
      name: 'Panchakarma',
      description: 'Traditional detoxification and purification therapies',
      icon: '🧘'
    },
    {
      name: 'Rasayana',
      description: 'Rejuvenation and anti-aging therapies',
      icon: '✨'
    },
    {
      name: 'Vajikarana',
      description: 'Reproductive health and vitality enhancement',
      icon: '💪'
    },
    {
      name: 'Kayachikitsa',
      description: 'Internal medicine and disease treatment',
      icon: '🏥'
    }
  ];

  const createdSpecializations = await Promise.all(
    specializations.map(spec => 
      prisma.specialization.create({ data: spec })
    )
  );

  console.log('🏥 Created specializations');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@amrutam.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      phone: '+1234567890'
    }
  });

  console.log('👑 Created admin user');

  // Create doctors
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctors = [
    {
      email: 'dr.sharma@amrutam.com',
      firstName: 'Dr. Rajesh',
      lastName: 'Sharma',
      specialization: 'General Ayurveda',
      experience: 15,
      education: ['BAMS', 'MD Ayurveda'],
      certifications: ['Ayurvedic Practitioner', 'Panchakarma Specialist'],
      rating: 4.8,
      totalConsultations: 1250,
      consultationFee: 1500,
      bio: 'Experienced Ayurvedic physician with expertise in general wellness and preventive care.',
      isAvailable: true
    },
    {
      email: 'dr.patel@amrutam.com',
      firstName: 'Dr. Priya',
      lastName: 'Patel',
      specialization: 'Panchakarma',
      experience: 12,
      education: ['BAMS', 'MD Ayurveda'],
      certifications: ['Panchakarma Therapist', 'Yoga Therapist'],
      rating: 4.9,
      totalConsultations: 980,
      consultationFee: 2000,
      bio: 'Specialized in Panchakarma therapies and detoxification treatments.',
      isAvailable: true
    },
    {
      email: 'dr.kumar@amrutam.com',
      firstName: 'Dr. Amit',
      lastName: 'Kumar',
      specialization: 'Rasayana',
      experience: 18,
      education: ['BAMS', 'MD Ayurveda', 'PhD Rasayana'],
      certifications: ['Rasayana Specialist', 'Geriatric Care'],
      rating: 4.7,
      totalConsultations: 2100,
      consultationFee: 2500,
      bio: 'Expert in rejuvenation therapies and anti-aging treatments.',
      isAvailable: true
    },
    {
      email: 'dr.reddy@amrutam.com',
      firstName: 'Dr. Lakshmi',
      lastName: 'Reddy',
      specialization: 'Kayachikitsa',
      experience: 20,
      education: ['BAMS', 'MD Ayurveda'],
      certifications: ['Internal Medicine', 'Chronic Disease Management'],
      rating: 4.6,
      totalConsultations: 1800,
      consultationFee: 1800,
      bio: 'Specialized in treating chronic diseases and internal medicine.',
      isAvailable: true
    }
  ];

  const createdDoctors = await Promise.all(
    doctors.map(async (doctorData) => {
      const { specialization, ...userData } = doctorData;
      return prisma.user.create({
        data: {
          ...userData,
          password: doctorPassword,
          role: UserRole.DOCTOR
        }
      });
    })
  );

  console.log('👨‍⚕️  Created doctors');

  // Create patients
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patients = [
    {
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1987654321',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'MALE' as any,
      medicalHistory: ['Hypertension', 'Diabetes'],
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1987654322',
        relationship: 'Spouse'
      }
    },
    {
      email: 'sarah.wilson@example.com',
      firstName: 'Sarah',
      lastName: 'Wilson',
      phone: '+1555123456',
      dateOfBirth: new Date('1985-08-22'),
      gender: 'FEMALE' as any,
      medicalHistory: ['Asthma', 'Allergies'],
      emergencyContact: {
        name: 'Mike Wilson',
        phone: '+1555123457',
        relationship: 'Husband'
      }
    },
    {
      email: 'michael.chen@example.com',
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '+1777888999',
      dateOfBirth: new Date('1992-12-10'),
      gender: 'MALE' as any,
      medicalHistory: ['Migraine'],
      emergencyContact: {
        name: 'Lisa Chen',
        phone: '+1777888998',
        relationship: 'Sister'
      }
    }
  ];

  const createdPatients = await Promise.all(
    patients.map(patientData => 
      prisma.user.create({
        data: {
          ...patientData,
          password: patientPassword,
          role: 'PATIENT' as any
        }
      })
    )
  );

  console.log('👥 Created patients');

  // Create time slots for doctors (next 7 days)
  const timeSlots = [];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    // Skip weekends (Saturday = 6, Sunday = 0)
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }

    for (const doctor of createdDoctors) {
      // Create slots from 9 AM to 5 PM with 1-hour intervals
      for (let hour = 9; hour < 17; hour++) {
        timeSlots.push({
          doctorId: doctor.id,
          date: currentDate,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          status: 'AVAILABLE' as any
        });
      }
    }
  }

  await prisma.timeSlot.createMany({
    data: timeSlots
  });

  console.log('⏰ Created time slots');

  // Create some sample appointments
  const sampleAppointments = [
    {
      patientId: createdPatients[0].id,
      doctorId: createdDoctors[0].id,
      slotId: (await prisma.timeSlot.findFirst({
        where: { doctorId: createdDoctors[0].id }
      }))!.id,
      status: 'CONFIRMED' as any,
      consultationMode: 'ONLINE' as any,
      symptoms: 'Fatigue and low energy',
      notes: 'Patient reports feeling tired and low on energy for the past few weeks'
    },
    {
      patientId: createdPatients[1].id,
      doctorId: createdDoctors[1].id,
      slotId: (await prisma.timeSlot.findFirst({
        where: { doctorId: createdDoctors[1].id }
      }))!.id,
      status: 'PENDING' as any,
      consultationMode: 'IN_PERSON' as any,
      symptoms: 'Digestive issues',
      notes: 'Patient experiencing bloating and irregular digestion'
    }
  ];

  for (const appointmentData of sampleAppointments) {
    const appointment = await prisma.appointment.create({
      data: appointmentData
    });

    // Update the corresponding slot
    await prisma.timeSlot.update({
      where: { id: appointmentData.slotId },
      data: {
        status: 'BOOKED' as any,
        appointmentId: appointment.id
      }
    });
  }

  console.log('📅 Created sample appointments');

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Sample Data Summary:');
  console.log(`- Admin: ${admin.email} (password: admin123)`);
  console.log(`- Doctors: ${createdDoctors.length} (password: doctor123)`);
  console.log(`- Patients: ${createdPatients.length} (password: patient123)`);
  console.log(`- Specializations: ${createdSpecializations.length}`);
  console.log(`- Time Slots: ${timeSlots.length}`);
  console.log(`- Sample Appointments: ${sampleAppointments.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
