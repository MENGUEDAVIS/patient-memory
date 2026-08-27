Act as a senior product team composed of:

- Healthcare Product Manager
- Electronic Health Record (EHR) Architect
- Hospital Management Systems Expert
- Senior Full-Stack Engineer
- UX/UI Designer specialized in healthcare
- Cybersecurity Architect
- Data Engineer
- AI/ML Engineer
- Health-Tech Business Analyst

Your mission is to design and build a production-quality MVP of a B2B healthcare software platform for hospitals.

==================================================
1. PRODUCT VISION
==================================================

We are building a Hospital EHR & Clinical Intelligence Platform.

Core problem:

"Lost, Missing, or Fragmented Medical Histories Put Patients' Lives at Risk and Expose Hospitals to Clinical, Financial, Legal, and Reputational Losses."

Hospital value proposition:

"We give hospitals a complete digital memory of every patient and a transparent record of every clinical interaction—reducing clinical risk while protecting revenue and accountability."

The MVP must focus ONLY on three pillars:

1. PATIENT EHR
2. CLINICAL ACCOUNTABILITY
3. HOSPITAL INTELLIGENCE

Do NOT attempt to build a complete Hospital ERP.

The MVP should be simple enough to implement quickly, but polished enough to demonstrate to investors and pilot hospitals.

==================================================
2. CORE PRODUCT CONCEPT
==================================================

Every patient receives a Unique Patient Health ID.

Example:

PAT-00018492

The platform creates a longitudinal digital medical record containing:

- Patient demographic information
- Medical history
- Allergies
- Chronic conditions
- Previous consultations
- Clinical observations
- Diagnoses
- Prescriptions
- Laboratory orders
- Laboratory results
- Pharmacy dispensing records
- Follow-up information

Every clinical interaction must be associated with:

- Patient
- Hospital
- Healthcare professional
- Role
- Date
- Time
- Activity
- Encounter

The platform must therefore answer:

"Who accessed this patient's record?"
"When?"
"Why?"
"What did they do?"
"What information did they create or modify?"

==================================================
3. PRIMARY USERS
==================================================

Implement these roles:

1. HOSPITAL ADMINISTRATOR
2. MEDICAL DIRECTOR
3. DOCTOR
4. LABORATORY OPERATOR
5. PHARMACIST
6. PATIENT

Use role-based access control.

Users must NEVER see information outside their authorized role.

==================================================
4. HEALTHCARE PROFESSIONAL VERIFICATION
==================================================

Create a healthcare professional verification workflow.

Every medical operator must have:

- Full name
- Profile photo
- Professional role
- Professional ID
- Qualification
- License/registration information
- Identification document status
- Professional verification status
- Hospital affiliation
- Hospital approval status

Possible states:

PENDING
VERIFIED
REJECTED
SUSPENDED

A doctor can be professionally verified but still NOT authorized to access records at a specific hospital until that hospital approves the affiliation.

Example:

Dr. John Doe

Professional status:
VERIFIED

Hospital affiliation:
XYZ Hospital

Hospital authorization:
APPROVED

Role:
PHYSICIAN

==================================================
5. PATIENT REGISTRATION
==================================================

Create a patient registration workflow.

Required fields:

- Unique Patient ID
- First name
- Last name
- Date of birth
- Sex
- Phone
- Email
- Address
- Emergency contact
- Blood group
- Allergies
- Chronic conditions

Allow search using:

- Patient ID
- Phone number
- Name

The Patient ID must be unique.

==================================================
6. PATIENT EHR
==================================================

Create a highly usable Patient EHR dashboard.

The page should contain:

PATIENT HEADER

- Name
- Patient ID
- Age
- Sex
- Blood group
- Allergies
- Critical alerts

MEDICAL SUMMARY

- Chronic conditions
- Current medications
- Previous diagnoses
- Previous procedures

CLINICAL TIMELINE

Display all encounters chronologically.

Example:

