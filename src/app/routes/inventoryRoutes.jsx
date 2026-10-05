import React from 'react'
import { Route } from 'react-router-dom'
import { InventoryPage } from '../../modules/inventory/pages/InventoryPage'

export const inventoryRoutes = (
  <Route path="inventory" element={<InventoryPage />} />
)
