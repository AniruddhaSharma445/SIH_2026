/**
 * Official ANVESHAK Synthetic Dataset
 * Generated from Investigation Records for Case reference CASE-2026-014 (Bhopal Central)
 */

export interface RawFirDocument {
  documentId: string;
  date: string;
  location: string;
  text: string;
}

export interface RawAccount {
  accountId: string;
  accountNumber: string;
  ownerId: number;
}

export interface RawPerson {
  personId: number;
  name: string;
  alternateName: string;
  syntheticPersonId: string;
  normalizedName: string;
}

export interface RawPhone {
  phoneId: string;
  phoneNumber: string;
  personId: number;
  sourceId: string;
}

export interface RawRelationship {
  relationshipId: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  confidence: number;
  sourceDocumentId: string;
  context: string;
}

export interface RawTransaction {
  transactionId: string;
  timestamp: string;
  senderAccount: string;
  receiverAccount: string;
  amountInr: number;
  reference: string;
  sourceId: string;
}

export interface RawVehicle {
  vehicleId: string;
  registrationNumber: string;
  ownerId: number;
}

export interface RawCdr {
  cdrId: string;
  timestamp: string;
  callerPhone: string;
  receiverPhone: string;
  durationMinutes: number;
  location: string;
  sourceId: string;
}

// 1. FIR DOCUMENTS (FIR_001 - FIR_012)
export const RAW_FIRS: RawFirDocument[] = [
  {
    documentId: 'FIR_001',
    date: '2026-08-01',
    location: 'Bhopal Central',
    text: 'On 01 August 2026, the report records that Rahul K Sharma met Amit Verma near New Market, Bhopal. Rahul Sharma was using vehicle MP04AB1234. The note states that the two discussed a delivery planned for the following evening. Contact number 9000010000 was associated with Rahul Sharma.',
  },
  {
    documentId: 'FIR_002',
    date: '2026-08-02',
    location: 'Bhopal Central',
    text: 'Witness information states that Suresh Patel met Amit Verma near Habibganj station. Suresh Patel used vehicle MP04CD5678 for part of the journey. The report references phone 9000010002 and case reference CASE-2026-014.',
  },
  {
    documentId: 'FIR_003',
    date: '2026-08-03',
    location: 'Sehore Road',
    text: 'A field note mentions Neeraj Khan, also recorded as N. Khan, meeting Rahul Sharma at a roadside restaurant on Sehore Road. Neeraj used MP04EF9012. The same note mentions Amit Verma as a person known to Neeraj. Location: Sehore Road, Bhopal.',
  },
  {
    documentId: 'FIR_004',
    date: '2026-08-04',
    location: 'Kolar Road',
    text: "Investigators recorded that Vikram Singh and Pooja Mehta visited Kolar Road together. Vikram Singh was linked to MP04GH3456. Pooja Mehta's number 9000010005 appears in the source notes.",
  },
  {
    documentId: 'FIR_005',
    date: '2026-08-05',
    location: 'Old Bhopal',
    text: 'The source reports communication between Rakesh Yadav, Imran Sheikh and Karan Joshi. Imran Sheikh was associated with MP04JK7890. The three names occur in the same intelligence note.',
  },
  {
    documentId: 'FIR_006',
    date: '2026-08-06',
    location: 'Misrod',
    text: 'An intelligence note says Deepak Rao met Anjali Verma at Misrod. Manish Gupta is mentioned as a common contact. Deepak Rao used phone 9000010009 and vehicle MP04NP6789 is linked to Manish Gupta.',
  },
  {
    documentId: 'FIR_007',
    date: '2026-08-07',
    location: 'MP Nagar',
    text: 'The report connects Sameer Khan, Nitin Tiwari and Farhan Ali. Farhan Ali was observed near MP Nagar and is associated with phone 9000010014. Case reference CASE-2026-021.',
  },
  {
    documentId: 'FIR_008',
    date: '2026-08-08',
    location: 'Bairagarh',
    text: 'Kavita Singh and Arjun Malhotra were reported together in Bairagarh. Rohit Jain is listed as another contact in the same source. Kavita Singh uses phone 9000010015.',
  },
  {
    documentId: 'FIR_009',
    date: '2026-08-09',
    location: 'Bhopal Central',
    text: 'A later source refers to R. Sharma, Amit Verma and N. Khan. The text states that R. Sharma is the same person previously recorded as Rahul Sharma. The three names were linked through the same meeting location in Bhopal.',
  },
  {
    documentId: 'FIR_010',
    date: '2026-08-10',
    location: 'Habibganj',
    text: 'A transaction-related note mentions Rahul Sharma, Suresh Patel and Neeraj Khan. Account 4567891201 is associated with Rahul Sharma. Account 4567891203 is associated with Suresh Patel.',
  },
  {
    documentId: 'FIR_011',
    date: '2026-08-11',
    location: 'Kolar Road',
    text: 'The report mentions Rahul K Sharma and Manish Gupta. Rahul K Sharma is listed with phone 9000010000. Manish Gupta is linked to vehicle MP04NP6789. The source asks investigators to compare this record with earlier CDR entries.',
  },
  {
    documentId: 'FIR_012',
    date: '2026-08-12',
    location: 'MP Nagar',
    text: 'A final synthetic intelligence note mentions Amit Verma, Farhan Ali and Rahul Sharma. It states that these names appear in separate source types and recommends evidence correlation.',
  },
];