27 AUG 2026
10:42
Dr. John Doe accessed record

10:44
Consultation started

10:49
Clinical observations recorded

10:52
Diagnosis recorded

10:54
Laboratory test ordered

11:30
Laboratory sample received

12:15
Laboratory result uploaded

12:21
Doctor reviewed result

12:25
Prescription issued

12:30
Medication dispensed

Every timeline item must contain:

- timestamp
- actor
- role
- activity
- department
- relevant data

==================================================
7. CONSULTATION MODULE
==================================================

Create a doctor consultation workflow.

FLOW:

Doctor searches patient.

↓

Doctor opens patient.

↓

System displays Patient Snapshot.

↓

Doctor clicks:

"START CONSULTATION"

↓

Create a unique Encounter ID.

↓

Record:

- Doctor
- Hospital
- Department
- Date
- Time
- Patient

Doctor enters:

1. Chief complaint
2. History of present illness
3. Vital signs
4. Clinical observations
5. Assessment
6. Diagnosis
7. Prescription
8. Laboratory orders
9. Follow-up instructions

The consultation cannot be considered completed until the required fields are completed.

Allow draft saving.

Do not allow silent modification of finalized clinical records.

If a finalized record must be corrected, create an amendment/version history.

==================================================
8. PATIENT AUTHORIZATION
==================================================

Implement a patient authorization simulation for the MVP.

When a doctor attempts to open a patient's clinical record:

Display:

"Patient authorization required."

Generate a simulated OTP.

Example:

482913

Patient confirms access.

For the MVP, the OTP can be displayed in a simulated patient notification panel rather than using a real SMS provider.

IMPORTANT:

Do not make payment the sole mechanism for medical authorization.

Access must depend on:

- authenticated healthcare worker
- hospital affiliation
- role/permissions
- patient authorization where applicable

Also implement emergency access ("break glass") as a controlled workflow.

Emergency access must require:

- reason
- authenticated user
- timestamp

and must always create an audit event.

==================================================
9. CLINICAL ACCESS AUDIT
==================================================

This is a CORE FEATURE.

Create an Audit Log.

Every sensitive activity must be recorded.

Examples:

PATIENT_RECORD_VIEWED
PATIENT_RECORD_CREATED
CONSULTATION_STARTED
CONSULTATION_UPDATED
CONSULTATION_FINALIZED
DIAGNOSIS_CREATED
PRESCRIPTION_CREATED
LAB_ORDER_CREATED
LAB_RESULT_CREATED
LAB_RESULT_VIEWED
PHARMACY_RECORD_VIEWED
MEDICATION_DISPENSED
PATIENT_AUTHORIZED_ACCESS
EMERGENCY_ACCESS

Each audit record must contain:

- event ID
- user ID
- user name
- user role
- hospital
- patient ID
- encounter ID when applicable
- activity
- timestamp
- IP/device metadata where appropriate
- reason where applicable

Create a dedicated:

"Clinical Accountability"

dashboard.

Allow administrators to filter by:

- doctor
- patient
- date
- activity
- department

==================================================
10. LABORATORY MODULE
==================================================

Doctor creates laboratory order.

Order status:

ORDERED
SAMPLE_COLLECTED
PROCESSING
RESULT_AVAILABLE
REVIEWED

Laboratory operator can:

- view pending orders
- update status
- enter results
- attach result files
- mark result as critical

When a result is marked critical:

Display:

"CRITICAL RESULT — PHYSICIAN REVIEW REQUIRED"

Notify the responsible doctor.

Once reviewed:

record:

Doctor
Timestamp
Action

==================================================
11. PHARMACY MODULE
==================================================

Doctor creates digital prescription.

Prescription fields:

- Medication
- Dose
- Route
- Frequency
- Duration
- Instructions
- Quantity

Prescription status:

ACTIVE
DISPENSED
PARTIALLY_DISPENSED
CANCELLED

Pharmacist can:

- view prescriptions
- dispense medication
- record quantity
- record date/time
- identify pharmacist

