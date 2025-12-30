# 📱 Frontend ENDLINE Integration Guide

## 🎯 Overview

Frontend đã được cập nhật để hỗ trợ **ENDLINE RFT data filtering** với parameter `index` theo Tổ (team).

---

## 🔗 API URL Format

### Basic Usage (All Teams)
```
/tv?code=KVHB07M01
```

### With Team Filter
```
/tv?code=KVHB07M01&index=0  // Tổ 1
/tv?code=KVHB07M01&index=1  // Tổ 2
/tv?code=KVHB07M01&index=2  // Tổ 3
```

### Complete Example
```
/tv?code=KVHB07M10&factory=TS1&index=0
```

---

## 📋 URL Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `code` | string | ✅ Yes | Mã chuyền line | `KVHB07M01` |
| `factory` | string | ❌ No | Factory (for CD lines) | `TS1`, `TS2`, `TS3` |
| `index` | string | ❌ No | Team index (0-based) | `0`, `1`, `2` |
| `line` | string | ❌ No | Line number | `1`, `2`, `3` |
| `team` | string | ❌ No | Team name (legacy) | `1`, `2`, `3` |

---

## 🔄 Data Flow

```typescript
URL Parameter (index)
  ↓
page.tsx (extract from searchParams)
  ↓
TVDisplay3.tsx (props)
  ↓
useProductionData hook (options)
  ↓
apiService.getTVDisplayData(code, factory, index)
  ↓
Backend API: /api/display/tv?code=...&index=0
  ↓
HTMSheetsService.getProductionDataWithFilter(factory, teamIndex)
  ↓
parseRFTData with team filtering
  ↓
Return filtered ENDLINE data
```

---

## 📝 Code Changes

### 1️⃣ **Page Component** (`app/tv/page.tsx`)

```typescript
function TVDisplayV3Content() {
  const searchParams = useSearchParams();
  const index = searchParams.get("index") || undefined; // ⭐ NEW
  
  return (
    <TVDisplayV3
      maChuyenLine={maChuyenLine}
      factory={factory}
      index={index} // ⭐ Pass to component
      tvMode={true}
    />
  );
}
```

### 2️⃣ **TV Display Component** (`components/tv-htm/TVDisplay3.tsx`)

```typescript
interface TVDisplayHTMProps {
  maChuyenLine?: string;
  index?: string; // ⭐ NEW: Team index parameter
  // ... other props
}

export default function TVDisplayHTM({ 
  maChuyenLine, 
  index, // ⭐ NEW
  // ...
}: TVDisplayHTMProps) {
  const { data, loading } = useProductionData({
    maChuyenLine,
    index, // ⭐ Pass to hook
    enableRealtime: true,
  });
}
```

### 3️⃣ **Production Data Hook** (`hooks/useProductionData.ts`)

```typescript
interface UseProductionDataOptions {
  maChuyenLine?: string;
  index?: string; // ⭐ NEW: Team index for ENDLINE filtering
  enableRealtime?: boolean;
}

const fetchInitialData = async () => {
  if (options.maChuyenLine) {
    const tvResponse = await apiService.getTVDisplayData(
      options.maChuyenLine,
      extractedFactory,
      options.index // ⭐ Pass to API service
    );
  }
};
```

### 4️⃣ **API Service** (`services/api.service.ts`)

```typescript
async getTVDisplayData(
  code: string,
  factory?: string,
  index?: string // ⭐ NEW parameter
): Promise<APIResponse<TVDisplayAPIResponse>> {
  let endpoint = `/display/tv?code=${code}`;
  
  if (factory) {
    endpoint += `&factory=${factory}`;
  }
  
  // ⭐ NEW: Add index parameter
  if (index !== undefined && index !== null) {
    endpoint += `&index=${index}`;
  }
  
  return this.fetchApi<TVDisplayAPIResponse>(endpoint);
}
```

---

## 🧪 Testing

### Test Cases

#### 1. Without Index (All Teams)
```bash
# URL
http://localhost:3000/tv?code=KVHB07M01

# Expected: Show data for all teams combined
```

#### 2. With Index=0 (Tổ 1)
```bash
# URL
http://localhost:3000/tv?code=KVHB07M01&index=0

# Expected: Show only Tổ 1 data
# Backend filters: ENDLINE data where column E = "Tổ 1"
```

#### 3. With Index=1 (Tổ 2)
```bash
# URL
http://localhost:3000/tv?code=KVHB07M01&index=1

# Expected: Show only Tổ 2 data
```

#### 4. Multiple Lines, Different Teams
```bash
# TV 1: Line M01, Tổ 1
http://localhost:3000/tv?code=KVHB07M01&index=0

# TV 2: Line M01, Tổ 2
http://localhost:3000/tv?code=KVHB07M01&index=1

# TV 3: Line M02, Tổ 1
http://localhost:3000/tv?code=KVHB07M02&index=0
```

---

## 🎨 UI/UX Considerations

### 1. **Display Team Information**

Show which team data is being displayed:

```typescript
// In TVDisplay3.tsx
{index !== undefined && (
  <div className="team-indicator">
    Displaying: Tổ {parseInt(index) + 1}
  </div>
)}
```

### 2. **Error Handling**

Handle invalid index values:

```typescript
// Validate index range (0-2 for 3 teams)
const teamIndex = index !== undefined ? parseInt(index) : undefined;
if (teamIndex !== undefined && (teamIndex < 0 || teamIndex > 2)) {
  console.warn(`Invalid team index: ${teamIndex}. Must be 0-2`);
}
```