// 2. PERSONS (P-001 to P-020)
export const RAW_PERSONS: RawPerson[] = [
  { personId: 1, name: 'Rahul Sharma', alternateName: 'Rahul K Sharma', syntheticPersonId: 'P-001', normalizedName: 'rahulsharma' },
  { personId: 2, name: 'Amit Verma', alternateName: 'Amit Verma', syntheticPersonId: 'P-002', normalizedName: 'amitverma' },
  { personId: 3, name: 'Suresh Patel', alternateName: 'Suresh Patel', syntheticPersonId: 'P-003', normalizedName: 'sureshpatel' },
  { personId: 4, name: 'Neeraj Khan', alternateName: 'N. Khan', syntheticPersonId: 'P-004', normalizedName: 'neerajkhan' },
  { personId: 5, name: 'Vikram Singh', alternateName: 'Vikram Singh', syntheticPersonId: 'P-005', normalizedName: 'vikramsingh' },
  { personId: 6, name: 'Pooja Mehta', alternateName: 'Pooja Mehta', syntheticPersonId: 'P-006', normalizedName: 'poojamehta' },
  { personId: 7, name: 'Rakesh Yadav', alternateName: 'R. Yadav', syntheticPersonId: 'P-007', normalizedName: 'rakeshyadav' },
  { personId: 8, name: 'Imran Sheikh', alternateName: 'Imran Sheikh', syntheticPersonId: 'P-008', normalizedName: 'imransheikh' },
  { personId: 9, name: 'Karan Joshi', alternateName: 'Karan Joshi', syntheticPersonId: 'P-009', normalizedName: 'karanjoshi' },
  { personId: 10, name: 'Deepak Rao', alternateName: 'Deepak Rao', syntheticPersonId: 'P-010', normalizedName: 'deepakrao' },
  { personId: 11, name: 'Anjali Verma', alternateName: 'Anjali Verma', syntheticPersonId: 'P-011', normalizedName: 'anjaliverma' },
  { personId: 12, name: 'Manish Gupta', alternateName: 'M. Gupta', syntheticPersonId: 'P-012', normalizedName: 'manishgupta' },
  { personId: 13, name: 'Sameer Khan', alternateName: 'Sameer Khan', syntheticPersonId: 'P-013', normalizedName: 'sameerkhan' },
  { personId: 14, name: 'Nitin Tiwari', alternateName: 'Nitin Tiwari', syntheticPersonId: 'P-014', normalizedName: 'nitintiwari' },
  { personId: 15, name: 'Farhan Ali', alternateName: 'F. Ali', syntheticPersonId: 'P-015', normalizedName: 'farhanali' },
  { personId: 16, name: 'Kavita Singh', alternateName: 'Kavita Singh', syntheticPersonId: 'P-016', normalizedName: 'kavitasingh' },
  { personId: 17, name: 'Arjun Malhotra', alternateName: 'A. Malhotra', syntheticPersonId: 'P-017', normalizedName: 'arjunmalhotra' },
  { personId: 18, name: 'Rohit Jain', alternateName: 'Rohit Jain', syntheticPersonId: 'P-018', normalizedName: 'rohitjain' },
  { personId: 19, name: 'Sunil Mishra', alternateName: 'S. Mishra', syntheticPersonId: 'P-019', normalizedName: 'sunilmishra' },
  { personId: 20, name: 'Meena Kapoor', alternateName: 'Meena Kapoor', syntheticPersonId: 'P-020', normalizedName: 'meenakapoor' },
];

