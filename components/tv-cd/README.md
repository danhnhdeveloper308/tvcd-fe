# CD Product Display - Auto Slide TV Component

Component hiển thị chi tiết BTP tổ CD với tính năng auto-slide như PowerPoint và real-time WebSocket updates.

## 📁 Files Structure

```
d:/TV/tvcd-fe/
├── types/cd-product.types.ts           # Type definitions
├── hooks/useCDProductData.ts           # Custom hook with WebSocket
├── components/tv-cd/
│   └── TVDisplayCDProduct.tsx          # Main component
├── app/tv-cd-product/
│   └── page.tsx                        # Page route
└── services/
    └── websocket.service.ts            # WebSocket service (updated)
```

## 🚀 Features

### 1. **Auto-Slide PowerPoint Style**
- ⏱️ Tự động chuyển slide mỗi 10 giây (configurable)
- 🔄 Loop qua tất cả sản phẩm
- ⏸️ Tạm dừng khi hover hoặc manual navigation
- 📊 Slide indicators ở bottom

### 2. **Flash Animation (Like TVDisplayHTM)**
- ⚡ Flash màu vàng khi data thay đổi
- 🎯 Track changes cho:
  - Product metadata (ma, mau, slkh, nhuCauLuyKe)
  - Main product row (tenChiTiet, keHoachGiao, luyKeGiao, conLai, ttdb, canXuLy)
  - Detail rows (all fields per row)
- ⏱️ Flash duration: 2 seconds

### 3. **WebSocket Real-time Updates**
- 🔌 Subscribe: `socket.emit('subscribe-cd-product', { code: 'CD1' })`
- 📡 Listen: `socket.on('cd-product-update', callback)`
- ✅ Connection status indicator
- 🔄 Auto-reconnect và re-subscribe

### 4. **Navigation Controls**
- ◀️ Previous/Next buttons (show on hover)
- 📍 Dot indicators (click to jump)
- ⏸️ Manual navigation pauses auto-slide for 5 seconds

## 📖 Usage

### URL Format
```
http://localhost:3000/tv-cd-product?code=cd1
http://localhost:3000/tv-cd-product?code=cd2
http://localhost:3000/tv-cd-product?code=cd3
http://localhost:3000/tv-cd-product?code=cd4
```

### Component Props
```tsx
<TVDisplayCDProduct
  code="cd1"                    // cd1, cd2, cd3, cd4
  autoSlideInterval={10000}     // 10 seconds per slide
  refreshInterval={30000}       // Fallback refresh (not used with WebSocket)
  tvMode={true}                 // Enable auto-slide
/>
```

## 🎨 UI Layout

```
┌──────────────────────────────────────────────┐
│  [Logo]  BẢNG THEO DÕI CHI TIẾT BTP TỔ CD1 TS3│
│  STYLE CEM07 | MÀU B4Z5D | SLKH 5341          │
│                                    [Time] [🔌] │
├────┬─────────┬──────┬────────┬───────┬────────┤
│STT │ TÊN CT  │ GIAO │LK GIAO │+/- CL │CẦN XỬ LÝ│
├────┼─────────┼──────┼────────┼───────┼────────┤
│ 1  │ Thân    │  17  │ 5341   │   -   │   0    │
│ 2  │ Hồng túi│   0  │ 5341   │   -   │   0    │
│... │         │      │        │       │        │
└────┴─────────┴──────┴────────┴───────┴────────┘
            [◀] [• • • •] [▶]  ← Navigation
```

## 🔧 Technical Implementation

### Flash Detection Logic
```typescript
// Track previous data state
const prevDataRef = useRef<any>(null);
const [flashingCells, setFlashingCells] = useState<Set<string>>(new Set());

// Detect changes and trigger flash
useEffect(() => {
  // Compare prev vs current data
  // Set flashingCells for changed fields
  // Auto-clear after 2 seconds
}, [data, currentProduct]);
```

### WebSocket Integration
```typescript
// Custom hook handles subscription
const { data, loading, error, connected } = useCDProductData({
  code: 'cd1',
  enableRealtime: true,
  tvMode: true,
});

// Auto-update UI when data changes
useEffect(() => {
  // Flash animation triggers automatically
  // Slide resets to first product
}, [data?.lastUpdate]);
```

### CSS Animation
```css
@keyframes flash-yellow {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(250, 204, 21, 0.7); }
}

.animate-flash-yellow {
  animation: flash-yellow 1s ease-in-out 2;
}
```

## 🎯 Key Differences from TVDisplayHTM

| Feature | TVDisplayHTM | TVDisplayCDProduct |
|---------|-------------|-------------------|
| Layout | Complex metrics grid | Simple table layout |
| Slides | N/A | Auto-slide per product |
| Data Source | Main production data | CD Product sheets (CD1-4) |
| Flash Targets | Production metrics | Product & detail rows |
| Navigation | N/A | Previous/Next + Indicators |

## 🐛 Debugging

### Enable Console Logs
```typescript
// In useCDProductData.ts
console.log('🔄 CD Product WebSocket update:', updateData);
console.log('✅ CD Product data updated:', newData);

// In TVDisplayCDProduct.tsx
console.log('🔄 Flash animation triggered:', Array.from(newFlashing));
```

### Test WebSocket Manually
```bash
# Trigger manual check
POST http://localhost:3001/api/display/cd-product/check-changes

# Response shows changes detected
{
  "success": true,
  "message": "CD Product sheets check completed",
  "stats": { ... }
}
```

## 🔄 Update Flow

```
1. Google Sheet Change (User edits CD1, CD2, CD3, or CD4)
   ↓
2. Backend Cron (Every 2 minutes, 7AM-9PM Mon-Sat)
   ↓
3. CDProductListenerService.checkForChanges()
   ↓
4. Detect Changes & Calculate Checksum
   ↓
5. WebSocket Emit: 'cd-product-update' to room 'cd-product-{code}'
   ↓
6. Frontend useCDProductData Hook Receives Update
   ↓
7. Update State → Trigger Flash Animation
   ↓
8. UI Updates with Yellow Flash (2 seconds)
```

## 📝 Notes

- **Auto-slide**: Only active when `tvMode={true}`
- **Flash animation**: Triggers on ANY field change
- **Slide reset**: When products list changes (add/remove products)
- **Pause behavior**: Manual navigation pauses for 5 seconds then resumes
- **Connection indicator**: Green WiFi = connected, Red WiFi = offline

## 🎓 Example Implementation

See [TVDisplayHTM_Optimized.tsx](../tv-htm/TVDisplayHTM_Optimized.tsx) for reference implementation of:
- Flash detection logic
- useEffect patterns
- Helper functions (getFlashClass)
- Error handling
