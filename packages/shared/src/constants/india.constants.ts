// ProviderIQ — India-Specific Constants

/** Indian states and union territories */
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

/** Major cities classified by tier */
export const CITY_TIER_MAP: Record<string, 'METRO' | 'TIER_2' | 'TIER_3'> = {
  // Metro
  'Delhi': 'METRO', 'Mumbai': 'METRO', 'Kolkata': 'METRO',
  'Chennai': 'METRO', 'Bangalore': 'METRO', 'Hyderabad': 'METRO',
  'Pune': 'METRO', 'Ahmedabad': 'METRO',

  // Tier 2
  'Jaipur': 'TIER_2', 'Lucknow': 'TIER_2', 'Kanpur': 'TIER_2',
  'Nagpur': 'TIER_2', 'Indore': 'TIER_2', 'Bhopal': 'TIER_2',
  'Visakhapatnam': 'TIER_2', 'Patna': 'TIER_2', 'Vadodara': 'TIER_2',
  'Ludhiana': 'TIER_2', 'Agra': 'TIER_2', 'Nashik': 'TIER_2',
  'Ranchi': 'TIER_2', 'Coimbatore': 'TIER_2', 'Chandigarh': 'TIER_2',
  'Mysuru': 'TIER_2', 'Guwahati': 'TIER_2', 'Bhubaneswar': 'TIER_2',
  'Thiruvananthapuram': 'TIER_2', 'Kochi': 'TIER_2',
  'Dehradun': 'TIER_2', 'Amritsar': 'TIER_2', 'Raipur': 'TIER_2',
  'Jodhpur': 'TIER_2', 'Madurai': 'TIER_2', 'Gwalior': 'TIER_2',
  'Jabalpur': 'TIER_2', 'Surat': 'TIER_2', 'Varanasi': 'TIER_2',

  // Tier 3 (representative)
  'Ujjain': 'TIER_3', 'Dewas': 'TIER_3', 'Sagar': 'TIER_3',
  'Satna': 'TIER_3', 'Rewa': 'TIER_3', 'Cuttack': 'TIER_3',
  'Guntur': 'TIER_3', 'Nellore': 'TIER_3', 'Bikaner': 'TIER_3',
  'Ajmer': 'TIER_3', 'Aligarh': 'TIER_3', 'Gorakhpur': 'TIER_3',
  'Siliguri': 'TIER_3', 'Jhansi': 'TIER_3', 'Dhanbad': 'TIER_3',
} as const;

/** NABH accreditation grades */
export const NABH_GRADES = {
  ENTRY: { label: 'Entry Level', weight: 1.0 },
  FULL: { label: 'Full Accreditation', weight: 1.5 },
  PROGRESSIVE: { label: 'Progressive', weight: 1.2 },
} as const;

/** Medical specialties taxonomy */
export const MEDICAL_SPECIALTIES = [
  'General Medicine', 'General Surgery', 'Cardiology', 'Cardiothoracic Surgery',
  'Orthopedics', 'Neurology', 'Neurosurgery', 'Oncology', 'Pediatrics',
  'Obstetrics & Gynecology', 'Ophthalmology', 'ENT', 'Dermatology',
  'Urology', 'Nephrology', 'Gastroenterology', 'Pulmonology',
  'Endocrinology', 'Rheumatology', 'Psychiatry', 'Anesthesiology',
  'Radiology', 'Pathology', 'Emergency Medicine', 'Critical Care',
  'Plastic Surgery', 'Dental', 'Physiotherapy', 'Ayurveda', 'Homeopathy',
] as const;

/** Review theme taxonomy for sentiment extraction */
export const REVIEW_THEMES = [
  'billing_dispute', 'overcharged', 'hidden_charges', 'insurance_issues',
  'long_wait', 'appointment_delay', 'emergency_delay',
  'rude_staff', 'helpful_staff', 'nursing_care', 'doctor_expertise',
  'cleanliness', 'hygiene', 'food_quality', 'room_quality',
  'treatment_quality', 'misdiagnosis', 'negligence',
  'discharge_process', 'follow_up', 'communication',
  'parking', 'location', 'ambulance',
] as const;