// 3. ACCOUNTS (AC-001 to AC-010)
export const RAW_ACCOUNTS: RawAccount[] = [
  { accountId: 'AC-001', accountNumber: '4567891201', ownerId: 1 },
  { accountId: 'AC-002', accountNumber: '4567891202', ownerId: 2 },
  { accountId: 'AC-003', accountNumber: '4567891203', ownerId: 3 },
  { accountId: 'AC-004', accountNumber: '4567891204', ownerId: 4 },
  { accountId: 'AC-005', accountNumber: '4567891205', ownerId: 5 },
  { accountId: 'AC-006', accountNumber: '4567891206', ownerId: 8 },
  { accountId: 'AC-007', accountNumber: '4567891207', ownerId: 9 },
  { accountId: 'AC-008', accountNumber: '4567891208', ownerId: 12 },
  { accountId: 'AC-009', accountNumber: '4567891209', ownerId: 15 },
  { accountId: 'AC-010', accountNumber: '4567891210', ownerId: 17 },
];

// 4. PHONES (PH-001 to PH-020)
export const RAW_PHONES: RawPhone[] = [
  { phoneId: 'PH-001', phoneNumber: '9000010000', personId: 1, sourceId: 'FIR_001' },
  { phoneId: 'PH-002', phoneNumber: '9000010001', personId: 2, sourceId: 'FIR_002' },
  { phoneId: 'PH-003', phoneNumber: '9000010002', personId: 3, sourceId: 'FIR_003' },
  { phoneId: 'PH-004', phoneNumber: '9000010003', personId: 4, sourceId: 'FIR_004' },
  { phoneId: 'PH-005', phoneNumber: '9000010004', personId: 5, sourceId: 'FIR_005' },
  { phoneId: 'PH-006', phoneNumber: '9000010005', personId: 6, sourceId: 'FIR_006' },
  { phoneId: 'PH-007', phoneNumber: '9000010006', personId: 7, sourceId: 'FIR_007' },
  { phoneId: 'PH-008', phoneNumber: '9000010007', personId: 8, sourceId: 'FIR_008' },
  { phoneId: 'PH-009', phoneNumber: '9000010008', personId: 9, sourceId: 'FIR_001' },
  { phoneId: 'PH-010', phoneNumber: '9000010009', personId: 10, sourceId: 'FIR_002' },
  { phoneId: 'PH-011', phoneNumber: '9000010010', personId: 11, sourceId: 'FIR_003' },
  { phoneId: 'PH-012', phoneNumber: '9000010011', personId: 12, sourceId: 'FIR_004' },
  { phoneId: 'PH-013', phoneNumber: '9000010012', personId: 13, sourceId: 'FIR_005' },
  { phoneId: 'PH-014', phoneNumber: '9000010013', personId: 14, sourceId: 'FIR_006' },
  { phoneId: 'PH-015', phoneNumber: '9000010014', personId: 15, sourceId: 'FIR_007' },
  { phoneId: 'PH-016', phoneNumber: '9000010015', personId: 16, sourceId: 'FIR_008' },
  { phoneId: 'PH-017', phoneNumber: '9000010016', personId: 17, sourceId: 'FIR_001' },
  { phoneId: 'PH-018', phoneNumber: '9000010017', personId: 18, sourceId: 'FIR_002' },
  { phoneId: 'PH-019', phoneNumber: '9000010018', personId: 19, sourceId: 'FIR_003' },
  { phoneId: 'PH-020', phoneNumber: '9000010019', personId: 20, sourceId: 'FIR_004' },
];

