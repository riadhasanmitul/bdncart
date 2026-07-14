const { query, getClient } = require('../../shared/config/database');

/**
 * Executes the entire checkout flow in a single ACID transaction.
 * If any step fails, the entire order is rolled back.
 */
async function createOrderTransaction(userId, cart, shippingAddressId) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // 1. Lock the variants rows so no one else can buy them while we are processing
    // FOR UPDATE locks the rows in PostgreSQL until this transaction commits/rolls back.
    const variantIds = cart.items.map(item => item.variantId);
    
    // We must lock rows in a deterministic order to prevent deadlocks
    const lockSql = `
      SELECT id, stock_quantity 
      FROM product_variants 
      WHERE id = ANY($1) 
      ORDER BY id 
      FOR UPDATE
    `;
    const lockRes = await client.query(lockSql, [variantIds]);
    
    // Map locked rows for quick lookup
    const dbStockMap = {};
    lockRes.rows.forEach(row => {
      dbStockMap[row.id] = row.stock_quantity;
    });

    // 2. Validate stock again (someone might have bought the last item seconds ago!)
    for (const item of cart.items) {
      const currentStock = dbStockMap[item.variantId];
      if (currentStock === undefined || currentStock < item.quantity) {
        throw new Error(`Insufficient stock for item: ${item.productName}`);
      }
    }

    // 3. Create the Order
    const orderSql = `
      INSERT INTO orders (user_id, shipping_address_id, total_amount, status, payment_status)
      VALUES ($1, $2, $3, 'processing', 'paid') 
      RETURNING id
    `;
    // We hardcode 'paid' here because we are simulating a successful payment gateway
    const orderRes = await client.query(orderSql, [
      userId,
      shippingAddressId,
      cart.totalPrice
    ]);
    const orderId = orderRes.rows[0].id;

    // 4. Create Order Items (Snapshot) & Decrement Stock
    for (const item of cart.items) {
      // Insert Snapshot
      const itemSql = `
        INSERT INTO order_items (order_id, product_id, variant_id, product_name, sku, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, (SELECT sku FROM product_variants WHERE id = $3), $5, $6, $7)
      `;
      const subtotal = item.price * item.quantity;
      await client.query(itemSql, [
        orderId,
        item.productId,
        item.variantId,
        item.productName,
        item.quantity,
        item.price,
        subtotal
      ]);

      // Decrement Stock
      const stockSql = `
        UPDATE product_variants 
        SET stock_quantity = stock_quantity - $1 
        WHERE id = $2
      `;
      await client.query(stockSql, [item.quantity, item.variantId]);
    }

    await client.query('COMMIT');
    return orderId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getUserOrders(userId) {
  const sql = `
    SELECT id, total_amount, status, payment_status, created_at
    FROM orders
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const result = await query(sql, [userId]);
  return result.rows;
}

async function getOrderDetails(orderId, userId) {
  // We check userId to ensure users can only view their own orders
  const orderSql = `
    SELECT o.*, a.street_address, a.city, a.postal_code
    FROM orders o
    LEFT JOIN addresses a ON o.shipping_address_id = a.id
    WHERE o.id = $1 AND o.user_id = $2
  `;
  const orderResult = await query(orderSql, [orderId, userId]);
  
  if (orderResult.rows.length === 0) return null;
  
  const order = orderResult.rows[0];
  
  const itemsSql = `
    SELECT product_name, sku, quantity, unit_price, subtotal
    FROM order_items
    WHERE order_id = $1
  `;
  const itemsResult = await query(itemsSql, [orderId]);
  
  order.items = itemsResult.rows;
  return order;
}

module.exports = {
  createOrderTransaction,
  getUserOrders,
  getOrderDetails
};
