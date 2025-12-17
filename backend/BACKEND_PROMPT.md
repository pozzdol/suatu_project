# Backend Implementation for Partial Delivery Orders

## Context
Kita perlu mengimplementasikan sistem **partial delivery order** dimana:
- Satu Work Order bisa memiliki **multiple delivery orders**
- Setiap delivery order hanya mengirim **sebagian produk** (sesuai kapasitas mobil)
- Track **quantity delivered** vs **quantity remaining** untuk setiap produk
- Tidak ada auto-create delivery order saat Work Order completed

## Database Schema Changes

### 1. DeliveryOrder Table
```prisma
model DeliveryOrder {
  id          String   @id @default(uuid())
  orderCode   String   @unique // Generate: DO-YYYYMMDD-XXX
  workOrderId String
  orderId     String
  description String?
  status      String   @default("pending") // pending, shipped, delivered, cancelled
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  shippedAt   DateTime?
  
  workOrder   WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  order       Order     @relation(fields: [orderId], references: [id])
  items       DeliveryOrderItem[]
}

model DeliveryOrderItem {
  id              String   @id @default(uuid())
  deliveryOrderId String
  productId       String
  productName     String
  quantity        Int      // Quantity untuk delivery ini saja
  unit            String?
  
  deliveryOrder   DeliveryOrder @relation(fields: [deliveryOrderId], references: [id], onDelete: Cascade)
  product         Product       @relation(fields: [productId], references: [id])
}
```

### 2. Update WorkOrder Model
```prisma
model WorkOrder {
  // ... existing fields
  deliveryOrders DeliveryOrder[]
}
```

## API Endpoints Required

### 1. Create Delivery Order (POST `/transactions/delivery-orders`)
**Request Body:**
```typescript
{
  workOrderId: string;
  orderId: string;
  description?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}
```

**Validations:**
- Work Order harus exist dan status = "completed"
- Untuk setiap product, validate:
  - Product ID valid
  - Quantity > 0
  - Total delivered quantity (existing + new) ≤ ordered quantity dari Work Order
- Generate unique `orderCode`: `DO-${YYYYMMDD}-${sequence}`

**Response:**
```typescript
{
  success: true,
  data: {
    deliveryOrder: {
      id: string;
      orderCode: string;
      workOrderId: string;
      orderId: string;
      description: string;
      status: string;
      createdAt: string;
      items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unit: string;
      }>;
    }
  }
}
```

**Business Logic:**
```typescript
// Pseudo-code
async function createDeliveryOrder(data) {
  // 1. Get Work Order with items
  const workOrder = await getWorkOrderWithItems(data.workOrderId);
  
  if (workOrder.status !== 'completed') {
    throw new Error('Work Order must be completed first');
  }
  
  // 2. Get all existing delivery orders for this work order
  const existingDeliveries = await getDeliveryOrdersByWorkOrder(data.workOrderId);
  
  // 3. Calculate delivered quantities per product
  const deliveredQuantities = {};
  existingDeliveries.forEach(delivery => {
    delivery.items.forEach(item => {
      deliveredQuantities[item.productId] = 
        (deliveredQuantities[item.productId] || 0) + item.quantity;
    });
  });
  
  // 4. Validate new delivery quantities
  for (const newItem of data.items) {
    const workOrderItem = workOrder.items.find(i => i.productId === newItem.productId);
    
    if (!workOrderItem) {
      throw new Error(`Product ${newItem.productId} not found in work order`);
    }
    
    const alreadyDelivered = deliveredQuantities[newItem.productId] || 0;
    const remaining = workOrderItem.quantity - alreadyDelivered;
    
    if (newItem.quantity > remaining) {
      throw new Error(
        `Cannot deliver ${newItem.quantity} of ${workOrderItem.productName}. ` +
        `Only ${remaining} remaining (${alreadyDelivered} already delivered)`
      );
    }
  }
  
  // 5. Generate order code
  const orderCode = await generateDeliveryOrderCode(); // DO-20250117-001
  
  // 6. Create delivery order with items
  const deliveryOrder = await prisma.deliveryOrder.create({
    data: {
      orderCode,
      workOrderId: data.workOrderId,
      orderId: data.orderId,
      description: data.description,
      status: 'pending',
      items: {
        create: data.items.map(item => {
          const workOrderItem = workOrder.items.find(i => i.productId === item.productId);
          return {
            productId: item.productId,
            productName: workOrderItem.productName,
            quantity: item.quantity,
            unit: workOrderItem.unit,
          };
        })
      }
    },
    include: {
      items: true
    }
  });
  
  return deliveryOrder;
}
```