### 3. **Loading States**

```typescript
{loading && (
  <div className="loading">
    Loading {index !== undefined ? `Tổ ${parseInt(index) + 1}` : 'all teams'} data...
  </div>
)}
```

---

## 📊 Data Structure

### Backend Response with Index Filter

```json
{
  "success": true,
  "code": "KVHB07M01",
  "lineType": "HTM",
  "teamIndex": 0,
  "data": {
    "maChuyenLine": "KVHB07M01",
    "to": "Tổ 1",
    "hourlyData": {
      "h830": {
        "tongKiem": 150,
        "tongDat": 142,
        "rft": 95.5,
        "loi1": 5,
        "loi2": 3
      }
    }
  }
}
```

### Without Index (All Teams Combined)

```json
{
  "success": true,
  "code": "KVHB07M01",
  "lineType": "HTM",
  "data": {
    "maChuyenLine": "KVHB07M01",
    "to": "All Teams",
    "hourlyData": {
      "h830": {
        "tongKiem": 450,  // Sum of all 3 teams
        "tongDat": 428,
        "rft": 95.1
      }
    }
  }
}
```

---

## 🔍 Debugging

### Check URL Parameters

```typescript
// In page.tsx
console.log('URL Params:', {
  code: searchParams.get('code'),
  index: searchParams.get('index'),
  factory: searchParams.get('factory')
});
```

### Check API Request

```typescript
// In api.service.ts
console.log('API Endpoint:', endpoint);
// Output: /display/tv?code=KVHB07M01&index=0
```

### Check Backend Response

```typescript
// In useProductionData.ts
console.log('Backend Response:', tvResponse);
console.log('Team Index:', tvResponse.teamIndex);
console.log('Team Name:', tvResponse.data?.to);
```

### Verify ENDLINE Sheet

Check backend logs for sheet selection:

```
⏰ Time: 09:30:00, Using ENDLINE_DAILY_DATA with range A1:AJ12
📍 HTM TV: Fetching with team filter index=0
✅ Including TS1 LINE 1 Tổ 1 (index 0 matches filter 0)
⏭️ Skipping TS1 LINE 1 Tổ 2 (index 1 !== filter 0)
```

---

## 📱 TV Display Setup

### Configuration per TV

```typescript
// TV Configuration Array
const tvConfigs = [
  { 
    id: 'TV01', 
    url: '/tv?code=KVHB07M01&index=0', 
    location: 'Line M01 - Tổ 1' 
  },
  { 
    id: 'TV02', 
    url: '/tv?code=KVHB07M01&index=1', 
    location: 'Line M01 - Tổ 2' 
  },
  { 
    id: 'TV03', 
    url: '/tv?code=KVHB07M02&index=0', 
    location: 'Line M02 - Tổ 1' 
  },
];
```

### Auto-rotation (Optional)

```typescript
// Rotate between teams every 30 seconds
const [currentIndex, setCurrentIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentIndex(prev => (prev + 1) % 3); // 0 -> 1 -> 2 -> 0
  }, 30000);
  
  return () => clearInterval(interval);
}, []);

// URL updates automatically
const url = `/tv?code=KVHB07M01&index=${currentIndex}`;
```

---

## ⚡ Performance Optimization

### 1. **Caching Strategy**

Backend caches filtered data per team:

```typescript
// Cache key includes team index
const cacheKey = `production_${factory}_team${teamIndex}`;
```

### 2. **Avoid Unnecessary Re-renders**

```typescript
// Memoize team-specific data
const teamData = useMemo(() => {
  return data?.data || null;
}, [data, index]);
```

### 3. **WebSocket Filtering**

Subscribe only to relevant team data:

```typescript
websocketService.subscribeToMaChuyenLine(
  `${maChuyenLine}_team${index}`, 
  callback
);
```

---

## ✅ Checklist

- [ ] URL parameter `index` is extracted correctly
- [ ] Component receives `index` prop
- [ ] Hook passes `index` to API service
- [ ] API service appends `&index=X` to URL
- [ ] Backend filters ENDLINE data by team
- [ ] UI displays correct team data
- [ ] Loading states show team information
- [ ] Error handling for invalid index
- [ ] WebSocket updates filtered correctly
- [ ] Cache key includes team index

---

## 🚨 Common Issues

### Issue 1: Index not filtering data
**Solution:** Check backend logs for filter application

### Issue 2: Wrong team data displayed
**Solution:** Verify index-to-team mapping (0=Tổ 1, 1=Tổ 2, 2=Tổ 3)

### Issue 3: Data not updating in real-time
**Solution:** Ensure WebSocket subscription includes index

---

## 📚 Related Documentation

- Backend: `/ENDLINE_RFT_IMPLEMENTATION.md`
- Deployment: `/DEPLOYMENT_GUIDE.md`
- API Docs: `http://localhost:3001/api/docs`

---

## 🎯 Example Deployment

### Factory TS1 - 12 Lines × 3 Teams = 36 TVs

```
TV01: /tv?code=KVHB07M01&index=0  (Line 1, Tổ 1)
TV02: /tv?code=KVHB07M01&index=1  (Line 1, Tổ 2)
TV03: /tv?code=KVHB07M01&index=2  (Line 1, Tổ 3)
TV04: /tv?code=KVHB07M02&index=0  (Line 2, Tổ 1)
...
TV36: /tv?code=KVHB07M12&index=2  (Line 12, Tổ 3)
```

Each TV displays only its team's data from ENDLINE sheets!
