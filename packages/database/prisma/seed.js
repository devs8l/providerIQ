// ProviderIQ — Database Seeding script
// Seeds realistic healthcare facility data for Indian hospitals across Delhi, Mumbai, Indore, Jaipur etc.
// Powered by Inquantic.Ai
import { PrismaClient, NabhStatus, FacilityTier, FacilityType, RiskLevel, SignalCategory } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding ProviderIQ database with realistic Indian hospital data...');
    // Clear existing data
    await prisma.signal.deleteMany({});
    await prisma.claimsRecord.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.newsItem.deleteMany({});
    await prisma.facilityPhysician.deleteMany({});
    await prisma.physician.deleteMany({});
    await prisma.researchRun.deleteMany({});
    await prisma.scoreHistory.deleteMany({});
    await prisma.facility.deleteMany({});
    await prisma.apiKey.deleteMany({});
    // Seed Admin API Key
    await prisma.apiKey.create({
        data: {
            key: 'piq_live_inquantic_admin_secret_key_2026',
            name: 'Inquantic Admin Production Key',
            ownerId: 'inquantic_platform',
            scopes: 'read, write, research, admin',
            isActive: true,
        },
    });
    const facilitiesData = [
        {
            name: 'Medanta - The Medicity',
            nameAliases: 'Medanta Hospital Gurgaon, Medanta Medicity',
            abdmFacilityId: 'IN0610000045',
            nabhAccreditationNo: 'H-2010-0045',
            cghsEmpanelmentId: 'CGHS-GGN-045',
            address: 'CH Baktawar Singh Road, Sector 38',
            city: 'Gurugram',
            state: 'Haryana',
            pincode: '122001',
            latitude: 28.4273,
            longitude: 77.0425,
            tier: FacilityTier.METRO,
            facilityType: FacilityType.HOSPITAL,
            bedCount: 1250,
            icuBeds: 300,
            nicuBeds: 50,
            operatingTheatres: 45,
            specialties: 'Cardiology, Neurology, Oncology, Orthopedics, Gastroenterology, Urology',
            nabhStatus: NabhStatus.ACCREDITED_FULL,
            nabhGrade: 'A+',
            nabhExpiryDate: new Date('2028-12-31'),
            abdmReadiness: true,
            cghsEmpanelled: true,
            echsEmpanelled: true,
            piiScore: 88.5,
            trustScore: 92.0,
            operationalScore: 89.0,
            billingStabilityScore: 85.5,
            clinicalQualityScore: 91.0,
            patientExperienceScore: 84.0,
            fraudRiskScore: 12.0,
            fraudRiskLevel: RiskLevel.LOW,
            scoreUpdatedAt: new Date(),
        },
        {
            name: 'Apollo Hospitals, Indore',
            nameAliases: 'Apollo Indore, Apollo Rajshree Hospital',
            abdmFacilityId: 'IN2310000102',
            nabhAccreditationNo: 'H-2016-0102',
            cghsEmpanelmentId: 'CGHS-IND-102',
            address: 'Sector D, Scheme No 74, Vijay Nagar',
            city: 'Indore',
            state: 'Madhya Pradesh',
            pincode: '452010',
            latitude: 22.7533,
            longitude: 75.8937,
            tier: FacilityTier.TIER_2,
            facilityType: FacilityType.HOSPITAL,
            bedCount: 350,
            icuBeds: 80,
            nicuBeds: 20,
            operatingTheatres: 12,
            specialties: 'Cardiology, Orthopedics, Nephrology, General Surgery, Pediatrics',
            nabhStatus: NabhStatus.ACCREDITED_FULL,
            nabhGrade: 'A',
            nabhExpiryDate: new Date('2027-06-15'),
            abdmReadiness: true,
            cghsEmpanelled: true,
            echsEmpanelled: true,
            piiScore: 84.2,
            trustScore: 86.0,
            operationalScore: 85.0,
            billingStabilityScore: 82.0,
            clinicalQualityScore: 86.0,
            patientExperienceScore: 81.0,
            fraudRiskScore: 15.0,
            fraudRiskLevel: RiskLevel.LOW,
            scoreUpdatedAt: new Date(),
        },
        {
            name: 'Choithram Hospital and Research Centre',
            nameAliases: 'Choithram Hospital Indore, Choithram Research Centre',
            abdmFacilityId: 'IN2310000109',
            nabhAccreditationNo: 'H-2012-0109',
            cghsEmpanelmentId: 'CGHS-IND-109',
            address: 'Manik Bagh Road',
            city: 'Indore',
            state: 'Madhya Pradesh',
            pincode: '452014',
            latitude: 22.6985,
            longitude: 75.8452,
            tier: FacilityTier.TIER_2,
            facilityType: FacilityType.HOSPITAL,
            bedCount: 600,
            icuBeds: 100,
            nicuBeds: 30,
            operatingTheatres: 18,
            specialties: 'General Medicine, General Surgery, Pediatrics, Obstetrics & Gynecology, Ophthalmology',
            nabhStatus: NabhStatus.ACCREDITED_PROGRESSIVE,
            nabhGrade: 'B+',
            nabhExpiryDate: new Date('2026-11-20'),
            abdmReadiness: true,
            cghsEmpanelled: true,
            echsEmpanelled: false,
            piiScore: 67.4,
            trustScore: 72.0,
            operationalScore: 70.0,
            billingStabilityScore: 55.0, // Low due to package variance
            clinicalQualityScore: 74.0,
            patientExperienceScore: 71.0,
            fraudRiskScore: 48.0, // High-ish billing variance
            fraudRiskLevel: RiskLevel.MEDIUM,
            scoreUpdatedAt: new Date(),
        },
        {
            name: 'Apex Hospital, Ujjain',
            nameAliases: 'Apex Ujjain, Apex Hospital',
            abdmFacilityId: 'IN2310000301',
            nabhAccreditationNo: 'H-2020-0301',
            address: 'Freeganj, Madhav Nagar',
            city: 'Ujjain',
            state: 'Madhya Pradesh',
            pincode: '456010',
            latitude: 23.1764,
            longitude: 75.7892,
            tier: FacilityTier.TIER_3,
            facilityType: FacilityType.HOSPITAL,
            bedCount: 150,
            icuBeds: 25,
            nicuBeds: 10,
            operatingTheatres: 4,
            specialties: 'General Medicine, Orthopedics, ENT, Gynecology',
            nabhStatus: NabhStatus.ACCREDITED_ENTRY,
            nabhGrade: 'B',
            nabhExpiryDate: new Date('2027-01-10'),
            abdmReadiness: false,
            cghsEmpanelled: false,
            echsEmpanelled: true,
            piiScore: 61.8,
            trustScore: 65.0,
            operationalScore: 58.0,
            billingStabilityScore: 68.0,
            clinicalQualityScore: 62.0,
            patientExperienceScore: 60.0,
            fraudRiskScore: 22.0,
            fraudRiskLevel: RiskLevel.LOW,
            scoreUpdatedAt: new Date(),
        },
        {
            name: 'Rural Healthcare Centre, Dewas',
            nameAliases: 'Dewas Rural Hospital',
            address: 'Nemawar Road, near bypass',
            city: 'Dewas',
            state: 'Madhya Pradesh',
            pincode: '455001',
            latitude: 22.9624,
            longitude: 76.0592,
            tier: FacilityTier.RURAL,
            facilityType: FacilityType.CLINIC,
            bedCount: 30,
            icuBeds: 2,
            specialties: 'General Medicine, Pediatrics',
            nabhStatus: NabhStatus.NOT_ACCREDITED,
            abdmReadiness: false,
            cghsEmpanelled: false,
            echsEmpanelled: false,
            piiScore: 42.1,
            trustScore: 45.0,
            operationalScore: 38.0,
            billingStabilityScore: 50.0,
            clinicalQualityScore: 40.0,
            patientExperienceScore: 45.0,
            fraudRiskScore: 10.0,
            fraudRiskLevel: RiskLevel.LOW,
            scoreUpdatedAt: new Date(),
        }
    ];
    console.log('Inserting facilities...');
    for (const fac of facilitiesData) {
        const facility = await prisma.facility.create({
            data: fac,
        });
        console.log(`Facility created: ${facility.name} (ID: ${facility.id})`);
        // Add score history Snapshots
        await prisma.scoreHistory.create({
            data: {
                facilityId: facility.id,
                piiScore: facility.piiScore ?? 50.0,
                trustScore: facility.trustScore,
                operationalScore: facility.operationalScore,
                billingStabilityScore: facility.billingStabilityScore,
                clinicalQualityScore: facility.clinicalQualityScore,
                patientExperienceScore: facility.patientExperienceScore,
                fraudRiskScore: facility.fraudRiskScore,
                snapshotReason: 'seeding',
            },
        });
        // Add some realistic signals
        await prisma.signal.createMany({
            data: [
                {
                    facilityId: facility.id,
                    category: SignalCategory.TRUST,
                    dimension: 'nabh_accredited',
                    source: 'NABH',
                    value: fac.nabhStatus !== NabhStatus.NOT_ACCREDITED ? 1.0 : 0.0,
                    valueText: fac.nabhStatus,
                    confidence: 1.0,
                    weight: 2.0,
                },
                {
                    facilityId: facility.id,
                    category: SignalCategory.OPERATIONAL,
                    dimension: 'abdm_readiness',
                    source: 'ABDM',
                    value: fac.abdmReadiness ? 1.0 : 0.0,
                    confidence: 1.0,
                    weight: 1.0,
                },
                {
                    facilityId: facility.id,
                    category: SignalCategory.PATIENT,
                    dimension: 'google_rating',
                    source: 'GOOGLE_MAPS',
                    value: 4.2,
                    confidence: 0.8,
                    weight: 1.0,
                }
            ],
        });
        // Add mock review
        await prisma.review.create({
            data: {
                facilityId: facility.id,
                source: 'GOOGLE',
                rating: 4.0,
                text: 'The facility was exceptionally clean, and the doctor was very descriptive. Highly recommend.',
                themes: 'cleanliness, doctor_expertise',
                sentimentScore: 0.85,
                reviewDate: new Date(),
            },
        });
        // Add mock news item
        await prisma.newsItem.create({
            data: {
                facilityId: facility.id,
                headline: `${facility.name} Expands Super-Specialty Wing in Regional Hub`,
                source: 'Free Press Journal',
                summary: 'A new cardiology block was inaugurated yesterday with state-of-the-art facilities.',
                sentimentScore: 0.7,
                publishedAt: new Date(),
            },
        });
        // Add mock claims record
        await prisma.claimsRecord.create({
            data: {
                facilityId: facility.id,
                dataSource: 'NHCX',
                period: '2026-Q1',
                claimsVolume: 250,
                avgClaimValue: 45000,
                packageAdherenceRate: 0.88,
                topUpFrequency: 0.12,
                avgLengthOfStay: 4.2,
                benchmarkLOS: 3.8,
                billingVarianceScore: 12.5,
            },
        });
    }
    console.log('Database seeding successfully finished!');
}
main()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map