Create a complete chain:

PRESCRIPTION
→ DISPENSING
→ PATIENT RECORD

Do NOT build a full procurement/inventory system in this MVP.

==================================================
12. PATIENT PORTAL
==================================================

Create a simple patient portal.

Patient can view:

- Patient profile
- Medical history
- Consultation history
- Diagnoses
- Prescriptions
- Laboratory results
- Current medications
- Follow-up
- Record access history

Create a section:

"WHO ACCESSED MY RECORD?"

Example:

27 Aug
Dr. John Doe
Doctor
Consultation
10:42 AM

27 Aug
Sarah Smith
Laboratory
Laboratory result
11:30 AM

==================================================
13. HOSPITAL ADMIN DASHBOARD
==================================================

Create an executive dashboard.

Display:

TODAY:

- Total patients
- Consultations
- Active doctors
- Laboratory tests
- Prescriptions
- Completed encounters
- Incomplete encounters
- Critical results awaiting review

CLINICAL ACCOUNTABILITY:

- Doctor activity
- Consultations per doctor
- Incomplete records
- Pending clinical actions
- Unreviewed laboratory results

PATIENT FLOW:

- Daily patient volume
- Weekly patient volume
- Monthly patient volume

==================================================
14. HOSPITAL INTELLIGENCE / AI
==================================================

Create an AI/analytics layer.

IMPORTANT:

The AI must be presented as:

"Clinical and Operational Decision Support"

NOT:

"AI Doctor"

NOT:

"Autonomous diagnosis"

NOT:

"Autonomous prescription"

The AI provides signals, predictions and recommendations that require human review.

Implement five MVP intelligence capabilities.

------------------------------------------
A. RISK DETECTION
------------------------------------------

Detect:

- critical laboratory results not reviewed
- incomplete consultations
- documented allergy + potentially conflicting medication
- overdue follow-ups
- duplicate active prescriptions

Display:

RISK
SEVERITY
PATIENT
REASON
RECOMMENDED ACTION

------------------------------------------
B. PATIENT DEMAND FORECASTING
------------------------------------------

Use historical encounter data to estimate expected patient volume.

Example:

"Expected outpatient volume tomorrow:
420–460 patients."

Show:

- historical volume
- forecast
- trend
- confidence indicator

For MVP, use a simple transparent forecasting method if there is insufficient historical data.

Do NOT fabricate predictions.

If the dataset is too small, clearly display:

"Insufficient historical data."

------------------------------------------
C. PHARMACY DEMAND FORECAST
------------------------------------------

Use prescription history.

Example:

"Antibiotic demand is projected to increase by 18% next month."

Display:

- medication
- historical consumption
- projected demand
- trend
- confidence

Again, if insufficient data exists, state that explicitly.

------------------------------------------
D. OPERATIONAL RECOMMENDATIONS
------------------------------------------

Generate recommendations such as:

"Monday 08:00–11:00 has consistently high patient volume."

"Consider increasing consultation capacity during this period."

Recommendations must be explainable.

Every recommendation should contain:

OBSERVATION
→ DATA
→ INSIGHT
→ RECOMMENDATION

------------------------------------------
E. ACTIVITY / REVENUE ANOMALIES
------------------------------------------

Do NOT accuse employees of fraud.

Instead identify:

"Activity requires review."

Examples:

- services without corresponding billing record
- unusual external referral patterns
- unusual cancellation patterns
- unusually high discrepancies between clinical activity and recorded transactions

Use neutral language:

"ANOMALY DETECTED — REVIEW REQUIRED"

==================================================
15. AI HOSPITAL COPILOT
==================================================

Create a dashboard widget:

"WHAT SHOULD I KNOW TODAY?"

Generate a summary such as:

CLINICAL:
7 critical results require review.

OPERATIONS:
Patient volume is 16% above normal.

DOCUMENTATION:
13% of consultations remain incomplete.

