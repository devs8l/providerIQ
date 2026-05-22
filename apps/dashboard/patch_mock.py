import re

seed_hospitals = """
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
  ['Rural Healthcare Centre','Dewas','Madhya Pradesh','RURAL',30,2,'NOT_ACCREDITED',None,42.1,45,38,50,40,45,10,'LOW','General Medicine, Pediatrics'],
  ['Guwahati Medical College','Guwahati','Assam','TIER_2',1200,150,'ACCREDITED_PROGRESSIVE','B+',68.9,72,66,62,73,68,38,'MEDIUM','General Medicine, Surgery, Pediatrics']
"""

null = None

parsed = []
for i, line in enumerate(seed_hospitals.strip().split('\n')):
    parts = eval(line.strip().rstrip(','))
    
    parsed.append(
        f"    {{ id: '{i+1}', name: '{parts[0]}', city: '{parts[1]}', state: '{parts[2]}', piiScore: {parts[8]}, bedCount: {parts[4]}, nabhStatus: '{parts[6]}', nabhGrade: '{parts[7]}', trustScore: {parts[9]}, operationalScore: {parts[10]}, billingStabilityScore: {parts[11]}, clinicalQualityScore: {parts[12]}, patientExperienceScore: {parts[13]}, fraudRiskScore: {parts[14]}, fraudRiskLevel: '{parts[15]}', cghsEmpanelled: {str(parts[4] > 200).lower()}, echsEmpanelled: {str(parts[4] > 500).lower()}, abdmReadiness: {str(parts[7] is not None).lower()} }}"
    )

js_array = "  const MOCK_FACS = [\n" + ",\n".join(parsed) + "\n  ];"

with open("src/App.tsx", "r") as f:
    content = f.read()

content = re.sub(r'const MOCK_FACS = \[.*?\];', js_array, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)
