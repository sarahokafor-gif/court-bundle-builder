/**
 * Pricing verification test script
 * Run with: node scripts/test-pricing.js
 */

// Pricing constants (must match src/utils/pricing.ts)
const BASE_PRICING = {
  FREE_TIER_MAX: 25,
  TIER_2_MAX: 150,
  TIER_3_MAX: 300,
  RATE_TIER_2: 0.30,
  RATE_TIER_3: 0.22,
  RATE_TIER_4: 0.18,
}

const EDITING_TIERS = [
  { from: 1, to: 25, cost: 8, minutes: 30 },
  { from: 26, to: 100, cost: 8, minutes: 30 },
  { from: 101, to: 200, cost: 12, minutes: 60 },
  { from: 201, to: 300, cost: 15, minutes: 120 },
  { from: 301, to: Infinity, cost: 20, minutes: -1 },
]

function calculateBaseCost(pageCount) {
  if (pageCount <= 0) return 0
  if (pageCount <= BASE_PRICING.FREE_TIER_MAX) return 0

  let totalCost = 0

  if (pageCount > BASE_PRICING.FREE_TIER_MAX) {
    const pagesAt30p = Math.min(pageCount, BASE_PRICING.TIER_2_MAX) - BASE_PRICING.FREE_TIER_MAX
    totalCost += pagesAt30p * BASE_PRICING.RATE_TIER_2
  }

  if (pageCount > BASE_PRICING.TIER_2_MAX) {
    const pagesAt22p = Math.min(pageCount, BASE_PRICING.TIER_3_MAX) - BASE_PRICING.TIER_2_MAX
    totalCost += pagesAt22p * BASE_PRICING.RATE_TIER_3
  }

  if (pageCount > BASE_PRICING.TIER_3_MAX) {
    const pagesAt18p = pageCount - BASE_PRICING.TIER_3_MAX
    totalCost += pagesAt18p * BASE_PRICING.RATE_TIER_4
  }

  return Math.round(totalCost * 100) / 100
}

function calculateEditingCost(pageCount) {
  if (pageCount <= 0) return 0

  for (const tier of EDITING_TIERS) {
    if (pageCount >= tier.from && pageCount <= tier.to) {
      return tier.cost
    }
  }

  return EDITING_TIERS[EDITING_TIERS.length - 1].cost
}

function getEditingTimeLimit(pageCount) {
  if (pageCount <= 0) return 30

  for (const tier of EDITING_TIERS) {
    if (pageCount >= tier.from && pageCount <= tier.to) {
      return tier.minutes
    }
  }

  return -1
}

function calculateTotal(pageCount, includesEditing) {
  const baseCost = calculateBaseCost(pageCount)
  const editingCost = includesEditing ? calculateEditingCost(pageCount) : 0
  return Math.round((baseCost + editingCost) * 100) / 100
}

// Test cases from the user's requirements
const testCases = [
  { pages: 25, expectedBase: 0, expectedWithEditing: 8, editTime: 30 },
  { pages: 50, expectedBase: 7.50, expectedWithEditing: 15.50, editTime: 30 },
  { pages: 100, expectedBase: 22.50, expectedWithEditing: 30.50, editTime: 30 },
  { pages: 150, expectedBase: 37.50, expectedWithEditing: 49.50, editTime: 60 },
  { pages: 200, expectedBase: 48.50, expectedWithEditing: 60.50, editTime: 60 },
  { pages: 300, expectedBase: 70.50, expectedWithEditing: 85.50, editTime: 120 },
  { pages: 350, expectedBase: 79.50, expectedWithEditing: 99.50, editTime: -1 },
  { pages: 700, expectedBase: 142.50, expectedWithEditing: 162.50, editTime: -1 },
]

console.log('=== Court Bundle Builder - Pricing Verification ===\n')
console.log('Base Pricing Tiers:')
console.log(`  1-${BASE_PRICING.FREE_TIER_MAX} pages: FREE`)
console.log(`  ${BASE_PRICING.FREE_TIER_MAX + 1}-${BASE_PRICING.TIER_2_MAX} pages: £${BASE_PRICING.RATE_TIER_2.toFixed(2)}/page`)
console.log(`  ${BASE_PRICING.TIER_2_MAX + 1}-${BASE_PRICING.TIER_3_MAX} pages: £${BASE_PRICING.RATE_TIER_3.toFixed(2)}/page`)
console.log(`  ${BASE_PRICING.TIER_3_MAX + 1}+ pages: £${BASE_PRICING.RATE_TIER_4.toFixed(2)}/page\n`)

console.log('Editing Add-On Tiers:')
EDITING_TIERS.forEach(tier => {
  const range = tier.to === Infinity ? `${tier.from}+` : `${tier.from}-${tier.to}`
  const time = tier.minutes === -1 ? 'Unlimited' : `${tier.minutes} mins`
  console.log(`  ${range} pages: £${tier.cost} (${time})`)
})

console.log('\n=== Running Tests ===\n')

let allPassed = true

for (const test of testCases) {
  const baseCost = calculateBaseCost(test.pages)
  const totalWithEditing = calculateTotal(test.pages, true)
  const editTime = getEditingTimeLimit(test.pages)

  const basePass = Math.abs(baseCost - test.expectedBase) < 0.01
  const editingPass = Math.abs(totalWithEditing - test.expectedWithEditing) < 0.01
  const timePass = editTime === test.editTime

  if (!basePass || !editingPass || !timePass) {
    allPassed = false
    console.log(`❌ FAILED: ${test.pages} pages`)
    if (!basePass) console.log(`   Base: Expected £${test.expectedBase.toFixed(2)}, Got £${baseCost.toFixed(2)}`)
    if (!editingPass) console.log(`   With Editing: Expected £${test.expectedWithEditing.toFixed(2)}, Got £${totalWithEditing.toFixed(2)}`)
    if (!timePass) console.log(`   Edit Time: Expected ${test.editTime} mins, Got ${editTime} mins`)
  } else {
    const timeStr = editTime === -1 ? 'Unlimited' : `${editTime} mins`
    console.log(`✅ PASSED: ${test.pages} pages = £${baseCost.toFixed(2)} base, £${totalWithEditing.toFixed(2)} with editing, ${timeStr}`)
  }
}

console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'))

// Additional breakdown examples
console.log('\n=== Detailed Breakdown Examples ===\n')

const examplePages = [25, 100, 200, 350]
examplePages.forEach(pages => {
  const base = calculateBaseCost(pages)
  const editing = calculateEditingCost(pages)
  const total = base + editing
  const time = getEditingTimeLimit(pages)
  const timeStr = time === -1 ? 'Unlimited' : `${time} mins`

  console.log(`${pages} pages:`)
  console.log(`  Base Cost: £${base.toFixed(2)}`)
  console.log(`  Editing: £${editing.toFixed(2)} (${timeStr})`)
  console.log(`  Total with Editing: £${total.toFixed(2)}`)
  console.log('')
})
