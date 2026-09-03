const fs = require('fs');
const path = require('path');

const sampleDir = path.resolve('e:/DRIVE d files/antigravity projects/bidexai/sample_documents');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

function createStandardPdf(pagesTextArray) {
  const objects = [];
  let objIndex = 1;

  const catalogObjNum = objIndex++;
  const pagesObjNum = objIndex++;

  const pageObjNums = [];
  const contentObjNums = [];
  const fontObjNum = objIndex++;

  pagesTextArray.forEach(() => {
    pageObjNums.push(objIndex++);
    contentObjNums.push(objIndex++);
  });

  const objOffsets = {};

  objects.push({
    num: catalogObjNum,
    body: '<< /Type /Catalog /Pages ' + pagesObjNum + ' 0 R >>'
  });

  const kidsStr = pageObjNums.map(num => num + ' 0 R').join(' ');
  objects.push({
    num: pagesObjNum,
    body: '<< /Type /Pages /Kids [ ' + kidsStr + ' ] /Count ' + pageObjNums.length + ' >>'
  });

  objects.push({
    num: fontObjNum,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  });

  pagesTextArray.forEach((text, i) => {
    const pageNum = pageObjNums[i];
    const contentNum = contentObjNums[i];

    const lines = text.split('\n');
    let streamText = 'BT /F1 10 Tf 40 780 Td 14 TL\n';

    lines.forEach(line => {
      const sanitized = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      streamText += '(' + sanitized + ") '\n";
    });
    streamText += 'ET';

    const streamLength = Buffer.byteLength(streamText, 'utf8');

    objects.push({
      num: pageNum,
      body: '<< /Type /Page /Parent ' + pagesObjNum + ' 0 R /MediaBox [0 0 595 842] /Contents ' + contentNum + ' 0 R /Resources << /Font << /F1 ' + fontObjNum + ' 0 R >> >> >>'
    });

    objects.push({
      num: contentNum,
      body: '<< /Length ' + streamLength + ' >>\nstream\n' + streamText + '\nendstream'
    });
  });

  let pdf = '%PDF-1.4\n%âãÏÓ\n';

  objects.sort((a, b) => a.num - b.num);

  objects.forEach(obj => {
    objOffsets[obj.num] = Buffer.byteLength(pdf, 'utf8');
    pdf += obj.num + ' 0 obj\n' + obj.body + '\nendobj\n';
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';

  for (let i = 1; i <= objects.length; i++) {
    const offset = String(objOffsets[i]).padStart(10, '0');
    pdf += offset + ' 00000 n \n';
  }

  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root ' + catalogObjNum + ' 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';

  return Buffer.from(pdf, 'utf8');
}

const goodFitPages = [
  'SMART URBAN INFRASTRUCTURE AUTHORITY (SUIA)\nREQUEST FOR PROPOSAL (RFP)\nTender Title: Smart City Integrated IoT Command & Cloud Infrastructure Platform\nReference Number: SUIA/2026/IOT-RFP-098\nEstimated Project Value: INR 8.50 Crore (INR 85,000,000)\nBid Submission Deadline: 30 Days from Notice Date\nProject Execution Location: Central Command Facility and City Smart Zones\n\nSECTION 1: STATUTORY ELIGIBILITY CRITERIA\n1.1 Legal Status and Incorporation:\nThe Bidder must be a registered legal corporate entity under the Companies Act in continuous commercial operation for at least 5 years.\n1.2 Industry Specialization:\nThe Bidder must demonstrate proven operational experience in Information Technology, Cloud Infrastructure, and Enterprise Software Solutions.\n1.3 Non-Blacklisting Declaration:\nThe Bidder must submit a formal affidavit on non-judicial stamp paper confirming the firm is not blacklisted by any Central or State Government authority.',

  'SECTION 2: FINANCIAL & ACCREDITED CERTIFICATION QUALIFICATIONS\n2.1 Minimum Average Annual Financial Turnover:\nThe Bidder must have an average annual turnover of not less than INR 5.00 Crore (INR 50,000,000) during the preceding three audited financial years. CA audit certificate with UDIN must be enclosed.\n2.2 Positive Net Worth:\nThe Bidder must possess a positive net worth as of the latest audited balance sheet.\n2.3 Mandatory Quality & Security Certifications:\nThe Bidder MUST hold active and accredited ISO 9001:2015 (Quality Management System) and ISO/IEC 27001 (Information Security Management) certifications on the date of bid submission.\n2.4 Optional Capability Appraisal:\nCMMI Maturity Level 3 or higher appraisal is preferred and will receive supplementary technical evaluation consideration.',

  'SECTION 3: TECHNICAL ARCHITECTURE & PLATFORM SPECIFICATIONS\n3.1 Technology Stack & Microservices Architecture:\nThe core IoT Command platform must be engineered using Java, Spring Boot, React, Node.js, and REST APIs, deployed on AWS Cloud Infrastructure with container orchestration (Docker/Kubernetes).\n3.2 High-Throughput IoT Ingestion:\nThe platform architecture must reliably ingest, validate, and process real-time telemetry from at least 10,000 edge IoT sensor devices concurrently.\n3.3 High Availability & Uptime SLA:\nThe production cloud system must deliver a minimum 99.9% High Availability SLA with active-passive automated failover and sub-second latency response.\n3.4 Data Security & Encryption:\nAll data at rest must be encrypted using AES-256 and data in transit via TLS 1.3 protocol.',

  'SECTION 4: KEY PERSONNEL BENCH, PROJECT SCHEDULE & COMMERCIAL TERMS\n4.1 Key Personnel & Engineering Bench:\nThe Bidder must field dedicated key personnel including a certified Project Manager (PMP/PRINCE2 with 8+ years experience) and a Senior Cloud Solution Architect. Total engineering headcount must be at least 40 full-time staff.\n4.2 Project Implementation Schedule:\nComplete supply, deployment, and commissioning must be achieved within 180 Days from contract signing date.\n4.3 Earnest Money Deposit (EMD):\nAn EMD of 2% of total estimated tender value (INR 1,700,000) in the form of an irrevocable Bank Guarantee must be furnished.\n4.4 Liquidated Damages:\nDelay in commissioning shall attract liquidated damages at 0.5% per week up to a ceiling of 10% of total contract value.'
];

const badFitPages = [
  'STATE AEROSPACE & DEFENSE CORPORATION (HAL/SADC)\nREQUEST FOR PROPOSAL (RFP)\nTender Title: Aerospace Precision Digitalization & Advanced Manufacturing Execution System (MES)\nReference Number: HAL/2026/AERO-MES-404\nEstimated Project Value: INR 12.00 Crore (INR 120,000,000)\nBid Submission Deadline: 21 Days from Publication Date\nProject Location: Heavy Aerospace Assembly & Defense Hangar\n\nSECTION 1: DEFENSE & AEROSPACE MANDATORY ELIGIBILITY\n1.1 Aerospace Operational History:\nThe Bidder MUST have at least 10 continuous years of operational experience strictly in Aerospace Manufacturing, Avionics Line Automation, and Defense Electronics Supply.\n1.2 Specialized Defense Domain:\nGeneral software vendors or commodity trading firms are strictly disqualified from bidding.\n1.3 Security Clearance:\nThe Bidder must possess Secret-level facility security clearance issued by the Ministry of Defense.',

  'SECTION 2: MANDATORY COMMERCIAL TURNOVER & AEROSPACE CERTIFICATIONS\n2.1 Substantial Aerospace Turnover Requirement:\nThe Bidder MUST have an average annual audited turnover of NOT LESS THAN INR 25.00 Crore (INR 250,000,000) specifically derived from aerospace/defense engineering contracts.\n2.2 Mandatory AS9100 Rev D Certification:\nThe Bidder MUST possess a valid and active AS9100 Rev D (Aerospace Quality Management System) certification. Standard IT ISO 9001 alone will NOT be accepted and constitutes grounds for immediate disqualification.\n2.3 Environmental Certification:\nActive ISO 14001 Environmental Management System certification is mandatory for all shopfloor robotics deployments.',

  'SECTION 3: AEROSPACE CNC/PLC INTEGRATION & FLIGHT COMPONENT TRACEABILITY\n3.1 Aerospace CNC/PLC Machine Interfacing:\nThe system must interface directly with 5-axis CNC titanium milling machinery and PLC controllers across the defense aircraft hangar.\n3.2 Production Line Traceability & AS9102 First Article Inspection:\nThe MES platform must enforce AS9102 First Article Inspection workflows and full metallurgical batch lot traceability for turbine components.\n3.3 ITAR & Military Standard Compliance:\nAll telemetry software must strictly comply with ITAR regulations, MIL-STD-810 environmental durability specs, and DO-178C software compliance.',

  'SECTION 4: KEY AEROSPACE STAFFING, RAPID SCHEDULE & SEVERE PENALTIES\n4.1 Specialized Aerospace Avionics Bench:\nThe Bidder must assign a full-time Lead Avionics System Engineer possessing a Master degree in Aeronautical Engineering and 15+ years of aircraft assembly line automation experience.\n4.2 Rapid Prototype Schedule:\nAn operational on-premise hardware prototype interfacing with physical CNC machine cells must be fully commissioned within 60 Days.\n4.3 Severe Liquidated Damages:\nMilestone delays will attract liquidated damages of 2% per week of delay up to a maximum cap of 20% of total contract value.\n4.4 High Value EMD Commitment:\nMandatory EMD deposit of INR 2,400,000 via irrevocable Bank Guarantee.'
];

const goodFitPath = path.join(sampleDir, 'Bidexa_Good_Fit_Smart_City_IoT_Tender.pdf');
const badFitPath = path.join(sampleDir, 'Bidexa_Bad_Fit_Aerospace_Manufacturing_Tender.pdf');

fs.writeFileSync(goodFitPath, createStandardPdf(goodFitPages));
fs.writeFileSync(badFitPath, createStandardPdf(badFitPages));

console.log('✅ Created Good-Fit PDF -> ' + goodFitPath + ' (' + goodFitPages.length + ' pages)');
console.log('✅ Created Bad-Fit PDF  -> ' + badFitPath + ' (' + badFitPages.length + ' pages)');
