import { PrismaClient, NabhStatus, FacilityTier, FacilityType, RiskLevel, SignalCategory } from '@prisma/client';
const prisma = new PrismaClient();

// Compact hospital data: [name, city, state, tier, beds, icu, nabh, nabhGrade, pii, trust, ops, billing, clinical, patient, fraud, riskLvl, specialties]
type H = [string,string,string,FacilityTier,number,number,NabhStatus,string|null,number,number,number,number,number,number,number,RiskLevel,string];
const hospitals: H[] = [
  ['Medanta - The Medicity','Gurugram','Haryana','METRO',1250,300,'ACCREDITED_FULL','A+',88.5,92,89,85.5,91,84,12,'LOW','Cardiology, Neurology, Oncology, Orthopedics'],
  ['Apollo Hospitals','Indore','Madhya Pradesh','TIER_2',350,80,'ACCREDITED_FULL','A',84.2,86,85,82,86,81,15,'LOW','Cardiology, Orthopedics, Nephrology, Pediatrics'],
  ['Choithram Hospital','Indore','Madhya Pradesh','TIER_2',600,100,'ACCREDITED_PROGRESSIVE','B+',67.4,72,70,55,74,71,48,'MEDIUM','General Medicine, Surgery, Pediatrics, Ophthalmology'],
  ['AIIMS Delhi','New Delhi','Delhi','METRO',2478,500,'ACCREDITED_FULL','A+',95.1,98,93,92,96,88,5,'LOW','All Super Specialties'],
  ['Fortis Memorial Research Institute','Gurugram','Haryana','METRO',1000,250,'ACCREDITED_FULL','A+',90.3,93,91,88,92,86,10,'LOW','Oncology, Neurosciences, Cardiac Sciences'],
  ['Max Super Speciality Hospital','New Delhi','Delhi','METRO',500,120,'ACCREDITED_FULL','A',86.7,88,87,84,88,83,14,'LOW','Cardiac, Neuro, Ortho, Oncology'],
  ['Sir Ganga Ram Hospital','New Delhi','Delhi','METRO',675,150,'ACCREDITED_FULL','A',87.9,90,86,85,89,85,11,'LOW','Gastro, Nephro, Cardiology, Transplant'],
  ['Tata Memorial Hospital','Mumbai','Maharashtra','METRO',629,80,'ACCREDITED_FULL','A+',93.2,95,90,91,95,87,7,'LOW','Oncology, Radiation, Surgical Oncology'],
  ['Kokilaben Dhirubhai Ambani Hospital','Mumbai','Maharashtra','METRO',750,180,'ACCREDITED_FULL','A+',91.4,94,92,89,93,88,9,'LOW','Neuro, Cardiac, Bone Marrow Transplant'],
  ['Lilavati Hospital','Mumbai','Maharashtra','METRO',323,60,'ACCREDITED_FULL','A',82.1,84,80,79,85,80,18,'LOW','Cardiology, Orthopedics, Gastro'],
  ['Narayana Health City','Bengaluru','Karnataka','METRO',800,200,'ACCREDITED_FULL','A+',89.6,91,90,87,91,85,11,'LOW','Cardiac, Neuro, Nephro, Oncology'],
  ['Manipal Hospital Old Airport Road','Bengaluru','Karnataka','METRO',600,140,'ACCREDITED_FULL','A',85.8,87,86,83,87,82,16,'LOW','Multi-specialty, Transplant'],
  ['Apollo Hospitals Greams Road','Chennai','Tamil Nadu','METRO',560,130,'ACCREDITED_FULL','A+',88.1,90,88,86,90,84,13,'LOW','Cardiac, Oncology, Orthopedics'],
  ['MIOT International','Chennai','Tamil Nadu','METRO',600,100,'ACCREDITED_FULL','A',83.5,85,82,81,86,80,17,'LOW','Orthopedics, Trauma, Joint Replacement'],
  ['Christian Medical College','Vellore','Tamil Nadu','TIER_2',2700,350,'ACCREDITED_FULL','A+',94.7,97,92,93,96,90,4,'LOW','All Specialties, Research, Education'],
  ['PGIMER','Chandigarh','Chandigarh','METRO',1900,400,'ACCREDITED_FULL','A+',93.8,96,91,90,95,86,6,'LOW','All Super Specialties, Research'],
  ['Sanjay Gandhi PGIMS','Lucknow','Uttar Pradesh','TIER_2',1100,200,'ACCREDITED_FULL','A',88.4,91,87,85,90,83,13,'LOW','Nephrology, Gastro, Endocrinology'],
  ['Ruby Hall Clinic','Pune','Maharashtra','TIER_2',750,120,'ACCREDITED_FULL','A',84.6,86,84,82,86,81,16,'LOW','Cardiac, Neuro, Transplant'],
  ['Jehangir Hospital','Pune','Maharashtra','TIER_2',350,80,'ACCREDITED_FULL','A',81.2,83,80,78,84,79,19,'LOW','General Medicine, Orthopedics, Oncology'],
  ['Amrita Hospital','Kochi','Kerala','TIER_2',1200,250,'ACCREDITED_FULL','A+',90.8,93,89,88,92,87,10,'LOW','Cardiac, Neuro, Organ Transplant'],
  ['Aster Medcity','Kochi','Kerala','TIER_2',670,140,'ACCREDITED_FULL','A',85.3,87,85,83,87,82,15,'LOW','Cardiac, Oncology, Gastro'],
  ['KIMS Hospital','Hyderabad','Telangana','METRO',1000,200,'ACCREDITED_FULL','A',86.9,89,86,84,88,83,14,'LOW','Cardiac, Liver Transplant, Neuro'],
  ['Yashoda Hospitals','Hyderabad','Telangana','METRO',500,100,'ACCREDITED_FULL','A',82.4,84,81,80,84,79,20,'LOW','Multi-specialty, Emergency Care'],
  ['Care Hospitals','Hyderabad','Telangana','METRO',435,90,'ACCREDITED_FULL','A',80.7,82,79,77,83,78,22,'LOW','Cardiac, Oncology, Nephrology'],
  ['Bombay Hospital','Mumbai','Maharashtra','METRO',750,160,'ACCREDITED_FULL','A',85.1,87,84,83,87,82,15,'LOW','Cardiac, Gastro, Transplant'],
  ['Rajiv Gandhi Cancer Institute','New Delhi','Delhi','METRO',310,60,'ACCREDITED_FULL','A+',91.2,94,88,90,93,85,8,'LOW','Oncology, Radiation, Chemotherapy'],
  ['Sankara Nethralaya','Chennai','Tamil Nadu','METRO',400,40,'ACCREDITED_FULL','A+',89.5,92,87,88,92,86,9,'LOW','Ophthalmology, Eye Care'],
  ['Wockhardt Hospital','Mumbai','Maharashtra','METRO',300,70,'ACCREDITED_FULL','B+',76.8,79,75,73,80,74,28,'LOW','Cardiac, Orthopedics, Neuro'],
  ['Sterling Hospital','Ahmedabad','Gujarat','TIER_2',400,80,'ACCREDITED_FULL','A',81.5,83,80,79,84,78,21,'LOW','Cardiac, Kidney, IVF'],
  ['HCG Cancer Centre','Bengaluru','Karnataka','METRO',250,50,'ACCREDITED_FULL','A',84.3,87,82,83,86,80,16,'LOW','Oncology, Radiation, Immunotherapy'],
  ['Breach Candy Hospital','Mumbai','Maharashtra','METRO',200,45,'ACCREDITED_FULL','A',83.7,86,81,82,85,81,17,'LOW','General Medicine, Cardiology'],
  ['Jaslok Hospital','Mumbai','Maharashtra','METRO',364,80,'ACCREDITED_FULL','A',82.9,85,81,80,85,80,18,'LOW','Neuro, Cardiac, Transplant'],
  ['Nanavati Max Hospital','Mumbai','Maharashtra','METRO',350,90,'ACCREDITED_FULL','A',81.6,84,80,78,83,79,20,'LOW','Multi-specialty, Trauma'],
  ['BLK-Max Super Speciality Hospital','New Delhi','Delhi','METRO',700,150,'ACCREDITED_FULL','A',85.4,88,84,83,87,82,15,'LOW','Bone Marrow Transplant, Oncology'],
  ['Fortis Escorts Heart Institute','New Delhi','Delhi','METRO',310,80,'ACCREDITED_FULL','A+',88.9,91,87,87,90,85,12,'LOW','Cardiac Surgery, Interventional Cardiology'],
  ['Artemis Hospital','Gurugram','Haryana','METRO',400,100,'ACCREDITED_FULL','A',83.2,85,82,80,85,80,19,'LOW','Cardiac, Neuro, Robotic Surgery'],
  ['Indraprastha Apollo','New Delhi','Delhi','METRO',710,160,'ACCREDITED_FULL','A+',87.6,90,86,85,89,84,13,'LOW','All Super Specialties, Transplant'],
  ['SMS Hospital','Jaipur','Rajasthan','TIER_2',1500,200,'ACCREDITED_PROGRESSIVE','B+',71.3,74,69,65,76,70,35,'MEDIUM','General Medicine, Trauma, Orthopedics'],
  ['Mahatma Gandhi Hospital','Jaipur','Rajasthan','TIER_2',800,120,'ACCREDITED_FULL','A',78.5,80,77,75,81,76,25,'LOW','Multi-specialty, Teaching Hospital'],
  ['NIMHANS','Bengaluru','Karnataka','METRO',897,150,'ACCREDITED_FULL','A+',92.1,95,89,90,94,86,7,'LOW','Neurology, Psychiatry, Neurosurgery'],
  ['Kidwai Memorial Institute','Bengaluru','Karnataka','METRO',350,60,'ACCREDITED_FULL','A',80.9,83,78,77,84,77,23,'LOW','Oncology, Radiation'],
  ['Command Hospital Pune','Pune','Maharashtra','TIER_2',1000,180,'ACCREDITED_FULL','A',84.7,87,83,82,86,81,14,'LOW','Defence Medical, Multi-specialty'],
  ['Apex Hospital','Ujjain','Madhya Pradesh','TIER_3',150,25,'ACCREDITED_ENTRY','B',61.8,65,58,68,62,60,22,'LOW','General Medicine, Orthopedics, ENT'],
  ['Medica Superspecialty Hospital','Kolkata','West Bengal','METRO',500,120,'ACCREDITED_FULL','A',82.6,84,81,79,84,80,19,'LOW','Cardiac, Neuro, Kidney Transplant'],
  ['AMRI Hospital','Kolkata','West Bengal','METRO',400,90,'ACCREDITED_FULL','A',80.4,82,79,77,83,78,21,'LOW','Cardiac, Gastro, Orthopedics'],
  ['Kalinga Institute of Medical Sciences','Bhubaneswar','Odisha','TIER_2',2000,300,'ACCREDITED_FULL','A',83.1,85,82,80,85,79,18,'LOW','Multi-specialty, Teaching, Research'],
  ['Ganga Hospital','Coimbatore','Tamil Nadu','TIER_2',450,80,'ACCREDITED_FULL','A',84.9,87,83,82,87,81,15,'LOW','Orthopedics, Trauma, Spine Surgery'],
  ['Meenakshi Mission Hospital','Madurai','Tamil Nadu','TIER_2',600,100,'ACCREDITED_FULL','A',81.7,83,80,79,84,78,20,'LOW','Cardiac, Neuro, Gastro'],
  ['Rural Healthcare Centre','Dewas','Madhya Pradesh','RURAL',30,2,'NOT_ACCREDITED',null,42.1,45,38,50,40,45,10,'LOW','General Medicine, Pediatrics'],
  ['Guwahati Medical College','Guwahati','Assam','TIER_2',1200,150,'ACCREDITED_PROGRESSIVE','B+',68.9,72,66,62,73,68,38,'MEDIUM','General Medicine, Surgery, Pediatrics'],
];

