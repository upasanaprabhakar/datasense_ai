import { AlertTriangle, Shield, Info } from 'lucide-react';

/**
 * PII Badge Component
 * Displays when a field contains personally identifiable information
 * Zero hardcoding - reads from field.hasPII and related properties
 */

const RISK_COLORS = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-500',
    icon: 'text-red-500'
  },
  high: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-500',
    icon: 'text-orange-500'
  },
  medium: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-500',
    icon: 'text-yellow-500'
  }
};

export function PIIBadge({ field, size = 'sm' }) {
  if (!field.hasPII) return null;
  
  const riskLevel = field.piiRiskLevel || 'medium';
  const colors = RISK_COLORS[riskLevel] || RISK_COLORS.medium;
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };
  
  return (
    <div
      className={`inline-flex items-center gap-1 ${colors.bg} ${colors.border} border rounded-md ${sizeClasses[size]} font-medium ${colors.text}`}
      title={`PII Detected: ${field.piiDescription || 'Personal Data'}\nGDPR Category: ${field.gdprCategory || 'Unknown'}\nRisk Level: ${riskLevel.toUpperCase()}\nConfidence: ${field.piiConfidence || 0}%`}
    >
      <AlertTriangle className="w-3 h-3" />
      <span>PII</span>
    </div>
  );
}

/**
 * GDPR Compliance Banner
 * Shows at top of dictionary when PII fields are detected
 */
export function GDPRComplianceBanner({ dictionary }) {
  if (!dictionary || dictionary.length === 0) return null;
  
  const piiFields = dictionary.filter(f => f.hasPII);
  if (piiFields.length === 0) return null;
  
  const criticalFields = piiFields.filter(f => f.piiRiskLevel === 'critical');
  const highRiskFields = piiFields.filter(f => f.piiRiskLevel === 'high');
  
  const categories = [...new Set(piiFields.map(f => f.gdprCategory).filter(Boolean))];
  
  return (
    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Shield className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-red-500 mb-1">
            GDPR Compliance Alert
          </h3>
          <p className="text-sm text-ds-text-primary mb-3">
            This dataset contains <strong>{piiFields.length} field{piiFields.length > 1 ? 's' : ''}</strong> with personally identifiable information (PII).
            {criticalFields.length > 0 && (
              <span className="text-red-500 font-semibold">
                {' '}{criticalFields.length} field{criticalFields.length > 1 ? 's are' : ' is'} marked as CRITICAL risk.
              </span>
            )}
          </p>
          
          {/* PII Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map(category => (
                <span
                  key={category}
                  className="px-2 py-1 bg-ds-surface border border-ds-border rounded-md text-xs text-ds-text-muted"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
          
          {/* Affected Fields Pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {piiFields.slice(0, 10).map(field => {
              const colors = RISK_COLORS[field.piiRiskLevel] || RISK_COLORS.medium;
              return (
                <button
                  key={field.fieldName}
                  onClick={() => {
                    // Scroll to field in table
                    const element = document.getElementById(`field-${field.fieldName}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      element.classList.add('ring-2', 'ring-red-500');
                      setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-red-500');
                      }, 2000);
                    }
                  }}
                  className={`px-2.5 py-1 ${colors.bg} ${colors.border} border rounded-md text-xs font-medium ${colors.text} hover:opacity-80 transition-opacity`}
                >
                  {field.fieldName}
                </button>
              );
            })}
            {piiFields.length > 10 && (
              <span className="px-2.5 py-1 bg-ds-surface border border-ds-border rounded-md text-xs text-ds-text-muted">
                +{piiFields.length - 10} more
              </span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Export PII report
                const report = {
                  totalFields: dictionary.length,
                  piiFields: piiFields.length,
                  criticalRisk: criticalFields.length,
                  highRisk: highRiskFields.length,
                  categories: categories,
                  fields: piiFields.map(f => ({
                    name: f.fieldName,
                    type: f.piiType,
                    description: f.piiDescription,
                    riskLevel: f.piiRiskLevel,
                    gdprCategory: f.gdprCategory,
                    confidence: f.piiConfidence
                  }))
                };
                
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gdpr-compliance-report.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              Export GDPR Report
            </button>
            
            <button
              onClick={() => {
                alert(`GDPR Compliance Information:\n\n• Total PII Fields: ${piiFields.length}\n• Critical Risk: ${criticalFields.length}\n• High Risk: ${highRiskFields.length}\n\nRecommendations:\n- Implement access controls for PII fields\n- Enable encryption for critical data\n- Review data retention policies\n- Document lawful basis for processing`);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-ds-surface border border-ds-border text-ds-text-primary rounded-lg text-xs font-medium hover:bg-ds-surface-solid transition-colors"
            >
              <Info className="w-3 h-3" />
              View Recommendations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PII Risk Level Indicator (for side panel)
 */
export function PIIRiskIndicator({ field }) {
  if (!field.hasPII) {
    return (
      <div className="flex items-center gap-2 text-ds-text-muted text-sm">
        <Shield className="w-4 h-4" />
        <span>No PII detected</span>
      </div>
    );
  }
  
  const riskLevel = field.piiRiskLevel || 'medium';
  const colors = RISK_COLORS[riskLevel] || RISK_COLORS.medium;
  
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 ${colors.text} text-sm font-medium`}>
        <AlertTriangle className="w-4 h-4" />
        <span>PII Detected: {field.piiDescription}</span>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-ds-text-muted">GDPR Category:</span>
          <span className="text-ds-text-primary font-medium">{field.gdprCategory}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ds-text-muted">Risk Level:</span>
          <span className={`font-bold uppercase ${colors.text}`}>{riskLevel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ds-text-muted">Detection Confidence:</span>
          <span className="text-ds-text-primary font-medium">{field.piiConfidence}%</span>
        </div>
      </div>
      
      <div className={`mt-3 p-2 ${colors.bg} ${colors.border} border rounded-lg`}>
        <p className="text-xs text-ds-text-muted">
          <strong className={colors.text}>Compliance Note:</strong>{' '}
          This field requires special handling under GDPR. Ensure proper access controls, encryption, and data retention policies are in place.
        </p>
      </div>
    </div>
  );
}