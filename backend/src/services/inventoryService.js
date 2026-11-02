const prisma = require('../config/database');

class InventoryService {
  /**
   * Process a purchase of materials and update stock & weighted average cost
   * Transaction-safe with Prisma transaction
   */
  async processPurchase(tx, { supplierId, purchaseDate, invoiceRef, paymentStatus, totalAmount, paidAmount, billAttachmentUrl, notes, items }) {
    // Generate unique purchase number
    const count = await tx.materialPurchase.count();
    const purchaseNumber = `GF-PUR-${String(count + 1).padStart(4, '0')}`;

    const purchase = await tx.materialPurchase.create({
      data: {
        purchaseNumber,
        supplierId,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        invoiceRef,
        paymentStatus: paymentStatus || 'PAID',
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount || totalAmount),
        billAttachmentUrl,
        notes,
      },
    });

    for (const item of items) {
      const quantity = Number(item.quantity);
      const totalCost = Number(item.totalCost);
      const unitCost = Number(item.unitCost) || (quantity > 0 ? totalCost / quantity : 0);

      // Create purchase item
      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          materialId: item.materialId,
          quantity,
          unit: item.unit,
          unitCost,
          totalCost,
        },
      });

      // Fetch current material state
      const material = await tx.material.findUnique({
        where: { id: item.materialId },
      });

      if (!material) {
        throw new Error(`Material with ID ${item.materialId} not found.`);
      }

      const prevStock = Number(material.currentStock);
      const prevAvgCost = Number(material.weightedAvgCost);
      const newStock = prevStock + quantity;

      // Weighted Average Cost calculation:
      // Weighted Avg = ( (Current Stock * Current Avg Cost) + (New Purchase Qty * New Unit Cost) ) / (Current Stock + New Purchase Qty)
      // If previous stock <= 0, new average is simply the new purchase unit cost.
      let newWeightedAvgCost = unitCost;
      if (prevStock > 0 && newStock > 0) {
        const totalValue = (prevStock * prevAvgCost) + (quantity * unitCost);
        newWeightedAvgCost = totalValue / newStock;
      }

      // Update material stock & weighted average cost
      await tx.material.update({
        where: { id: item.materialId },
        data: {
          currentStock: newStock,
          weightedAvgCost: Number(newWeightedAvgCost.toFixed(2)),
        },
      });

      // Record inventory transaction
      await tx.inventoryTransaction.create({
        data: {
          materialId: item.materialId,
          transactionType: 'PURCHASE',
          quantity,
          unitCost,
          referenceType: 'PURCHASE',
          referenceId: purchase.purchaseNumber,
          notes: `Purchased ${quantity} ${item.unit} via ${purchase.purchaseNumber}`,
        },
      });
    }

    return purchase;
  }

  /**
   * Consume material for an order
   * Ensures company materials don't deduct shop stock or incur shop cost
   */
  async consumeMaterial(tx, { orderId, materialId, source, requiredQuantity, consumedQuantity, wastageQuantity, notes }) {
    const isShopMaterial = (source || 'SHOP').toUpperCase() === 'SHOP';
    const consumedQty = Number(consumedQuantity);
    const reqQty = Number(requiredQuantity || consumedQty);
    const wasteQty = Number(wastageQuantity || 0);

    const material = await tx.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new Error(`Material with ID ${materialId} not found.`);
    }

    let unitCostSnapshot = 0;
    let totalCost = 0;

    if (isShopMaterial) {
      // Check current stock
      const currentStock = Number(material.currentStock);
      if (currentStock < (consumedQty + wasteQty)) {
        throw new Error(`Insufficient stock for "${material.name}". Available: ${currentStock} ${material.unit}, Required: ${consumedQty + wasteQty} ${material.unit}`);
      }

      unitCostSnapshot = Number(material.weightedAvgCost);
      // Material Consumption Cost = Actual Consumed Quantity × Applicable Unit Cost
      totalCost = Number((consumedQty * unitCostSnapshot).toFixed(2));

      // Decrement shop stock
      const newStock = currentStock - (consumedQty + wasteQty);
      await tx.material.update({
        where: { id: materialId },
        data: { currentStock: newStock },
      });

      // Record transaction
      await tx.inventoryTransaction.create({
        data: {
          materialId,
          transactionType: 'CONSUMPTION',
          quantity: -(consumedQty + wasteQty),
          unitCost: unitCostSnapshot,
          referenceType: 'ORDER',
          referenceId: String(orderId),
          notes: `Consumed for order #${orderId} (Consumed: ${consumedQty}, Wastage: ${wasteQty})`,
        },
      });
    } else {
      // Company-supplied material: unit cost is 0 for the shop
      unitCostSnapshot = 0;
      totalCost = 0;
    }

    const consumption = await tx.materialConsumption.create({
      data: {
        orderId,
        materialId,
        source: isShopMaterial ? 'SHOP' : 'COMPANY',
        requiredQuantity: reqQty,
        consumedQuantity: consumedQty,
        unitCostSnapshot,
        totalCost,
        wastageQuantity: wasteQty,
        notes,
      },
    });

    return consumption;
  }

  /**
   * Manual Stock Adjustment (reconciliation, physical audit)
   */
  async adjustStock(tx, { materialId, adjustedStock, reason }) {
    const material = await tx.material.findUnique({ where: { id: materialId } });
    if (!material) throw new Error(`Material ${materialId} not found`);

    const currentStock = Number(material.currentStock);
    const targetStock = Number(adjustedStock);
    const diff = targetStock - currentStock;

    await tx.material.update({
      where: { id: materialId },
      data: { currentStock: targetStock },
    });

    await tx.inventoryTransaction.create({
      data: {
        materialId,
        transactionType: 'ADJUSTMENT',
        quantity: diff,
        unitCost: Number(material.weightedAvgCost),
        referenceType: 'MANUAL',
        notes: reason || `Manual stock adjustment from ${currentStock} to ${targetStock}`,
      },
    });

    return { currentStock: targetStock, difference: diff };
  }
}

module.exports = new InventoryService();