const reviews = [
  'Excellent care and very professional staff. The doctors explained everything clearly.',
  'Good hospital but billing was confusing. Had to follow up multiple times for discharge summary.',
  'Clean facility, modern equipment. Wait times were reasonable for OPD.',
  'Emergency department was responsive. Admitted within 30 minutes of arrival.',
  'Doctors are knowledgeable but support staff could be more attentive.',
  'World-class treatment. The cardiac team saved my father\'s life.',
  'Average experience. Room was clean but food quality was poor.',
  'Outstanding surgical team. Post-operative care was thorough and attentive.',
];
const newsSrc = ['Times of India','NDTV Health','The Hindu','Economic Times','Indian Express','Mint','Free Press Journal','Business Standard'];
const headlines = [
  ['Expands Super-Specialty Wing','New cardiology block inaugurated with state-of-the-art catheterization labs.'],
  ['Launches AI-Powered Diagnostics','Hospital adopts AI radiology tool for faster CT scan analysis.'],
  ['Receives JCI Accreditation','International quality certification demonstrates commitment to patient safety.'],
  ['Partners with Govt for Ayushman Bharat','Now accepts PM-JAY beneficiaries for cashless treatment.'],
  ['Opens Robotic Surgery Centre','Da Vinci Xi system installed for minimally invasive procedures.'],
];

