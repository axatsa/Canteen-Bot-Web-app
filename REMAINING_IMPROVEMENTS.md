# 📋 Remaining Improvements and Medium-Priority Issues

This document lists improvements and medium-priority issues identified in the audit that could be addressed in future iterations.

## Medium-Priority Issues

### 1. Price Validation
**Status:** Not yet implemented

**Issue:** No validation for prices - users could enter negative or extremely large values.

**Recommendation:** Add price validation in the upsert_order function:
- Prices should be >= 0
- Prices should have reasonable upper bounds
- Handle edge cases for currency precision

**Implementation effort:** Low (1-2 hours)

```python
def validate_prices(products: list) -> tuple[bool, str]:
    for p in products:
        if p.get('price'):
            if p['price'] < 0:
                return False, f"Price cannot be negative for {p['name']}"
            if p['price'] > 10_000_000:
                return False, f"Price is too large for {p['name']}"
    return True, ""
```

### 2. Extra Items Handling for Mixed Orders
**Status:** Clarification needed

**Issue:** When an order contains both meat and products, Extra Items could be added without clear categorization.

**Current behavior:** Extra Items are added without type verification.

**Recommendation:** 
- Clarify business requirements with stakeholders
- If Extra Items should be categorized, add type field
- If Extra Items are intentionally uncategorized, document this clearly

**Implementation effort:** Medium (depends on requirements)

### 3. Better Error Logging
**Status:** Partially implemented

**Issue:** Some error cases only log to console, not to file.

**Recommendation:**
- Add comprehensive error logging for all critical operations
- Log permission denials with user and order information
- Create error logs for audit trail

**Implementation effort:** Medium (2-3 hours)

## Low-Priority Enhancements

### 1. Optimize Database Queries
**Status:** Not yet implemented

**Issue:** Some queries could be optimized with better indexing.

**Recommendation:**
- Add indexes on frequently queried columns:
  - `orders.branch`
  - `orders.status`
  - `orders.chef_name`
  - `orders.supplier_name`
  - `orders.snabjenec_name`

### 2. Cache Frequently Accessed Data
**Status:** Not yet implemented

**Issue:** Products list is fetched on every page load.

**Recommendation:**
- Cache master products list on the frontend
- Add cache invalidation when products are updated

### 3. API Response Standardization
**Status:** Partially implemented

**Issue:** Different endpoints return slightly different error format.

**Recommendation:**
- Standardize all API responses to use consistent error format
- Example: `{ error: string, code: string, details?: any }`

### 4. Rate Limiting
**Status:** Not yet implemented

**Issue:** No rate limiting on API endpoints.

**Recommendation:**
- Implement rate limiting to prevent abuse
- Use FastAPI middleware or external service

## Testing Recommendations

### Unit Tests
- [ ] Test role-based filtering for each role
- [ ] Test status transition validation
- [ ] Test mandatory field validation
- [ ] Test permission checks for each role

### Integration Tests
- [ ] Test complete order lifecycle from chef to financier
- [ ] Test error scenarios (invalid permissions, invalid status)
- [ ] Test concurrent updates

### E2E Tests
- [ ] Test full user workflows for each role
- [ ] Test edge cases (empty orders, large orders)

## Performance Considerations

1. **Database:** Consider indexing frequently filtered columns
2. **Frontend:** Large order lists could be virtualized for better performance
3. **API:** Consider pagination for large result sets

## Documentation Updates Needed

1. Update API documentation with new required parameters (role, branch, user_name)
2. Add status transition diagram to technical documentation
3. Document mandatory field requirements for each status
4. Create runbook for database migration if needed

## Next Steps (Priority Order)

1. **High:** Deploy to staging and perform comprehensive testing
2. **High:** Update frontend documentation for new API parameters
3. **Medium:** Add price validation
4. **Medium:** Implement comprehensive error logging
5. **Low:** Optimize database queries with indexes
6. **Low:** Cache improvements