PHARMACY:
3 medications are projected to experience high demand.

RECOMMENDATION:
Increase laboratory capacity during tomorrow's expected peak period.

The AI must only use data available in the system.

Never invent hospital data.

==================================================
16. BILLING / COMMERCIAL MVP
==================================================

Create a lightweight commercial module to demonstrate the business model.

Hospital subscription:

MONTHLY PLATFORM FEE

Encounter:

PER PATIENT ENCOUNTER FEE

Implementation:

ONE-TIME ONBOARDING FEE

Example configuration:

Implementation:
$5,000

Monthly subscription:
$500

Encounter fee:
$0.30

Allow administrators to configure these values.

Dashboard:

MONTHLY REVENUE

Subscription revenue
Encounter revenue
Total platform revenue

Show:

- encounters
- billable encounters
- transaction amount
- invoice status

Do not build a full accounting system.

==================================================
17. INSURANCE VERIFICATION — MVP SIMULATION
==================================================

Create a basic insurance verification interface.

Insurance user can submit:

- Patient ID
- Hospital
- Encounter ID
- Claim ID

System returns:

VERIFIED
NOT VERIFIED
REQUIRES REVIEW

Do not expose unnecessary medical information.

This should be implemented as a demonstration of a future API capability.

==================================================
18. UX/UI REQUIREMENTS
==================================================

Design must feel like a serious enterprise healthcare platform.

Style:

- modern
- clean
- trustworthy
- professional
- minimal
- accessible
- responsive

Avoid:

- excessive gradients
- gaming aesthetics
- excessive animations
- clutter
- unnecessary cards
- decorative UI that interferes with clinical workflows

Prioritize:

- readability
- fast navigation
- clear alerts
- clinical hierarchy
- accessibility
- desktop-first hospital workflows
- responsive layouts

Use a consistent design system.

Create:

- sidebar navigation
- top navigation
- breadcrumbs
- status badges
- tables
- clinical timeline
- dashboards
- modal dialogs
- forms
- alerts
- empty states
- loading states
- error states

==================================================
19. DASHBOARD NAVIGATION
==================================================

Hospital Admin:

Dashboard
Patients
Clinical Activity
Healthcare Workers
Laboratory
Pharmacy
AI Intelligence
Audit Logs
Billing
Settings

Doctor:

Dashboard
My Patients
Consultations
Laboratory
Prescriptions
Tasks

Laboratory:

Dashboard
Orders
Results
Critical Results

Pharmacist:

Dashboard
Prescriptions
Dispensing

Patient:

My Health
My Consultations
Prescriptions
Laboratory
Access History

==================================================
20. DATABASE / DATA MODEL
==================================================

Create a normalized relational database.

Core entities:

Hospital
User
HealthcareProfessional
HospitalStaffMembership
Patient
PatientAllergy
PatientCondition
Encounter
ClinicalNote
VitalSigns
Diagnosis
Prescription
PrescriptionItem
LaboratoryOrder
LaboratoryResult
PharmacyDispensing
Consent
AccessLog
AuditEvent
Notification
Payment
BillingRecord
InsuranceVerification
AIInsight
Forecast

Every clinical entity must be linked appropriately to:

Patient
Hospital
Encounter
Actor/User

Use UUIDs internally.

Never expose database IDs directly when a user-facing identifier is sufficient.

==================================================
21. SECURITY REQUIREMENTS
==================================================

This is healthcare software.

Implement:

- secure authentication
- password hashing
- role-based authorization
- session management
- audit logging
- encryption-ready architecture
- input validation
- server-side authorization
- protection against IDOR
- protection against SQL injection
- protection against XSS
- CSRF protection where applicable
- secure file handling
- rate limiting
- secure secrets management

Never trust frontend authorization.

All sensitive permissions must be enforced server-side.

A doctor must not be able to access arbitrary patient records by changing a URL parameter.

==================================================
22. DATA PRIVACY
==================================================

Treat all patient information as sensitive.

