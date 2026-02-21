import "../config.js";
import { updateAgentStatus, addAgentLog } from "../utils/sessionStore.js";

const PII_PATTERNS = {
  email: {
    fieldNamePatterns: ['email', 'e_mail', 'mail', 'contact_email'],
    valuePattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'Email Address',
    gdprCategory: 'Contact Information',
    riskLevel: 'high'
  },
  phone: {
    fieldNamePatterns: ['phone', 'mobile', 'tel', 'telephone', 'contact_number', 'cell'],
    valuePattern: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    description: 'Phone Number',
    gdprCategory: 'Contact Information',
    riskLevel: 'high'
  },
  ssn: {
    fieldNamePatterns: ['ssn', 'social_security', 'social_security_number', 'national_id'],
    valuePattern: /^\d{3}-?\d{2}-?\d{4}$/,
    description: 'Social Security Number',
    gdprCategory: 'Government ID',
    riskLevel: 'critical'
  },
  dateOfBirth: {
    fieldNamePatterns: ['dob', 'date_of_birth', 'birth_date', 'birthdate', 'birthday'],
    valuePattern: null,
    description: 'Date of Birth',
    gdprCategory: 'Personal Identifier',
    riskLevel: 'high'
  },
  firstName: {
    fieldNamePatterns: ['first_name', 'firstname', 'given_name', 'forename'],
    valuePattern: null,
    description: 'First Name',
    gdprCategory: 'Personal Identifier',
    riskLevel: 'medium'
  },
  lastName: {
    fieldNamePatterns: ['last_name', 'lastname', 'surname', 'family_name'],
    valuePattern: null,
    description: 'Last Name',
    gdprCategory: 'Personal Identifier',
    riskLevel: 'medium'
  },
  address: {
    fieldNamePatterns: ['address', 'street', 'street_address', 'residence', 'home_address', 'billing_address', 'shipping_address'],
    valuePattern: null,
    description: 'Physical Address',
    gdprCategory: 'Location Data',
    riskLevel: 'high'
  },
  postalCode: {
    fieldNamePatterns: ['postal_code', 'zip_code', 'zipcode', 'postcode', 'zip'],
    valuePattern: /^\d{5}(-\d{4})?$/,
    description: 'Postal/ZIP Code',
    gdprCategory: 'Location Data',
    riskLevel: 'medium'
  },
  creditCard: {
    fieldNamePatterns: ['credit_card', 'card_number', 'cc_number', 'payment_card'],
    valuePattern: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/,
    description: 'Credit Card Number',
    gdprCategory: 'Financial Data',
    riskLevel: 'critical'
  },
  ipAddress: {
    fieldNamePatterns: ['ip_address', 'ip', 'ipv4', 'ipv6'],
    valuePattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    description: 'IP Address',
    gdprCategory: 'Technical Identifier',
    riskLevel: 'medium'
  },
  passport: {
    fieldNamePatterns: ['passport', 'passport_number', 'passport_id'],
    valuePattern: null,
    description: 'Passport Number',
    gdprCategory: 'Government ID',
    riskLevel: 'critical'
  }
};

function detectPII(fieldName, sampleValues = []) {
  const normalizedName = fieldName.toLowerCase().replace(/[_\s-]/g, '');

  for (const [piiType, config] of Object.entries(PII_PATTERNS)) {
    const nameMatch = config.fieldNamePatterns.some(pattern => {
      const normalizedPattern = pattern.replace(/[_\s-]/g, '');
      return normalizedName.includes(normalizedPattern) || normalizedPattern.includes(normalizedName);
    });

    if (nameMatch) {
      if (config.valuePattern && sampleValues.length > 0) {
        const validSamples = sampleValues.filter(val =>
          val && val !== 'NULL' && config.valuePattern.test(String(val))
        );
        if (validSamples.length / sampleValues.length >= 0.6) {
          return {
            detected: true,
            type: piiType,
            description: config.description,
            gdprCategory: config.gdprCategory,
            riskLevel: config.riskLevel,
            confidence: Math.round((validSamples.length / sampleValues.length) * 100)
          };
        }
      } else {
        return {
          detected: true,
          type: piiType,
          description: config.description,
          gdprCategory: config.gdprCategory,
          riskLevel: config.riskLevel,
          confidence: 85
        };
      }
    }
  }

  return null;
}

