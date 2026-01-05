# Court Bundle Builder - Monthly Maintenance Guide

## Review Schedule

**Frequency:** Monthly, on the 5th of each month
**Last Review:** 2025-01-05
**Next Review:** 2025-02-05

## Step 1: Check Practice Direction Sources

Review the following official sources for any updates:

### Primary Sources

| Court/Tribunal | Link | What to Check |
|----------------|------|---------------|
| **Civil Procedure Rules** | [justice.gov.uk/courts/procedure-rules/civil](https://www.justice.gov.uk/courts/procedure-rules/civil) | PD 32 (Trial Bundles), PD 52C (Court of Appeal) |
| **Family Procedure Rules** | [justice.gov.uk/courts/procedure-rules/family](https://www.justice.gov.uk/courts/procedure-rules/family) | PD 27A (Bundles) |
| **Court of Protection** | [justice.gov.uk/courts/procedure-rules/family/practice_directions](https://www.justice.gov.uk/courts/procedure-rules/family/practice_directions) | PD 14E |
| **Financial Remedies Court** | [judiciary.uk/guidance-and-resources](https://www.judiciary.uk/guidance-and-resources/) | FRC Efficiency Statement |
| **Employment Tribunal** | [gov.uk/employment-tribunal](https://www.gov.uk/employment-tribunal/overview) | Presidential Practice Directions |
| **Immigration Tribunal** | [judiciary.uk/courts-and-tribunals/tribunals](https://www.judiciary.uk/courts-and-tribunals/tribunals/first-tier-tribunal/immigration-and-asylum-chamber/) | Practice Directions 2014 |
| **Planning Inspectorate** | [gov.uk/government/organisations/planning-inspectorate](https://www.gov.uk/government/organisations/planning-inspectorate) | Procedural Guide |

### Quick Links for Each Bundle Type

- **Family (Children):** [PD 27A](https://www.justice.gov.uk/courts/procedure-rules/family/practice_directions/pd_part_27a)
- **Financial Remedy:** [FRC Guidance](https://www.judiciary.uk/guidance-and-resources/notice-from-the-financial-remedies-court-4/)
- **Court of Appeal:** [Part 52](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part52)
- **Civil Trial:** [Part 32](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part32)
- **Court of Protection:** [PD 14E](https://www.justice.gov.uk/courts/procedure-rules/family/practice_directions/pd_part_14e)

## Step 2: Update the JSON File

If changes are found, update `src/data/bundleRequirements.json`:

1. **Update the specific bundle type** with new requirements
2. **Update `last_reviewed`** date for that bundle type
3. **Add entry to `change_log`** array describing the change
4. **Bump the version number:**
   - Minor updates (typos, clarifications): increment patch (1.0.1 → 1.0.2)
   - New sections or requirements: increment minor (1.0.2 → 1.1.0)
   - Major restructure: increment major (1.1.0 → 2.0.0)

## Step 3: Update Review Dates

After completing the review (whether changes were found or not):

```json
{
  "version": "1.0.X",
  "last_updated": "YYYY-MM-DD",
  "next_review_due": "YYYY-MM-DD (add 1 month)",
  ...
}
```

## Step 4: Deploy

```bash
git add .
git commit -m "Monthly PD review - [Month Year]"
git push
```

Changes will auto-deploy to Cloudflare Pages.

## Change Log Template

When adding to the change_log array:

```json
{
  "date": "2025-02-05",
  "bundle_type": "financial_remedy",
  "change": "Updated page limit guidance per FRC Notice dated X",
  "version": "1.0.2"
}
```

## Contact for Major Updates

If significant changes are identified that affect multiple bundle types or require user notification, consider:
- Adding a banner notice to the app
- Updating the version badge prominently
- Emailing registered users (if applicable)
