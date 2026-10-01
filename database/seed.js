const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for LDCE Placement Portal (L.D. College of Engineering, Ahmedabad)...');

  // Clean existing data in reverse order of foreign keys
  try {
    await prisma.notificationDeliveryLog.deleteMany();
  } catch (e) {
    // In case model is not generated yet in legacy runs
  }
  await prisma.notification.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.application.deleteMany();
  await prisma.recruitmentDrive.deleteMany();
  await prisma.company.deleteMany();
  await prisma.tenthMarks.deleteMany();
  await prisma.twelfthDetails.deleteMany();
  await prisma.d2DDetails.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.tpoProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcryptjs.hash('Password123!', 10);

  // =========================================================================
  // 1. Central TPO Officer - LDCE Training & Placement Cell
  // Official Placement Cell: Opp. Gujarat University, Navrangpura, Ahmedabad
  // Placement Email: placement@ldce.ac.in | GTU Code: 028 | Estd. 1948
  // =========================================================================
  const tpoUser = await prisma.user.create({
    data: {
      email: 'tpo@placement.edu',
      passwordHash,
      role: 'TPO',
      tpoProfile: {
        create: {
          fullName: 'Prof. A. S. Sharma',
          designation: 'Convener, Training & Placement Cell',
          department: 'Training & Placement Cell, L.D. College of Engineering',
          phone: '+91 79 2630 2887',
        },
      },
    },
  });
  console.log('Created LDCE TPO account: tpo@placement.edu (Prof. A. S. Sharma / Dr. Keyur Hirpara)');

  // =========================================================================
  // 2. Student Cohort (Authentic LDCE Engineering Departments)
  // GTU Code: 028
  // =========================================================================

  // Student 1: Regular - High CGPA, Profile Locked, Verified (Computer Engineering)
  const rahulUser = await prisma.user.create({
    data: {
      email: 'rahul.mehta@student.edu',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          studentType: 'REGULAR',
          enrollmentNumber: '210280107042',
          firstName: 'Rahul',
          middleName: 'K.',
          lastName: 'Mehta',
          department: 'Computer Engineering',
          batchYear: 2025,
          currentSemester: 7,
          currentCgpa: 8.85,
          activeBacklogs: 0,
          totalBacklogs: 0,
          phone: '+91 98251 12345',
          dateOfBirth: new Date('2003-08-15'),
          gender: 'Male',
          address: '42, Shivalik Residency, Drive-in Road, Navrangpura, Ahmedabad, Gujarat - 380054',
          skills: {
            technical: ['React', 'Next.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'Python', 'Docker'],
            soft: ['Problem Solving', 'Technical Presentation', 'Agile Teamwork'],
            languages: ['English', 'Hindi', 'Gujarati'],
            tools: ['Git', 'Postman', 'VS Code', 'GitHub Actions'],
          },
          resumeUrl: '/uploads/resumes/sample-rahul-resume.pdf',
          resumeName: 'Rahul_Mehta_Resume_2025.pdf',
          resumeUpdatedAt: new Date(),
          status: 'LOCKED',
          lockedAt: new Date('2026-08-10'),
          verificationStatus: 'VERIFIED',
          tenthMarks: {
            create: {
              board: 'GSEB',
              schoolName: 'Diwan Ballubhai Secondary School, Paldi, Ahmedabad',
              passingYear: 2019,
              marksObtained: 475.0,
              totalMarks: 500.0,
              percentage: 95.0,
              subjectWiseMarks: [
                { subject: 'Mathematics', marksObtained: 98, maxMarks: 100 },
                { subject: 'Science & Tech', marksObtained: 95, maxMarks: 100 },
                { subject: 'Social Science', marksObtained: 94, maxMarks: 100 },
                { subject: 'English', marksObtained: 92, maxMarks: 100 },
                { subject: 'Gujarati', marksObtained: 96, maxMarks: 100 },
              ],
            },
          },
          twelfthDetails: {
            create: {
              board: 'GHSEB',
              schoolName: 'St. Xaviers High School, Mirzapur, Ahmedabad',
              passingYear: 2021,
              stream: 'Science (PCM)',
              marksObtained: 460.0,
              totalMarks: 500.0,
              percentage: 92.0,
            },
          },
          notifications: {
            create: [
              {
                title: 'TPO Verification Approved',
                message: 'Your academic profile and credentials have been verified by Prof. Sharma (TPO LDCE).',
                type: 'VERIFICATION',
              },
              {
                title: 'TCS National Qualifier Drive Announced',
                message: 'Tata Consultancy Services has opened registrations for Digital Specialist Engineer positions.',
                type: 'DRIVE_ALERT',
              },
            ],
          },
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log('Created Regular student: rahul.mehta@student.edu (LOCKED & VERIFIED, Computer Engg)');

  // Student 2: D2D (Diploma to Degree Lateral Entry) (Information Technology)
  const priyaUser = await prisma.user.create({
    data: {
      email: 'priya.patel@student.edu',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          studentType: 'D2D',
          enrollmentNumber: '220283116018',
          firstName: 'Priya',
          middleName: 'R.',
          lastName: 'Patel',
          department: 'Information Technology',
          batchYear: 2025,
          currentSemester: 7,
          currentCgpa: 7.65,
          activeBacklogs: 0,
          totalBacklogs: 1,
          phone: '+91 97240 56789',
          dateOfBirth: new Date('2002-11-20'),
          gender: 'Female',
          address: 'B-204, Nilkanth Greens, Gandhinagar, Gujarat - 382010',
          skills: {
            technical: ['Java', 'Spring Boot', 'MySQL', 'Angular', 'Linux', 'REST APIs'],
            soft: ['Communication', 'Time Management', 'Critical Thinking'],
            languages: ['English', 'Hindi', 'Gujarati'],
            tools: ['Git', 'IntelliJ IDEA', 'Postman'],
          },
          resumeUrl: '/uploads/resumes/sample-priya-resume.pdf',
          resumeName: 'Priya_Patel_D2D_Resume.pdf',
          resumeUpdatedAt: new Date(),
          status: 'DRAFT',
          verificationStatus: 'PENDING',
          tenthMarks: {
            create: {
              board: 'GSEB',
              schoolName: 'Swaminarayan Gurukul, Ahmedabad',
              passingYear: 2018,
              marksObtained: 420.0,
              totalMarks: 500.0,
              percentage: 84.0,
              subjectWiseMarks: [
                { subject: 'Mathematics', marksObtained: 88, maxMarks: 100 },
                { subject: 'Science & Tech', marksObtained: 82, maxMarks: 100 },
                { subject: 'Social Science', marksObtained: 85, maxMarks: 100 },
                { subject: 'English', marksObtained: 81, maxMarks: 100 },
                { subject: 'Gujarati', marksObtained: 84, maxMarks: 100 },
              ],
            },
          },
          d2dDetails: {
            create: {
              diplomaCollege: 'Government Polytechnic, Ahmedabad',
              diplomaUniversity: 'Gujarat Technological University (GTU)',
              diplomaBranch: 'Information Technology',
              passingYear: 2022,
              diplomaCgpa: 8.4,
              diplomaPercentage: 79.8,
            },
          },
          notifications: {
            create: [
              {
                title: 'Complete Profile Submission',
                message: 'Your profile is currently in DRAFT. Review your diploma marks and lock your profile to finalize TPO verification.',
                type: 'SYSTEM',
              },
            ],
          },
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log('Created D2D student: priya.patel@student.edu (DRAFT, IT)');

  // Student 3: Regular Student with Active Backlogs for testing edge cases
  const amitUser = await prisma.user.create({
    data: {
      email: 'amit.kumar@student.edu',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          studentType: 'REGULAR',
          enrollmentNumber: '210280111089',
          firstName: 'Amit',
          lastName: 'Kumar',
          department: 'Electronics & Communication',
          batchYear: 2025,
          currentSemester: 7,
          currentCgpa: 6.4,
          activeBacklogs: 2,
          totalBacklogs: 3,
          phone: '+91 99099 88776',
          status: 'DRAFT',
          verificationStatus: 'PENDING',
          tenthMarks: {
            create: {
              board: 'CBSE',
              schoolName: 'Kendriya Vidyalaya No. 1, Shahibaug, Ahmedabad',
              passingYear: 2019,
              marksObtained: 340.0,
              totalMarks: 500.0,
              percentage: 68.0,
              subjectWiseMarks: [],
            },
          },
          twelfthDetails: {
            create: {
              board: 'CBSE',
              schoolName: 'Kendriya Vidyalaya No. 1, Shahibaug, Ahmedabad',
              passingYear: 2021,
              stream: 'Science (PCM)',
              marksObtained: 325.0,
              totalMarks: 500.0,
              percentage: 65.0,
            },
          },
        },
      },
    },
  });
  console.log('Created backlogged test student: amit.kumar@student.edu (EC, 2 Backlogs)');

  // Student 4: Mechanical Engineering (Regular, High CGPA, Verified)
  const harshUser = await prisma.user.create({
    data: {
      email: 'harsh.shah@student.edu',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          studentType: 'REGULAR',
          enrollmentNumber: '210280119024',
          firstName: 'Harsh',
          middleName: 'M.',
          lastName: 'Shah',
          department: 'Mechanical Engineering',
          batchYear: 2025,
          currentSemester: 7,
          currentCgpa: 8.2,
          activeBacklogs: 0,
          totalBacklogs: 0,
          phone: '+91 98791 23456',
          gender: 'Male',
          address: '15, Vishwakarma Society, Maninagar, Ahmedabad - 380008',
          skills: {
            technical: ['SolidWorks', 'AutoCAD', 'ANSYS', 'GD&T', 'Thermal Power Systems'],
            soft: ['Leadership', 'Industrial Safety', 'Troubleshooting'],
            languages: ['English', 'Hindi', 'Gujarati'],
            tools: ['MATLAB', 'AutoCAD', 'MS Excel'],
          },
          status: 'LOCKED',
          verificationStatus: 'VERIFIED',
          tenthMarks: {
            create: {
              board: 'GSEB',
              schoolName: 'Nelson High School, Maninagar, Ahmedabad',
              passingYear: 2019,
              marksObtained: 440.0,
              totalMarks: 500.0,
              percentage: 88.0,
              subjectWiseMarks: [],
            },
          },
          twelfthDetails: {
            create: {
              board: 'GHSEB',
              schoolName: 'Nelson Higher Secondary School, Ahmedabad',
              passingYear: 2021,
              stream: 'Science (PCM)',
              marksObtained: 425.0,
              totalMarks: 500.0,
              percentage: 85.0,
            },
          },
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log('Created Mechanical student: harsh.shah@student.edu (LOCKED & VERIFIED)');

  // Student 5: Chemical Engineering (Regular, High CGPA, Verified)
  const anjaliUser = await prisma.user.create({
    data: {
      email: 'anjali.desai@student.edu',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          studentType: 'REGULAR',
          enrollmentNumber: '210280105012',
          firstName: 'Anjali',
          middleName: 'B.',
          lastName: 'Desai',
          department: 'Chemical Engineering',
          batchYear: 2025,
          currentSemester: 7,
          currentCgpa: 8.6,
          activeBacklogs: 0,
          totalBacklogs: 0,
          phone: '+91 97123 45678',
          gender: 'Female',
          address: '702, Sharnam Elegance, Naranpura, Ahmedabad - 380013',
          skills: {
            technical: ['Aspen Plus', 'Process Design', 'Mass Transfer Operations', 'Chemical Safety HAZOP'],
            soft: ['Analytical Thinking', 'Process Documentation'],
            languages: ['English', 'Hindi', 'Gujarati'],
            tools: ['Aspen HYSYS', 'MATLAB', 'MS Office'],
          },
          status: 'LOCKED',
          verificationStatus: 'VERIFIED',
          tenthMarks: {
            create: {
              board: 'CBSE',
              schoolName: 'Udgam School for Children, Thaltej, Ahmedabad',
              passingYear: 2019,
              marksObtained: 465.0,
              totalMarks: 500.0,
              percentage: 93.0,
              subjectWiseMarks: [],
            },
          },
          twelfthDetails: {
            create: {
              board: 'CBSE',
              schoolName: 'Udgam School for Children, Thaltej, Ahmedabad',
              passingYear: 2021,
              stream: 'Science (PCM)',
              marksObtained: 445.0,
              totalMarks: 500.0,
              percentage: 89.0,
            },
          },
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log('Created Chemical student: anjali.desai@student.edu (LOCKED & VERIFIED)');

  // Student 6: Electrical Engineering (Regular, Verified)
  const neilUser = await prisma.user.create({
    data: {
      email: 'neil.pandya@student.edu',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          studentType: 'REGULAR',
          enrollmentNumber: '210280109033',
          firstName: 'Neil',
          middleName: 'R.',
          lastName: 'Pandya',
          department: 'Electrical Engineering',
          batchYear: 2025,
          currentSemester: 7,
          currentCgpa: 7.9,
          activeBacklogs: 0,
          totalBacklogs: 0,
          phone: '+91 98980 11223',
          gender: 'Male',
          address: '34, Gayatri Society, Gotri Road, Vadodara - 390021',
          skills: {
            technical: ['Power System Analysis', 'PLC SCADA Automation', 'MATLAB Simulink', 'High Voltage Engineering'],
            soft: ['Problem Solving', 'Field Operations'],
            languages: ['English', 'Hindi', 'Gujarati'],
            tools: ['ETAP', 'AutoCAD Electrical', 'MATLAB'],
          },
          status: 'LOCKED',
          verificationStatus: 'VERIFIED',
          tenthMarks: {
            create: {
              board: 'GSEB',
              schoolName: 'Bright Day School, Vadodara',
              passingYear: 2019,
              marksObtained: 415.0,
              totalMarks: 500.0,
              percentage: 83.0,
              subjectWiseMarks: [],
            },
          },
          twelfthDetails: {
            create: {
              board: 'GHSEB',
              schoolName: 'Bright Day Higher Secondary School, Vadodara',
              passingYear: 2021,
              stream: 'Science (PCM)',
              marksObtained: 410.0,
              totalMarks: 500.0,
              percentage: 82.0,
            },
          },
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log('Created Electrical student: neil.pandya@student.edu (LOCKED & VERIFIED)');

  // Student 7: AI & Machine Learning (Regular, High CGPA, Verified)
  const dhruvUser = await prisma.user.create({
    data: {
      email: 'dhruv.joshi@student.edu',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          studentType: 'REGULAR',
          enrollmentNumber: '210280132015',
          firstName: 'Dhruv',
          middleName: 'P.',
          lastName: 'Joshi',
          department: 'Artificial Intelligence and Machine Learning',
          batchYear: 2025,
          currentSemester: 7,
          currentCgpa: 9.1,
          activeBacklogs: 0,
          totalBacklogs: 0,
          phone: '+91 97255 44332',
          gender: 'Male',
          address: '22, Nilkanth Villa, Science City Road, Sola, Ahmedabad - 380060',
          skills: {
            technical: ['PyTorch', 'TensorFlow', 'Computer Vision', 'Transformers NLP', 'Python', 'MLOps'],
            soft: ['Research Aptitude', 'Mathematical Rigor'],
            languages: ['English', 'Hindi', 'Gujarati'],
            tools: ['Jupyter', 'Git', 'CUDA', 'Weights & Biases'],
          },
          status: 'LOCKED',
          verificationStatus: 'VERIFIED',
          tenthMarks: {
            create: {
              board: 'CBSE',
              schoolName: 'Delhi Public School, Bopal, Ahmedabad',
              passingYear: 2019,
              marksObtained: 480.0,
              totalMarks: 500.0,
              percentage: 96.0,
              subjectWiseMarks: [],
            },
          },
          twelfthDetails: {
            create: {
              board: 'CBSE',
              schoolName: 'Delhi Public School, Bopal, Ahmedabad',
              passingYear: 2021,
              stream: 'Science (PCM)',
              marksObtained: 470.0,
              totalMarks: 500.0,
              percentage: 94.0,
            },
          },
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log('Created AI & ML student: dhruv.joshi@student.edu (LOCKED & VERIFIED)');

  // Student 8: Civil Engineering (Regular, Verified)
  const poojaUser = await prisma.user.create({
    data: {
      email: 'pooja.patel@student.edu',
      passwordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          studentType: 'REGULAR',
          enrollmentNumber: '210280106028',
          firstName: 'Pooja',
          middleName: 'N.',
          lastName: 'Patel',
          department: 'Civil Engineering',
          batchYear: 2025,
          currentSemester: 7,
          currentCgpa: 8.05,
          activeBacklogs: 0,
          totalBacklogs: 0,
          phone: '+91 98244 55667',
          gender: 'Female',
          address: '501, Aaradhya Enclave, Vastrapur, Ahmedabad - 380015',
          skills: {
            technical: ['STAAD.Pro', 'AutoCAD Civil 3D', 'Structural Design', 'Quantity Surveying', 'BIM'],
            soft: ['Site Supervision', 'Project Estimation'],
            languages: ['English', 'Hindi', 'Gujarati'],
            tools: ['STAAD.Pro', 'AutoCAD', 'MS Project'],
          },
          status: 'LOCKED',
          verificationStatus: 'VERIFIED',
          tenthMarks: {
            create: {
              board: 'GSEB',
              schoolName: 'Ankur Vidhyalaya, Fatehnagar, Ahmedabad',
              passingYear: 2019,
              marksObtained: 430.0,
              totalMarks: 500.0,
              percentage: 86.0,
              subjectWiseMarks: [],
            },
          },
          twelfthDetails: {
            create: {
              board: 'GHSEB',
              schoolName: 'Ankur Higher Secondary School, Ahmedabad',
              passingYear: 2021,
              stream: 'Science (PCM)',
              marksObtained: 420.0,
              totalMarks: 500.0,
              percentage: 84.0,
            },
          },
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log('Created Civil student: pooja.patel@student.edu (LOCKED & VERIFIED)');

  // =========================================================================
  // 3. Genuine LDCE Campus Recruiters
  // Core & Energy: Reliance, L&T, Adani, Torrent Power, Atul
  // IT & Tech: TCS, TatvaSoft, Crest Data Systems, LTTS, Google
  // Semiconductor: Micron Technology
  // =========================================================================

  const tcs = await prisma.company.create({
    data: {
      name: 'Tata Consultancy Services',
      website: 'https://www.tcs.com/careers',
      industry: 'Global IT & Consulting',
      description: 'Tata Group flagship IT services, consulting, and business solutions organization with premier campus at Garima Park, Gandhinagar.',
      logoUrl: 'https://www.tcs.com/favicon.ico',
      contactPerson: 'Kavita Menon (Talent Acquisition - Gujarat)',
      contactEmail: 'campus.gujarat@tcs.com',
      contactPhone: '+91 79 6671 2000',
    },
  });

  const ril = await prisma.company.create({
    data: {
      name: 'Reliance Industries Limited',
      website: 'https://www.ril.com',
      industry: 'Petrochemicals, Energy & Retail',
      description: 'Indias largest private enterprise operating world-scale refining, petrochemical, and green energy complexes across Jamnagar, Hazira, and Dahej.',
      logoUrl: 'https://www.ril.com/favicon.ico',
      contactPerson: 'Siddharth Trivedi (Campus HR Western Region)',
      contactEmail: 'campus.recruitment@ril.com',
      contactPhone: '+91 79 3503 1000',
    },
  });

  const adani = await prisma.company.create({
    data: {
      name: 'Adani Enterprises & Green Energy',
      website: 'https://www.adani.com',
      industry: 'Infrastructure, Energy & Utilities',
      description: 'Global infrastructure and renewable energy conglomerate headquartered at Shantigram, Ahmedabad, powering Indias green transition.',
      logoUrl: 'https://www.adani.com/favicon.ico',
      contactPerson: 'Vikramaditya Solanki (HR Lead - University Relations)',
      contactEmail: 'careers.campus@adani.com',
      contactPhone: '+91 79 2656 5555',
    },
  });

  const torrent = await prisma.company.create({
    data: {
      name: 'Torrent Power',
      website: 'https://www.torrentpower.com',
      industry: 'Power Generation & Distribution',
      description: 'Leading Gujarat-based integrated power utility managing generation and smart distribution across Ahmedabad, Gandhinagar, and Surat.',
      logoUrl: 'https://www.torrentpower.com/favicon.ico',
      contactPerson: 'Bhavin Bhatt (Corporate HR)',
      contactEmail: 'placement@torrentpower.com',
      contactPhone: '+91 79 2662 8000',
    },
  });

  const micron = await prisma.company.create({
    data: {
      name: 'Micron Technology India',
      website: 'https://www.micron.com',
      industry: 'Semiconductors & Microelectronics',
      description: 'World leader in innovative memory and semiconductor manufacturing establishing Indias first mega ATMP semiconductor fab in Sanand, Gujarat.',
      logoUrl: 'https://www.micron.com/favicon.ico',
      contactPerson: 'Ananya Roy (University Talent Lead)',
      contactEmail: 'india-university@micron.com',
      contactPhone: '+91 80 6789 5000',
    },
  });

  const tatvasoft = await prisma.company.create({
    data: {
      name: 'TatvaSoft Software Development',
      website: 'https://www.tatvasoft.com',
      industry: 'Custom Software Engineering & Cloud',
      description: 'CMMI Level 3 & Microsoft Solutions Partner based in Ahmedabad delivering enterprise web, mobile, and cloud software across 36 nations.',
      logoUrl: 'https://www.tatvasoft.com/favicon.ico',
      contactPerson: 'Jignesh Shah (Talent Acquisition Lead)',
      contactEmail: 'careers@tatvasoft.com',
      contactPhone: '+91 79 4050 0600',
    },
  });

  const crest = await prisma.company.create({
    data: {
      name: 'Crest Data Systems',
      website: 'https://www.crestdatasys.com',
      industry: 'Data Analytics, Cybersecurity & Cloud Ops',
      description: 'Premier engineering center in Ahmedabad specializing in integrations with Splunk, Elastic, AWS, and enterprise cybersecurity platforms.',
      logoUrl: 'https://www.crestdatasys.com/favicon.ico',
      contactPerson: 'Kinjal Parikh (Campus Relations)',
      contactEmail: 'jobs@crestdatasys.com',
      contactPhone: '+91 79 6617 8000',
    },
  });

  const ltts = await prisma.company.create({
    data: {
      name: 'L&T Technology Services',
      website: 'https://www.ltts.com',
      industry: 'Engineering & R&D Services',
      description: 'Global leader in engineering research, embedded systems, smart factories, and IoT with major design centers in Vadodara and Bengaluru.',
      logoUrl: 'https://www.ltts.com/favicon.ico',
      contactPerson: 'Nitin Bhatt (Campus Talent Manager)',
      contactEmail: 'campus.ltts@ltts.com',
      contactPhone: '+91 265 670 5000',
    },
  });

  const lnt = await prisma.company.create({
    data: {
      name: 'Larsen & Toubro Limited',
      website: 'https://www.larsentoubro.com',
      industry: 'EPC Engineering & Heavy Civil Construction',
      description: 'Indias foremost technology, engineering, and construction conglomerate building iconic transport and industrial infrastructure.',
      logoUrl: 'https://www.larsentoubro.com/favicon.ico',
      contactPerson: 'Prateek Sharma (Western Region Campus Head)',
      contactEmail: 'construction.campus@larsentoubro.com',
      contactPhone: '+91 22 6752 5656',
    },
  });

  const atul = await prisma.company.create({
    data: {
      name: 'Atul Ltd',
      website: 'https://www.atul.co.in',
      industry: 'Specialty Chemicals & Polymers',
      description: 'Lalbhai Group cornerstone and one of Indias largest integrated chemical manufacturing complexes based in Valsad, Gujarat.',
      logoUrl: 'https://www.atul.co.in/favicon.ico',
      contactPerson: 'Deepak Varma (HR Operations)',
      contactEmail: 'hr@atul.co.in',
      contactPhone: '+91 2632 230000',
    },
  });

  const google = await prisma.company.create({
    data: {
      name: 'Google India',
      website: 'https://careers.google.com',
      industry: 'Software & Cloud Technology',
      description: 'Global leader in search, cloud systems, artificial intelligence, and operating systems.',
      logoUrl: 'https://www.google.com/favicon.ico',
      contactPerson: 'Aditi Deshmukh (University Programs)',
      contactEmail: 'campus-recruitment@google.com',
      contactPhone: '+91 80 6721 8000',
    },
  });

  console.log('Created 11 genuine recruiting partner companies');

  // =========================================================================
  // 4. Authentic Recruitment Drives for LDCE Campus
  // Real CTCs, branches, and Gujarat/National job locations
  // =========================================================================

  // Drive 1: TCS National Qualifier & Prime Recruitment
  const tcsDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: tcs.id,
      title: 'TCS National Qualifier & Prime Recruitment',
      jobRole: 'Digital Specialist Engineer',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 9.0,
      stipendMonthly: null,
      location: 'Ahmedabad / Gandhinagar / Pune',
      description: 'Enterprise full-stack engineering, cloud migration, AI/ML transformation, and digital platform delivery across Fortune 500 client sectors.',
      deadline: new Date('2026-12-10T23:59:59Z'),
      driveDate: new Date('2026-12-15T09:00:00Z'),
      requiredSkills: ['Java', 'Python', 'SQL', 'Web Technologies', 'Problem Solving'],
      minCgpa: 6.5,
      minTenthPercentage: 60.0,
      minTwelfthOrDiplomaPercentage: 60.0,
      maxActiveBacklogs: 1,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: [], // Open to all LDCE engineering branches
    },
  });

  // Drive 2: Reliance Industries GET 2025
  const rilDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: ril.id,
      title: 'Reliance Industries GET Campus Hiring 2025',
      jobRole: 'Graduate Engineer Trainee (Plant Operations & Automation)',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 8.5,
      stipendMonthly: null,
      location: 'Jamnagar Refinery / Hazira / Dahej',
      description: 'Commissioning, digital instrumentation, safety compliance, and operations at the worlds largest grassroots refining and petrochemical manufacturing complexes.',
      deadline: new Date('2026-11-25T18:00:00Z'),
      driveDate: new Date('2026-12-02T09:00:00Z'),
      requiredSkills: ['Process Control', 'Thermodynamics', 'DCS / PLC', 'Industrial Safety', 'Fluid Mechanics'],
      minCgpa: 7.0,
      minTenthPercentage: 70.0,
      minTwelfthOrDiplomaPercentage: 70.0,
      maxActiveBacklogs: 0,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: [
        'Chemical Engineering',
        'Mechanical Engineering',
        'Electrical Engineering',
        'Instrumentation & Control',
      ],
    },
  });

  // Drive 3: Micron Technology - Sanand Fab Semiconductor Engineer
  const micronDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: micron.id,
      title: 'Micron Sanand Semiconductor Mega Fab Recruitment',
      jobRole: 'Associate Semiconductor Process & Equipment Engineer',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 14.5,
      stipendMonthly: null,
      location: 'Sanand Mega Fab, Gujarat',
      description: 'Lead cleanroom assembly, testing, and packaging (ATMP) for advanced memory and storage silicon dies at Microns landmark facility in Sanand, Gujarat.',
      deadline: new Date('2026-11-18T18:00:00Z'),
      driveDate: new Date('2026-11-26T09:30:00Z'),
      requiredSkills: ['Semiconductor Physics', 'Microelectronic Circuits', 'Cleanroom Protocols', 'Data Analysis'],
      minCgpa: 7.5,
      minTenthPercentage: 75.0,
      minTwelfthOrDiplomaPercentage: 75.0,
      maxActiveBacklogs: 0,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: [
        'Electronics & Communication',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Computer Engineering',
      ],
    },
  });

  // Drive 4: Adani Group - Executive Engineer Trainee
  const adaniDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: adani.id,
      title: 'Adani Group Executive Engineer Trainee 2025',
      jobRole: 'Executive Engineer Trainee (Thermal & Renewable Energy)',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 7.2,
      stipendMonthly: null,
      location: 'Ahmedabad Shantigram / Mundra / Khavda Renewable Park',
      description: 'Hands-on engineering across solar and wind gigawatt parks, power transmission corridors, and automated marine port container terminals.',
      deadline: new Date('2026-11-30T17:00:00Z'),
      driveDate: new Date('2026-12-08T09:00:00Z'),
      requiredSkills: ['Power Systems', 'Substation Automation', 'Structural Concrete', 'Thermodynamics'],
      minCgpa: 6.75,
      minTenthPercentage: 65.0,
      minTwelfthOrDiplomaPercentage: 65.0,
      maxActiveBacklogs: 0,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: [
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Chemical Engineering',
      ],
    },
  });

  // Drive 5: Torrent Power GET
  const torrentDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: torrent.id,
      title: 'Torrent Power GET Campus Recruitment 2025',
      jobRole: 'Graduate Engineer Trainee (Smart Grid Operations)',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 6.5,
      stipendMonthly: null,
      location: 'Ahmedabad / Gandhinagar / Surat',
      description: 'Plan, operate, and maintain high-reliability 220kV transmission networks, GIS substations, and automated smart metering infrastructure.',
      deadline: new Date('2026-12-05T18:00:00Z'),
      driveDate: new Date('2026-12-12T10:00:00Z'),
      requiredSkills: ['Power Transmission', 'Relay Protection', 'SCADA', 'Grid Synchronization'],
      minCgpa: 6.5,
      minTenthPercentage: 60.0,
      minTwelfthOrDiplomaPercentage: 60.0,
      maxActiveBacklogs: 0,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: [
        'Electrical Engineering',
        'Mechanical Engineering',
        'Instrumentation & Control',
      ],
    },
  });

  // Drive 6: TatvaSoft Associate Software Developer
  const tatvasoftDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: tatvasoft.id,
      title: 'TatvaSoft Product Engineering 2025',
      jobRole: 'Associate Software Developer (.NET Core / Cloud Solutions)',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 5.5,
      stipendMonthly: null,
      location: 'Ahmedabad (SG Highway)',
      description: 'Build enterprise SaaS solutions and cloud-native microservices using C#, .NET 8, React, and Azure cloud infrastructure.',
      deadline: new Date('2026-11-10T18:00:00Z'),
      driveDate: new Date('2026-11-17T09:30:00Z'),
      requiredSkills: ['C#', '.NET Core', 'SQL Server', 'JavaScript', 'Object Oriented Design'],
      minCgpa: 6.5,
      minTenthPercentage: 60.0,
      minTwelfthOrDiplomaPercentage: 60.0,
      maxActiveBacklogs: 0,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: [
        'Computer Engineering',
        'Information Technology',
        'Artificial Intelligence and Machine Learning',
      ],
    },
  });

  // Drive 7: Crest Data Systems - Associate Software Engineer
  const crestDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: crest.id,
      title: 'Crest Data Systems Campus Drive 2025',
      jobRole: 'Associate Software Engineer (Splunk & Cloud Integrations)',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 7.0,
      stipendMonthly: null,
      location: 'Ahmedabad (Sindhu Bhavan Road)',
      description: 'Develop security information and event management (SIEM) plugins, REST APIs, and automated cloud pipelines for Fortune 500 Silicon Valley partners.',
      deadline: new Date('2026-11-14T23:59:59Z'),
      driveDate: new Date('2026-11-21T09:00:00Z'),
      requiredSkills: ['Python', 'Data Structures', 'Linux', 'REST APIs', 'Cybersecurity Fundamentals'],
      minCgpa: 7.0,
      minTenthPercentage: 70.0,
      minTwelfthOrDiplomaPercentage: 70.0,
      maxActiveBacklogs: 0,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: [
        'Computer Engineering',
        'Information Technology',
        'Artificial Intelligence and Machine Learning',
      ],
    },
  });

  // Drive 8: LTTS Embedded & IoT (needed by test-api-flow)
  const lttsDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: ltts.id,
      title: 'LTTS Embedded & IoT Campus Drive',
      jobRole: 'Graduate Embedded Engineer',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 7.5,
      stipendMonthly: null,
      location: 'Vadodara / Bengaluru',
      description: 'Design and validate firmware for automotive ECUs, medical diagnostic devices, and industrial automation equipment.',
      deadline: new Date('2026-11-05T17:00:00Z'),
      driveDate: new Date('2026-11-12T09:30:00Z'),
      requiredSkills: ['Embedded C', 'Microcontrollers', 'RTOS', 'CAN Bus'],
      minCgpa: 6.5,
      minTenthPercentage: 60.0,
      minTwelfthOrDiplomaPercentage: 60.0,
      maxActiveBacklogs: 1,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: [
        'Electronics & Communication',
        'Electrical Engineering',
        'Instrumentation & Control',
      ],
    },
  });

  // Drive 9: Google India Campus Drive (needed by test-api-flow)
  const googleDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: google.id,
      title: 'Google Campus Drive AY 2024-25',
      jobRole: 'Associate Software Engineer (Core Systems)',
      driveType: 'FULL_TIME',
      status: 'ACTIVE',
      packageLpa: 28.5,
      stipendMonthly: null,
      location: 'Bengaluru / Hyderabad',
      description: 'Design, develop, test, deploy, maintain, and enhance large-scale distributed cloud software solutions. Deep expertise in data structures, algorithms, and system design.',
      deadline: new Date('2026-11-20T23:59:59Z'),
      driveDate: new Date('2026-11-28T09:00:00Z'),
      requiredSkills: ['Data Structures', 'Algorithms', 'C++', 'Java', 'Distributed Systems'],
      minCgpa: 8.0,
      minTenthPercentage: 80.0,
      minTwelfthOrDiplomaPercentage: 80.0,
      maxActiveBacklogs: 0,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: ['Computer Engineering', 'Information Technology'],
    },
  });

  // Drive 10: Closed Drive (needed by test-api-flow)
  const closedDrive = await prisma.recruitmentDrive.create({
    data: {
      companyId: lnt.id,
      title: 'L&T Heavy Civil Infrastructure GET Cohort',
      jobRole: 'Graduate Engineer Trainee (Civil Metro & Elevated Corridors)',
      driveType: 'FULL_TIME',
      status: 'COMPLETED',
      packageLpa: 6.5,
      stipendMonthly: null,
      location: 'Ahmedabad Metro Project / Mumbai',
      description: 'Completed recruitment drive for high-speed rail and elevated metro construction projects across Western India.',
      deadline: new Date('2024-05-01T23:59:59Z'),
      driveDate: new Date('2024-05-15T09:00:00Z'),
      requiredSkills: ['Structural Engineering', 'Concrete Technology', 'Site Surveying'],
      minCgpa: 6.5,
      minTenthPercentage: 60.0,
      minTwelfthOrDiplomaPercentage: 60.0,
      maxActiveBacklogs: 0,
      allowedStudentTypes: ['REGULAR', 'D2D'],
      allowedDepartments: ['Civil Engineering'],
    },
  });

  console.log('Created 10 authentic recruitment drives (9 Active + 1 Completed)');

  // =========================================================================
  // 5. Realistic Student Applications & Selections
  // Ensures test-tpo-flow (Rahul shortlisted for TCS) continues to pass
  // =========================================================================

  // Application 1: Rahul Mehta -> TCS (SHORTLISTED) [Required by test suite]
  await prisma.application.create({
    data: {
      studentProfileId: rahulUser.studentProfile.id,
      recruitmentDriveId: tcsDrive.id,
      status: 'SHORTLISTED',
      notes: 'Cleared Phase 1 online technical assessment. Interview slotted for Round 2 technical review.',
    },
  });

  // Application 2: Rahul Mehta -> TatvaSoft (SELECTED)
  await prisma.application.create({
    data: {
      studentProfileId: rahulUser.studentProfile.id,
      recruitmentDriveId: tatvasoftDrive.id,
      status: 'SELECTED',
      notes: 'Offered Full-Time position on .NET Core / Cloud solutions team with joining July 2025.',
    },
  });

  // Application 3: Harsh Shah -> Reliance Industries (SELECTED)
  await prisma.application.create({
    data: {
      studentProfileId: harshUser.studentProfile.id,
      recruitmentDriveId: rilDrive.id,
      status: 'SELECTED',
      notes: 'Selected for Jamnagar Refining & Petrochemical Complex GET operations batch 2025.',
    },
  });

  // Application 4: Anjali Desai -> Reliance Industries (SHORTLISTED)
  await prisma.application.create({
    data: {
      studentProfileId: anjaliUser.studentProfile.id,
      recruitmentDriveId: rilDrive.id,
      status: 'SHORTLISTED',
      notes: 'Selected for final technical panel interview in Chemical Process Safety.',
    },
  });

  // Application 5: Neil Pandya -> Torrent Power (SELECTED)
  await prisma.application.create({
    data: {
      studentProfileId: neilUser.studentProfile.id,
      recruitmentDriveId: torrentDrive.id,
      status: 'SELECTED',
      notes: 'Selected for Ahmedabad distribution operations and smart grid dispatch.',
    },
  });

  // Application 6: Dhruv Joshi -> Crest Data Systems (SELECTED)
  await prisma.application.create({
    data: {
      studentProfileId: dhruvUser.studentProfile.id,
      recruitmentDriveId: crestDrive.id,
      status: 'SELECTED',
      notes: 'Selected for Data Analytics & Cloud Integration team on Splunk integrations.',
    },
  });

  // Application 7: Pooja Patel -> L&T Heavy Civil (SELECTED)
  await prisma.application.create({
    data: {
      studentProfileId: poojaUser.studentProfile.id,
      recruitmentDriveId: closedDrive.id,
      status: 'SELECTED',
      notes: 'Placed in L&T Heavy Civil IC for Ahmedabad Metro Phase 2 package.',
    },
  });

  console.log('Created realistic student applications across multiple branches');

  // =========================================================================
  // 6. Notification Delivery Logs (Email & SMS Outbox)
  // Demonstrating multi-channel delivery audit trail
  // =========================================================================
  try {
    await prisma.notificationDeliveryLog.createMany({
      data: [
        {
          studentProfileId: rahulUser.studentProfile.id,
          recipientEmail: 'rahul.mehta@student.edu',
          recipientPhone: '+919825112345',
          channel: 'EMAIL',
          status: 'SENT',
          template: 'PROFILE_VERIFIED',
          subject: '[LDCE TPO] Academic Profile Verified - Congratulations',
          body: 'Dear Rahul Mehta, Your academic profile for Computer Engineering (210280107042) has been verified by Prof. Sharma, Convener, TPO LDCE.',
          idempotencyKey: `seed-email-verify-${rahulUser.studentProfile.id}`,
          sentAt: new Date(),
        },
        {
          studentProfileId: rahulUser.studentProfile.id,
          recipientEmail: 'rahul.mehta@student.edu',
          recipientPhone: '+919825112345',
          channel: 'SMS',
          status: 'SENT',
          template: 'SMS_ALERT',
          subject: 'LDCE TPO SMS Alert',
          body: 'LDCE TPO: Dear Rahul, your profile has been verified. You are eligible for active placement drives.',
          idempotencyKey: `seed-sms-verify-${rahulUser.studentProfile.id}`,
          sentAt: new Date(),
        },
        {
          studentProfileId: harshUser.studentProfile.id,
          recipientEmail: 'harsh.shah@student.edu',
          recipientPhone: '+919879123456',
          channel: 'EMAIL',
          status: 'SENT',
          template: 'APPLICANT_SELECTED',
          subject: '[LDCE TPO] Offer Extended: Reliance Industries Limited',
          body: 'Dear Harsh Shah, Congratulations! You have been selected for Graduate Engineer Trainee at Reliance Industries Limited (Jamnagar Refinery).',
          idempotencyKey: `seed-email-select-${harshUser.studentProfile.id}`,
          sentAt: new Date(),
        },
        {
          studentProfileId: priyaUser.studentProfile.id,
          recipientEmail: 'priya.patel@student.edu',
          recipientPhone: '+919724056789',
          channel: 'EMAIL',
          status: 'SENT',
          template: 'SYSTEM_NOTIFICATION',
          subject: '[LDCE TPO] Action Required: Complete Profile Submission',
          body: 'Dear Priya Patel, Your lateral D2D profile is currently in draft. Please lock your profile for TPO compliance verification.',
          idempotencyKey: `seed-email-draft-${priyaUser.studentProfile.id}`,
          sentAt: new Date(),
        },
      ],
    });
    console.log('Created sample notification delivery logs in Outbox');
  } catch (err) {
    console.warn('NotificationDeliveryLog seeding notice:', err.message);
  }

  console.log('LDCE Placement Portal Database successfully seeded with authentic data!');
  console.log('------------------------------------------------------------');
  console.log('Institutional Details:');
  console.log('  College:    L.D. College of Engineering, Ahmedabad');
  console.log('  GTU Code:   028 | Established: 1948');
  console.log('  TPO Cell:   Dr. Keyur Hirpara / Prof. A. S. Sharma');
  console.log('  Email:      placement@ldce.ac.in / tpo@placement.edu');
  console.log('Credentials:');
  console.log('  TPO:        tpo@placement.edu           / Password123!');
  console.log('  Student:    rahul.mehta@student.edu     / Password123! (Computer, Locked, CGPA 8.85)');
  console.log('  Student:    priya.patel@student.edu     / Password123! (IT D2D, Draft, CGPA 7.65)');
  console.log('  Student:    amit.kumar@student.edu      / Password123! (EC, Backlogs, CGPA 6.40)');
  console.log('  Student:    harsh.shah@student.edu      / Password123! (Mechanical, CGPA 8.20)');
  console.log('  Student:    anjali.desai@student.edu    / Password123! (Chemical, CGPA 8.60)');
  console.log('  Student:    neil.pandya@student.edu     / Password123! (Electrical, CGPA 7.90)');
  console.log('  Student:    dhruv.joshi@student.edu     / Password123! (AI & ML, CGPA 9.10)');
  console.log('  Student:    pooja.patel@student.edu     / Password123! (Civil, CGPA 8.05)');
  console.log('------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