function calculateQualityScore(field) {
  let score = 100;

  const nullRate = parseFloat(field.nullRate) || 0;
  if (nullRate > 50) score -= 30;
  else if (nullRate > 20) score -= 20;
  else if (nullRate > 5) score -= 10;

  const uniqueRate = parseFloat(field.uniqueRate) || 0;
  if (field.detectedType !== "boolean" && !field.patterns?.includes("categorical")) {
    if (uniqueRate < 10 && !field.isPrimaryKey) score -= 10;
  }

  if (field.isPrimaryKey) score = Math.min(score + 5, 100);
  if (!field.description || field.description.length < 10) score -= 15;
  if (field.detectedType === "unknown") score -= 20;
  if (field.totalRows < 10) score -= 10;

  return Math.max(Math.min(score, 100), 0);
}

function calculateConfidence(field) {
  let confidence = 50;

  if (field.sampleValues && field.sampleValues.length >= 5) confidence += 20;
  else if (field.sampleValues && field.sampleValues.length >= 3) confidence += 10;

  if (parseFloat(field.nullRate) < 0.1) confidence += 15;
  if (field.patterns && field.patterns.length > 0) confidence += 10;
  if (field.description && field.description.length > 20) confidence += 10;
  if (field.isPrimaryKey || field.isForeignKey) confidence += 15;

  return Math.min(90, confidence);
}

function generateIssues(field, piiDetection) {
  const issues = [];
  const nullRate = parseFloat(field.nullRate) || 0;

  if (nullRate > 30) issues.push(`High null rate (${nullRate}%)`);
  if (nullRate > 50) issues.push('More than half the values are missing');
  if (field.detectedType === 'unknown') issues.push('Could not determine data type reliably');
  if (!field.sampleValues || field.sampleValues.length < 2) issues.push('Insufficient sample data for analysis');
  if (piiDetection) issues.push(`Contains PII: ${piiDetection.description} (${piiDetection.gdprCategory})`);
  if (field.isPrimaryKey && nullRate > 0) issues.push('Primary key should not have null values');

  return issues;
}

function determineStatus(score) {
  if (score >= 85) return "approved";
  if (score >= 60) return "pending";
  return "rejected";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runGuardianAgent(projectId, sageResults) {
  updateAgentStatus(projectId, "guardian", { status: "active", progress: 5 });
  addAgentLog(projectId, "guardian", `Received ${sageResults.length} fields from Sage`);
  addAgentLog(projectId, "guardian", `Starting quality assessment and PII detection`);

  const results = [];

  for (let i = 0; i < sageResults.length; i++) {
    const field = sageResults[i];
    const progress = Math.round(10 + (i / sageResults.length) * 85);
    updateAgentStatus(projectId, "guardian", { progress });

    const piiDetection = detectPII(field.fieldName, field.sampleValues);
    const qualityScore = calculateQualityScore(field);
    const confidence = calculateConfidence(field);
    const issues = generateIssues(field, piiDetection);
    const status = determineStatus(qualityScore);

    if (piiDetection) {
      addAgentLog(projectId, "guardian", `${field.fieldName} — Quality: ${qualityScore}% [PII: ${piiDetection.description}]`);
    } else if (issues.length > 0) {
      addAgentLog(projectId, "guardian", `Issues on ${field.fieldName}: ${issues.join(", ")}`);
    } else {
      addAgentLog(projectId, "guardian", `${field.fieldName} — Quality: ${qualityScore}%`);
    }

    results.push({
      ...field,
      qualityScore,
      confidence,
      status,
      issues,
      guardianAnalyzed: true,
      hasPII: piiDetection !== null,
      piiType: piiDetection?.type || null,
      piiDescription: piiDetection?.description || null,
      piiRiskLevel: piiDetection?.riskLevel || null,
      gdprCategory: piiDetection?.gdprCategory || null,
      piiConfidence: piiDetection?.confidence || null,
    });

    await sleep(50);
  }

  const avgQuality = Math.round(
    results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length
  );
  const piiCount = results.filter(r => r.hasPII).length;

  updateAgentStatus(projectId, "guardian", { status: "complete", progress: 100 });
  addAgentLog(projectId, "guardian", `Quality assessment complete. Avg score: ${avgQuality}%`);
  addAgentLog(projectId, "guardian", `${results.filter(r => r.status === "approved").length} approved, ${results.filter(r => r.status === "pending").length} pending review`);

  if (piiCount > 0) {
    addAgentLog(projectId, "guardian", `GDPR WARNING: ${piiCount} field${piiCount > 1 ? 's contain' : ' contains'} PII`);
    const criticalPII = results.filter(r => r.piiRiskLevel === 'critical');
    if (criticalPII.length > 0) {
      addAgentLog(projectId, "guardian", `${criticalPII.length} field${criticalPII.length > 1 ? 's are' : ' is'} CRITICAL risk`);
    }
  }

  return results;
}