async function main() {
  console.log('Seeding 50 pan-India hospitals...');
  await prisma.signal.deleteMany({}); await prisma.claimsRecord.deleteMany({});
  await prisma.review.deleteMany({}); await prisma.newsItem.deleteMany({});
  await prisma.facilityPhysician.deleteMany({}); await prisma.physician.deleteMany({});
  await prisma.researchRun.deleteMany({}); await prisma.scoreHistory.deleteMany({});
  await prisma.facility.deleteMany({}); await prisma.apiKey.deleteMany({});

  await prisma.apiKey.create({ data: { key: 'piq_live_inquantic_admin_secret_key_2026', name: 'Inquantic Admin', ownerId: 'inquantic_platform', scopes: 'read,write,research,admin', isActive: true } });

  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    const fac = await prisma.facility.create({ data: {
      name: h[0], city: h[1], state: h[2], tier: h[3] as FacilityTier, bedCount: h[4], icuBeds: h[5],
      nabhStatus: h[6] as NabhStatus, nabhGrade: h[7], address: `${h[1]} Medical District`,
      specialties: h[16], facilityType: FacilityType.HOSPITAL,
      abdmReadiness: h[7] !== null, cghsEmpanelled: h[4] > 200, echsEmpanelled: h[4] > 500,
      piiScore: h[8], trustScore: h[9], operationalScore: h[10], billingStabilityScore: h[11],
      clinicalQualityScore: h[12], patientExperienceScore: h[13], fraudRiskScore: h[14],
      fraudRiskLevel: h[15] as RiskLevel, scoreUpdatedAt: new Date(),
    }});
    console.log(`  [${i+1}/50] ${fac.name}`);

    await prisma.scoreHistory.create({ data: {
      facilityId: fac.id, piiScore: h[8], trustScore: h[9], operationalScore: h[10],
      billingStabilityScore: h[11], clinicalQualityScore: h[12], patientExperienceScore: h[13],
      fraudRiskScore: h[14], snapshotReason: 'seeding',
    }});

    await prisma.signal.createMany({ data: [
      { facilityId: fac.id, category: SignalCategory.TRUST, dimension: 'nabh_accredited', source: 'NABH', value: h[6] !== 'NOT_ACCREDITED' ? 1 : 0, valueText: h[6], confidence: 1, weight: 2 },
      { facilityId: fac.id, category: SignalCategory.TRUST, dimension: 'cghs_empanelled', source: 'CGHS', value: h[4] > 200 ? 1 : 0, confidence: 1, weight: 1.5 },
      { facilityId: fac.id, category: SignalCategory.OPERATIONAL, dimension: 'abdm_readiness', source: 'ABDM', value: h[7] !== null ? 1 : 0, confidence: 1, weight: 1 },
      { facilityId: fac.id, category: SignalCategory.PATIENT, dimension: 'google_maps_rating', source: 'GOOGLE_MAPS', value: 3.5 + Math.random() * 1.5, confidence: 0.8, weight: 1 },
      { facilityId: fac.id, category: SignalCategory.PATIENT, dimension: 'practo_rating', source: 'PRACTO', value: 3 + Math.random() * 2, confidence: 0.7, weight: 0.8 },
      { facilityId: fac.id, category: SignalCategory.BILLING, dimension: 'claims_variance', source: 'NHCX', value: h[14] / 100, confidence: 0.9, weight: 1.5 },
      { facilityId: fac.id, category: SignalCategory.CLINICAL, dimension: 'physician_nmc_verified', source: 'NMC', value: 0.7 + Math.random() * 0.3, confidence: 0.85, weight: 1.2 },
    ]});

    const ri = i % reviews.length;
    await prisma.review.create({ data: { facilityId: fac.id, source: i % 2 === 0 ? 'GOOGLE_MAPS' : 'PRACTO', rating: 3.5 + Math.random() * 1.5, text: reviews[ri], themes: 'cleanliness,staff,billing', sentimentScore: 0.6 + Math.random() * 0.35, reviewDate: new Date() } });
    const ni = i % headlines.length;
    await prisma.newsItem.create({ data: { facilityId: fac.id, headline: `${fac.name} ${headlines[ni][0]}`, source: newsSrc[i % newsSrc.length], summary: headlines[ni][1], sentimentScore: 0.5 + Math.random() * 0.4, publishedAt: new Date() } });
    await prisma.claimsRecord.create({ data: { facilityId: fac.id, dataSource: 'NHCX', period: '2026-Q1', claimsVolume: 100 + Math.floor(Math.random() * 500), avgClaimValue: 20000 + Math.floor(Math.random() * 60000), packageAdherenceRate: 0.7 + Math.random() * 0.25, topUpFrequency: Math.random() * 0.3, avgLengthOfStay: 2.5 + Math.random() * 4, benchmarkLOS: 3.8, billingVarianceScore: h[14] * 0.3 } });
  }
  console.log('Done! 50 hospitals seeded.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