Implement:

- minimum necessary access
- patient consent records
- access logs
- emergency access logging
- data retention configuration
- data export capability
- account deactivation
- auditability

Do not use real patient data.

Use synthetic/demo data only.

Do not claim legal compliance with a specific jurisdiction unless explicitly configured and validated by legal experts.

==================================================
23. API DESIGN
==================================================

Build a clean REST API or equivalent service architecture.

Example endpoints:

POST /auth/login

GET /patients

POST /patients

GET /patients/:id

GET /patients/:id/timeline

POST /encounters

GET /encounters/:id

POST /consultations

POST /diagnoses

POST /prescriptions

POST /laboratory/orders

POST /laboratory/results

POST /pharmacy/dispense

GET /audit-logs

GET /analytics/dashboard

GET /analytics/forecast

GET /ai/insights

POST /insurance/verify

Design the API so that future mobile applications and third-party integrations can consume it.

==================================================
24. PAYMENT INTEGRATION
==================================================

For the MVP:

DO NOT depend on a real mobile money provider unless credentials are available.

Create a payment abstraction layer.

Support:

- MOCK payment provider
- transaction ID
- payment status
- amount
- patient
- hospital
- encounter

Architecture must allow future integration with mobile money providers.

==================================================
25. NOTIFICATIONS
==================================================

Create a notification service abstraction.

MVP channels:

- in-app notifications

Architecture should later support:

- SMS
- WhatsApp
- Email
- Push notifications

Important notifications:

- patient authorization
- critical laboratory result
- prescription
- follow-up reminder
- unauthorized access attempt
- administrative alerts

==================================================
26. DEMO DATA
==================================================

Generate realistic synthetic data.

Create:

3 hospitals

20 healthcare professionals

100 patients

At least 300 encounters

Historical laboratory results

Prescriptions

Pharmacy dispensing records

Audit events

Historical daily patient volumes

Historical prescription volumes

This data must make the AI dashboard visually meaningful.

Clearly label all data as:

DEMO DATA

==================================================
27. INVESTOR DEMO SCENARIO
==================================================

The application must support this exact demonstration:

SCENARIO:

Patient:
John Doe

Patient ID:
PAT-00018492

1. Reception searches patient.

2. Doctor opens patient.

3. Patient authorization is simulated.

4. Doctor sees complete medical history.

5. Doctor starts consultation.

6. Doctor records observations.

7. Doctor records diagnosis.

8. Doctor creates prescription.

9. Doctor orders laboratory test.

10. Laboratory operator receives order.

11. Laboratory operator enters result.

12. System identifies critical result.

13. Doctor receives alert.

14. Doctor reviews result.

15. Pharmacist sees prescription.

16. Pharmacist records dispensing.

17. Patient sees updated timeline.

18. Hospital administrator opens dashboard.

19. Administrator sees all clinical activity.

20. Administrator opens audit log.

21. Administrator sees:

WHO
WHEN
WHAT

22. Administrator opens AI Intelligence.

23. System displays:

- risk alerts
- patient volume forecast
- pharmacy demand forecast
- operational recommendations
- activity anomalies

The entire flow should be possible in under 10 minutes during a live investor demonstration.

==================================================
28. DEMO ACCOUNT CREDENTIALS
==================================================

Create demo accounts:

admin@demo-hospital.com
password: DemoAdmin123!

doctor@demo-hospital.com
password: DemoDoctor123!

lab@demo-hospital.com
password: DemoLab123!

pharmacy@demo-hospital.com
password: DemoPharmacy123!

patient@demo-hospital.com
password: DemoPatient123!

Clearly mark these as DEMO ACCOUNTS.

==================================================
29. TECHNICAL REQUIREMENTS
==================================================

Use a modern maintainable architecture.

Preferred stack:

Frontend:
React / Next.js
TypeScript
Tailwind CSS
Accessible component system

Backend:
Node.js / NestJS or equivalent strongly typed backend