// 5. VEHICLES (VH-001 to VH-008)
export const RAW_VEHICLES: RawVehicle[] = [
  { vehicleId: 'VH-001', registrationNumber: 'MP04AB1234', ownerId: 1 },
  { vehicleId: 'VH-002', registrationNumber: 'MP04CD5678', ownerId: 2 },
  { vehicleId: 'VH-003', registrationNumber: 'MP04EF9012', ownerId: 4 },
  { vehicleId: 'VH-004', registrationNumber: 'MP04GH3456', ownerId: 5 },
  { vehicleId: 'VH-005', registrationNumber: 'MP04JK7890', ownerId: 8 },
  { vehicleId: 'VH-006', registrationNumber: 'MP04LM2345', ownerId: 9 },
  { vehicleId: 'VH-007', registrationNumber: 'MP04NP6789', ownerId: 12 },
  { vehicleId: 'VH-008', registrationNumber: 'MP04QR0123', ownerId: 15 },
];

// 6. RELATIONSHIPS (REL_001 to REL_018)
export const RAW_RELATIONSHIPS: RawRelationship[] = [
  {
    relationshipId: 'REL_001',
    sourceEntityId: 'P-001',
    targetEntityId: 'P-002',
    type: 'CONTACTED',
    confidence: 0.96,
    sourceDocumentId: 'FIR_001',
    context: 'Rahul Sharma discussed a delivery with Amit Verma.',
  },
  {
    relationshipId: 'REL_002',
    sourceEntityId: 'P-002',
    targetEntityId: 'P-003',
    type: 'ASSOCIATED_WITH',
    confidence: 0.91,
    sourceDocumentId: 'FIR_002',
    context: 'Amit Verma met Suresh Patel.',
  },
  {
    relationshipId: 'REL_003',
    sourceEntityId: 'P-004',
    targetEntityId: 'P-001',
    type: 'ASSOCIATED_WITH',
    confidence: 0.93,
    sourceDocumentId: 'FIR_003',
    context: 'Neeraj Khan met Rahul Sharma.',
  },
  {
    relationshipId: 'REL_004',
    sourceEntityId: 'P-005',
    targetEntityId: 'P-006',
    type: 'ASSOCIATED_WITH',
    confidence: 0.9,
    sourceDocumentId: 'FIR_004',
    context: 'Vikram Singh and Pooja Mehta were together.',
  },
  {
    relationshipId: 'REL_005',
    sourceEntityId: 'P-007',
    targetEntityId: 'P-008',
    type: 'ASSOCIATED_WITH',
    confidence: 0.88,
    sourceDocumentId: 'FIR_005',
    context: 'Rakesh Yadav and Imran Sheikh occurred in same note.',
  },
  {
    relationshipId: 'REL_006',
    sourceEntityId: 'P-008',
    targetEntityId: 'P-009',
    type: 'ASSOCIATED_WITH',
    confidence: 0.87,
    sourceDocumentId: 'FIR_005',
    context: 'Imran Sheikh and Karan Joshi occurred in same note.',
  },
  {
    relationshipId: 'REL_007',
    sourceEntityId: 'P-010',
    targetEntityId: 'P-011',
    type: 'ASSOCIATED_WITH',
    confidence: 0.89,
    sourceDocumentId: 'FIR_006',
    context: 'Deepak Rao met Anjali Verma.',
  },
  {
    relationshipId: 'REL_008',
    sourceEntityId: 'P-012',
    targetEntityId: 'P-010',
    type: 'ASSOCIATED_WITH',
    confidence: 0.86,
    sourceDocumentId: 'FIR_006',
    context: 'Manish Gupta mentioned as common contact.',
  },
  {
    relationshipId: 'REL_009',
    sourceEntityId: 'P-013',
    targetEntityId: 'P-014',
    type: 'ASSOCIATED_WITH',
    confidence: 0.9,
    sourceDocumentId: 'FIR_007',
    context: 'Sameer Khan and Nitin Tiwari linked.',
  },
  {
    relationshipId: 'REL_010',
    sourceEntityId: 'P-014',
    targetEntityId: 'P-015',
    type: 'ASSOCIATED_WITH',
    confidence: 0.9,
    sourceDocumentId: 'FIR_007',
    context: 'Nitin Tiwari and Farhan Ali linked.',
  },
  {
    relationshipId: 'REL_011',
    sourceEntityId: 'P-016',
    targetEntityId: 'P-017',
    type: 'ASSOCIATED_WITH',
    confidence: 0.89,
    sourceDocumentId: 'FIR_008',
    context: 'Kavita Singh and Arjun Malhotra linked.',
  },
  {
    relationshipId: 'REL_012',
    sourceEntityId: 'P-017',
    targetEntityId: 'P-018',
    type: 'ASSOCIATED_WITH',
    confidence: 0.88,
    sourceDocumentId: 'FIR_008',
    context: 'Arjun Malhotra and Rohit Jain linked.',
  },
  {
    relationshipId: 'REL_013',
    sourceEntityId: 'P-001',
    targetEntityId: 'P-003',
    type: 'TRANSFERRED',
    confidence: 0.95,
    sourceDocumentId: 'FIN_001',
    context: 'Account-level transfer between Rahul and Suresh.',
  },
  {
    relationshipId: 'REL_014',
    sourceEntityId: 'P-003',
    targetEntityId: 'P-001',
    type: 'TRANSFERRED',
    confidence: 0.95,
    sourceDocumentId: 'FIN_001',
    context: 'Return transfer creates circular flow.',
  },
  {
    relationshipId: 'REL_015',
    sourceEntityId: 'P-001',
    targetEntityId: 'P-004',
    type: 'TRANSFERRED',
    confidence: 0.92,
    sourceDocumentId: 'FIN_003',
    context: 'Rahul-linked account transfers to Neeraj-linked account.',
  },
  {
    relationshipId: 'REL_016',
    sourceEntityId: 'P-002',
    targetEntityId: 'P-007',
    type: 'TRANSFERRED',
    confidence: 0.9,
    sourceDocumentId: 'FIN_003',
    context: 'Amit-linked account transfers to Rakesh-linked account.',
  },
  {
    relationshipId: 'REL_017',
    sourceEntityId: 'P-001',
    targetEntityId: 'P-002',
    type: 'CONTACTED',
    confidence: 0.97,
    sourceDocumentId: 'CDR_SPIKE_01',
    context: "Repeated calls from Rahul's phone to Amit's phone.",
  },
  {
    relationshipId: 'REL_018',
    sourceEntityId: 'P-004',
    targetEntityId: 'P-002',
    type: 'CONTACTED',
    confidence: 0.92,
    sourceDocumentId: 'CDR_GENERAL_02',
    context: "Neeraj's phone contacted Amit's phone.",
  },
];

