export type JourneyStageDef = {
  id: string
  label: string
  icon: string
  description: string
  masterMarutiJson: string
  masterMarutiXml: string
  bankSamples: Record<string, string>
}

export const SUPPORTED_BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'SBI (State Bank of India)',
  'AU SFB',
  'Kotak Mahindra Bank',
  'Bajaj Finance',
  'IndusInd Bank',
  'Punjab National Bank',
  'Mahindra Finance',
]

// ---------------------------------------------------------------------------
// MASTER MARUTI SCHEMAS (Canonical internal format)
// ---------------------------------------------------------------------------

const ELIGIBILITY_MASTER = JSON.stringify({
  endpoint: "POST /api/v1/eligibility/check",
  fields: [
    { name: "applicant_id", type: "string", required: true, description: "Maruti internal customer UUID" },
    { name: "pan_number", type: "string", required: true, description: "Applicant PAN card number" },
    { name: "date_of_birth", type: "string", required: true, description: "DOB in YYYY-MM-DD format" },
    { name: "gender", type: "string", required: true, description: "MALE | FEMALE | OTHER" },
    { name: "marital_status", type: "string", required: false, description: "SINGLE | MARRIED | DIVORCED" },
    { name: "employment_type", type: "string", required: true, description: "salaried | self_employed | business_owner | pensioner" },
    { name: "monthly_income", type: "number", required: true, description: "Gross monthly income in INR" },
    { name: "existing_emi_obligations", type: "number", required: false, description: "Total existing EMIs per month in INR" },
    { name: "loan_amount_requested", type: "number", required: true, description: "Principal loan amount in INR" },
    { name: "vehicle_on_road_price", type: "number", required: true, description: "On-road price of vehicle in INR" },
    { name: "down_payment", type: "number", required: true, description: "Customer down payment in INR" },
    { name: "tenure_months", type: "integer", required: true, description: "Loan tenure in months (12–84)" },
    { name: "city", type: "string", required: true, description: "Applicant city name" },
    { name: "state", type: "string", required: true, description: "State name e.g. Maharashtra" },
    { name: "pincode", type: "string", required: true, description: "6-digit PIN code" },
    { name: "cibil_score", type: "integer", required: false, description: "Latest CIBIL score if pre-fetched" },
    { name: "is_existing_customer", type: "boolean", required: false, description: "Is this a returning Maruti customer" },
    { name: "vehicle_category", type: "string", required: true, description: "HATCHBACK | SEDAN | SUV | MUV | EV" },
    { name: "maruti_dealer_code", type: "string", required: true, description: "MSPIN of originating dealer" },
    { name: "educational_qualification", type: "string", required: false, description: "GRADUATE | POST_GRADUATE | DOCTORATE" }
  ]
}, null, 2)

const OFFER_MASTER = JSON.stringify({
  endpoint: "GET /api/v1/offers/{application_id}",
  fields: [
    { name: "application_id", type: "string", required: true, description: "Maruti loan application UUID" },
    { name: "bank_code", type: "string", required: true, description: "Target bank code e.g. HDFC, ICICI" },
    { name: "loan_amount", type: "number", required: true, description: "Approved loan amount in INR" },
    { name: "tenure_months", type: "integer", required: true, description: "Tenure in months" },
    { name: "interest_rate_pa", type: "number", required: true, description: "Annual interest rate %" },
    { name: "emi_amount", type: "number", required: true, description: "Monthly EMI in INR" },
    { name: "processing_fee", type: "number", required: true, description: "Processing fee in INR" },
    { name: "processing_fee_pct", type: "number", required: false, description: "Processing fee as % of loan" },
    { name: "down_payment_required", type: "number", required: true, description: "Minimum down payment in INR" },
    { name: "ltv_ratio", type: "number", required: true, description: "Loan-to-value ratio %" },
    { name: "offer_valid_till", type: "string", required: true, description: "Offer expiry in ISO 8601" },
    { name: "offer_id", type: "string", required: true, description: "Unique offer reference" },
    { name: "special_scheme_code", type: "string", required: false, description: "Promotional scheme if applicable" },
    { name: "foreclosure_charges_pct", type: "number", required: false, description: "Prepayment penalty %" },
    { name: "is_baas_eligible", type: "boolean", required: false, description: "Battery-as-a-Service split loan" }
  ]
}, null, 2)

const APPLICATION_MASTER = JSON.stringify({
  endpoint: "POST /api/v1/journey/{id}/step",
  fields: [
    { name: "application_id", type: "string", required: true, description: "Maruti app UUID" },
    { name: "full_name", type: "string", required: true, description: "Applicant full legal name" },
    { name: "father_name", type: "string", required: true, description: "Father / spouse name" },
    { name: "gender", type: "string", required: true, description: "MALE | FEMALE | OTHER" },
    { name: "date_of_birth", type: "string", required: true, description: "YYYY-MM-DD" },
    { name: "pan_number", type: "string", required: true, description: "PAN" },
    { name: "aadhaar_number", type: "string", required: true, description: "12-digit Aadhaar (masked)" },
    { name: "mobile_number", type: "string", required: true, description: "10-digit mobile" },
    { name: "email_address", type: "string", required: false, description: "Email" },
    { name: "current_address_line1", type: "string", required: true, description: "Address line 1" },
    { name: "current_address_line2", type: "string", required: false, description: "Address line 2" },
    { name: "current_city", type: "string", required: true, description: "City" },
    { name: "current_state", type: "string", required: true, description: "State" },
    { name: "current_pincode", type: "string", required: true, description: "PIN" },
    { name: "residence_type", type: "string", required: true, description: "OWNED | RENTED | COMPANY_PROVIDED | FAMILY_OWNED" },
    { name: "years_at_current_address", type: "integer", required: false, description: "Years at current address" },
    { name: "employment_type", type: "string", required: true, description: "salaried | self_employed | business_owner | pensioner" },
    { name: "employer_name", type: "string", required: false, description: "Employer / company name" },
    { name: "employer_address", type: "string", required: false, description: "Office address" },
    { name: "monthly_income", type: "number", required: true, description: "Gross monthly income INR" },
    { name: "loan_amount", type: "number", required: true, description: "Loan amount INR" },
    { name: "tenure_months", type: "integer", required: true, description: "Tenure in months" },
    { name: "vehicle_model_code", type: "string", required: true, description: "Maruti vehicle model code" },
    { name: "vehicle_variant", type: "string", required: true, description: "Variant name" },
    { name: "vehicle_colour", type: "string", required: false, description: "Preferred colour" },
    { name: "dealer_code", type: "string", required: true, description: "MSPIN" },
    { name: "offer_id", type: "string", required: true, description: "Accepted offer reference" },
    { name: "consent_given", type: "boolean", required: true, description: "Customer digital consent" },
    { name: "bank_account_number", type: "string", required: true, description: "Beneficiary account" },
    { name: "bank_ifsc", type: "string", required: true, description: "IFSC code" }
  ]
}, null, 2)

const DOCUMENT_MASTER = JSON.stringify({
  endpoint: "POST /api/v1/documents/{app_id}/upload",
  fields: [
    { name: "application_id", type: "string", required: true, description: "App UUID" },
    { name: "document_type", type: "string", required: true, description: "PAN | AADHAAR_FRONT | AADHAAR_BACK | PHOTO | INCOME_PROOF | BANK_STATEMENT | FORM16 | ITR | ADDRESS_PROOF | VEHICLE_INVOICE | INSURANCE" },
    { name: "file_content", type: "string", required: true, description: "Base64 encoded file content" },
    { name: "file_name", type: "string", required: true, description: "Original file name" },
    { name: "file_mime_type", type: "string", required: true, description: "image/jpeg | image/png | application/pdf" },
    { name: "file_size_bytes", type: "integer", required: true, description: "File size in bytes" },
    { name: "is_password_protected", type: "boolean", required: false, description: "Password protected PDF" },
    { name: "document_password", type: "string", required: false, description: "Password if protected" }
  ]
}, null, 2)

const STATUS_MASTER = JSON.stringify({
  endpoint: "GET /api/v1/journey/{app_id}/bank-status",
  fields: [
    { name: "application_id", type: "string", required: true, description: "Maruti app UUID" },
    { name: "external_ref_id", type: "string", required: true, description: "Bank-issued reference" },
    { name: "bank_code", type: "string", required: true, description: "Bank code" }
  ]
}, null, 2)

const DISBURSEMENT_MASTER = JSON.stringify({
  endpoint: "POST /api/v1/journey/{app_id}/disbursement-confirm",
  fields: [
    { name: "application_id", type: "string", required: true, description: "App UUID" },
    { name: "bank_account_number", type: "string", required: true, description: "Beneficiary account" },
    { name: "bank_ifsc_code", type: "string", required: true, description: "IFSC code" },
    { name: "bank_account_name", type: "string", required: true, description: "Account holder name" },
    { name: "disbursement_amount", type: "number", required: true, description: "Amount to disburse in INR" },
    { name: "disbursement_mode", type: "string", required: true, description: "NEFT | RTGS | IMPS | DD" },
    { name: "payee_type", type: "string", required: true, description: "DEALER | CUSTOMER | INSURER" },
    { name: "vehicle_registration_number", type: "string", required: false, description: "RC number if available" },
    { name: "chassis_number", type: "string", required: false, description: "Vehicle chassis number" },
    { name: "engine_number", type: "string", required: false, description: "Engine number" },
    { name: "insurance_policy_number", type: "string", required: false, description: "Motor insurance policy" }
  ]
}, null, 2)

