/**
 * Generates structured exportable tender analysis report (HTML / JSON)
 */

const generateExecutiveReport = ({ tender, company, analysis }) => {
  const { decision, requirements, matches, risks } = analysis;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const deadlineStr = tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Not Specified';

  const reportData = {
    title: `Bid Decision Dossier: ${tender.title}`,
    generatedAt: formattedDate,
    tender: {
      title: tender.title,
      organization: tender.organization,
      referenceNumber: tender.referenceNumber,
      estimatedValue: tender.estimatedValue ? `₹${(tender.estimatedValue / 10000000).toFixed(2)} Cr` : 'N/A',
      deadline: deadlineStr,
      location: tender.location || 'Not Specified',
      pageCount: tender.pageCount,
      summary: tender.summary || 'Comprehensive procurement tender document analysis.'
    },
    company: (company && (company.companyName || company.annualTurnover || company.yearsExperience)) ? {
      name: company.companyName || 'Not Specified',
      industry: company.industry || 'Not Specified',
      yearsExperience: company.yearsExperience ? `${company.yearsExperience} Years` : 'Not Specified',
      annualTurnover: company.annualTurnover ? `₹${(company.annualTurnover / 10000000).toFixed(2)} Cr` : 'Not Specified',
      certifications: company.certifications || []
    } : {
      name: 'Not Provided (Tender-Only Analysis)',
      industry: 'Pending Company Profile',
      yearsExperience: 'Not Provided',
      annualTurnover: 'Not Provided',
      certifications: []
    },
    decision: {
      recommendation: decision.recommendation,
      overallScore: decision.overallScore,
      scoreBreakdown: decision.scoreBreakdown,
      hardFailures: decision.hardFailures,
      keyStrengths: decision.keyStrengths,
      keyConcerns: decision.keyConcerns,
      summaryRationale: decision.summaryRationale
    },
    requirementsCount: requirements.length,
    matchedCount: matches.filter(m => m.status === 'MATCH').length,
    risksSummary: {
      critical: risks.filter(r => r.severity === 'CRITICAL').length,
      high: risks.filter(r => r.severity === 'HIGH').length,
      medium: risks.filter(r => r.severity === 'MEDIUM').length,
      low: risks.filter(r => r.severity === 'LOW').length
    },
    requirementsList: requirements,
    matchesList: matches,
    risksList: risks
  };

  return reportData;
};

module.exports = { generateExecutiveReport };