// 7. TRANSACTIONS (TXN_001 to TXN_015)
export const RAW_TRANSACTIONS: RawTransaction[] = [
  { transactionId: 'TXN_001', timestamp: '2026-08-07 09:00', senderAccount: 'AC-001', receiverAccount: 'AC-002', amountInr: 18500, reference: 'REF-A01', sourceId: 'FIN_001' },
  { transactionId: 'TXN_002', timestamp: '2026-08-07 11:30', senderAccount: 'AC-002', receiverAccount: 'AC-003', amountInr: 12000, reference: 'REF-A02', sourceId: 'FIN_001' },
  { transactionId: 'TXN_003', timestamp: '2026-08-07 15:10', senderAccount: 'AC-003', receiverAccount: 'AC-001', amountInr: 7500, reference: 'REF-A03', sourceId: 'FIN_001' },
  { transactionId: 'TXN_004', timestamp: '2026-08-08 10:20', senderAccount: 'AC-004', receiverAccount: 'AC-005', amountInr: 9100, reference: 'REF-B01', sourceId: 'FIN_002' },
  { transactionId: 'TXN_005', timestamp: '2026-08-08 13:45', senderAccount: 'AC-005', receiverAccount: 'AC-006', amountInr: 6600, reference: 'REF-B02', sourceId: 'FIN_002' },
  { transactionId: 'TXN_006', timestamp: '2026-08-08 16:15', senderAccount: 'AC-006', receiverAccount: 'AC-004', amountInr: 4300, reference: 'REF-B03', sourceId: 'FIN_002' },
  { transactionId: 'TXN_007', timestamp: '2026-08-09 09:20', senderAccount: 'AC-001', receiverAccount: 'AC-004', amountInr: 5200, reference: 'REF-C01', sourceId: 'FIN_003' },
  { transactionId: 'TXN_008', timestamp: '2026-08-09 10:40', senderAccount: 'AC-004', receiverAccount: 'AC-002', amountInr: 3900, reference: 'REF-C02', sourceId: 'FIN_003' },
  { transactionId: 'TXN_009', timestamp: '2026-08-09 14:00', senderAccount: 'AC-002', receiverAccount: 'AC-007', amountInr: 2500, reference: 'REF-C03', sourceId: 'FIN_003' },
  { transactionId: 'TXN_010', timestamp: '2026-08-10 09:15', senderAccount: 'AC-008', receiverAccount: 'AC-009', amountInr: 8400, reference: 'REF-D01', sourceId: 'FIN_004' },
  { transactionId: 'TXN_011', timestamp: '2026-08-10 12:25', senderAccount: 'AC-009', receiverAccount: 'AC-010', amountInr: 7100, reference: 'REF-D02', sourceId: 'FIN_004' },
  { transactionId: 'TXN_012', timestamp: '2026-08-10 17:40', senderAccount: 'AC-010', receiverAccount: 'AC-008', amountInr: 3100, reference: 'REF-D03', sourceId: 'FIN_004' },
  { transactionId: 'TXN_013', timestamp: '2026-08-11 10:00', senderAccount: 'AC-002', receiverAccount: 'AC-003', amountInr: 4700, reference: 'REF-E01', sourceId: 'FIN_005' },
  { transactionId: 'TXN_014', timestamp: '2026-08-11 11:50', senderAccount: 'AC-003', receiverAccount: 'AC-004', amountInr: 2800, reference: 'REF-E02', sourceId: 'FIN_005' },
  { transactionId: 'TXN_015', timestamp: '2026-08-11 16:30', senderAccount: 'AC-004', receiverAccount: 'AC-001', amountInr: 1900, reference: 'REF-E03', sourceId: 'FIN_005' },
];