// ---------------------------------------------------------------------------
// HDFC BANK  — Header/Body envelope, snake_case abbreviated fields
// Xpress Car Loan (XCL) API — partner integration via developer.hdfc.bank.in
// ---------------------------------------------------------------------------

const HDFC_ELIGIBILITY = JSON.stringify({
  Header: {
    msg_id: "HDFC-EL-20260501-001",
    timestamp: "2026-05-01T10:00:00+05:30",
    channel_id: "MARUTI_DMS",
    src_code: "MSIL",
    api_ver: "v2"
  },
  Body: {
    EligibilityRequest: {
      customer_id: "MSIL-CUST-12345",
      pan_no: "ABCDE1234F",
      dob: "15/05/1990",
      gender: "M",
      marital_sts: "M",
      emp_type: "SAL",
      net_salary: 75000,
      existing_emi: 12000,
      loan_amt: 600000,
      on_road_price: 800000,
      margin_money: 200000,
      tenure: 60,
      city_cd: "MUM",
      state_cd: "MH",
      pin_cd: "400001",
      cibil_scr: 750,
      existing_cust_flg: "Y",
      car_segment: "HATCHBACK",
      dealer_cd: "DL-HDFC-9901",
      edu_qual: "GRADUATE"
    }
  }
}, null, 2)

const HDFC_OFFER = JSON.stringify({
  Header: {
    msg_id: "HDFC-OF-20260501-001",
    timestamp: "2026-05-01T10:05:00+05:30",
    channel_id: "MARUTI_DMS",
    src_code: "MSIL",
    api_ver: "v2"
  },
  Body: {
    OfferRequest: {
      partner_app_id: "MSIL-APP-88821",
      bank_cd: "HDFC",
      sanctioned_amt: 600000,
      tenure_m: 60,
      roi_pa: 8.75,
      emi_amt: 12450,
      proc_fee: 3500,
      proc_fee_pct: 0.58,
      min_down_payment: 200000,
      ltv_pct: 75.0,
      offer_valid_till: "2026-05-31T23:59:59+05:30",
      offer_ref_no: "HDFC-OFF-20260501-8821",
      scheme_cd: "MSIL_FESTIVE_Q1",
      foreclosure_chg_pct: 4.0,
      baas_eligible: false
    }
  }
}, null, 2)

const HDFC_APPLICATION = JSON.stringify({
  Header: {
    msg_id: "HDFC-APP-20260501-001",
    timestamp: "2026-05-01T10:10:00+05:30",
    channel_id: "MARUTI_DMS",
    src_code: "MSIL",
    api_ver: "v2"
  },
  CustomerData: {
    Personal: {
      applicant_name: "Rahul Kumar",
      father_name: "Suresh Kumar",
      gender_cd: "M",
      birth_dt: "19900515",
      marital_sts: "M"
    },
    Identity: {
      pan_card: "ABCDE1234F",
      uid_no: "XXXX-XXXX-1234"
    },
    Contact: {
      mobile_no: "9876543210",
      email_id: "rahul.kumar@example.com"
    },
    Residence: {
      addr_ln1: "Flat 101, Sea View Apts",
      addr_ln2: "Bandra West",
      city_nm: "Mumbai",
      state_nm: "Maharashtra",
      pin_cd: "400050",
      res_type: "OWNED",
      stability_yrs: 5
    }
  },
  Financials: {
    occ_type: "SALARIED",
    employer_nm: "Tech Corp India Pvt Ltd",
    office_addr: "Andheri East, Mumbai",
    net_monthly_inc: 75000,
    loan_amt: 600000,
    tenure_mths: 60
  },
  VehicleInfo: {
    model_cd: "SWIFT",
    variant_cd: "VXI",
    colour_cd: "RED",
    dealer_cd: "DL-HDFC-9901"
  },
  Consent: {
    offer_ref_no: "HDFC-OFF-20260501-8821",
    consent_flg: "Y",
    consent_dt: "2026-05-01T10:10:00+05:30",
    bank_acc_no: "000011112222",
    bank_ifsc: "HDFC0000123"
  }
}, null, 2)

const HDFC_DOCUMENT = JSON.stringify({
  Header: {
    msg_id: "HDFC-DOC-20260501-001",
    timestamp: "2026-05-01T10:15:00+05:30",
    channel_id: "MARUTI_DMS",
    src_code: "MSIL"
  },
  DocUploadRequest: {
    hdfc_app_ref: "HDFC-APP-20260501-001",
    doc_cat: "IDENTITY",
    doc_sub_cat: "PAN_CARD",
    file_nm: "pan_rahul_kumar.pdf",
    mime_type: "application/pdf",
    file_size: 204800,
    file_data: "<base64_encoded_content>",
    pwd_protected: false,
    doc_pwd: null
  }
}, null, 2)

const HDFC_STATUS = JSON.stringify({
  Header: {
    msg_id: "HDFC-STS-20260501-001",
    timestamp: "2026-05-01T11:00:00+05:30",
    channel_id: "MARUTI_DMS",
    src_code: "MSIL"
  },
  StatusRequest: {
    hdfc_app_ref: "HDFC-APP-20260501-001",
    partner_app_id: "MSIL-APP-88821",
    bank_cd: "HDFC"
  }
}, null, 2)