Database:
PostgreSQL

ORM:
Prisma or equivalent

Authentication:
Secure session/JWT architecture

Charts:
Recharts or equivalent

AI:
Provider-agnostic AI service abstraction.

The AI provider must be replaceable.

Use environment variables for:

DATABASE_URL
AUTH_SECRET
AI_API_KEY
PAYMENT_API_KEY
SMS_API_KEY

Never hardcode secrets.

==================================================
30. DEVELOPMENT PRINCIPLES
==================================================

Follow:

- TypeScript strict mode
- clean architecture
- modular components
- reusable UI components
- validation
- error handling
- logging
- unit tests for critical business logic
- API tests for sensitive endpoints

Do not create fake buttons that do nothing.

Every major button should perform a real action.

If a capability is intentionally mocked, clearly label it:

"SIMULATED FOR MVP"

==================================================
31. AI IMPLEMENTATION PRINCIPLE
==================================================

Do not use an LLM for calculations that can be performed deterministically.

Use:

- SQL
- statistical methods
- rules
- time-series forecasting
- anomaly detection

where appropriate.

Use an LLM only where natural-language explanation or summarization adds value.

All AI insights must have:

- source data
- timestamp
- confidence where meaningful
- explanation
- recommended action
- human review requirement

==================================================
32. ERROR / EMPTY STATES
==================================================

Every page must handle:

- loading
- empty data
- server errors
- unauthorized access
- expired session
- invalid forms
- missing records

Example:

"No laboratory results are available for this patient."

Not:

"undefined"

==================================================
33. MVP SCOPE CONTROL
==================================================

DO NOT build:

- full hospital accounting
- payroll
- HR
- full procurement
- complex insurance claims processing
- telemedicine
- AI autonomous diagnosis
- AI autonomous prescription
- national health information exchange
- social network
- unnecessary mobile application

Focus exclusively on:

EHR
+
Clinical Accountability
+
Hospital Intelligence

==================================================
34. SUCCESS CRITERIA
==================================================

The MVP is successful if a hospital administrator can demonstrate:

1. Register patient
2. Find patient
3. View medical history
4. Start consultation
5. Record diagnosis
6. Create prescription
7. Order laboratory test
8. Enter laboratory result
9. Dispense medication
10. View patient timeline
11. See who accessed the record
12. See when they accessed it
13. See what they did
14. Detect clinical risks
15. Forecast patient demand
16. Forecast pharmacy demand
17. See operational recommendations
18. See basic platform revenue
19. Verify an insurance encounter

==================================================
35. FINAL PRODUCT POSITIONING
==================================================

The interface should communicate this product philosophy:

"Your medical history should follow you — not your file."

For hospitals:

"We give hospitals a complete digital memory of every patient and a transparent record of every clinical interaction—reducing clinical risk while protecting revenue and accountability."

The product should feel like:

PATIENT MEMORY
+
CLINICAL TRUST
+
HOSPITAL INTELLIGENCE

==================================================
36. EXECUTION INSTRUCTIONS
==================================================

Do not start by generating hundreds of files.

First:

1. Define the architecture.
2. Define the database schema.
3. Define the authentication and authorization model.
4. Define the core user journeys.
5. Define the API contracts.
6. Define the UI structure.
7. Build the database.
8. Build authentication.
9. Build RBAC.
10. Build Patient EHR.
11. Build consultation.
12. Build laboratory.
13. Build pharmacy.
14. Build audit logging.
15. Build dashboards.
16. Build analytics.
17. Build AI insights.
18. Build billing simulation.
19. Seed demo data.
20. Test the complete investor scenario.

At the end, provide:

- architecture overview
- database schema
- API documentation
- setup instructions
- environment variables
- demo credentials
- test accounts
- seed instructions
- known limitations
- MVP roadmap

Prioritize working functionality over unnecessary complexity.

The final result must be a coherent, investor-demo-ready healthcare SaaS MVP, not a collection of disconnected screens.