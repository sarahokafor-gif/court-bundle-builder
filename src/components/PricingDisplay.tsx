import { CheckCircle2, Info } from 'lucide-react'
import { PRICING_TIERS } from '../utils/pricing'
import './PricingDisplay.css'

export default function PricingDisplay() {
  return (
    <div className="pricing-display">
      <div className="pricing-header">
        <h2>Pricing & Features</h2>
        <p className="pricing-subtitle">
          Transparent pricing based on bundle size. All features available at every tier.
        </p>
      </div>

      <div className="pricing-tiers">
        {PRICING_TIERS.map((tier, index) => (
          <div
            key={index}
            className={`pricing-card ${tier.price === 0 ? 'free-tier-card' : 'paid-tier-card'}`}
          >
            <div className="tier-badge">
              {tier.label}
            </div>
            <div className="tier-documents">
              {tier.description}
            </div>
            <div className="tier-price">
              {tier.price === 0 ? 'FREE' : `£${(tier.price / 100).toFixed(2)}`}
            </div>
          </div>
        ))}
      </div>

      <div className="features-included">
        <h3><CheckCircle2 size={20} /> All Bundles Include:</h3>
        <ul className="features-list">
          <li><CheckCircle2 size={16} /> Professional table of contents with clickable links</li>
          <li><CheckCircle2 size={16} /> Section dividers with customizable names</li>
          <li><CheckCircle2 size={16} /> Automatic page numbering (A001, B015 format)</li>
          <li><CheckCircle2 size={16} /> PDF sidebar navigation for easy browsing</li>
          <li><CheckCircle2 size={16} /> Document dates in the index</li>
          <li><CheckCircle2 size={16} /> Save and reload your work anytime</li>
        </ul>
      </div>

      <div className="free-options">
        <div className="info-banner">
          <Info size={20} />
          <div>
            <strong>Always Free:</strong> Generate a draft index (table of contents) to share
            with other parties before creating the full bundle. Perfect for getting approval
            on bundle structure and organization.
          </div>
        </div>
      </div>
    </div>
  )
}
