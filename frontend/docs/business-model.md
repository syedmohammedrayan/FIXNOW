# FixNow — Business Model

## Value Proposition

FixNow is an AI-powered home services marketplace that connects customers with verified technicians for appliance repair, installation, and maintenance. The platform uses artificial intelligence to diagnose issues, match specialists, guide repairs, and predict future failures.

## Revenue Streams

### 1. Service Commission
- Platform takes a percentage commission on each completed booking
- Revenue tracked via Firestore `transactions` collection

### 2. Technician Subscriptions
- Technicians subscribe for premium visibility, priority booking, and AI Copilot access
- Managed via the `SubscriptionPanel` component

### 3. Tools & Materials Marketplace
- Technicians can order tools and materials through the platform
- Orders managed via `tool_orders` Firestore collection
- Payment verification handled by admin dashboard

## User Segments

### Customers
- Report appliance issues via text, voice, or image
- Receive AI-powered diagnosis with cost estimates
- Track technician location and repair progress in real-time
- View maintenance history and predictive maintenance alerts

### Technicians
- Receive AI-generated work plans with step-by-step guides
- Accept broadcast bookings from nearby customers
- Document repairs with photos and notes
- Track earnings and manage profile/skills

### Administrators
- Approve/reject technician applications
- Monitor platform metrics (bookings, revenue, satisfaction)
- Manage tool orders and verify payments
- Access AI-generated operational intelligence

## AI Competitive Advantages

| Feature | Traditional Platforms | FixNow |
|---------|----------------------|--------|
| Issue Diagnosis | Manual category selection | AI-powered multimodal diagnosis |
| Technician Matching | Basic location filter | Skill-matched + AI urgency scoring |
| Repair Guidance | None | AI Copilot with step-by-step plans |
| Failure Prediction | None | Hindsight-powered predictive maintenance |
| Admin Analytics | Basic dashboards | AI-generated operational intelligence |

## Market Opportunity

- Home services market in India: $50B+ annually
- Smartphone penetration enabling digital booking: 70%+
- Gap: No platform combines AI diagnosis + real-time tracking + predictive maintenance
- FixNow uniquely positions at the intersection of AI and home services

## Growth Strategy

1. **City-by-city launch**: Start with high-density urban areas
2. **Technician acquisition**: Onboard skilled technicians with verification pipeline
3. **Customer acquisition**: AI diagnosis as the hook — "Tell us what's broken, AI handles the rest"
4. **Retention**: Predictive maintenance keeps customers engaged between breakdowns
5. **Expansion**: Add new service categories (cleaning, pest control, renovation)