// 8. CALL DETAIL RECORDS (CDR_001 to CDR_050)
export const RAW_CDRS: RawCdr[] = [
  { cdrId: 'CDR_001', timestamp: '2026-08-01 10:15', callerPhone: '9000010000', receiverPhone: '9000010001', durationMinutes: 3, location: 'Bhopal', sourceId: 'CDR_SOURCE_01' },
  { cdrId: 'CDR_002', timestamp: '2026-08-02 10:15', callerPhone: '9000010001', receiverPhone: '9000010002', durationMinutes: 4, location: 'Bhopal', sourceId: 'CDR_SOURCE_02' },
  { cdrId: 'CDR_003', timestamp: '2026-08-03 10:15', callerPhone: '9000010003', receiverPhone: '9000010000', durationMinutes: 5, location: 'Bhopal', sourceId: 'CDR_SOURCE_03' },
  { cdrId: 'CDR_004', timestamp: '2026-08-04 10:15', callerPhone: '9000010003', receiverPhone: '9000010004', durationMinutes: 2, location: 'Bhopal', sourceId: 'CDR_SOURCE_04' },
  { cdrId: 'CDR_005', timestamp: '2026-08-05 10:15', callerPhone: '9000010004', receiverPhone: '9000010005', durationMinutes: 3, location: 'Bhopal', sourceId: 'CDR_SOURCE_05' },
  { cdrId: 'CDR_006', timestamp: '2026-08-06 10:15', callerPhone: '9000010005', receiverPhone: '9000010006', durationMinutes: 4, location: 'Bhopal', sourceId: 'CDR_SOURCE_06' },
  { cdrId: 'CDR_007', timestamp: '2026-08-07 10:15', callerPhone: '9000010006', receiverPhone: '9000010007', durationMinutes: 2, location: 'Bhopal', sourceId: 'CDR_SOURCE_07' },
  { cdrId: 'CDR_008', timestamp: '2026-08-08 10:15', callerPhone: '9000010007', receiverPhone: '9000010008', durationMinutes: 6, location: 'Bhopal', sourceId: 'CDR_SOURCE_08' },
  { cdrId: 'CDR_009', timestamp: '2026-08-09 10:15', callerPhone: '9000010008', receiverPhone: '9000010011', durationMinutes: 4, location: 'Bhopal', sourceId: 'CDR_SOURCE_09' },
  { cdrId: 'CDR_010', timestamp: '2026-08-10 10:15', callerPhone: '9000010011', receiverPhone: '9000010009', durationMinutes: 3, location: 'Bhopal', sourceId: 'CDR_SOURCE_10' },
  { cdrId: 'CDR_011', timestamp: '2026-08-11 10:15', callerPhone: '9000010009', receiverPhone: '9000010010', durationMinutes: 5, location: 'Bhopal', sourceId: 'CDR_SOURCE_11' },
  { cdrId: 'CDR_012', timestamp: '2026-08-12 10:15', callerPhone: '9000010010', receiverPhone: '9000010012', durationMinutes: 2, location: 'Bhopal', sourceId: 'CDR_SOURCE_12' },
  { cdrId: 'CDR_013', timestamp: '2026-08-13 10:15', callerPhone: '9000010012', receiverPhone: '9000010013', durationMinutes: 4, location: 'Bhopal', sourceId: 'CDR_SOURCE_13' },
  { cdrId: 'CDR_014', timestamp: '2026-08-14 10:15', callerPhone: '9000010013', receiverPhone: '9000010014', durationMinutes: 3, location: 'Bhopal', sourceId: 'CDR_SOURCE_14' },
  { cdrId: 'CDR_015', timestamp: '2026-08-15 10:15', callerPhone: '9000010014', receiverPhone: '9000010016', durationMinutes: 5, location: 'Bhopal', sourceId: 'CDR_SOURCE_15' },
  { cdrId: 'CDR_016', timestamp: '2026-08-16 10:15', callerPhone: '9000010016', receiverPhone: '9000010017', durationMinutes: 4, location: 'Bhopal', sourceId: 'CDR_SOURCE_16' },
  { cdrId: 'CDR_017', timestamp: '2026-08-17 10:15', callerPhone: '9000010017', receiverPhone: '9000010018', durationMinutes: 3, location: 'Bhopal', sourceId: 'CDR_SOURCE_17' },
  { cdrId: 'CDR_018', timestamp: '2026-08-18 10:15', callerPhone: '9000010018', receiverPhone: '9000010019', durationMinutes: 2, location: 'Bhopal', sourceId: 'CDR_SOURCE_18' },
  { cdrId: 'CDR_019', timestamp: '2026-08-19 10:15', callerPhone: '9000010019', receiverPhone: '9000010015', durationMinutes: 4, location: 'Bhopal', sourceId: 'CDR_SOURCE_19' },
  { cdrId: 'CDR_020', timestamp: '2026-08-20 10:15', callerPhone: '9000010015', receiverPhone: '9000010005', durationMinutes: 3, location: 'Bhopal', sourceId: 'CDR_SOURCE_20' },
  { cdrId: 'CDR_021', timestamp: '2026-08-09 09:05', callerPhone: '9000010000', receiverPhone: '9000010001', durationMinutes: 2, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_022', timestamp: '2026-08-09 09:12', callerPhone: '9000010000', receiverPhone: '9000010002', durationMinutes: 3, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_023', timestamp: '2026-08-09 09:19', callerPhone: '9000010000', receiverPhone: '9000010003', durationMinutes: 4, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_024', timestamp: '2026-08-09 09:26', callerPhone: '9000010000', receiverPhone: '9000010004', durationMinutes: 5, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_025', timestamp: '2026-08-09 09:33', callerPhone: '9000010000', receiverPhone: '9000010001', durationMinutes: 6, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_026', timestamp: '2026-08-09 09:40', callerPhone: '9000010000', receiverPhone: '9000010003', durationMinutes: 2, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_027', timestamp: '2026-08-09 10:47', callerPhone: '9000010000', receiverPhone: '9000010001', durationMinutes: 3, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_028', timestamp: '2026-08-09 10:54', callerPhone: '9000010000', receiverPhone: '9000010002', durationMinutes: 4, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_029', timestamp: '2026-08-09 10:11', callerPhone: '9000010000', receiverPhone: '9000010003', durationMinutes: 5, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_030', timestamp: '2026-08-09 10:18', callerPhone: '9000010000', receiverPhone: '9000010004', durationMinutes: 6, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_031', timestamp: '2026-08-09 10:25', callerPhone: '9000010000', receiverPhone: '9000010001', durationMinutes: 2, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_032', timestamp: '2026-08-09 10:32', callerPhone: '9000010000', receiverPhone: '9000010003', durationMinutes: 3, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_033', timestamp: '2026-08-09 11:39', callerPhone: '9000010000', receiverPhone: '9000010001', durationMinutes: 4, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_034', timestamp: '2026-08-09 11:46', callerPhone: '9000010000', receiverPhone: '9000010002', durationMinutes: 5, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_035', timestamp: '2026-08-09 11:53', callerPhone: '9000010000', receiverPhone: '9000010003', durationMinutes: 6, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_036', timestamp: '2026-08-09 11:10', callerPhone: '9000010000', receiverPhone: '9000010004', durationMinutes: 2, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_037', timestamp: '2026-08-09 11:17', callerPhone: '9000010000', receiverPhone: '9000010001', durationMinutes: 3, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_038', timestamp: '2026-08-09 11:24', callerPhone: '9000010000', receiverPhone: '9000010003', durationMinutes: 4, location: 'Bhopal Central', sourceId: 'CDR_SPIKE_01' },
  { cdrId: 'CDR_039', timestamp: '2026-08-12 18:30', callerPhone: '9000010001', receiverPhone: '9000010003', durationMinutes: 6, location: 'Habibganj', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_040', timestamp: '2026-08-12 18:30', callerPhone: '9000010002', receiverPhone: '9000010000', durationMinutes: 4, location: 'New Market', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_041', timestamp: '2026-08-12 18:30', callerPhone: '9000010003', receiverPhone: '9000010001', durationMinutes: 7, location: 'Sehore Road', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_042', timestamp: '2026-08-12 18:30', callerPhone: '9000010004', receiverPhone: '9000010007', durationMinutes: 3, location: 'Old Bhopal', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_043', timestamp: '2026-08-12 18:30', callerPhone: '9000010007', receiverPhone: '9000010008', durationMinutes: 5, location: 'Old Bhopal', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_044', timestamp: '2026-08-12 18:30', callerPhone: '9000010011', receiverPhone: '9000010000', durationMinutes: 4, location: 'Kolar Road', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_045', timestamp: '2026-08-12 18:30', callerPhone: '9000010014', receiverPhone: '9000010001', durationMinutes: 3, location: 'MP Nagar', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_046', timestamp: '2026-08-12 18:30', callerPhone: '9000010016', receiverPhone: '9000010017', durationMinutes: 6, location: 'Bairagarh', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_047', timestamp: '2026-08-12 18:30', callerPhone: '9000010017', receiverPhone: '9000010019', durationMinutes: 2, location: 'Bairagarh', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_048', timestamp: '2026-08-12 18:30', callerPhone: '9000010019', receiverPhone: '9000010015', durationMinutes: 4, location: 'Kolar Road', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_049', timestamp: '2026-08-12 18:30', callerPhone: '9000010015', receiverPhone: '9000010005', durationMinutes: 5, location: 'Kolar Road', sourceId: 'CDR_GENERAL_02' },
  { cdrId: 'CDR_050', timestamp: '2026-08-12 18:30', callerPhone: '9000010009', receiverPhone: '9000010011', durationMinutes: 3, location: 'Misrod', sourceId: 'CDR_GENERAL_02' },
];

// Helper maps
export const PERSON_MAP = new Map<number, RawPerson>(RAW_PERSONS.map((p) => [p.personId, p]));
export const SYNTHETIC_ID_PERSON_MAP = new Map<string, RawPerson>(RAW_PERSONS.map((p) => [p.syntheticPersonId, p]));
export const ACCOUNT_MAP = new Map<string, RawAccount>(RAW_ACCOUNTS.map((a) => [a.accountId, a]));
export const PHONE_MAP = new Map<string, RawPhone>(RAW_PHONES.map((ph) => [ph.phoneNumber, ph]));
export const VEHICLE_MAP = new Map<string, RawVehicle>(RAW_VEHICLES.map((v) => [v.registrationNumber, v]));