### 2. Get Delivery Orders by Work Order (GET `/transactions/delivery-orders/work-order/:workOrderId`)
**Response:**
```typescript
{
  success: true,
  data: {
    deliveryOrders: Array<{
      id: string;
      orderCode: string;
      workOrderId: string;
      orderId: string;
      description: string;
      status: string;
      createdAt: string;
      shippedAt: string | null;
      items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unit: string;
      }>;
    }>
  }
}
```

### 3. Delete Delivery Order (DELETE `/transactions/delivery-orders/:id`)
**Validations:**
- Only allow delete if status = "pending"
- Admin only

**Response:**
```typescript
{
  success: true,
  message: "Delivery order deleted successfully"
}
```

### 4. Update Delivery Order Status (PUT `/transactions/delivery-orders/:id/status`)
**Request Body:**
```typescript
{
  status: "pending" | "shipped" | "delivered" | "cancelled";
  shippedAt?: string; // required if status = "shipped"
}
```

## Helper Functions

### Generate Delivery Order Code
```typescript
async function generateDeliveryOrderCode(): Promise<string> {
  const today = new Date();
  const dateStr = format(today, 'yyyyMMdd'); // 20250117
  
  // Get count of delivery orders created today
  const count = await prisma.deliveryOrder.count({
    where: {
      createdAt: {
        gte: startOfDay(today),
        lte: endOfDay(today)
      }
    }
  });
  
  const sequence = String(count + 1).padStart(3, '0');
  return `DO-${dateStr}-${sequence}`;
}
```

### Calculate Product Delivery Summary
```typescript
async function getProductDeliverySummary(workOrderId: string) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      items: true,
      deliveryOrders: {
        include: {
          items: true
        }
      }
    }
  });
  
  return workOrder.items.map(item => {
    const delivered = workOrder.deliveryOrders.reduce((sum, delivery) => {
      const deliveryItem = delivery.items.find(di => di.productId === item.productId);
      return sum + (deliveryItem?.quantity || 0);
    }, 0);
    
    return {
      productId: item.productId,
      productName: item.productName,
      orderedQuantity: item.quantity,
      deliveredQuantity: delivered,
      remainingQuantity: item.quantity - delivered,
      unit: item.unit
    };
  });
}
```

## Migration Script

```typescript
// Create delivery order tables
await prisma.$executeRaw`
  CREATE TABLE delivery_orders (
    id VARCHAR(36) PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    work_order_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP NULL,
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE delivery_order_items (
    id VARCHAR(36) PRIMARY KEY,
    delivery_order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(20),
    FOREIGN KEY (delivery_order_id) REFERENCES delivery_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE INDEX idx_delivery_order_work_order ON delivery_orders(work_order_id);
  CREATE INDEX idx_delivery_order_created_at ON delivery_orders(created_at);
`;
```

## Testing Checklist

- [ ] Create delivery order with valid quantities
- [ ] Reject delivery order if quantities exceed remaining
- [ ] Reject delivery order if work order not completed
- [ ] Multiple delivery orders can be created for same work order
- [ ] Total delivered never exceeds ordered quantity
- [ ] Order code is unique and properly generated
- [ ] Delete delivery order works
- [ ] Cannot delete delivered orders
- [ ] Get delivery orders returns all with items
- [ ] Frontend correctly shows remaining quantities

## Implementation Steps

1. **Update Prisma Schema** - Add DeliveryOrder and DeliveryOrderItem models
2. **Run Migration** - Create tables in database
3. **Create Service Layer** - `deliveryOrderService.ts` with all business logic
4. **Create Controller** - `deliveryOrderController.ts` with routes
5. **Add Validation** - Use Joi/Zod for request validation
6. **Test Endpoints** - Use Postman/Thunder Client
7. **Update Existing Code** - Remove auto-create delivery on work order completion

## Notes

- Frontend sudah ready dengan Modal untuk input quantity
- Frontend akan call endpoint dengan array of items & quantities
- Frontend akan track delivered vs remaining di UI
- Delivery order bisa dibuat berkali-kali sampai semua item terkirim
- Status work order tetap "completed" meski delivery belum semua
