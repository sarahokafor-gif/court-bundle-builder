import { CheckCircle2, Info, Clock, Sparkles } from 'lucide-react'
import { BASE_PRICING, EDITING_TIERS, formatPrice } from '../utils/pricing'
import './PricingDisplay.css'

// Display tiers for the pricing cards
const DISPLAY_TIERS = [
  {
    range: `1-${BASE_PRICING.FREE_TIER_MAX} pages`,
    basePrice: 'FREE',
    editingPrice: '£8',
    editingTime: '30 minutes',
    highlight: true,
  },
  {
    range: `${BASE_PRICING.FREE_TIER_MAX + 1}-${BASE_PRICING.TIER_2_MAX} pages`,
    basePrice: '£0.30/page',
    editingPrice: '£8-12',
    editingTime: '30 mins - 1 hour',
    highlight: false,
  },
  {
    range: `${BASE_PRICING.TIER_2_MAX + 1}-${BASE_PRICING.TIER_3_MAX} pages`,
    basePrice: '£0.22/page',
    editingPrice: '£12-15',
    editingTime: '1-2 hours',
    highlight: false,
  },
  {
    range: `${BASE_PRICING.TIER_3_MAX + 1}+ pages`,
    basePrice: '£0.18/page',
    editingPrice: '£20',
    editingTime: 'Unlimited',
    highlight: false,
    popular: true,
  },
]

export default function PricingDisplay() {
  return (
    <div className="pricing-display">
      <div className="pricing-header">
        <h2>Simple, Transparent Pricing</h2>
        <p className="pricing-subtitle">
          Pay per page with volume discounts. First 25 pages always free.
        </p>
      </div>

      {/* Base Bundle Pricing */}
      <div className="pricing-section">
        <h3>Base Bundle (Pagination, Indexing, Download)</h3>
        <div className="pricing-tiers">
          {DISPLAY_TIERS.map((tier, index) => (
            <div
              key={index}
              className={`pricing-card ${tier.highlight ? 'free-tier-card' : 'paid-tier-card'} ${tier.popular ? 'popular-card' : ''}`}
            >
              {tier.popular && <span className="popular-badge">Best Value</span>}
              <div className="tier-range">{tier.range}</div>
              <div className="tier-price">{tier.basePrice}</div>
              <div className="tier-note">
                {tier.highlight ? 'No payment required' : 'Cumulative pricing'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editing Add-On */}
      <div className="pricing-section editing-section">
        <h3>
          <Sparkles size={20} />
          Optional: Editing Tools Add-On
        </h3>
        <p className="section-description">
          Add powerful editing capabilities with time-limited access.
        </p>
        <div className="editing-tiers">
          {EDITING_TIERS.map((tier, index) => (
            <div key={index} className="editing-tier-row">
              <span className="tier-pages">
                {tier.to === Infinity ? `${tier.from}+ pages` : `${tier.from}-${tier.to} pages`}
              </span>
              <span className="tier-cost">{formatPrice(tier.cost)}</span>
              <span className="tier-time">
                <Clock size={14} />
                {tier.minutes === -1 ? 'Unlimited' : tier.minutes < 60 ? `${tier.minutes} mins` : `${tier.minutes / 60} hour${tier.minutes > 60 ? 's' : ''}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Included */}
      <div className="features-included">
        <div className="features-column">
          <h4><CheckCircle2 size={18} /> Base Bundle Includes:</h4>
          <ul className="features-list">
            <li><CheckCircle2 size={14} /> Professional table of contents</li>
            <li><CheckCircle2 size={14} /> Clickable index links</li>
            <li><CheckCircle2 size={14} /> Section dividers</li>
            <li><CheckCircle2 size={14} /> Automatic page numbering</li>
            <li><CheckCircle2 size={14} /> PDF download</li>
          </ul>
        </div>
        <div className="features-column">
          <h4><Sparkles size={18} /> Editing Add-On Includes:</h4>
          <ul className="features-list">
            <li><CheckCircle2 size={14} /> Redaction tools</li>
            <li><CheckCircle2 size={14} /> Erasure/white-out</li>
            <li><CheckCircle2 size={14} /> Page removal</li>
            <li><CheckCircle2 size={14} /> Multi-page editing</li>
            <li><CheckCircle2 size={14} /> Time-limited access</li>
          </ul>
        </div>
      </div>

      {/* Info Banner */}
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

      {/* Calculation Example */}
      <div className="calculation-example">
        <h4>Example: 200-page bundle</h4>
        <div className="calc-breakdown">
          <div className="calc-row">
            <span>First 25 pages</span>
            <span>FREE</span>
          </div>
          <div className="calc-row">
            <span>Next 125 pages (26-150) × £0.30</span>
            <span>£37.50</span>
          </div>
          <div className="calc-row">
            <span>Next 50 pages (151-200) × £0.22</span>
            <span>£11.00</span>
          </div>
          <div className="calc-row total">
            <span>Base Total</span>
            <span>£48.50</span>
          </div>
          <div className="calc-row addon">
            <span>+ Editing (1 hour)</span>
            <span>£12.00</span>
          </div>
          <div className="calc-row grand-total">
            <span>With Editing</span>
            <span>£60.50</span>
          </div>
        </div>
      </div>
    </div>
  )
}