const HDFC_DISBURSEMENT = JSON.stringify({
  Header: {
    msg_id: "HDFC-DISB-20260501-001",
    timestamp: "2026-05-01T14:00:00+05:30",
    channel_id: "MARUTI_DMS",
    src_code: "MSIL"
  },
  DisbursementRequest: {
    hdfc_app_ref: "HDFC-APP-20260501-001",
    partner_app_id: "MSIL-APP-88821",
    payee_acc_no: "000011112222",
    payee_ifsc: "HDFC0000123",
    payee_nm: "Rahul Kumar",
    disb_amt: 600000,
    disb_mode: "NEFT",
    payee_type: "CUSTOMER",
    veh_reg_no: "MH01AB1234",
    chassis_no: "MA3FJEB1S00123456",
    engine_no: "K10BN1234567",
    insurance_pol_no: "POL-2026-BAJAJ-9988"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// ICICI BANK  — camelCase JSON, flat structure, "icici" prefix on bank refs
// iLens / iLocker platform, developer.icicibank.com
// ---------------------------------------------------------------------------

const ICICI_ELIGIBILITY = JSON.stringify({
  requestId: "MSIL-ICICI-EL-20260501001",
  timestamp: "2026-05-01T10:00:00+05:30",
  channelCode: "MARUTI_DMS",
  sourceSystem: "MSIL",
  eligibilityCheckRequest: {
    applicantRefId: "MSIL-CUST-12345",
    pan: "ABCDE1234F",
    dob: "1990-05-15",
    gender: "MALE",
    maritalStatus: "MARRIED",
    profession: "SALARIED",
    monthlyIncome: 75000,
    existingEmiAmount: 12000,
    loanAmountRequired: 600000,
    vehicleOnRoadPrice: 800000,
    downPayment: 200000,
    tenure: 60,
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    cibilScore: 750,
    isExistingCustomer: true,
    vehicleCategory: "HATCHBACK",
    dealerCode: "MSIL-DLR-9901",
    educationalQualification: "GRADUATE"
  }
}, null, 2)

const ICICI_OFFER = JSON.stringify({
  requestId: "MSIL-ICICI-OF-20260501001",
  timestamp: "2026-05-01T10:05:00+05:30",
  channelCode: "MARUTI_DMS",
  offerRequest: {
    applicationId: "MSIL-APP-88821",
    bankCode: "ICICI",
    sanctionedLoanAmount: 600000,
    tenureInMonths: 60,
    rateOfInterest: 8.50,
    emiAmount: 12389,
    processingFee: 3000,
    processingFeePercent: 0.50,
    minimumDownPayment: 200000,
    ltvRatio: 75.0,
    offerExpiryDate: "2026-05-31T23:59:59+05:30",
    offerId: "ICICI-OFF-2026050188821",
    schemeCode: "ICICI_MSIL_APR26",
    foreclosureChargesPercent: 3.0,
    isBaasEligible: false
  }
}, null, 2)

const ICICI_APPLICATION = JSON.stringify({
  requestId: "MSIL-ICICI-APP-20260501001",
  timestamp: "2026-05-01T10:10:00+05:30",
  channelCode: "MARUTI_DMS",
  loanApplicationRequest: {
    applicationId: "MSIL-APP-88821",
    applicantDetails: {
      fullName: "Rahul Kumar",
      fatherName: "Suresh Kumar",
      gender: "MALE",
      dateOfBirth: "1990-05-15",
      panNumber: "ABCDE1234F",
      aadhaarNumber: "XXXX-XXXX-1234",
      mobileNumber: "9876543210",
      emailId: "rahul.kumar@example.com"
    },
    addressDetails: {
      addressLine1: "Flat 101, Sea View Apts",
      addressLine2: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      residenceType: "OWNED",
      yearsAtAddress: 5
    },
    employmentDetails: {
      employmentType: "SALARIED",
      employerName: "Tech Corp India Pvt Ltd",
      employerAddress: "Andheri East, Mumbai",
      monthlyIncome: 75000
    },
    loanDetails: {
      loanAmount: 600000,
      tenure: 60,
      offerId: "ICICI-OFF-2026050188821"
    },
    vehicleDetails: {
      modelCode: "SWIFT",
      variant: "VXI",
      colour: "Blazing Red",
      dealerCode: "MSIL-DLR-9901"
    },
    bankDetails: {
      accountNumber: "000011112222",
      ifscCode: "ICIC0000456"
    },
    consentFlag: true,
    consentTimestamp: "2026-05-01T10:10:00+05:30"
  }
}, null, 2)

const ICICI_DOCUMENT = JSON.stringify({
  requestId: "MSIL-ICICI-DOC-20260501001",
  timestamp: "2026-05-01T10:15:00+05:30",
  channelCode: "MARUTI_DMS",
  documentUploadRequest: {
    applicationId: "MSIL-APP-88821",
    iciciAppRef: "ICICI-OFF-2026050188821",
    documentType: "PAN",
    documentSubType: "PAN_CARD",
    fileName: "pan_rahul_kumar.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 204800,
    fileContent: "<base64_encoded_content>",
    isPasswordProtected: false,
    documentPassword: null
  }
}, null, 2)

const ICICI_STATUS = JSON.stringify({
  requestId: "MSIL-ICICI-STS-20260501001",
  timestamp: "2026-05-01T11:00:00+05:30",
  channelCode: "MARUTI_DMS",
  statusInquiryRequest: {
    applicationId: "MSIL-APP-88821",
    iciciReferenceId: "ICICI-OFF-2026050188821",
    bankCode: "ICICI"
  }
}, null, 2)

const ICICI_DISBURSEMENT = JSON.stringify({
  requestId: "MSIL-ICICI-DISB-20260501001",
  timestamp: "2026-05-01T14:00:00+05:30",
  channelCode: "MARUTI_DMS",
  disbursementRequest: {
    applicationId: "MSIL-APP-88821",
    iciciReferenceId: "ICICI-OFF-2026050188821",
    beneficiaryAccountNumber: "000011112222",
    beneficiaryIfscCode: "ICIC0000456",
    beneficiaryName: "Rahul Kumar",
    disbursementAmount: 600000,
    paymentMode: "NEFT",
    payeeType: "CUSTOMER",
    vehicleRegistrationNumber: "MH01AB1234",
    chassisNumber: "MA3FJEB1S00123456",
    engineNumber: "K10BN1234567",
    insurancePolicyNumber: "POL-2026-BAJAJ-9988"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// AXIS BANK  — camelCase JSON, axisRefNo prefix, ETB-focused Auto Loan APIs
// apiportal.axis.bank.in — Auto Loan APIs product
// ---------------------------------------------------------------------------

const AXIS_ELIGIBILITY = JSON.stringify({
  axisRequestId: "AXIS-EL-20260501-001",
  requestTimestamp: "2026-05-01T10:00:00+05:30",
  channelCode: "MARUTI_DMS",
  partnerCode: "MSIL",
  eligibilityCheckRequest: {
    partnerCustomerId: "MSIL-CUST-12345",
    panNumber: "ABCDE1234F",
    dateOfBirth: "15-05-1990",
    gender: "M",
    maritalStatus: "MARRIED",
    employmentCategory: "SALARIED",
    grossMonthlyIncome: 75000,
    monthlyEmiObligations: 12000,
    requestedLoanAmount: 600000,
    vehicleExShowroomPrice: 800000,
    downPaymentAmount: 200000,
    loanTenureMonths: 60,
    applicantCity: "Mumbai",
    applicantState: "Maharashtra",
    applicantPincode: "400001",
    bureauScore: 750,
    isExistingAxisCustomer: false,
    vehicleSegment: "HATCHBACK",
    dealerOutletCode: "MSIL-DLR-9901",
    educationLevel: "GRADUATE"
  }
}, null, 2)

const AXIS_OFFER = JSON.stringify({
  axisRequestId: "AXIS-OF-20260501-001",
  requestTimestamp: "2026-05-01T10:05:00+05:30",
  channelCode: "MARUTI_DMS",
  partnerCode: "MSIL",
  offerFetchRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    bankIdentifier: "AXIS",
    approvedLoanAmount: 600000,
    tenureMonths: 60,
    annualInterestRate: 8.65,
    monthlyEmiAmount: 12420,
    processingFeeAmount: 3500,
    processingFeePercentage: 0.58,
    requiredDownPayment: 200000,
    loanToValueRatio: 75.0,
    offerValidUpto: "2026-05-31T23:59:59+05:30",
    offerReferenceNumber: "AXIS-OFF-2026050188821",
    promotionalSchemeCode: "AXIS_MSIL_APR26",
    prepaymentPenaltyPct: 3.5,
    isBaasApplicable: false
  }
}, null, 2)

const AXIS_APPLICATION = JSON.stringify({
  axisRequestId: "AXIS-APP-20260501-001",
  requestTimestamp: "2026-05-01T10:10:00+05:30",
  channelCode: "MARUTI_DMS",
  partnerCode: "MSIL",
  autoLoanApplicationRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    personalInfo: {
      applicantFullName: "Rahul Kumar",
      fatherOrSpouseName: "Suresh Kumar",
      genderCode: "M",
      dob: "1990-05-15",
      panNo: "ABCDE1234F",
      aadhaarNo: "XXXXXXXXXXXX",
      mobileNo: "9876543210",
      emailAddress: "rahul.kumar@example.com"
    },
    residenceInfo: {
      addressLine1: "Flat 101, Sea View Apts",
      addressLine2: "Bandra West",
      cityName: "Mumbai",
      stateName: "Maharashtra",
      pinCode: "400050",
      ownershipType: "SELF_OWNED",
      residingSinceYears: 5
    },
    occupationInfo: {
      employmentType: "SALARIED",
      organizationName: "Tech Corp India Pvt Ltd",
      officeAddress: "Andheri East, Mumbai",
      monthlyNetIncome: 75000
    },
    loanInfo: {
      loanAmountRequested: 600000,
      repaymentTenure: 60,
      offerReferenceNumber: "AXIS-OFF-2026050188821"
    },
    vehicleInfo: {
      vehicleModelCode: "SWIFT",
      vehicleVariant: "VXI",
      preferredColour: "Blazing Red",
      dealerOutletCode: "MSIL-DLR-9901"
    },
    bankAccountInfo: {
      accountNumber: "000011112222",
      ifscCode: "UTIB0000123"
    },
    customerConsent: true,
    consentCapturedAt: "2026-05-01T10:10:00+05:30"
  }
}, null, 2)

const AXIS_DOCUMENT = JSON.stringify({
  axisRequestId: "AXIS-DOC-20260501-001",
  requestTimestamp: "2026-05-01T10:15:00+05:30",
  channelCode: "MARUTI_DMS",
  documentUpload: {
    partnerApplicationId: "MSIL-APP-88821",
    axisApplicationRef: "AXIS-OFF-2026050188821",
    documentCategory: "KYC",
    documentType: "PAN_CARD",
    fileName: "pan_rahul_kumar.pdf",
    contentType: "application/pdf",
    fileSizeInBytes: 204800,
    documentContent: "<base64_encoded_content>",
    isPasswordProtected: false,
    filePassword: null
  }
}, null, 2)

const AXIS_STATUS = JSON.stringify({
  axisRequestId: "AXIS-STS-20260501-001",
  requestTimestamp: "2026-05-01T11:00:00+05:30",
  channelCode: "MARUTI_DMS",
  statusPollRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    axisReferenceNumber: "AXIS-OFF-2026050188821",
    bankCode: "AXIS"
  }
}, null, 2)

const AXIS_DISBURSEMENT = JSON.stringify({
  axisRequestId: "AXIS-DISB-20260501-001",
  requestTimestamp: "2026-05-01T14:00:00+05:30",
  channelCode: "MARUTI_DMS",
  disbursementInitiationRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    axisReferenceNumber: "AXIS-OFF-2026050188821",
    beneficiaryAccountNo: "000011112222",
    beneficiaryIfsc: "UTIB0000123",
    beneficiaryAccountName: "Rahul Kumar",
    disbursementAmount: 600000,
    fundTransferMode: "NEFT",
    payeeCategory: "CUSTOMER",
    rcNumber: "MH01AB1234",
    chassisNumber: "MA3FJEB1S00123456",
    engineNumber: "K10BN1234567",
    insurancePolicyNo: "POL-2026-BAJAJ-9988"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// SBI  — snake_case abbreviated govt-style, YONOBusiness / SARAL LOS pattern
// apihub.yonobusiness.sbi — corporate API sandbox
// ---------------------------------------------------------------------------

const SBI_ELIGIBILITY = JSON.stringify({
  req_ref_no: "SBI-EL-20260501-001",
  req_dt_tm: "01-05-2026 10:00:00",
  chnl_cd: "MARUTI_DMS",
  src_sys_cd: "MSIL",
  eligibility_req: {
    cust_ref_no: "MSIL-CUST-12345",
    pan_no: "ABCDE1234F",
    birth_date: "15-05-1990",
    gender_cd: "M",
    marital_sts_cd: "M",
    occ_code: "01",
    gross_inc: 75000,
    existing_emi_oblg: 12000,
    loan_amt_req: 600000,
    on_road_price: 800000,
    margin_amt: 200000,
    repayment_mths: 60,
    city_nm: "Mumbai",
    state_nm: "Maharashtra",
    pin_cd: "400001",
    cibil_scr: 750,
    existing_cust_flg: "Y",
    veh_cat_cd: "HATCHBACK",
    dealer_cd: "MSIL-DLR-9901",
    edu_qual_cd: "GRD"
  }
}, null, 2)

const SBI_OFFER = JSON.stringify({
  req_ref_no: "SBI-OF-20260501-001",
  req_dt_tm: "01-05-2026 10:05:00",
  chnl_cd: "MARUTI_DMS",
  src_sys_cd: "MSIL",
  offer_req: {
    appl_ref_no: "MSIL-APP-88821",
    bank_cd: "SBI",
    sanc_amt: 600000,
    repayment_mths: 60,
    int_rate_pa: 8.40,
    emi_amt: 12352,
    proc_chrg: 2500,
    proc_chrg_pct: 0.42,
    min_dwn_pay: 200000,
    ltv_ratio: 75.0,
    offer_expiry_dt: "31-05-2026",
    offer_ref_no: "SBI-OFF-2026050188821",
    scheme_cd: "SBI_MSIL_APR26",
    foreclosure_chrg_pct: 2.0,
    baas_elig_flg: "N"
  }
}, null, 2)

const SBI_APPLICATION = JSON.stringify({
  req_ref_no: "SBI-APP-20260501-001",
  req_dt_tm: "01-05-2026 10:10:00",
  chnl_cd: "MARUTI_DMS",
  src_sys_cd: "MSIL",
  loan_appl_req: {
    appl_ref_no: "MSIL-APP-88821",
    personal_dtls: {
      appl_nm: "Rahul Kumar",
      father_nm: "Suresh Kumar",
      gender_cd: "M",
      birth_dt: "15051990",
      pan_no: "ABCDE1234F",
      uid_no: "XXXXXXXXXXXX",
      mob_no: "9876543210",
      email_id: "rahul.kumar@example.com"
    },
    addr_dtls: {
      addr_ln1: "Flat 101, Sea View Apts",
      addr_ln2: "Bandra West",
      city_nm: "Mumbai",
      state_nm: "Maharashtra",
      pin_cd: "400050",
      res_type_cd: "OWN",
      stay_dur_yrs: 5
    },
    employ_dtls: {
      occ_cd: "01",
      org_nm: "Tech Corp India Pvt Ltd",
      office_addr: "Andheri East, Mumbai",
      gross_sal: 75000
    },
    loan_dtls: {
      loan_amt: 600000,
      repayment_mths: 60,
      offer_ref_no: "SBI-OFF-2026050188821"
    },
    veh_dtls: {
      model_cd: "SWIFT",
      variant_cd: "VXI",
      colour_nm: "Blazing Red",
      dealer_cd: "MSIL-DLR-9901"
    },
    bank_dtls: {
      acct_no: "000011112222",
      ifsc_cd: "SBIN0001234"
    },
    consent_flg: "Y",
    consent_dt_tm: "01-05-2026 10:10:00"
  }
}, null, 2)

const SBI_DOCUMENT = JSON.stringify({
  req_ref_no: "SBI-DOC-20260501-001",
  req_dt_tm: "01-05-2026 10:15:00",
  chnl_cd: "MARUTI_DMS",
  doc_upload_req: {
    appl_ref_no: "MSIL-APP-88821",
    sbi_loan_ref_no: "SBI-OFF-2026050188821",
    doc_type_cd: "PAN",
    doc_sub_type_cd: "PAN_CARD",
    file_nm: "pan_rahul_kumar.pdf",
    file_mime_type: "application/pdf",
    file_sz_bytes: 204800,
    file_content: "<base64_encoded_content>",
    pwd_protected_flg: "N",
    file_pwd: null
  }
}, null, 2)

const SBI_STATUS = JSON.stringify({
  req_ref_no: "SBI-STS-20260501-001",
  req_dt_tm: "01-05-2026 11:00:00",
  chnl_cd: "MARUTI_DMS",
  status_enq_req: {
    appl_ref_no: "MSIL-APP-88821",
    sbi_loan_ref_no: "SBI-OFF-2026050188821",
    bank_cd: "SBI"
  }
}, null, 2)

const SBI_DISBURSEMENT = JSON.stringify({
  req_ref_no: "SBI-DISB-20260501-001",
  req_dt_tm: "01-05-2026 14:00:00",
  chnl_cd: "MARUTI_DMS",
  disb_req: {
    appl_ref_no: "MSIL-APP-88821",
    sbi_loan_ref_no: "SBI-OFF-2026050188821",
    benef_acct_no: "000011112222",
    benef_ifsc_cd: "SBIN0001234",
    benef_nm: "Rahul Kumar",
    disb_amt: 600000,
    remit_mode: "NEFT",
    payee_type_cd: "CUST",
    rc_no: "MH01AB1234",
    chassis_no: "MA3FJEB1S00123456",
    engine_no: "K10BN1234567",
    ins_pol_no: "POL-2026-BAJAJ-9988"
  }
}, null, 2)


// ---------------------------------------------------------------------------
// AU SFB (AU Small Finance Bank) — camelCase, "au" prefixed, flat structure
// AU API Banking portal — au.bank.in
// ---------------------------------------------------------------------------

const AUSFB_ELIGIBILITY = JSON.stringify({
  auRequestId: "AUSFB-EL-20260501-001",
  requestDateTime: "2026-05-01T10:00:00+05:30",
  channelId: "MARUTI_DMS",
  partnerCode: "MSIL",
  eligibilityRequest: {
    partnerCustomerId: "MSIL-CUST-12345",
    panCard: "ABCDE1234F",
    dateOfBirth: "1990-05-15",
    gender: "MALE",
    employmentType: "SALARIED",
    monthlyGrossIncome: 75000,
    existingEmiPerMonth: 12000,
    loanAmountRequired: 600000,
    vehicleOnRoadPrice: 800000,
    proposedDownPayment: 200000,
    loanTenure: 60,
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400001",
    creditScore: 750,
    vehicleType: "HATCHBACK",
    dealerCode: "MSIL-DLR-9901"
  }
}, null, 2)

const AUSFB_OFFER = JSON.stringify({
  auRequestId: "AUSFB-OF-20260501-001",
  requestDateTime: "2026-05-01T10:05:00+05:30",
  channelId: "MARUTI_DMS",
  partnerCode: "MSIL",
  offerRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    bankCode: "AU_SFB",
    approvedAmount: 600000,
    loanTenure: 60,
    interestRatePerAnnum: 10.00,
    emiAmount: 12748,
    processingFee: 6000,
    processingFeePercent: 1.00,
    downPaymentRequired: 200000,
    ltvPercentage: 75.0,
    offerValidTill: "2026-05-31T23:59:59+05:30",
    auOfferId: "AUSFB-OFF-2026050188821",
    schemeCode: "AUSFB_MSIL_Q1_2026",
    foreclosureFeePercent: 4.0,
    isBaasScheme: false
  }
}, null, 2)

const AUSFB_APPLICATION = JSON.stringify({
  auRequestId: "AUSFB-APP-20260501-001",
  requestDateTime: "2026-05-01T10:10:00+05:30",
  channelId: "MARUTI_DMS",
  partnerCode: "MSIL",
  vehicleLoanApplication: {
    partnerApplicationId: "MSIL-APP-88821",
    applicantInfo: {
      name: "Rahul Kumar",
      fatherName: "Suresh Kumar",
      gender: "MALE",
      dob: "1990-05-15",
      pan: "ABCDE1234F",
      aadhaar: "XXXXXXXXXXXX",
      mobile: "9876543210",
      email: "rahul.kumar@example.com"
    },
    addressInfo: {
      line1: "Flat 101, Sea View Apts",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      residenceOwnership: "OWNED"
    },
    employmentInfo: {
      category: "SALARIED",
      employerName: "Tech Corp India Pvt Ltd",
      monthlyIncome: 75000
    },
    loanInfo: {
      amount: 600000,
      tenure: 60,
      auOfferRef: "AUSFB-OFF-2026050188821"
    },
    vehicleInfo: {
      model: "SWIFT",
      variant: "VXI",
      dealerCode: "MSIL-DLR-9901"
    },
    bankAccountInfo: {
      accountNo: "000011112222",
      ifscCode: "AUBL0002083"
    },
    consent: true,
    consentTimestamp: "2026-05-01T10:10:00+05:30"
  }
}, null, 2)

const AUSFB_DOCUMENT = JSON.stringify({
  auRequestId: "AUSFB-DOC-20260501-001",
  requestDateTime: "2026-05-01T10:15:00+05:30",
  channelId: "MARUTI_DMS",
  documentUploadRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    auLoanRefId: "AUSFB-OFF-2026050188821",
    docType: "PAN",
    docSubType: "PAN_CARD",
    fileName: "pan_rahul_kumar.pdf",
    mimeType: "application/pdf",
    fileSize: 204800,
    fileData: "<base64_encoded_content>",
    passwordProtected: false
  }
}, null, 2)

const AUSFB_STATUS = JSON.stringify({
  auRequestId: "AUSFB-STS-20260501-001",
  requestDateTime: "2026-05-01T11:00:00+05:30",
  channelId: "MARUTI_DMS",
  statusRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    auReferenceId: "AUSFB-OFF-2026050188821",
    bankCode: "AU_SFB"
  }
}, null, 2)

const AUSFB_DISBURSEMENT = JSON.stringify({
  auRequestId: "AUSFB-DISB-20260501-001",
  requestDateTime: "2026-05-01T14:00:00+05:30",
  channelId: "MARUTI_DMS",
  disbursementRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    auLoanRefId: "AUSFB-OFF-2026050188821",
    beneficiaryAccount: "000011112222",
    beneficiaryIfsc: "AUBL0002083",
    beneficiaryName: "Rahul Kumar",
    disbursalAmount: 600000,
    paymentMethod: "NEFT",
    vehicleRegNo: "MH01AB1234",
    chassisNo: "MA3FJEB1S00123456",
    engineNo: "K10BN1234567"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// KOTAK MAHINDRA BANK — camelCase, "kotak" prefix on refs, nested objects
// api.kotak.bank.in — developer platform
// ---------------------------------------------------------------------------

const KOTAK_ELIGIBILITY = JSON.stringify({
  kotakRequestId: "KOTAK-EL-20260501-001",
  requestTimestamp: "2026-05-01T10:00:00+05:30",
  channelCode: "MARUTI_DMS",
  partnerIdentifier: "MSIL",
  eligibilityCheckPayload: {
    customerRefId: "MSIL-CUST-12345",
    panNumber: "ABCDE1234F",
    birthDate: "1990-05-15",
    genderCode: "M",
    maritalStatusCode: "MAR",
    occupationType: "SALARIED",
    grossMonthlyIncome: 75000,
    runningEmiAmount: 12000,
    proposedLoanAmount: 600000,
    vehicleOnRoadValue: 800000,
    ownContribution: 200000,
    tenureInMonths: 60,
    residentCity: "Mumbai",
    residentState: "Maharashtra",
    pincode: "400001",
    cibilScore: 750,
    isKotakExistingCustomer: false,
    vehicleClass: "HATCHBACK",
    marutiDealerCode: "MSIL-DLR-9901",
    educationQualification: "GRADUATE"
  }
}, null, 2)

const KOTAK_OFFER = JSON.stringify({
  kotakRequestId: "KOTAK-OF-20260501-001",
  requestTimestamp: "2026-05-01T10:05:00+05:30",
  channelCode: "MARUTI_DMS",
  partnerIdentifier: "MSIL",
  offerFetchPayload: {
    partnerAppId: "MSIL-APP-88821",
    bankIdentifier: "KOTAK",
    sanctionedLoanAmt: 600000,
    tenureMonths: 60,
    rateOfInterestPa: 8.80,
    emiPerMonth: 12445,
    processingCharges: 3500,
    processingChargesPct: 0.58,
    minimumDownPayment: 200000,
    ltvRatioPct: 75.0,
    offerExpiresOn: "2026-05-31T23:59:59+05:30",
    kotakOfferId: "KOTAK-OFF-2026050188821",
    promotionCode: "KOTAK_MSIL_APR26",
    foreclosurePenaltyPct: 3.5,
    isBaasProduct: false
  }
}, null, 2)

const KOTAK_APPLICATION = JSON.stringify({
  kotakRequestId: "KOTAK-APP-20260501-001",
  requestTimestamp: "2026-05-01T10:10:00+05:30",
  channelCode: "MARUTI_DMS",
  partnerIdentifier: "MSIL",
  autoLoanApplicationPayload: {
    partnerAppId: "MSIL-APP-88821",
    personalDetails: {
      customerName: "Rahul Kumar",
      fatherSpouseName: "Suresh Kumar",
      gender: "MALE",
      dob: "15/05/1990",
      panNo: "ABCDE1234F",
      aadhaarNo: "XXXXXXXXXXXX",
      contactNumber: "9876543210",
      emailAddress: "rahul.kumar@example.com"
    },
    residentialDetails: {
      houseNo: "Flat 101, Sea View Apts",
      streetLocality: "Bandra West",
      cityName: "Mumbai",
      stateName: "Maharashtra",
      postalCode: "400050",
      accommodationType: "OWNED",
      stayDurationYears: 5
    },
    professionalDetails: {
      employmentStatus: "SALARIED",
      companyName: "Tech Corp India Pvt Ltd",
      companyAddress: "Andheri East, Mumbai",
      monthlyTakeHome: 75000
    },
    loanParameters: {
      loanAmount: 600000,
      repaymentPeriod: 60,
      kotakOfferRefId: "KOTAK-OFF-2026050188821"
    },
    vehicleParameters: {
      modelCode: "SWIFT",
      variantCode: "VXI",
      colorPreference: "Blazing Red",
      dealerCode: "MSIL-DLR-9901"
    },
    repaymentBankDetails: {
      accountNumber: "000011112222",
      ifscCode: "KKBK0001234"
    },
    consentProvided: true,
    consentCapturedAt: "2026-05-01T10:10:00+05:30"
  }
}, null, 2)

const KOTAK_DOCUMENT = JSON.stringify({
  kotakRequestId: "KOTAK-DOC-20260501-001",
  requestTimestamp: "2026-05-01T10:15:00+05:30",
  channelCode: "MARUTI_DMS",
  documentUploadPayload: {
    partnerAppId: "MSIL-APP-88821",
    kotakApplicationRef: "KOTAK-OFF-2026050188821",
    documentCategory: "KYC",
    documentType: "PAN_CARD",
    fileName: "pan_rahul_kumar.pdf",
    contentType: "application/pdf",
    fileBytes: 204800,
    base64FileContent: "<base64_encoded_content>",
    isEncryptedFile: false,
    fileDecryptionKey: null
  }
}, null, 2)

const KOTAK_STATUS = JSON.stringify({
  kotakRequestId: "KOTAK-STS-20260501-001",
  requestTimestamp: "2026-05-01T11:00:00+05:30",
  channelCode: "MARUTI_DMS",
  statusPollPayload: {
    partnerAppId: "MSIL-APP-88821",
    kotakRefId: "KOTAK-OFF-2026050188821",
    bankCode: "KOTAK"
  }
}, null, 2)

const KOTAK_DISBURSEMENT = JSON.stringify({
  kotakRequestId: "KOTAK-DISB-20260501-001",
  requestTimestamp: "2026-05-01T14:00:00+05:30",
  channelCode: "MARUTI_DMS",
  disbursementPayload: {
    partnerAppId: "MSIL-APP-88821",
    kotakLoanRefId: "KOTAK-OFF-2026050188821",
    payeeBankAccountNo: "000011112222",
    payeeBankIfsc: "KKBK0001234",
    payeeAccountHolderName: "Rahul Kumar",
    disbursalAmount: 600000,
    transferMode: "NEFT",
    payeeClassification: "CUSTOMER",
    registrationNumber: "MH01AB1234",
    vehicleChassisNo: "MA3FJEB1S00123456",
    vehicleEngineNo: "K10BN1234567",
    motorInsurancePolicyNo: "POL-2026-BAJAJ-9988"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// BAJAJ FINANCE — camelCase, "bajaj" / "bfl" prefix, nested wrapper objects
// BFL Auto Finance partner API (Consumer Durable / Vehicle vertical)
// ---------------------------------------------------------------------------

const BAJAJ_ELIGIBILITY = JSON.stringify({
  bflRequestId: "BFL-EL-20260501-001",
  requestDateTime: "2026-05-01T10:00:00+05:30",
  channel: "MARUTI_DMS",
  partnerCode: "MSIL",
  productType: "AUTO_LOAN",
  eligibilityRequest: {
    customerRefId: "MSIL-CUST-12345",
    panCard: "ABCDE1234F",
    dateOfBirth: "15/05/1990",
    gender: "M",
    maritalStatus: "M",
    employmentType: "SALARIED",
    monthlyIncome: 75000,
    emiObligation: 12000,
    loanAmountRequested: 600000,
    assetCost: 800000,
    downPayment: 200000,
    tenureInMonths: 60,
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400001",
    cibilScore: 750,
    isExistingBajajCustomer: false,
    vehicleCategory: "HATCHBACK",
    dealerCode: "MSIL-DLR-9901",
    educationalQualification: "GRADUATE"
  }
}, null, 2)

const BAJAJ_OFFER = JSON.stringify({
  bflRequestId: "BFL-OF-20260501-001",
  requestDateTime: "2026-05-01T10:05:00+05:30",
  channel: "MARUTI_DMS",
  partnerCode: "MSIL",
  productType: "AUTO_LOAN",
  offerRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    bflBankCode: "BFL",
    sanctionedAmount: 600000,
    tenureMonths: 60,
    flatRoi: 5.20,
    reducingRoi: 9.25,
    emiAmount: 12510,
    processingFee: 4500,
    processingFeePercent: 0.75,
    minimumDownPayment: 200000,
    assetLtv: 75.0,
    offerValidTill: "2026-05-31T23:59:59+05:30",
    bflOfferId: "BFL-OFF-2026050188821",
    schemeCode: "BFL_MSIL_APR26",
    foreClosureChargePercent: 4.0,
    isBaasEnabled: false
  }
}, null, 2)

const BAJAJ_APPLICATION = JSON.stringify({
  bflRequestId: "BFL-APP-20260501-001",
  requestDateTime: "2026-05-01T10:10:00+05:30",
  channel: "MARUTI_DMS",
  partnerCode: "MSIL",
  productType: "AUTO_LOAN",
  loanApplicationRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    customerDetails: {
      name: "Rahul Kumar",
      fatherName: "Suresh Kumar",
      gender: "M",
      dob: "15/05/1990",
      pan: "ABCDE1234F",
      aadhaar: "XXXXXXXXXXXX",
      mobile: "9876543210",
      email: "rahul.kumar@example.com"
    },
    addressDetails: {
      address1: "Flat 101, Sea View Apts",
      address2: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      residenceType: "OWNED",
      residingYears: 5
    },
    employmentDetails: {
      employmentCategory: "SALARIED",
      organizationName: "Tech Corp India Pvt Ltd",
      organizationAddress: "Andheri East, Mumbai",
      netMonthlyIncome: 75000
    },
    loanDetails: {
      loanAmount: 600000,
      tenure: 60,
      bflOfferId: "BFL-OFF-2026050188821"
    },
    assetDetails: {
      modelCode: "SWIFT",
      variant: "VXI",
      color: "Blazing Red",
      dealerCode: "MSIL-DLR-9901"
    },
    disbursementBankDetails: {
      accountNo: "000011112222",
      ifscCode: "HDFC0000123"
    },
    customerConsent: true,
    consentTimestamp: "2026-05-01T10:10:00+05:30"
  }
}, null, 2)

const BAJAJ_DOCUMENT = JSON.stringify({
  bflRequestId: "BFL-DOC-20260501-001",
  requestDateTime: "2026-05-01T10:15:00+05:30",
  channel: "MARUTI_DMS",
  partnerCode: "MSIL",
  documentUploadRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    bflApplicationRef: "BFL-OFF-2026050188821",
    documentGroup: "KYC",
    documentCode: "PAN",
    originalFileName: "pan_rahul_kumar.pdf",
    mimeType: "application/pdf",
    fileSize: 204800,
    encodedContent: "<base64_encoded_content>",
    isPasswordProtected: false,
    filePassword: null
  }
}, null, 2)

const BAJAJ_STATUS = JSON.stringify({
  bflRequestId: "BFL-STS-20260501-001",
  requestDateTime: "2026-05-01T11:00:00+05:30",
  channel: "MARUTI_DMS",
  statusCheckRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    bflReferenceId: "BFL-OFF-2026050188821",
    bankCode: "BFL"
  }
}, null, 2)

const BAJAJ_DISBURSEMENT = JSON.stringify({
  bflRequestId: "BFL-DISB-20260501-001",
  requestDateTime: "2026-05-01T14:00:00+05:30",
  channel: "MARUTI_DMS",
  partnerCode: "MSIL",
  disbursementRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    bflLoanAccountRef: "BFL-OFF-2026050188821",
    payeeAccount: "000011112222",
    payeeIfsc: "HDFC0000123",
    payeeName: "Rahul Kumar",
    disbursementAmount: 600000,
    disbursementMode: "NEFT",
    payeeType: "CUSTOMER",
    vehicleRegNumber: "MH01AB1234",
    chassisNumber: "MA3FJEB1S00123456",
    engineNumber: "K10BN1234567",
    insuranceNumber: "POL-2026-BAJAJ-9988"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// INDUSIND BANK — camelCase, IndusMobile / Finacle LOS pattern
// sandbox.indusind.com — developer sandbox
// ---------------------------------------------------------------------------

const INDUSIND_ELIGIBILITY = JSON.stringify({
  indusRequestId: "INDUS-EL-20260501-001",
  requestTimestamp: "2026-05-01T10:00:00+05:30",
  sourceChannel: "MARUTI_DMS",
  partnerCode: "MSIL",
  eligibilityPayload: {
    partnerCustRefNo: "MSIL-CUST-12345",
    panNumber: "ABCDE1234F",
    dateOfBirth: "1990-05-15",
    gender: "M",
    maritalStatus: "MARRIED",
    professionType: "SALARIED",
    grossMonthlyIncome: 75000,
    existingLoanEmi: 12000,
    appliedLoanAmount: 600000,
    vehicleOnRoadCost: 800000,
    initialContribution: 200000,
    loanDurationMonths: 60,
    cityOfResidence: "Mumbai",
    stateOfResidence: "Maharashtra",
    residencePinCode: "400001",
    creditBureauScore: 750,
    existingIndusCustomer: false,
    vehicleBodyType: "HATCHBACK",
    dealerOutletCode: "MSIL-DLR-9901",
    academicQualification: "GRADUATE"
  }
}, null, 2)

const INDUSIND_OFFER = JSON.stringify({
  indusRequestId: "INDUS-OF-20260501-001",
  requestTimestamp: "2026-05-01T10:05:00+05:30",
  sourceChannel: "MARUTI_DMS",
  partnerCode: "MSIL",
  offerGenerationPayload: {
    partnerApplicationId: "MSIL-APP-88821",
    lenderCode: "INDUSIND",
    sanctionedLoanAmount: 600000,
    loanTenureMonths: 60,
    annualRateOfInterest: 8.90,
    monthlyInstalment: 12460,
    processingCharges: 3500,
    processingChargesPct: 0.58,
    downPaymentRequired: 200000,
    ltvPercentage: 75.0,
    offerValidUntil: "2026-05-31T23:59:59+05:30",
    indusOfferId: "INDUS-OFF-2026050188821",
    campaignCode: "INDUS_MSIL_APR26",
    prepaymentChargesPct: 3.5,
    isBaasProduct: false
  }
}, null, 2)

const INDUSIND_APPLICATION = JSON.stringify({
  indusRequestId: "INDUS-APP-20260501-001",
  requestTimestamp: "2026-05-01T10:10:00+05:30",
  sourceChannel: "MARUTI_DMS",
  partnerCode: "MSIL",
  vehicleLoanRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    applicantData: {
      applicantName: "Rahul Kumar",
      fatherName: "Suresh Kumar",
      genderCode: "M",
      birthDate: "1990-05-15",
      panCardNo: "ABCDE1234F",
      aadhaarNo: "XXXXXXXXXXXX",
      mobileNumber: "9876543210",
      emailId: "rahul.kumar@example.com"
    },
    residenceData: {
      addressLine1: "Flat 101, Sea View Apts",
      addressLine2: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400050",
      propertyOwnership: "OWNED",
      yearsAtAddress: 5
    },
    employmentData: {
      employmentClassification: "SALARIED",
      employerName: "Tech Corp India Pvt Ltd",
      workAddress: "Andheri East, Mumbai",
      takeHomeSalary: 75000
    },
    loanData: {
      requestedAmount: 600000,
      repaymentMonths: 60,
      indusOfferRefId: "INDUS-OFF-2026050188821"
    },
    vehicleData: {
      vehicleModel: "SWIFT",
      vehicleVariant: "VXI",
      vehicleColour: "Blazing Red",
      dealerCode: "MSIL-DLR-9901"
    },
    bankAccountData: {
      accountNumber: "000011112222",
      ifscCode: "INDB0000123"
    },
    consentGiven: true,
    consentRecordedAt: "2026-05-01T10:10:00+05:30"
  }
}, null, 2)

const INDUSIND_DOCUMENT = JSON.stringify({
  indusRequestId: "INDUS-DOC-20260501-001",
  requestTimestamp: "2026-05-01T10:15:00+05:30",
  sourceChannel: "MARUTI_DMS",
  documentUploadPayload: {
    partnerApplicationId: "MSIL-APP-88821",
    indusApplicationRef: "INDUS-OFF-2026050188821",
    docType: "PAN",
    docSubType: "PAN_CARD",
    documentFileName: "pan_rahul_kumar.pdf",
    documentMimeType: "application/pdf",
    documentSizeBytes: 204800,
    documentContent: "<base64_encoded_content>",
    isProtected: false,
    protectionPassword: null
  }
}, null, 2)

const INDUSIND_STATUS = JSON.stringify({
  indusRequestId: "INDUS-STS-20260501-001",
  requestTimestamp: "2026-05-01T11:00:00+05:30",
  sourceChannel: "MARUTI_DMS",
  applicationStatusRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    indusReferenceId: "INDUS-OFF-2026050188821",
    bankCode: "INDUSIND"
  }
}, null, 2)

const INDUSIND_DISBURSEMENT = JSON.stringify({
  indusRequestId: "INDUS-DISB-20260501-001",
  requestTimestamp: "2026-05-01T14:00:00+05:30",
  sourceChannel: "MARUTI_DMS",
  disbursementPayload: {
    partnerApplicationId: "MSIL-APP-88821",
    indusLoanRef: "INDUS-OFF-2026050188821",
    beneficiaryAccountNo: "000011112222",
    beneficiaryIfscCode: "INDB0000123",
    accountHolderName: "Rahul Kumar",
    disbursementAmountInr: 600000,
    paymentMethod: "NEFT",
    payeeSegment: "CUSTOMER",
    vehicleRegNo: "MH01AB1234",
    chassisNo: "MA3FJEB1S00123456",
    engineNo: "K10BN1234567",
    motorPolicyNo: "POL-2026-BAJAJ-9988"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// PUNJAB NATIONAL BANK (PNB) — snake_case, govt-PSB style abbreviations
// pnb.bank.in Digital Car Loan / Open Banking API
// ---------------------------------------------------------------------------

const PNB_ELIGIBILITY = JSON.stringify({
  req_id: "PNB-EL-20260501-001",
  req_dt: "01/05/2026",
  req_tm: "10:00:00",
  src_sys: "MARUTI_DMS",
  partner_cd: "MSIL",
  eligibility_chk_req: {
    cust_ref_no: "MSIL-CUST-12345",
    pan_no: "ABCDE1234F",
    dob: "15/05/1990",
    gender_cd: "M",
    marital_sts: "M",
    emp_type_cd: "SL",
    monthly_grs_inc: 75000,
    running_emi_amt: 12000,
    loan_amt_reqd: 600000,
    veh_on_rd_price: 800000,
    down_pay_amt: 200000,
    tenure_mths: 60,
    city: "Mumbai",
    state: "Maharashtra",
    pin: "400001",
    cibil_scr: 750,
    pnb_cust_flg: "N",
    veh_category: "HATCHBACK",
    dealer_cd: "MSIL-DLR-9901",
    edu_qual_cd: "GRD"
  }
}, null, 2)

const PNB_OFFER = JSON.stringify({
  req_id: "PNB-OF-20260501-001",
  req_dt: "01/05/2026",
  req_tm: "10:05:00",
  src_sys: "MARUTI_DMS",
  partner_cd: "MSIL",
  offer_dtls_req: {
    appl_no: "MSIL-APP-88821",
    bank_cd: "PNB",
    sanc_amt: 600000,
    tenure_mths: 60,
    int_rate_pa: 8.35,
    emi_amt: 12340,
    proc_fee_amt: 2000,
    proc_fee_pct: 0.33,
    min_down_pay: 200000,
    ltv_pct: 75.0,
    offer_valid_dt: "31/05/2026",
    offer_no: "PNB-OFF-2026050188821",
    scheme_cd: "PNB_MSIL_APR26",
    foreclosure_pct: 2.0,
    baas_flg: "N"
  }
}, null, 2)

const PNB_APPLICATION = JSON.stringify({
  req_id: "PNB-APP-20260501-001",
  req_dt: "01/05/2026",
  req_tm: "10:10:00",
  src_sys: "MARUTI_DMS",
  partner_cd: "MSIL",
  loan_appl: {
    appl_no: "MSIL-APP-88821",
    personal_info: {
      appl_nm: "Rahul Kumar",
      father_nm: "Suresh Kumar",
      gender: "M",
      dob: "15051990",
      pan_no: "ABCDE1234F",
      aadhaar_no: "XXXXXXXXXXXX",
      mob_no: "9876543210",
      email: "rahul.kumar@example.com"
    },
    addr_info: {
      addr1: "Flat 101, Sea View Apts",
      addr2: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      house_own_sts: "OWNED",
      stay_yrs: 5
    },
    emp_info: {
      emp_type_cd: "SL",
      emp_org_nm: "Tech Corp India Pvt Ltd",
      emp_addr: "Andheri East, Mumbai",
      grs_salary: 75000
    },
    loan_info: {
      loan_amt: 600000,
      tenure_mths: 60,
      offer_no: "PNB-OFF-2026050188821"
    },
    veh_info: {
      model_cd: "SWIFT",
      variant_cd: "VXI",
      colour: "Blazing Red",
      dealer_cd: "MSIL-DLR-9901"
    },
    bank_info: {
      acct_no: "000011112222",
      ifsc_cd: "PUNB0001234"
    },
    consent_flg: "Y",
    consent_dt_tm: "01/05/2026 10:10:00"
  }
}, null, 2)

const PNB_DOCUMENT = JSON.stringify({
  req_id: "PNB-DOC-20260501-001",
  req_dt: "01/05/2026",
  req_tm: "10:15:00",
  src_sys: "MARUTI_DMS",
  doc_upload_req: {
    appl_no: "MSIL-APP-88821",
    pnb_loan_ref: "PNB-OFF-2026050188821",
    doc_type: "PAN",
    doc_sub_type: "PAN_CARD",
    file_name: "pan_rahul_kumar.pdf",
    mime_type: "application/pdf",
    file_size: 204800,
    file_content: "<base64_encoded_content>",
    pwd_prot_flg: "N",
    file_pwd: null
  }
}, null, 2)

const PNB_STATUS = JSON.stringify({
  req_id: "PNB-STS-20260501-001",
  req_dt: "01/05/2026",
  req_tm: "11:00:00",
  src_sys: "MARUTI_DMS",
  sts_enq_req: {
    appl_no: "MSIL-APP-88821",
    pnb_ref_no: "PNB-OFF-2026050188821",
    bank_cd: "PNB"
  }
}, null, 2)

const PNB_DISBURSEMENT = JSON.stringify({
  req_id: "PNB-DISB-20260501-001",
  req_dt: "01/05/2026",
  req_tm: "14:00:00",
  src_sys: "MARUTI_DMS",
  disb_req: {
    appl_no: "MSIL-APP-88821",
    pnb_loan_acct_ref: "PNB-OFF-2026050188821",
    benef_acct_no: "000011112222",
    benef_ifsc: "PUNB0001234",
    benef_nm: "Rahul Kumar",
    disb_amt: 600000,
    pay_mode: "NEFT",
    payee_type_cd: "CUST",
    rc_no: "MH01AB1234",
    chassis_no: "MA3FJEB1S00123456",
    engine_no: "K10BN1234567",
    ins_pol_no: "POL-2026-BAJAJ-9988"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// MAHINDRA FINANCE (MMFSL) — camelCase, "mmfsl" prefix on refs, flat-nested
// Mahindra Finance dealer portal API — vehicleloan.mahindrafinance.com
// ---------------------------------------------------------------------------

const MAHINDRA_ELIGIBILITY = JSON.stringify({
  mmfslRequestId: "MMFSL-EL-20260501-001",
  requestDateTime: "2026-05-01T10:00:00+05:30",
  channelCode: "MARUTI_DMS",
  dealerPartnerCode: "MSIL",
  productCode: "VHL",
  eligibilityRequest: {
    applicantRefNo: "MSIL-CUST-12345",
    panCardNo: "ABCDE1234F",
    dateOfBirth: "15-05-1990",
    genderCode: "M",
    maritalStatusCode: "M",
    occupationCode: "SAL",
    grossMonthlyIncome: 75000,
    existingEmiLiability: 12000,
    vehicleLoanRequired: 600000,
    onRoadPrice: 800000,
    ownFunding: 200000,
    repaymentTenure: 60,
    branchCity: "Mumbai",
    branchState: "Maharashtra",
    areaPinCode: "400001",
    cibilScore: 750,
    existingMmfslCustomer: false,
    vehicleType: "HATCHBACK",
    dealerCode: "MSIL-DLR-9901",
    educationQualification: "GRADUATE"
  }
}, null, 2)

const MAHINDRA_OFFER = JSON.stringify({
  mmfslRequestId: "MMFSL-OF-20260501-001",
  requestDateTime: "2026-05-01T10:05:00+05:30",
  channelCode: "MARUTI_DMS",
  dealerPartnerCode: "MSIL",
  productCode: "VHL",
  offerRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    financierCode: "MMFSL",
    approvedFinanceAmount: 600000,
    loanTenureMonths: 60,
    interestRatePerAnnum: 9.50,
    equatedMonthlyInstalment: 12575,
    processingFee: 4000,
    processingFeePercent: 0.67,
    minimumOwnContribution: 200000,
    ltvRatio: 75.0,
    offerValidityDate: "2026-05-31T23:59:59+05:30",
    mmfslOfferId: "MMFSL-OFF-2026050188821",
    schemeIdentifier: "MMFSL_MSIL_APR26",
    foreclosureChargePercent: 4.5,
    isBaasFinancing: false
  }
}, null, 2)

const MAHINDRA_APPLICATION = JSON.stringify({
  mmfslRequestId: "MMFSL-APP-20260501-001",
  requestDateTime: "2026-05-01T10:10:00+05:30",
  channelCode: "MARUTI_DMS",
  dealerPartnerCode: "MSIL",
  productCode: "VHL",
  loanApplicationRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    applicantDetails: {
      applicantName: "Rahul Kumar",
      fatherName: "Suresh Kumar",
      gender: "M",
      dob: "15-05-1990",
      pan: "ABCDE1234F",
      aadhaarNo: "XXXXXXXXXXXX",
      mobileNo: "9876543210",
      emailId: "rahul.kumar@example.com"
    },
    addressDetails: {
      houseAddress1: "Flat 101, Sea View Apts",
      houseAddress2: "Bandra West",
      districtCity: "Mumbai",
      stateName: "Maharashtra",
      pinCode: "400050",
      houseOwnershipType: "OWNED",
      yearsAtAddress: 5
    },
    incomeDetails: {
      occupationType: "SALARIED",
      employerName: "Tech Corp India Pvt Ltd",
      officeAddress: "Andheri East, Mumbai",
      grossMonthlyIncome: 75000
    },
    financeDetails: {
      financeAmount: 600000,
      repaymentTenure: 60,
      mmfslOfferRef: "MMFSL-OFF-2026050188821"
    },
    vehicleDetails: {
      modelCode: "SWIFT",
      variantCode: "VXI",
      colorCode: "RED",
      dealerCode: "MSIL-DLR-9901"
    },
    repaymentDetails: {
      bankAccountNo: "000011112222",
      bankIfscCode: "MAHB0001234"
    },
    customerConsentFlag: true,
    consentDateTime: "2026-05-01T10:10:00+05:30"
  }
}, null, 2)

const MAHINDRA_DOCUMENT = JSON.stringify({
  mmfslRequestId: "MMFSL-DOC-20260501-001",
  requestDateTime: "2026-05-01T10:15:00+05:30",
  channelCode: "MARUTI_DMS",
  docSubmissionRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    mmfslApplicationRef: "MMFSL-OFF-2026050188821",
    documentTypeCode: "PAN",
    documentSubTypeCode: "PAN_CARD",
    documentName: "pan_rahul_kumar.pdf",
    documentMimeType: "application/pdf",
    documentSizeBytes: 204800,
    documentContent: "<base64_encoded_content>",
    isPasswordEnabled: false,
    documentPassword: null
  }
}, null, 2)

const MAHINDRA_STATUS = JSON.stringify({
  mmfslRequestId: "MMFSL-STS-20260501-001",
  requestDateTime: "2026-05-01T11:00:00+05:30",
  channelCode: "MARUTI_DMS",
  applicationStatusRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    mmfslReferenceId: "MMFSL-OFF-2026050188821",
    financierCode: "MMFSL"
  }
}, null, 2)

const MAHINDRA_DISBURSEMENT = JSON.stringify({
  mmfslRequestId: "MMFSL-DISB-20260501-001",
  requestDateTime: "2026-05-01T14:00:00+05:30",
  channelCode: "MARUTI_DMS",
  dealerPartnerCode: "MSIL",
  disbursementRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    mmfslLoanAccountRef: "MMFSL-OFF-2026050188821",
    payeeBankAccount: "000011112222",
    payeeIfscCode: "MAHB0001234",
    payeeName: "Rahul Kumar",
    disbursementAmount: 600000,
    paymentInstrumentMode: "NEFT",
    payeeType: "CUSTOMER",
    vehicleRegistrationNo: "MH01AB1234",
    chassisNumber: "MA3FJEB1S00123456",
    engineNumber: "K10BN1234567",
    motorInsurancePolicyNo: "POL-2026-BAJAJ-9988"
  }
}, null, 2)

// ---------------------------------------------------------------------------
// JOURNEY STAGE DEFINITIONS
// ---------------------------------------------------------------------------

export const JOURNEY_STAGES: JourneyStageDef[] = [
  {
    id: 'eligibility_check',
    label: 'Eligibility Check',
    icon: '🔍',
    description: 'Pre-qualification: income, CIBIL, FOIR check before generating offers',
    masterMarutiJson: ELIGIBILITY_MASTER,
    masterMarutiXml: '',
    bankSamples: {
      'HDFC Bank': HDFC_ELIGIBILITY,
      'ICICI Bank': ICICI_ELIGIBILITY,
      'Axis Bank': AXIS_ELIGIBILITY,
      'SBI (State Bank of India)': SBI_ELIGIBILITY,
      'AU SFB': AUSFB_ELIGIBILITY,
      'Kotak Mahindra Bank': KOTAK_ELIGIBILITY,
      'Bajaj Finance': BAJAJ_ELIGIBILITY,
      'IndusInd Bank': INDUSIND_ELIGIBILITY,
      'Punjab National Bank': PNB_ELIGIBILITY,
      'Mahindra Finance': MAHINDRA_ELIGIBILITY,
    }
  },
  {
    id: 'offer_generation',
    label: 'Offer Generation',
    icon: '💰',
    description: 'Rate, EMI, tenure offer from bank after eligibility approval',
    masterMarutiJson: OFFER_MASTER,
    masterMarutiXml: '',
    bankSamples: {
      'HDFC Bank': HDFC_OFFER,
      'ICICI Bank': ICICI_OFFER,
      'Axis Bank': AXIS_OFFER,
      'SBI (State Bank of India)': SBI_OFFER,
      'AU SFB': AUSFB_OFFER,
      'Kotak Mahindra Bank': KOTAK_OFFER,
      'Bajaj Finance': BAJAJ_OFFER,
      'IndusInd Bank': INDUSIND_OFFER,
      'Punjab National Bank': PNB_OFFER,
      'Mahindra Finance': MAHINDRA_OFFER,
    }
  },
  {
    id: 'loan_application',
    label: 'Loan Application',
    icon: '📋',
    description: 'Full applicant details, vehicle info, dealer submission',
    masterMarutiJson: APPLICATION_MASTER,
    masterMarutiXml: '',
    bankSamples: {
      'HDFC Bank': HDFC_APPLICATION,
      'ICICI Bank': ICICI_APPLICATION,
      'Axis Bank': AXIS_APPLICATION,
      'SBI (State Bank of India)': SBI_APPLICATION,
      'AU SFB': AUSFB_APPLICATION,
      'Kotak Mahindra Bank': KOTAK_APPLICATION,
      'Bajaj Finance': BAJAJ_APPLICATION,
      'IndusInd Bank': INDUSIND_APPLICATION,
      'Punjab National Bank': PNB_APPLICATION,
      'Mahindra Finance': MAHINDRA_APPLICATION,
    }
  },
  {
    id: 'document_upload',
    label: 'Document Upload',
    icon: '📎',
    description: 'KYC, income proof, vehicle documents upload to bank',
    masterMarutiJson: DOCUMENT_MASTER,
    masterMarutiXml: '',
    bankSamples: {
      'HDFC Bank': HDFC_DOCUMENT,
      'ICICI Bank': ICICI_DOCUMENT,
      'Axis Bank': AXIS_DOCUMENT,
      'SBI (State Bank of India)': SBI_DOCUMENT,
      'AU SFB': AUSFB_DOCUMENT,
      'Kotak Mahindra Bank': KOTAK_DOCUMENT,
      'Bajaj Finance': BAJAJ_DOCUMENT,
      'IndusInd Bank': INDUSIND_DOCUMENT,
      'Punjab National Bank': PNB_DOCUMENT,
      'Mahindra Finance': MAHINDRA_DOCUMENT,
    }
  },
  {
    id: 'status_polling',
    label: 'Status Polling',
    icon: '🔄',
    description: 'Poll bank LOS for application status updates',
    masterMarutiJson: STATUS_MASTER,
    masterMarutiXml: '',
    bankSamples: {
      'HDFC Bank': HDFC_STATUS,
      'ICICI Bank': ICICI_STATUS,
      'Axis Bank': AXIS_STATUS,
      'SBI (State Bank of India)': SBI_STATUS,
      'AU SFB': AUSFB_STATUS,
      'Kotak Mahindra Bank': KOTAK_STATUS,
      'Bajaj Finance': BAJAJ_STATUS,
      'IndusInd Bank': INDUSIND_STATUS,
      'Punjab National Bank': PNB_STATUS,
      'Mahindra Finance': MAHINDRA_STATUS,
    }
  },
  {
    id: 'disbursement',
    label: 'Disbursement',
    icon: '🏦',
    description: 'Initiate loan disbursement to dealer or customer',
    masterMarutiJson: DISBURSEMENT_MASTER,
    masterMarutiXml: '',
    bankSamples: {
      'HDFC Bank': HDFC_DISBURSEMENT,
      'ICICI Bank': ICICI_DISBURSEMENT,
      'Axis Bank': AXIS_DISBURSEMENT,
      'SBI (State Bank of India)': SBI_DISBURSEMENT,
      'AU SFB': AUSFB_DISBURSEMENT,
      'Kotak Mahindra Bank': KOTAK_DISBURSEMENT,
      'Bajaj Finance': BAJAJ_DISBURSEMENT,
      'IndusInd Bank': INDUSIND_DISBURSEMENT,
      'Punjab National Bank': PNB_DISBURSEMENT,
      'Mahindra Finance': MAHINDRA_DISBURSEMENT,
    }
  }
]
